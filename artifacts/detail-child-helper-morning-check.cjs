const { chromium } = require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const out = path.resolve('artifacts/detail-audit/010-child-helper-morning')
;(async () => {
  await fs.mkdir(out, { recursive: true })
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
    const page = await context.newPage()
    page.setDefaultTimeout(15000)
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('dialog', d => void d.accept())
    await page.goto('http://127.0.0.1:4190', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '새로 시작하기' }).click()
    await page.getByLabel('이름', { exact: true }).fill('도움검사')
    await page.getByRole('button', { name: '이대로 시작', exact: true }).click()
    await page.waitForFunction(() => !!window.__gd?.store)
    const labels = await page.evaluate(async () => { const { T } = await import('/src/content/text.ts'); return { sleep: T.ui.sleep, stay: T.ui.stayUp } })
    const snapshot = () => page.evaluate(async () => {
      const { childMode, childStage } = await import('/src/engine/child.ts')
      const { chestOf } = await import('/src/engine/game.ts')
      const s = window.__gd.store.getState(), g = s.game
      return { day: g.clock.day, stage: childStage(g.child, g.clock.day), mode: childMode(g.child, g.clock.day),
        water: g.inv.water ?? 0, chestWater: chestOf(g)?.water ?? null, helpDay: g.flags.childHelpDay,
        helpKind: g.flags.childHelpKind, firstHelpPending: g.flags.childFirstHelpPending, childHelping: g.flags.childHelping,
        notes: g.todayNotes.filter(x => x.startsWith('childHelp:')), strength: g.child.stats.strength,
        toast: s.toast?.text ?? null, modal: s.modal, dialog: document.querySelector('.dialog')?.innerText ?? null }
    })
    const results = []
    for (const flow of [{ name: 'bag-room', water: 98 }, { name: 'bag-full-no-chest', water: 99 },
      { name: 'bag-full-chest-room', water: 99, chest: 29 }, { name: 'both-full', water: 99, chest: 30 }]) {
      await page.evaluate(async flow => {
        const { CONTENT } = await import('/src/content/catalog.ts')
        const { legacyGame } = await import('/src/engine/growth-test-support.ts')
        const { newChild } = await import('/src/engine/child.ts')
        const base = legacyGame(CONTENT)
        const game = { ...base, homeLevel: 2, clock: { day: 51, minute: 1320 }, inv: { water: flow.water }, scenes: [],
          child: { ...newChild(10, base.stats, 'strength'), name: '루시', inherited: 30, mode: 'home' },
          flags: { ...base.flags, childWalked: 1, ...(flow.chest !== undefined ? { 'unlock:supplyChest': 1 } : {}) },
          chest: flow.chest !== undefined ? { water: flow.chest } : {} }
        window.__gd.store.getState().load(game)
        window.__gd.store.getState().setDeck(false)
        window.__gd.store.getState().setJoystick(false)
        window.__gd.store.setState({ toast: null, piecePopups: [], copyResult: null, modal: { kind: 'review', pieceId: null } })
      }, flow)
      const before = await snapshot()
      await page.getByRole('button', { name: labels.stay, exact: true }).tap()
      const canceled = await snapshot()
      assert.equal(canceled.day, 51)
      assert.equal(canceled.water, flow.water)
      await page.evaluate(() => window.__gd.store.getState().open({ kind: 'review', pieceId: null }))
      await page.getByRole('button', { name: labels.sleep, exact: true }).tap()
      const morning = await snapshot()
      assert.equal(morning.day, 52)
      assert.equal(morning.stage, 'helper')
      assert.equal(morning.mode, 'home')
      assert.equal(morning.helpKind, 3)
      assert.equal(morning.toast, '루시: 물이나 갈대를 날라 왔어요')
      const beforeTotal = before.water + (before.chestWater ?? 0), afterTotal = morning.water + (morning.chestWater ?? 0)
      const expectedGain = flow.water === 98 || flow.chest === 29 ? 1 : 0
      assert.equal(afterTotal - beforeTotal, expectedGain)
      await page.evaluate(() => window.__gd.store.getState().open({ kind: 'follow', who: 'child' }))
      await page.getByRole('button', { name: '혼자 다니게 두기', exact: true }).waitFor()
      await page.screenshot({ path: path.join(out, flow.name + '-morning.png'), fullPage: true, animations: 'disabled' })
      await page.getByRole('button', { name: '혼자 다니게 두기', exact: true }).tap()
      await page.evaluate(async () => {
        const { saveGameAsync } = await import('/src/engine/save.ts')
        if (!await saveGameAsync(window.__gd.store.getState().game)) throw new Error('save failed')
      })
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: '이어하기', exact: true }).click()
      await page.waitForFunction(() => !!window.__gd?.store)
      const restored = await snapshot()
      assert.equal(restored.mode, 'roam')
      assert.equal(restored.water + (restored.chestWater ?? 0), afterTotal)
      assert.equal(restored.helpDay, 52)
      assert.deepEqual(restored.notes, morning.notes)
      results.push({ flow, before, canceled, morning, restored, actualReceived: afterTotal - beforeTotal })
      console.log('PASS:', flow.name, 'received', afterTotal - beforeTotal, 'success toast:', morning.toast)
    }
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(out, 'result.json'), JSON.stringify({ passed: true, results, pageErrors: errors }, null, 2))
    await context.close()
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exitCode = 1 })

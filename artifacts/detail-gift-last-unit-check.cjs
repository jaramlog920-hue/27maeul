const { chromium } = require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const out = path.resolve('artifacts/detail-audit/005-gift-last-unit')
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
    await page.goto('http://127.0.0.1:4185', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '새로 시작하기' }).click()
    await page.getByLabel('이름', { exact: true }).fill('마지막선물검사')
    await page.getByRole('button', { name: '이대로 시작', exact: true }).click()
    await page.waitForFunction(() => !!window.__gd?.store)
    const seed = async inv => page.evaluate(async inv => {
      const { CONTENT } = await import('/src/content/catalog.ts')
      const { legacyGame } = await import('/src/engine/growth-test-support.ts')
      const base = legacyGame(CONTENT)
      const game = { ...base, inv, hearts: { ...base.hearts, baker: 29 }, gifted: [], scenes: [], clock: { day: 7, minute: 600 } }
      window.__gd.store.getState().load(game)
      window.__gd.store.getState().setDeck(false)
      window.__gd.store.getState().setJoystick(false)
      window.__gd.store.setState({ clockMs: 0, deck: false, joystick: false, toast: null, piecePopups: [] })
      window.__gd.store.getState().open({ kind: 'talk', neighborId: 'baker', line: '검사용 대화' })
    }, inv)
    const snapshot = () => page.evaluate(() => {
      const s = window.__gd.store.getState(), g = s.game
      const dialog = [...document.querySelectorAll('[role=dialog]')].find(d => d.classList.contains('talk'))
      const button = dialog && [...dialog.querySelectorAll('button')].find(b => b.textContent === '선물하기')
      return { inv: g.inv, gifted: g.gifted, hearts: g.hearts, stats: g.stats, giftsGot: g.giftsGot,
        rewardScenes: g.scenes.filter(x => x === 'gift:baker:3'), modal: s.modal,
        giftButton: button ? { disabled: button.disabled, title: button.getAttribute('title'), describedBy: button.getAttribute('aria-describedby') } : null,
        dialogText: dialog?.innerText ?? null }
    })
    const results = []
    for (const mode of ['last-unit-only', 'other-gift-remains']) {
      await seed(mode === 'last-unit-only' ? { grapes: 1 } : { grapes: 1, bread: 2 })
      await page.getByRole('button', { name: '선물하기', exact: true }).click()
      await page.screenshot({ path: path.join(out, `${mode}-picker.png`), fullPage: true })
      // Cancel first, verify no gift has occurred, then re-open through the talk UI.
      const beforeCancel = await snapshot()
      await page.getByRole('button', { name: /닫기/ }).click()
      const canceled = await snapshot()
      assert.deepEqual(canceled.inv, beforeCancel.inv)
      assert.deepEqual(canceled.gifted, [])
      await page.evaluate(() => window.__gd.store.getState().open({ kind: 'talk', neighborId: 'baker', line: '검사용 대화' }))
      await page.getByRole('button', { name: '선물하기', exact: true }).click()
      await page.getByRole('dialog', { name: '무엇을 줄까요?' }).getByRole('button', { name: /포도.* 1$/ }).click()
      const once = await snapshot()
      assert.equal(once.inv.grapes ?? 0, 0)
      assert.equal(once.inv.basket, 1)
      assert.equal(once.hearts.baker, 32)
      assert.deepEqual(once.gifted, ['baker'])
      assert.equal(once.rewardScenes.length, 1)
      assert.equal(once.giftButton.disabled, true)
      if (mode === 'other-gift-remains') assert.equal(once.inv.bread, 2)
      await page.screenshot({ path: path.join(out, `${mode}-after.png`), fullPage: true })
      await page.evaluate(() => {
        window.__gd.store.getState().gift('baker', 'grapes')
        window.__gd.store.getState().gift('baker', 'bread')
      })
      assert.deepEqual(await snapshot(), once)
      await page.evaluate(async () => {
        const { saveGameAsync } = await import('/src/engine/save.ts')
        if (!await saveGameAsync(window.__gd.store.getState().game)) throw new Error('save failed')
      })
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: '이어하기', exact: true }).click()
      await page.waitForFunction(() => !!window.__gd?.store)
      // Open only the talk modal, without greeting again and changing relation points.
      await page.evaluate(() => window.__gd.store.getState().open({ kind: 'talk', neighborId: 'baker', line: '검사용 대화' }))
      const restored = await snapshot()
      for (const key of ['inv', 'gifted', 'hearts', 'stats', 'giftsGot', 'rewardScenes']) assert.deepEqual(restored[key], once[key], key)
      assert.equal(restored.giftButton.disabled, true)
      await page.getByRole('button', { name: '선물하기', exact: true }).tap({ force: true })
      assert.equal((await snapshot()).modal.kind, 'talk')
      await page.screenshot({ path: path.join(out, `${mode}-restored.png`), fullPage: true })
      results.push({ mode, canceled, once, restored })
      console.log('PASS:', mode, 'cancel, last unit, reward, duplicate guard, reload, disabled UI')
    }
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(out, 'result.json'), JSON.stringify({ passed: true, results, pageErrors: errors }, null, 2))
    await context.close()
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })

const { chromium } = require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const out = path.resolve('artifacts/detail-audit/round-2-20261019/001-storage-take')
;(async () => {
  await fs.mkdir(out, { recursive: true })
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('http://127.0.0.1:4197', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '새로 시작하기' }).click()
    await page.getByLabel('이름', { exact: true }).fill('수납검사')
    await page.getByRole('button', { name: '이대로 시작', exact: true }).click()
    await page.waitForFunction(() => !!window.__gd?.store)
    await page.evaluate(async () => {
      const { CONTENT } = await import('/src/content/catalog.ts')
      const { ITEM_TEXT } = await import('/src/content/text.ts')
      const { newGame } = await import('/src/engine/game.ts')
      const { HOME_ENTRY } = await import('/src/engine/world.ts')
      const base = newGame(CONTENT)
      const inv = Object.fromEntries(Object.keys(ITEM_TEXT).filter(id => id !== 'reed').slice(0, 50).map(id => [id, 1]))
      const game = { ...base, scenes: [], inv, chest: { reed: 1 }, flags: { ...base.flags, tipNew: 0 },
        player: { ...base.player, ...HOME_ENTRY, path: [] },
        room: [...base.room, { item: 'linenCupboard', x: HOME_ENTRY.x + 1, y: HOME_ENTRY.y - 1 }] }
      window.__gd.store.getState().load(game)
      window.__gd.store.getState().setDeck(false)
      window.__gd.store.getState().setJoystick(false)
      window.__gd.store.getState().setZoom(1.25)
      window.__gd.store.setState({ modal: null, toast: null, piecePopups: [], copyResult: null, clockMs: 0 })
      window.__gd.step(0)
    })
    const touchStorage = async () => {
      const p = await page.evaluate(async () => {
        const { cameraFor, VIEW_W, VIEW_H } = await import('/src/engine/world.ts')
        window.__gd.step(0)
        const s = window.__gd.store.getState(), f = s.game.room.find(f => f.item === 'linenCupboard')
        const cam = cameraFor(s.game.player.x, s.game.player.y, s.zoom)
        const c = document.querySelector('canvas.world'), r = c.getBoundingClientRect()
        return { x: r.left + c.clientLeft + (f.x + .5 - cam.x) * s.zoom / VIEW_W * c.clientWidth,
          y: r.top + c.clientTop + (f.y + .5 - cam.y) * s.zoom / VIEW_H * c.clientHeight }
      })
      await page.touchscreen.tap(p.x, p.y)
      await page.getByRole('dialog').waitFor()
      await page.waitForTimeout(550) // canvas-to-modal ghost-click guard
    }
    const snap = () => page.evaluate(() => {
      const s = window.__gd.store.getState()
      return { inv: s.game.inv, chest: s.game.chest, modal: s.modal, toast: s.toast?.text ?? null }
    })
    await touchStorage()
    const entered = await snap()
    assert.deepEqual(entered.modal, { kind: 'storage', item: 'linenCupboard' })
    await page.getByRole('button', { name: /갈대.* 1$/ }).tap()
    await page.getByRole('button', { name: '꺼내기', exact: true }).tap()
    const blocked = await snap()
    assert.deepEqual(blocked.inv, entered.inv)
    assert.deepEqual(blocked.chest, { reed: 1 })
    assert.equal(blocked.toast, '가방에 더 들어가지 않는다.')
    await page.getByRole('status').filter({ hasText: blocked.toast }).waitFor()
    await page.waitForTimeout(250)
    const toastDisplay = await page.locator('.toast').evaluate(el => {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el)
      const x = r.left + r.width / 2, y = r.top + r.height / 2
      const front = document.elementsFromPoint(x, y).map(e => ({ tag: e.tagName, cls: e.className }))
      return { text: el.textContent, rect: { x: r.x, y: r.y, width: r.width, height: r.height },
        zIndex: style.zIndex, opacity: style.opacity, front }
    })
    await page.screenshot({ path: path.join(out, 'blocked.png'), fullPage: true, animations: 'disabled' })
    await page.getByRole('button', { name: /닫기/ }).tap()
    assert.equal((await snap()).modal, null)
    await page.evaluate(() => {
      const s = window.__gd.store.getState(), inv = { ...s.game.inv }
      delete inv[Object.keys(inv)[0]]
      window.__gd.store.setState({ game: { ...s.game, inv }, toast: null })
    })
    await touchStorage()
    await page.getByRole('button', { name: /갈대.* 1$/ }).tap()
    await page.getByRole('button', { name: '꺼내기', exact: true }).tap()
    const received = await snap()
    assert.equal(received.inv.reed, 1)
    assert.deepEqual(received.chest, {})
    assert.equal(await page.getByRole('button', { name: '꺼내기', exact: true }).count(), 0)
    await page.screenshot({ path: path.join(out, 'received.png'), fullPage: true, animations: 'disabled' })
    await page.evaluate(async () => {
      const { saveGameAsync } = await import('/src/engine/save.ts')
      if (!await saveGameAsync(window.__gd.store.getState().game)) throw new Error('save failed')
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '이어하기', exact: true }).click()
    await page.waitForFunction(() => !!window.__gd?.store)
    const restored = await snap()
    assert.equal(restored.inv.reed, 1)
    assert.deepEqual(restored.chest, {})
    await touchStorage()
    assert.equal(await page.getByRole('button', { name: '꺼내기', exact: true }).count(), 0)
    await page.screenshot({ path: path.join(out, 'reloaded.png'), fullPage: true, animations: 'disabled' })
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(out, 'results.json'), JSON.stringify({ status: 'passed', entered, blocked, toastDisplay, received, restored, errors }, null, 2))
    process.stdout.write('PASS: canvas storage entry, capacity rejection, cancel/reopen, last-unit recovery, durable save/reload; no page errors\n')
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exitCode = 1 })

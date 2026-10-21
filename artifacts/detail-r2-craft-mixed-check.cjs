const { chromium } = require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs/promises'), path = require('node:path'), assert = require('node:assert/strict')
const out = path.resolve('artifacts/detail-audit/round-2-20261019/004-craft-mixed')
;(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
    await context.route('**/src/**', route => route.fulfill({ contentType: 'text/javascript', body: 'export const {CONTENT,newGame,HOME_ENTRY,cameraFor,VIEW_W,VIEW_H,saveGameAsync}=globalThis.__auditModules;' }))
    const page = await context.newPage(), errors = []
    page.setDefaultTimeout(15000)
    page.on('pageerror', e => errors.push(e.message))
    const inject = () => page.addScriptTag({ type: 'module', url: process.env.AUDIT_STATIC_BRIDGE })
    await page.goto('http://127.0.0.1:4197/', { waitUntil: 'domcontentloaded' })
    await inject()
    await page.getByRole('button', { name: '새로 시작하기' }).click()
    await page.getByLabel('이름', { exact: true }).fill('담요검사')
    await page.getByRole('button', { name: '이대로 시작', exact: true }).click()
    await page.evaluate(() => {
      const { CONTENT, newGame, HOME_ENTRY } = window.__auditModules
      const base = newGame(CONTENT), desk = base.room.find(f => f.item === 'homeWorkbench')
      if (!desk) throw new Error('Missing installed home workbench')
      const game = { ...base, scenes: [], inv: { wool: 1, handyKit: 1 }, chest: { wool: 2 }, flags: { ...base.flags, tipNew: 0 },
        player: { ...base.player, x: desk.x, y: desk.y - 1, path: [] },
        room: [...base.room, { item: 'linenCupboard', x: HOME_ENTRY.x + 1, y: HOME_ENTRY.y - 1 }] }
      window.__gd.store.getState().load(game)
      window.__gd.store.getState().setDeck(false)
      window.__gd.store.getState().setJoystick(false)
      window.__gd.store.getState().setZoom(1.25)
      window.__gd.store.setState({ modal: null, toast: null, piecePopups: [], copyResult: null, clockMs: 0 })
    })
    const snapshot = () => page.evaluate(() => {
      const s = window.__gd.store.getState(), g = s.game
      return { inv: g.inv, chest: g.chest, clock: g.clock, modal: s.modal?.kind, toast: s.toast?.text ?? null }
    })
    const touchWorkbench = async () => {
      await page.waitForTimeout(250)
      const p = await page.evaluate(() => {
        const { cameraFor, VIEW_W, VIEW_H } = window.__auditModules
        const s = window.__gd.store.getState(), f = s.game.room.find(f => f.item === 'homeWorkbench')
        const cam = cameraFor(s.game.player.x, s.game.player.y, s.zoom), c = document.querySelector('canvas.world'), r = c.getBoundingClientRect()
        return { x: r.left + c.clientLeft + (f.x + .5 - cam.x) * s.zoom / VIEW_W * c.clientWidth,
          y: r.top + c.clientTop + (f.y + .5 - cam.y) * s.zoom / VIEW_H * c.clientHeight }
      })
      await page.touchscreen.tap(p.x, p.y)
      await page.getByRole('dialog').waitFor()
      await page.waitForTimeout(550)
    }
    await touchWorkbench()
    await page.getByRole('button', { name: /담요/ }).tap()
    const shown = await page.locator('.bag-detail .need-list').innerText()
    assert.match(shown, /1\/3/)
    assert.equal(await page.locator('.bag-detail .need-list li.short').count(), 1)
    assert.equal(await page.getByRole('button', { name: '만들기', exact: true }).isEnabled(), true)
    await page.screenshot({ path: path.join(out, 'misleading-stock.png'), fullPage: true, animations: 'disabled' })
    const before = await snapshot()
    await page.getByRole('button', { name: '만들기', exact: true }).tap()
    await page.getByRole('button', { name: '그만두기', exact: true }).tap()
    const cancelled = await snapshot()
    assert.deepEqual(cancelled.inv, before.inv); assert.deepEqual(cancelled.chest, before.chest)
    await touchWorkbench()
    await page.getByRole('button', { name: /담요/ }).tap()
    await page.getByRole('button', { name: '만들기', exact: true }).tap()
    await page.getByRole('button', { name: /연장으로 바로 끝내기/ }).tap()
    const made = await snapshot()
    assert.equal(made.inv.wool ?? 0, 0); assert.equal(made.chest.wool ?? 0, 0)
    assert.ok(made.inv.blanket >= 1)
    // Browser RAF also advances a fraction of a game minute around the modal.
    assert.ok(made.clock.minute - before.clock.minute >= 60 && made.clock.minute - before.clock.minute < 61)
    await page.evaluate(async () => { if (!await window.__auditModules.saveGameAsync(window.__gd.store.getState().game)) throw new Error('save failed') })
    await page.reload({ waitUntil: 'domcontentloaded' }); await inject()
    await page.getByRole('button', { name: '이어하기', exact: true }).click()
    const restored = await snapshot()
    assert.deepEqual(restored.inv, made.inv); assert.deepEqual(restored.chest, made.chest)
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(out, 'results.json'), JSON.stringify({ status: 'passed', shown, before, cancelled, made, restored, errors }, null, 2))
    process.stdout.write('PASS: mixed stock displayed short despite enabled make; actual cancel, kit completion and durable reload preserve exact consumption\n')
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exitCode = 1 })

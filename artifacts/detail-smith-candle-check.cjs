const { chromium } = require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const out = path.resolve('artifacts/detail-audit/013-smith-candle')
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
    await page.goto('http://127.0.0.1:4193', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.getByRole('button', { name: '새로 시작하기' }).click()
    await page.getByLabel('이름', { exact: true }).fill('촛대검사')
    await page.getByRole('button', { name: '이대로 시작', exact: true }).click()
    await page.waitForFunction(() => !!window.__gd?.store)
    await page.evaluate(async () => {
      const { CONTENT, PEOPLE } = await import('/src/content/catalog.ts')
      const { legacyGame } = await import('/src/engine/growth-test-support.ts')
      const base = legacyGame(CONTENT)
      const game = { ...base, clock: { day: 20, minute: 1320 }, scenes: [], hearts: { ...base.hearts, smith: 70 }, inv: { olive: 2, bread: 1, candle: 99 },
        life: { ...base.life, seen: [...base.life.seen, ...(PEOPLE.people.smith.events?.map(e => e.id) ?? [])] },
        flags: { ...base.flags, 'req:smith:1': 2, 'req:smith:2': 1 }, player: { ...base.player, x: 20, y: 114, path: [] } }
      window.__gd.store.getState().load(game)
      window.__gd.store.getState().setDeck(false)
      window.__gd.store.getState().setJoystick(false)
      window.__gd.store.setState({ modal: { kind: 'talk', neighborId: 'smith', line: '검사용 대화' }, toast: null, piecePopups: [], copyResult: null })
    })
    const snapshot = () => page.evaluate(async () => {
      const { lanternLights } = await import('/src/render/decor.ts')
      const s = window.__gd.store.getState(), g = s.game
      return { inv: g.inv, candles: g.room.filter(f => f.item === 'candle'), request: g.flags['req:smith:2'],
        lanternUnlock: g.flags['unlock:lanterns'] ?? 0, lanterns: lanternLights(g), toast: s.toast?.text ?? null,
        modal: s.modal, act: g.act ?? null }
    })
    const labels = await page.evaluate(async () => { const { T } = await import('/src/content/text.ts'); return { give: T.ui.talkFulfill, done: T.ui.decorateDone, full: T.ui.bagFull } })
    const before = await snapshot()
    await page.getByRole('button', { name: labels.give, exact: true }).tap()
    const blocked = await snapshot()
    assert.deepEqual(blocked.inv, before.inv)
    assert.equal(blocked.request, 1)
    assert.equal(blocked.lanternUnlock, 0)
    assert.equal(blocked.toast, labels.full)
    await page.screenshot({ path: path.join(out, 'reward-capacity-blocked.png'), fullPage: true, animations: 'disabled' })
    // Isolate a single reward candle after proving that full storage preserves the request.
    await page.evaluate(() => { const s = window.__gd.store.getState(); window.__gd.store.setState({ game: { ...s.game, inv: { olive: 2, bread: 1 } } }) })
    await page.getByRole('button', { name: labels.give, exact: true }).tap()
    const earned = await snapshot()
    assert.equal(earned.inv.candle, 1)
    assert.equal(earned.request, 2)
    assert.equal(earned.lanternUnlock, 1)
    assert.ok(earned.lanterns.length > 0)
    await page.evaluate(() => {
      const s = window.__gd.store.getState()
      window.__gd.store.setState({ game: { ...s.game, scenes: [] }, modal: null })
      window.__gd.store.getState().startDecorate('pick')
    })
    const touch = async t => {
      const p = await page.evaluate(async t => {
        const { cameraFor, VIEW_W, VIEW_H } = await import('/src/engine/world.ts')
        const s = window.__gd.store.getState()
        window.__gd.step(0)
        const cam = cameraFor(s.game.player.x, s.game.player.y, s.zoom)
        const c = document.querySelector('canvas.world'), r = c.getBoundingClientRect()
        return { x: r.left + c.clientLeft + (t.x + .5 - cam.x) * s.zoom / VIEW_W * c.clientWidth,
          y: r.top + c.clientTop + (t.y + .5 - cam.y) * s.zoom / VIEW_H * c.clientHeight }
      }, t)
      await page.touchscreen.tap(p.x, p.y)
    }
    const reload = async () => {
      await page.evaluate(async () => { const { saveGameAsync } = await import('/src/engine/save.ts'); if (!await saveGameAsync(window.__gd.store.getState().game)) throw new Error('save failed') })
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: '이어하기', exact: true }).click()
      await page.waitForFunction(() => !!window.__gd?.store)
    }
    await page.getByRole('button', { name: '촛대', exact: true }).tap()
    await touch({ x: 22, y: 112 })
    await page.getByRole('button', { name: labels.done, exact: true }).tap()
    const installed = await snapshot()
    assert.equal(installed.candles.length, 1)
    assert.equal(installed.inv.candle ?? 0, 0)
    await page.screenshot({ path: path.join(out, 'night-candle-installed.png'), fullPage: true, animations: 'disabled' })
    await touch({ x: 22, y: 112 })
    const clicked = await snapshot()
    assert.equal(clicked.modal, null)
    assert.equal(clicked.act, null)
    assert.deepEqual(clicked.inv, installed.inv)
    await reload()
    const restored = await snapshot()
    assert.deepEqual(restored.candles, installed.candles)
    assert.deepEqual(restored.lanterns, earned.lanterns)
    await page.evaluate(() => window.__gd.store.getState().startDecorate('pick'))
    await touch({ x: 22, y: 112 })
    await page.getByRole('button', { name: '옮기기', exact: true }).tap()
    await touch({ x: 22, y: 113 })
    await page.getByRole('button', { name: '치우기', exact: true }).tap()
    const collected = await snapshot()
    assert.equal(collected.inv.candle, 1)
    assert.equal(collected.candles.length, 0)
    assert.deepEqual(collected.lanterns, earned.lanterns)
    await page.getByRole('button', { name: '촛대', exact: true }).tap()
    await touch({ x: 22, y: 113 })
    await page.getByRole('button', { name: labels.done, exact: true }).tap()
    await reload()
    const reused = await snapshot()
    assert.equal(reused.candles.length, 1)
    assert.equal(reused.candles[0].y, 113)
    assert.equal(reused.inv.candle ?? 0, 0)
    assert.equal(reused.request, 2)
    // The public street lanterns are a separate permanent reward, visible without the candle nearby.
    await page.evaluate(async () => {
      const { LANTERNS } = await import('/src/render/decor.ts')
      const s = window.__gd.store.getState(), l = LANTERNS[0]
      window.__gd.store.setState({ game: { ...s.game, player: { ...s.game.player, x: l.x + 1, y: l.y + 1, path: [] } } })
      window.__gd.step(0)
    })
    await page.screenshot({ path: path.join(out, 'public-lanterns-after-candle-reuse.png'), fullPage: true, animations: 'disabled' })
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(out, 'result.json'), JSON.stringify({ passed: true, before, blocked, earned, installed, clicked, restored, collected, reused, pageErrors: errors }, null, 2))
    console.log('PASS: capacity failure, request reward, candle night display/click, move/collect/reuse, reload, independent public lantern unlock')
    await context.close()
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exitCode = 1 })

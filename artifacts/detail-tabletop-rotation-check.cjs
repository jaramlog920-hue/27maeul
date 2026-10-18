const { chromium } = require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const out = path.resolve('artifacts/detail-audit/004-tabletop-rotation')
;(async () => {
  await fs.mkdir(out, { recursive: true })
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
    const page = await context.newPage()
    page.setDefaultTimeout(15000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('dialog', dialog => void dialog.accept())
    await page.goto('http://127.0.0.1:4184', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.getByRole('button', { name: '새로 시작하기' }).click()
    await page.getByLabel('이름', { exact: true }).fill('탁자물건검사')
    await page.getByRole('button', { name: '이대로 시작', exact: true }).click()
    await page.waitForFunction(() => !!window.__gd?.store)
    const seed = async () => page.evaluate(async () => {
      const { CONTENT } = await import('/src/content/catalog.ts')
      const { legacyGame } = await import('/src/engine/growth-test-support.ts')
      const { syncHome, rotateFurniture } = await import('/src/engine/game.ts')
      const { placement } = await import('/src/engine/room.ts')
      const { saveGameAsync } = await import('/src/engine/save.ts')
      const base = legacyGame(CONTENT)
      syncHome(base)
      const table = placement(base.room, 'table', { x: 20, y: 112 }, 'down')
      if (!table) throw new Error('invalid table fixture')
      const vase = placement([...base.room, table], 'vase', table)
      const game = { ...base, room: [...base.room, table, vase], inv: { table: 1 }, scenes: [], clock: { day: 7, minute: 600 }, player: { ...base.player, x: 20, y: 114, path: [] } }
      if (!rotateFurniture({ ...game, room: game.room.filter(f => f !== vase) }, table)) throw new Error('fixture not isolated: table cannot rotate even without vase')
      window.__gd.store.getState().load(game)
      window.__gd.store.setState({ zoom: 1.25, deck: true, toast: null, decorLook: null, clockMs: 0 })
      window.__gd.store.getState().startDecorate('pick')
      window.__gd.step(0)
      if (!await saveGameAsync(game)) throw new Error('fixture not saved')
    })
    const touchTile = async tile => {
      const p = await page.evaluate(async tile => {
        const { cameraFor, VIEW_W, VIEW_H } = await import('/src/engine/world.ts')
        const state = window.__gd.store.getState()
        window.__gd.step(0)
        const cam = cameraFor(state.game.player.x, state.game.player.y, state.zoom)
        const c = document.querySelector('canvas.world'), r = c.getBoundingClientRect()
        return { x: r.left + c.clientLeft + (tile.x + .5 - cam.x) * state.zoom / VIEW_W * c.clientWidth,
          y: r.top + c.clientTop + (tile.y + .5 - cam.y) * state.zoom / VIEW_H * c.clientHeight }
      }, tile)
      await page.touchscreen.tap(p.x, p.y)
    }
    const snapshot = () => page.evaluate(() => {
      const s = window.__gd.store.getState()
      return { table: s.game.room.find(f => f.item === 'table'), vases: s.game.room.filter(f => f.item === 'vase'), inv: s.game.inv,
        selected: s.decorSel, moving: s.decorMoving, toast: s.toast?.text ?? null }
    })
    const results = []
    for (const mode of ['move-to-floor', 'collect-to-bag']) {
      await seed()
      await touchTile({ x: 21, y: 112 })
      const before = await snapshot()
      await page.getByRole('button', { name: '돌리기', exact: true }).click()
      const blocked = await snapshot()
      assert.deepEqual(blocked.table, before.table)
      assert.deepEqual(blocked.vases, before.vases)
      assert.deepEqual(blocked.inv, before.inv)
      assert.ok(blocked.toast.includes('먼저 치워'))
      await page.screenshot({ path: path.join(out, `${mode}-blocked.png`), fullPage: true })
      await touchTile({ x: 20, y: 112 })
      assert.equal((await snapshot()).selected.item, 'vase')
      if (mode === 'move-to-floor') {
        await page.getByRole('button', { name: '옮기기', exact: true }).click()
        await touchTile({ x: 22, y: 113 })
      } else {
        await page.getByRole('button', { name: '치우기', exact: true }).click()
      }
      const cleared = await snapshot()
      if (mode === 'move-to-floor') {
        assert.equal(cleared.vases.length, 1)
        assert.equal(cleared.vases[0].on, undefined)
        assert.equal(cleared.vases[0].x, 22)
        assert.equal(cleared.vases[0].y, 113)
        assert.equal(cleared.inv.vase ?? 0, 0)
      } else {
        assert.equal(cleared.vases.length, 0)
        assert.equal(cleared.inv.vase, 1)
      }
      await touchTile({ x: 21, y: 112 })
      await page.getByRole('button', { name: '돌리기', exact: true }).click()
      const turned = await snapshot()
      assert.equal(turned.table.facing, 'right')
      assert.deepEqual(turned.vases, cleared.vases)
      assert.deepEqual(turned.inv, cleared.inv)
      await page.screenshot({ path: path.join(out, `${mode}-turned.png`), fullPage: true })
      // A previous failure toast can remain briefly after success; verify it expires normally.
      await page.waitForFunction(() => window.__gd.store.getState().toast === null, null, { timeout: 4000 })
      await page.evaluate(async () => {
        const { saveGameAsync } = await import('/src/engine/save.ts')
        if (!await saveGameAsync(window.__gd.store.getState().game)) throw new Error('roundtrip save failed')
      })
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: '이어하기' }).click()
      await page.waitForFunction(() => !!window.__gd?.store)
      const restored = await snapshot()
      assert.deepEqual(restored.table, turned.table)
      assert.deepEqual(restored.vases, turned.vases)
      assert.deepEqual(restored.inv, turned.inv)
      results.push({ mode, before, blocked, cleared, turned, restored, previousFailureToastExpired: true })
      console.log('PASS:', mode, 'blocked rotation, cleared tabletop, successful retry, reload')
    }
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(out, 'result.json'), JSON.stringify({ passed: true, results, pageErrors: errors }, null, 2))
    await context.close()
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })

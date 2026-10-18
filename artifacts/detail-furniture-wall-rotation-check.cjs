const { chromium } = require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const out = path.resolve('artifacts/detail-audit/003-wall-rotation')
const origin = 'http://127.0.0.1:4183'

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
    await page.goto(origin)
    await page.getByRole('button', { name: '새로 시작하기' }).click()
    await page.getByLabel('이름', { exact: true }).fill('벽끝검사')
    await page.getByRole('button', { name: '이대로 시작', exact: true }).click()
    await page.waitForFunction(() => !!window.__gd?.store)
    const info = await page.evaluate(async () => {
      const { CONTENT } = await import('/src/content/catalog.ts')
      const { legacyGame } = await import('/src/engine/growth-test-support.ts')
      const { syncHome } = await import('/src/engine/game.ts')
      const { placement } = await import('/src/engine/room.ts')
      const { saveGameAsync } = await import('/src/engine/save.ts')
      const { itemName, T } = await import('/src/content/text.ts')
      const base = legacyGame(CONTENT)
      syncHome(base)
      const at = { x: 21, y: 114 }
      const table = placement(base.room, 'table', at, 'down')
      if (!table) throw new Error('invalid wall-edge fixture')
      const game = { ...base, scenes: [], clock: { day: 7, minute: 600 }, room: [...base.room, table],
        inv: { table: 1, vase: 3 }, player: { ...base.player, x: 20, y: 114, path: [] } }
      window.__gd.store.getState().load(game)
      window.__gd.store.setState({ zoom: 1.25, deck: true, toast: null, decorLook: null, clockMs: 0 })
      window.__gd.store.getState().startDecorate('table')
      window.__gd.store.getState().setDecorFacing('left')
      window.__gd.step(0)
      if (!await saveGameAsync(game)) throw new Error('fixture save failed')
      return { at, tableName: itemName('table'), message: T.ui.decorateTurnBlocked }
    })
    const point = () => page.evaluate(async () => {
      const { cameraFor, VIEW_W, VIEW_H } = await import('/src/engine/world.ts')
      const state = window.__gd.store.getState()
      window.__gd.step(0)
      const camera = cameraFor(state.game.player.x, state.game.player.y, state.zoom)
      const canvas = document.querySelector('canvas.world')
      const rect = canvas.getBoundingClientRect()
      return { x: rect.left + canvas.clientLeft + (21.5 - camera.x) * state.zoom / VIEW_W * canvas.clientWidth,
        y: rect.top + canvas.clientTop + (114.5 - camera.y) * state.zoom / VIEW_H * canvas.clientHeight }
    })
    const tapTable = async () => { const p = await point(); await page.touchscreen.tap(p.x, p.y) }
    const snap = () => page.evaluate(async () => {
      const state = window.__gd.store.getState()
      const { gameStorage, getGameStorageStatus } = await import('/src/engine/game-storage.ts')
      const { slotKey, activeSlot } = await import('/src/engine/save.ts')
      return { tables: state.game.room.filter(f => f.item === 'table'), inv: state.game.inv, selected: state.decorSel,
        held: state.decorating, heldFacing: state.decorFacing, toast: state.toast?.text ?? null,
        serialized: gameStorage().getItem(slotKey(activeSlot())), status: getGameStorageStatus().state }
    })
    await tapTable()
    await page.getByRole('button', { name: '돌리기', exact: true }).waitFor()
    const before = await snap()
    await page.getByRole('button', { name: '돌리기', exact: true }).click()
    await page.getByRole('status').filter({ hasText: info.message }).waitFor()
    const failed = await snap()
    assert.deepEqual(failed.tables, before.tables)
    assert.deepEqual(failed.inv, before.inv)
    assert.deepEqual(failed.selected, before.selected)
    assert.equal(failed.heldFacing, 'left')
    assert.equal(failed.serialized, before.serialized)
    await page.screenshot({ path: path.join(out, 'mobile-rejected.png'), fullPage: true })
    await page.getByRole('button', { name: '돌리기', exact: true }).click()
    const repeated = await snap()
    assert.deepEqual(repeated.tables, before.tables)

    await page.reload()
    await page.getByRole('button', { name: '이어하기' }).click()
    await page.waitForFunction(() => !!window.__gd?.store)
    await page.evaluate(() => {
      const store = window.__gd.store
      store.setState({ toast: null })
      store.getState().startDecorate('pick')
      window.__gd.step(0)
    })
    await tapTable()
    await page.getByRole('button', { name: '돌리기', exact: true }).click()
    const restoredFailure = await snap()
    assert.deepEqual(restoredFailure.tables, before.tables)
    assert.deepEqual(restoredFailure.inv, before.inv)
    assert.equal(restoredFailure.toast, info.message)

    // Verify an ordinary UI workaround rather than forcing the furniture's direction in state.
    await page.getByRole('button', { name: '치우기', exact: true }).click()
    const collected = await snap()
    assert.equal(collected.tables.length, 0)
    assert.equal(collected.inv.table, 2)
    await page.getByRole('toolbar').getByRole('button', { name: info.tableName, exact: true }).click()
    await page.getByRole('group', { name: '설치할 가구 방향' }).getByRole('button', { name: '위', exact: true }).click()
    await tapTable()
    const reinstalled = await snap()
    assert.equal(reinstalled.tables.length, 1)
    assert.equal(reinstalled.tables[0].facing, 'up')
    assert.equal(reinstalled.tables[0].x, 21)
    assert.equal(reinstalled.tables[0].y, 114)
    assert.equal(reinstalled.inv.table, 1)
    await page.screenshot({ path: path.join(out, 'mobile-reinstalled-up.png'), fullPage: true })
    assert.deepEqual(errors, [])
    const compact = record => { const { serialized, ...rest } = record; return { ...rest, serializedBytes: serialized?.length } }
    await fs.writeFile(path.join(out, 'result.json'), JSON.stringify({ passed: true, before: compact(before), failed: compact(failed), repeated: compact(repeated), restoredFailure: compact(restoredFailure), collected: compact(collected), reinstalled: compact(reinstalled), pageErrors: errors }, null, 2))
    console.log('PASS: mobile rejected rotation preserves state/save, repeat rejects, reload consistent, UI pickup + 180-degree reinstall works')
    await context.close()
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })

const { chromium } = require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const out = path.resolve('artifacts/detail-audit/009-smith-barrel-finish')
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
    await page.goto('http://127.0.0.1:4189', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '새로 시작하기' }).click()
    await page.getByLabel('이름', { exact: true }).fill('나무통마감검사')
    await page.getByRole('button', { name: '이대로 시작', exact: true }).click()
    await page.waitForFunction(() => !!window.__gd?.store)
    await page.evaluate(async () => {
      const { CONTENT } = await import('/src/content/catalog.ts')
      const { legacyGame } = await import('/src/engine/growth-test-support.ts')
      const base = legacyGame(CONTENT)
      const game = { ...base, clock: { day: 20, minute: 600 }, scenes: [], inv: { barrel: 1 },
        skills: { hookFinish: { day: 2, from: 'smith', picked: 'copper' } }, flags: { ...base.flags, 'skillFinish:barrel': 1 },
        player: { ...base.player, x: 20, y: 114, path: [], facing: 'down' } }
      window.__gd.store.getState().load(game)
      window.__gd.store.getState().setDeck(false)
      window.__gd.store.getState().setJoystick(false)
      window.__gd.store.getState().setZoom(1.25)
      window.__gd.store.setState({ zoom: 1.25, clockMs: 0, toast: null, piecePopups: [], copyResult: null })
      window.__gd.store.getState().open({ kind: 'menu', place: 'workbench' })
    })
    const labels = await page.evaluate(async () => {
      const { T } = await import('/src/content/text.ts')
      return { copper: T.skill.lessons.hookFinish.styles.copper, iron: T.skill.lessons.hookFinish.styles.iron, done: T.ui.decorateDone }
    })
    const snapshot = () => page.evaluate(() => {
      const s = window.__gd.store.getState(), g = s.game
      return { inv: g.inv, barrels: g.room.filter(f => f.item === 'barrel'), style: g.flags['skillFinish:barrel'],
        skills: g.skills, modal: s.modal, act: g.act ?? null, stats: g.stats, coins: g.coins }
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
    const pixels = async () => {
      await page.evaluate(() => window.__gd.step(0))
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      return page.evaluate(async () => {
        const { cameraFor, TILE, VIEW_W } = await import('/src/engine/world.ts')
        const s = window.__gd.store.getState(), c = document.querySelector('canvas.world')
        const cam = cameraFor(s.game.player.x, s.game.player.y, s.zoom)
        const scale = c.width / (VIEW_W * TILE)
        const x = Math.round((20 - cam.x) * s.zoom * TILE * scale), y = Math.round((112 - cam.y) * s.zoom * TILE * scale)
        return Array.from(c.getContext('2d').getImageData(x, y, Math.round(TILE * s.zoom * scale), Math.round(TILE * s.zoom * scale)).data)
      })
    }
    const shot = name => page.screenshot({ path: path.join(out, name + '.png'), fullPage: true, animations: 'disabled' })
    const reload = async () => {
      await page.evaluate(async () => {
        const { saveGameAsync } = await import('/src/engine/save.ts')
        if (!await saveGameAsync(window.__gd.store.getState().game)) throw new Error('save failed')
      })
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: '이어하기', exact: true }).click()
      await page.waitForFunction(() => !!window.__gd?.store)
    }
    const before = await snapshot()
    await page.getByRole('button', { name: labels.copper, exact: true }).tap()
    const selected = await snapshot()
    assert.equal(selected.style, 2)
    assert.deepEqual(selected.inv, before.inv)
    await shot('workbench-copper-choice')
    await page.getByRole('button', { name: /닫기/ }).tap()
    await page.evaluate(() => window.__gd.store.getState().startDecorate('pick'))
    await page.getByRole('button', { name: '나무통', exact: true }).tap()
    await touch({ x: 20, y: 112 })
    await page.getByRole('button', { name: labels.done, exact: true }).tap()
    const copperPlaced = await snapshot(), copperPixels = await pixels()
    assert.equal(copperPlaced.barrels[0].finish, 'copper')
    await shot('copper-installed')
    await touch({ x: 20, y: 112 })
    const actualClick = await snapshot()
    assert.equal(actualClick.modal, null)
    assert.equal(actualClick.act, null)
    assert.deepEqual(actualClick.inv, copperPlaced.inv)
    await reload()
    const restored = await snapshot()
    assert.deepEqual(restored.barrels, copperPlaced.barrels)
    assert.equal(restored.style, 2)
    await page.evaluate(() => window.__gd.store.getState().startDecorate('pick'))
    await touch({ x: 20, y: 112 })
    await page.getByRole('button', { name: '돌리기', exact: true }).tap()
    const turned = await snapshot()
    assert.equal(turned.barrels[0].facing, 'right')
    assert.equal(turned.barrels[0].finish, 'copper')
    await page.getByRole('button', { name: '옮기기', exact: true }).tap()
    await touch({ x: 22, y: 113 })
    const moved = await snapshot()
    assert.equal(moved.barrels[0].x, 22)
    assert.equal(moved.barrels[0].finish, 'copper')
    await page.getByRole('button', { name: '치우기', exact: true }).tap()
    assert.equal((await snapshot()).inv.barrel, 1)
    await page.getByRole('button', { name: labels.done, exact: true }).tap()
    await page.evaluate(() => window.__gd.store.getState().open({ kind: 'menu', place: 'workbench' }))
    // A prior canvas tap suppresses clicks inside a newly opened modal for 450 ms.
    await page.waitForTimeout(550)
    await page.getByRole('button', { name: labels.iron, exact: true }).tap()
    assert.equal((await snapshot()).style, 1)
    await page.getByRole('button', { name: /닫기/ }).tap()
    await page.evaluate(() => window.__gd.store.getState().startDecorate('pick'))
    await page.getByRole('button', { name: '나무통', exact: true }).tap()
    await touch({ x: 20, y: 112 })
    await page.getByRole('button', { name: labels.done, exact: true }).tap()
    const ironPlaced = await snapshot(), ironPixels = await pixels()
    assert.equal(ironPlaced.barrels[0].finish, undefined)
    let differingPixels = 0
    for (let i = 0; i < copperPixels.length; i += 4) if (copperPixels.slice(i, i + 4).some((v, j) => v !== ironPixels[i + j])) differingPixels++
    assert.ok(differingPixels > 0, 'actual barrel canvas pixels should change between copper and original')
    await shot('original-reinstalled')
    await reload()
    const final = await snapshot()
    assert.deepEqual(final.barrels, ironPlaced.barrels)
    assert.equal(final.style, 1)
    assert.equal(final.inv.barrel ?? 0, 0)
    assert.deepEqual(final.stats, before.stats)
    assert.equal(final.coins, before.coins)
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(out, 'result.json'), JSON.stringify({ passed: true, before, selected, copperPlaced, actualClick, restored, turned, moved, ironPlaced, final,
      actualCanvasDifferingPixels: differingPixels, pageErrors: errors }, null, 2))
    console.log('PASS: workbench styles, installation, actual passive click, reload, rotation, move, collect, original reinstall, canvas difference', differingPixels)
    await context.close()
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exitCode = 1 })

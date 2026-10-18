const { chromium } = require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const out = path.resolve('artifacts/detail-audit/007-child-first-walk')
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
    await page.goto('http://127.0.0.1:4187', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '새로 시작하기' }).click()
    await page.getByLabel('이름', { exact: true }).fill('첫걸음검사')
    await page.getByRole('button', { name: '이대로 시작', exact: true }).click()
    await page.waitForFunction(() => !!window.__gd?.store)
    await page.evaluate(async () => {
      const { CONTENT } = await import('/src/content/catalog.ts')
      const { legacyGame } = await import('/src/engine/growth-test-support.ts')
      const { syncHome } = await import('/src/engine/game.ts')
      const { CRADLE_SPOT, newChild } = await import('/src/engine/child.ts')
      const { placement } = await import('/src/engine/room.ts')
      const base = legacyGame(CONTENT)
      const stats = { ...base.stats, wit: { level: 3, xp: 10, born: 0 } }
      const game = { ...base, stats, homeLevel: 2, clock: { day: 23, minute: 1320 }, scenes: [],
        child: { ...newChild(10, stats, 'hand'), name: '루시', close: 10 },
        romance: { ...base.romance, stage: 'married', partner: 'poppy', marriedDay: 1 } }
      syncHome(game)
      const crib = placement(game.room, 'homeCradle', CRADLE_SPOT)
      if (!crib) throw new Error('invalid crib fixture')
      const ready = { ...game, room: [...game.room, crib], player: { ...game.player, x: crib.x + 1, y: crib.y, path: [] } }
      window.__gd.store.getState().load(ready)
      window.__gd.store.getState().setDeck(false)
      window.__gd.store.getState().setJoystick(false)
      window.__gd.store.setState({ zoom: 1.25, clockMs: 0, toast: null, piecePopups: [], copyResult: null })
      window.__gd.step(0)
    })
    const snapshot = () => page.evaluate(async () => {
      const { childMode, childStage } = await import('/src/engine/child.ts')
      const { childTile } = await import('/src/engine/game.ts')
      const s = window.__gd.store.getState(), g = s.game
      return { clock: g.clock, child: g.child, mode: childMode(g.child, g.clock.day), stage: childStage(g.child, g.clock.day),
        at: childTile(g), player: g.player, modal: s.modal, childWalked: g.flags.childWalked,
        walksQueued: g.scenes.filter(x => x === 'childWalks').length, walksAlbum: g.album.filter(x => x.id === 'childWalks').length,
        kidActs: g.flags.kidActs ?? 0, text: document.querySelector('.dialog')?.innerText ?? '' }
    })
    const tapChild = async () => {
      const p = await page.evaluate(async () => {
        const { childTile } = await import('/src/engine/game.ts')
        const { cameraFor, VIEW_W, VIEW_H } = await import('/src/engine/world.ts')
        const s = window.__gd.store.getState(), t = childTile(s.game)
        window.__gd.step(0)
        const cam = cameraFor(s.game.player.x, s.game.player.y, s.zoom)
        const c = document.querySelector('canvas.world'), r = c.getBoundingClientRect()
        return { x: r.left + c.clientLeft + (t.x + .5 - cam.x) * s.zoom / VIEW_W * c.clientWidth,
          y: r.top + c.clientTop + (t.y + .5 - cam.y) * s.zoom / VIEW_H * c.clientHeight }
      })
      await page.touchscreen.tap(p.x, p.y)
      await page.getByRole('dialog', { name: '루시', exact: true }).waitFor()
      // The canvas deliberately suppresses clicks for 450 ms after opening a modal.
      await page.waitForTimeout(550)
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
    await tapChild()
    const baby = await snapshot()
    assert.equal(baby.stage, 'baby')
    assert.equal(baby.mode, 'cradle')
    assert.ok(baby.text.includes('요람에서'))
    await shot('before-growth-cradle')
    await page.getByRole('button', { name: '안아 주기', exact: true }).tap()
    const cared = await snapshot()
    assert.equal(cared.child.close, 12)
    assert.equal(cared.child.cared, 1)
    await page.evaluate(() => window.__gd.store.getState().open({ kind: 'review', pieceId: null }))
    const labels = await page.evaluate(async () => { const { T } = await import('/src/content/text.ts'); return { stay: T.ui.stayUp, sleep: T.ui.sleep, together: T.family.time.open } })
    await page.getByRole('button', { name: labels.stay, exact: true }).tap()
    assert.equal((await snapshot()).stage, 'baby')
    await page.evaluate(() => window.__gd.store.getState().open({ kind: 'review', pieceId: null }))
    await page.getByRole('button', { name: labels.sleep, exact: true }).tap()
    await page.waitForFunction(() => window.__gd.store.getState().game.clock.day === 24)
    const morning = await snapshot()
    assert.equal(morning.stage, 'toddler')
    assert.equal(morning.mode, 'follow')
    assert.equal(morning.childWalked, 1)
    assert.ok(morning.child.inherited >= 20 && morning.child.inherited <= 50)
    // Show the actual queued growth scene; other morning scenes stay outside this boundary.
    await page.evaluate(() => window.__gd.store.getState().open({ kind: 'scene', id: 'childWalks' }))
    await page.getByRole('dialog', { name: '아기의 첫걸음', exact: true }).waitFor()
    await shot('first-walk-scene')
    await page.getByRole('button', { name: /마을로 돌아가기/ }).tap()
    // Put the player on an open room tile so the following child can be tapped away from bed fixtures.
    await page.evaluate(() => {
      const s = window.__gd.store.getState()
      window.__gd.store.setState({ game: { ...s.game, player: { ...s.game.player, x: 20, y: 113, facing: 'down', path: [] } } })
      window.__gd.store.getState().open({ kind: 'follow', who: 'child' })
    })
    const grown = await snapshot()
    assert.ok(grown.text.includes('지금은 곁을 따라다녀요.'))
    assert.ok(!grown.text.includes('요람에서 새근새근'))
    assert.equal(await page.getByRole('button', { name: '혼자 다니게 두기', exact: true }).count(), 0)
    await shot('after-growth-follow')
    await page.getByRole('button', { name: '집에 두기', exact: true }).tap()
    await reload()
    const home = await snapshot()
    assert.equal(home.mode, 'home')
    assert.deepEqual(home.child.stats, grown.child.stats)
    assert.equal(home.child.inherited, grown.child.inherited)
    assert.equal(home.walksAlbum, 1)
    assert.equal(home.walksQueued, 0)
    await page.evaluate(() => window.__gd.store.getState().open({ kind: 'follow', who: 'child' }))
    await page.getByRole('button', { name: '데리고 다니기', exact: true }).tap()
    // This step uses the canvas input path rather than opening the modal directly.
    await tapChild()
    await page.getByRole('button', { name: labels.together, exact: true }).tap()
    const actLabel = await page.evaluate(async () => (await import('/src/content/text.ts')).T.family.time.acts.read.label)
    await page.getByRole('button', { name: new RegExp(actLabel) }).tap()
    const played = await snapshot()
    assert.equal(played.kidActs, 1)
    assert.equal(played.child.close, 15)
    assert.notDeepEqual(played.child.stats.wit, grown.child.stats.wit)
    await shot('first-activity-result')
    await reload()
    const restored = await snapshot()
    assert.equal(restored.mode, 'follow')
    assert.equal(restored.child.close, 15)
    assert.equal(restored.child.inherited, grown.child.inherited)
    assert.equal(restored.walksAlbum, 1)
    assert.equal(restored.kidActs, 1)
    assert.deepEqual(restored.child.stats, played.child.stats)
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(out, 'result.json'), JSON.stringify({ passed: true, baby, cared, morning, grown, home, played, restored, pageErrors: errors }, null, 2))
    console.log('PASS: cradle pointer, care, sleep cancel, first walk, scene, home reload, follow pointer, activity, final reload')
    await context.close()
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exitCode = 1 })

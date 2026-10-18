const { chromium } = require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const out = path.resolve('artifacts/detail-audit/012-child-adult-school')
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
    await page.goto('http://127.0.0.1:4192', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.getByRole('button', { name: '새로 시작하기' }).click()
    await page.getByLabel('이름', { exact: true }).fill('배움터검사')
    await page.getByRole('button', { name: '이대로 시작', exact: true }).click()
    await page.waitForFunction(() => !!window.__gd?.store)
    await page.evaluate(async () => {
      const { CONTENT } = await import('/src/content/catalog.ts')
      const { legacyGame } = await import('/src/engine/growth-test-support.ts')
      const { newChild } = await import('/src/engine/child.ts')
      const { PLACES } = await import('/src/engine/world.ts')
      const base = legacyGame(CONTENT)
      const game = { ...base, homeLevel: 2, clock: { day: 93, minute: 600 }, coins: 100, scenes: [],
        child: { ...newChild(10, base.stats, 'hand'), name: '루시', inherited: 30, mode: 'home' },
        flags: { ...base.flags, childWalked: 1, childHelping: 1, childFirstHelpScene: 1 },
        player: { ...base.player, ...PLACES.learnTable.stand, path: [] } }
      window.__gd.store.getState().load(game)
      window.__gd.store.getState().setDeck(false)
      window.__gd.store.getState().setJoystick(false)
      window.__gd.store.setState({ modal: null, toast: null, piecePopups: [], copyResult: null })
      window.__gd.step(0)
    })
    const snapshot = () => page.evaluate(async () => {
      const { childStage } = await import('/src/engine/child.ts')
      const { childAtSchool, childTile, canSchool } = await import('/src/engine/game.ts')
      const { canKidAct } = await import('/src/engine/family.ts')
      const s = window.__gd.store.getState(), g = s.game
      return { day: g.clock.day, stage: childStage(g.child, g.clock.day), job: g.child.job ?? null, confirmed: g.child.jobConfirmed ?? null,
        schoolDay: g.flags.schoolDay ?? null, atSchool: childAtSchool(g), childAt: childTile(g), coins: g.coins,
        wit: g.child.stats.wit, canSchool: canSchool(g), canRead: canKidAct(g, 'read'), modal: s.modal }
    })
    const enterSchool = async () => {
      const p = await page.evaluate(async () => {
        const { cameraFor, VIEW_W, VIEW_H } = await import('/src/engine/world.ts')
        const s = window.__gd.store.getState()
        window.__gd.step(0)
        const cam = cameraFor(s.game.player.x, s.game.player.y, s.zoom)
        const c = document.querySelector('canvas.world'), r = c.getBoundingClientRect()
        return { x: r.left + c.clientLeft + (20.5 - cam.x) * s.zoom / VIEW_W * c.clientWidth,
          y: r.top + c.clientTop + (44.5 - cam.y) * s.zoom / VIEW_H * c.clientHeight }
      })
      await page.touchscreen.tap(p.x, p.y)
      await page.getByRole('dialog', { name: '배움터', exact: true }).waitFor()
      await page.waitForTimeout(550)
    }
    const before = await snapshot()
    await enterSchool()
    await page.getByRole('button', { name: '맡기기', exact: true }).first().tap()
    const helperEnrolled = await snapshot()
    assert.equal(helperEnrolled.coins, 85)
    assert.equal(helperEnrolled.atSchool, true)
    await page.evaluate(() => {
      const s = window.__gd.store.getState()
      window.__gd.store.setState({ game: { ...s.game, clock: { day: 93, minute: 1320 } }, modal: { kind: 'review', pieceId: null } })
    })
    const sleep = await page.evaluate(async () => (await import('/src/content/text.ts')).T.ui.sleep)
    await page.getByRole('button', { name: sleep, exact: true }).tap()
    const grown = await snapshot()
    assert.equal(grown.stage, 'adult')
    assert.equal(grown.day, 94)
    assert.equal(grown.schoolDay, 93)
    assert.equal(grown.atSchool, false)
    assert.equal(grown.coins, 85)
    assert.deepEqual(grown.wit, helperEnrolled.wit)
    assert.equal(grown.canRead, 'grown')
    await page.evaluate(async () => {
      const { PLACES } = await import('/src/engine/world.ts')
      const s = window.__gd.store.getState()
      // Isolate the school entry from queued adult-growth scenes and travel.
      window.__gd.store.setState({ game: { ...s.game, scenes: [], flags: { ...s.game.flags, tipNew: 0 }, player: { ...s.game.player, ...PLACES.learnTable.stand, path: [] } }, modal: null })
    })
    await enterSchool()
    const adultButtonsEnabled = await page.getByRole('button', { name: '맡기기', exact: true }).evaluateAll(buttons => buttons.every(b => !b.disabled))
    assert.equal(adultButtonsEnabled, true)
    await page.screenshot({ path: path.join(out, 'adult-school-offer-known-behavior.png'), fullPage: true, animations: 'disabled' })
    await page.getByRole('button', { name: '맡기기', exact: true }).first().tap()
    const adultEnrolled = await snapshot()
    assert.equal(adultEnrolled.coins, 70)
    assert.equal(adultEnrolled.atSchool, true)
    assert.equal(adultEnrolled.schoolDay, 94)
    assert.notDeepEqual(adultEnrolled.wit, grown.wit)
    await enterSchool()
    const allDisabled = await page.getByRole('button', { name: '맡기기', exact: true }).evaluateAll(buttons => buttons.every(b => b.disabled))
    assert.equal(allDisabled, true)
    await page.getByText('오늘은 이미 맡겼어요.', { exact: true }).waitFor()
    await page.evaluate(async () => {
      const { saveGameAsync } = await import('/src/engine/save.ts')
      if (!await saveGameAsync(window.__gd.store.getState().game)) throw new Error('save failed')
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '이어하기', exact: true }).click()
    await page.waitForFunction(() => !!window.__gd?.store)
    const restored = await snapshot()
    for (const key of ['schoolDay', 'coins', 'stage', 'job', 'confirmed', 'wit', 'atSchool', 'childAt']) assert.deepEqual(restored[key], adultEnrolled[key])
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(out, 'result.json'), JSON.stringify({ passed: true, knownIssueOnly: true, before, helperEnrolled, grown, adultButtonsEnabled, adultEnrolled, restored, pageErrors: errors }, null, 2))
    console.log('PASS: prior school day cleared, grown action blocked, known adult-school behavior confirmed, duplicate guard and reload consistent')
    await context.close()
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exitCode = 1 })

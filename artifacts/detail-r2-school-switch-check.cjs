const { chromium } = require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs/promises'), path = require('node:path'), assert = require('node:assert/strict')
const out = path.resolve('artifacts/detail-audit/round-2-20261019/005-school-switch')
;(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
    const page = await context.newPage(), errors = []
    page.setDefaultTimeout(15000)
    page.on('pageerror', e => errors.push(e.message))
    const inject = () => page.addScriptTag({ type: 'module', url: process.env.AUDIT_STATIC_BRIDGE })
    await page.goto('http://127.0.0.1:4197/', { waitUntil: 'domcontentloaded' }); await inject()
    await page.getByRole('button', { name: '새로 시작하기' }).click()
    await page.getByLabel('이름', { exact: true }).fill('배움검사')
    await page.getByRole('button', { name: '이대로 시작', exact: true }).click()
    await page.evaluate(() => {
      const { CONTENT, newGame, newChild, PLACES } = window.__auditModules
      const base = newGame(CONTENT)
      const game = { ...base, scenes: [], clock: { day: 100, minute: 600 }, coins: 100,
        child: { ...newChild(40, base.stats, undefined), name: '가람' },
        siblings: [{ ...newChild(50, base.stats, undefined), name: '나래' }],
        flags: { ...base.flags, growthLegacy: 1, schoolDay: 100, tipNew: 0 },
        player: { ...base.player, ...PLACES.learnTable.stand, path: [] } }
      window.__gd.store.getState().load(game)
      window.__gd.store.getState().setDeck(false)
      window.__gd.store.getState().setJoystick(false)
      window.__gd.store.getState().setZoom(1.25)
      window.__gd.store.setState({ modal: null, toast: null, piecePopups: [], copyResult: null, clockMs: 0 })
    })
    const snap = () => page.evaluate(() => {
      const s = window.__gd.store.getState(), g = s.game
      return { coins: g.coins, child: g.child, siblings: g.siblings, schoolDay: g.flags.schoolDay ?? null, modal: s.modal, day: g.clock.day }
    })
    const school = async () => {
      await page.waitForTimeout(250)
      const p = await page.evaluate(() => {
        const { PLACES, cameraFor, VIEW_W, VIEW_H } = window.__auditModules
        const s = window.__gd.store.getState(), f = PLACES.learnTable.tiles[0]
        const cam = cameraFor(s.game.player.x, s.game.player.y, s.zoom), c = document.querySelector('canvas.world'), r = c.getBoundingClientRect()
        return { x: r.left + c.clientLeft + (f.x + .5 - cam.x) * s.zoom / VIEW_W * c.clientWidth,
          y: r.top + c.clientTop + (f.y + .5 - cam.y) * s.zoom / VIEW_H * c.clientHeight }
      })
      await page.touchscreen.tap(p.x, p.y)
      await page.getByRole('dialog', { name: '배움터', exact: true }).waitFor()
      await page.waitForTimeout(550)
    }
    const disabled = async expected => {
      const buttons = page.getByRole('button', { name: '맡기기', exact: true })
      assert.equal(await buttons.count(), 5)
      for (const button of await buttons.all()) assert.equal(await button.isDisabled(), expected)
    }
    const close = () => page.getByRole('button', { name: /닫기/ }).tap()
    const switchKid = async name => {
      await page.getByRole('button', { name: '가족', exact: true }).tap()
      await page.getByRole('button', { name: new RegExp('^' + name + ' ') }).tap()
      await close()
    }
    await school(); await disabled(true)
    assert.equal(await page.getByRole('button', { name: /^나래 / }).count(), 0)
    assert.ok((await page.getByRole('dialog').innerText()).includes('가람'))
    await page.screenshot({ path: path.join(out, 'first-already-enrolled.png'), fullPage: true, animations: 'disabled' })
    await close(); await switchKid('나래'); await school(); await disabled(false)
    const switched = await snap()
    assert.equal(switched.child.born, 50); assert.equal(switched.schoolDay, null); assert.equal(switched.coins, 100)
    assert.ok((await page.getByRole('dialog').innerText()).includes('나래'))
    await page.screenshot({ path: path.join(out, 'second-eligible.png'), fullPage: true, animations: 'disabled' })
    await page.getByRole('button', { name: '맡기기', exact: true }).first().tap()
    const paid = await snap()
    assert.equal(paid.coins, 85); assert.equal(paid.schoolDay, 100)
    assert.ok(paid.child.stats.wit.xp > switched.child.stats.wit.xp)
    assert.deepEqual(paid.siblings.find(k => k.born === 40).stats, switched.siblings.find(k => k.born === 40).stats)
    await school(); await disabled(true); await close()
    await switchKid('가람'); await school(); await disabled(true)
    const firstAgain = await snap()
    assert.equal(firstAgain.schoolDay, 100); assert.equal(firstAgain.coins, 85)
    await page.evaluate(async () => { if (!await window.__auditModules.saveGameAsync(window.__gd.store.getState().game)) throw new Error('save failed') })
    await page.reload({ waitUntil: 'domcontentloaded' }); await inject()
    await page.getByRole('button', { name: '이어하기', exact: true }).click()
    await school(); await disabled(true)
    const restored = await snap()
    assert.equal(restored.child.born, 40); assert.equal(restored.schoolDay, 100); assert.equal(restored.coins, 85)
    assert.equal(restored.siblings.find(k => k.born === 50).kidFlags.schoolDay, 100)
    await page.screenshot({ path: path.join(out, 'restored-first.png'), fullPage: true, animations: 'disabled' })
    await close(); await switchKid('나래'); await school(); await disabled(true)
    const restoredSecond = await snap()
    assert.equal(restoredSecond.schoolDay, 100); assert.equal(restoredSecond.coins, 85)
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(out, 'results.json'), JSON.stringify({ status: 'passed', switched, paid, firstAgain, restored, restoredSecond, errors }, null, 2))
    process.stdout.write('PASS: actual school close/family switch/reopen, per-child attendance, one fee, correct XP target and durable reload\n')
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exitCode = 1 })

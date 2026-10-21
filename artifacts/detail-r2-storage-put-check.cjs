const { chromium } = require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const out = path.resolve('artifacts/detail-audit/round-2-20261019/002-storage-put')
;(async () => {
  await fs.mkdir(out, { recursive: true })
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    // Isolate optional remote fonts from the local storage flow under test.
    await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
    if (process.env.AUDIT_STATIC_BRIDGE) {
      await context.route('**/src/**', route => route.fulfill({ contentType: 'text/javascript', body: 'export const {CONTENT,newGame,HOME_ENTRY,cameraFor,VIEW_W,VIEW_H,saveGameAsync}=globalThis.__auditModules;' }))
    }
    const page = await context.newPage(), errors = []
    const network = []
    page.on('request', r => network.push({ event: 'request', url: r.url() }))
    page.on('response', r => network.push({ event: 'response', status: r.status(), url: r.url() }))
    page.on('console', m => { if (m.type() === 'error') network.push({ event: 'console-error', text: m.text() }) })
    page.setDefaultTimeout(20000)
    page.on('requestfailed', r => process.stdout.write('REQUEST FAILED ' + r.url() + ' ' + JSON.stringify(r.failure()) + '\n'))
    page.on('response', r => { if (r.url().includes('127.0.0.1') && (r.request().isNavigationRequest() || r.status() >= 400)) process.stdout.write('RESPONSE ' + r.status() + ' ' + r.url() + '\n') })
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('http://127.0.0.1:4197', { waitUntil: 'commit', timeout: 20000 })
    process.stdout.write('Navigation committed\n')
    if (process.env.AUDIT_STATIC_BRIDGE) await page.addScriptTag({ type: 'module', url: process.env.AUDIT_STATIC_BRIDGE })
    if (process.env.AUDIT_BOOT_PROBE === '1') {
      await page.waitForTimeout(15000)
      const boot = await page.evaluate(() => ({ readyState: document.readyState, text: document.body.innerText, html: document.body.innerHTML.slice(0, 12000) }))
      await fs.writeFile(path.join(out, 'boot-probe.json'), JSON.stringify({ boot, network, errors }, null, 2))
      await page.screenshot({ path: path.join(out, 'boot-probe.png'), fullPage: true })
      process.stdout.write('Boot probe recorded; no game actions executed\n')
      return
    }
    await page.getByRole('button', { name: '새로 시작하기' }).click()
    await page.getByLabel('이름', { exact: true }).fill('넣기검사')
    await page.getByRole('button', { name: '이대로 시작', exact: true }).click()
    await page.waitForFunction(() => !!window.__gd?.store)
    await page.evaluate(async () => {
      const { CONTENT } = await import('/src/content/catalog.ts')
      const { newGame } = await import('/src/engine/game.ts')
      const { HOME_ENTRY } = await import('/src/engine/world.ts')
      const base = newGame(CONTENT)
      const game = { ...base, scenes: [], inv: { reed: 2 }, chest: { reed: 29 }, flags: { ...base.flags, tipNew: 0 },
        player: { ...base.player, ...HOME_ENTRY, path: [] },
        room: [...base.room, { item: 'linenCupboard', x: HOME_ENTRY.x + 1, y: HOME_ENTRY.y - 1 }] }
      window.__gd.store.getState().load(game)
      window.__gd.store.getState().setDeck(false)
      window.__gd.store.getState().setJoystick(false)
      window.__gd.store.getState().setZoom(1.25)
      window.__gd.store.setState({ modal: null, toast: null, piecePopups: [], copyResult: null, clockMs: 0 })
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
      await page.waitForTimeout(550)
    }
    const snap = () => page.evaluate(() => {
      const s = window.__gd.store.getState()
      return { inv: s.game.inv, chest: s.game.chest, modal: s.modal, toast: s.toast?.text ?? null }
    })
    const saveReload = async () => {
      await page.evaluate(async () => {
        const { saveGameAsync } = await import('/src/engine/save.ts')
        if (!await saveGameAsync(window.__gd.store.getState().game)) throw new Error('save failed')
      })
      await page.reload({ waitUntil: 'domcontentloaded' })
      if (process.env.AUDIT_STATIC_BRIDGE) await page.addScriptTag({ type: 'module', url: process.env.AUDIT_STATIC_BRIDGE })
      await page.getByRole('button', { name: '이어하기', exact: true }).click()
      await page.waitForFunction(() => !!window.__gd?.store)
      await touchStorage()
    }
    await touchStorage()
    assert.deepEqual((await snap()).modal, { kind: 'storage', item: 'linenCupboard' })
    await page.getByRole('button', { name: /갈대.* 2$/ }).tap()
    await page.getByRole('button', { name: '모두 넣기', exact: true }).tap()
    const partial = await snap()
    assert.equal(partial.inv.reed, 1)
    assert.equal(partial.chest.reed, 30)
    assert.equal(await page.getByRole('button', { name: '모두 넣기', exact: true }).count(), 0)
    assert.match(await page.locator('.bag-detail strong').innerText(), /갈대\s*1/)
    await page.screenshot({ path: path.join(out, 'partial.png'), fullPage: true, animations: 'disabled' })
    await page.getByRole('button', { name: '넣기', exact: true }).tap()
    const blocked = await snap()
    assert.deepEqual(blocked.inv, partial.inv)
    assert.deepEqual(blocked.chest, partial.chest)
    assert.ok(blocked.toast)
    await page.getByRole('button', { name: /닫기/ }).tap()
    await saveReload()
    const restored = await snap()
    assert.deepEqual(restored.inv, partial.inv)
    assert.deepEqual(restored.chest, partial.chest)
    await page.getByRole('button', { name: /갈대.* 1$/ }).tap()
    await page.screenshot({ path: path.join(out, 'reloaded.png'), fullPage: true, animations: 'disabled' })
    // Controlled fixture transition: one stored item is removed to make room for the final item.
    await page.evaluate(() => {
      const s = window.__gd.store.getState()
      window.__gd.store.setState({ game: { ...s.game, chest: { reed: 29 } }, toast: null })
    })
    await page.getByRole('button', { name: '넣기', exact: true }).tap()
    const recovered = await snap()
    assert.equal(recovered.inv.reed ?? 0, 0)
    assert.equal(recovered.chest.reed, 30)
    assert.equal(await page.getByRole('button', { name: '넣기', exact: true }).count(), 0)
    await page.screenshot({ path: path.join(out, 'recovered.png'), fullPage: true, animations: 'disabled' })
    await saveReload()
    const final = await snap()
    assert.deepEqual(final.inv, recovered.inv)
    assert.deepEqual(final.chest, recovered.chest)
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(out, 'results.json'), JSON.stringify({ status: 'passed', partial, blocked, restored, recovered, final, errors }, null, 2))
    process.stdout.write('PASS: installed storage partial put-all, remainder detail, full retry, durable reload, room recovery and final reload; no page errors\n')
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exitCode = 1 })

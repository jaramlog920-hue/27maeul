const { chromium } = require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const origin = 'http://127.0.0.1:4181'
const out = path.resolve('artifacts/detail-audit/002-furniture-pointer')

;(async () => {
  await fs.mkdir(out, { recursive: true })
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const results = []
  try {
    for (const device of [
      { name: 'desktop', viewport: { width: 1280, height: 960 }, hasTouch: false, deviceScaleFactor: 1 },
      { name: 'mobile', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
    ]) {
      const { name, ...options } = device
      const context = await browser.newContext(options)
      const page = await context.newPage()
      page.setDefaultTimeout(15000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('dialog', dialog => void dialog.accept())
      await page.goto(origin)
      await page.getByRole('button', { name: '새로 시작하기' }).click()
      await page.getByLabel('이름', { exact: true }).fill('포인터검사')
      await page.getByRole('button', { name: '이대로 시작', exact: true }).click()
      await page.waitForFunction(() => !!window.__gd?.store)

      const fixture = async () => {
        await page.evaluate(async () => {
          const { CONTENT } = await import('/src/content/catalog.ts')
          const { legacyGame } = await import('/src/engine/growth-test-support.ts')
          const base = legacyGame(CONTENT)
          const game = { ...base, scenes: [], clock: { day: 7, minute: 600 },
            room: [...base.room, { item: 'stool', x: 19, y: 113 }],
            inv: { stool: 1, rug: 1, vase: 1 },
            player: { ...base.player, x: 20, y: 113, path: [] } }
          const store = window.__gd.store
          store.getState().load(game)
          store.setState({ zoom: 1.25, deck: true, toast: null, piecePopups: [], copyResult: null, decorMoving: false, decorLook: null, clockMs: 0 })
          store.getState().startDecorate('stool')
          window.__gd.step(0)
          window.__auditPointers = []
          const canvas = document.querySelector('canvas.world')
          if (!canvas.__auditListener) {
            canvas.__auditListener = true
            canvas.addEventListener('pointerdown', event => {
              window.__auditPointers.push({ pointerType: event.pointerType, x: event.clientX, y: event.clientY, offsetX: event.offsetX, offsetY: event.offsetY })
            }, true)
          }
        })
        await page.waitForFunction(() => !!document.querySelector('.decorate-bar') && !document.querySelector('.decorate-sel'))
      }
      const snapshot = () => page.evaluate(() => {
        const state = window.__gd.store.getState()
        const canvas = document.querySelector('canvas.world')
        const rect = canvas.getBoundingClientRect()
        return { roomStools: state.game.room.filter(item => item.item === 'stool').length,
          bagStools: state.game.inv.stool ?? 0, held: state.decorating,
          heldFacing: state.decorFacing, stoolFacings: state.game.room.filter(item => item.item === 'stool').map(item => item.facing ?? 'down'),
          selected: state.decorSel, toast: state.toast?.text ?? null,
          toolbar: document.querySelector('.decorate-bar')?.innerText,
          canvas: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, clientWidth: canvas.clientWidth, clientHeight: canvas.clientHeight },
          pointers: [...window.__auditPointers] }
      })
      const targetPoint = () => page.evaluate(async () => {
        const { cameraFor, VIEW_W, VIEW_H } = await import('/src/engine/world.ts')
        const state = window.__gd.store.getState()
        const camera = cameraFor(state.game.player.x, state.game.player.y, state.zoom)
        window.__gd.step(0)
        const canvas = document.querySelector('canvas.world')
        const rect = canvas.getBoundingClientRect()
        return { x: rect.left + canvas.clientLeft + (19.5 - camera.x) * state.zoom / VIEW_W * canvas.clientWidth,
          y: rect.top + canvas.clientTop + (113.5 - camera.y) * state.zoom / VIEW_H * canvas.clientHeight }
      })
      const touch = async point => {
        if (device.hasTouch) await page.touchscreen.tap(point.x, point.y)
        else await page.mouse.click(point.x, point.y)
      }

      for (const mode of ['same-tile', 'same-screen']) {
        await fixture()
        const before = await snapshot()
        const point = await targetPoint()
        assert.ok(point.x >= 0 && point.x < device.viewport.width)
        assert.ok(point.y >= 0 && point.y < device.viewport.height)
        await page.screenshot({ path: path.join(out, `${name}-${mode}-before.png`), fullPage: true })
        await touch(point)
        await page.waitForFunction(() => window.__gd.store.getState().decorSel?.item === 'stool')
        const first = await snapshot()
        await page.screenshot({ path: path.join(out, `${name}-${mode}-first.png`), fullPage: true })
        const secondPoint = mode === 'same-tile' ? await targetPoint() : point
        const secondTarget = await page.evaluate(point => {
          const element = document.elementFromPoint(point.x, point.y)
          return { tag: element?.tagName, class: element?.className, text: element?.textContent?.slice(0, 80) }
        }, secondPoint)
        await touch(secondPoint)
        const second = await snapshot()
        await page.screenshot({ path: path.join(out, `${name}-${mode}-second.png`), fullPage: true })
        if (mode === 'same-tile') {
          assert.equal(first.roomStools, 1)
          assert.equal(first.bagStools, 1)
          assert.equal(second.roomStools, 0)
          assert.equal(second.bagStools, 2)
        }
        results.push({ device: name, mode, point, secondPoint, secondTarget, before, first, second })
        console.log(name, mode, JSON.stringify({ before: [before.roomStools, before.bagStools], first: [first.roomStools, first.bagStools], second: [second.roomStools, second.bagStools], secondTarget, canvasBefore: before.canvas, canvasAfter: first.canvas }))
      }

      // The held furniture and selected existing furniture have separate direction controls.
      await fixture()
      await touch(await targetPoint())
      await page.waitForFunction(() => !!window.__gd.store.getState().decorSel)
      await page.getByRole('group', { name: '설치할 가구 방향' }).getByRole('button', { name: '오른쪽', exact: true }).click()
      const heldDirection = await snapshot()
      assert.equal(heldDirection.heldFacing, 'right')
      assert.deepEqual(heldDirection.stoolFacings, ['down'])
      await page.getByRole('button', { name: '돌리기', exact: true }).click()
      await page.getByRole('button', { name: '돌리기', exact: true }).click()
      const selectedDirection = await snapshot()
      assert.equal(selectedDirection.heldFacing, 'right')
      assert.deepEqual(selectedDirection.stoolFacings, ['up'])
      assert.equal(await page.getByRole('group', { name: '설치할 가구 방향' }).getByRole('button', { name: '오른쪽', exact: true }).getAttribute('aria-pressed'), 'true')
      await page.screenshot({ path: path.join(out, `${name}-separate-direction-controls.png`), fullPage: true })
      results.push({ device: name, mode: 'separate-direction-controls', heldDirection, selectedDirection })
      assert.deepEqual(errors, [])
      await context.close()
    }
    await fs.writeFile(path.join(out, 'result.json'), JSON.stringify({ passed: true, results }, null, 2))
    console.log('PASS: desktop mouse and mobile touch, same-tile/same-screen pointer paths, screenshots and states captured')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })

// Run against a local dev server. Each context has an isolated temporary browser profile.
const { chromium } = require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const origin = 'http://127.0.0.1:4179'
const out = path.resolve('artifacts/storage-check')

;(async () => {
  await fs.mkdir(out, { recursive: true })
  const browser = await chromium.launch({ headless: true, channel: 'msedge' })
  const errors = []
  try {
    // Generate a valid old-format save with the actual engine.
    const initial = await browser.newContext()
    const seedPage = await initial.newPage()
    await seedPage.goto(origin)
    await seedPage.getByRole('button', { name: '새로 시작하기' }).waitFor()
    const fixture = await seedPage.evaluate(async () => {
      const { CONTENT } = await import('/src/content/catalog.ts')
      const { newGame } = await import('/src/engine/game.ts')
      const { serialize } = await import('/src/engine/save.ts')
      const game = newGame(CONTENT, { look: 'f', name: '기존 주민' })
      return serialize({ ...game, coins: 321, clock: { day: 7, minute: 600 } })
    })
    await initial.close()

    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true })
    await context.addInitScript(({ fixture, origin }) => {
      if (location.origin !== origin || localStorage.getItem('storage-qa-seeded')) return
      localStorage.setItem('storage-qa-seeded', '1')
      localStorage.setItem('twenty-seven/save', fixture)
      const other = JSON.parse(fixture)
      other.avatar.name = '다른 주민'
      other.coins = 555
      localStorage.setItem('twenty-seven/save/2', JSON.stringify(other))
      localStorage.setItem('twenty-seven/active-slot', '1')
      localStorage.setItem('twenty-seven/save-meta/1', '{"savedAt":123456789}')
      const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
      localStorage.setItem('twenty-seven/album/stars', png)
      localStorage.setItem('twenty-seven/album/2/stars', png)
      localStorage.setItem('twenty-seven-zoom', '1.5')
    }, { fixture, origin })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    page.on('dialog', dialog => void dialog.accept())
    await page.goto(origin)
    await page.getByRole('button', { name: '이어하기' }).waitFor()
    const migrated = await page.evaluate(async () => {
      const save = await import('/src/engine/save.ts')
      const storage = await import('/src/engine/game-storage.ts')
      return { count: save.listSaves().length, album: storage.gameStorage().getItem('twenty-seven/album/stars'), original: localStorage.getItem('twenty-seven/save'), status: storage.getGameStorageStatus().state }
    })
    assert.equal(migrated.count, 2)
    assert.equal(migrated.original, fixture)
    assert.ok(migrated.album.startsWith('data:image/png'))
    assert.equal(migrated.status, 'saved')

    await page.getByRole('button', { name: '불러오기', exact: true }).click()
    await page.getByRole('button', { name: /기존 주민/ }).click()
    await page.waitForFunction(() => !!document.querySelector('.play'))
    const openSettings = async () => {
      await page.evaluate(async () => (await import('/src/store/game-store.ts')).useGame.getState().open({ kind: 'settings' }))
      await page.getByRole('tab', { name: '기록' }).click()
    }
    await openSettings()
    await page.getByRole('button', { name: '저장하기', exact: true }).click()
    await page.waitForFunction(async () => (await import('/src/engine/save.ts')).listSaves().length === 3)
    await page.getByRole('button', { name: '내보내기', exact: true }).waitFor({ state: 'visible' })
    const downloaded = page.waitForEvent('download')
    await page.getByRole('button', { name: '내보내기', exact: true }).click()
    const download = await downloaded
    const exportedPath = path.join(out, 'roundtrip.json')
    await download.saveAs(exportedPath)
    const exported = JSON.parse(await fs.readFile(exportedPath, 'utf8'))
    assert.equal(JSON.parse(exported.save).coins, 321)
    assert.ok(exported.album.stars)
    assert.equal(exported.settings['twenty-seven-zoom'], '1.5')

    // UI file selection must finish durable import before the automatic reload.
    await page.getByLabel('가져올 저장 파일').setInputFiles(exportedPath)
    await page.waitForURL(origin + '/', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '이어하기' }).waitFor({ timeout: 15000 })
    assert.equal(await page.evaluate(async () => (await import('/src/engine/save.ts')).listSaves().length), 4)
    await page.getByRole('button', { name: '이어하기' }).click()
    await page.waitForFunction(() => !!document.querySelector('.play'))

    // Real IndexedDB transaction failure: newest game/photo stay in memory for backup/retry.
    await page.evaluate(async () => {
      const { useGame, storeAlbumImage } = await import('/src/store/game-store.ts')
      const { saveGame } = await import('/src/engine/save.ts')
      window.__originalPut = IDBObjectStore.prototype.put
      IDBObjectStore.prototype.put = function () { throw new DOMException('test full', 'QuotaExceededError') }
      const game = { ...useGame.getState().game, coins: 777 }
      useGame.getState().load(game)
      storeAlbumImage('emergency', 'data:image/png;base64,newest')
      saveGame(game)
    })
    const notice = page.getByRole('dialog', { name: '저장 공간이 부족해요' })
    await notice.waitFor()
    await page.screenshot({ path: path.join(out, 'storage-full-mobile.png'), fullPage: true })
    await page.setViewportSize({ width: 900, height: 1150 })
    await page.screenshot({ path: path.join(out, 'storage-full-guide.png'), fullPage: true })
    assert.ok(await notice.getByText(/사이트 데이터 삭제.*하지 마세요/).isVisible())
    const emergencyDownload = page.waitForEvent('download')
    await notice.getByRole('button', { name: '현재 기록 파일로 받기' }).click()
    const emergency = await emergencyDownload
    const emergencyPath = path.join(out, 'emergency.json')
    await emergency.saveAs(emergencyPath)
    const backup = JSON.parse(await fs.readFile(emergencyPath, 'utf8'))
    assert.equal(JSON.parse(backup.save).coins, 777)
    assert.equal(backup.album.emergency, 'data:image/png;base64,newest')
    await notice.getByRole('button', { name: '나중에' }).click()
    await page.getByRole('button', { name: /저장하지 못한 기록.*안내 보기/ }).click()
    await page.evaluate(() => { IDBObjectStore.prototype.put = window.__originalPut })
    await notice.getByRole('button', { name: '다시 저장' }).click()
    await page.getByRole('heading', { name: '저장을 마쳤어요' }).waitFor()
    await page.getByRole('button', { name: '확인', exact: true }).click()
    await page.reload()
    await page.getByRole('button', { name: '이어하기' }).waitFor()
    const restored = await page.evaluate(async () => {
      const { CONTENT } = await import('/src/content/catalog.ts')
      const save = await import('/src/engine/save.ts')
      const storage = await import('/src/engine/game-storage.ts')
      return { coins: save.loadGame(CONTENT).coins, photo: storage.gameStorage().getItem(save.albumPrefix() + 'emergency') }
    })
    assert.equal(restored.coins, 777)
    assert.equal(restored.photo, 'data:image/png;base64,newest')
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('twenty-seven/save')).coins), 321)
    await page.getByRole('button', { name: '이어하기' }).click()
    await page.waitForFunction(() => !!document.querySelector('.play'))
    await page.evaluate(async () => {
      const { useGame } = await import('/src/store/game-store.ts')
      const { saveGame } = await import('/src/engine/save.ts')
      window.__qaRoomMade = false
      window.__originalPut = IDBObjectStore.prototype.put
      window.__originalDelete = IDBObjectStore.prototype.delete
      IDBObjectStore.prototype.put = function (...args) {
        if (!window.__qaRoomMade) throw new DOMException('test full until delete', 'QuotaExceededError')
        return window.__originalPut.apply(this, args)
      }
      IDBObjectStore.prototype.delete = function (...args) {
        window.__qaRoomMade = true
        return window.__originalDelete.apply(this, args)
      }
      const game = { ...useGame.getState().game, coins: 888 }
      useGame.getState().load(game)
      saveGame(game)
    })
    const cleanupNotice = page.getByRole('dialog', { name: '저장 공간이 부족해요' })
    await cleanupNotice.waitFor()
    await cleanupNotice.getByText('오래된 저장 칸 정리', { exact: true }).click()
    const oldRow = cleanupNotice.locator('.storage-cleanup li').first()
    const oldSlot = Number((await oldRow.locator('p').first().textContent()).match(/저장 칸 (\d+)/)[1])
    assert.notEqual(oldSlot, 4)
    const oldBackup = page.waitForEvent('download')
    await oldRow.getByRole('button', { name: /백업 파일 받기/ }).click()
    const oldFile = await oldBackup
    const oldPath = path.join(out, 'old-slot-backup.json')
    await oldFile.saveAs(oldPath)
    const oldData = JSON.parse(await fs.readFile(oldPath, 'utf8'))
    assert.ok(oldData.album.stars)
    assert.equal(oldData.album.emergency, undefined)
    await oldRow.getByRole('checkbox').check()
    await oldRow.getByRole('button', { name: /저장 칸 삭제/ }).click()
    await page.screenshot({ path: path.join(out, 'storage-cleanup-guide.png'), fullPage: true })
    await oldRow.getByRole('button', { name: '백업 확인했고 삭제' }).click()
    try {
      await page.getByRole('heading', { name: '저장을 마쳤어요' }).waitFor({ timeout: 15000 })
    } catch (error) {
      console.log('Cleanup failure state', await page.evaluate(async () => {
        const { getGameStorageStatus } = await import('/src/engine/game-storage.ts')
        const status = getGameStorageStatus()
        return { state: status.state, error: status.error?.message, name: status.error?.name, roomMade: window.__qaRoomMade, text: document.querySelector('.storage-notice')?.textContent }
      }))
      await page.screenshot({ path: path.join(out, 'storage-cleanup-failure.png'), fullPage: true })
      throw error
    }
    await page.waitForFunction(async () => (await import('/src/engine/save.ts')).listSaves().length === 3)
    await page.evaluate(() => { IDBObjectStore.prototype.put = window.__originalPut; IDBObjectStore.prototype.delete = window.__originalDelete })
    await page.getByRole('button', { name: '확인', exact: true }).click()
    await page.reload()
    await page.getByRole('button', { name: '이어하기' }).waitFor()
    assert.equal(await page.evaluate(async () => {
      const { CONTENT } = await import('/src/content/catalog.ts')
      const save = await import('/src/engine/save.ts')
      return save.loadGame(CONTENT).coins
    }), 888)
    const largeSize = 6 * 1024 * 1024
    await page.evaluate(async (size) => {
      const { storeAlbumImage } = await import('/src/store/game-store.ts')
      const { flushGameStorage } = await import('/src/engine/game-storage.ts')
      storeAlbumImage('larger-than-localstorage', 'x'.repeat(size))
      await flushGameStorage()
    }, largeSize)
    await page.reload()
    await page.getByRole('button', { name: '이어하기' }).waitFor()
    assert.equal(await page.evaluate(async () => {
      const { gameStorage } = await import('/src/engine/game-storage.ts')
      const { albumPrefix } = await import('/src/engine/save.ts')
      return gameStorage().getItem(albumPrefix() + 'larger-than-localstorage').length
    }), largeSize)
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(out, 'result.json'), JSON.stringify({ passed: true, migration: '2 legacy slots + albums', ui: 'load/copy/export/import/reload', failure: 'real transaction quota + backup + retry + reload', cleanup: 'old slot backup + confirmation + atomic delete and current save + reload (888 coins)', largePhotoBytes: largeSize, restored, pageErrors: errors }, null, 2))
    console.log('PASS: migration, load, slot copy, UI file roundtrip, quota popup, backup, retry, cleanup recovery, restart, 6MiB photo')
    await context.close()
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })

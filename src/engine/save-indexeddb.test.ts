import { IDBFactory, IDBObjectStore as FakeObjectStore } from 'fake-indexeddb'
import { CONTENT } from '../content/catalog'
import { newGame } from './game'

type Runtime = {
  backend: typeof import('./game-storage')
  saves: typeof import('./save')
}

async function runtime(initialize = true): Promise<Runtime> {
  // A fresh application module cache, with the same browser database on reload.
  vi.resetModules()
  const backend = await import('./game-storage')
  const saves = await import('./save')
  if (initialize) await backend.initializeGameStorage()
  return { backend, saves }
}

const named = (name: string, coins = 123) => ({ ...newGame(CONTENT, { name, look: 'f' }), coins })

async function durableEntries(): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('twenty-seven-storage', 1)
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const db = open.result
      const transaction = db.transaction('game', 'readonly')
      const store = transaction.objectStore('game')
      const keys = store.getAllKeys()
      const values = store.getAll()
      transaction.oncomplete = () => {
        db.close()
        resolve(Object.fromEntries(keys.result.map((key, index) => [String(key), values.result[index]])))
      }
      transaction.onabort = () => { db.close(); reject(transaction.error) }
    }
  })
}

function abortPutAt(keyToReject: string) {
  const put = FakeObjectStore.prototype.put
  return vi.spyOn(FakeObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value, key) {
    if (key === keyToReject) throw new DOMException('full', 'QuotaExceededError')
    return put.call(this, value, key)
  })
}

beforeEach(() => {
  vi.stubGlobal('indexedDB', new IDBFactory())
  localStorage.clear()
})

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('IndexedDB save file and slot integration', () => {
  it('imports a legacy v1 file without photos or settings and loads it after restart', async () => {
    const first = await runtime()
    const game = named('옛 기록', 321)
    const text = JSON.stringify({ app: 'twenty-seven', v: 1, save: first.saves.serialize(game) })
    expect(await first.saves.importSaveAsync('\uFEFF' + text + '\n', CONTENT)).toEqual({ slot: '1', pics: 0, picsMissed: 0, settings: 0 })
    expect(first.saves.loadGame(CONTENT)?.avatar?.name).toBe('옛 기록')
    expect(localStorage.getItem(first.saves.SAVE_KEY)).toBeNull()

    const restarted = await runtime()
    expect(restarted.saves.activeSlot()).toBe('1')
    expect(restarted.saves.loadGame(CONTENT)?.coins).toBe(321)
  })

  it('round-trips v2 photos and every device setting, including the legacy zoom key', async () => {
    const first = await runtime(false)
    const game = named('앨범 주인', 456)
    localStorage.setItem(first.saves.SAVE_KEY, first.saves.serialize(game))
    localStorage.setItem(first.saves.slotKey('3'), first.saves.serialize(named('다른 칸')))
    localStorage.setItem(first.saves.ACTIVE_KEY, '1')
    localStorage.setItem(first.saves.albumPrefix('1') + 'stars', 'data:image/png;base64,stars')
    localStorage.setItem(first.saves.albumPrefix('1') + 'fam:trip', 'data:image/png;base64,family')
    localStorage.setItem(first.saves.albumPrefix('3') + 'stars', 'other-slot-photo')
    const settings = {
      'twenty-seven/music': 'F',
      'twenty-seven/theme': 'pink',
      'twenty-seven/volume-music': '0.35',
      'twenty-seven/joystick': 'on',
      'twenty-seven/some-future-setting': 'keep-me',
      'twenty-seven-zoom': '2',
    }
    for (const [key, value] of Object.entries(settings)) localStorage.setItem(key, value)
    await first.backend.initializeGameStorage()

    const text = first.saves.exportSave(game)
    const exported = JSON.parse(text)
    expect(exported).toMatchObject({ app: 'twenty-seven', v: 2, settings })
    expect(exported.album).toEqual({ stars: 'data:image/png;base64,stars', 'fam:trip': 'data:image/png;base64,family' })
    for (const key of Object.keys(settings)) localStorage.removeItem(key)

    expect(await first.saves.importSaveAsync(text, CONTENT)).toEqual({ slot: '2', pics: 2, picsMissed: 0, settings: 6 })
    expect(first.saves.activeSlot()).toBe('2')
    for (const [key, value] of Object.entries(settings)) expect(localStorage.getItem(key), key).toBe(value)
    expect(first.backend.gameStorage()!.getItem(first.saves.albumPrefix('2') + 'fam:trip')).toBe('data:image/png;base64,family')

    const restarted = await runtime()
    expect(restarted.saves.activeSlot()).toBe('2')
    expect(restarted.saves.loadGame(CONTENT)?.coins).toBe(456)
    expect(JSON.parse(restarted.saves.exportSave(restarted.saves.loadGame(CONTENT)!))).toMatchObject({ album: exported.album, settings })
    expect(restarted.saves.listSaves()).toHaveLength(3)
  })

  it('rejects malformed files without adding a slot or changing the active save', async () => {
    const current = await runtime()
    await current.saves.createSaveAsync(named('현재 기록'))
    const before = await durableEntries()
    const invalidFiles = [
      'not json',
      JSON.stringify({ app: 'other', save: current.saves.serialize(named('다른 게임')) }),
      JSON.stringify({ app: 'twenty-seven', save: '{}', album: {} }),
      JSON.stringify({ app: 'twenty-seven', save: current.saves.serialize(named('깨진 사진')), album: { '2/stars': 'invalid-id' } }),
    ]
    for (const text of invalidFiles) expect(await current.saves.importSaveAsync(text, CONTENT)).toEqual({ error: 'format' })
    expect(current.saves.activeSlot()).toBe('1')
    expect(current.saves.listSaves()).toHaveLength(1)
    expect(await durableEntries()).toEqual(before)
  })

  it('aborts a failed import completely, keeps settings and the old active slot, then retries', async () => {
    const current = await runtime()
    await current.saves.createSaveAsync(named('원래 기록', 123))
    localStorage.setItem('twenty-seven/theme', 'olive')
    const before = await durableEntries()
    const imported = JSON.stringify({
      app: 'twenty-seven', v: 2, save: current.saves.serialize(named('가져온 기록', 789)),
      album: { stars: 'new-photo', 'fam:trip': 'second-photo' }, settings: { 'twenty-seven/theme': 'pink' },
    })
    const blocked = abortPutAt(current.saves.albumPrefix('2') + 'stars')
    expect(await current.saves.importSaveAsync(imported, CONTENT)).toEqual({ error: 'space' })
    expect(current.saves.activeSlot()).toBe('1')
    expect(current.saves.loadGame(CONTENT)?.coins).toBe(123)
    expect(current.saves.listSaves()).toHaveLength(1)
    expect(current.backend.gameStorage()!.getItem(current.saves.slotKey('2'))).toBeNull()
    expect(localStorage.getItem('twenty-seven/theme')).toBe('olive')
    expect(await durableEntries()).toEqual(before)

    blocked.mockRestore()
    expect(await current.saves.importSaveAsync(imported, CONTENT)).toEqual({ slot: '2', pics: 2, picsMissed: 0, settings: 1 })
    expect(current.saves.activeSlot()).toBe('2')
    expect(current.saves.loadGame(CONTENT)?.coins).toBe(789)
    expect(localStorage.getItem('twenty-seven/theme')).toBe('pink')
    const restarted = await runtime()
    expect(restarted.saves.loadGame(CONTENT)?.coins).toBe(789)
    expect(restarted.backend.gameStorage()!.getItem(restarted.saves.albumPrefix('2') + 'fam:trip')).toBe('second-photo')
  })

  it('copies all album photos to a new slot atomically and preserves the current slot on failure and success', async () => {
    const current = await runtime()
    const game = named('원래 주인')
    await current.saves.createSaveAsync(game)
    current.backend.gameStorage()!.setItem(current.saves.albumPrefix('1') + 'stars', 'original-photo')
    current.backend.gameStorage()!.setItem(current.saves.albumPrefix('1') + 'fam:trip', 'family-photo')
    await current.backend.flushGameStorage()
    const before = await durableEntries()
    const blocked = abortPutAt(current.saves.albumPrefix('2') + 'stars')
    expect(await current.saves.saveAsNewAsync({ ...game, coins: 999 })).toBeNull()
    expect(current.saves.activeSlot()).toBe('1')
    expect(current.saves.listSaves()).toHaveLength(1)
    expect(current.backend.gameStorage()!.getItem(current.saves.slotKey('2'))).toBeNull()
    expect(await durableEntries()).toEqual(before)

    blocked.mockRestore()
    expect(await current.saves.saveAsNewAsync({ ...game, coins: 999 })).toBe('2')
    expect(current.saves.activeSlot()).toBe('1')
    expect(current.saves.loadGame(CONTENT)?.coins).toBe(123)
    const restarted = await runtime()
    expect(restarted.saves.listSaves()).toHaveLength(2)
    expect(restarted.saves.loadGame(CONTENT, undefined, '2')?.coins).toBe(999)
    expect(restarted.backend.gameStorage()!.getItem(restarted.saves.albumPrefix('2') + 'stars')).toBe('original-photo')
    expect(restarted.backend.gameStorage()!.getItem(restarted.saves.albumPrefix('2') + 'fam:trip')).toBe('family-photo')
  })

  it('imports, exports, copies, and reloads a photo larger than the localStorage quota', async () => {
    const current = await runtime()
    const game = named('큰 앨범')
    const photo = 'data:image/png;base64,' + 'A'.repeat(6 * 1024 * 1024)
    const text = JSON.stringify({ app: 'twenty-seven', v: 2, save: current.saves.serialize(game), album: { stars: photo } })
    expect(await current.saves.importSaveAsync(text, CONTENT)).toEqual({ slot: '1', pics: 1, picsMissed: 0, settings: 0 })
    expect(localStorage.getItem(current.saves.albumPrefix('1') + 'stars')).toBeNull()
    expect(await current.saves.saveAsNewAsync(game)).toBe('2')

    const restarted = await runtime()
    expect(restarted.backend.gameStorage()!.getItem(restarted.saves.albumPrefix('1') + 'stars')).toBe(photo)
    expect(restarted.backend.gameStorage()!.getItem(restarted.saves.albumPrefix('2') + 'stars')).toBe(photo)
    expect(JSON.parse(restarted.saves.exportSave(restarted.saves.loadGame(CONTENT)!)).album.stars).toBe(photo)
  })

  it('does not resurrect deleted or reset slots from the retained legacy backup after restart', async () => {
    const first = await runtime(false)
    const one = first.saves.serialize(named('첫 칸'))
    const three = first.saves.serialize(named('셋째 칸'))
    localStorage.setItem(first.saves.SAVE_KEY, one)
    localStorage.setItem(first.saves.slotKey('3'), three)
    localStorage.setItem(first.saves.ACTIVE_KEY, '1')
    localStorage.setItem(first.saves.albumPrefix('1') + 'stars', 'old-first-photo')
    localStorage.setItem(first.saves.albumPrefix('3') + 'stars', 'old-third-photo')
    await first.backend.initializeGameStorage()

    expect(await first.saves.deleteSaveAsync('1')).toBe(true)
    expect(first.saves.listSaves().map(save => save.slot)).toEqual(['3'])
    expect(first.backend.gameStorage()!.getItem(first.saves.albumPrefix('3') + 'stars')).toBe('old-third-photo')
    expect(await first.saves.selectSaveAsync('3')).toBe(true)
    expect(await first.saves.eraseSaveAsync()).toBe(true)
    // pagehide must not bring back the state that the reset button just erased.
    expect(await first.saves.saveGameAsync(named('지워진 옛 화면'))).toBe(true)
    expect(first.saves.listSaves()).toEqual([])
    expect(localStorage.getItem(first.saves.SAVE_KEY)).toBe(one)
    expect(localStorage.getItem(first.saves.slotKey('3'))).toBe(three)

    const restarted = await runtime()
    expect(restarted.saves.listSaves()).toEqual([])
    expect(restarted.saves.loadGame(CONTENT)).toBeNull()
    expect(restarted.backend.gameStorage()!.getItem(restarted.saves.albumPrefix('1') + 'stars')).toBeNull()
    expect(restarted.backend.gameStorage()!.getItem(restarted.saves.albumPrefix('3') + 'stars')).toBeNull()
  })

  it('changes the active slot only after successful create or select commits', async () => {
    const current = await runtime()
    await current.saves.createSaveAsync(named('첫 기록'))
    const before = await durableEntries()
    let blocked = abortPutAt(current.saves.ACTIVE_KEY)
    expect(await current.saves.createSaveAsync(named('둘째 기록'))).toBeNull()
    expect(current.saves.activeSlot()).toBe('1')
    expect(current.saves.listSaves()).toHaveLength(1)
    expect(await durableEntries()).toEqual(before)
    blocked.mockRestore()

    expect(await current.saves.createSaveAsync(named('둘째 기록'))).toBe('2')
    expect(current.saves.activeSlot()).toBe('2')
    blocked = abortPutAt(current.saves.ACTIVE_KEY)
    expect(await current.saves.selectSaveAsync('1')).toBe(false)
    expect(current.saves.activeSlot()).toBe('2')
    blocked.mockRestore()
    expect(await current.saves.selectSaveAsync('1')).toBe(true)
    const restarted = await runtime()
    expect(restarted.saves.activeSlot()).toBe('1')
    expect(restarted.saves.loadGame(CONTENT)?.avatar?.name).toBe('첫 기록')
  })
})

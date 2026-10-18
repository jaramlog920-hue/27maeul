import { IDBFactory, IDBObjectStore as FakeObjectStore } from 'fake-indexeddb'

const SAVE = 'twenty-seven/save'
const META = 'twenty-seven/save-meta/1'
const ALBUM = 'twenty-seven/album/stars'
type StorageModule = typeof import('./game-storage')

async function fresh(): Promise<StorageModule> {
  vi.resetModules()
  return import('./game-storage')
}

async function stored(key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('twenty-seven-storage', 1)
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const db = open.result
      const transaction = db.transaction('game', 'readonly')
      const request = transaction.objectStore('game').get(key)
      transaction.oncomplete = () => { db.close(); resolve(request.result) }
      transaction.onabort = () => { db.close(); reject(transaction.error) }
    }
  })
}

beforeEach(() => {
  vi.stubGlobal('indexedDB', new IDBFactory())
  localStorage.clear()
})

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('migrates progress, slots, photos, and active slot together, preserving the old backup', async () => {
  localStorage.setItem(SAVE, 'old-progress')
  localStorage.setItem('twenty-seven/save/2', 'other-progress')
  localStorage.setItem(META, 'metadata')
  localStorage.setItem(ALBUM, 'data:image/png;base64,photo')
  localStorage.setItem('twenty-seven/active-slot', '2')
  localStorage.setItem('twenty-seven/sound', 'off')
  const backend = await fresh()
  const first = backend.initializeGameStorage()
  expect(backend.initializeGameStorage()).toBe(first)
  await first
  const storage = backend.gameStorage()!
  expect(storage.length).toBe(5)
  expect(storage.getItem(SAVE)).toBe('old-progress')
  expect(storage.getItem(ALBUM)).toBe('data:image/png;base64,photo')
  expect(storage.getItem('twenty-seven/sound')).toBeNull()
  expect(localStorage.getItem(SAVE)).toBe('old-progress')
  expect(await stored('twenty-seven/save/2')).toBe('other-progress')
  expect(backend.getGameStorageStatus().state).toBe('saved')
})

it('does not resurrect deleted saves from retained localStorage on reload', async () => {
  localStorage.setItem(SAVE, 'old-progress')
  localStorage.setItem(ALBUM, 'old-photo')
  const first = await fresh()
  await first.initializeGameStorage()
  first.withStorageBatch(first.gameStorage()!, () => {
    first.gameStorage()!.removeItem(SAVE)
    first.gameStorage()!.removeItem(ALBUM)
  })
  await first.flushGameStorage()
  expect(localStorage.getItem(SAVE)).toBe('old-progress')
  const reload = await fresh()
  await reload.initializeGameStorage()
  expect(reload.gameStorage()!.getItem(SAVE)).toBeNull()
  expect(reload.gameStorage()!.getItem(ALBUM)).toBeNull()
})

it('rolls back an incomplete migration and retries without losing legacy data', async () => {
  localStorage.setItem(SAVE, 'old-progress')
  localStorage.setItem(ALBUM, 'old-photo')
  const put = FakeObjectStore.prototype.put
  const blocked = vi.spyOn(FakeObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value, key) {
    if (key === ALBUM) throw new DOMException('full', 'QuotaExceededError')
    return put.call(this, value, key)
  })
  const backend = await fresh()
  await expect(backend.initializeGameStorage()).rejects.toHaveProperty('name', 'QuotaExceededError')
  expect(await stored(SAVE)).toBeUndefined()
  expect(localStorage.getItem(ALBUM)).toBe('old-photo')
  expect(backend.getGameStorageStatus()).toMatchObject({ state: 'error', quota: true })
  blocked.mockRestore()
  await backend.initializeGameStorage()
  expect(backend.gameStorage()!.getItem(ALBUM)).toBe('old-photo')
})

it('flush waits for committed progress and photos, including subsequent synchronous writes', async () => {
  const backend = await fresh()
  await backend.initializeGameStorage()
  const storage = backend.gameStorage()!
  backend.withStorageBatch(storage, () => {
    storage.setItem(SAVE, 'progress-1')
    storage.setItem(META, 'meta-1')
    storage.setItem(ALBUM, 'photo-1')
  })
  storage.setItem(SAVE, 'progress-2')
  await backend.flushGameStorage()
  expect(await stored(SAVE)).toBe('progress-2')
  expect(await stored(META)).toBe('meta-1')
  expect(await stored(ALBUM)).toBe('photo-1')
})

it('cancels synchronous batches when validation throws', async () => {
  localStorage.setItem(SAVE, 'original')
  const backend = await fresh()
  await backend.initializeGameStorage()
  const storage = backend.gameStorage()!
  expect(() => backend.withStorageBatch(storage, () => {
    storage.setItem(SAVE, 'imported')
    storage.setItem(ALBUM, 'imported-photo')
    throw new Error('invalid backup')
  })).toThrow('invalid backup')
  await backend.flushGameStorage()
  expect(storage.getItem(SAVE)).toBe('original')
  expect(await stored(SAVE)).toBe('original')
  expect(await stored(ALBUM)).toBeUndefined()
})

it('keeps failed autosaves for retry and reports quota until a durable retry succeeds', async () => {
  const backend = await fresh()
  await backend.initializeGameStorage()
  const storage = backend.gameStorage()!
  const put = FakeObjectStore.prototype.put
  const blocked = vi.spyOn(FakeObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value, key) {
    if (key === SAVE) throw new DOMException('full', 'QuotaExceededError')
    return put.call(this, value, key)
  })
  storage.setItem(SAVE, 'latest-progress')
  await expect(backend.flushGameStorage()).rejects.toHaveProperty('name', 'QuotaExceededError')
  const failure = backend.getGameStorageStatus()
  expect(failure).toMatchObject({ state: 'error', quota: true })
  expect(storage.getItem(SAVE)).toBe('latest-progress')
  await expect(backend.flushGameStorage()).rejects.toThrow()
  expect(backend.getGameStorageStatus().errorId).toBe(failure.errorId)
  expect(await stored(SAVE)).toBeUndefined()
  blocked.mockRestore()
  await backend.flushGameStorage()
  expect(await stored(SAVE)).toBe('latest-progress')
  expect(backend.getGameStorageStatus()).toMatchObject({ state: 'saved', error: null })
})

it('reverts an aborted manual import and never commits only part of it', async () => {
  localStorage.setItem(SAVE, 'original')
  localStorage.setItem(ALBUM, 'original-photo')
  const backend = await fresh()
  await backend.initializeGameStorage()
  const storage = backend.gameStorage()!
  const put = FakeObjectStore.prototype.put
  const blocked = vi.spyOn(FakeObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value, key) {
    if (key === ALBUM) throw new DOMException('full', 'QuotaExceededError')
    return put.call(this, value, key)
  })
  await expect(backend.commitStorageBatch(storage, () => {
    storage.setItem(SAVE, 'imported')
    storage.setItem(META, 'imported-meta')
    storage.setItem(ALBUM, 'imported-photo')
  })).rejects.toHaveProperty('name', 'QuotaExceededError')
  expect(storage.getItem(SAVE)).toBe('original')
  expect(storage.getItem(META)).toBeNull()
  expect(storage.getItem(ALBUM)).toBe('original-photo')
  expect(await stored(SAVE)).toBe('original')
  expect(await stored(META)).toBeUndefined()
  blocked.mockRestore()
  await backend.flushGameStorage()
  expect(await stored(SAVE)).toBe('original')
})

it('rejects stale tab writes instead of overwriting another tab', async () => {
  localStorage.setItem(SAVE, 'original')
  const first = await fresh()
  await first.initializeGameStorage()
  const second = await fresh()
  await second.initializeGameStorage()
  first.gameStorage()!.setItem(SAVE, 'first-tab-newer')
  await first.flushGameStorage()
  second.gameStorage()!.setItem(SAVE, 'stale-second-tab')
  await expect(second.flushGameStorage()).rejects.toHaveProperty('name', 'GameStorageConflictError')
  expect(await stored(SAVE)).toBe('first-tab-newer')
  await expect(second.flushGameStorage()).rejects.toHaveProperty('name', 'GameStorageConflictError')
  expect(await stored(SAVE)).toBe('first-tab-newer')
})

it('fails boot on inaccessible legacy data instead of marking an empty migration complete', async () => {
  const getter = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError') })
  const backend = await fresh()
  await expect(backend.initializeGameStorage()).rejects.toHaveProperty('name', 'SecurityError')
  getter.mockRestore()
  localStorage.setItem(SAVE, 'safe-original')
  await backend.initializeGameStorage()
  expect(backend.gameStorage()!.getItem(SAVE)).toBe('safe-original')
})

it('serializes simultaneous manual save operations through durable completion', async () => {
  const backend = await fresh()
  await backend.initializeGameStorage()
  const storage = backend.gameStorage()!
  const events: string[] = []
  const first = backend.commitStorageBatch(storage, () => {
    storage.setItem(SAVE, 'first')
    events.push('first')
  })
  const second = backend.commitStorageBatch(storage, () => {
    expect(storage.getItem(SAVE)).toBe('first')
    storage.setItem(SAVE, 'second')
    events.push('second')
  })
  await Promise.all([first, second])
  expect(events).toEqual(['first', 'second'])
  expect(await stored(SAVE)).toBe('second')
})

it('closes on a database version change and requires reload before writing again', async () => {
  localStorage.setItem(SAVE, 'original')
  const backend = await fresh()
  await backend.initializeGameStorage()
  await new Promise<void>((resolve, reject) => {
    const upgrade = indexedDB.open('twenty-seven-storage', 2)
    upgrade.onerror = () => reject(upgrade.error)
    upgrade.onsuccess = () => { upgrade.result.close(); resolve() }
  })
  expect(backend.getGameStorageStatus().error?.name).toBe('GameStorageVersionChangeError')
  backend.gameStorage()!.setItem(SAVE, 'not-durable')
  await expect(backend.flushGameStorage()).rejects.toHaveProperty('name', 'GameStorageVersionChangeError')
  expect(localStorage.getItem(SAVE)).toBe('original')
})

it('allows old-slot deletion to reclaim room while an autosave is waiting after quota failure', async () => {
  const oldSlot = 'twenty-seven/save/2'
  localStorage.setItem(SAVE, 'original')
  localStorage.setItem(oldSlot, 'old-game')
  const backend = await fresh()
  await backend.initializeGameStorage()
  const storage = backend.gameStorage()!
  let reclaimed = false
  const put = FakeObjectStore.prototype.put
  const remove = FakeObjectStore.prototype.delete
  vi.spyOn(FakeObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value, key) {
    if (key === SAVE && !reclaimed) throw new DOMException('full', 'QuotaExceededError')
    return put.call(this, value, key)
  })
  vi.spyOn(FakeObjectStore.prototype, 'delete').mockImplementation(function (this: IDBObjectStore, key) {
    if (key === oldSlot) reclaimed = true
    return remove.call(this, key)
  })
  storage.setItem(SAVE, 'pending-latest')
  await expect(backend.flushGameStorage()).rejects.toHaveProperty('name', 'QuotaExceededError')
  await backend.commitStorageBatch(storage, () => storage.removeItem(oldSlot))
  expect(await stored(SAVE)).toBe('pending-latest')
  expect(await stored(oldSlot)).toBeUndefined()
  expect(backend.getGameStorageStatus().state).toBe('saved')
})

it('restores a failed quota-recovery deletion and retains the latest autosave for later retry', async () => {
  const oldSlot = 'twenty-seven/save/2'
  localStorage.setItem(SAVE, 'original')
  localStorage.setItem(oldSlot, 'old-game')
  const backend = await fresh()
  await backend.initializeGameStorage()
  const storage = backend.gameStorage()!
  const blocked = vi.spyOn(FakeObjectStore.prototype, 'put').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError') })
  storage.setItem(SAVE, 'pending-latest')
  await expect(backend.flushGameStorage()).rejects.toHaveProperty('name', 'QuotaExceededError')
  await expect(backend.commitStorageBatch(storage, () => storage.removeItem(oldSlot))).rejects.toHaveProperty('name', 'QuotaExceededError')
  expect(storage.getItem(oldSlot)).toBe('old-game')
  expect(storage.getItem(SAVE)).toBe('pending-latest')
  expect(await stored(oldSlot)).toBe('old-game')
  expect(await stored(SAVE)).toBe('original')
  blocked.mockRestore()
  await backend.flushGameStorage()
  expect(await stored(SAVE)).toBe('pending-latest')
  expect(await stored(oldSlot)).toBe('old-game')
})

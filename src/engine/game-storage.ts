/**
 * Game data lives in IndexedDB. The synchronous cache keeps engine reads cheap;
 * callers that promise a completed save must await flushGameStorage().
 * Settings deliberately remain in localStorage and are not exposed by this cache.
 */
const DATABASE = 'twenty-seven-storage'
const STORE = 'game'
const MIGRATED = '__legacy-local-storage-migrated-v1__'
const MANAGED = /^twenty-seven\/(save(?:\/\d{1,4})?|save-meta\/\d{1,4}|album\/.+|active-slot)$/

export interface GameStorageStatus {
  state: 'saved' | 'pending' | 'error'
  error: Error | null
  quota: boolean
  /** Stable while the same unresolved failure is being retried. */
  errorId: number
}

let status: GameStorageStatus = { state: 'saved', error: null, quota: false, errorId: 0 }
let errorSequence = 0
const listeners = new Set<() => void>()
let database: IDBDatabase | null = null
let cache: GameStorage | null = null
let initialization: Promise<void> | null = null
let connectionError: Error | null = null
let writer: Promise<void> | null = null
let manualWrites: Promise<void> = Promise.resolve()
let activeWrite: Write | null = null
let scheduled = false

type Changes = Map<string, string | null>
interface Write {
  changes: Changes
  rollback?: Map<string, string>
  retryOnFailure?: Write[]
  resolve?: () => void
  reject?: (error: Error) => void
}
const writes: Write[] = []

function asError(value: unknown): Error {
  if (value instanceof Error) return value
  if (value && typeof value === 'object' && 'message' in value) {
    const error = new Error(String(value.message))
    if ('name' in value) error.name = String(value.name)
    return error
  }
  return new Error(typeof value === 'string' ? value : '브라우저에 저장하지 못했어요. 저장 공간을 확인하고 다시 시도해 주세요.')
}

function notify(next: GameStorageStatus): void {
  status = next
  for (const listener of listeners) {
    try { listener() } catch { /* A broken subscriber must not interrupt saving. */ }
  }
}

export function getGameStorageStatus(): GameStorageStatus { return status }
export function subscribeGameStorage(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function reportGameStorageError(value: unknown): void {
  const error = asError(value)
  const quota = error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
  notify({ state: 'error', error, quota, errorId: status.error ? status.errorId : ++errorSequence })
}

function pending(): void {
  // Keep a failure visible until a durable retry has actually succeeded.
  notify({ ...status, state: status.error ? 'error' : 'pending' })
}

function saved(): void { notify({ state: 'saved', error: null, quota: false, errorId: 0 }) }

function legacyStorage(): Storage | null {
  try { return globalThis.localStorage ?? null } catch { return null }
}

/** Before boot this fallback also preserves the existing isolated engine tests. */
export function gameStorage(): Storage | null { return cache ?? legacyStorage() }

function readLegacy(): Map<string, string> {
  // Do not treat inaccessible old data as an empty save and mark it migrated.
  const storage = globalThis.localStorage
  const result = new Map<string, string>()
  if (!storage) return result
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key && MANAGED.test(key)) {
      const value = storage.getItem(key)
      if (value !== null) result.set(key, value)
    }
  }
  return result
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('이 브라우저에서 마을 저장소를 열 수 없어요. 일반 브라우저 창에서 다시 열어 주세요. 기존 저장은 그대로 남아 있어요.'))
      return
    }
    const request = globalThis.indexedDB.open(DATABASE, 1)
    let refused = false
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onblocked = () => {
      refused = true
      reject(new Error('다른 탭에서 마을 저장소를 사용하고 있어요. 다른 마을 탭을 닫고 다시 시도해 주세요.'))
    }
    request.onerror = () => reject(request.error ?? new Error('마을 저장소를 열지 못했어요.'))
    request.onsuccess = () => {
      if (refused) { request.result.close(); return }
      resolve(request.result)
    }
  })
}

function loadAndMigrate(db: IDBDatabase): Promise<Map<string, string>> {
  return new Promise((resolve, reject) => {
    const data = new Map<string, string>()
    const transaction = db.transaction(STORE, 'readwrite', { durability: 'strict' })
    const store = transaction.objectStore(STORE)
    let migrated = false
    let failure: Error | null = null
    transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('기존 저장을 옮기지 못했어요. 원본은 그대로 남아 있어요.'))
    transaction.onerror = () => { /* onabort is the durable failure signal. */ }
    transaction.oncomplete = () => resolve(data)
    const cursor = store.openCursor()
    cursor.onsuccess = () => {
      const item = cursor.result
      if (item) {
        if (item.key === MIGRATED) migrated = item.value === true
        else if (typeof item.key === 'string' && MANAGED.test(item.key)) {
          if (typeof item.value !== 'string') {
            failure = new Error('마을 저장 데이터의 형식을 확인할 수 없어요. 기존 저장을 덮어쓰지 않았어요.')
            transaction.abort()
            return
          }
          data.set(item.key, item.value)
        }
        item.continue()
        return
      }
      if (migrated) return
      try {
        for (const [key, value] of readLegacy()) {
          if (!data.has(key)) { store.put(value, key); data.set(key, value) }
        }
        // Marker and copied data share the transaction, so a failed migration is retryable.
        store.put(true, MIGRATED)
      } catch (error) { failure = asError(error); transaction.abort() }
    }
  })
}

export function initializeGameStorage(): Promise<void> {
  if (cache) return connectionError ? Promise.reject(connectionError) : Promise.resolve()
  if (initialization) return initialization
  initialization = (async () => {
    let opened: IDBDatabase | null = null
    try {
      pending()
      opened = await openDatabase()
      const data = await loadAndMigrate(opened)
      database = opened
      database.onversionchange = () => {
        database?.close()
        connectionError = new Error('다른 탭에서 마을 저장소가 바뀌었어요. 이 화면을 새로고침한 뒤 이어서 해 주세요.')
        connectionError.name = 'GameStorageVersionChangeError'
        reportGameStorageError(connectionError)
      }
      cache = new GameStorage(data)
      saved()
    } catch (error) {
      opened?.close()
      reportGameStorageError(error)
      throw error
    } finally { initialization = null }
  })()
  return initialization
}

class GameStorage implements Storage {
  data: Map<string, string>
  /** Last committed values, used to prevent a stale tab overwriting another tab. */
  durable: Map<string, string>
  batch: Changes | null = null
  constructor(data: Map<string, string>) { this.data = new Map(data); this.durable = new Map(data) }
  get length(): number { return this.data.size }
  key(index: number): string | null { return [...this.data.keys()][index] ?? null }
  getItem(key: string): string | null { return this.data.get(String(key)) ?? null }
  setItem(key: string, value: string): void {
    key = String(key)
    if (!MANAGED.test(key)) throw new TypeError('게임 저장 키가 아니에요.')
    const text = String(value)
    if (this.data.get(key) === text) return
    this.data.set(key, text)
    this.changed(key, text)
  }
  removeItem(key: string): void {
    key = String(key)
    if (!this.data.delete(key)) return
    this.changed(key, null)
  }
  clear(): void { withStorageBatch(this, () => { for (const key of this.data.keys()) this.removeItem(key) }) }
  private changed(key: string, value: string | null): void {
    if (this.batch) this.batch.set(key, value)
    else enqueue({ changes: new Map([[key, value]]) })
  }
}

function enqueue(write: Write): void {
  if (!write.changes.size) { write.resolve?.(); return }
  const last = writes.at(-1)
  // A full disk must not retain one growing game snapshot for every autosave.
  if (!write.rollback && last && !last.rollback && last !== activeWrite) {
    for (const [key, value] of write.changes) last.changes.set(key, value)
  } else writes.push(write)
  pending()
  if (scheduled) return
  scheduled = true
  queueMicrotask(() => {
    scheduled = false
    // Autosaves have a visible error state; never leak an unhandled rejection.
    void runWriter().catch(() => {})
  })
}

function persist(write: Write): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!database || !cache || connectionError) { reject(connectionError ?? new Error('마을 저장소가 아직 준비되지 않았어요.')); return }
    const current = cache
    let failure: Error | null = null
    let transaction: IDBTransaction
    try { transaction = database.transaction(STORE, 'readwrite', { durability: 'strict' }) } catch (error) { reject(asError(error)); return }
    const store = transaction.objectStore(STORE)
    transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('브라우저에 저장하지 못했어요. 다시 시도해 주세요.'))
    transaction.onerror = () => { /* transaction abort reports the request error. */ }
    transaction.oncomplete = () => {
      for (const [key, value] of write.changes) {
        if (value === null) current.durable.delete(key)
        else current.durable.set(key, value)
      }
      resolve()
    }
    try {
      // Reclaim space first when a user deletes old slots after a quota failure.
      const ordered = [...write.changes].sort((a, b) => Number(b[1] === null) - Number(a[1] === null))
      for (const [key, value] of ordered) {
        const request = store.get(key)
        request.onsuccess = () => {
          try {
            if ((request.result ?? null) !== (current.durable.get(key) ?? null)) {
              failure = new Error('다른 탭에서 이 저장을 바꿨어요. 저장 파일을 내려받은 뒤 화면을 새로고침해 주세요.')
              failure.name = 'GameStorageConflictError'
              transaction.abort()
              return
            }
            if (value === null) store.delete(key)
            else store.put(value, key)
          } catch (error) {
            failure = asError(error)
            transaction.abort()
          }
        }
      }
    } catch (error) { failure = asError(error); transaction.abort() }
  })
}

function restoreFailedBatch(write: Write): void {
  if (!cache || !write.rollback) return
  // Preserve unrelated/newer synchronous changes that arrived while committing.
  for (const [key, value] of write.changes) {
    if ((cache.data.get(key) ?? null) !== value) continue
    const original = write.rollback.get(key)
    if (original === undefined) cache.data.delete(key)
    else cache.data.set(key, original)
  }
}

function runWriter(): Promise<void> {
  if (writer) return writer
  writer = (async () => {
    while (writes.length) {
      const write = writes[0]
      activeWrite = write
      try {
        await persist(write)
        writes.shift()
        write.resolve?.()
      } catch (value) {
        const error = asError(value)
        if (write.rollback) {
          restoreFailedBatch(write)
          writes.shift()
          if (write.retryOnFailure) writes.unshift(...write.retryOnFailure)
        }
        reportGameStorageError(error)
        write.reject?.(error)
        throw error
      } finally { activeWrite = null }
    }
    saved()
  })()
  const running = writer
  void running.then(() => { if (writer === running) writer = null }, () => { if (writer === running) writer = null })
  return running
}

/** Resolve after all queued transactions have completed, or reject without losing retryable writes. */
export async function flushGameStorage(): Promise<void> {
  if (!cache) return
  if (connectionError) { reportGameStorageError(connectionError); throw connectionError }
  await runWriter()
}

function snapshot(storage: Storage): Map<string, string> {
  const data = new Map<string, string>()
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key !== null) { const value = storage.getItem(key); if (value !== null) data.set(key, value) }
  }
  return data
}

function restore(storage: Storage, data: Map<string, string>): void {
  for (const key of snapshot(storage).keys()) if (!data.has(key)) storage.removeItem(key)
  for (const [key, value] of data) if (storage.getItem(key) !== value) storage.setItem(key, value)
}

/** Synchronous changes in this callback form one atomic IndexedDB transaction. */
export function withStorageBatch<T>(storage: Storage, action: () => T): T {
  if (!(storage instanceof GameStorage)) {
    const before = snapshot(storage)
    try { return action() } catch (error) { restore(storage, before); throw error }
  }
  const before = new Map(storage.data)
  const outer = storage.batch
  const changes: Changes = new Map()
  storage.batch = changes
  try {
    const result = action()
    storage.batch = outer
    if (outer) for (const [key, value] of changes) outer.set(key, value)
    else enqueue({ changes })
    return result
  } catch (error) {
    storage.data = before
    storage.batch = outer
    throw error
  }
}

/** Import/create/delete operations can wait for durability and revert their cache on failure. */
export function commitStorageBatch<T>(storage: Storage, action: () => T): Promise<T> {
  const commit = manualWrites.then(async () => {
    if (!(storage instanceof GameStorage)) return withStorageBatch(storage, action)
    let retained: Write[] = []
    try { await flushGameStorage() } catch (error) {
      // A failed autosave must not prevent deleting old slots to make room.
      // Only quota failures are eligible; stale-tab/security errors need user action.
      if (!getGameStorageStatus().quota) throw error
      retained = writes.splice(0)
    }
    const before = new Map(storage.data)
    if (storage.batch) throw new Error('저장 작업을 마친 뒤 다시 시도해 주세요.')
    const changes: Changes = new Map()
    for (const pendingWrite of retained) for (const [key, value] of pendingWrite.changes) changes.set(key, value)
    storage.batch = changes
    let result: T
    try { result = action() } catch (error) {
      storage.data = before
      writes.unshift(...retained)
      throw error
    } finally { storage.batch = null }
    await new Promise<void>((resolve, reject) => enqueue({ changes, rollback: before, retryOnFailure: retained, resolve, reject }))
    return result
  })
  manualWrites = commit.then(() => {}, () => {})
  return commit
}

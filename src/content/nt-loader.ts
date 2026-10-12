import type { Book } from '../engine/types'

export interface NtBookData {
  chapters: string[][]
  guides: Record<string, { background: string; look: string }>
}
const loaders = import.meta.glob<NtBookData>('./nt/*.json', { import: 'default' })
const loaded = new Map<Book, NtBookData>()
const pending = new Map<Book, Promise<void>>()

export const ntLoaded = (book: Book) => loaded.has(book)
export function ntBookData(book: Book): NtBookData {
  const data = loaded.get(book)
  if (!data) throw new Error(`not loaded: ${book}`)
  return data
}
/** 같은 책을 동시에 요청하면 한 번만 받는다. 실패는 캐시하지 않아 재시도할 수 있다. */
export function ensureNtBook(book: Book): Promise<void> {
  if (loaded.has(book)) return Promise.resolve()
  const current = pending.get(book)
  if (current) return current
  const loader = loaders[`./nt/${book}.json`]
  if (!loader) return Promise.reject(new Error(`no nt book file: ${book}`))
  const request = loader().then(data => { loaded.set(book, data) }).finally(() => { pending.delete(book) })
  pending.set(book, request)
  return request
}
export const ensureNtBooks = (books: readonly Book[]) => Promise.all([...new Set(books)].map(ensureNtBook)).then(() => undefined)

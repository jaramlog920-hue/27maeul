// 책별 진행: 어느 장까지 이었는지, 책상 위에 어떤 순서로 놓였는지. 순수 계산만.
import { SHELF_ROOMS, type ShelfRoom, type ShelfRoomId } from './shelf-rooms'
import { isOtBook, OT_BOOKS, otRow, type CopyBook, type OtBook } from './ot-books'
import { BOOKS, GOSPELS, type Book, type GameContent } from './types'

export interface BookProgress {
  completed: number[]
  /** 장 → 책상 위에 놓인 순서 */
  arrangement: Record<number, string[]>
}
export type Progress = Record<Book, BookProgress>

export function emptyProgress(): Progress {
  return Object.fromEntries(BOOKS.map((b) => [b, { completed: [], arrangement: {} }])) as unknown as Progress
}

/** 구약 책별 진행 (선택 필드 — 옛 저장·구약을 안 쓴 저장은 없다). 신약 Progress 27키와 섞이지 않는다 */
export type OtProgress = Partial<Record<OtBook, BookProgress>>

const NO_PROGRESS: BookProgress = { completed: [], arrangement: {} }

/**
 * 한 책의 진행 — 필사 엔진이 읽는 한 입구 (계획 20 작업 5): 신약은 s.progress[book], 구약은 s.otProgress?.[book] (없으면 빈 진행).
 * 빈 진행은 늘 같은 객체라 선택자로 써도 다시 그리지 않는다
 */
export function progressOf(s: { progress: Progress; otProgress?: OtProgress }, book: CopyBook): BookProgress {
  return isOtBook(book) ? (s.otProgress?.[book] ?? NO_PROGRESS) : s.progress[book]
}

export function totalChapters(s: { progress: Progress }): number {
  return BOOKS.reduce((n, b) => n + s.progress[b].completed.length, 0)
}

/**
 * 필사할 수 있는 장. 신약: 조각이 있는 장 (시험판에서 앞 몇 장만 넣은 책은 그 장들만).
 * 구약: 본문을 불러왔으면 책 표의 1..장 수 전부, 안 불러왔으면 빈 목록 (책상이 먼저 불러온다)
 */
export function chaptersOf(book: CopyBook, content: GameContent): number[] {
  if (isOtBook(book)) return content.chapterText?.(book, 1).length ? Array.from({ length: otRow(book).chapters }, (_, i) => i + 1) : []
  return [...new Set(content.pieces.filter((p) => p.book === book).map((p) => p.chapter))].sort((a, b) => a - b)
}

/**
 * 서고의 방이 열렸는가 (방 표 shelf-rooms): 2026-10-06부터 다섯 방 모두 처음부터 열려 있다 (사용자 결정 —
 * 예전의 차례 잠금·flags['room:<id>']·gospelFeast 조건은 없앴다. 옛 저장에 남은 표식은 아무 일도 하지 않는다).
 * 책 고르기·chooseBook·불러오기·도감·서고 문이 모두 이 판정 하나를 쓴다
 */
export function roomOpen(_id: ShelfRoomId, _flags: Readonly<Record<string, number | undefined>>): boolean {
  return true
}

/** 서고의 열린 방 문 번호들 (world.LOCKED_DOORS 번호, 방 표의 door) — 지도의 열린 문과 잠긴 문 누르기가 이것 하나를 쓴다 */
export function openDoorsFor(flags: Readonly<Record<string, number | undefined>>): number[] {
  return SHELF_ROOMS.filter((r) => r.door !== null && roomOpen(r.id, flags)).map((r) => r.door as number)
}

/** 그 책의 방이 열렸는가 */
export function bookRoomOpen(book: Book, flags: Readonly<Record<string, number | undefined>>): boolean {
  const room = SHELF_ROOMS.find((r) => r.books.includes(book))
  return !!room && roomOpen(room.id, flags)
}

/**
 * 책상에서 고를 수 있는 책(= 도감에 보이는 책): 콘텐츠가 있는 책, 방 순서대로 (방은 모두 열려 있다).
 * 네 복음서는 (예전과 같이) 언제나 보인다
 */
export function pickableBooks(flags: Readonly<Record<string, number | undefined>>, withContent: readonly Book[]): Book[] {
  return SHELF_ROOMS.filter((r) => roomOpen(r.id, flags)).flatMap((r) =>
    r.id === 'gospels' ? [...GOSPELS] : r.books.filter((b) => withContent.includes(b)),
  )
}

/**
 * 책들을 서고의 방으로 묶는다 (방 표 순서, 방 안은 오늘 성경 순서). 책이 하나도 없는 방은 뺀다.
 * 책 고르기·도감·내 책장이 모두 이것을 쓴다 — 닫힌 방의 책은 넘겨주는 쪽(pickableBooks)이 이미 거른다
 */
export function groupByRoom(books: readonly Book[]): { room: ShelfRoom; books: Book[] }[] {
  return SHELF_ROOMS.map((room) => ({ room, books: room.books.filter((b) => books.includes(b)) })).filter((g) => g.books.length > 0)
}

/** 구약 책을 필사로 다 마쳤는가 (책 표의 장 수로 — 본문을 불러오지 않아도 된다. 책장 전시용) */
export function otBookFinished(s: { otProgress?: OtProgress }, book: OtBook): boolean {
  const done = s.otProgress?.[book]?.completed ?? []
  const n = otRow(book).chapters
  for (let c = 1; c <= n; c++) if (!done.includes(c)) return false
  return true
}

export function bookDone(s: { progress: Progress; otProgress?: OtProgress }, book: CopyBook, content: GameContent): boolean {
  const chapters = chaptersOf(book, content)
  const done = progressOf(s, book).completed
  return chapters.length > 0 && chapters.every((c) => done.includes(c))
}

/** 저장에서 읽은 구약 진행 정리: 모양이 맞는 책만, 장은 책 표의 1..장 수 안의 정수 (겹침 없이 오름차순). 없거나 비면 빈 객체 */
export function sanitizeOtProgress(raw: unknown): OtProgress {
  const out: OtProgress = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const b of OT_BOOKS) {
    const v = (raw as Record<string, unknown>)[b]
    const list = v && typeof v === 'object' ? (v as { completed?: unknown }).completed : undefined
    if (!Array.isArray(list)) continue
    const max = otRow(b).chapters
    const completed = [...new Set(list.filter((c): c is number => Number.isInteger(c) && c >= 1 && c <= max))].sort((a, c) => a - c)
    if (completed.length) out[b] = { completed, arrangement: {} }
  }
  return out
}

// 완성된 책을 물건으로 (계획 14 작업 8): 다 쓴 책(제본했거나 서고에 꽂은 책)을 펼쳐 본다 — 첫 쪽의 나의 필사 기록,
// 내가 필사한 본문(마친 장 그대로, 개역한글), 이 책에서 발견한 하나님 기록. 집 책장에는 다 쓴 책을 몇 권 둘 수 있다
// (서고의 책을 옮기는 것이 아니라 한 부 더 두는 것 — 서고 권수는 그대로). 이 파일은 순수 계산과 저장 정리.
import type { Bindings } from './binding'
import { copyVerses, isCopiedChapter, type CopyState, type CopyVerse } from './copying'
export type { BookDays } from './copying'
import type { GodFind } from './god-records'
import { BOOKS, type Book, type GameContent } from './types'
import type { Progress } from './books'

/** 집 책장에 둘 수 있는 책 수 (책장이 몇 개든 집 책장 한 칸으로 센다) */
export const HOME_SHELF_MAX = 3

/** 다 쓴 책: 제본했거나 서고에 꽂은 책 (예전에 꽂은 책은 제본 기록이 없어도 다 쓴 책). 성경 순서 */
export function finishedBooks(s: { bound: Bindings; shelved: Partial<Record<Book, unknown>> }): Book[] {
  return BOOKS.filter((b) => s.bound[b] !== undefined || s.shelved[b] !== undefined)
}

export function isFinished(s: { bound: Bindings; shelved: Partial<Record<Book, unknown>> }, book: Book): boolean {
  return s.bound[book] !== undefined || s.shelved[book] !== undefined
}

/** 첫 쪽의 나의 필사 기록 */
export interface BookRecord {
  /** 쓰기 시작한 날 (남아 있지 않으면 null — 이 기록이 생기기 전에 쓴 책·예전에 엮은 책) */
  start: number | null
  /** 마친 날 (남아 있지 않으면 null) */
  end: number | null
  /** 필사로 적은 절 수 — 예전에 엮은 장은 빼고 */
  verses: number
  /** 필사로 적은 글자 수 (대조 정규화 글자) — 예전에 엮은 장은 빼고 */
  chars: number
  /** 필사로 마친 장 수 */
  copied: number
  /** 예전에 엮은 장 수 (필사가 생기기 전 저장에서 마친 장) */
  legacy: number
  /** 제본한 날 (제본 기록이 없는 옛 책이면 null) */
  bound: number | null
}

/**
 * 이 책의 필사 기록. 절·글자는 필사로 마친 장의 절에서 센다 — 한 절은 한 번만 적고 장은 그 절을 다 적어야 마치므로
 * 필사로 마친 장의 절 수·글자 수가 곧 적은 양이다 (이 기록이 생기기 전에 쓴 책도 맞게 나온다)
 */
export function bookRecord(
  s: { progress: Progress; copy: CopyState; bound: Bindings },
  book: Book,
  content: GameContent,
): BookRecord {
  // 필사로 실제로 따라 적은 장만 센다 — 조각 엮기·편지 옮겨 적기로 마친 장과 기록이 없는 장은 예전에 엮은 장
  const all = s.progress[book].completed
  const done = all.filter((c) => isCopiedChapter(s.copy, book, c))
  const legacyCount = all.length - done.length
  let verses = 0
  let chars = 0
  for (const ch of done) {
    for (const v of copyVerses(book, ch, content)) {
      verses++
      chars += v.chars
    }
  }
  const days = s.copy.days?.[book]
  return {
    start: days?.start ?? null,
    end: days?.end ?? null,
    verses,
    chars,
    copied: done.length,
    legacy: legacyCount,
    bound: s.bound[book]?.day ?? null,
  }
}

/** 펼쳐 볼 장 하나: 장 번호, 예전에 엮은 장인가, 그 장의 본문(본문 없는 절은 빠진다 — 필사할 때와 같은 절) */
export interface ReadChapter {
  chapter: number
  legacy: boolean
  verses: CopyVerse[]
}

/** 펼쳐 보기: 마친 장을 장 순서대로 (개역한글 그대로 — copyVerses) */
export function readChapters(s: { progress: Progress; copy: CopyState }, book: Book, content: GameContent): ReadChapter[] {
  return [...s.progress[book].completed]
    .sort((a, b) => a - b)
    .map((chapter) => ({ chapter, legacy: !isCopiedChapter(s.copy, book, chapter), verses: copyVerses(book, chapter, content) }))
    .filter((c) => c.verses.length > 0)
}

/** 이 책에서 발견한 하나님 기록: 키워드 순서(목록 순서)대로 묶고, 같은 키워드의 구절은 장·발견 순서 */
export function bookGodFinds(finds: readonly GodFind[], book: Book, keywordOrder: readonly string[]): { keyword: string; finds: GodFind[] }[] {
  const mine = finds.filter((f) => f.book === book)
  const keys = [...new Set([...keywordOrder.filter((k) => mine.some((f) => f.keyword === k)), ...mine.map((f) => f.keyword)])]
  return keys.map((keyword) => ({ keyword, finds: mine.filter((f) => f.keyword === keyword).sort((a, b) => a.chapter - b.chapter) }))
}

/** 집 책장에 두기·내려놓기: 다 쓴 책만, HOME_SHELF_MAX권까지. 바뀌지 않으면 같은 상태 */
export function toggleHomeBook<S extends { homeShelf: Book[]; bound: Bindings; shelved: Partial<Record<Book, unknown>> }>(s: S, book: Book): S {
  if (s.homeShelf.includes(book)) return { ...s, homeShelf: s.homeShelf.filter((b) => b !== book) }
  if (!isFinished(s, book) || s.homeShelf.length >= HOME_SHELF_MAX) return s
  return { ...s, homeShelf: [...s.homeShelf, book] }
}

// ── 저장 정리 ──

const isBook = (b: unknown): b is Book => typeof b === 'string' && (BOOKS as readonly string[]).includes(b)

/** 집 책장 정리: 다 쓴 책만, 같은 책은 한 번, HOME_SHELF_MAX권까지. 옛 저장은 빈 책장 */
export function sanitizeHomeShelf(raw: unknown, finished: (b: Book) => boolean): Book[] {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.filter(isBook))].filter(finished).slice(0, HOME_SHELF_MAX)
}

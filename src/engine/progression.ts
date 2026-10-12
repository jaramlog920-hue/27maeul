import metadata from '../content/books.json'
import { bibleIdOf } from './shelf-rooms'
import { BOOKS, type Book } from './types'
import type { Progress } from './books'

/** 본문을 불러오지 않아도 성장과 완필을 계산한다. */
export const NT_CHAPTER_COUNTS = Object.fromEntries(BOOKS.map(book => [book,
  metadata.find(row => row.id === bibleIdOf(book))!.chapters,
])) as Record<Book, number>

export interface GrowthState {
  progress: Progress
  shelved: Partial<Record<Book, unknown>>
  flags: Record<string, number>
}

export function libraryGrowth(s: Pick<GrowthState, 'progress' | 'shelved'>) {
  let completedChapters = 0
  const completedBooks: Book[] = []
  for (const book of BOOKS) {
    const chapters = new Set((s.progress[book]?.completed ?? []).filter(c =>
      Number.isInteger(c) && c >= 1 && c <= NT_CHAPTER_COUNTS[book]))
    completedChapters += chapters.size
    if (chapters.size === NT_CHAPTER_COUNTS[book]) completedBooks.push(book)
  }
  return { completedChapters, completedBooks, shelvedBooks: BOOKS.filter(b => s.shelved[b] !== undefined) }
}

/** 지도·일정·주민 입주의 공통 기준. 이미 꽂힌 책은 기존 지역을 다시 잠그지 않는다. */
export function villageBookCount(s: Pick<GrowthState, 'shelved'> & Partial<Pick<GrowthState, 'progress' | 'flags'>>): number {
  const shelved = Object.values(s.shelved).filter(v => v !== undefined).length
  if (!s.flags?.growthVersion || s.flags.growthLegacy || !s.progress) return shelved
  return Math.max(shelved, libraryGrowth({ progress: s.progress, shelved: s.shelved }).completedBooks.length)
}

// ── 서고 수입 (2026-10-12 사용자: 서고를 채울수록 닢을 더 번다) ──
/** 서고에 꽂힌 책 한 권마다 일해서 버는 닢(편지 대필·일하는 하루·마을 부탁)이 이만큼 늘어난다 */
export const LIBRARY_PAY_PER_BOOK = 0.03

/** 서고를 채운 정도: 신약은 마을 권수, 구약은 끝까지 옮겨 적은 책 수 (구약 진행은 숫자만 받는다 — 순환 import 없이) */
export function libraryBooks(s: Pick<GrowthState, 'shelved'> & Partial<Pick<GrowthState, 'progress' | 'flags'>>, otFinished = 0): number {
  return villageBookCount(s) + otFinished
}

/** 서고 덕분에 늘어난 수입 비율 (0.03 = 3%) */
export function libraryPayRate(books: number): number {
  return Math.max(0, books) * LIBRARY_PAY_PER_BOOK
}

/** 일해서 버는 닢에 서고 몫을 더한다 */
export function libraryPay(base: number, books: number): number {
  return Math.round(base * (1 + libraryPayRate(books)))
}

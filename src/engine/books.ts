// 책별 진행: 어느 장까지 이었는지, 책상 위에 어떤 순서로 놓였는지. 순수 계산만.
import { BOOKS, type Book, type GameContent } from './types'

export interface BookProgress {
  completed: number[]
  /** 장 → 책상 위에 놓인 순서 */
  arrangement: Record<number, string[]>
}
export type Progress = Record<Book, BookProgress>

export function emptyProgress(): Progress {
  return Object.fromEntries(BOOKS.map((b) => [b, { completed: [], arrangement: {} }])) as unknown as Progress
}

export function totalChapters(s: { progress: Progress }): number {
  return BOOKS.reduce((n, b) => n + s.progress[b].completed.length, 0)
}

/** 조각이 있는 장 (시험판에서 앞 몇 장만 넣은 책은 그 장들만) */
export function chaptersOf(book: Book, content: GameContent): number[] {
  return [...new Set(content.pieces.filter((p) => p.book === book).map((p) => p.chapter))].sort((a, b) => a - b)
}

export function bookDone(s: { progress: Progress }, book: Book, content: GameContent): boolean {
  const chapters = chaptersOf(book, content)
  return chapters.length > 0 && chapters.every((c) => s.progress[book].completed.includes(c))
}

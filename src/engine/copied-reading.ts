import { progressOf } from './books'
import { ntLoaded } from '../content/nt-loader'
import { copyVerses, isCopiedChapter } from './copying'
import type { GameState } from './game'
import { isOtBook, OT_BOOKS, type CopyBook } from './ot-books'
import { BOOKS, type GameContent } from './types'

export interface CopiedChapter {
  book: CopyBook
  chapter: number
  /** 작성 중인 장이면 이 절 앞까지, 마친 장이면 전부. */
  through: number | null
}

export function copiedChapters(s: Pick<GameState, 'copy' | 'progress' | 'otProgress'>, content: GameContent): CopiedChapter[] {
  return [...BOOKS, ...OT_BOOKS].flatMap(book => {
    const completed = progressOf(s, book).completed
    const out: CopiedChapter[] = completed.filter(chapter => isCopiedChapter(s.copy, book, chapter)).map(chapter => ({ book, chapter, through: null }))
    const at = s.copy.at[book]
    if (at && !completed.includes(at.chapter)) {
      const verses = isOtBook(book) || ntLoaded(book) ? copyVerses(book, at.chapter, content) : []
      // 본문을 아직 내려받지 않았어도 저장한 절은 읽기 목록에 남긴다.
      const first = verses[0]?.verse ?? 1
      if (at.verse > first) out.push({ book, chapter: at.chapter, through: at.verse })
    }
    return out.sort((a, b) => a.chapter - b.chapter)
  })
}

export function copiedReadingVerses(entry: CopiedChapter, content: GameContent) {
  return copyVerses(entry.book, entry.chapter, content).filter(v => entry.through === null || v.verse < entry.through)
}

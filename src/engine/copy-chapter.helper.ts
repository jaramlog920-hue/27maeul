// 시험용: 실제 필사 길(writeVerse)로 그 책의 다음 장 하나를 끝까지 옮겨 적는다
// (예전 책상 조각 엮기·편지 옮겨 적기는 없앴다 — 장을 마치는 길은 필사뿐이다, 계획 14)
import type { CopyBook } from './ot-books'
import { copySpot } from './copying'
import { startCopy, writeVerse, type GameState } from './game'
import type { GameContent } from './types'

export function copyNextChapter(s: GameState, book: CopyBook, content: GameContent): GameState {
  let next = startCopy(s, book, content)
  const first = copySpot(next, book, content)
  if (!first) return next
  for (;;) {
    const spot = copySpot(next, book, content)
    if (!spot || spot.chapter !== first.chapter) return next
    const r = writeVerse(next, book, spot.verse.text, content)
    if (r.result.kind === 'notYet' || r.result.kind === 'none') return next
    next = r.state
    if (r.result.kind === 'chapter') return next
  }
}

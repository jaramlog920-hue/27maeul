import type { GameState } from './game'
import { BOOKS } from './types'
import { NT_CHAPTER_COUNTS } from './progression'
import { OT_BOOKS } from './ot-books'
import { otBookFinished } from './books'

/** 본문 로딩 상태와 관계없이 실제 27권의 모든 장이 끝났는지 확인한다. */
export function allManuscriptsDone(s: Pick<GameState, 'progress'>): boolean {
  return BOOKS.every(book => Array.from({ length: NT_CHAPTER_COUNTS[book] }, (_, i) => i + 1).every(ch => s.progress[book].completed.includes(ch)))
}

export function manuscriptFinale(before: GameState, next: GameState): GameState {
  if (before.flags.lastManuscriptScene || allManuscriptsDone(before) || !allManuscriptsDone(next)) return next
  const scenes = [...next.scenes]
  const last = scenes.lastIndexOf('bookBound')
  if (last >= 0) scenes.splice(last, 1, 'lastManuscript')
  else scenes.push('lastManuscript')
  return { ...next, scenes, flags: { ...next.flags, lastManuscriptScene: 1 } }
}

/** 구약은 완필한 책을 자동 전시한다. 신약의 실제 책 꽂기와 구약 완필을 함께 확인한다. */
export function bothLibrariesFull(s: Pick<GameState, 'shelved' | 'otProgress'>): boolean {
  return BOOKS.every(book => s.shelved[book] !== undefined) && OT_BOOKS.every(book => otBookFinished(s, book))
}

export function completeBibleFinale(before: GameState, next: GameState): GameState {
  if (next.flags.completeBibleScene || bothLibrariesFull(before) || !bothLibrariesFull(next)) return next
  return { ...next, scenes: [...next.scenes, 'bibleLastLetter'], flags: { ...next.flags, completeBibleScene: 1, bibleEndingDue: next.clock.day + 1, bibleCompletedDay: next.clock.day, bibleEndingVerses: next.copyStats.verses, bibleEndingDays: next.copyStats.firstDay === null ? 0 : next.clock.day - next.copyStats.firstDay + 1 } }
}

/** 마지막 책을 본 다음 날 저녁. 이동·작업은 기다리고, 저장을 불러와도 한 번만 연다. */
export function bibleEndingEvents(s: GameState): GameState {
  if (s.scenes.length || s.player.path.length || s.act || s.target) return s
  if (s.flags.bibleEndingDue && s.flags.bibleLastLetterSeen && !s.flags.bibleEndingQueued && s.clock.day >= s.flags.bibleEndingDue && s.clock.minute >= 18 * 60)
    return {...s, scenes:[...s.scenes,'completeBible'],flags:{...s.flags,bibleEndingQueued:1}}
  if (!s.flags.bibleEndingSeen) return s
  for (const [i, delay] of [2,5,9].entries()) {
    const id=`bibleReadingLetter:${i}`, key=`bibleReadingLetter${i}`
    if (!s.flags[key] && s.clock.day >= s.flags.bibleEndingSeen + delay)
      return {...s,scenes:[...s.scenes,id],flags:{...s.flags,[key]:1}}
  }
  return s
}

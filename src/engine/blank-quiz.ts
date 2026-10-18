// 완성한 장마다 10문제. 보상은 장별 첫 완주에만 지급하고 재풀이는 연습으로 허용한다.
import { blanksForVerse } from './copy-ways'
import { copyVerses } from './copying'
import type { GameState } from './game'
import { seededShuffle } from './offers'
import type { CopyBook } from './ot-books'
import type { GameContent } from './types'

export const BLANK_QUIZ_SIZE = 10
export const BLANK_COIN = 10
export const BLANK_PERFECT = 10
export interface BlankChapter { book: CopyBook; chapter: number }
export interface BlankQuestion extends BlankChapter {
  verse: number
  words: string[]
  index: number
  answer: string
  options: string[]
}

export const blankChapterKey = ({ book, chapter }: BlankChapter): string => `${book}:${chapter}`
const rewardKey = (target: BlankChapter) => `blankQuizPaid:${blankChapterKey(target)}`
export const blankQuizRewarded = (s: Pick<GameState, 'flags'>, target: BlankChapter): boolean => !!s.flags[rewardKey(target)]

export function copiedChapters(s: Pick<GameState, 'copy'>): BlankChapter[] {
  const out: BlankChapter[] = []
  for (const [book, chs] of Object.entries(s.copy.copied ?? {}) as [CopyBook, number[]][]) {
    for (const chapter of new Set(chs ?? [])) if (Number.isInteger(chapter) && chapter > 0) out.push({ book, chapter })
  }
  return out
}

const completed = (s: Pick<GameState, 'copy'>, target: BlankChapter): boolean =>
  !!s.copy.copied?.[target.book]?.includes(target.chapter)

/** 선택한 완성 장에서만 출제. 짧은 장은 절의 다른 빈칸을 우선 쓰고, 부족하면 같은 장에서 복습한다. */
export function makeBlankQuiz(s: Pick<GameState, 'copy'>, content: GameContent, seed: number, target: BlankChapter): BlankQuestion[] {
  if (!completed(s, target)) return []
  const { book, chapter } = target
  const verses = copyVerses(book, chapter, content)
  const texts = verses.map(v => v.text)
  const candidates = seededShuffle(verses, seed).flatMap(v => {
    const blanks = blanksForVerse(v.text, texts, 9, seed, book, chapter, v.verse) ?? []
    return blanks.filter(b => b.options.length >= 3).map(b => ({ ...target, verse: v.verse, words: v.text.split(/\s+/).filter(Boolean), ...b }))
  })
  // 같은 절은 한 번씩 먼저 낸다. 열 절 미만이면 서로 다른 빈칸으로 채운다.
  const seen = new Set<number>()
  const first: BlankQuestion[] = []
  const rest: BlankQuestion[] = []
  for (const q of candidates) {
    if (seen.has(q.verse)) rest.push(q)
    else { seen.add(q.verse); first.push(q) }
  }
  const pool = [...first, ...rest]
  if (!pool.length) return []
  return Array.from({ length: BLANK_QUIZ_SIZE }, (_, i) => pool[i % pool.length])
}

export function blankQuizPay(correct: number, total: number): number {
  if (total !== BLANK_QUIZ_SIZE || !Number.isInteger(correct) || correct < 0 || correct > total) return 0
  return correct * BLANK_COIN + (correct === total ? BLANK_PERFECT : 0)
}

/** 0점도 첫 완주로 기록한다. 저장·날짜 변경·재필사로 보상 기회가 초기화되지 않는다. */
export function finishBlankQuiz(s: GameState, target: BlankChapter, correct: number, total: number): GameState {
  if (!completed(s, target) || total !== BLANK_QUIZ_SIZE || !Number.isInteger(correct) || correct < 0 || correct > total) return s
  const pay = blankQuizRewarded(s, target) ? 0 : blankQuizPay(correct, total)
  return { ...s, coins: s.coins + pay, flags: { ...s.flags, [rewardKey(target)]: 1,
    blankQuizRounds: (s.flags.blankQuizRounds ?? 0) + 1, blankQuizRight: (s.flags.blankQuizRight ?? 0) + correct } }
}

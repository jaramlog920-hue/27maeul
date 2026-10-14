// 빈칸 퀴즈 (2026-10-14 사용자): 지금까지 필사를 마친 장(신약·구약) 가운데 무작위 절의 빈칸 하나를 낱말 보기 넷에서 고른다.
// 처음부터 열리고, 말씀 메뉴에서 언제든·장을 마친 화면에서 바로 풀 수 있다. 한 판 5문제, 맞힌 문제마다 닢, 다 맞히면 덤.
// 하루 판수 제한은 없다 (사용자 결정). 시간은 흐르지 않는다. 빈칸은 필사 화면의 빈칸(blanksForVerse)과 같은 방식.
import { blanksForVerse } from './copy-ways'
import { copyVerses } from './copying'
import type { GameState } from './game'
import { mulberry32 } from './offers'
import type { CopyBook } from './ot-books'
import type { GameContent } from './types'

export const BLANK_QUIZ_SIZE = 5
export const BLANK_COIN = 10
export const BLANK_PERFECT = 10

export interface BlankQuestion {
  book: CopyBook
  chapter: number
  verse: number
  /** 절 본문 (띄어쓰기로 나눈 낱말 차례 그대로) */
  words: string[]
  /** 빈칸 낱말 자리 */
  index: number
  answer: string
  /** 보기 넷 (답 포함, 섞은 차례) */
  options: string[]
}

/** 지금까지 필사로 마친 장 (책·장) */
export function copiedChapters(s: Pick<GameState, 'copy'>): { book: CopyBook; chapter: number }[] {
  const out: { book: CopyBook; chapter: number }[] = []
  for (const [book, chs] of Object.entries(s.copy.copied ?? {}) as [CopyBook, number[]][]) for (const chapter of chs ?? []) out.push({ book, chapter })
  return out
}

/** 한 판 문제: 필사한 장에서 무작위 절, 빈칸 하나·보기 넷. 본문을 아직 불러오지 않은 장은 건너뛴다. 만들 수 있는 만큼(최대 5) */
export function makeBlankQuiz(s: Pick<GameState, 'copy'>, content: GameContent, seed: number): BlankQuestion[] {
  const pool = copiedChapters(s)
  const rnd = mulberry32(seed >>> 0)
  const out: BlankQuestion[] = []
  const seen = new Set<string>()
  for (let tries = 0; tries < 80 && out.length < BLANK_QUIZ_SIZE && pool.length; tries++) {
    const { book, chapter } = pool[Math.floor(rnd() * pool.length)]
    const verses = copyVerses(book, chapter, content)
    if (!verses.length) continue
    const v = verses[Math.floor(rnd() * verses.length)]
    const key = `${book}:${chapter}:${v.verse}`
    if (seen.has(key)) continue
    // 보기 넷이 나오도록 실력 9로 만들고 빈칸은 첫 하나만 쓴다
    const blanks = blanksForVerse(v.text, verses.map((x) => x.text), 9, Math.floor(rnd() * 1e9), book, chapter, v.verse)
    const b = blanks?.find((x) => x.options.length >= 3)
    if (!b) continue
    seen.add(key)
    out.push({ book, chapter, verse: v.verse, words: v.text.split(/\s+/).filter(Boolean), index: b.index, answer: b.answer, options: b.options })
  }
  return out
}

/** 한 판에 받는 닢: 맞힌 문제마다 BLANK_COIN, 다 맞히면 BLANK_PERFECT 더 */
export function blankQuizPay(correct: number, total: number): number {
  if (total <= 0) return 0
  return correct * BLANK_COIN + (correct === total && total >= BLANK_QUIZ_SIZE ? BLANK_PERFECT : 0)
}

/** 판을 마치면 닢을 받는다 (기록: 푼 판 수·맞힌 수) */
export function finishBlankQuiz(s: GameState, correct: number, total: number): GameState {
  const pay = blankQuizPay(correct, total)
  return { ...s, coins: s.coins + pay, flags: { ...s.flags, blankQuizRounds: (s.flags.blankQuizRounds ?? 0) + 1, blankQuizRight: (s.flags.blankQuizRight ?? 0) + correct } }
}

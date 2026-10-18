import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { ensureOtBook } from '../content/ot-catalog'
import { blankChapterKey, BLANK_COIN, BLANK_PERFECT, BLANK_QUIZ_SIZE, blankQuizPay, blankQuizRewarded, copiedChapters, finishBlankQuiz, makeBlankQuiz } from './blank-quiz'
import { copyVerses } from './copying'
import { newGame, type GameState } from './game'
import { serialize, deserialize } from './save'
import { isOtBook } from './ot-books'

const target = { book: 'lk' as const, chapter: 1 }
const copied = (books: Record<string, number[]>): GameState => {
  const g = newGame(CONTENT)
  const entries = Object.entries(books).map(([book, completed]) => [book, { completed, arrangement: {} }])
  return { ...g, progress: { ...g.progress, ...Object.fromEntries(entries.filter(([book]) => !isOtBook(book as string))) }, otProgress: Object.fromEntries(entries.filter(([book]) => isOtBook(book as string))), copy: { ...g.copy, copied: books } }
}

describe('장별 빈칸 퀴즈', () => {
  it('완성하지 않은 장은 출제와 보상을 막는다', () => {
    const s = copied({})
    expect(makeBlankQuiz(s, CONTENT, 1, target)).toEqual([])
    expect(finishBlankQuiz(s, target, 10, 10)).toBe(s)
  })
  it('선택한 장에서만 정확히 10문제를 출제하고 본문과 정답을 보존한다', () => {
    const s = copied({ lk: [1, 2], mk: [1] })
    expect(copiedChapters(s)).toHaveLength(3)
    const qs = makeBlankQuiz(s, CONTENT, 7, target)
    expect(qs).toHaveLength(BLANK_QUIZ_SIZE)
    for (const q of qs) {
      expect(blankChapterKey(q)).toBe('lk:1')
      expect(q.options).toContain(q.answer)
      expect(q.options.length).toBeGreaterThanOrEqual(3)
      const text = copyVerses(q.book, q.chapter, CONTENT).find(v => v.verse === q.verse)!.text
      expect(q.words.join(' ')).toBe(text.split(/\s+/).join(' '))
      expect(q.words[q.index]).toBe(q.answer)
    }
    expect(new Set(qs.map(q => q.verse)).size).toBe(10)
  })
  it('두 절짜리 구약 장도 다른 장을 섞지 않고 10문제를 낸다', async () => {
    await ensureOtBook('psa')
    const t = { book: 'psa' as const, chapter: 117 }
    const qs = makeBlankQuiz(copied({ psa: [117] }), CONTENT, 9, t)
    expect(qs).toHaveLength(10)
    for (const q of qs) expect(blankChapterKey(q)).toBe('psa:117')
  })
  it('첫 완주만 보상하고 재풀이·다음 날·저장 재접속에서도 다시 지급하지 않는다', () => {
    let s = finishBlankQuiz(copied({ lk: [1] }), target, 10, 10)
    expect(s.coins).toBe(10 * BLANK_COIN + BLANK_PERFECT)
    expect(blankQuizRewarded(s, target)).toBe(true)
    const back = deserialize(serialize(s), CONTENT)!
    s = { ...back, clock: { ...back.clock, day: back.clock.day + 1 } }
    for (let i = 0; i < 10; i++) s = finishBlankQuiz(s, target, 10, 10)
    expect(s.coins).toBe(110)
    expect(s.flags.blankQuizRounds).toBe(11)
  })
  it('0점인 첫 완주도 보상 기회를 사용하고 다른 장에는 각각 한 번 지급한다', () => {
    let s = finishBlankQuiz(copied({ lk: [1, 2] }), target, 0, 10)
    expect(blankQuizRewarded(s, target)).toBe(true)
    s = finishBlankQuiz(s, target, 10, 10)
    expect(s.coins).toBe(0)
    s = finishBlankQuiz(s, { book: 'lk', chapter: 2 }, 7, 10)
    expect(s.coins).toBe(70)
  })
  it('예전 총 퀴즈 기록과 가진 돈을 보존하며 장별 기록은 새로 시작한다', () => {
    const base = copied({ lk: [1] })
    const s = finishBlankQuiz({ ...base, coins: 600, flags: { ...base.flags, blankQuizRounds: 10, blankQuizRight: 50 } }, target, 10, 10)
    expect(s.coins).toBe(710)
    expect(s.flags.blankQuizRounds).toBe(11)
  })
  it('10문제를 마쳐야 정산하고 범위를 벗어난 점수로 돈을 받을 수 없다', () => {
    const s = copied({ lk: [1] })
    for (const [correct, total] of [[5, 5], [11, 10], [-1, 10], [1.5, 10], [NaN, 10]]) {
      expect(finishBlankQuiz(s, target, correct, total)).toBe(s)
      expect(blankQuizPay(correct, total)).toBe(0)
    }
    expect(blankQuizPay(3, 10)).toBe(30)
  })
})

// 빈칸 퀴즈 (2026-10-14 사용자): 처음부터, 필사한 장 어디서든, 판수 제한 없이
import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { BLANK_COIN, BLANK_PERFECT, blankQuizPay, copiedChapters, finishBlankQuiz, makeBlankQuiz } from './blank-quiz'
import { copyVerses } from './copying'
import { newGame, type GameState } from './game'

const copied = (books: Record<string, number[]>): GameState => {
  const g = newGame(CONTENT)
  return { ...g, copy: { ...g.copy, copied: books } }
}

describe('빈칸 퀴즈', () => {
  it('필사한 장이 없으면 문제가 없고, 있으면 그 장들에서만 5문제가 나온다', () => {
    expect(makeBlankQuiz(copied({}), CONTENT, 1)).toEqual([])
    const s = copied({ lk: [1, 2], mk: [1] })
    expect(copiedChapters(s)).toHaveLength(3)
    const qs = makeBlankQuiz(s, CONTENT, 7)
    expect(qs).toHaveLength(5)
    for (const q of qs) {
      expect(['lk:1', 'lk:2', 'mk:1']).toContain(`${q.book}:${q.chapter}`)
      expect(q.options).toContain(q.answer)
      expect(q.options.length).toBeGreaterThanOrEqual(3)
      // 빈칸 낱말은 그 절 본문 그대로의 낱말
      const text = copyVerses(q.book, q.chapter, CONTENT).find((v) => v.verse === q.verse)!.text
      expect(text.split(/\s+/)[q.index]).toBe(q.answer)
    }
    // 같은 판에 같은 절이 두 번 나오지 않는다
    expect(new Set(qs.map((q) => `${q.book}:${q.chapter}:${q.verse}`)).size).toBe(qs.length)
  })
  it('맞힌 문제마다 10닢, 다 맞히면 10닢 더 — 판수 제한 없이 매번 받는다', () => {
    expect(blankQuizPay(3, 5)).toBe(3 * BLANK_COIN)
    expect(blankQuizPay(5, 5)).toBe(5 * BLANK_COIN + BLANK_PERFECT)
    let s = copied({ lk: [1] })
    const before = s.coins
    for (let i = 0; i < 10; i++) s = finishBlankQuiz(s, 5, 5)
    expect(s.coins - before).toBe(10 * (5 * BLANK_COIN + BLANK_PERFECT))
    expect(s.flags.blankQuizRounds).toBe(10)
  })
})

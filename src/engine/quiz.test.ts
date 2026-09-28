import { CONTENT, QUIZ_SOURCE, pieceById } from '../content/catalog'
import { mulberry32 } from './offers'
import { buildQuiz, detectiveAnswer, isCorrect, QUIZ_SIZE, wordsOf, type Question } from './quiz'

const norm = (s: string) => s.replace(/\s+/g, '')

function allQuizzes(seed: number): [number, Question[]][] {
  return Array.from({ length: 24 }, (_, i) => [i + 1, buildQuiz(CONTENT.pieces, i + 1, mulberry32(seed + i), QUIZ_SOURCE)])
}

describe('기록 퀴즈', () => {
  it('스물네 장 모두 다섯 문제가 나오고, 형식이 섞인다', () => {
    for (const seed of [1, 7, 42]) {
      for (const [ch, qs] of allQuizzes(seed)) {
        expect(qs, `${ch}장`).toHaveLength(QUIZ_SIZE)
        expect(new Set(qs.map((q) => q.kind)).size, `${ch}장`).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('모든 문제는 그 장(또는 앞뒤 장)의 본문에서 나오고, 정답이 정확히 하나다', () => {
    for (const seed of [1, 7, 42, 99]) {
      for (const [ch, qs] of allQuizzes(seed)) {
        for (const q of qs) {
          const where = `${ch}장 ${q.kind}`
          if (q.kind === 'puzzle') {
            const v = QUIZ_SOURCE.versesOf(q.ref)[0]
            expect(q.answer.join(' ')).toBe(wordsOf(v.text).join(' '))
            expect([...q.words].sort()).toEqual([...q.answer].sort())
            expect(q.words.join(' '), where).not.toBe(q.answer.join(' '))
            expect(QUIZ_SOURCE.countVerse(v.text), where).toBe(1)
            expect(isCorrect(q, q.answer)).toBe(true)
          } else if (q.kind === 'blank') {
            const v = QUIZ_SOURCE.versesOf(q.ref)[0]
            expect([q.before, q.answer, q.after].filter(Boolean).join(' ')).toBe(v.text.trim().split(/\s+/).join(' '))
            expect(new Set(q.options.map(norm)).size, where).toBe(4)
            // 다른 보기로 채운 문장은 누가복음 어디에도 없다 → 정답은 하나
            for (const o of q.options.filter((x) => x !== q.answer)) expect(QUIZ_SOURCE.countVerse([q.before, o, q.after].filter(Boolean).join(' ')), where).toBe(0)
          } else if (q.kind === 'detective') {
            const p = pieceById(q.pieceId)
            expect(p.chapter).toBe(ch)
            expect(p.stamps.some((s) => s.kind === 'similar'), where).toBe(false)
            expect(q.answer).toContain('lk')
            expect(q.answer).toEqual(detectiveAnswer(p))
          } else if (q.kind === 'verse') {
            expect(new Set(q.options).size).toBe(3)
            const [c] = q.ref.replace('눅 ', '').split(':').map(Number)
            const answer = pieceById(q.answer)
            expect(answer.chapter).toBe(c)
            // 절이 정답 조각 안에 있다
            expect(QUIZ_SOURCE.versesOf(answer.ref).some((v) => v.ref === q.ref), where).toBe(true)
            for (const o of q.options.filter((x) => x !== q.answer)) expect(QUIZ_SOURCE.versesOf(pieceById(o).ref).some((v) => v.ref === q.ref)).toBe(false)
          } else {
            expect(q.options).toHaveLength(2)
            expect(q.answer).toBe([...q.options].sort()[0])
            for (const o of q.options) expect(pieceById(o).chapter).toBe(ch)
          }
        }
      }
    }
  })

  it('탐정: 누가복음은 늘 답에 있고, 같은 이야기 도장의 복음서가 더해진다', () => {
    expect(detectiveAnswer(pieceById('lk-015-008'))).toEqual(['lk'])
    expect(detectiveAnswer(pieceById('lk-009-010'))).toEqual(['mt', 'mk', 'lk', 'jn'])
    // 비슷한 이야기가 있는 조각은 탐정 문제로 쓰지 않는다
    expect(detectiveAnswer(pieceById('lk-015-001'))).toBeNull()
  })

  it('정답 판정', () => {
    const q: Question = { kind: 'detective', pieceId: 'x', options: ['mt', 'mk', 'lk', 'jn'], answer: ['mt', 'lk'] }
    expect(isCorrect(q, ['lk', 'mt'])).toBe(true)
    expect(isCorrect(q, ['lk'])).toBe(false)
    const o: Question = { kind: 'order', options: ['a', 'b'], answer: 'a' }
    expect(isCorrect(o, 'a')).toBe(true)
    expect(isCorrect(o, 'b')).toBe(false)
  })
})

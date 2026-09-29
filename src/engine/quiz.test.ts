import { BOOKS_WITH_CONTENT, CONTENT, pieceById, piecesOf, quizSourceFor } from '../content/catalog'
import { chaptersOf } from './books'
import { mulberry32 } from './offers'
import { buildQuiz, detectiveAnswer, isCorrect, QUIZ_SIZE, quizzable, wordsOf, type Question } from './quiz'

const norm = (s: string) => s.replace(/\s+/g, '')

/** 조각이 있는 책마다, 장마다 퀴즈 하나: [이름, 문제, 그 책의 본문, 장] */
function allQuizzes(seed: number): [string, Question[], ReturnType<typeof quizSourceFor>, number][] {
  return BOOKS_WITH_CONTENT.flatMap((b) =>
    chaptersOf(b, CONTENT).map((ch, i) => {
      const src = quizSourceFor([b])
      return [`${b} ${ch}장`, buildQuiz(piecesOf(b), ch, mulberry32(seed + i), src), src, ch] as [string, Question[], typeof src, number]
    }),
  )
}

describe('기록 퀴즈', () => {
  it('조각이 있는 책의 모든 장에서 다섯 문제가 나오고, 형식이 섞인다', () => {
    for (const seed of [1, 7, 42]) {
      for (const [name, qs] of allQuizzes(seed)) {
        expect(qs, name).toHaveLength(QUIZ_SIZE)
        expect(new Set(qs.map((q) => q.kind)).size, name).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('모든 문제는 그 장(또는 앞뒤 장)의 본문에서 나오고, 정답이 정확히 하나다', () => {
    for (const seed of [1, 7, 42, 99]) {
      for (const [name, qs, src, ch] of allQuizzes(seed)) {
        for (const q of qs) {
          const where = `${name} ${q.kind}`
          if (q.kind === 'puzzle') {
            const v = src.versesOf(q.ref)[0]
            expect(q.answer.join(' ')).toBe(wordsOf(v.text).join(' '))
            expect([...q.words].sort()).toEqual([...q.answer].sort())
            expect(q.words.join(' '), where).not.toBe(q.answer.join(' '))
            expect(src.countVerse(v.text), where).toBe(1)
            expect(isCorrect(q, q.answer)).toBe(true)
          } else if (q.kind === 'blank') {
            const v = src.versesOf(q.ref)[0]
            expect([q.before, q.answer, q.after].filter(Boolean).join(' ')).toBe(v.text.trim().split(/\s+/).join(' '))
            expect(new Set(q.options.map(norm)).size, where).toBe(4)
            // 다른 보기로 채운 문장은 그 책 어디에도 없다 → 정답은 하나
            for (const o of q.options.filter((x) => x !== q.answer)) expect(src.countVerse([q.before, o, q.after].filter(Boolean).join(' ')), where).toBe(0)
          } else if (q.kind === 'detective') {
            const p = pieceById(q.pieceId)
            expect(p.chapter).toBe(ch)
            expect(p.stamps.some((s) => s.kind === 'similar'), where).toBe(false)
            expect(q.answer).toContain(p.book)
            expect(q.answer).toEqual(detectiveAnswer(p))
          } else if (q.kind === 'verse') {
            expect(new Set(q.options).size).toBe(3)
            const [c] = q.ref.split(' ')[1].split(':').map(Number)
            const answer = pieceById(q.answer)
            expect(answer.chapter).toBe(c)
            // 절이 정답 조각 안에 있다
            expect(src.versesOf(answer.ref).some((v) => v.ref === q.ref), where).toBe(true)
            for (const o of q.options.filter((x) => x !== q.answer)) expect(src.versesOf(pieceById(o).ref).some((v) => v.ref === q.ref)).toBe(false)
          } else {
            expect(q.options).toHaveLength(2)
            expect(q.answer).toBe([...q.options].sort()[0])
            for (const o of q.options) expect(pieceById(o).chapter).toBe(ch)
          }
        }
      }
    }
  })

  it('탐정: 그 조각의 책은 늘 답에 있고, 같은 이야기 도장의 복음서가 더해진다', () => {
    expect(detectiveAnswer(pieceById('lk-015-008'))).toEqual(['lk'])
    expect(detectiveAnswer(pieceById('lk-009-010'))).toEqual(['mt', 'mk', 'lk', 'jn'])
    // 비슷한 이야기가 있는 조각은 탐정 문제로 쓰지 않는다
    expect(detectiveAnswer(pieceById('lk-015-001'))).toBeNull()
    // 막 1:9-11은 요한 쪽이 "비슷한 이야기"(~요 1:29-34)라 탐정 문제에 쓰지 않는다
    expect(detectiveAnswer(pieceById('mk-001-009'))).toBeNull()
    // 막 2:1-12는 =마 9:1-8; =눅 5:17-26
    expect(detectiveAnswer(pieceById('mk-002-001'))).toEqual(['mt', 'mk', 'lk'])
  })

  it('괄호 절은 문제로 쓰지 않는다', () => {
    expect(quizzable('(없음)')).toBe(false)
    expect(quizzable('[예수께서 안식후 첫날 이른 아침에')).toBe(false)
    expect(quizzable('저희가 [그에게 경배하고] 큰 기쁨으로')).toBe(false)
    expect(quizzable('어느 여자가 열 드라크마가 있는데')).toBe(true)
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

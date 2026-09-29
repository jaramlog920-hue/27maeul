import { BOOKS_WITH_CONTENT, inBrackets, pieceById, pieceOfVerse, piecesOf, quizSourceFor } from '../content/catalog'
import { mulberry32 } from './offers'
import { buildLibraryQuiz, detectiveAnswer, QUIZ_SIZE, quizzable } from './quiz'
import { BOOKS, type Book } from './types'

const norm = (s: string) => s.replace(/\s+/g, '')
const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1)
function subsets<T>(xs: readonly T[]): T[][] {
  return xs.reduce<T[][]>((acc, x) => [...acc, ...acc.map((s) => [...s, x])], [[]]).filter((s) => s.length > 0)
}

describe('서고 퀴즈', () => {
  // 설계 §3.5: 네 권의 모든 조합(지금은 조각이 있는 책의 모든 조합) × 지금 꽂는 책
  for (const pool of subsets(BOOKS_WITH_CONTENT)) {
    for (const current of pool) {
      it(`서고 ${pool.join('+')}에 ${current}를 꽂을 때 — 문제는 출제 범위에서, 정답은 하나`, () => {
        const src = quizSourceFor(pool)
        const options = BOOKS.filter((b) => pool.includes(b))
        for (const seed of SEEDS) {
          const qs = buildLibraryQuiz({ current, pool, piecesOf, rng: mulberry32(seed), src })
          expect(qs, `seed ${seed}`).toHaveLength(QUIZ_SIZE)
          if (pool.length === 1) expect(qs.some((q) => q.kind === 'book' || q.kind === 'detective')).toBe(false)
          for (const q of qs) {
            const where = `${pool.join('+')}/${current}/${seed} ${q.kind}`
            if (q.kind === 'book') {
              const text = src.versesOf(q.ref)[0].text
              expect(q.options, where).toEqual(options)
              expect(quizzable(text, inBrackets(q.ref)), where).toBe(true)
              expect(src.countVerse(text), where).toBe(1)
              expect(pieceOfVerse(q.ref)?.book, where).toBe(q.answer)
              expect(pool, where).toContain(q.answer)
            } else if (q.kind === 'detective') {
              const p = pieceById(q.pieceId)
              expect(p.book, where).toBe(current)
              expect(q.options, where).toEqual(options)
              expect(q.answer, where).toEqual(detectiveAnswer(p)!.filter((g) => pool.includes(g)))
            } else if (q.kind === 'puzzle') {
              const text = src.versesOf(q.ref)[0].text
              expect(quizzable(text, inBrackets(q.ref)), where).toBe(true)
              expect(src.countVerse(text), where).toBe(1)
              expect(pieceOfVerse(q.ref)?.book, where).toBe(current)
            } else if (q.kind === 'blank') {
              const text = [q.before, q.answer, q.after].filter(Boolean).join(' ')
              expect(quizzable(text, inBrackets(q.ref)), where).toBe(true)
              expect(src.countVerse(text), where).toBe(1)
              expect(pieceOfVerse(q.ref)?.book, where).toBe(current)
              expect(new Set(q.options.map(norm)).size, where).toBe(4)
              for (const o of q.options.filter((x) => x !== q.answer)) expect(src.countVerse([q.before, o, q.after].filter(Boolean).join(' ')), where).toBe(0)
            } else if (q.kind === 'verse') {
              expect(pieceById(q.answer).book, where).toBe(current)
              for (const o of q.options) expect(pieceById(o).book, where).toBe(current)
            } else {
              for (const o of q.options) expect(pieceById(o).book, where).toBe(current)
              expect(q.answer).toBe([...q.options].sort()[0])
            }
          }
        }
      })
    }
  }

  it('서고에 다른 책이 있으면 "어느 책?" 문제가 나온다', () => {
    const pool: Book[] = ['mk', 'lk']
    for (const seed of [1, 2, 3]) {
      const qs = buildLibraryQuiz({ current: 'lk', pool, piecesOf, rng: mulberry32(seed), src: quizSourceFor(pool) })
      expect(qs.filter((q) => q.kind === 'book').length).toBeGreaterThanOrEqual(1)
    }
  })
})

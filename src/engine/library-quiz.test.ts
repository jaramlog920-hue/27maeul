import { BOOKS_WITH_CONTENT, inBrackets, pieceById, pieceOfVerse, piecesOf, quizSourceFor } from '../content/catalog'
import { mulberry32 } from './offers'
import { buildLibraryQuiz, detectiveAnswer, QUIZ_SIZE, quizzable } from './quiz'
import type { Grade } from './library'
import { poolFor } from './library'
import { BOOKS, type Book } from './types'
import { lockedTiles, lockedZones, ZONES } from './world'

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

  it('괄호 조각(막 16:9-20)은 서고 퀴즈의 문제·보기·정답 어디에도 나오지 않는다', () => {
    const bracket = ['mk-016-009', 'mk-016-012', 'mk-016-014', 'mk-016-019']
    for (const pool of [['mk'], ['mk', 'lk']] as Book[][]) {
      const src = quizSourceFor(pool)
      for (let seed = 1; seed <= 200; seed++) {
        for (const q of buildLibraryQuiz({ current: 'mk', pool, piecesOf, rng: mulberry32(seed), src })) {
          const ids = q.kind === 'detective' ? [q.pieceId] : q.kind === 'order' || q.kind === 'verse' ? [...q.options, q.answer] : [pieceOfVerse(q.ref)!.id]
          for (const id of ids) expect(bracket, `${pool.join('+')} seed ${seed} ${q.kind}`).not.toContain(id)
        }
      }
    }
  })

  it('마 6:13(둥근 괄호 송영)은 서고 퀴즈의 문제·보기·정답에 나오지 않는다', () => {
    for (const pool of [['mt'], ['mt', 'mk', 'lk']] as Book[][]) {
      const src = quizSourceFor(pool)
      for (let seed = 1; seed <= 200; seed++) {
        for (const q of buildLibraryQuiz({ current: 'mt', pool, piecesOf, rng: mulberry32(seed), src })) {
          const where = `${pool.join('+')} seed ${seed} ${q.kind}`
          if ('ref' in q) expect(q.ref, where).not.toBe('마 6:13')
          if (q.kind === 'blank') for (const o of q.options) expect(/[()]/.test(o), `${where} ${o}`).toBe(false)
        }
      }
    }
  })

  it('네 권을 차례로 꽂으면 구역이 하나씩 열리고, 4권째에 대장간이 열린다', () => {
    let shelved: Partial<Record<Book, Grade>> = {}
    const seen: string[][] = []
    BOOKS_WITH_CONTENT.forEach((b, i) => {
      shelved = { ...shelved, [b]: 2 }
      const n = Object.keys(shelved).length
      expect(n).toBe(i + 1)
      expect(lockedZones(n).map((z) => z.id)).toEqual(ZONES.filter((z) => z.books > n).map((z) => z.id))
      seen.push(ZONES.filter((z) => z.books <= n).map((z) => z.id))
    })
    expect(seen[2]).not.toContain('forge')
    expect(seen[3]).toEqual(['vineyard', 'dock', 'hives', 'forge'])
    const smith = ZONES.find((z) => z.id === 'forge')!
    expect(lockedTiles(3).has(`${smith.x0},${smith.y0}`)).toBe(true)
    expect(lockedTiles(4).has(`${smith.x0},${smith.y0}`)).toBe(false)
    expect(poolFor(shelved, 'jn')).toEqual(['mt', 'mk', 'lk', 'jn'])
  })

  it('네 권이 서고에 있으면 탐정 문제가 네 복음서 모두에서, 네 방향으로 나온다', () => {
    const pool: Book[] = ['mt', 'mk', 'lk', 'jn']
    const src = quizSourceFor(pool)
    const partners = new Set<string>()
    for (const current of pool) {
      let found = 0
      for (let seed = 1; seed <= 60; seed++) {
        for (const q of buildLibraryQuiz({ current, pool, piecesOf, rng: mulberry32(seed), src })) {
          if (q.kind !== 'detective') continue
          found++
          expect(q.answer).toContain(current)
          expect(q.options).toEqual(['mt', 'mk', 'lk', 'jn'])
          for (const g of q.answer) if (g !== current) partners.add(`${current}>${g}`)
        }
      }
      expect(found, `${current} 탐정 문제`).toBeGreaterThan(0)
    }
    // 어느 복음서에서 시작해도 나머지 세 복음서 쪽으로 이어지는 문제가 있다
    for (const a of pool) for (const b of pool) if (a !== b) expect(partners.has(`${a}>${b}`), `${a}>${b}`).toBe(true)
  })

  it('서고에 다른 책이 있으면 "어느 책?" 문제가 나온다', () => {
    const pool: Book[] = ['mk', 'lk']
    for (const seed of [1, 2, 3]) {
      const qs = buildLibraryQuiz({ current: 'lk', pool, piecesOf, rng: mulberry32(seed), src: quizSourceFor(pool) })
      expect(qs.filter((q) => q.kind === 'book').length).toBeGreaterThanOrEqual(1)
    }
  })
})

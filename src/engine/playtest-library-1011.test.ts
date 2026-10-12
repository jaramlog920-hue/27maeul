// 2026-10-11 서고·필사 점검(docs/playtest-서고필사-2026-10-11.md)에서 찾은 버그의 회귀 검사
import { describe, expect, it } from 'vitest'
import { JOURNEY } from '../content/catalog'
import { boardInOrder, journeyComplete } from './journey'

describe('1. 여정 판: 같은 이름 카드끼리는 자리를 바꿔도 된다', () => {
  it('예루살렘 두 장만 서로 바뀐 판도 순서가 맞고 완성이다', () => {
    const jer = JOURNEY.filter((c) => c.place === '예루살렘')
    expect(jer.length).toBeGreaterThan(1)
    const orders = JOURNEY.map((c) => c.order)
    const i = orders.indexOf(jer[0].order), j = orders.indexOf(jer[1].order)
    ;[orders[i], orders[j]] = [orders[j], orders[i]]
    expect(boardInOrder(orders, JOURNEY)).toBe(true)
    expect(journeyComplete(orders, JOURNEY)).toBe(true)
  })
  it('이름이 다른 카드가 바뀌면 여전히 어긋남', () => {
    const orders = JOURNEY.map((c) => c.order)
    const k = orders.findIndex((_, n) => n > 0 && JOURNEY[n].place !== JOURNEY[n - 1].place)
    ;[orders[k - 1], orders[k]] = [orders[k], orders[k - 1]]
    expect(boardInOrder(orders, JOURNEY)).toBe(false)
    expect(journeyComplete(orders, JOURNEY)).toBe(false)
  })
})

import { LETTER_OPENINGS, piecesOf, quizSourceFor } from '../content/catalog'
import { mulberry32 } from './offers'
import { buildLibraryQuiz, wordsOf, type Question } from './quiz'
import { isContentWord } from './word-options'
import { LETTERS, type Book } from './types'

const SEEDS = Array.from({ length: 12 }, (_, i) => i + 1)
function quizzes(current: Book, pool: Book[]): Question[][] {
  return SEEDS.map((seed) => buildLibraryQuiz({ current, pool, piecesOf, rng: mulberry32(seed), src: quizSourceFor(pool), openings: LETTER_OPENINGS }))
}
const last = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, '').slice(-1)

describe('3. 복음서·사도행전·요한계시록 빈칸도 끝말로 답이 드러나지 않게', () => {
  it('답은 내용 낱말이고, 보기 가운데 답과 끝 글자가 같은 것이 대부분 있다', () => {
    const blanks: Extract<Question, { kind: 'blank' }>[] = []
    for (const b of ['mt', 'mk', 'lk', 'jn', 'ac', 'rev'] as Book[])
      for (const q of quizzes(b, ['mt', 'mk', 'lk', 'jn', 'ac', 'rev'])) for (const x of q) if (x.kind === 'blank') blanks.push(x)
    expect(blanks.length).toBeGreaterThan(20)
    for (const q of blanks) expect(isContentWord(q.answer), `${q.ref} ${q.answer}`).toBe(true)
    const shared = blanks.filter((q) => q.options.some((o) => o !== q.answer && last(o) === last(q.answer)))
    expect(shared.length / blanks.length).toBeGreaterThan(0.8)
  })
})

describe('4. 한 퀴즈에 같은 이야기가 순서 문제로 두 번 나오지 않는다', () => {
  it('순서 문제끼리 정답 조각이 겹치지 않는다', () => {
    for (const b of ['mt', 'mk', 'lk', 'jn'] as Book[])
      for (const q of quizzes(b, [b])) {
        const answers = q.filter((x) => x.kind === 'order').map((x) => x.answer)
        expect(new Set(answers).size, `${b} ${answers}`).toBe(answers.length)
      }
  })
})

describe('5. 편지 끝인사 절은 편지 빈칸 문제로 쓰지 않는다', () => {
  it('각 편지 마지막 절이 빈칸 문제로 나오지 않는다', () => {
    for (const b of LETTERS) {
      const ps = piecesOf(b)
      const verses = quizSourceFor([b]).versesOf(ps[ps.length - 1].ref)
      const lastRef = verses[verses.length - 1].ref
      for (const q of quizzes(b, [b])) for (const x of q) if (x.kind === 'blank') expect(x.ref, b).not.toBe(lastRef)
    }
  })
})
void wordsOf

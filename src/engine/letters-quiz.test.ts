// 편지 서고 퀴즈 (계획 7 작업 6): 어느 책?(보기 다섯 권까지)·첫머리의 이름·빈칸·먼저 나오는 구절. 탐정·도장 없음.
import { BOOK_ABBR, inBrackets, LETTER_OPENINGS, noText, pieceOfQuestion, pieceOfVerse, piecesOf, quizSourceFor, versesOf } from '../content/catalog'
import { mulberry32 } from './offers'
import { buildLibraryQuiz, MAX_BOOK_OPTIONS, QUIZ_SIZE, quizzable, type Question } from './quiz'
import { roomOf } from './shelf-rooms'
import { BOOKS, GOSPELS, LETTERS, type Book, type Letter } from './types'

const norm = (s: string) => s.replace(/\s+/g, '')
const SEEDS = [1, 2, 3, 4, 5, 6]
const FIVE: Book[] = ['mt', 'mk', 'lk', 'jn', 'ac']

/** 테스트가 따로 구하는 첫머리 구절: 1장 1절부터 letters.json에 적힌 가장 뒤 구절까지 (띄어쓰기 뺀 본문) */
function openingText(book: Letter): string {
  const rows = LETTER_OPENINGS.filter((o) => o.book === book)
  const last = Math.max(...rows.map((o) => Number(/1:(\d+)(?:-(\d+))?$/.exec(o.ref)!.slice(1).filter(Boolean).pop())))
  return norm(versesOf(`${BOOK_ABBR[book]} 1:1-${last}`).map((v) => v.text).join(''))
}
const refOrder = (ref: string) => {
  const [, c, v] = /(\d+):(\d+)$/.exec(ref)!
  return Number(c) * 1000 + Number(v)
}

function check(qs: Question[], current: Letter, pool: Book[], where: string) {
  const src = quizSourceFor(pool)
  expect(qs, where).toHaveLength(QUIZ_SIZE)
  for (const q of qs) {
    const w = `${where} ${q.kind}`
    expect(['detective', 'order', 'verse'], w).not.toContain(q.kind)
    if (q.kind === 'book') {
      const text = src.versesOf(q.ref)[0].text
      expect(q.options.length, w).toBeLessThanOrEqual(MAX_BOOK_OPTIONS)
      expect(q.options, w).toContain(q.answer)
      for (const o of q.options) expect(pool, w).toContain(o)
      expect(q.options, w).toEqual(BOOKS.filter((b) => q.options.includes(b)))
      expect(quizzable(text, inBrackets(q.ref)), w).toBe(true)
      expect(noText(text), w).toBe(false)
      expect(src.countVerse(text), w).toBe(1)
      expect(pieceOfVerse(q.ref)?.book, w).toBe(q.answer)
    } else if (q.kind === 'opening') {
      expect(q.book, w).toBe(current)
      const names = LETTER_OPENINGS.filter((o) => o.book === current && o.role === q.role).map((o) => o.name)
      expect(names, w).toContain(q.answer)
      expect(LETTER_OPENINGS.find((o) => o.book === current && o.role === q.role && o.name === q.answer)!.ref, w).toBe(q.ref)
      expect(q.options, w).toHaveLength(4)
      expect(new Set(q.options).size, w).toBe(4)
      expect(q.options, w).toContain(q.answer)
      const opening = openingText(current)
      expect(opening, w).toContain(q.answer)
      for (const o of q.options.filter((x) => x !== q.answer)) {
        // 오답 이름은 이 편지 첫머리 구절 어디에도 없고, 다른 편지의 같은 칸 이름이다
        expect(opening.includes(norm(o)), `${w} ${o}`).toBe(false)
        expect(LETTER_OPENINGS.some((x) => x.book !== current && x.role === q.role && x.name === o), `${w} ${o}`).toBe(true)
      }
    } else if (q.kind === 'verseOrder') {
      expect(q.options, w).toHaveLength(2)
      const [a, b] = q.options
      expect(a.split(':')[0], w).not.toBe(b.split(':')[0]) // 서로 다른 장
      for (const r of q.options) {
        const text = src.versesOf(r)[0].text
        expect(pieceOfVerse(r)?.book, w).toBe(current)
        expect(quizzable(text, inBrackets(r)), w).toBe(true)
        expect(noText(text), w).toBe(false)
        expect(src.countVerse(text), w).toBe(1)
      }
      expect(q.answer, w).toBe([...q.options].sort((x, y) => refOrder(x) - refOrder(y))[0])
    } else if (q.kind === 'blank') {
      const text = [q.before, q.answer, q.after].filter(Boolean).join(' ')
      expect(quizzable(text, inBrackets(q.ref)), w).toBe(true)
      expect(src.countVerse(text), w).toBe(1)
      expect(pieceOfVerse(q.ref)?.book, w).toBe(current)
      expect(new Set(q.options.map(norm)).size, w).toBe(4)
      for (const o of q.options.filter((x) => x !== q.answer)) expect(src.countVerse([q.before, o, q.after].filter(Boolean).join(' ')), w).toBe(0)
    } else if (q.kind === 'puzzle') {
      const text = src.versesOf(q.ref)[0].text
      expect(quizzable(text, inBrackets(q.ref)), w).toBe(true)
      expect(src.countVerse(text), w).toBe(1)
      expect(pieceOfVerse(q.ref)?.book, w).toBe(current)
    }
  }
}

describe('편지 서고 퀴즈', () => {
  for (const current of LETTERS) {
    const pools: [string, Book[]][] = [
      ['그 책만', [current]],
      ['다섯 권 + 그 책', BOOKS.filter((b) => FIVE.includes(b) || b === current)],
      ['서고 전부', [...BOOKS]],
    ]
    for (const [name, pool] of pools) {
      it(`${current} — ${name}: 다섯 문제, 탐정·장 조각 문제 없음, 문장은 범위에서 유일, 첫머리 오답은 첫머리에 없음`, () => {
        const src = quizSourceFor(pool)
        for (const seed of SEEDS) {
          const qs = buildLibraryQuiz({ current, pool, piecesOf, rng: mulberry32(seed), src, openings: LETTER_OPENINGS })
          check(qs, current, pool, `${current}/${name}/${seed}`)
        }
      })
    }
  }

  it('첫머리 문제가 실제로 나온다 (로마서 보낸 이, 디모데전서 받는 사람 등)', () => {
    const seen = new Set<string>()
    for (const current of LETTERS)
      for (let seed = 1; seed <= 30; seed++)
        for (const q of buildLibraryQuiz({ current, pool: [current], piecesOf, rng: mulberry32(seed), src: quizSourceFor([current]), openings: LETTER_OPENINGS }))
          if (q.kind === 'opening') seen.add(`${q.book}:${q.role}`)
    expect(seen).toContain('rom:from')
    expect(seen).toContain('rom:toPlace')
    expect(seen).toContain('1ti:toPerson')
    // 데살로니가전서 보낸 이(바울·실루아노·디모데)는 오답 셋을 못 채워 내지 않는다
    expect(seen).not.toContain('1th:from')
  })

  it('먼저 나오는 구절 문제가 여러 장짜리 편지에서 나오고, 빌레몬서(한 장)에서는 나오지 않는다', () => {
    let found = 0
    for (let seed = 1; seed <= 20; seed++) {
      for (const q of buildLibraryQuiz({ current: 'rom', pool: ['rom'], piecesOf, rng: mulberry32(seed), src: quizSourceFor(['rom']), openings: LETTER_OPENINGS }))
        if (q.kind === 'verseOrder') found++
      for (const q of buildLibraryQuiz({ current: 'phm', pool: ['phm'], piecesOf, rng: mulberry32(seed), src: quizSourceFor(['phm']), openings: LETTER_OPENINGS }))
        expect(q.kind).not.toBe('verseOrder')
    }
    expect(found).toBeGreaterThan(0)
  })

  it('롬 9:2(본문이 앞 절에 포함)·롬 16:24(없음)는 어떤 문제에도 나오지 않는다', () => {
    for (const pool of [['rom'], [...BOOKS]] as Book[][]) {
      for (let seed = 1; seed <= 40; seed++) {
        for (const q of buildLibraryQuiz({ current: 'rom', pool, piecesOf, rng: mulberry32(seed), src: quizSourceFor(pool), openings: LETTER_OPENINGS })) {
          const refs = q.kind === 'verseOrder' ? q.options : 'ref' in q ? [q.ref] : []
          for (const r of refs) expect(['롬 9:2', '롬 16:24']).not.toContain(r)
        }
      }
    }
  })

  it('조각 책을 꽂을 때 서고에 편지가 있으면 "어느 책?" 보기는 다섯 권까지, 같은 방 책이 먼저', () => {
    const pool: Book[] = ['mt', 'mk', 'lk', 'jn', 'ac', 'rom', '1co', 'phm']
    const src = quizSourceFor(pool)
    let books = 0
    for (let seed = 1; seed <= 30; seed++) {
      for (const q of buildLibraryQuiz({ current: 'mk', pool, piecesOf, rng: mulberry32(seed), src, openings: LETTER_OPENINGS })) {
        expect(['opening', 'verseOrder']).not.toContain(q.kind)
        if (q.kind !== 'book') continue
        books++
        expect(q.options.length).toBeLessThanOrEqual(MAX_BOOK_OPTIONS)
        expect(q.options).toContain(q.answer)
        const same = pool.filter((b) => roomOf(b).id === roomOf(q.answer).id)
        // 같은 방 책이 다섯 권 안에 다 들어가면 모두 보기에 있다
        if (same.length <= MAX_BOOK_OPTIONS) for (const b of same) expect(q.options).toContain(b)
        else for (const o of q.options) expect(same).toContain(o)
      }
    }
    expect(books).toBeGreaterThan(0)
    // 복음서를 꽂을 때: 네 복음서 + 다른 방 한 권
    for (let seed = 1; seed <= 10; seed++)
      for (const q of buildLibraryQuiz({ current: 'jn', pool, piecesOf, rng: mulberry32(seed), src, openings: LETTER_OPENINGS }))
        if (q.kind === 'book' && GOSPELS.includes(q.answer as never)) expect(q.options.filter((b) => GOSPELS.includes(b as never))).toEqual([...GOSPELS])
  })

  it('다섯 권 이하의 출제 범위(복음서·사도행전)는 보기가 출제 범위 전부 그대로', () => {
    const src = quizSourceFor(FIVE)
    for (let seed = 1; seed <= 10; seed++)
      for (const q of buildLibraryQuiz({ current: 'ac', pool: FIVE, piecesOf, rng: mulberry32(seed), src, openings: LETTER_OPENINGS }))
        if (q.kind === 'book') expect(q.options).toEqual(FIVE)
  })

  it('틀린 문제의 다시 읽을 구절: 첫머리는 그 구절의 장, 먼저 나오는 구절은 앞 구절의 장', () => {
    expect(pieceOfQuestion({ kind: 'opening', book: 'rom', role: 'from', ref: '롬 1:1', options: [], answer: '바울' })).toBe('rom-001')
    expect(pieceOfQuestion({ kind: 'verseOrder', options: ['롬 5:1', '롬 3:1'], answer: '롬 3:1' })).toBe('rom-003')
  })
})

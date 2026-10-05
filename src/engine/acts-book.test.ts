// 계획 5 작업 1: 다섯 번째 책(사도행전, 'ac') 자리 — 조각·엮기·서고는 BOOKS(다섯 권), 도장·탐정·"어느 복음서"는 GOSPELS(네 권)
import { BOOKS_WITH_CONTENT, CONTENT, piecesOf, quizSourceFor } from '../content/catalog'
import { emptyProgress, pickableBooks, roomOpen } from './books'
import { chooseBook, newGame, shelvedCount } from './game'
import { jobOf } from './job'
import { gospelRoomFull, poolFor } from './library'
import { mulberry32 } from './offers'
import { buildLibraryQuiz, buildQuiz, detectiveAnswer, QUIZ_SIZE } from './quiz'
import { deserialize, sanitize, serialize } from './save'
import { BOOKS, GOSPELS, isGospel, type Book, type GameContent, type Piece } from './types'

// 사도행전 조각 — 작업 2에서 1–14장, 작업 3에서 15–28장을 넣었다 (content-audit §6-8)
const AC: Piece[] = piecesOf('ac')
const withActs: GameContent = CONTENT

describe('다섯 번째 책 사도행전', () => {
  it('BOOKS는 오늘 신약 순서(사도행전은 다섯째), GOSPELS는 네 복음서', () => {
    expect(BOOKS.slice(0, 5)).toEqual(['mt', 'mk', 'lk', 'jn', 'ac'])
    expect(GOSPELS).toEqual(['mt', 'mk', 'lk', 'jn'])
    expect(isGospel('ac')).toBe(false)
    expect(isGospel('jn')).toBe(true)
    expect(Object.keys(emptyProgress()).slice(0, 5)).toEqual(['mt', 'mk', 'lk', 'jn', 'ac'])
  })

  it('사도행전 조각은 1–28장 전부가 있고, 도장이 없다 (작업 2·3)', () => {
    expect(AC.length).toBeGreaterThan(0)
    expect(BOOKS_WITH_CONTENT).toContain('ac')
    expect(new Set(AC.map((p) => p.chapter))).toEqual(new Set(Array.from({ length: 28 }, (_, i) => i + 1)))
    expect(AC.every((p) => p.stamps.length === 0)).toBe(true)
  })

  it('옛 저장(네 권)을 불러와도 progress.ac가 채워진다', () => {
    const o = JSON.parse(serialize(newGame(CONTENT)))
    const { ac: _drop, ...four } = o.progress
    const back = deserialize(JSON.stringify({ ...o, progress: four }), CONTENT)!
    expect(back.progress.ac).toEqual({ completed: [], arrangement: {} })
  })

  it('불러올 때 사도행전의 진행·서고 칸·책 한 줄을 지키고, 없는 책 키만 거른다', () => {
    const s = newGame(withActs)
    const back = sanitize(
      {
        ...s,
        collected: AC.map((p) => p.id),
        progress: { ...emptyProgress(), ac: { completed: [...new Set(AC.map((p) => p.chapter))], arrangement: {} } },
        shelved: { ac: 1 },
        myLines: { 'book:ac': '길 위의 이야기', 'book:zz': '없는 책' },
      },
      withActs,
    )
    expect(back.progress.ac.completed).toEqual([...new Set(AC.map((p) => p.chapter))])
    expect(back.shelved).toEqual({ ac: 1 })
    expect(back.myLines).toEqual({ 'book:ac': '길 위의 이야기' })
  })

  it('책 고르기: 방은 처음부터 모두 열려 있어 조각이 있는 책이면 사도행전도 처음부터 고른다', () => {
    // 조각이 없는 책은 고를 수 없다
    expect(pickableBooks({}, ['mt', 'mk', 'lk', 'jn'])).toEqual(['mt', 'mk', 'lk', 'jn'])
    expect(pickableBooks({}, BOOKS_WITH_CONTENT)).toContain('ac')
    expect(pickableBooks({}, BOOKS).slice(0, 5)).toEqual(['mt', 'mk', 'lk', 'jn', 'ac'])
    expect(pickableBooks({ gospelFeast: 1 }, BOOKS)).toEqual(pickableBooks({ gospelFeast: 2 }, BOOKS))
  })

  it('탐정 문제는 사도행전을 보기로 내지 않고, 사도행전 조각으로 탐정 문제를 내지 않는다', () => {
    expect(detectiveAnswer(AC[0])).toBeNull()
    const acSrc = quizSourceFor(['ac'])
    for (let seed = 1; seed <= 20; seed++) {
      for (const q of buildQuiz(AC, 1, mulberry32(seed), acSrc)) expect(q.kind).not.toBe('detective')
    }
    const pieces = (b: Book) => (b === 'ac' ? AC : piecesOf(b))
    const pool: Book[] = ['mt', 'mk', 'ac']
    const src = quizSourceFor(pool)
    let books = 0
    for (let seed = 1; seed <= 40; seed++) {
      for (const current of ['mk', 'ac'] as const) {
        for (const q of buildLibraryQuiz({ current, pool, piecesOf: pieces, rng: mulberry32(seed), src })) {
          if (q.kind === 'detective') {
            expect(q.options).not.toContain('ac')
            expect(q.answer).not.toContain('ac')
            expect(current).not.toBe('ac')
          }
          // "어느 책?"은 사도행전도 보기로 낸다 (서고의 책 순서대로)
          if (q.kind === 'book') {
            books++
            expect(q.options).toEqual(['mt', 'mk', 'ac'])
            expect(q.options).toContain(q.answer)
          }
        }
      }
    }
    expect(books).toBeGreaterThan(0)
  })

  it('사도행전 방 열림 판정은 하나 (roomOpen) — 새 게임에서도 열려 있다', () => {
    for (const flags of [{}, { gospelFeast: 1 }, { gospelFeast: 2 }] as const) expect(roomOpen('acts', flags)).toBe(true)
  })

  it('새 게임에서 chooseBook("ac")이 바로 된다 (방이 처음부터 열려 있다)', () => {
    const fresh = newGame(withActs)
    expect(chooseBook(fresh, 'ac', withActs).activeBook).toBe('ac')
    expect(chooseBook(fresh, 'mk', withActs).activeBook).toBe('mk')
  })

  it('불러올 때 고른 책이 사도행전이면 방 표식이 없어도 그대로 둔다', () => {
    const s = { ...newGame(withActs), activeBook: 'ac' as const }
    expect(sanitize(s, withActs).activeBook).toBe('ac')
  })

  it('서고 퀴즈는 탐정을 못 내는 범위(mk만·ac만·mk+ac)에서도 다섯 문제를 채운다', () => {
    const pieces = (b: Book) => (b === 'ac' ? AC : piecesOf(b))
    const cases: [Book, Book[]][] = [
      ['mk', ['mk']],
      ['ac', ['ac']],
      ['mk', ['mk', 'ac']],
      ['ac', ['mk', 'ac']],
    ]
    for (const [current, pool] of cases)
      for (let seed = 1; seed <= 20; seed++) {
        const qs = buildLibraryQuiz({ current, pool, piecesOf: pieces, rng: mulberry32(seed), src: quizSourceFor(pool) })
        expect(qs, `${current} ${pool} seed ${seed}`).toHaveLength(QUIZ_SIZE)
        expect(qs.some((q) => q.kind === 'detective')).toBe(false)
      }
  })

  it('서고 출제 범위는 다섯 권 순서, 직업·복음서 방은 복음서만 세고 마을 구역은 꽂은 책 모두를 센다', () => {
    expect(poolFor({ mk: 1 }, 'ac')).toEqual(['mk', 'ac'])
    const three = { mt: 2, mk: 1, lk: 0, ac: 2 } as const
    expect(shelvedCount({ shelved: three })).toBe(4)
    expect(gospelRoomFull({ shelved: three })).toBe(false)
    expect(gospelRoomFull({ shelved: { ...three, jn: 1 } })).toBe(true)
    expect(jobOf({ lettersDone: 0, shelved: three })).toBe(0)
    expect(jobOf({ lettersDone: 0, shelved: { ...three, jn: 1 } })).toBe(3)
  })
})

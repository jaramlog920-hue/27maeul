// 계획 5 작업 1: 다섯 번째 책(사도행전, 'ac') 자리 — 조각·엮기·서고는 BOOKS(다섯 권), 도장·탐정·"어느 복음서"는 GOSPELS(네 권)
import { BOOKS_WITH_CONTENT, CONTENT, piecesOf, quizSourceFor } from '../content/catalog'
import { actsRoomOpen, emptyProgress, pickableBooks } from './books'
import { chooseBook, newGame, shelvedCount } from './game'
import { jobOf } from './job'
import { actsDoorGlows, gospelRoomFull, poolFor } from './library'
import { mulberry32 } from './offers'
import { buildLibraryQuiz, buildQuiz, detectiveAnswer, QUIZ_SIZE } from './quiz'
import { deserialize, sanitize, serialize } from './save'
import { BOOKS, GOSPELS, isGospel, type Book, type GameContent, type Piece } from './types'

// 테스트용 사도행전 조각 (콘텐츠는 작업 2에서 넣는다)
const AC: Piece[] = [
  { id: 'ac-001-001', book: 'ac', ref: '행 1:1-11', chapter: 1, title: '데오빌로여', stamps: [] },
  { id: 'ac-001-012', book: 'ac', ref: '행 1:12-26', chapter: 1, title: '맛디아', stamps: [] },
  { id: 'ac-002-001', book: 'ac', ref: '행 2:1-13', chapter: 2, title: '오순절', stamps: [] },
]
const withActs: GameContent = { ...CONTENT, pieces: [...CONTENT.pieces, ...AC] }

describe('다섯 번째 책 사도행전', () => {
  it('BOOKS는 오늘 신약 순서의 다섯 권, GOSPELS는 네 복음서', () => {
    expect(BOOKS).toEqual(['mt', 'mk', 'lk', 'jn', 'ac'])
    expect(GOSPELS).toEqual(['mt', 'mk', 'lk', 'jn'])
    expect(isGospel('ac')).toBe(false)
    expect(isGospel('jn')).toBe(true)
    expect(Object.keys(emptyProgress())).toEqual(['mt', 'mk', 'lk', 'jn', 'ac'])
  })

  it('아직 사도행전 조각은 없다 (콘텐츠 없이 자리만)', () => {
    expect(piecesOf('ac')).toEqual([])
    expect(BOOKS_WITH_CONTENT).not.toContain('ac')
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
        progress: { ...emptyProgress(), ac: { completed: [1, 2], arrangement: {} } },
        shelved: { ac: 1 },
        myLines: { 'book:ac': '길 위의 이야기', 'book:zz': '없는 책' },
      },
      withActs,
    )
    expect(back.progress.ac.completed).toEqual([1, 2])
    expect(back.shelved).toEqual({ ac: 1 })
    expect(back.myLines).toEqual({ 'book:ac': '길 위의 이야기' })
  })

  it('책 고르기: 사도행전은 방이 열리고(잔치 다음 날부터) 조각이 있을 때만', () => {
    // 지금 콘텐츠: 사도행전 조각이 없으니 방이 열려도 없다
    expect(pickableBooks({}, BOOKS_WITH_CONTENT)).toEqual(['mt', 'mk', 'lk', 'jn'])
    expect(pickableBooks({ gospelFeast: 2 }, BOOKS_WITH_CONTENT)).toEqual(['mt', 'mk', 'lk', 'jn'])
    // 조각이 있어도 방이 열리기 전(잔치 전·잔치 날)에는 없다
    expect(pickableBooks({}, BOOKS)).not.toContain('ac')
    expect(pickableBooks({ gospelFeast: 1 }, BOOKS)).not.toContain('ac')
    expect(pickableBooks({ gospelFeast: 2 }, BOOKS)).toEqual(['mt', 'mk', 'lk', 'jn', 'ac'])
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

  it('사도행전 방 열림 판정은 하나 (actsRoomOpen) — 서고 문 불빛도 같은 판정', () => {
    for (const [flags, open] of [[{}, false], [{ gospelFeast: 1 }, false], [{ gospelFeast: 2 }, true]] as const) {
      expect(actsRoomOpen(flags)).toBe(open)
      expect(actsDoorGlows({ flags })).toBe(open)
    }
  })

  it('엔진도 막는다: 방이 열리기 전 chooseBook("ac")은 상태를 그대로 돌려준다', () => {
    const closed = newGame(withActs)
    expect(chooseBook(closed, 'ac', withActs)).toBe(closed)
    const feastDay = { ...closed, flags: { ...closed.flags, gospelFeast: 1 } }
    expect(chooseBook(feastDay, 'ac', withActs)).toBe(feastDay)
    const open = chooseBook({ ...closed, flags: { ...closed.flags, gospelFeast: 2 } }, 'ac', withActs)
    expect(open.activeBook).toBe('ac')
    // 복음서는 그대로 고를 수 있다
    expect(chooseBook(closed, 'mk', withActs).activeBook).toBe('mk')
  })

  it('불러올 때 고른 책이 사도행전인데 방이 닫혀 있으면 고른 책을 비운다', () => {
    const s = { ...newGame(withActs), activeBook: 'ac' as const }
    expect(sanitize(s, withActs).activeBook).toBeNull()
    expect(sanitize({ ...s, flags: { ...s.flags, gospelFeast: 1 } }, withActs).activeBook).toBeNull()
    expect(sanitize({ ...s, flags: { ...s.flags, gospelFeast: 2 } }, withActs).activeBook).toBe('ac')
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

  it('서고 출제 범위는 다섯 권 순서, 마을 구역·직업·복음서 방은 복음서만 센다', () => {
    expect(poolFor({ mk: 1 }, 'ac')).toEqual(['mk', 'ac'])
    const three = { mt: 2, mk: 1, lk: 0, ac: 2 } as const
    expect(shelvedCount({ shelved: three })).toBe(3)
    expect(gospelRoomFull({ shelved: three })).toBe(false)
    expect(gospelRoomFull({ shelved: { ...three, jn: 1 } })).toBe(true)
    expect(jobOf({ lettersDone: 0, shelved: three })).toBe(0)
    expect(jobOf({ lettersDone: 0, shelved: { ...three, jn: 1 } })).toBe(3)
  })
})

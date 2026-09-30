// 편지 서고 퀴즈 (계획 7 작업 6): 어느 책?(보기 다섯 권까지)·첫머리의 이름·빈칸·먼저 나오는 구절. 탐정·도장 없음.
import { BOOK_ABBR, inBrackets, LETTER_OPENINGS, noText, pieceOfQuestion, pieceOfVerse, piecesOf, quizSourceFor, versesOf } from '../content/catalog'
import { mulberry32 } from './offers'
import { buildLibraryQuiz, isCorrect, MAX_BOOK_OPTIONS, NOT_WRITTEN_OPTION, OPENING_MIN_WRONG, QUIZ_SIZE, quizzable, type Question } from './quiz'
import T from '../content/life-text.json'
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
/** 그 편지 본문 전체 (띄어쓰기 뺀 것) — "적혀 있지 않음" 문제의 오답은 여기 어디에도 없어야 한다 */
const bookTexts = new Map<Book, string>()
function bookText(book: Book): string {
  let t = bookTexts.get(book)
  if (t === undefined) {
    t = norm(piecesOf(book).flatMap((p) => versesOf(p.ref).map((v) => v.text)).join(''))
    bookTexts.set(book, t)
  }
  return t
}
/** 보낸 이 줄이 모두 "적혀 있지 않음"인 편지 */
const fromNone = (book: Book) => {
  const rows = LETTER_OPENINGS.filter((o) => o.book === book && o.role === 'from')
  return rows.length > 0 && rows.every((o) => o.name === null)
}
/** 문제가 보이는 절 참조 (범위는 펼쳐서) */
const refsOfQ = (q: Question, pool: Book[]) =>
  q.kind === 'verseOrder' ? q.options : q.kind === 'openingNone' ? quizSourceFor(pool).versesOf(q.ref).map((v) => v.ref) : 'ref' in q ? [q.ref] : []
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
      // 보기는 셋이나 넷 (오답 둘 이상)
      expect(q.options.length, w).toBeGreaterThanOrEqual(1 + OPENING_MIN_WRONG)
      expect(q.options.length, w).toBeLessThanOrEqual(4)
      expect(new Set(q.options).size, w).toBe(q.options.length)
      expect(q.options, w).toContain(q.answer)
      // 이름이 적힌 첫머리 문제에는 "적혀 있지 않음"을 보기로 넣지 않는다 (빈칸이 보이므로)
      expect(q.options, w).not.toContain(NOT_WRITTEN_OPTION)
      // 빈칸을 답으로 채우면 그 구절 본문(개역한글)과 한 글자도 다르지 않고, 답 이름은 그 구절에 한 번만 나온다
      const verse = versesOf(q.ref)
      expect(verse, w).toHaveLength(1)
      expect(q.before + q.answer + q.after, w).toBe(verse[0].text)
      expect(verse[0].text.split(q.answer).length - 1, w).toBe(1)
      // 묻는 말에 책 이름이 없도록 문구에 {book}을 쓰지 않는다 — 보이는 구절에 빈칸 말고는 답 이름이 없다
      expect((q.before + q.after).includes(q.answer), w).toBe(false)
      const opening = openingText(current)
      expect(opening, w).toContain(q.answer)
      for (const o of q.options.filter((x) => x !== q.answer)) {
        // 오답 이름은 이 편지 첫머리 구절 어디에도 없고, 다른 편지의 같은 칸 이름이다
        expect(opening.includes(norm(o)), `${w} ${o}`).toBe(false)
        expect(LETTER_OPENINGS.some((x) => x.book !== current && x.role === q.role && x.name === o), `${w} ${o}`).toBe(true)
      }
    } else if (q.kind === 'openingNone') {
      expect(q.book, w).toBe(current)
      expect(fromNone(current), w).toBe(true)
      expect(q.ref, w).toBe(LETTER_OPENINGS.find((o) => o.book === current && o.role === 'from')!.ref)
      expect(q.answer, w).toBe(NOT_WRITTEN_OPTION)
      expect(q.options.length, w).toBeGreaterThanOrEqual(1 + OPENING_MIN_WRONG)
      expect(q.options.length, w).toBeLessThanOrEqual(4)
      expect(new Set(q.options).size, w).toBe(q.options.length)
      expect(q.options, w).toContain(q.answer)
      // 보이는 절: 모두 문제로 쓸 수 있고 출제 범위에서 유일, 지금 책의 절
      const vs = src.versesOf(q.ref)
      expect(vs.length, w).toBeGreaterThan(0)
      for (const v of vs) {
        expect(quizzable(v.text, v.inBrackets), `${w} ${v.ref}`).toBe(true)
        expect(noText(v.text), `${w} ${v.ref}`).toBe(false)
        expect(src.countVerse(v.text), `${w} ${v.ref}`).toBe(1)
        expect(pieceOfVerse(v.ref)?.book, `${w} ${v.ref}`).toBe(current)
      }
      // 오답: 다른 편지의 보낸 이 이름, 이 편지 본문 전체 어디에도 없는 이름
      for (const o of q.options.filter((x) => x !== q.answer)) {
        expect(bookText(current).includes(norm(o)), `${w} ${o}`).toBe(false)
        expect(LETTER_OPENINGS.some((x) => x.book !== current && x.role === 'from' && x.name === o), `${w} ${o}`).toBe(true)
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

  it('한 퀴즈에 같은 구절이 두 문제에 나오지 않는다 (13편지 × 범위 × 씨앗)', () => {
    for (const current of LETTERS) {
      const pools: Book[][] = [[current], BOOKS.filter((b) => FIVE.includes(b) || b === current), [...BOOKS]]
      for (const pool of pools) {
        const src = quizSourceFor(pool)
        for (let seed = 1; seed <= 12; seed++) {
          const qs = buildLibraryQuiz({ current, pool, piecesOf, rng: mulberry32(seed), src, openings: LETTER_OPENINGS })
          const refs = qs.flatMap((q) => refsOfQ(q, pool))
          expect(new Set(refs).size, `${current}/${pool.length}/${seed}`).toBe(refs.length)
        }
      }
    }
  }, 60000)

  /** 편지마다 씨앗 여럿으로 나온 첫머리 문제 전부 (그 책만 · 서고 전부) */
  const openingQs = (() => {
    const out: Extract<Question, { kind: 'opening' }>[] = []
    for (const current of LETTERS)
      for (const pool of [[current], [...BOOKS]] as Book[][]) {
        const src = quizSourceFor(pool)
        for (let seed = 1; seed <= 60; seed++)
          for (const q of buildLibraryQuiz({ current, pool, piecesOf, rng: mulberry32(seed), src, openings: LETTER_OPENINGS })) if (q.kind === 'opening') out.push(q)
      }
    return out
  })()

  it('첫머리 문제가 실제로 나온다 (로마서 보낸 이, 디모데전서 받는 사람 등), 오답이 둘뿐인 칸도 나온다', () => {
    const seen = new Set(openingQs.map((q) => `${q.book}:${q.role}`))
    expect(seen).toContain('rom:from')
    expect(seen).toContain('rom:toPlace')
    expect(seen).toContain('1ti:toPerson')
    // 오답 둘(소스데네·실루아노)로 보기 셋 — 디모데는 첫머리에 있어 오답이 될 수 없다
    expect(seen).toContain('1ti:from')
    expect(seen).toContain('2ti:from')
    expect(seen).toContain('phm:from')
    expect(openingQs.some((q) => q.options.length === 3)).toBe(true)
    // 데살로니가전서·후서 보낸 이(바울·실루아노·디모데): 열세 권만 있을 때는 오답이 소스데네 하나뿐이라 내지 않았으나,
    // 계획 8 작업 2부터 야고보·베드로·유다가 오답 후보에 들어와 낸다
    expect(seen).toContain('1th:from')
    expect(seen).toContain('2th:from')
    // 빌레몬서 받는 사람(빌레몬·압비아·아킵보): 디모데는 첫머리(몬 1:1)에 있어 오답이 아니고, 오답 디도·가이오 둘로 낸다
    expect(seen).toContain('phm:toPerson')
    // 히브리서–유다서의 이름 줄도 나온다
    for (const k of ['jas:from', '1pe:from', '1pe:toPlace', '2pe:from', '3jn:toPerson', 'jud:from']) expect(seen).toContain(k)
  })

  it('히브리서–유다서 첫머리: 이름 줄의 오답은 그 편지 첫머리에 없다 (유다서 보낸 이 오답에 야고보 없음, 벧전·벧후 서로 베드로 없음)', () => {
    for (const q of openingQs) {
      const wrong = q.options.filter((o) => o !== q.answer)
      if (q.book === 'jud' && q.role === 'from') {
        expect(q.answer).toBe('유다')
        expect(wrong).not.toContain('야고보')
      }
      if ((q.book === '1pe' || q.book === '2pe') && q.role === 'from') {
        expect(q.answer).toBe('베드로')
        expect(wrong).not.toContain('베드로')
      }
      if (q.book === 'gal' && q.role === 'toPlace') expect(wrong).not.toContain('갈라디아')
      if (q.book === '1pe' && q.role === 'toPlace') expect(wrong).not.toContain('갈라디아')
    }
    // "적혀 있지 않음"(name null) 줄로는 첫머리 빈칸 문제를 만들지 않는다
    expect(openingQs.some((q) => ['heb', '1jn', '2jn'].includes(q.book))).toBe(false)
    expect(openingQs.filter((q) => q.book === '3jn').every((q) => q.role === 'toPerson' && q.answer === '가이오')).toBe(true)
  })

  it('첫머리 문제: 쓰인 모든 이름 줄에서 빈칸을 답으로 채우면 구절 본문 그대로다', () => {
    const used = new Set(openingQs.map((q) => `${q.book}|${q.role}|${q.answer}|${q.ref}`))
    for (const q of openingQs) expect(q.before + q.answer + q.after, `${q.book} ${q.ref}`).toBe(versesOf(q.ref)[0].text)
    // 물을 수 있는 줄(이름이 그 구절에 한 번, 그 칸 오답 둘 이상)은 모두 한 번 이상 쓰였다
    for (const o of LETTER_OPENINGS) {
      if (o.name === null) continue
      const text = versesOf(o.ref)[0].text
      const opening = openingText(o.book as Letter)
      const wrong = new Set(LETTER_OPENINGS.filter((x) => x.book !== o.book && x.role === o.role && x.name !== null && !opening.includes(norm(x.name))).map((x) => x.name))
      const askable = text.split(o.name).length - 1 === 1 && wrong.size >= OPENING_MIN_WRONG
      expect(used.has(`${o.book}|${o.role}|${o.name}|${o.ref}`), `${o.book} ${o.role} ${o.name}`).toBe(askable)
    }
  })

  it('데살로니가(살전·살후 받는 곳): 빈칸은 "데살로니가"만, "인의"는 본문 그대로 남는다', () => {
    const th = openingQs.filter((q) => (q.book === '1th' || q.book === '2th') && q.role === 'toPlace')
    expect(th.length).toBeGreaterThan(0)
    for (const q of th) {
      expect(q.answer).toBe('데살로니가')
      expect(q.after.startsWith('인의 교회에')).toBe(true)
      expect(q.before.endsWith('안에 있는 ')).toBe(true)
      expect(q.before + q.answer + q.after).toBe(versesOf(q.ref)[0].text)
    }
  })

  it('첫머리 오답은 그 편지 첫머리에 없다: 몬 받는 사람·딤전/딤후 보낸 이에 디모데가 오답으로 나오지 않는다', () => {
    for (const q of openingQs) {
      if (q.book === 'phm') expect(q.options.filter((o) => o !== q.answer)).not.toContain('디모데')
      if ((q.book === '1ti' || q.book === '2ti') && q.role === 'from') {
        expect(q.answer).toBe('바울')
        expect(q.options).not.toContain('디모데')
      }
    }
    expect(openingQs.some((q) => q.book === '1ti' && q.role === 'from')).toBe(true)
  })

  it('첫머리 문제의 묻는 말에 책 이름이 없다', () => {
    for (const s of Object.values(T.quiz.opening)) {
      expect(s).not.toContain('{book}')
      for (const name of Object.values(T.quiz.books)) expect(s).not.toContain(name)
    }
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

  describe('"적혀 있지 않음" 첫머리 문제 (계획 8 작업 3)', () => {
    const NONE: Letter[] = ['heb', '1jn', '2jn', '3jn']
    /** [편지, 범위 이름, 문제] — 그 책만 · 서고 전부 × 씨앗 1–30 */
    const noneQs = (() => {
      const out: [Letter, string, Extract<Question, { kind: 'openingNone' }>, Question[]][] = []
      for (const current of LETTERS)
        for (const [name, pool] of [
          ['그 책만', [current]],
          ['서고 전부', [...BOOKS]],
        ] as [string, Book[]][]) {
          const src = quizSourceFor(pool)
          for (let seed = 1; seed <= 30; seed++) {
            const qs = buildLibraryQuiz({ current, pool, piecesOf, rng: mulberry32(seed), src, openings: LETTER_OPENINGS })
            for (const q of qs) if (q.kind === 'openingNone') out.push([current, name, q, qs])
          }
        }
      return out
    })()

    it('히브리서·요한일서·요한이서·요한삼서에서 (그 책만 / 서고 전부) 실제로 나오고, 다른 편지에는 없다', () => {
      for (const b of NONE) for (const name of ['그 책만', '서고 전부']) expect(noneQs.some(([c, n]) => c === b && n === name), `${b} ${name}`).toBe(true)
      const books = new Set(noneQs.map(([c]) => c))
      for (const b of LETTERS) expect(books.has(b), b).toBe(NONE.includes(b))
      for (const b of ['jas', '1pe', '2pe', 'jud'] as Letter[]) expect(books.has(b), b).toBe(false)
    })

    it('답은 "적혀 있지 않음", 오답은 그 책 본문 어디에도 없는 다른 편지의 보낸 이 (히브리서 오답에 디모데·유다 없음)', () => {
      for (const [c, name, q] of noneQs) {
        const w = `${c}/${name}`
        expect(q.answer, w).toBe(NOT_WRITTEN_OPTION)
        expect(isCorrect(q, NOT_WRITTEN_OPTION), w).toBe(true)
        for (const o of q.options.filter((x) => x !== q.answer)) {
          expect(isCorrect(q, o), `${w} ${o}`).toBe(false)
          expect(bookText(c).includes(norm(o)), `${w} ${o}`).toBe(false)
        }
        if (c === 'heb') {
          expect(q.options, w).not.toContain('디모데') // 히 13:23
          expect(q.options, w).not.toContain('유다') // 히 7:14
        }
      }
      // 보기 넷(오답 셋)인 문제가 실제로 있다
      expect(noneQs.some(([, , q]) => q.options.length === 4)).toBe(true)
    })

    it('보이는 범위는 첫머리 보낸 이 줄의 구절 (히 1:1-4 · 요일 1:1-4 · 요이 1:1 · 요삼 1:1), 범위의 절은 한 퀴즈에서 다른 문제로 다시 나오지 않는다', () => {
      const want: Record<string, string> = { heb: '히 1:1-4', '1jn': '요일 1:1-4', '2jn': '요이 1:1', '3jn': '요삼 1:1' }
      for (const [c, name, q, qs] of noneQs) {
        expect(q.ref, c).toBe(want[c])
        const pool = name === '그 책만' ? [c] : [...BOOKS]
        const mine = new Set(refsOfQ(q, pool))
        expect(mine.size, c).toBe(c === 'heb' || c === '1jn' ? 4 : 1)
        for (const o of qs) if (o !== q) for (const r of refsOfQ(o, pool)) expect(mine.has(r), `${c}/${name} ${o.kind} ${r}`).toBe(false)
      }
    })

    it('요한삼서는 "적혀 있지 않음" 문제와 받는 사람 가이오 빈칸이 둘 다 나온다 (한 퀴즈에는 하나)', () => {
      expect(noneQs.some(([c]) => c === '3jn')).toBe(true)
      expect(openingQs.some((q) => q.book === '3jn' && q.role === 'toPerson' && q.answer === '가이오')).toBe(true)
      for (const [c, , , qs] of noneQs) if (c === '3jn') expect(qs.some((q) => q.kind === 'opening'), c).toBe(false)
    })

    it('문구: 보기 이름은 "적혀 있지 않음", 묻는 말에 책 이름이 없다', () => {
      expect(T.quiz.notWritten).toBe('적혀 있지 않음')
      expect(T.quiz.openingNone).not.toContain('{book}')
      for (const name of Object.values(T.quiz.books)) expect(T.quiz.openingNone).not.toContain(name)
      expect(T.quiz.kinds.openingNone.length).toBeGreaterThan(0)
    })

    it('다시 읽을 구절: 범위 첫 절의 장', () => {
      expect(pieceOfQuestion({ kind: 'openingNone', book: 'heb', ref: '히 1:1-4', options: [], answer: NOT_WRITTEN_OPTION })).toBe('heb-001')
      expect(pieceOfQuestion({ kind: 'openingNone', book: '3jn', ref: '요삼 1:1', options: [], answer: NOT_WRITTEN_OPTION })).toBe('3jn-001')
    })
  })

  it('틀린 문제의 다시 읽을 구절: 첫머리는 그 구절의 장, 먼저 나오는 구절은 앞 구절의 장', () => {
    expect(pieceOfQuestion({ kind: 'opening', book: 'rom', role: 'from', ref: '롬 1:1', before: '', after: '', options: [], answer: '바울' })).toBe('rom-001')
    expect(pieceOfQuestion({ kind: 'verseOrder', options: ['롬 5:1', '롬 3:1'], answer: '롬 3:1' })).toBe('rom-003')
  })
})

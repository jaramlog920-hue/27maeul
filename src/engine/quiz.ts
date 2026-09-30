// 장을 기록하기 전 다섯 문제 (사용자 요청 2026-09-26: 복음의 전령 퀘스트처럼 조각 맞추기·탐정 등 여러 형식).
// 정답이 둘이 될 수 없도록 모든 문제를 데이터에서 기계적으로 만든다 (exclusion-list §5 "정답이 둘 되는 보기 금지").
//   말씀 조각 맞추기: 한 절의 낱말을 차례대로 — 출제 본문(quizSourceFor([book]), 그 책)에서 그 문장이 그 절 하나뿐인 절만
//   빈칸 채우기: 낱말 하나를 비운다 — 다른 보기로 채운 문장이 본문 어디에도 없어야 한다
//   복음서 탐정: 같은 이야기가 기록된 복음서를 모두 — "비슷한 이야기" 도장이 있는 조각은 쓰지 않는다(같은 일인지 본문이 말하지 않으므로)
//   어느 이야기일까: 한 절이 속한 조각은 하나뿐 (조각은 겹치지 않는다)
//   먼저 나오는 이야기: 조각 id 순서 = 본문 순서
//   사도행전(계획 5)에는 도장이 없으므로 탐정 문제를 내지 않고, 탐정 보기에도 넣지 않는다 (GOSPELS만)
//   편지(계획 7 작업 6): 어느 책?·첫머리의 이름·빈칸·먼저 나오는 구절 — 탐정·도장·장 조각의 order·verse 문제는 없다
import { modeOf, roomOf } from './shelf-rooms'
import { BOOKS, GOSPELS, isGospel, type Book, type Gospel, type Piece, type Rng } from './types'

export type GospelId = Gospel
export { GOSPELS }

/** 편지 첫머리 칸 (letters.json): 보낸 이 · 받는 곳 · 받는 사람 */
export type OpeningRole = 'from' | 'toPlace' | 'toPerson'
/** letters.json 한 줄. name이 null이면 "적혀 있지 않음" (계획 8 — 이번에는 문제로 쓰지 않는다) */
export interface LetterOpening {
  book: Book
  role: OpeningRole
  name: string | null
  ref: string
}

export type Question =
  | { kind: 'puzzle'; ref: string; words: string[]; answer: string[] }
  | { kind: 'blank'; ref: string; before: string; after: string; options: string[]; answer: string }
  | { kind: 'detective'; pieceId: string; options: GospelId[]; answer: GospelId[] }
  | { kind: 'verse'; ref: string; options: string[]; answer: string }
  | { kind: 'order'; options: string[]; answer: string }
  | { kind: 'book'; ref: string; options: Book[]; answer: Book }
  /**
   * 편지 첫머리 구절 속 빈칸 — 그 칸으로 적힌 이름이 빈칸이다. before + answer + after = 그 구절 본문(개역한글) 그대로.
   * 책 이름은 묻는 말에 넣지 않는다(답이 드러나므로). ref는 맞힌 뒤 보인다
   */
  | { kind: 'opening'; book: Book; role: OpeningRole; ref: string; before: string; after: string; options: string[]; answer: string }
  /** 먼저 나오는 구절 — options·answer는 절 참조, 화면은 맞히기 전에는 본문만 보인다 */
  | { kind: 'verseOrder'; options: string[]; answer: string }

export interface VerseText {
  ref: string
  text: string
  /** 여러 절에 걸친 대괄호 [ … ] 안에 든 절 (막 16:9-20의 가운데 절처럼 괄호 글자가 없어도) */
  inBrackets?: boolean
}

export const QUIZ_SIZE = 5
export const PUZZLE_MIN_WORDS = 4
export const PUZZLE_MAX_WORDS = 9
/** 너무 짧아 어느 이야기인지 가늠할 수 없는 절은 쓰지 않는다 */
export const MIN_VERSE_CHARS = 14

const norm = (s: string) => s.replace(/\s+/g, '')
export const wordsOf = (text: string) => text.trim().split(/\s+/)
/**
 * 문제로 쓸 수 있는 절인가: 본문이 없는 절((없음)), 대괄호가 든 절·대괄호 구간 안의 절(원문에 없는 말 보탬),
 * 둥근 괄호가 든 절·둥근 괄호 구간 안의 절(마 6:13 송영 같은 사본 차이 표시와, 본문 속 풀이 괄호 — 안전하게 모두 뺀다)은 안 된다
 */
export function quizzable(text: string, inBrackets = false): boolean {
  return !inBrackets && text !== '(없음)' && !/[[\]()]/.test(text)
}

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickOne<T>(items: readonly T[], rng: Rng): T | undefined {
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))]
}

/** 탐정 문제로 쓸 수 있는 조각: 복음서 조각이고, 도장이 없거나 모두 "같은 이야기". 답 = 이 조각의 책 + 같은 이야기 도장의 책 */
export function detectiveAnswer(p: Piece): GospelId[] | null {
  if (!isGospel(p.book)) return null
  if (p.stamps.some((s) => s.kind === 'similar')) return null
  const books = new Set<Book>([p.book, ...p.stamps.map((s) => s.book)])
  return GOSPELS.filter((g) => books.has(g))
}

export interface QuizSource {
  /** 조각의 절들 (본문 파일에서 꺼낸 그대로) */
  versesOf: (ref: string) => VerseText[]
  /** 출제 본문(quizSourceFor로 고른 책들) 전체에서 이 문장을 가진 절의 수 */
  countVerse: (text: string) => number
}

/** 퀴즈에 (문제·보기·정답 어디로든) 쓸 수 있는 조각: 모든 절이 대괄호 구간 안인 조각(막 16:9-20)은 안 된다 */
export function quizzablePiece(p: Piece, src: QuizSource): boolean {
  return src.versesOf(p.ref).some((v) => !v.inBrackets)
}

function puzzle(p: Piece, src: QuizSource, rng: Rng): Question | null {
  const ok = src.versesOf(p.ref).filter((v) => {
    const n = wordsOf(v.text).length
    return n >= PUZZLE_MIN_WORDS && n <= PUZZLE_MAX_WORDS && quizzable(v.text, v.inBrackets) && src.countVerse(v.text) === 1
  })
  const v = pickOne(ok, rng)
  if (!v) return null
  const answer = wordsOf(v.text)
  let words = shuffle(answer, rng)
  // 처음부터 맞게 놓여 있지 않도록
  for (let i = 0; i < 5 && words.join(' ') === answer.join(' '); i++) words = shuffle(answer, rng)
  if (words.join(' ') === answer.join(' ')) return null
  return { kind: 'puzzle', ref: v.ref, words, answer }
}

function blank(p: Piece, chapterPieces: readonly Piece[], src: QuizSource, rng: Rng): Question | null {
  const verses = shuffle(
    src.versesOf(p.ref).filter((v) => norm(v.text).length >= MIN_VERSE_CHARS && quizzable(v.text, v.inBrackets) && src.countVerse(v.text) === 1),
    rng,
  )
  // 보기로 쓸 낱말: 같은 장 다른 절의 낱말 (괄호 구절의 낱말은 보기로도 쓰지 않는다)
  const pool = [
    ...new Set(chapterPieces.flatMap((cp) => src.versesOf(cp.ref).filter((v) => quizzable(v.text, v.inBrackets)).flatMap((v) => wordsOf(v.text)))),
  ].filter((w) => norm(w).length >= 2)
  for (const v of verses) {
    const ws = wordsOf(v.text)
    const idxs = shuffle(
      ws.map((_, i) => i).filter((i) => norm(ws[i]).length >= 2),
      rng,
    )
    for (const i of idxs) {
      const answer = ws[i]
      const before = ws.slice(0, i).join(' ')
      const after = ws.slice(i + 1).join(' ')
      const fill = (w: string) => [before, w, after].filter(Boolean).join(' ')
      const distractors = shuffle(
        pool.filter((w) => norm(w) !== norm(answer) && src.countVerse(fill(w)) === 0),
        rng,
      ).slice(0, 3)
      if (distractors.length < 3) continue
      return { kind: 'blank', ref: v.ref, before, after, options: shuffle([answer, ...distractors], rng), answer }
    }
  }
  return null
}

function detective(p: Piece): Question | null {
  const answer = detectiveAnswer(p)
  return answer ? { kind: 'detective', pieceId: p.id, options: [...GOSPELS], answer } : null
}

function whichStory(p: Piece, near: readonly Piece[], src: QuizSource, rng: Rng): Question | null {
  const v = pickOne(
    src.versesOf(p.ref).filter((x) => norm(x.text).length >= MIN_VERSE_CHARS && quizzable(x.text, x.inBrackets) && src.countVerse(x.text) === 1),
    rng,
  )
  if (!v) return null
  const others = shuffle(
    near.filter((o) => o.id !== p.id),
    rng,
  ).slice(0, 2)
  if (others.length < 2) return null
  return { kind: 'verse', ref: v.ref, options: shuffle([p.id, ...others.map((o) => o.id)], rng), answer: p.id }
}

function order(chapterPieces: readonly Piece[], rng: Rng): Extract<Question, { kind: 'order' }> | null {
  const two = shuffle(chapterPieces, rng).slice(0, 2)
  if (two.length < 2) return null
  return { kind: 'order', options: two.map((p) => p.id), answer: [...two].sort((a, b) => (a.id < b.id ? -1 : 1))[0].id }
}

const keyOf = (q: Question) =>
  q.kind === 'detective' ? q.pieceId : q.kind === 'opening' ? `opening:${q.role}` : q.kind === 'verseOrder' ? `order:${q.options.join('|')}` : 'ref' in q ? q.ref : ''

export function buildQuiz(allPieces: readonly Piece[], chapter: number, rng: Rng, src: QuizSource): Question[] {
  // 괄호 조각은 문제·보기·정답 어디에도 쓰지 않는다
  const pieces = allPieces.filter((p) => quizzablePiece(p, src))
  const inChapter = pieces.filter((p) => p.chapter === chapter)
  // 보기가 모자라면 앞뒤 장의 조각을 섞는다
  const near = pieces.filter((p) => Math.abs(p.chapter - chapter) <= 1)
  const order5: ((p: Piece) => Question | null)[] = [
    (p) => puzzle(p, src, rng),
    (p) => blank(p, inChapter, src, rng),
    (p) => detective(p),
    (p) => whichStory(p, near, src, rng),
  ]
  const out: Question[] = []
  const used = new Set<string>()
  for (const make of order5) {
    for (const p of shuffle(inChapter, rng)) {
      const q = make(p)
      if (!q) continue
      const key = keyOf(q)
      if (used.has(key)) continue
      used.add(key)
      out.push(q)
      break
    }
  }
  // 모자란 만큼 순서 문제로 채운다
  for (let i = 0; out.length < QUIZ_SIZE && i < 10; i++) {
    const q = order(inChapter, rng)
    if (q && !out.some((o) => o.kind === 'order' && o.answer === q.answer && o.options.join() === q.options.join())) out.push(q)
  }
  // 그래도 모자라면(쓸 수 있는 조각이 하나뿐인 장 — 막 16장은 괄호 조각을 빼면 16:1-8만 남는다) 다른 절로 한 번 더 낸다
  for (let pass = 0; out.length < QUIZ_SIZE && pass < 10; pass++) {
    for (const make of order5) {
      if (out.length >= QUIZ_SIZE) break
      for (const p of shuffle(inChapter, rng)) {
        const q = make(p)
        if (!q || used.has(keyOf(q))) continue
        used.add(keyOf(q))
        out.push(q)
        break
      }
    }
  }
  return shuffle(out, rng).slice(0, QUIZ_SIZE)
}

// ── 서고 퀴즈 (설계 §3.5) ──
// 출제 범위 = 서고에 꽂힌 책 + 지금 꽂는 책. 모든 문장은 출제 범위 안에서 글자 그대로 한 곳에만 있어야 한다 (exclusion-list §4-1).

function firstOf<T>(items: readonly T[], make: (x: T) => Question | null): Question | null {
  for (const x of items) {
    const q = make(x)
    if (q) return q
  }
  return null
}

/** "어느 책?" 보기는 다섯 권까지 (계획 7 작업 6 — 서고가 열여덟 권이 되어도 고르기 쉽게) */
export const MAX_BOOK_OPTIONS = 5

/**
 * "어느 책?" 보기: 출제 범위가 다섯 권 이하면 전부 그대로(복음서·사도행전 퀴즈는 달라지지 않는다).
 * 넘치면 답 + 같은 방의 책을 먼저, 모자라면 다른 방 책 — 오늘 성경 순서로 늘어놓는다
 */
function bookOptions(answer: Book, pool: readonly Book[], rng: Rng): Book[] {
  if (pool.length <= MAX_BOOK_OPTIONS) return BOOKS.filter((b) => pool.includes(b))
  const room = roomOf(answer).id
  const rest = pool.filter((b) => b !== answer)
  const same = shuffle(
    rest.filter((b) => roomOf(b).id === room),
    rng,
  )
  const other = shuffle(
    rest.filter((b) => roomOf(b).id !== room),
    rng,
  )
  const chosen = [answer, ...same, ...other].slice(0, MAX_BOOK_OPTIONS)
  return BOOKS.filter((b) => chosen.includes(b))
}

/**
 * "이 구절은 어느 책에 있나요?" — 책 이름으로 묻는다, 누가 썼는지는 묻지 않는다 (exclusion-list §4-2).
 * 보기는 bookOptions(오늘 성경 순서). 보기가 모두 복음서면 화면은 "어느 복음서"로 묻는다
 */
function bookQuestion(from: Book, pool: readonly Book[], piecesOf: (b: Book) => readonly Piece[], src: QuizSource, rng: Rng): Question | null {
  const options = bookOptions(from, pool, rng)
  return firstOf(shuffle(piecesOf(from), rng), (p) => {
    const v = pickOne(
      src.versesOf(p.ref).filter((x) => norm(x.text).length >= MIN_VERSE_CHARS && quizzable(x.text, x.inBrackets) && src.countVerse(x.text) === 1),
      rng,
    )
    return v ? { kind: 'book', ref: v.ref, options, answer: from } : null
  })
}

/** 탐정: 보기와 답을 출제 범위의 복음서로 좁힌다 (보기가 한 권뿐이면 묻지 않는다) */
function poolDetective(p: Piece, pool: readonly Book[]): Question | null {
  const a = detectiveAnswer(p)
  if (!a) return null
  const options = GOSPELS.filter((g) => pool.includes(g))
  if (options.length < 2) return null
  return { kind: 'detective', pieceId: p.id, options, answer: a.filter((g) => pool.includes(g)) }
}

/** 문제로 쓸 수 있는 절 (본문 없는 절·괄호 구절 제외, 14자 이상, 출제 범위에서 유일) */
const askable = (src: QuizSource) => (v: VerseText) => norm(v.text).length >= MIN_VERSE_CHARS && quizzable(v.text, v.inBrackets) && src.countVerse(v.text) === 1

/** '롬 1:7' · '히 1:1-4' → 끝 절 번호 (첫머리는 1장 안에 있다 — verify-letters) */
const openingEnd = (ref: string) => {
  const m = /^(\S+)\s+1:(\d+)(?:-(\d+))?$/.exec(ref.trim())
  return m ? { abbr: m[1], last: Number(m[3] ?? m[2]) } : null
}

/** 첫머리 문제의 오답 보기 수: 둘까지 줄일 수 있다(보기 셋). 셋이 되면 셋 */
export const OPENING_MIN_WRONG = 2
const OPENING_MAX_WRONG = 3

/** text 안에 name이 몇 번 나오나 (글자 그대로) */
const occurrences = (text: string, name: string) => text.split(name).length - 1

/**
 * 첫머리 문제 (exclusion-list §4-6): 이름이 적힌 첫머리 구절을 보이고 그 이름 자리를 빈칸으로 — "누가 썼나요?"로 묻지 않고,
 * 책 이름도 말하지 않는다(로마서→로마처럼 답이 드러나므로). 구절의 참조는 맞힌 뒤에 보인다.
 * 답은 그 칸에 적힌 이름 하나. 그 이름이 보이는 구절에 두 번 이상 나오면 그 줄은 묻지 않는다(빈칸이 하나여야 하므로).
 * 오답은 다른 편지들의 같은 칸 이름 중 이 편지 첫머리(1:1부터 letters.json의 가장 뒤 구절까지) 본문 어디에도 없는 이름 —
 * 같은 편지에 보낸 이가 여럿이어도 그 누구도 오답이 되지 않는다. 오답을 둘(OPENING_MIN_WRONG) 못 채우는 칸은 묻지 않는다.
 * 이름이 null("적혀 있지 않음")인 줄은 문제로 쓰지 않는다 (계획 8에서 보기 모양을 정한다)
 */
function openingQuestion(current: Book, openings: readonly LetterOpening[], src: QuizSource, rng: Rng): Question | null {
  const rows = openings.filter((o) => o.book === current)
  const ends = rows.map((o) => openingEnd(o.ref)).filter((e) => e !== null)
  if (ends.length === 0) return null
  const last = Math.max(...ends.map((e) => e.last))
  const text = norm(
    src
      .versesOf(`${ends[0].abbr} 1:1-${last}`)
      .map((v) => v.text)
      .join(''),
  )
  const roles = shuffle([...new Set(rows.map((o) => o.role))], rng)
  for (const role of roles) {
    const wrong = [
      ...new Set(openings.filter((o) => o.book !== current && o.role === role && o.name !== null).map((o) => o.name!)),
    ].filter((n) => !text.includes(norm(n)))
    if (wrong.length < OPENING_MIN_WRONG) continue
    const answers = rows.flatMap((o) => {
      if (o.role !== role || o.name === null || !text.includes(norm(o.name))) return []
      const vs = src.versesOf(o.ref)
      if (vs.length !== 1) return []
      const v = vs[0]
      if (!quizzable(v.text, v.inBrackets) || occurrences(v.text, o.name) !== 1) return []
      const i = v.text.indexOf(o.name)
      return [{ row: o, before: v.text.slice(0, i), after: v.text.slice(i + o.name.length) }]
    })
    const a = pickOne(answers, rng)
    if (!a) continue
    const answer = a.row.name!
    const options = shuffle([answer, ...shuffle(wrong, rng).slice(0, OPENING_MAX_WRONG)], rng)
    return { kind: 'opening', book: current, role, ref: a.row.ref, before: a.before, after: a.after, options, answer }
  }
  return null
}

/**
 * 먼저 나오는 구절 (편지): 지금 책의 서로 다른 두 장에서 한 절씩 — 참조 없이 본문만 보이고, 맞힌 뒤 참조가 보인다.
 * (장 조각의 order 문제는 보기가 "로마서 3장/5장"이라 답이 드러나므로 편지에는 내지 않는다)
 */
function verseOrderQuestion(mine: readonly Piece[], src: QuizSource, rng: Rng): Question | null {
  const ok = askable(src)
  const withVerses = shuffle(mine, rng)
    .map((p) => ({ p, v: pickOne(src.versesOf(p.ref).filter(ok), rng) }))
    .filter((x): x is { p: Piece; v: VerseText } => x.v !== undefined)
  const a = withVerses[0]
  const b = withVerses.find((x) => x.p.chapter !== a?.p.chapter)
  if (!a || !b) return null
  const first = a.p.chapter < b.p.chapter ? a : b
  return { kind: 'verseOrder', options: shuffle([a.v.ref, b.v.ref], rng), answer: first.v.ref }
}

/** 편지 책을 꽂을 때 (계획 7 작업 6): 어느 책? 둘 · 첫머리 · 빈칸 · 먼저 나오는 구절, 모자라면 빈칸·먼저 나오는 구절을 다른 절로, 그다음 낱말 맞추기 */
function buildLetterQuiz(current: Book, pool: readonly Book[], piecesOf: (b: Book) => readonly Piece[], openings: readonly LetterOpening[], src: QuizSource, rng: Rng): Question[] {
  const mine = piecesOf(current)
  const others = pool.filter((b) => b !== current)
  const blankQ = () => firstOf(shuffle(mine, rng), (p) => blank(p, [p], src, rng))
  const orderQ = () => verseOrderQuestion(mine, src, rng)
  const puzzleQ = () => firstOf(shuffle(mine, rng), (p) => puzzle(p, src, rng))
  const makers: (() => Question | null)[] = []
  if (others.length > 0) {
    makers.push(() => bookQuestion(current, pool, piecesOf, src, rng))
    makers.push(() => bookQuestion(pickOne(others, rng)!, pool, piecesOf, src, rng))
  }
  makers.push(() => openingQuestion(current, openings, src, rng))
  makers.push(blankQ, orderQ)
  const out: Question[] = []
  const used = new Set<string>()
  const tryAdd = (make: () => Question | null) => {
    if (out.length >= QUIZ_SIZE) return
    const q = make()
    if (!q || used.has(keyOf(q))) return
    used.add(keyOf(q))
    out.push(q)
  }
  for (const make of makers) tryAdd(make)
  tryAdd(blankQ)
  tryAdd(orderQ)
  for (let pass = 0; out.length < QUIZ_SIZE && pass < 10; pass++) for (const make of [puzzleQ, blankQ, orderQ]) tryAdd(make)
  return shuffle(out, rng).slice(0, QUIZ_SIZE)
}

export function buildLibraryQuiz(args: {
  current: Book
  pool: readonly Book[]
  piecesOf: (b: Book) => readonly Piece[]
  rng: Rng
  src: QuizSource
  /** 편지 첫머리 (letters.json) — 편지 책을 꽂을 때만 쓴다 */
  openings?: readonly LetterOpening[]
}): Question[] {
  const { current, pool, rng, src } = args
  // 괄호 조각은 문제·보기·정답 어디에도 쓰지 않는다
  const piecesOf = (b: Book) => args.piecesOf(b).filter((p) => quizzablePiece(p, src))
  if (modeOf(current) === 'letters') return buildLetterQuiz(current, pool, piecesOf, args.openings ?? [], src, rng)
  const mine = piecesOf(current)
  const others = pool.filter((b) => b !== current)
  const makers: (() => Question | null)[] = []
  if (others.length > 0) {
    makers.push(() => bookQuestion(current, pool, piecesOf, src, rng))
    makers.push(() => bookQuestion(pickOne(others, rng)!, pool, piecesOf, src, rng))
    makers.push(() => firstOf(shuffle(mine, rng), (p) => poolDetective(p, pool)))
  }
  makers.push(() => firstOf(shuffle(mine, rng), (p) => puzzle(p, src, rng)))
  makers.push(() => firstOf(shuffle(mine, rng), (p) => blank(p, mine.filter((x) => x.chapter === p.chapter), src, rng)))
  makers.push(() => firstOf(shuffle(mine, rng), (p) => whichStory(p, mine.filter((o) => Math.abs(o.chapter - p.chapter) <= 1), src, rng)))
  const out: Question[] = []
  const used = new Set<string>()
  for (const make of makers) {
    if (out.length >= QUIZ_SIZE) break
    const q = make()
    if (!q || used.has(keyOf(q))) continue
    used.add(keyOf(q))
    out.push(q)
  }
  // 모자란 만큼 순서 문제로 채운다 (책 전체에서 — 조각 id 순서 = 본문 순서)
  for (let i = 0; out.length < QUIZ_SIZE && i < 20; i++) {
    const q = order(mine, rng)
    if (q && !out.some((o) => o.kind === 'order' && o.options.join() === q.options.join())) out.push(q)
  }
  return shuffle(out, rng).slice(0, QUIZ_SIZE)
}

export function isCorrect(q: Question, given: string[] | string): boolean {
  if (q.kind === 'puzzle') return Array.isArray(given) && given.join(' ') === q.answer.join(' ')
  if (q.kind === 'detective') {
    if (!Array.isArray(given)) return false
    const a = [...q.answer].sort().join()
    return [...given].sort().join() === a
  }
  return given === q.answer
}

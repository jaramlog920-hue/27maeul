// 장을 기록하기 전 다섯 문제 (사용자 요청 2026-09-26: 복음의 전령 퀘스트처럼 조각 맞추기·탐정 등 여러 형식).
// 정답이 둘이 될 수 없도록 모든 문제를 데이터에서 기계적으로 만든다 (exclusion-list §5 "정답이 둘 되는 보기 금지").
//   말씀 조각 맞추기: 한 절의 낱말을 차례대로 — 누가복음에서 그 문장이 그 절 하나뿐인 절만
//   빈칸 채우기: 낱말 하나를 비운다 — 다른 보기로 채운 문장이 본문 어디에도 없어야 한다
//   복음서 탐정: 같은 이야기가 기록된 복음서를 모두 — "비슷한 이야기" 도장이 있는 조각은 쓰지 않는다(같은 일인지 본문이 말하지 않으므로)
//   어느 이야기일까: 한 절이 속한 조각은 하나뿐 (조각은 겹치지 않는다)
//   먼저 나오는 이야기: 조각 id 순서 = 본문 순서
import type { Piece, Rng, StampBook } from './types'

export type GospelId = 'mt' | 'mk' | 'lk' | 'jn'

export type Question =
  | { kind: 'puzzle'; ref: string; words: string[]; answer: string[] }
  | { kind: 'blank'; ref: string; before: string; after: string; options: string[]; answer: string }
  | { kind: 'detective'; pieceId: string; options: GospelId[]; answer: GospelId[] }
  | { kind: 'verse'; ref: string; options: string[]; answer: string }
  | { kind: 'order'; options: string[]; answer: string }

export interface VerseText {
  ref: string
  text: string
}

export const QUIZ_SIZE = 5
export const PUZZLE_MIN_WORDS = 4
export const PUZZLE_MAX_WORDS = 9
/** 너무 짧아 어느 이야기인지 가늠할 수 없는 절은 쓰지 않는다 */
export const MIN_VERSE_CHARS = 14
export const GOSPELS: readonly GospelId[] = ['mt', 'mk', 'lk', 'jn']

const norm = (s: string) => s.replace(/\s+/g, '')
export const wordsOf = (text: string) => text.trim().split(/\s+/)

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

/** 탐정 문제로 쓸 수 있는 조각: 도장이 없거나 모두 "같은 이야기" */
export function detectiveAnswer(p: Piece): GospelId[] | null {
  if (p.stamps.some((s) => s.kind === 'similar')) return null
  const books = new Set<StampBook>(p.stamps.map((s) => s.book))
  return GOSPELS.filter((g) => g === 'lk' || books.has(g as StampBook))
}

export interface QuizSource {
  /** 조각의 절들 (본문 파일에서 꺼낸 그대로) */
  versesOf: (ref: string) => VerseText[]
  /** 누가복음(도장 복음서 포함) 전체에서 이 문장을 가진 절의 수 */
  countVerse: (text: string) => number
}

function puzzle(p: Piece, src: QuizSource, rng: Rng): Question | null {
  const ok = src.versesOf(p.ref).filter((v) => {
    const n = wordsOf(v.text).length
    return n >= PUZZLE_MIN_WORDS && n <= PUZZLE_MAX_WORDS && src.countVerse(v.text) === 1
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
    src.versesOf(p.ref).filter((v) => norm(v.text).length >= MIN_VERSE_CHARS && src.countVerse(v.text) === 1),
    rng,
  )
  // 보기로 쓸 낱말: 같은 장 다른 절의 낱말
  const pool = [...new Set(chapterPieces.flatMap((cp) => src.versesOf(cp.ref).flatMap((v) => wordsOf(v.text))))].filter((w) => norm(w).length >= 2)
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
    src.versesOf(p.ref).filter((x) => norm(x.text).length >= MIN_VERSE_CHARS && src.countVerse(x.text) === 1),
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

export function buildQuiz(pieces: readonly Piece[], chapter: number, rng: Rng, src: QuizSource): Question[] {
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
      const key = q.kind === 'detective' ? q.pieceId : 'ref' in q ? q.ref : ''
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

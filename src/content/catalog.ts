// 콘텐츠 데이터의 단일 입구. 성경 문장은 versesOf로만 꺼낸다 (exclusion-list §0).
// 앱은 쓰는 다섯 권만 싣는다 (scripts/build-bible-subset.mjs, verify가 원본과 같은지 확인)
import raw from './bible-subset.json'
import books from './books.json'
import piecesRaw from './pieces.json'
import neighborsRaw from './neighbors.json'
import { expandRef, countsFrom } from './ref'
import { BOOKS, type Book, type GameContent, type NeighborDef, type Piece } from '../engine/types'
import type { Question, QuizSource } from '../engine/quiz'

const bible = raw as Record<string, string[][]>
const byAbbr = Object.fromEntries(books.map((b) => [b.abbr, b.id]))
const counts = countsFrom(bible)

/** 모든 책의 조각 */
const ALL_PIECES = piecesRaw as unknown as Piece[]
/** 엔진과 화면이 쓰는 조각 — 모든 책 (책별로는 piecesOf) */
export const PIECES = ALL_PIECES
export const NEIGHBORS = neighborsRaw as unknown as NeighborDef[]
export const CONTENT: GameContent = { pieces: PIECES, neighbors: NEIGHBORS }

export interface Verse {
  chapter: number
  verse: number
  text: string
}

export function versesOf(ref: string): Verse[] {
  return expandRef(ref, byAbbr, counts).map((k) => {
    const text = bible[k.bookId]?.[k.chapter - 1]?.[k.verse - 1]
    if (text === undefined) throw new Error(`no verse ${ref} ${k.chapter}:${k.verse}`)
    return { chapter: k.chapter, verse: k.verse, text }
  })
}

const pieceMap = new Map(PIECES.map((p) => [p.id, p]))
export function pieceById(id: string): Piece {
  const p = pieceMap.get(id)
  if (!p) throw new Error(`unknown piece ${id}`)
  return p
}

export function neighborById(id: string): NeighborDef | undefined {
  return NEIGHBORS.find((n) => n.id === id)
}

// ── 책별 조각과 퀴즈의 본문 ──
export const BOOK_ABBR: Record<Book, string> = { mt: '마', mk: '막', lk: '눅', jn: '요' }
const BOOK_IDS: Record<Book, string> = { mt: 'mat', mk: 'mrk', lk: 'luk', jn: 'jhn' }
const ABBR_BOOK: Record<string, Book> = { 마: 'mt', 막: 'mk', 눅: 'lk', 요: 'jn' }

const byBook = new Map<Book, Piece[]>(BOOKS.map((b) => [b, ALL_PIECES.filter((p) => p.book === b)]))
export function piecesOf(book: Book): Piece[] {
  return byBook.get(book) ?? []
}
/** 조각이 들어 있는 책 (시험판: 마가·누가) */
export const BOOKS_WITH_CONTENT: readonly Book[] = BOOKS.filter((b) => piecesOf(b).length > 0)

/** 띄어쓰기와 문장부호를 떼고 비교한다 — 띄어쓰기만 다른 같은 문장을 다른 문장으로 세지 않도록 */
const quizKey = (s: string) => s.replace(/[\s,.!?]+/g, '')
const verseCounts = new Map<Book, Map<string, number>>()
for (const b of BOOKS) {
  const m = new Map<string, number>()
  for (const ch of bible[BOOK_IDS[b]] ?? []) for (const v of ch) m.set(quizKey(v), (m.get(quizKey(v)) ?? 0) + 1)
  verseCounts.set(b, m)
}

const bookOfRef = (ref: string): Book => {
  const b = ABBR_BOOK[ref.trim().split(/\s+/)[0]]
  if (!b) throw new Error(`not a gospel ref: ${ref}`)
  return b
}

/** 퀴즈가 쓰는 본문: 절마다 참조를 붙이고, 고른 책들 안에서 같은 문장이 몇 번 나오는지 센다 */
export function quizSourceFor(books: readonly Book[]): QuizSource {
  return {
    versesOf: (ref) => {
      const abbr = BOOK_ABBR[bookOfRef(ref)]
      return versesOf(ref).map((v) => ({ ref: `${abbr} ${v.chapter}:${v.verse}`, text: v.text }))
    },
    countVerse: (text) => books.reduce((n, b) => n + (verseCounts.get(b)?.get(quizKey(text)) ?? 0), 0),
  }
}

const verseToPiece = new Map<string, Piece>()
for (const p of ALL_PIECES) for (const v of versesOf(p.ref)) verseToPiece.set(`${BOOK_ABBR[p.book]} ${v.chapter}:${v.verse}`, p)
/** '막 1:10' → 그 절을 담은 조각 (조각은 겹치지 않으므로 하나) */
export function pieceOfVerse(ref: string): Piece | undefined {
  return verseToPiece.get(ref.trim())
}

/** 틀린 문제를 "다시 읽을 구절"로 돌리기 위해: 문제가 가리키는 조각 */
export function pieceOfQuestion(q: Question): string | null {
  if (q.kind === 'detective') return q.pieceId
  if (q.kind === 'order' || q.kind === 'verse') return q.answer
  return pieceOfVerse(q.ref)?.id ?? null
}

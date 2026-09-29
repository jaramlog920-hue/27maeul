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

/** 절 번호만 있고 제 본문이 없는 절: '(없음)', 앞 절에 합쳐 번역된 '(25절에 포함되어 있음)'(행 15:26) */
export const noText = (text: string) => text === '(없음)' || /^\(\d+절에 포함되어 있음\)$/.test(text)

export function versesOf(ref: string): Verse[] {
  return expandRef(ref, byAbbr, counts)
    .map((k) => {
      const text = bible[k.bookId]?.[k.chapter - 1]?.[k.verse - 1]
      if (text === undefined) throw new Error(`no verse ${ref} ${k.chapter}:${k.verse}`)
      return { chapter: k.chapter, verse: k.verse, text }
    })
    .filter((v) => !noText(v.text)) // 본문이 없는 절 — 어디에도 보이지 않는다
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
export const BOOK_ABBR: Record<Book, string> = { mt: '마', mk: '막', lk: '눅', jn: '요', ac: '행' }
const BOOK_IDS: Record<Book, string> = { mt: 'mat', mk: 'mrk', lk: 'luk', jn: 'jhn', ac: 'act' }
const ABBR_BOOK: Record<string, Book> = { 마: 'mt', 막: 'mk', 눅: 'lk', 요: 'jn', 행: 'ac' }

const byBook = new Map<Book, Piece[]>(BOOKS.map((b) => [b, ALL_PIECES.filter((p) => p.book === b)]))
export function piecesOf(book: Book): Piece[] {
  return byBook.get(book) ?? []
}
/** 조각이 들어 있는 책 (사도행전은 조각을 넣기 전까지 빠진다) */
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
  if (!b) throw new Error(`not a book ref: ${ref}`)
  return b
}

/**
 * 괄호 구간에 든 절 ('막 16:10') — 퀴즈에 쓰지 않는다.
 * 대괄호 [ … ]: 막 16:9-20·요 7:53-8:11처럼 여러 절에 걸치면 괄호 글자가 없는 가운데 절도 넣는다.
 * 둥근 괄호 ( … ): 마 6:13 송영(사본 차이 표시)과 본문 속 풀이 괄호(막 7:3-4 등). 구별하지 않고 모두 넣는다 — 퀴즈에서 빼는 쪽이 늘 안전하다.
 * 본문이 없는 절 '(없음)'은 괄호로 치지 않는다(versesOf에서 이미 감춤).
 */
const bracketed = new Set<string>()
for (const b of BOOKS) {
  let square = false
  let round = false
  ;(bible[BOOK_IDS[b]] ?? []).forEach((ch, ci) =>
    ch.forEach((text, vi) => {
      if (noText(text)) return
      if (square || round || /[[\]()]/.test(text)) bracketed.add(`${BOOK_ABBR[b]} ${ci + 1}:${vi + 1}`)
      for (const c of text) {
        if (c === '[') square = true
        else if (c === ']') square = false
        else if (c === '(') round = true
        else if (c === ')') round = false
      }
    }),
  )
}
export const inBrackets = (ref: string) => bracketed.has(ref.trim())

/** 퀴즈가 쓰는 본문: 절마다 참조를 붙이고, 고른 책들 안에서 같은 문장이 몇 번 나오는지 센다 */
export function quizSourceFor(books: readonly Book[]): QuizSource {
  return {
    versesOf: (ref) => {
      const abbr = BOOK_ABBR[bookOfRef(ref)]
      return versesOf(ref).map((v) => {
        const r = `${abbr} ${v.chapter}:${v.verse}`
        return { ref: r, text: v.text, inBrackets: bracketed.has(r) }
      })
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

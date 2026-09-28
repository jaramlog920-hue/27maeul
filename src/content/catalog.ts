// 콘텐츠 데이터의 단일 입구. 성경 문장은 versesOf로만 꺼낸다 (exclusion-list §0).
// 앱은 쓰는 다섯 권만 싣는다 (scripts/build-bible-subset.mjs, verify가 원본과 같은지 확인)
import raw from './bible-subset.json'
import books from './books.json'
import piecesRaw from './pieces.json'
import neighborsRaw from './neighbors.json'
import { expandRef, countsFrom } from './ref'
import type { GameContent, NeighborDef, Piece } from '../engine/types'

const bible = raw as Record<string, string[][]>
const byAbbr = Object.fromEntries(books.map((b) => [b.abbr, b.id]))
const counts = countsFrom(bible)

/** 모든 책의 조각 */
const ALL_PIECES = piecesRaw as unknown as Piece[]
/** 작업 6 전까지: 엔진과 화면은 아직 누가 한 권만 안다 → 누가 조각만 넘긴다 (작업 6에서 ALL_PIECES로 바꾼다) */
export const PIECES = ALL_PIECES.filter((p) => p.book === 'lk')
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

// ── 기록 퀴즈의 본문 ──
/** 띄어쓰기와 문장부호를 떼고 비교한다 — 띄어쓰기만 다른 같은 문장을 다른 문장으로 세지 않도록 */
const quizKey = (s: string) => s.replace(/[\s,.!?]+/g, '')
const lukeCounts = new Map<string, number>()
for (const ch of bible.luk) for (const v of ch) {
  const k = quizKey(v)
  lukeCounts.set(k, (lukeCounts.get(k) ?? 0) + 1)
}

/** 퀴즈가 쓰는 본문: 절마다 참조를 붙이고, 누가복음 안에서 같은 문장이 몇 번 나오는지 센다 */
export const QUIZ_SOURCE = {
  versesOf: (ref: string) => versesOf(ref).map((v) => ({ ref: `눅 ${v.chapter}:${v.verse}`, text: v.text })),
  countVerse: (text: string) => lukeCounts.get(quizKey(text)) ?? 0,
}

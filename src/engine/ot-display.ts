// 구약 서고 전시 (계획 18 B18-11 일부, 2026-10-08): 책별 기록대 · 범위별 진열 · 함께 읽고 기억 남기기.
// 본문은 고치거나 요약하지 않는다 — 기록대에는 마친 날·장 수와 "내가 남긴 한 줄"(길잡이 아래 개인 메모)만, 본문과 구분해 보인다.
// 함께 읽기는 하루 한 번: 배우자(있으면 먼저)나 마음이 가까운 이웃(하트 4 이상)과. 마음 조금, 날짜와 함께 기억에 남는다. 점수 없음.
import type { GameState } from './game'
import { otBookFinished } from './books'
import { OT_BOOKS, OT_ROOMS, otRow, type OtBook, type OtRoom } from './ot-books'
import type { NeighborDef } from './types'

export interface OtBookRecord {
  book: OtBook
  chapters: number
  /** 마친 날 (옛 저장처럼 모르면 null — 지어내지 않는다) */
  end: number | null
  /** 길잡이 아래 남긴 한 줄 (장 순서) */
  lines: { chapter: number; text: string }[]
}

export function otBookRecord(s: Pick<GameState, 'copy' | 'myLines'>, book: OtBook): OtBookRecord {
  const lines: { chapter: number; text: string }[] = []
  for (const [k, text] of Object.entries(s.myLines ?? {})) {
    const m = /^guide:([a-z0-9]+):(\d+)$/.exec(k)
    if (m && m[1] === book && text.trim()) lines.push({ chapter: Number(m[2]), text })
  }
  return { book, chapters: otRow(book).chapters, end: s.copy?.days?.[book]?.end ?? null, lines: lines.sort((a, b) => a.chapter - b.chapter) }
}

/** 마친 책을 범위(방 표)별로 — 마친 책이 있는 범위만 */
export function otGroups(s: Pick<GameState, 'otProgress'>): { room: OtRoom; books: OtBook[] }[] {
  const done = OT_BOOKS.filter((b) => otBookFinished(s, b))
  return OT_ROOMS.map((room) => ({ room, books: done.filter((b) => room.books.includes(b)) })).filter((g) => g.books.length > 0)
}

/** 함께 읽기 마음 */
export const OT_READ_HEART = 3
/** 함께 읽을 이웃이 되는 마음 (하트 점수) */
export const OT_READ_HEARTS = 40

/** 함께 읽을 수 있는 사람: 배우자·연인 먼저, 그다음 마음이 가까운 이웃 (셋까지) */
export function otReadFriends(s: Pick<GameState, 'hearts' | 'romance'>, neighbors: readonly NeighborDef[]): string[] {
  const partner = s.romance?.partner ?? null
  const close = neighbors
    .filter((d) => d.id !== partner && !d.marketOnly && (s.hearts[d.id] ?? 0) >= OT_READ_HEARTS)
    .sort((a, b) => (s.hearts[b.id] ?? 0) - (s.hearts[a.id] ?? 0))
    .map((d) => d.id)
  return [...(partner ? [partner] : []), ...close].slice(0, 3)
}

export function canReadOtTogether(s: Pick<GameState, 'otProgress' | 'flags' | 'clock'>): boolean {
  return OT_BOOKS.some((b) => otBookFinished(s, b)) && s.flags.otReadDay !== s.clock.day
}

/** 함께 읽는다: 마음 +3, 오늘 한 번, otRead:<날> = 그 이웃 번호(neighbors 순서 + 1) */
export function readOtTogether<T extends Pick<GameState, 'otProgress' | 'flags' | 'clock' | 'hearts'>>(s: T, npc: string, neighbors: readonly NeighborDef[]): T {
  const i = neighbors.findIndex((d) => d.id === npc)
  if (i < 0 || !canReadOtTogether(s)) return s
  const day = s.clock.day
  return {
    ...s,
    hearts: { ...s.hearts, [npc]: Math.min(100, (s.hearts[npc] ?? 0) + OT_READ_HEART) },
    flags: { ...s.flags, otReadDay: day, [`otRead:${day}`]: i + 1 },
  }
}

/** 함께 읽은 기억 (최근 것부터) */
export function otReadMemories(s: Pick<GameState, 'flags'>, neighbors: readonly NeighborDef[]): { day: number; npc: string }[] {
  const out: { day: number; npc: string }[] = []
  for (const [k, v] of Object.entries(s.flags)) {
    const m = /^otRead:(\d+)$/.exec(k)
    const def = m ? neighbors[v - 1] : undefined
    if (m && def) out.push({ day: Number(m[1]), npc: def.id })
  }
  return out.sort((a, b) => b.day - a.day)
}

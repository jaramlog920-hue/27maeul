// 서고 잔치 (복음서 방이 다 찬 날·스물일곱 권이 다 꽂힌 날)의 모닥불 저녁 — 2026-10-13 사용자: 글 장면만 있어 밋밋했다.
// 가져온 음식 나누기 · 조각을 건넸던 이웃의 한마디 · 내 한 줄 낭독. 성경 글은 지어내지 않는다 — 조각의 구절 범위·개역한글 소제목,
// 플레이어가 직접 적은 '나의 한 줄'만 쓴다.
import { GIFTABLE, heartUp, notYet, type GameState } from './game'
import { GAIN } from './hearts'
import { count, take } from './items'
import { FESTIVAL_SPOTS } from './neighbors'
import { BOOKS, GOSPELS, type Book, type GameContent, type ItemId, type NeighborDef, type Piece } from './types'

export type FeastId = 'gospelFeast' | 'allFeast'

/** 그 잔치가 기리는 책 */
export const feastBooks = (id: FeastId): readonly Book[] => (id === 'gospelFeast' ? GOSPELS : BOOKS)

/** 오늘 저녁 열리는 잔치 (없으면 null) */
export function feastOf(s: Pick<GameState, 'flags'>): FeastId | null {
  if (s.flags.allFeast === 1) return 'allFeast'
  if (s.flags.gospelFeast === 1) return 'gospelFeast'
  return null
}

/** 모닥불 둘레에 오는 이웃 (이사 온 이웃 중 잔치 자리가 있는 사람) */
export function feastGuests(s: Pick<GameState, 'flags'>, content: Pick<GameContent, 'neighbors'>): NeighborDef[] {
  return content.neighbors.filter((d) => FESTIVAL_SPOTS[d.id] && !notYet(d, s.flags.villageLevel ?? 0, s.flags))
}

/** 내놓을 수 있는 음식 (가방에 있는 선물거리) */
export function feastFoods(s: Pick<GameState, 'inv'>): ItemId[] {
  return GIFTABLE.filter((i) => count(s.inv, i) > 0)
}

/**
 * 음식을 내놓는다: 하나를 덜고, 그것을 좋아하는 이웃마다 마음이 오른다 (좋아하는 선물과 같은 만큼). 빈손이어도 불이익 없음.
 * 기뻐한 이웃 id를 돌려준다
 */
export function shareFeastFood(s: GameState, item: ItemId, content: Pick<GameContent, 'neighbors'>): { state: GameState; glad: string[] } {
  const inv = take(s.inv, { [item]: 1 })
  if (!inv) return { state: s, glad: [] }
  let next: GameState = { ...s, inv }
  const glad = feastGuests(s, content).filter((d) => d.likes.includes(item)).map((d) => d.id)
  for (const id of glad) next = heartUp(next, id, GAIN.giftLiked)
  return { state: next, glad }
}

/** 이 잔치의 책에 들어간 조각을 건넸던 이웃 — 사람마다 가장 최근 하나, 최대 셋 */
export function feastGivers(s: Pick<GameState, 'pieceLog' | 'flags'>, id: FeastId, content: Pick<GameContent, 'neighbors' | 'pieces'>): { npc: string; piece: Piece }[] {
  const books = feastBooks(id)
  const guests = new Set(feastGuests(s, content).map((d) => d.id))
  const pieces = new Map(content.pieces.map((p) => [p.id, p]))
  const best = new Map<string, { piece: Piece; day: number }>()
  for (const [pid, got] of Object.entries(s.pieceLog ?? {})) {
    const npc = got.from.startsWith('npc:') ? got.from.slice(4) : null
    const piece = pieces.get(pid)
    if (!npc || !piece || !guests.has(npc) || !books.includes(piece.book)) continue
    const cur = best.get(npc)
    if (!cur || got.day > cur.day) best.set(npc, { piece, day: got.day })
  }
  return [...best.entries()].sort((a, b) => b[1].day - a[1].day).slice(0, 3).map(([npc, v]) => ({ npc, piece: v.piece }))
}

/** 낭독할 수 있는 '나의 한 줄' (그 잔치의 책에 적어 둔 것) */
export function feastLines(s: Pick<GameState, 'myLines'>, id: FeastId): { book: Book; text: string }[] {
  return feastBooks(id).flatMap((book) => {
    const text = s.myLines?.[`book:${book}`]?.trim()
    return text ? [{ book, text }] : []
  })
}

/** 낭독한 줄을 남긴다 (앨범 사진 아래에 함께 보인다) */
export function readFeastLine(s: GameState, id: FeastId, text: string): GameState {
  return { ...s, feastLines: { ...(s.feastLines ?? {}), [id]: text } }
}

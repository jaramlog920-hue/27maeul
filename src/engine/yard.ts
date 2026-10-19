// 집 둘레 살림 (2026-10-13 사용자: 빗물 항아리·갈대 말리는 틀을 직접 옮기고 싶다).
// 그림일 뿐 길을 막지 않는다 — 놓을 수 있는 곳은 첫 마을의 집 앞 둘레 바깥 땅
import { owns } from './easier'
import { add, count, hasSlotFor, take } from './items'
import type { GameState } from './game'
import type { Tile } from './types'
import { HOME_FRONT, houseAt, isIndoor, sameTile, walkableOn } from './world'
import { outdoorGround, isPermanentGarden } from './outdoor-layout'
import { footprint } from './room'

export type YardItem = 'rainJar' | 'reedRack'
export const YARD_ITEMS: readonly YardItem[] = ['rainJar', 'reedRack']
/** 처음 놓이는 자리 (문 앞 편지 바구니 오른쪽, 그 옆) */
export const YARD_DEFAULT: Record<YardItem, Tile> = { rainJar: { x: 7, y: 8 }, reedRack: { x: 8, y: 8 } }
/** 집 문 앞에서 이만큼(칸) 안 */
export const YARD_REACH = 6

export function yardSpot(s: Partial<Pick<GameState, 'yard'>>, item: YardItem): Tile {
  return s.yard?.[item] ?? YARD_DEFAULT[item]
}

/** 거둔 표식 (2026-10-13 사용자: 설치 해제하면 가방으로) — 거둔 동안은 아침 재료도 그림도 없다 */
const offKey = (i: YardItem) => `yardOff:${i}`
/** 집 둘레에 놓여 있는가 (가졌고, 거두지 않았다) */
export function yardPlaced(flags: Record<string, number>, i: YardItem): boolean {
  return owns(flags, i) && !flags[offKey(i)]
}

/** 이 칸에 놓인 내 살림 (놓여 있는 것만) */
export function yardItemAt(s: Pick<GameState, 'flags'> & Partial<Pick<GameState, 'yard'>>, t: Tile): YardItem | null {
  return YARD_ITEMS.find((i) => yardPlaced(s.flags, i) && sameTile(yardSpot(s, i), t)) ?? null
}

/** 거두어 가방에 넣는다. 가방이 꽉 찼으면 null */
export function stowYard(s: GameState, item: YardItem): GameState | null {
  if (!yardPlaced(s.flags, item) || !hasSlotFor(s.inv, item)) return null
  return { ...s, inv: add(s.inv, { [item]: 1 }), flags: { ...s.flags, [offKey(item)]: 1 } }
}

export function canPlaceYard(s: Pick<GameState, 'flags'> & Partial<Pick<GameState, 'yard' | 'map' | 'garden' | 'outdoor'>>, item: YardItem, t: Tile): boolean {
  if ((s.map ?? 'village') !== 'village') return false
  if (!outdoorGround(t)) return false
  if (isPermanentGarden(t) || s.garden?.[`${t.x},${t.y}`] || s.outdoor?.placements.some(f=>footprint(f).some(p=>sameTile(p,t)))) return false
  if (sameTile(t, HOME_FRONT) || !walkableOn('village', t) || isIndoor(t) || houseAt(t.x, t.y)) return false
  return !YARD_ITEMS.some((o) => o !== item && yardPlaced(s.flags, o) && sameTile(yardSpot(s, o), t))
}

/** 옮기거나, 거둔 것(가방 속)을 다시 놓는다 */
export function moveYard(s: GameState, item: YardItem, t: Tile): GameState | null {
  if (!owns(s.flags, item) || !canPlaceYard(s, item, t)) return null
  const yard = { ...(s.yard ?? {}), [item]: { x: t.x, y: t.y } }
  if (yardPlaced(s.flags, item)) return { ...s, yard }
  if (count(s.inv, item) <= 0) return null
  const flags = { ...s.flags }
  delete flags[offKey(item)]
  return { ...s, yard, flags, inv: take(s.inv, { [item]: 1 })! }
}

/** 불러올 때: 정수 칸이고 놓을 수 있는 자리만 남긴다 */
export function sanitizeYard(raw: unknown): Partial<Record<YardItem, Tile>> | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const out: Partial<Record<YardItem, Tile>> = {}
  for (const i of YARD_ITEMS) {
    const t = (raw as Record<string, unknown>)[i] as Tile | undefined
    if (t && Number.isInteger(t.x) && Number.isInteger(t.y) && (outdoorGround(t) || Math.abs(t.x - HOME_FRONT.x) + Math.abs(t.y - HOME_FRONT.y) <= YARD_REACH)) out[i] = { x: t.x, y: t.y }
  }
  return Object.keys(out).length ? out : undefined
}

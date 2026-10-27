// 구약 묶음 책장 (2026-10-27 사용자: 구약 서고는 넓혀 가며 직접 꾸미는 데 뜻이 있다) — 확장권을 받을 때마다
// 그 묶음의 책장을 가방에 받아, 서고 안 원하는 곳에 가구처럼 놓는다. 전에는 정해진 칸에 저절로 섰다.
import type { GameState } from './game'
import { addGift } from './items'
import { OT_ROOMS, type OtRoomId } from './ot-books'
import type { Furniture } from './room'
import type { ItemId, Tile } from './types'
import { INTERIOR } from './newland-config'

export const RANGE_SHELF_ITEMS = { law: 'otShelfLaw', history: 'otShelfHistory', poetry: 'otShelfPoetry', prophets: 'otShelfProphets' } as const satisfies Record<OtRoomId, ItemId>
export type RangeShelfItem = (typeof RANGE_SHELF_ITEMS)[OtRoomId]
export const ARCHIVE_ROOM_KEY = 'newland:archive'

export const rangeOfShelf = (item: string): OtRoomId | null =>
  (Object.entries(RANGE_SHELF_ITEMS).find(([, v]) => v === item)?.[0] as OtRoomId | undefined) ?? null
export const isRangeShelf = (item: string): item is RangeShelfItem => rangeOfShelf(item) !== null

/** 옛 저장에서 책장이 저절로 서 있던 칸 (서고 안 바닥 맨 윗줄 양끝) — 옮겨 오는 저장만 그 자리에 둔다 */
const OLD_SPOTS: readonly Tile[] = [
  { x: INTERIOR.x0 + 1, y: INTERIOR.y0 + 1 },
  { x: INTERIOR.x0 + 2, y: INTERIOR.y0 + 1 },
  { x: INTERIOR.x0 + INTERIOR.w - 3, y: INTERIOR.y0 + 1 },
  { x: INTERIOR.x0 + INTERIOR.w - 2, y: INTERIOR.y0 + 1 },
]

/**
 * 열린 묶음(flags.otExpand)마다 책장을 한 번씩 준다 (flags rangeShelf:<묶음>). old면 옛 저장 — 서 있던 칸에 그대로 놓는다
 * (그 칸이 이미 차 있으면 가방으로). 새로 받는 것은 가방으로.
 */
export function grantRangeShelves<S extends Pick<GameState, 'flags' | 'inv'> & Partial<Pick<GameState, 'rooms'>>>(s: S, old = false): S {
  const open = Math.min(OT_ROOMS.length, s.flags.otExpand ?? 0)
  let flags = s.flags, inv = s.inv
  let room: Furniture[] = [...(s.rooms?.[ARCHIVE_ROOM_KEY] ?? [])]
  for (let i = 0; i < open; i++) {
    const id = OT_ROOMS[i].id
    if (flags[`rangeShelf:${id}`]) continue
    flags = { ...flags, [`rangeShelf:${id}`]: 1 }
    const item = RANGE_SHELF_ITEMS[id]
    const spot = OLD_SPOTS[i]
    if (old && spot && !room.some((f) => f.x === spot.x && f.y === spot.y)) room = [...room, { item, x: spot.x, y: spot.y }]
    else inv = addGift(inv, { [item]: 1 })
  }
  if (flags === s.flags) return s
  const rooms = room.length ? { ...(s.rooms ?? {}), [ARCHIVE_ROOM_KEY]: room } : s.rooms
  return { ...s, flags, inv, ...(rooms ? { rooms } : {}) }
}

/** 서고 안에 놓인 묶음 책장이 이 칸에 있나 (누르면 작은 책장 창) */
export function rangeShelfAt(s: Partial<Pick<GameState, 'rooms'>>, t: Tile): Furniture | undefined {
  return (s.rooms?.[ARCHIVE_ROOM_KEY] ?? []).find((f) => isRangeShelf(f.item) && f.x === t.x && f.y === t.y)
}

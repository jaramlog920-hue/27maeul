// 방 꾸미기 (사용자 요청 2026-09-26): 가구마다 크기가 다르고, 탁자 위에는 작은 물건을 올린다.
//   floor  바닥에 깔리는 것(깔개·방석) — 밟고 지나간다, 다른 것 밑에 깔릴 수 있다
//   solid  길을 막는 것(식탁·협탁·의자) — 놓은 뒤에도 집 안 모든 자리에 갈 수 있어야 한다
//   small  작은 물건 — 탁자 위(한 칸에 하나) 또는 빈 바닥
import { findPath } from './movement'
import { ATTIC, BED_STAND, currentHomeLevel, HOME_ENTRY, inAttic, isHome, key, PLACES, placeActive, sameTile, SIDE_DOOR, tileAt, type Place } from './world'
import { LESSON_SPOT } from './stories'
import { addGift, type Inventory } from './items'
import type { ItemId, PlaceId, Tile } from './types'

import { FURNITURE_DEFS, type FurnitureDef, type Layer } from './furniture-defs'

export { FURNITURE_DEFS, type FurnitureDef, type Layer }

export const FURNITURE = Object.keys(FURNITURE_DEFS) as ItemId[]

export interface Furniture {
  item: ItemId
  x: number
  y: number
  /** 작은 물건이 탁자 위에 올려져 있다 */
  on?: boolean
}

export function footprint(f: Pick<Furniture, 'item' | 'x' | 'y'>): Tile[] {
  const d = FURNITURE_DEFS[f.item] ?? { w: 1, h: 1 }
  const out: Tile[] = []
  for (let dy = 0; dy < d.h; dy++) for (let dx = 0; dx < d.w; dx++) out.push({ x: f.x + dx, y: f.y + dy })
  return out
}

const layerOf = (f: Furniture): Layer => FURNITURE_DEFS[f.item]?.layer ?? 'small'

/**
 * 집 안에서 늘 비워 둬야 하는 칸: 물건 앞 서는 자리, 문깔개 앞(들어와 서는 칸), 아이가 글자를 배우러 오는 자리.
 * 넓힌 집: 새 방으로 드는 문과 그 안쪽 칸, 다락 문깔개 앞 (사다리·다락 창 앞은 PLACES의 서는 자리)
 */
function keepClear(): Tile[] {
  const stands = (Object.entries(PLACES) as [PlaceId, Place][]).flatMap(([id, p]) => (p.stand && placeActive(id) ? [p.stand] : []))
  const out = [...stands, HOME_ENTRY, LESSON_SPOT]
  const level = currentHomeLevel()
  if (level >= 1) out.push(SIDE_DOOR, { x: SIDE_DOOR.x + 1, y: SIDE_DOOR.y })
  if (level >= 2) out.push(ATTIC.entry)
  return out
}

/** 길을 막는 가구가 차지한 칸 */
export function solidTiles(room: readonly Furniture[]): Set<string> {
  return new Set(room.filter((f) => layerOf(f) === 'solid').flatMap((f) => footprint(f).map(key)))
}

function isFloor(t: Tile): boolean {
  return isHome(t) && tileAt(t.x, t.y) === 'f'
}

function surfaceAt(room: readonly Furniture[], t: Tile): Furniture | undefined {
  return room.find((f) => FURNITURE_DEFS[f.item]?.surface && footprint(f).some((p) => sameTile(p, t)))
}

/** 이 자리에 놓으면 어떻게 놓이는가 (null = 못 놓음) */
export function placement(room: readonly Furniture[], item: ItemId, t: Tile): Furniture | null {
  const def = FURNITURE_DEFS[item]
  if (!def) return null
  const clear = keepClear()
  if (def.layer === 'small') {
    // 탁자 위에 빈 칸이 있으면 그 위에
    const surf = surfaceAt(room, t)
    if (surf) return room.some((f) => f.on && sameTile(f, t)) ? null : { item, x: t.x, y: t.y, on: true }
    if (!isFloor(t) || clear.some((c) => sameTile(c, t))) return null
    if (room.some((f) => layerOf(f) !== 'floor' && footprint(f).some((p) => sameTile(p, t)))) return null
    return { item, x: t.x, y: t.y }
  }
  const f: Furniture = { item, x: t.x, y: t.y }
  const tiles = footprint(f)
  if (!tiles.every(isFloor)) return null
  if (def.layer === 'floor') {
    // 깔개끼리는 겹치지 않는다
    const floors = room.filter((o) => layerOf(o) === 'floor').flatMap(footprint)
    return tiles.some((p) => floors.some((q) => sameTile(p, q))) ? null : f
  }
  // 길을 막는 가구
  if (tiles.some((p) => clear.some((c) => sameTile(c, p)))) return null
  if (tiles.some((p) => room.some((o) => layerOf(o) !== 'floor' && !o.on && footprint(o).some((q) => sameTile(p, q))))) return null
  const blockers = solidTiles([...room, f])
  // 놓은 뒤에도 들어와 서는 칸에서 집 안 모든 자리에 갈 수 있어야 한다 (다락은 다락 문깔개 앞에서)
  const reach = keepClear().filter((c) => !sameTile(c, HOME_ENTRY) && !sameTile(c, ATTIC.entry) && isHome(c))
  for (const c of reach) if (findPath(inAttic(c) ? ATTIC.entry : HOME_ENTRY, c, blockers) === null) return null
  if (findPath(HOME_ENTRY, BED_STAND, blockers) === null) return null
  return f
}

/** 이 칸에서 치울 것: 위에 올린 작은 물건이 먼저, 그다음 가구 (탁자를 치우면 위의 것도 함께) */
export function removal(room: readonly Furniture[], t: Tile): Furniture[] {
  const top = room.find((f) => f.on && sameTile(f, t))
  if (top) return [top]
  const under = [...room].reverse().find((f) => !f.on && footprint(f).some((p) => sameTile(p, t)))
  if (!under) return []
  if (!FURNITURE_DEFS[under.item]?.surface) return [under]
  const tiles = footprint(under)
  return [under, ...room.filter((f) => f.on && tiles.some((p) => sameTile(p, f)))]
}

/** 지금 집 모양에 맞지 않는 가구는 가방으로 돌려보낸다 (집을 넓혔을 때·옛 저장) */
export function refitRoom(room: readonly Furniture[], inv: Inventory): { room: Furniture[]; inv: Inventory } {
  const kept: Furniture[] = []
  let bag = inv
  for (const f of room) {
    const ok = placement(kept, f.item, f)
    if (ok && ok.x === f.x && ok.y === f.y && !!ok.on === !!f.on) kept.push(ok)
    else bag = addGift(bag, { [f.item]: 1 })
  }
  return { room: kept, inv: bag }
}

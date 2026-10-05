// 방 꾸미기 (사용자 요청 2026-09-26): 가구마다 크기가 다르고, 탁자 위에는 작은 물건을 올린다.
//   floor  바닥에 깔리는 것(깔개·방석) — 밟고 지나간다, 다른 것 밑에 깔릴 수 있다
//   solid  길을 막는 것(식탁·협탁·의자) — 놓은 뒤에도 집 안 모든 자리에 갈 수 있어야 한다
//   small  작은 물건 — 탁자 위(한 칸에 하나) 또는 빈 바닥
import designs from '../content/spouse-rooms.json'
import { FIXTURES, LIVING_DOOR, PARTNER_DOOR } from './home-layout'
import { findPath } from './movement'
import { BED_STAND, currentHomeLevel, HOME_ENTRY, isHome, key, PLACES, placeActive, sameTile, SIDE_DOOR, tileAt, type Place } from './world'
import { LESSON_SPOT } from './stories'
import { SPOUSE_ROOM, SPOUSE_ROOM_ENTRY, SPOUSE_ROOM_RETURN } from './spouse-room'
import { addGift, type Inventory } from './items'
import type { Facing, ItemId, PlaceId, Tile } from './types'

import { FURNITURE_DEFS, LEGACY_FACING, type FurnitureDef, type Layer } from './furniture-defs'

export { FURNITURE_DEFS, type FurnitureDef, type Layer }

export const FURNITURE = Object.keys(FURNITURE_DEFS) as ItemId[]

export interface Furniture {
  /** 배운 생활 기술로 고른 모습 (skill-defs styles — 모르는 값은 본래 그림) */
  finish?: string
  item: ItemId
  x: number
  y: number
  /** 작은 물건이 탁자 위에 올려져 있다 */
  on?: boolean
  /** 보는 쪽 (계획 17 작업 2). 없으면 옛 그림이 보던 쪽 — facingOf */
  facing?: Facing
}

export const FACINGS: readonly Facing[] = ['down', 'up', 'left', 'right']
/** 돌리기 순서: 앞 → 오른쪽 → 뒤 → 왼쪽 */
const TURN: Record<Facing, Facing> = { down: 'right', right: 'up', up: 'left', left: 'down' }

export function isFacing(v: unknown): v is Facing {
  return typeof v === 'string' && (FACINGS as readonly string[]).includes(v)
}

export function facingOf(f: Pick<Furniture, 'item' | 'facing'>): Facing {
  return f.facing ?? LEGACY_FACING[f.item] ?? 'down'
}

/** 방향에 따른 크기: 옆을 보면 가로·세로가 바뀐다 (탁자 2×1 → 1×2) */
export function sizeOf(item: ItemId, facing: Facing = 'down'): { w: number; h: number } {
  const d = FURNITURE_DEFS[item] ?? { w: 1, h: 1 }
  return facing === 'left' || facing === 'right' ? { w: d.h, h: d.w } : { w: d.w, h: d.h }
}

export function footprint(f: Pick<Furniture, 'item' | 'x' | 'y' | 'facing'>): Tile[] {
  const d = sizeOf(f.item, facingOf(f))
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
  const out = [...stands, HOME_ENTRY, LESSON_SPOT, SPOUSE_ROOM_RETURN]
  if (currentHomeLevel() >= 1) out.push(SPOUSE_ROOM_ENTRY, PARTNER_DOOR)
  const level = currentHomeLevel()
  if (level >= 2) out.push(SIDE_DOOR, { x: SIDE_DOOR.x + 1, y: SIDE_DOOR.y }, { x: SIDE_DOOR.x - 1, y: SIDE_DOOR.y })
  if (level >= 3) out.push(LIVING_DOOR, { x: LIVING_DOOR.x - 1, y: LIVING_DOOR.y }, { x: LIVING_DOOR.x + 1, y: LIVING_DOOR.y })
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
export function placement(room: readonly Furniture[], item: ItemId, t: Tile, facing?: Facing): Furniture | null {
  const def = FURNITURE_DEFS[item]
  if (!def) return null
  const clear = keepClear()
  const turned = facing ? { facing } : {}
  if (def.layer === 'small') {
    // 탁자 위에 빈 칸이 있으면 그 위에
    const surf = surfaceAt(room, t)
    if (surf) return room.some((f) => f.on && sameTile(f, t)) ? null : { item, x: t.x, y: t.y, on: true, ...turned }
    if (!isFloor(t) || clear.some((c) => sameTile(c, t))) return null
    if (room.some((f) => layerOf(f) !== 'floor' && footprint(f).some((p) => sameTile(p, t)))) return null
    return { item, x: t.x, y: t.y, ...turned }
  }
  const f: Furniture = { item, x: t.x, y: t.y, ...turned }
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
  const reach = keepClear().filter((c) => !sameTile(c, HOME_ENTRY) && isHome(c))
  for (const c of reach) if (findPath(HOME_ENTRY, c, blockers) === null) return null
  if (placeActive('bed') && findPath(HOME_ENTRY, PLACES.bed.stand ?? BED_STAND, blockers) === null) return null
  for (const placed of [...room, f].filter(p => FURNITURE_DEFS[p.item]?.layer === 'solid')) {
    const around = footprint(placed).flatMap(p => [{ x: p.x + 1, y: p.y }, { x: p.x - 1, y: p.y }, { x: p.x, y: p.y + 1 }, { x: p.x, y: p.y - 1 }])
    if (!around.some(p => isHome(p) && !blockers.has(key(p)) && findPath(HOME_ENTRY, p, blockers) !== null)) return null
  }
  return f
}

/**
 * 놓인 가구를 한 번 돌린 모습 (null = 못 돌림). 왼쪽 위 칸은 그대로 두고, 크기가 바뀌면 놓기 규칙(벽·겹침·통로)을 다시 본다.
 * 위에 물건이 올려진 탁자·협탁은 돌리지 않는다 — 물건을 먼저 치운다.
 */
export function rotation(room: readonly Furniture[], f: Furniture): Furniture | null {
  if (!room.includes(f)) return null
  const def = FURNITURE_DEFS[f.item]
  if (!def) return null
  if (def.surface && !f.on) {
    const tiles = footprint(f)
    if (room.some((o) => o.on && tiles.some((p) => sameTile(p, o)))) return null
  }
  const next = TURN[facingOf(f)]
  const ok = placement(
    room.filter((o) => o !== f),
    f.item,
    f,
    next,
  )
  if (!ok || ok.x !== f.x || ok.y !== f.y || !!ok.on !== !!f.on) return null
  return ok
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
    const ok = placement(kept, f.item, f, f.facing)
    if (ok && ok.x === f.x && ok.y === f.y && !!ok.on === !!f.on) kept.push(ok)
    else bag = addGift(bag, { [f.item]: 1 })
  }
  return { room: kept, inv: bag }
}

export function initialHomeFurniture(): Furniture[] {
  return Object.entries(FIXTURES).map(([item, f]) => ({ item: item as ItemId, x: f.x, y: f.y }))
}
export function spouseFurniture(partner: string): Furniture[] {
  const design = designs.find(d => d.id === partner)
  return design?.placements.map((p, i) => ({ item: `spouse:${partner}:${i}` as ItemId,
    x: SPOUSE_ROOM.x0 + p.x, y: SPOUSE_ROOM.y0 + p.y, facing: p.facing as Facing,
    ...(p.layer === 'surface' ? { on: true } : {}) })) ?? []
}

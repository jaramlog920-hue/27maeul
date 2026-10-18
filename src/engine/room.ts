// 방 꾸미기 (사용자 요청 2026-09-26): 가구마다 크기가 다르고, 탁자 위에는 작은 물건을 올린다.
//   floor  바닥에 깔리는 것(깔개·방석) — 밟고 지나간다, 다른 것 밑에 깔릴 수 있다
//   solid  길을 막는 것(식탁·협탁·의자) — 놓은 뒤에도 집 안 모든 자리에 갈 수 있어야 한다
//   small  작은 물건 — 탁자 위(한 칸에 하나) 또는 빈 바닥
//   wall   벽에 거는 것 — 방 바닥 바로 위 벽 칸(세운 벽 포함), 길을 막지 않는다 (2026-10-12)
import designs from '../content/spouse-rooms.json'
import { isCopyFurniture } from './copy-furniture'
import { copyFurnitureFacing, copyFurnitureFacings } from './copy-furniture-views'
import { FIXTURES, LIVING_DOOR, PARTNER_DOOR } from './home-layout'
import { findPath } from './movement'
import { BED_STAND, currentHomeLevel, setHomeFurniture, HOME_ENTRY, isHome, key, PLACES, placeActive, sameTile, SIDE_DOOR, tileAt, type Place } from './world'
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
  if (isCopyFurniture(item)) facing = copyFurnitureFacing(item, facing)
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
export function keepClear(): Tile[] {
  const stands = (Object.entries(PLACES) as [PlaceId, Place][]).flatMap(([id, p]) => (p.stand && placeActive(id) ? [p.stand] : []))
  const out = [...stands, HOME_ENTRY, SPOUSE_ROOM_RETURN]
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

/** 벽걸이를 걸 수 있는 벽: 벽 칸이고 바로 아래가 집 안 바닥 (집 안에서 보이는 벽 면) */
export function isHangingWall(t: Tile): boolean {
  return tileAt(t.x, t.y) === '#' && isFloor({ x: t.x, y: t.y + 1 })
}

/**
 * 방 하나의 규칙에 필요한 것 (계획 20 작업 7). 집 안은 HOME_CTX(지금 동작 그대로), 새 터 입주 주택 안 방은 그 방 기준 ctx.
 *   isFloor   가구를 놓을 수 있는 바닥인가
 *   inside    방 안인가 (문깔개 포함 — 길 막힘 검사에서 가구 곁 빈 칸을 찾을 때)
 *   keepClear 늘 비워 둬야 하는 칸
 *   entry     들어와 서는 칸 (길찾기의 출발)
 *   reach     놓은 뒤에도 entry에서 닿아야 하는 칸들
 *   bedStand  있으면 이 자리에도 닿아야 한다 (집의 침대 앞)
 * 값은 호출할 때마다 읽는다 — 집 단계에 따라 집의 값이 달라지므로
 */
export interface RoomCtx {
  isFloor(t: Tile): boolean
  inside(t: Tile): boolean
  keepClear(): Tile[]
  readonly entry: Tile
  readonly reach: Tile[]
  readonly bedStand?: Tile
  /** 벽걸이를 걸 수 있는 벽인가 (없으면 첫 마을 집 기준 isHangingWall — 새 터 방은 제 지도·바닥으로 판단, 2026-10-18 감사 M-23) */
  hangingWall?(t: Tile): boolean
}

/** 첫 마을 내 집 (집 안 동작은 한 글자도 바뀌지 않는다) */
export const HOME_CTX: RoomCtx = {
  isFloor,
  inside: isHome,
  keepClear,
  entry: HOME_ENTRY,
  // 놓은 뒤에도 들어와 서는 칸에서 집 안 모든 자리에 갈 수 있어야 한다 (다락은 다락 문깔개 앞에서)
  get reach() {
    return keepClear().filter((c) => !sameTile(c, HOME_ENTRY) && isHome(c))
  },
  get bedStand() {
    return placeActive('bed') ? (PLACES.bed.stand ?? BED_STAND) : undefined
  },
}

function surfaceAt(room: readonly Furniture[], t: Tile): Furniture | undefined {
  return room.find((f) => FURNITURE_DEFS[f.item]?.surface && footprint(f).some((p) => sameTile(p, t)))
}

/** 이 자리에 놓으면 어떻게 놓이는가 (null = 못 놓음) */
export function placement(room: readonly Furniture[], item: ItemId, t: Tile, facing?: Facing, ctx: RoomCtx = HOME_CTX): Furniture | null {
  const def = FURNITURE_DEFS[item]
  if (!def) return null
  const clear = ctx.keepClear()
  const isFloor = ctx.isFloor
  const turned = facing ? { facing: isCopyFurniture(item) ? copyFurnitureFacing(item,facing) : facing } : {}
  if (def.layer === 'wall') {
    // 벽걸이는 앞만 본다. 차지하는 칸이 모두 '바닥 바로 위의 벽'이고 다른 벽걸이와 겹치지 않아야 한다
    if (facing && facing !== 'down' && !isCopyFurniture(item)) return null
    const f: Furniture = { item, x: t.x, y: t.y, ...(isCopyFurniture(item) ? turned : {}) }
    if (!footprint(f).every(ctx.hangingWall ?? isHangingWall)) return null
    if (room.some((o) => layerOf(o) === 'wall' && footprint(o).some((p) => footprint(f).some((q) => sameTile(p, q))))) return null
    return f
  }
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
  // 놓은 뒤에도 들어와 서는 칸에서 방 안 모든 자리에 갈 수 있어야 한다
  for (const c of ctx.reach) if (findPath(ctx.entry, c, blockers) === null) return null
  const bed = ctx.bedStand
  if (bed && findPath(ctx.entry, bed, blockers) === null) return null
  for (const placed of [...room, f].filter(p => FURNITURE_DEFS[p.item]?.layer === 'solid')) {
    const around = footprint(placed).flatMap(p => [{ x: p.x + 1, y: p.y }, { x: p.x - 1, y: p.y }, { x: p.x, y: p.y + 1 }, { x: p.x, y: p.y - 1 }])
    if (!around.some(p => ctx.inside(p) && !blockers.has(key(p)) && findPath(ctx.entry, p, blockers) !== null)) return null
  }
  return f
}

/**
 * 놓인 가구를 한 번 돌린 모습 (null = 못 돌림). 왼쪽 위 칸은 그대로 두고, 크기가 바뀌면 놓기 규칙(벽·겹침·통로)을 다시 본다.
 * 위에 물건이 올려진 탁자·협탁은 돌리지 않는다 — 물건을 먼저 치운다.
 */
export function rotation(room: readonly Furniture[], f: Furniture, ctx: RoomCtx = HOME_CTX): Furniture | null {
  if (!room.includes(f)) return null
  if (isCopyFurniture(f.item) && copyFurnitureFacings(f.item).length === 1) return null
  const def = FURNITURE_DEFS[f.item]
  if (!def) return null
  if (def.surface && !f.on) {
    const tiles = footprint(f)
    if (room.some((o) => o.on && tiles.some((p) => sameTile(p, o)))) return null
  }
  const next = isCopyFurniture(f.item) ? copyFurnitureFacings(f.item)[copyFurnitureFacing(f.item,facingOf(f)) === 'down' ? 1 : 0] : TURN[facingOf(f)]
  const ok = placement(
    room.filter((o) => o !== f),
    f.item,
    f,
    next,
    ctx,
  )
  if (!ok || ok.x !== f.x || ok.y !== f.y || !!ok.on !== !!f.on) return null
  // 돌려도 배운 마감은 그대로 (25-A)
  return f.finish ? { ...ok, finish: f.finish } : ok
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
export function refitRoom(room: readonly Furniture[], inv: Inventory, ctx: RoomCtx = HOME_CTX): { room: Furniture[]; inv: Inventory } {
  const kept: Furniture[] = []
  let bag = inv
  for (const f of room) {
    const ok = placement(kept, f.item, f, f.facing, ctx)
    // 배운 마감(finish)은 자리 검사와 상관없이 이어 붙인다 (2026-10-08 버그 25-A)
    if (ok && ok.x === f.x && ok.y === f.y && !!ok.on === !!f.on) kept.push(f.finish ? { ...ok, finish: f.finish } : ok)
    else bag = addGift(bag, { [f.item]: 1 })
  }
  return { room: kept, inv: bag }
}

export function initialHomeFurniture(): Furniture[] {
  return Object.entries(FIXTURES).map(([item, f]) => ({ item: item as ItemId, x: f.x, y: f.y }))
}

/** 붙박이 침대·책상을 지금 기본 자리로 (옛 저장) — 다른 가구가 자리를 잃지 않을 때만 */
export function upgradeAdultBed(room:readonly Furniture[]):Furniture[]{
  return moveOldWorkbench(moveOldDesk(shiftOldBed(room)))
}
/** 옛 자리(23,113·19,114)의 작업대를 필사 책상 바로 옆으로 — 이어 하는 저장에도 (2026-10-13 사용자: 새로 하기 전엔 안 바뀌었다).
 *  그 칸이 비어 있고 다른 가구가 자리를 잃지 않을 때만 */
function moveOldWorkbench(room:readonly Furniture[]):Furniture[]{
  const f=room.find(o=>o.item==='homeWorkbench'&&((o.x===23&&o.y===113)||(o.x===19&&o.y===114)))
  if(!f)return [...room]
  const next={...f,x:FIXTURES.homeWorkbench.x,y:FIXTURES.homeWorkbench.y}
  const occupied=room.filter(o=>o!==f&&layerOf(o)!=='floor'&&layerOf(o)!=='wall').flatMap(footprint)
  if(footprint(next).some(t=>occupied.some(p=>sameTile(t,p))))return [...room]
  const moved=room.map(o=>o===f?next:o)
  setHomeFurniture(room)
  const before=refitRoom(room,{}).room.length
  setHomeFurniture(moved)
  const after=refitRoom(moved,{}).room.length
  setHomeFurniture(room)
  return after<before?[...room]:moved
}
/** 옛 자리(17,113)의 필사 책상을 맨 아래 벽(17,114)으로 — 그 칸이 비어 있고 다른 가구가 자리를 잃지 않을 때만 */
function moveOldDesk(room:readonly Furniture[]):Furniture[]{
  const f=room.find(o=>o.item==='homeDesk'&&o.x===17&&o.y===113)
  if(!f)return [...room]
  const next={...f,x:FIXTURES.homeDesk.x,y:FIXTURES.homeDesk.y}
  const occupied=room.filter(o=>o!==f&&layerOf(o)!=='floor'&&layerOf(o)!=='wall').flatMap(footprint)
  if(footprint(next).some(t=>occupied.some(p=>sameTile(t,p))))return [...room]
  const moved=room.map(o=>o===f?next:o)
  setHomeFurniture(room)
  const before=refitRoom(room,{}).room.length
  setHomeFurniture(moved)
  const after=refitRoom(moved,{}).room.length
  setHomeFurniture(room)
  return after<before?[...room]:moved
}
function shiftOldBed(room:readonly Furniture[]):Furniture[]{
  return room.map(f=>{
    // 2026-10-12 사용자: 침대는 왼쪽 위(17,111)에 붙인다 — 잠깐 쓰던 자리(18,112)의 침대를 옮긴다
    if(f.item!=='homeBed'||f.x!==18||f.y!==112||facingOf(f)!=='down')return f
    const next={...f,x:FIXTURES.homeBed.x,y:FIXTURES.homeBed.y}
    const occupied=room.filter(o=>o!==f&&layerOf(o)!=='floor'&&layerOf(o)!=='wall').flatMap(footprint)
    if(footprint(next).some(t=>occupied.some(p=>sameTile(t,p))))return f
    // 옮긴 침대 때문에 다른 가구(침대 곁 탁자 등)가 자리를 잃으면 옮기지 않는다 — 가방으로 튕기지 않게
    const moved=room.map(o=>o===f?next:o)
    // 서는 칸(침대 곁)은 놓인 가구로 정해지므로 두 배치를 각각 깔아 보고 비교한다 (부른 쪽이 곧 다시 깐다)
    setHomeFurniture(room)
    const before=refitRoom(room,{}).room.length
    setHomeFurniture(moved)
    const after=refitRoom(moved,{}).room.length
    setHomeFurniture(room)
    return after<before?f:next
  })
}
export function spouseFurniture(partner: string): Furniture[] {
  const design = designs.find(d => d.id === partner)
  return design?.placements.map((p, i) => ({ item: `spouse:${partner}:${i}` as ItemId,
    x: SPOUSE_ROOM.x0 + p.x, y: SPOUSE_ROOM.y0 + p.y, facing: p.facing as Facing,
    ...(p.layer === 'surface' ? { on: true } : {}) })) ?? []
}

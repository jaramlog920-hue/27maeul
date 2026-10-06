// 새 터 입주 주택 안 방 (계획 20 작업 7): 방 칸(newland-config ROOM_SLOTS)에 건물을 하나씩 잇고,
// 방 하나의 가구 규칙(RoomCtx)과 소유 공간별 저장(GameState.rooms)을 맡는다.
// 가구를 놓고·돌리고·치우는 규칙 자체는 room.ts의 것 그대로다 — 이 파일은 "어느 방의 어느 규칙"만 정한다.
import type { GameState } from './game'
import { addGift, type Inventory } from './items'
import { NEWLAND_MAP, roomSlotAt } from './newland'
import { buildsOf, roomKeyFor, type Build } from './newland-build'

export { roomKeyFor, returnRoom } from './newland-build'
import { ROOM_SLOTS, type RoomSlot } from './newland-config'
import { FURNITURE_DEFS, HOME_CTX, isFacing, refitRoom, type Furniture, type RoomCtx } from './room'
import { setActiveMap, currentMapId } from './maps'
import type { ItemId, Tile } from './types'

const KEY_RE = /^newland:(b[1-9]\d{0,6})$/

/** 방 칸 하나의 규칙: 바닥(f)에만 놓고, 들어와 서는 칸은 비워 두고, 문깔개에서 모든 곳에 닿아야 한다 */
export function slotCtx(slot: RoomSlot): RoomCtx {
  const inSlot = (t: Tile) => t.x >= slot.x0 && t.x < slot.x0 + slot.w && t.y >= slot.y0 && t.y < slot.y0 + slot.h
  const ch = (t: Tile) => NEWLAND_MAP[t.y]?.[t.x]
  return {
    isFloor: (t) => inSlot(t) && ch(t) === 'f',
    inside: (t) => inSlot(t) && (ch(t) === 'f' || ch(t) === 'E'),
    keepClear: () => [{ ...slot.entry }],
    entry: { ...slot.entry },
    reach: [{ ...slot.exit }],
  }
}
const CTXS: readonly RoomCtx[] = ROOM_SLOTS.map(slotCtx)

type Where = Pick<GameState, 'newland' | 'player'> & Partial<Pick<GameState, 'map'>>

/** 이 방 칸을 쓰는 완공된 입주 주택 */
export function homeAtSlot(s: Pick<GameState, 'newland'>, slot: number): Build | undefined {
  return buildsOf(s).find((b) => b.kind === 'home' && b.state === 'done' && b.slot === slot)
}

/** 기록자가 서 있는 방 칸 번호 (새 터에서 방 칸 안일 때만, 아니면 -1) */
export function slotHere(s: Where): number {
  if (s.map !== 'newland') return -1
  return roomSlotAt({ x: Math.round(s.player.x), y: Math.round(s.player.y) })
}

/**
 * 가구를 꾸미는 방: 첫 마을(map이 첫 마을)이면 집(key null — 지금 동작 그대로), 새 터에서 건물 방 안이면 그 건물의 소유 공간,
 * 새 터에서 방 밖이면 꾸밀 방이 없다(undefined)
 */
export function roomTarget(s: Where & Partial<Pick<GameState, 'rooms' | 'room'>>): { key: string | null; ctx: RoomCtx; room: readonly Furniture[] } | undefined {
  if (s.map !== 'newland') return { key: null, ctx: HOME_CTX, room: s.room ?? [] }
  const i = slotHere(s)
  const b = i >= 0 ? homeAtSlot(s, i) : undefined
  return b ? { key: roomKeyFor(b.id), ctx: CTXS[i], room: s.rooms?.[roomKeyFor(b.id)] ?? [] } : undefined
}

/** 지금 꾸미는 방의 가구 (화면·길 막힘이 읽는다). 꾸밀 방이 없는 곳은 빈 목록 */
export function roomOf(s: Where & Partial<Pick<GameState, 'rooms' | 'room'>>): readonly Furniture[] {
  return roomTarget(s)?.room ?? []
}

/** 기록자가 새 터 건물 방 안에 있는가 (꾸미기 단추·방 고르기 줄이 읽는다) */
export const inBuildingRoom = (s: Where): boolean => slotHere(s) >= 0

/** 그 방의 가구를 바꾼 새 상태. 집(key null)은 room, 건물은 rooms[key] — 빈 목록이면 칸을 지운다 */
export function withRoomOf<T extends Pick<GameState, 'room'> & Partial<Pick<GameState, 'rooms'>>>(s: T, key: string | null, room: Furniture[]): T {
  if (key === null) return { ...s, room }
  const rooms = { ...(s.rooms ?? {}) }
  if (room.length) rooms[key] = room
  else delete rooms[key]
  return { ...s, rooms }
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v)

/** 새 터 지도로 잠깐 바꿔 한다 (방 안 길찾기가 새 터 칸을 읽는다) */
export function onNewlandMap<R>(fn: () => R): R {
  const before = currentMapId()
  setActiveMap('newland')
  try {
    return fn()
  } finally {
    setActiveMap(before)
  }
}

/**
 * 저장에서 불러올 때: 옛 저장(rooms 없음)은 undefined. 건물이 없거나 아직 완공 전인 키·모르는 키는 가구를 가방으로 돌려보내고,
 * 있는 방은 지금 규칙으로 놓을 수 없는 가구를 가방으로 돌려보낸다 (집과 같은 refitRoom). 깨진 가구 칸은 버린다
 */
export function sanitizeRooms(raw: unknown, s: Pick<GameState, 'newland'>, inv: Inventory): { rooms?: Record<string, Furniture[]>; inv: Inventory } {
  if (!isObj(raw)) return { inv }
  const out: Record<string, Furniture[]> = {}
  let bag = inv
  for (const [k, v] of Object.entries(raw)) {
    if (!Array.isArray(v)) continue
    const m = KEY_RE.exec(k)
    const b = m ? buildsOf(s).find((x) => x.id === m[1]) : undefined
    const items: Furniture[] = []
    for (const f of v) {
      if (!isObj(f) || typeof f.item !== 'string' || !FURNITURE_DEFS[f.item as ItemId] || !isInt(f.x) || !isInt(f.y)) continue
      items.push({
        item: f.item as ItemId,
        x: f.x,
        y: f.y,
        ...(f.on === true ? { on: true } : {}),
        ...(isFacing(f.facing) ? { facing: f.facing } : {}),
        ...(typeof f.finish === 'string' && f.finish.length <= 40 ? { finish: f.finish } : {}),
      })
      if (items.length >= 200) break
    }
    if (!b || b.kind !== 'home' || b.state !== 'done' || b.slot === undefined || !CTXS[b.slot]) {
      const back: Partial<Record<ItemId, number>> = {}
      for (const f of items) back[f.item] = (back[f.item] ?? 0) + 1
      bag = addGift(bag, back)
      continue
    }
    const fit = onNewlandMap(() => refitRoom(items, bag, CTXS[b.slot!]))
    bag = fit.inv
    if (fit.room.length) out[k] = fit.room
  }
  return { ...(Object.keys(out).length ? { rooms: out } : {}), inv: bag }
}

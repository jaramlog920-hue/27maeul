import designs from '../content/spouse-rooms.json'
import { currentHomeLevel } from './world'
import { PARTNER_ROOM, PARTNER_DOOR } from './home-layout'
import type { Tile } from './types'

/** The room shares the workshop's north wall and doorway. */
export const SPOUSE_ROOM = { x0: PARTNER_ROOM.x0, y0: PARTNER_ROOM.y0, w: 7, h: 7 }
export const SPOUSE_ROOM_DOOR: Tile = PARTNER_DOOR
export const SPOUSE_ROOM_RETURN: Tile = { x: 21, y: 111 }
export const SPOUSE_ROOM_EXIT: Tile = PARTNER_DOOR
export const SPOUSE_ROOM_ENTRY: Tile = { x: 21, y: 109 }
export const SPOUSE_ROOM_STAND: Tile = { x: 21, y: 107 }
export type SpouseRoomDesign = typeof designs[number]
let owner: string | null = null
export function setSpouseRoomOwner(id: string | null): void {
  owner = designs.some(d => d.id === id) ? id : null
}
export function currentSpouseRoom(): SpouseRoomDesign | null {
  return designs.find(d => d.id === owner) ?? null
}
export function inSpouseRoom(t: Tile): boolean {
  return currentHomeLevel() >= 1 && t.x >= SPOUSE_ROOM.x0 && t.x < SPOUSE_ROOM.x0 + 7 && t.y >= SPOUSE_ROOM.y0 && t.y < SPOUSE_ROOM.y0 + 7
}
// 모든 가구는 GameState.room에 저장하며 고정 배치는 충돌 판정에 쓰지 않는다.
export function spouseRoomTile(x: number, y: number): string | null {
  if (!inSpouseRoom({ x, y })) return null
  if (x === PARTNER_DOOR.x && y === PARTNER_DOOR.y) return 'D'
  return x === SPOUSE_ROOM.x0 || x === SPOUSE_ROOM.x0 + 6 || y === SPOUSE_ROOM.y0 || y === SPOUSE_ROOM.y0 + 6 ? '#' : 'f'
}

import designs from '../content/spouse-rooms.json'
import { PARTNER_ROOM } from './home-layout'
import type { Tile } from './types'

/** 배우자 방은 작업 공간의 북쪽 벽과 문을 함께 쓴다 */
export const SPOUSE_ROOM = { x0: PARTNER_ROOM.x0, y0: PARTNER_ROOM.y0, w: 7, h: 7 }
export const SPOUSE_ROOM_RETURN: Tile = { x: 21, y: 111 }
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

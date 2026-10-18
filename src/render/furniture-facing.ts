import { COOL_CUPBOARD } from './cooking-art'
import { SPOUSE_FURNITURE } from '../engine/furniture-defs'
import { SPOUSE_ROOM_VIEWS } from './spouse-room-art'
// 가구 방향 그림 고르기 (계획 17 작업 2): 원본은 home-space-directions(20종)·remaining-furniture-art(19종). 그림은 고치지 않고 고르기만 한다.
import type { FurnitureArt } from './furniture-art'
import { HOME_SHELF_DIRECTIONS, HOME_SPACE_DIRECTIONS, type DirectionalFurnitureArt } from './home-space-directions'
import { REMAINING_FIXTURE_DIRECTIONS, REMAINING_FURNITURE_DIRECTIONS } from './remaining-furniture-art'
import type { Facing } from '../engine/types'
import { ADDITION_FURNITURE_DIRECTIONS } from './addition-furniture-directions'
import { isCopyFurniture } from '../engine/copy-furniture'
import { copyFurnitureFacings } from '../engine/copy-furniture-views'

function viewsOf(item: string): DirectionalFurnitureArt | undefined {
  if (item === 'homeShelf') return HOME_SHELF_DIRECTIONS
  if (item === 'homeCoolCupboard') return COOL_CUPBOARD.closed
  const fixture = { homeCradle: 'cradle', homeBed: 'bed', homeDesk: 'desk', homeHearth: 'hearth', homeWorkbench: 'workbench' }[item as 'homeBed']
  if (fixture) return REMAINING_FIXTURE_DIRECTIONS[fixture]
  const p = SPOUSE_FURNITURE[item]
  if (p) return SPOUSE_ROOM_VIEWS[p.id] ?? HOME_SPACE_DIRECTIONS[p.id] ?? REMAINING_FURNITURE_DIRECTIONS[p.id] ?? ADDITION_FURNITURE_DIRECTIONS[p.id]
  return HOME_SPACE_DIRECTIONS[item] ?? REMAINING_FURNITURE_DIRECTIONS[item] ?? ADDITION_FURNITURE_DIRECTIONS[item]
}

/** 네 방향 그림이 있는 가구인가 (없으면 돌리기 단추를 내지 않는다) */
export function hasFacingArt(item: string): boolean {
  if (isCopyFurniture(item)) return copyFurnitureFacings(item).length > 1
  return !!viewsOf(item)
}

export function furnitureFacings(item: string): readonly Facing[] {
  return isCopyFurniture(item) ? copyFurnitureFacings(item) : ['down','right','up','left']
}

/** 이 방향의 그림 (방향 그림이 없으면 undefined — 지금 그림을 쓴다) */
export function facingArt(item: string, facing: Facing): FurnitureArt | undefined {
  return viewsOf(item)?.[facing]
}

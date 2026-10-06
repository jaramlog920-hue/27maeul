// 두 개의 지도 (계획 20 작업 3): 첫 마을과 새 터. 어느 지도에 있는지는 모듈 전역으로 두고
// (집 단계·열린 서고 문과 같은 방식) 게임 상태와 맞추는 것은 엔진 입구(game.ts의 syncHome)가 한다.
// 이 파일은 world.ts·newland.ts가 함께 읽으므로 아무 엔진 파일도 부르지 않는다.
import { NEWLAND_H, NEWLAND_VISIBLE_H, NEWLAND_W } from './newland-config'

export type MapId = 'village' | 'newland'
export const MAP_IDS: readonly MapId[] = ['village', 'newland']
export const isMapId = (v: unknown): v is MapId => v === 'village' || v === 'newland'

/** 첫 마을의 크기 (world.ts의 WIDTH·HEIGHT·VILLAGE_H가 이 값이다) */
export const VILLAGE_W = 48
export const VILLAGE_TOTAL_H = 120
export const VILLAGE_VISIBLE_H = 40

let active: MapId = 'village'
export function setActiveMap(id: MapId): void {
  active = id === 'newland' ? 'newland' : 'village'
}
export function currentMapId(): MapId {
  return active
}

/** 지금 지도의 가로 칸 수 */
export function mapWidth(id: MapId = active): number {
  return id === 'newland' ? NEWLAND_W : VILLAGE_W
}
/** 지금 지도의 세로 칸 수 (보이지 않는 안 방까지) */
export function mapHeight(id: MapId = active): number {
  return id === 'newland' ? NEWLAND_H : VILLAGE_TOTAL_H
}
/** 지금 지도에서 화면에 보이는 세로 칸 수 (그 아래는 보이지 않는 집 안 방) */
export function mapVisibleHeight(id: MapId = active): number {
  return id === 'newland' ? NEWLAND_VISIBLE_H : VILLAGE_VISIBLE_H
}

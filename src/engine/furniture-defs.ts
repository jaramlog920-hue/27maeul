// 가구 크기와 층 (방 꾸미기·이웃집 방이 함께 쓴다 — world가 room을 부르지 않게 따로 둔다)
import designs from '../content/spouse-rooms.json'
import type { ItemId } from './types'

export type Layer = 'floor' | 'solid' | 'small'
export interface FurnitureDef {
  w: number
  h: number
  layer: Layer
  /** 위에 작은 물건을 올릴 수 있다 */
  surface?: boolean
}

export const FURNITURE_DEFS: Partial<Record<ItemId, FurnitureDef>> = {
  homeCradle: { w: 1, h: 1, layer: 'solid' },
  homeBed: { w: 1, h: 1, layer: 'solid' },
  homeDesk: { w: 1, h: 1, layer: 'solid' },
  homeHearth: { w: 1, h: 1, layer: 'solid' },
  homeShelf: { w: 1, h: 1, layer: 'solid' },
  homeWorkbench: { w: 1, h: 1, layer: 'solid' },
  rug: { w: 3, h: 2, layer: 'floor' },
  cushion: { w: 1, h: 1, layer: 'floor' },
  table: { w: 2, h: 1, layer: 'solid', surface: true },
  nightstand: { w: 1, h: 1, layer: 'solid', surface: true },
  stool: { w: 1, h: 1, layer: 'solid' },
  pot: { w: 1, h: 1, layer: 'small' },
  vase: { w: 1, h: 1, layer: 'small' },
  basket: { w: 1, h: 1, layer: 'small' },
  jar: { w: 1, h: 1, layer: 'small' },
  candle: { w: 1, h: 1, layer: 'small' },
  bowl: { w: 1, h: 1, layer: 'small' },
  bird: { w: 1, h: 1, layer: 'small' },
  // 가구 20종 (2026-09-29)
  chair: { w: 1, h: 1, layer: 'solid' },
  bookcase: { w: 1, h: 1, layer: 'solid' },
  chest: { w: 1, h: 1, layer: 'solid' },
  barrel: { w: 1, h: 1, layer: 'solid' },
  wheel: { w: 1, h: 1, layer: 'solid' },
  lectern: { w: 1, h: 1, layer: 'solid' },
  lampStand: { w: 1, h: 1, layer: 'solid' },
  bigPlant: { w: 1, h: 1, layer: 'solid' },
  longBench: { w: 2, h: 1, layer: 'solid' },
  daybed: { w: 2, h: 1, layer: 'solid' },
  cupboard: { w: 2, h: 1, layer: 'solid' },
  roundRug: { w: 2, h: 2, layer: 'floor' },
  mat: { w: 2, h: 1, layer: 'floor' },
  pillows: { w: 1, h: 1, layer: 'floor' },
  // 꾸미기 (계획 13 작업 7)
  shell: { w: 1, h: 1, layer: 'small' },
  lantern: { w: 1, h: 1, layer: 'small' },
  purpleRug: { w: 2, h: 1, layer: 'floor' },
  teapot: { w: 1, h: 1, layer: 'small' },
  fruitBowl: { w: 1, h: 1, layer: 'small' },
  scrolls: { w: 1, h: 1, layer: 'small' },
  inkpot: { w: 1, h: 1, layer: 'small' },
  dryFlowers: { w: 1, h: 1, layer: 'small' },
  hourglass: { w: 1, h: 1, layer: 'small' },
  // 편해지는 살림 (계획 11 작업 1): 잉크 항아리(장날), 재료 궤짝(목수)
  inkJar: { w: 1, h: 1, layer: 'solid' },
  supplyChest: { w: 1, h: 1, layer: 'solid' },
  homeCoolCupboard: { w: 1, h: 1, layer: 'solid' },
  // 아이와 같이 만든 장난감 (계획 12)
  woodToy: { w: 1, h: 1, layer: 'small' },
  clothDoll: { w: 1, h: 1, layer: 'small' },
}


/**
 * 가구 방향 (계획 17 작업 2): 저장에 방향이 없던 가구가 보던 쪽.
 * 그림 원본(render/home-space-directions.ts의 HOME_SPACE_LEGACY_FACING)과 같은 값 — 엔진이 그림을 부르지 않게 값만 옮겨 둔다.
 * 여기 없는 가구는 앞(down)을 본다.
 */
export const LEGACY_FACING: Partial<Record<ItemId, 'left' | 'right'>> = { chair: 'right', woodToy: 'right', teapot: 'left' }

export const SPOUSE_FURNITURE = Object.fromEntries(designs.flatMap(d => d.placements.map((p, i) => [`spouse:${d.id}:${i}`, { ...p, owner: d.name } ])))
for (const [id, p] of Object.entries(SPOUSE_FURNITURE)) {
  const side = p.facing === 'left' || p.facing === 'right'
  FURNITURE_DEFS[id as ItemId] = { w: side ? p.h : p.w, h: side ? p.w : p.h,
    layer: p.layer === 'floor' ? 'floor' : p.blocking ? 'solid' : 'small',
    surface: p.layer === 'furniture' && (p.id.includes('desk') || p.id.includes('table') || p.id.includes('sideboard') || p.id === 'cupboard') }
}

for (const [id, p] of Object.entries(SPOUSE_FURNITURE)) if (p.facing === 'left' || p.facing === 'right') LEGACY_FACING[id as ItemId] = p.facing

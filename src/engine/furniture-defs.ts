// 가구 크기와 층 (방 꾸미기·이웃집 방이 함께 쓴다 — world가 room을 부르지 않게 따로 둔다)
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
  // 아이와 같이 만든 장난감 (계획 12)
  woodToy: { w: 1, h: 1, layer: 'small' },
  clothDoll: { w: 1, h: 1, layer: 'small' },
}


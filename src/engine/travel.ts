// 이웃 마을 여행 (계획 13 작업 6): 나루에서 배(배삯) 또는 걸어서(식량). 하룻밤 묵고(숙박비) 다음 날 아침 집으로.
// 여행지는 가상의 이웃 마을·항구 — 실제 지명·시대를 붙이지 않는다 (exclusion-list).
// 여행지마다 희귀품 가게와, 처음 갔을 때 한 번뿐인 이야기 (이웃 한 사람과 이어진다).
import type { ItemId } from './types'

export type DestId = 'harbor' | 'hillTown'
export const DEST_IDS: readonly DestId[] = ['harbor', 'hillTown']

export interface Dest {
  id: DestId
  name: string
  /** 가는 길 */
  way: string
  /** 배삯 (닢) */
  fare: number
  /** 걸어가는 길에 먹을 것 */
  food: Partial<Record<ItemId, number>>
  /** 하룻밤 숙박비 (닢) */
  lodging: number
  /** 희귀품 가게: 장날 희귀 좌판보다 조금 싸다 (다녀오는 품이 드니까) */
  shop: Partial<Record<ItemId, number>>
  /** 처음 간 날의 이야기와 이어진 이웃 (마음이 오른다) */
  friend: string
  /** 처음 간 날 이야기 속에서 받는 것 */
  keepsake: Partial<Record<ItemId, number>>
}

export const DESTS: Readonly<Record<DestId, Dest>> = {
  harbor: {
    id: 'harbor',
    name: '바닷가 항구 마을',
    way: '배를 타고',
    fare: 25,
    food: {},
    lodging: 10,
    shop: { purpleCloth: 75, perfumeOil: 50, finePapyrus: 15, shell: 12 },
    friend: 'wendell',
    keepsake: { bread: 1 },
  },
  hillTown: {
    id: 'hillTown',
    name: '언덕 너머 마을',
    way: '걸어서',
    fare: 0,
    food: { bread: 2 },
    lodging: 8,
    shop: { bronzeOrnament: 90, sealWax: 28, finePapyrus: 15, lantern: 14 },
    friend: 'poppy',
    keepsake: { dryFlowers: 1 },
  },
}

/** 여행은 아침에 떠난다 (정오가 지나면 다음 날) */
export const TRIP_LEAVE_BY = 12 * 60
/** 처음 간 날의 이야기로 오르는 마음 */
export const TRIP_FRIEND_GAIN = 5

/** 여행 전체에 드는 닢: 배삯 + 숙박비 + 산 물건 */
export function tripCost(dest: Dest, buys: readonly ItemId[]): number {
  return dest.fare + dest.lodging + buys.reduce((n, id) => n + (dest.shop[id] ?? 0), 0)
}

// 1닢 약 1,000원의 체감을 기준으로 한 고정 가격. 진행도에 따라 상점 가격을 올리지 않는다.
import { ADDITION_FURNITURE } from './furniture-additions'
import type { ItemId } from './types'

/** 재료 교환 가치: 현행 상인 판매가와 같은 기준. 차액은 닢으로 지불한다. */
export const BARTER_VALUES: Partial<Record<ItemId, number>> = {
  water: 1, reed: 1, barley: 2, bread: 4, soot: 2, fig: 3,
  ink: 8, papyrus: 6, cover: 25, herb: 4, bean: 3, olive: 2,
  wool: 4, grapes: 3, oil: 7, honey: 6, scentCandle: 9,
  purpleCloth: 90, blueDye: 6,
}
export function barterValue(items: Partial<Record<ItemId, number>>): number {
  return Object.entries(items).reduce((n, [id, count]) => n + (BARTER_VALUES[id as ItemId] ?? 0) * (count ?? 0), 0)
}

/** 구매 가능한 기존 가구·소품과 추가 생활 가구의 공통 소매가. */
export const FURNITURE_PRICES: Partial<Record<ItemId, number>> = {
  rug: 180, table: 220, nightstand: 150, vase: 30, jar: 25, candle: 12,
  bowl: 15, bird: 20, chair: 150, bookcase: 350, chest: 220, barrel: 150,
  wheel: 300, lectern: 250, lampStand: 180, bigPlant: 90, longBench: 280,
  daybed: 800, cupboard: 650, roundRug: 180, mat: 40, pillows: 30,
  teapot: 30, fruitBowl: 30, scrolls: 25, inkpot: 20, dryFlowers: 20,
  hourglass: 70, purpleRug: 600,
  ...Object.fromEntries(Object.entries(ADDITION_FURNITURE).map(([id, def]) => [id, def.coins])),
}
export const FURNITURE_RESALE_RATE = 0.5

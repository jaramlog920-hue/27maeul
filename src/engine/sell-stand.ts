// 마을 매대 (2026-10-12 사용자: 가진 물건은 매대에서 언제든 판다)
// 광장 동쪽(예전 벤치 자리)의 과일 진열대. 장날 상인보다 값은 조금 낮지만 날마다·시간 상관없이, 가진 물건 대부분을 받는다.
// 엮은 말씀 책·말씀 조각은 물건이 아니라 팔 수 없고(§3-3), 도구·들꽃 다발·약속의 끈도 받지 않는다.
import type { GameState } from './game'
import { RARE_PRICES, TRADES } from './game'
import { ADDITION_FURNITURE, isAddition } from './furniture-additions'
import { FURNITURE_DEFS } from './furniture-defs'
import { count, take, TOOLS } from './items'
import { SELL_PRICES } from './merchant-selling'
import { STALL_EXTRA } from './stall'
import { sellBonus } from './stats'
import type { ItemId, Tile } from './types'

/** 매대 두 칸 (지도 글자 'X' — 광장 동쪽 벤치 자리)과 그 곁 서는 칸 */
export const SELL_STAND_TILES: readonly Tile[] = [{ x: 29, y: 21 }, { x: 30, y: 21 }]
export const SELL_STAND_STAND: Tile = { x: 28, y: 21 }
/** 하루에 매대에 넘길 수 있는 수 (경제를 지키는 한도) */
export const STAND_CAP = 20

const NOT_FOR_SALE = new Set<ItemId>([...TOOLS, 'bouquet', 'promiseCord', 'rainJar', 'reedRack'])

/** 장터에서 사면 드는 값 (닢이면 그대로, 물건이면 상인 값으로 셈) — 가구·장식의 되파는 값 셈에 */
function tradeValue(item: ItemId): number | undefined {
  const t = TRADES.find((x) => Object.keys(x.get).length === 1 && x.get[item] === 1 && !x.grants)
  if (!t) return undefined
  if (t.coins !== undefined) return t.coins
  let sum = 0
  for (const [id, n] of Object.entries(t.pay) as [ItemId, number][]) sum += (SELL_PRICES[id] ?? 2) * n
  return sum
}

/** 매대 값 (없으면 받지 않는 물건). 재료·먹을 것은 상인 값의 8할, 가구·장식·희귀품은 산 값의 절반 */
export function standPrice(s: Pick<GameState, 'stats'>, item: ItemId): number | undefined {
  if (NOT_FOR_SALE.has(item)) return undefined
  const bonus = sellBonus(s.stats)
  const sold = SELL_PRICES[item] ?? STALL_EXTRA[item]
  if (sold !== undefined) return Math.max(1, Math.round(sold * 0.8)) + bonus
  if (isAddition(item)) return Math.max(1, Math.round(ADDITION_FURNITURE[item].coins / 2)) + bonus
  const rare = RARE_PRICES[item]
  if (rare !== undefined) return Math.max(1, Math.round(rare / 2)) + bonus
  if (FURNITURE_DEFS[item]) {
    const v = tradeValue(item)
    if (v !== undefined) return Math.max(1, Math.round(v / 2)) + bonus
  }
  return undefined
}

export function standSoldToday(s: Pick<GameState, 'clock' | 'flags'>): number {
  return s.flags.standDay === s.clock.day ? (s.flags.standCount ?? 0) : 0
}

export type StandBlock = 'none' | 'cap' | null
export function canStandSell(s: GameState, item: ItemId): StandBlock {
  if (standPrice(s, item) === undefined || count(s.inv, item) === 0) return 'none'
  if (standSoldToday(s) >= STAND_CAP) return 'cap'
  return null
}

/** 매대에 한 개 넘긴다 */
export function standSell(s: GameState, item: ItemId): GameState | null {
  if (canStandSell(s, item)) return null
  return {
    ...s,
    inv: take(s.inv, { [item]: 1 })!,
    coins: s.coins + standPrice(s, item)!,
    flags: { ...s.flags, standDay: s.clock.day, standCount: standSoldToday(s) + 1 },
  }
}

/** 지금 가방에서 매대에 넘길 수 있는 물건 (값이 있는 것만) */
export function standGoods(s: GameState): ItemId[] {
  return (Object.keys(s.inv) as ItemId[]).filter((id) => (s.inv[id] ?? 0) > 0 && standPrice(s, id) !== undefined)
}

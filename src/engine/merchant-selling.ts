import { isMarketDay } from './calendar'
import type { GameState } from './game'
import { count, take } from './items'
import { sellBonus } from './stats'
import type { ItemId } from './types'

/** Merchant sales depend on stock and market day, independently of scribe progress. */
export const SELL_PRICES: Partial<Record<ItemId, number>> = {
  ink: 8, papyrus: 6, cover: 25, herb: 4, bean: 3, olive: 2,
  wool: 4, grapes: 3, oil: 7, honey: 6, scentCandle: 9,
}
export const SELL_CAP = 10

export function soldToday(s: Pick<GameState, 'clock' | 'flags'>): number {
  return s.flags.soldDay === s.clock.day ? (s.flags.soldCount ?? 0) : 0
}

export type SellBlock = 'notMarket' | 'none' | 'cap' | null
export function canSell(s: GameState, item: ItemId): SellBlock {
  if (SELL_PRICES[item] === undefined || count(s.inv, item) === 0) return 'none'
  if (!isMarketDay(s.clock.day)) return 'notMarket'
  if (soldToday(s) >= SELL_CAP) return 'cap'
  return null
}

export function sellPrice(s: Pick<GameState, 'stats'>, item: ItemId): number | undefined {
  const base = SELL_PRICES[item]
  return base === undefined ? undefined : base + sellBonus(s.stats)
}

export function sell(s: GameState, item: ItemId): GameState | null {
  if (canSell(s, item)) return null
  return {
    ...s,
    inv: take(s.inv, { [item]: 1 })!,
    coins: s.coins + sellPrice(s, item)!,
    flags: { ...s.flags, soldDay: s.clock.day, soldCount: soldToday(s) + 1 },
  }
}

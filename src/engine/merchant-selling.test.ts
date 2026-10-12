import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame } from './game'
import type { GameState } from './game'
import type { ItemId } from './types'
import { canSell, sell, sellPrice, SELL_CAP, SELL_PRICES } from './merchant-selling'

const market = () => ({ ...newGame(CONTENT), clock: { day: 7, minute: 600 }, inv: { herb: 12, ink: 2, goldLeaf: 1 } })

describe('merchant inventory sales', () => {
  it('lets a beginning player sell every listed item without letters or shelved books', () => {
    const base = market()
    for (const item of Object.keys(SELL_PRICES) as ItemId[]) {
      const s = { ...base, inv: { [item]: 2 } }
      expect(canSell(s, item)).toBeNull()
      const next = sell(s, item)!
      expect(next.inv[item]).toBe(1)
      expect(next.coins).toBe(s.coins + sellPrice(s, item)!)
      expect(next.flags).toMatchObject({ soldDay: 7, soldCount: 1 })
      expect(next.progress).toEqual(s.progress)
      expect(next.shelved).toEqual(s.shelved)
    }
  })
  it('retains stock, market day and daily cap restrictions and resets next market', () => {
    const s = market()
    expect(canSell(s, 'goldLeaf')).toBe('none')
    expect(canSell(s, 'honey')).toBe('none')
    expect(sell(s, 'goldLeaf')).toBeNull()
    const off = { ...s, clock: { day: 8, minute: 600 } }
    expect(canSell(off, 'herb')).toBe('notMarket')
    expect(sell(off, 'herb')).toBeNull()
    let next: GameState = s
    for (let i = 0; i < SELL_CAP; i++) next = sell(next, 'herb')!
    expect(next.inv.herb).toBe(2)
    expect(next.coins).toBe(s.coins + SELL_CAP * sellPrice(s, 'herb')!)
    expect(canSell(next, 'herb')).toBe('cap')
    expect(sell(next, 'herb')).toBeNull()
    const later = sell({ ...next, clock: { day: 14, minute: 600 } }, 'herb')!
    expect(later.flags.soldCount).toBe(1)
    expect(later.inv.herb).toBe(1)
  })
})

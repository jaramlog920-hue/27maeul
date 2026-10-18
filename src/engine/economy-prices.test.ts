import { describe, it, expect } from 'vitest'
import { CONTENT } from '../content/catalog'
import { FURNITURE_PRICES, barterValue } from './economy-prices'
import { ADDITION_FURNITURE } from './furniture-additions'
import { TRADES, trade, tradeOnMarket, chapterGift, newGame, startCopy, writeVerse, HOME_STAGES } from './game'
import { legacyGame } from './growth-test-support'
import { standPrice, standSell } from './sell-stand'
import { copyVerses } from './copying'
import { TEA_PRICE } from './places'
import { DATE_TEA_PRICE } from './romance'
import { DESTS } from './travel'
import { serialize, deserialize } from './save'
import type { ItemId } from './types'

describe('생활 물가 조정', () => {
  it('생활비와 큰 목표 가격을 제안대로 적용한다', () => {
    expect(TEA_PRICE).toBe(3)
    expect(DATE_TEA_PRICE).toBe(6)
    expect([DESTS.harbor.lodging, DESTS.hillTown.lodging]).toEqual([50, 30])
    expect(HOME_STAGES.map(s => s.coins)).toEqual([2500, 4000, 6000])
    for (const [id, price] of [['homeKey', 8000], ['speedClock', 5000], ['setClock', 10000]] as const) expect(TRADES.find(t => t.id === id)?.coins).toBe(price)
  })
  it('모든 가구의 교환 비용이 소매가를 충족하고 사고 바로 팔아 차익을 낼 수 없다', () => {
    const g = legacyGame(CONTENT)
    for (const t of TRADES) {
      const item = Object.keys(t.get)[0] as ItemId | undefined
      if (!item || FURNITURE_PRICES[item] === undefined) continue
      const retail = FURNITURE_PRICES[item]!
      const cost = (t.coins ?? 0) + barterValue(t.pay)
      expect(cost, t.id).toBeGreaterThanOrEqual(retail)
      expect(standPrice(g, item), t.id).toBe(Math.floor(retail / 2))
      expect(standPrice(g, item)!, t.id).toBeLessThan(cost)
      const day = Array.from({length: 10}, (_, i) => (i + 1) * 7).find(d => tradeOnMarket(t, d))!
      const before = { ...g, coins: 2000, flags: { ...g.flags, 'unlock:moreTrades': 1, moreTrades: 1 }, clock: { day, minute: 600 }, inv: { ...t.pay } }
      const bought = trade(before, t)
      expect(bought, t.id).not.toBeNull()
      const sold = standSell(bought!, item)!
      expect(sold.coins - before.coins - barterValue(t.pay), t.id).toBeLessThan(0)
    }
  })
  it('물물교환 가구는 재료와 차액을 함께 요구하며 부족하면 소모하지 않는다', () => {
    const g = legacyGame(CONTENT)
    const t = TRADES.find(t => t.id === 'chair')!
    const s = { ...g, clock: { day: 7, minute: 600 }, coins: 0, inv: { ...t.pay } }
    expect(t.coins).toBe(145)
    expect(trade(s, t)).toBeNull()
    expect(s.inv).toEqual(t.pay)
    const bought = trade({ ...s, coins: 145 }, t)!
    expect(bought.coins).toBe(0)
    expect(bought.inv.chair).toBe(1)
    expect(bought.inv.olive ?? 0).toBe(0)
    expect(bought.inv.wool ?? 0).toBe(0)
  })
  it('가격 변경으로 기존 저장의 돈이나 가구를 재계산하지 않는다', () => {
    const g = newGame(CONTENT)
    const s = { ...g, coins: 1234, inv: { wardrobe: 1 } }
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.coins).toBe(1234)
    expect(back.inv.wardrobe).toBe(1)
    expect(ADDITION_FURNITURE.wardrobe.coins).toBe(650)
  })
  it('완료한 장은 재필사를 막고 최초 완성 선물은 유지한다', () => {
    const book = 'phm' as const, verses = copyVerses(book, 1, CONTENT)
    const day = Array.from({length: 100}, (_, i) => i + 1).find(day => chapterGift(day, book, 1))!
    const g = newGame(CONTENT)
    const base = startCopy({ ...g, clock: { day, minute: 600 } }, book, CONTENT)
    const last = verses.at(-1)!
    const ready = { ...base, copy: { ...base.copy, at: { ...base.copy.at, [book]: { chapter: 1, verse: last.verse } } } }
    const first = writeVerse(ready, book, last.text, CONTENT)
    expect(first.result.kind === 'chapter' && first.result.gift).toBeTruthy()
    const repeat = writeVerse({ ...first.state, copy: { ...first.state.copy, at: { ...first.state.copy.at, [book]: { chapter: 1, verse: last.verse } } } }, book, last.text, CONTENT)
    expect(repeat.result.kind).toBe('none')
    expect(repeat.state.inv).toEqual(first.state.inv)
  })
})

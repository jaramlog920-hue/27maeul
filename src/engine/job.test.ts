import { CONTENT } from '../content/catalog'
import { canCraft, canSell, newGame, sell, TRADES, trade } from './game'
import { COVER_FROM, jobLevel, jobOf, LETTER_BASE, SELL_FROM } from './job'
import { letterPay } from './requests'

const marketDay = (s: ReturnType<typeof newGame>) => {
  let t = s
  const probe = TRADES.find((x) => x.id === 'goldLeaf')!
  while (trade({ ...t, coins: 999 }, probe) === null && t.clock.day < 30) t = { ...t, clock: { ...t.clock, day: t.clock.day + 1 } }
  return t
}

describe('직업 단계 보상', () => {
  it('단계와 수고비', () => {
    expect(jobLevel(10, 1)).toBe(1)
    expect(jobOf({ lettersDone: 30, shelved: { mk: 0, lk: 1 } })).toBe(2)
    expect(LETTER_BASE).toEqual({ 0: 12, 1: 18, 2: 24, 3: 30 })
    expect(letterPay(0, 0)).toBe(18)
    expect(letterPay(0, 2)).toBe(36)
    expect(letterPay(9, 1)).toBe(18)
  })
  it('마을 필사가부터 장날에 공방 제품을 팔고, 말씀 책은 팔 수 없다', () => {
    const s = marketDay({ ...newGame(CONTENT), inv: { ink: 2 } })
    expect(canSell(s, 'ink')).toBe('job')
    const village = { ...s, lettersDone: 10, shelved: { mk: 1 as const } }
    expect(SELL_FROM).toBe(1)
    expect(canSell(village, 'ink')).toBeNull()
    const sold = sell(village, 'ink')!
    expect(sold.coins).toBe(village.coins + 8)
    expect(sold.inv.ink).toBe(1)
    expect(canSell(village, 'goldLeaf')).toBe('none')
    expect(canSell({ ...village, clock: { ...village.clock, day: village.clock.day + 1 } }, 'ink')).toBe('notMarket')
  })
  it('표지는 제본 장인부터', () => {
    const s = { ...newGame(CONTENT), inv: { papyrus: 2, wool: 1 } }
    expect(COVER_FROM).toBe(2)
    expect(canCraft(s, 'cover')).toBe('job')
    expect(canCraft({ ...s, lettersDone: 30, shelved: { mk: 1 as const, lk: 1 as const } }, 'cover')).toBeNull()
  })
})

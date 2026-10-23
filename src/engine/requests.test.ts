import { CONTENT } from '../content/catalog'
import { newGame, trade, TRADES } from './game'
import { jobLevel } from './job'

describe('직업 단계와 장날 금박', () => {
  it('직업 단계', () => {
    expect(jobLevel(0, 0)).toBe(0)
    expect(jobLevel(10, 0)).toBe(0)
    expect(jobLevel(10, 1)).toBe(1)
    expect(jobLevel(30, 2)).toBe(2)
    expect(jobLevel(0, 4)).toBe(3)
  })

  it('장날에 닢으로 금박을 산다', () => {
    const t = TRADES.find((x) => x.id === 'goldLeaf')!
    expect(t.coins).toBe(30)
    let s = newGame(CONTENT)
    // 첫 장날 찾기
    while (trade({ ...s, coins: 30 }, t) === null && s.clock.day < 20) s = { ...s, clock: { ...s.clock, day: s.clock.day + 1 } }
    const bought = trade({ ...s, coins: 30 }, t)!
    expect(bought.coins).toBe(0)
    expect(bought.inv.goldLeaf).toBe(1)
    expect(trade({ ...s, coins: 10 }, t)).toBeNull()
  })
})

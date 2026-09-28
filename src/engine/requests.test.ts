import { CONTENT } from '../content/catalog'
import { newGame, trade, TRADES } from './game'
import { earn, spend } from './money'
import { finishLetter, jobLevel, letterPay, letterWaiting, LETTER_PAY } from './requests'

describe('닢과 편지 대필', () => {
  it('벌고 쓰기, 모자라면 못 쓴다', () => {
    const s = earn(newGame(CONTENT), 20)
    expect(s.coins).toBe(20)
    expect(spend(s, 25)).toBeNull()
    expect(spend(s, 5)!.coins).toBe(15)
  })

  it('하루 한 번 편지가 오고, 반듯할수록 수고비가 늘어난다 (최대 1.5배)', () => {
    expect(letterPay(0)).toBe(18)
    expect(letterPay(2)).toBe(15)
    expect(letterPay(9)).toBe(LETTER_PAY)
    const s = newGame(CONTENT)
    expect(letterWaiting(s)).toBe(true)
    const t = finishLetter(s, 0)
    expect(t.coins).toBe(18)
    expect(t.lettersDone).toBe(1)
    expect(letterWaiting(t)).toBe(false)
    expect(finishLetter(t, 0)).toBe(t)
  })

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

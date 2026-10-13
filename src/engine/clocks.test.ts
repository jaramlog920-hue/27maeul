// 시계 둘 (2026-10-14 사용자): 빠른 시계 5천(1·2·3배), 시각 맞춤 시계 1만(고른 시각으로)
import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { clockTargets, newGame, nextTimeSpeed, setClockTo, timeSpeed, TRADES, type GameState } from './game'

describe('시계', () => {
  it('장날 값: 빠른 시계 5천, 시각 맞춤 시계 1만', () => {
    expect(TRADES.find((t) => t.id === 'speedClock')).toMatchObject({ coins: 5000, get: { speedClock: 1 } })
    expect(TRADES.find((t) => t.id === 'setClock')).toMatchObject({ coins: 10000, get: { setClock: 1 } })
  })
  it('빠른 시계: 없으면 1배, 있으면 1 → 2 → 3 → 1', () => {
    const g = newGame(CONTENT)
    expect(timeSpeed(g)).toBe(1)
    expect(nextTimeSpeed(g)).toBe(g)
    let s: GameState = { ...g, inv: { ...g.inv, speedClock: 1 } }
    const seen = []
    for (let i = 0; i < 4; i++) { s = nextTimeSpeed(s); seen.push(timeSpeed(s)) }
    expect(seen).toEqual([2, 3, 1, 2])
    // 시계를 버리면 다시 1배
    expect(timeSpeed({ ...s, inv: { ...s.inv, speedClock: 0 } })).toBe(1)
  })
  it('시각 맞춤 시계: 다음 정시부터 새벽 2시까지, 되돌리지 않는다', () => {
    const g = { ...newGame(CONTENT), clock: { day: 3, minute: 22 * 60 + 15 } }
    expect(clockTargets(g)).toEqual([])
    const s = { ...g, inv: { ...g.inv, setClock: 1 } }
    expect(clockTargets(s)).toEqual([23 * 60, 24 * 60, 25 * 60, 26 * 60])
    expect(setClockTo(s, 24 * 60)?.clock).toEqual({ day: 3, minute: 24 * 60 })
    expect(setClockTo(s, 21 * 60)).toBeNull()
  })
})

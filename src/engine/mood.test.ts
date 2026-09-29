import { CONTENT } from '../content/catalog'
import { newGame, type GameState } from './game'
import { GOOD_MOOD, inGoodMood, moodOf } from './mood'

const base = (): GameState => newGame(CONTENT)

describe('기분', () => {
  it('맑은 날 기본은 60, 가구·도구로 오른다', () => {
    const s = base() // 1일째 맑음
    expect(moodOf(s)).toBe(60)
    const decorated = { ...s, room: Array.from({ length: 6 }, (_, i) => ({ item: 'rug' as const, x: 3 + i, y: 6 })), inv: { ...s.inv, goodPen: 1, brightLamp: 1 } }
    expect(moodOf(decorated)).toBe(85) // 60 + 가구 15(최대) + 도구 10
    expect(inGoodMood(decorated)).toBe(true)
  })
  it('배고프거나 지치거나 춥고 더우면 내려간다', () => {
    const s = base()
    expect(moodOf({ ...s, needs: { ...s.needs, hunger: 80, fatigue: 80, cold: 0, heat: 70 } })).toBe(20)
    expect(moodOf({ ...s, needs: { ...s.needs, hunger: 100, fatigue: 100, cold: 100, heat: 100 } })).toBeGreaterThanOrEqual(0)
  })
  it('좋은 기분 기준은 70', () => {
    expect(GOOD_MOOD).toBe(70)
  })
})

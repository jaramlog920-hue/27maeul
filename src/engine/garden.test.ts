import { CONTENT } from '../content/catalog'
import { newGame, type GameState } from './game'
import { canPlant, CROPS, GARDEN_TILES, growGarden, harvest, isRipe, plant, water } from './garden'

const spot = GARDEN_TILES[0]
const k = `${spot.x},${spot.y}`
const withSeeds = (): GameState => {
  const s = newGame(CONTENT)
  return { ...s, inv: { ...s.inv, seedHerb: 2, seedBean: 1 } }
}

describe('텃밭', () => {
  it('여덟 칸', () => {
    expect(GARDEN_TILES).toHaveLength(8)
  })
  it('씨앗이 있어야 심고, 한 칸에 하나, 겨울엔 못 심는다', () => {
    const s = withSeeds()
    expect(canPlant(newGame(CONTENT), spot, 'herb')).toBe('noSeed')
    const t = plant(s, spot, 'herb')!
    expect(t.inv.seedHerb).toBe(1)
    expect(t.garden[k]).toEqual({ crop: 'herb', grown: 0, wateredDay: null })
    expect(canPlant(t, spot, 'bean')).toBe('taken')
    // SEASON_DAYS=7 기준 겨울(clock.ts seasonOf)의 실제 첫 날
    const winter = { ...s, clock: { ...s.clock, day: 22 } }
    expect(canPlant(winter, spot, 'herb')).toBe('winter')
  })
  it('물 준 날만 자라고, 다 자라면 거둔다', () => {
    let s = plant(withSeeds(), spot, 'herb')!
    for (let d = 0; d < CROPS.herb.days; d++) {
      expect(isRipe(s.garden[k])).toBe(false)
      s = water(s, spot)!
      expect(water(s, spot)).toBeNull() // 하루 한 번
      s = { ...s, garden: growGarden(s.garden, s.clock.day), clock: { ...s.clock, day: s.clock.day + 1 } }
    }
    expect(isRipe(s.garden[k])).toBe(true)
    // 물 안 준 날은 그대로
    expect(growGarden({ a: { crop: 'bean', grown: 1, wateredDay: 2 } }, 5).a.grown).toBe(1)
    const h = harvest(s, spot)!
    expect(h.inv.herb).toBe(2)
    expect(h.garden[k]).toBeUndefined()
  })
})

import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { dayOf } from './calendar'
import { SEASON_DAYS, seasonOf } from './clock'
import { goToSleep, newGame, type GameState } from './game'
import { CROPS, GARDEN_TILES, harvest, isRipe, plant, water } from './garden'
import { deserialize, serialize } from './save'

const spot = GARDEN_TILES[0]
const key = `${spot.x},${spot.y}`
const reload = (s: GameState) => deserialize(serialize(s), CONTENT)!

describe('텃밭 계절 경계와 하루 정산 저장', () => {
  it.each([
    ['herb', 1], ['bean', 1], ['herb', 2], ['bean', 2],
  ] as const)('%s 작물은 %i년 겨울 동안 쉬고 봄에 다시 자란다', (crop, year) => {
    const base = newGame(CONTENT)
    let s = plant({ ...base, clock: { day: dayOf('autumn', SEASON_DAYS, year), minute: 600 },
      inv: { [CROPS[crop].seed]: 1 } }, spot, crop)!
    s = water(s, spot)!
    s = reload(s)
    expect(water(s, spot)).toBeNull()
    expect(s.garden[key].grown).toBe(0)
    s = reload(goToSleep(s, CONTENT))
    expect(s.clock.day).toBe(dayOf('winter', 1, year))
    expect(s.garden[key].grown).toBe(1)
    // 저장 복원만으로 다시 자라지 않는다. 겨울에는 물주기가 차단된다.
    for (let d = 1; d <= SEASON_DAYS; d++) {
      expect(seasonOf(s.clock.day)).toBe('winter')
      expect(water(s, spot)).toBeNull()
      expect(harvest(s, spot)).toBeNull()
      expect(s.garden[key].grown).toBe(1)
      const again = reload(s)
      expect(again.garden).toEqual(s.garden)
      s = reload(goToSleep(again, CONTENT))
    }
    expect(s.clock.day).toBe(dayOf('spring', 1, year + 1))
    expect(s.garden[key].grown).toBe(1)
    // 물 주지 않은 봄 하루도 성장하지 않는다.
    s = reload(goToSleep(s, CONTENT))
    expect(s.garden[key].grown).toBe(1)
    for (let grown = 1; grown < CROPS[crop].days; grown++) {
      s = reload(water(s, spot)!)
      expect(water(s, spot)).toBeNull()
      s = reload(goToSleep(s, CONTENT))
      expect(s.garden[key].grown).toBe(grown + 1)
    }
    expect(isRipe(s.garden[key])).toBe(true)
    expect(water(s, spot)).toBeNull()
    const amount = s.inv[crop] ?? 0
    s = reload(harvest(s, spot)!)
    expect(s.inv[crop]).toBe(amount + CROPS[crop].gives[crop]!)
    expect(s.garden[key]).toBeUndefined()
    expect(harvest(s, spot)).toBeNull()
  })

  it.each(['herb', 'bean'] as const)('가을 마지막 날 다 자란 %s는 겨울에도 보존되어 수확할 수 있다', crop => {
    const base = newGame(CONTENT)
    const s = { ...base, clock: { day: dayOf('autumn', SEASON_DAYS), minute: 600 },
      garden: { [key]: { crop, grown: CROPS[crop].days - 1, wateredDay: dayOf('autumn', SEASON_DAYS) } } }
    const winter = reload(goToSleep(reload(s), CONTENT))
    expect(seasonOf(winter.clock.day)).toBe('winter')
    expect(isRipe(winter.garden[key])).toBe(true)
    const rested = reload(goToSleep(winter, CONTENT))
    expect(rested.garden[key].grown).toBe(CROPS[crop].days)
    const collected = harvest(rested, spot)!
    expect(collected.inv[crop]).toBe(CROPS[crop].gives[crop])
    expect(reload(collected).garden[key]).toBeUndefined()
  })
})

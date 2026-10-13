import { CONTENT } from '../content/catalog'
import { newGame } from './game'
import { deserialize, serialize } from './save'
import { canPlaceYard, moveYard, YARD_DEFAULT, yardItemAt, yardSpot } from './yard'
import { HOME_FRONT } from './world'

const owned = () => { const s = newGame(CONTENT); return { ...s, flags: { ...s.flags, 'unlock:rainJar': 1, 'unlock:reedRack': 1 } } }

describe('집 둘레 살림 옮기기 (2026-10-13)', () => {
  it('가진 살림만 처음 자리에서 집어 들 수 있다', () => {
    expect(yardItemAt(newGame(CONTENT), YARD_DEFAULT.rainJar)).toBeNull()
    expect(yardItemAt(owned(), YARD_DEFAULT.rainJar)).toBe('rainJar')
  })
  it('집 둘레 빈 땅에만, 다른 살림과 겹치지 않게 놓이고 저장에 남는다', () => {
    const s = owned()
    expect(canPlaceYard(s, 'rainJar', YARD_DEFAULT.reedRack)).toBe(false)
    expect(canPlaceYard(s, 'rainJar', HOME_FRONT)).toBe(false)
    expect(canPlaceYard(s, 'rainJar', { x: HOME_FRONT.x + 20, y: HOME_FRONT.y })).toBe(false)
    const spot = [{ x: 9, y: 9 }, { x: 4, y: 9 }, { x: 9, y: 8 }, { x: 3, y: 8 }].find((t) => canPlaceYard(s, 'rainJar', t))!
    expect(spot).toBeDefined()
    const moved = moveYard(s, 'rainJar', spot)!
    expect(yardSpot(moved, 'rainJar')).toEqual(spot)
    expect(yardItemAt(moved, spot)).toBe('rainJar')
    expect(yardSpot(deserialize(serialize(moved), CONTENT)!, 'rainJar')).toEqual(spot)
  })
})

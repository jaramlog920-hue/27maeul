import { CONTENT } from '../content/catalog'
import { walkMul, WALK_MUL } from './easier'
import { toggleGear, wearing } from './gear'
import { legacyGame } from './growth-test-support'
import { deserialize, serialize } from './save'
import { moveYard, stowYard, yardItemAt, yardPlaced, yardSpot } from './yard'
import { moodOf } from './mood'

const base = () => legacyGame(CONTENT)

describe('장비 빼고 끼기 (2026-10-13)', () => {
  it('가방에 있으면 낀 것, 빼면 효과가 없다', () => {
    const s = { ...base(), inv: { sturdyShoes: 1 } }
    expect(wearing(s, 'sturdyShoes')).toBe(true)
    expect(walkMul(s.inv, s.gearOff)).toBe(WALK_MUL.sturdyShoes)
    const off = toggleGear(s, 'sturdyShoes')
    expect(wearing(off, 'sturdyShoes')).toBe(false)
    expect(walkMul(off.inv, off.gearOff)).toBe(1)
    expect(wearing(toggleGear(off, 'sturdyShoes'), 'sturdyShoes')).toBe(true)
  })
  it('신은 한 켤레만 — 튼튼한 신을 끼면 가벼운 신은 빠진다', () => {
    const s = { ...base(), inv: { sturdyShoes: 1, lightShoes: 1 } }
    expect(walkMul(s.inv, s.gearOff)).toBe(WALK_MUL.lightShoes)
    const swapped = toggleGear(s, 'sturdyShoes')
    expect(wearing(swapped, 'sturdyShoes')).toBe(true)
    expect(wearing(swapped, 'lightShoes')).toBe(false)
    expect(walkMul(swapped.inv, swapped.gearOff)).toBe(WALK_MUL.sturdyShoes)
  })
  it('좋은 펜을 빼면 기분 보탬도 빠진다, 저장에 남는다', () => {
    const s = { ...base(), inv: { goodPen: 1 } }
    const off = toggleGear(s, 'goodPen')
    expect(moodOf(off)).toBeLessThan(moodOf(s))
    expect(deserialize(serialize(off), CONTENT)!.gearOff).toEqual(['goodPen'])
  })
})

describe('집 둘레 살림 거두기·다시 놓기 (2026-10-13)', () => {
  it('거두면 가방에, 그림·자리에서 빠지고, 다시 놓으면 가방에서 빠진다', () => {
    const s = { ...base(), flags: { ...base().flags, 'unlock:rainJar': 1 } }
    expect(yardPlaced(s.flags, 'rainJar')).toBe(true)
    const spot = yardSpot(s, 'rainJar')
    const stowed = stowYard(s, 'rainJar')!
    expect(stowed.inv.rainJar).toBe(1)
    expect(yardPlaced(stowed.flags, 'rainJar')).toBe(false)
    expect(yardItemAt(stowed, spot)).toBeNull()
    const back = moveYard(stowed, 'rainJar', spot)!
    expect(back.inv.rainJar ?? 0).toBe(0)
    expect(yardPlaced(back.flags, 'rainJar')).toBe(true)
    expect(yardItemAt(back, spot)).toBe('rainJar')
  })
})

describe('은빛 집 열쇠 (2026-10-14)', () => {
  it('장날에 집 넓히기보다 비싸게 팔고, 가지고 있으면 어디서든 집 안으로', async () => {
    const { goHome, TRADES, HOME_KEY_PRICE } = await import('./game')
    const { HOME_ENTRY } = await import('./world')
    expect(TRADES.find((t) => t.id === 'homeKey')?.coins).toBe(HOME_KEY_PRICE)
    expect(HOME_KEY_PRICE).toBeGreaterThan(6000)
    const s = { ...base(), player: { ...base().player, x: 30, y: 15, path: [] } }
    expect(goHome(s, CONTENT)).toBeNull()
    const home = goHome({ ...s, inv: { homeKey: 1 } }, CONTENT)!
    expect({ x: home.player.x, y: home.player.y }).toEqual({ x: HOME_ENTRY.x, y: HOME_ENTRY.y })
    expect(home.inv.homeKey).toBe(1)
  })
})

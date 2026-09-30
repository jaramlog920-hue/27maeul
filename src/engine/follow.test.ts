import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { childMode, CRADLE_SPOT, HELPER_AT, TODDLER_AT } from './child'
import { childTile, newGame, setChildMode, setCompanionStay, tapTile, tick, type GameState } from './game'
import { freshStats } from './stats'
import { PET_HOME } from './world'

const zero = () => 0
const withPet = (): GameState => {
  const s = newGame(CONTENT)
  return { ...s, companion: { kind: 'dog', name: '누렁이', since: 1, x: s.player.x + 1, y: s.player.y, path: [], facing: 'down', walkTime: 0 } }
}
const withKid = (age: number): GameState => {
  const s = newGame(CONTENT)
  return { ...s, homeLevel: 1, child: { name: '루시', look: 'girl', born: s.clock.day - age, stats: freshStats(), lean: null } }
}

describe('데리고 다니기·집에 두기', () => {
  it('집에 둔 동물은 집 안 자리에서 기다리고 따라오지 않는다, 다시 데리고 다니면 곁으로', () => {
    const home = setCompanionStay(withPet(), true)
    expect(home.companion).toMatchObject({ stay: true, x: PET_HOME.x, y: PET_HOME.y })
    const moved = tick({ ...home, player: { ...home.player, x: 10, y: 9, path: [] } }, 1, zero, CONTENT).state
    expect(moved.companion).toMatchObject({ x: PET_HOME.x, y: PET_HOME.y })
    const back = setCompanionStay(moved, false)
    expect(back.companion?.stay).toBe(false)
    expect(Math.abs(back.companion!.x - back.player.x) + Math.abs(back.companion!.y - back.player.y)).toBe(1)
  })

  it('동물을 누르면 그곳으로 가서 고르는 창을 연다', () => {
    const s = withPet()
    const t = tapTile(s, { x: s.companion!.x, y: s.companion!.y })
    expect(t.target).toEqual({ kind: 'companion' })
  })

  it('아이: 아기는 늘 요람, 걷는 아이는 따라다니고, 돕는 아이는 혼자 다닌다 — 고르면 바뀐다', () => {
    expect(childMode(withKid(3).child!, withKid(3).clock.day)).toBe('cradle')
    const toddler = withKid(TODDLER_AT)
    expect(childMode(toddler.child!, toddler.clock.day)).toBe('follow')
    const helper = withKid(HELPER_AT)
    expect(childMode(helper.child!, helper.clock.day)).toBe('roam')
    const home = setChildMode(helper, 'home')
    expect(childTile(home)).toEqual(CRADLE_SPOT)
    // 걷는 아이는 혼자 다니지 않는다
    expect(childMode(setChildMode(toddler, 'roam').child!, toddler.clock.day)).toBe('follow')
  })

  it('따라다니는 아이는 기록자 곁 칸에 있고, 누르면 아이를 향한다', () => {
    const s = withKid(TODDLER_AT)
    const kid = childTile(s)!
    expect(Math.abs(kid.x - s.player.x) + Math.abs(kid.y - s.player.y)).toBe(1)
    expect(tapTile(s, kid).target).toEqual({ kind: 'child' })
  })
})

describe('배움터', () => {
  it('닢을 내고 아이를 맡기면 고른 능력치가 자라고, 저녁까지 배움터에 있다 (하루 한 번)', async () => {
    const { canSchool, childAtSchool, SCHOOL_FEE, SCHOOL_SEAT, sendToSchool } = await import('./game')
    const { PLACES, placeAt } = await import('./world')
    expect(placeAt(PLACES.learnTable.tiles[0])).toBe('learnTable')
    const s = { ...withKid(TODDLER_AT), coins: 40, clock: { ...withKid(TODDLER_AT).clock, minute: 9 * 60 } }
    const g = sendToSchool(s, 'wit')!
    expect(g.coins).toBe(40 - SCHOOL_FEE)
    expect(g.child!.stats.wit.xp).toBeGreaterThan(0)
    expect(childAtSchool(g)).toBe(true)
    expect(childTile(g)).toEqual(SCHOOL_SEAT)
    expect(canSchool(g)).toBe('done')
    expect(canSchool(withKid(3))).toBe('baby')
    expect(canSchool({ ...s, coins: 1 })).toBe('coins')
    expect(childAtSchool({ ...g, clock: { ...g.clock, minute: 19 * 60 } })).toBe(false)
  })
})

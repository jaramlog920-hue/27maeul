// 계획 10: 모이는 곳과 둘이 가는 곳 — 마을 사랑방·정원 찻집·호숫가 정자
import { CONTENT } from '../content/catalog'
import { SCENES, T, withAnd } from '../content/text'
import { festivalOf } from './calendar'
import {
  canDrinkTea,
  canPlayHall,
  canWatchSunset,
  clearSky,
  drinkTea,
  hallFriendsHere,
  hallGuestsToday,
  newGame,
  playHall,
  tick,
  watchSunset,
  type GameState,
} from './game'
import { findPath } from './movement'
import { HALL_FROM, HALL_GUESTS, HALL_PLAY_GAIN, HALL_SPOTS, hallGuests, TEA_PRICE } from './places'
import { XP } from './stats'
import { HALL_DOOR, isWalkable, PAVILION_SEAT, PLACES, ROOMS, TEA_DOOR, tileAt, WARPS, key } from './world'

const at = (s: GameState, minute: number, day = s.clock.day): GameState => ({ ...s, clock: { ...s.clock, day, minute } })
const zero = () => 0

/** 축제 날이 아닌 날 */
const plainDay = [...Array(40).keys()].map((d) => d + 2).find((d) => !festivalOf(d))!

describe('사랑방: 저녁에 이웃 셋이 모인다', () => {
  it('문은 큰길 쪽, 문을 밟으면 방 안 — 방석 자리는 걸을 수 있고 들어온 자리에서 닿는다', () => {
    expect(tileAt(HALL_DOOR.x, HALL_DOOR.y)).toBe('D')
    expect(tileAt(HALL_DOOR.x, HALL_DOOR.y + 1)).toBe(',')
    const hall = ROOMS.find((r) => r.owner === 'hall')!
    const inside = WARPS.get(key(HALL_DOOR))!
    for (const t of HALL_SPOTS) {
      expect(isWalkable(t)).toBe(true)
      expect(findPath(inside, t)).not.toBeNull()
    }
    expect(findPath(inside, PLACES.hallTable.stand!)).not.toBeNull()
    expect(hall.w).toBe(12)
  })

  it('날마다 같은 셋 — 상인·아이는 오지 않는다', () => {
    const ids = CONTENT.neighbors.map((n) => n.id)
    for (let day = 1; day < 30; day++) {
      const g = hallGuests(day, ids)
      expect(g).toHaveLength(HALL_GUESTS)
      expect(new Set(g).size).toBe(HALL_GUESTS)
      expect(g).not.toContain('merchant')
      expect(g).not.toContain('child')
      expect(hallGuests(day, ids)).toEqual(g)
    }
  })

  it('저녁 초대한 이웃은 빼고, 잔치 날 저녁은 모두 그쪽에 가서 없다', () => {
    const s = at(newGame(CONTENT), HALL_FROM, plainDay)
    const guests = hallGuestsToday(s, CONTENT)
    expect(guests.length).toBeGreaterThan(0)
    const invited = hallGuestsToday({ ...s, today: { ...s.today, inviter: guests[0] } }, CONTENT)
    expect(invited).not.toContain(guests[0])
    const fest = [...Array(120).keys()].map((d) => d + 1).find((d) => festivalOf(d))!
    expect(hallGuestsToday(at(s, HALL_FROM, fest), CONTENT)).toEqual([])
    expect(hallGuestsToday({ ...s, today: { ...s.today, gathering: 'babyParty' } }, CONTENT)).toEqual([])
  })

  it('저녁이 되면 모이는 이웃이 사랑방 방석 자리로 걸어 들어온다', () => {
    let s = at(newGame(CONTENT), HALL_FROM - 1, plainDay)
    const guests = hallGuestsToday(s, CONTENT)
    for (let i = 0; i < 2400 && hallFriendsHere(s, CONTENT).length < guests.length; i++) {
      s = tick(s, 0.1, zero, CONTENT).state
      // 시계는 멈춰 둔다 (걷는 동안 모임이 끝나지 않게)
      s = { ...s, clock: { ...s.clock, minute: HALL_FROM + 5 } }
    }
    expect(hallFriendsHere(s, CONTENT)).toEqual(guests)
  })

  it('놀기: 모인 이웃마다 마음 +3점(매력 1단계), 매력이 오르고, 하루 한 번 — 처음 한 번은 장면', () => {
    const base = at(newGame(CONTENT), HALL_FROM + 10, plainDay)
    const guests = hallGuestsToday(base, CONTENT)
    const npcs = { ...base.npcs }
    guests.forEach((id, i) => (npcs[id] = { ...npcs[id], ...HALL_SPOTS[i], visible: true, path: [] }))
    const s = { ...base, npcs }
    expect(canPlayHall(s, CONTENT)).toBeNull()
    const played = playHall(s, CONTENT)
    for (const id of guests) expect(played.hearts[id] ?? 0).toBe((s.hearts[id] ?? 0) + HALL_PLAY_GAIN)
    expect(played.stats.charm.xp).toBe(XP.help)
    expect(played.scenes).toContain('hallNight')
    expect(canPlayHall(played, CONTENT)).toBe('played')
    expect(playHall(played, CONTENT)).toBe(played)
    // 다음 날 또 놀면 장면은 없다
    const next = playHall({ ...played, clock: { ...played.clock, day: played.clock.day + 7 }, scenes: [] }, CONTENT)
    expect(next.scenes).not.toContain('hallNight')
  })

  it('때가 아니거나 아무도 없으면 놀 수 없다', () => {
    const s = at(newGame(CONTENT), 12 * 60, plainDay)
    expect(canPlayHall(s, CONTENT)).toBe('closed')
    expect(canPlayHall(at(s, HALL_FROM + 10), CONTENT)).toBe('empty')
  })
})

describe('정원 찻집: 차 한 잔 닢 2', () => {
  it('문은 큰길 쪽, 탁자는 들어온 자리에서 닿는다', () => {
    expect(tileAt(TEA_DOOR.x, TEA_DOOR.y)).toBe('D')
    expect(findPath(WARPS.get(key(TEA_DOOR))!, PLACES.teaTable.stand!)).not.toBeNull()
  })
  it('닢을 내고 쉬어 간다 — 피로가 풀리고 배가 조금 부르다, 처음 한 번은 장면', () => {
    const s = { ...at(newGame(CONTENT), 10 * 60), coins: 5, needs: { ...newGame(CONTENT).needs, fatigue: 60, hunger: 50 } }
    expect(canDrinkTea(s)).toBeNull()
    const t = drinkTea(s)
    expect(t.coins).toBe(5 - TEA_PRICE)
    expect(t.needs.fatigue).toBeLessThan(60)
    expect(t.scenes).toContain('teaFirst')
    expect(drinkTea({ ...t, scenes: [] }).scenes).not.toContain('teaFirst')
  })
  it('닢이 모자라거나 문을 닫았으면 못 마신다', () => {
    const s = at(newGame(CONTENT), 10 * 60)
    expect(canDrinkTea({ ...s, coins: 1 })).toBe('coins')
    expect(canDrinkTea({ ...at(s, 20 * 60), coins: 9 })).toBe('closed')
  })
})

describe('호숫가 정자: 노을 보기', () => {
  it('정자 벤치는 호숫가 길 바로 위, 앉는 자리는 길', () => {
    expect(tileAt(PAVILION_SEAT.x, PAVILION_SEAT.y)).toBe('B')
    expect(tileAt(PLACES.pavilion.stand!.x, PLACES.pavilion.stand!.y)).toBe(',')
  })
  it('맑은 저녁: 쉬고, 그날 처음이면 운이 조금, 처음 한 번은 장면(앨범)', () => {
    const day = [...Array(60).keys()].map((d) => d + 1).find((d) => clearSky(d))!
    const s = at(newGame(CONTENT), 18 * 60, day)
    expect(canWatchSunset(s)).toBeNull()
    const once = watchSunset(s)
    expect(once.stats.luck.xp).toBe(XP.stars)
    expect(once.scenes).toContain('sunset')
    const twice = watchSunset({ ...once, clock: { ...once.clock, minute: 18 * 60 + 40 } })
    expect(twice.stats.luck.xp).toBe(XP.stars)
    expect(SCENES.sunset.album).toBeTruthy()
  })
  it('낮이거나 흐리면 노을이 없다', () => {
    const s = at(newGame(CONTENT), 12 * 60)
    expect(canWatchSunset(s)).toBe('notYet')
    const wet = [...Array(60).keys()].map((d) => d + 1).find((d) => !clearSky(d))!
    expect(canWatchSunset(at(s, 18 * 60, wet))).toBe('cloudy')
  })
})

describe('문구', () => {
  it('장면·안내·방 이름', () => {
    for (const id of ['hallNight', 'teaFirst', 'sunset']) expect(SCENES[id]?.lines.length, id).toBeGreaterThan(0)
    expect(T.places.hallRoom).toBe('마을 사랑방')
    expect(withAnd('양치기')).toBe('양치기와')
    expect(withAnd('빵 굽는 이웃')).toBe('빵 굽는 이웃과')
  })
})

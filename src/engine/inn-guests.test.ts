import { beforeEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame, tapTile, type GameState } from './game'
import { guestInRoom, guestLine, INN_GUESTS, INN_SEATS, innGuestsNow, innStays, metGuest, resetInnPlan, stayLine } from './inn-guests'
import { isWalkable } from './world'

const at = (day: number, minute = 17 * 60): GameState => {
  const s = newGame(CONTENT)
  return { ...s, clock: { ...s.clock, day, minute } }
}

beforeEach(() => resetInnPlan())

describe('2층 여관 손님', () => {
  it('손님은 1~4밤 묵고, 같은 손님이 두 방에 동시에 있지 않으며, 빈 날도 있다', () => {
    let empty = 0, full = 0
    for (let day = 2; day < 200; day++) {
      const stays = innStays(at(day))
      if (!stays.length) empty++
      if (stays.length === INN_SEATS.length) full++
      expect(new Set(stays.map((st) => st.guest)).size).toBe(stays.length)
      for (const st of stays) expect(st.leave - st.arrive).toBeGreaterThanOrEqual(1), expect(st.leave - st.arrive).toBeLessThanOrEqual(4)
    }
    expect(empty).toBeGreaterThan(0)
    expect(full).toBeLessThan(198)
    expect(innStays(at(60)).length + innStays(at(61)).length + innStays(at(62)).length).toBeGreaterThan(0)
  })

  it('다시 셈해도(불러오기) 같은 손님이 같은 날 온다', () => {
    const a = innStays(at(90)).map((st) => `${st.guest}@${st.room}:${st.arrive}-${st.leave}`)
    resetInnPlan()
    expect(innStays(at(90)).map((st) => `${st.guest}@${st.room}:${st.arrive}-${st.leave}`)).toEqual(a)
  })

  it('도착한 날은 오후부터, 떠나는 날은 아침에만 방에 있다', () => {
    const st = { guest: 'salt', room: 0, arrive: 10, leave: 12 }
    expect(guestInRoom(st, 10, 8 * 60)).toBe(false)
    expect(guestInRoom(st, 10, 16 * 60)).toBe(true)
    expect(guestInRoom(st, 11, 12 * 60)).toBe(false)
    expect(guestInRoom(st, 11, 7 * 60)).toBe(true)
    expect(guestInRoom(st, 12, 7 * 60)).toBe(true)
    expect(guestInRoom(st, 12, 16 * 60)).toBe(false)
    expect(stayLine(st, 10)).toBe('2밤 묵어요 · 모레 아침 떠나요')
    expect(stayLine(st, 11)).toBe('2밤 묵어요 · 내일 아침 떠나요')
    expect(stayLine(st, 12)).toBe('오늘 아침 떠나요.')
  })

  it('처음엔 인사, 다음 묵음엔 다시 만난 인사, 떠나는 날엔 작별', () => {
    const guest = INN_GUESTS[0]
    const here = { guest, stay: { guest: guest.id, room: 0, arrive: 10, leave: 13 }, at: INN_SEATS[0] }
    const s = at(10)
    expect(guestLine(s, here)).toBe(guest.hello)
    const met = metGuest(s, here)
    expect(guest.talk).toContain(guestLine({ ...met, clock: { ...met.clock, day: 11 } }, here))
    expect(guestLine({ ...met, clock: { ...met.clock, day: 13 } }, here)).toBe(guest.bye)
    const later = { ...here, stay: { ...here.stay, arrive: 30, leave: 32 } }
    expect(guestLine({ ...met, clock: { ...met.clock, day: 30 } }, later)).toBe(guest.again)
  })

  it('손님 자리는 걸을 수 있는 방 안이고, 누르면 곁으로 걸어가 손님에게 간다', () => {
    for (const t of INN_SEATS) expect(isWalkable(t)).toBe(true)
    let day = 2
    while (!innGuestsNow(at(day)).length) day++
    const s = at(day)
    const g = innGuestsNow(s)[0]
    const next = tapTile({ ...s, player: { ...s.player, x: 26, y: 146, path: [] } }, g.at)
    expect(next.target).toMatchObject({ kind: 'innGuest', id: g.guest.id })
    expect(next.player.path.length).toBeGreaterThan(0)
  })
})

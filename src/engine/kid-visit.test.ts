// 2026-10-12 사용자 결정 2: 다른 지역으로 떠난 아이는 가끔 새 터 손님집에 사흘 묵는다
import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newChild } from './child'
import { newGame, type GameState } from './game'
import type { Build } from './newland-build'
import { GUEST_STAY, guestHouseMorning, guestNow, KID_VISIT_GAP, kidVisiting, talkKidVisit } from './newland-life'
import { freshStats } from './stats'

const inn: Build = { id: 'b1', kind: 'guest', x: 10, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false }
const at = (s: GameState, day: number): GameState => ({ ...s, clock: { ...s.clock, day } })

function base(left: boolean): GameState {
  const g = newGame(CONTENT)
  const child = { ...newChild(1, freshStats(), undefined), name: '나리', job: 'sailor' as const, jobConfirmed: true, left }
  return { ...g, clock: { ...g.clock, day: 100 }, child, newland: { builds: [inn], tiles: {}, nextId: 2, settledDay: 1 } }
}

describe('떠난 아이의 손님집 다니러 옴', () => {
  it('떠난 아이는 빈 손님집에 사흘 묵고, 하루 한 번 이야기, 사흘째 직업 물건 짐, 세 주쯤 뒤 다시', () => {
    let s = guestHouseMorning(base(true))
    expect(kidVisiting(s)).toBe(true)
    expect(guestNow(s)).toBeNull()
    expect(s.flags.kidVisitLetter).toBe(100)
    let gift
    for (let d = 0; d < GUEST_STAY; d++) {
      s = guestHouseMorning(at(s, 100 + d))
      const r = talkKidVisit(s)!
      expect(r.line).toBe(d)
      expect(talkKidVisit(r.state)).toBeNull()
      if (r.gift) gift = r.gift
      s = r.state
    }
    expect(gift).toEqual({ perfumeOil: 1 })
    s = guestHouseMorning(at(s, 100 + GUEST_STAY))
    expect(kidVisiting(s)).toBe(false)
    // 다음 손님 차례가 와도 세 주 안에는 아이가 다시 오지 않는다
    for (let d = 100 + GUEST_STAY; d < 100 + KID_VISIT_GAP; d++) s = guestHouseMorning(at(s, d))
    expect(s.flags.kidVisits).toBe(1)
  })
  it('마을에 사는 아이는 손님집에 묵지 않는다', () => {
    const s = guestHouseMorning(base(false))
    expect(kidVisiting(s)).toBe(false)
  })
})

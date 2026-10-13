// 같은 모임 회원끼리 가까워지기 (2026-10-14 사용자)
import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame } from './game'
import { affinityOf, newGenState } from './gen'
import { CLUB_AFFINITY, settleAppt, type Appt } from './plans'

describe('모임 회원끼리 친밀도', () => {
  it('모임이 열리면 함께 나온 회원끼리 오르고, 다시 정산해도 또 오르지 않는다. 다른 약속은 그대로', () => {
    const g0 = newGame(CONTENT)
    const g = { ...g0, gen: newGenState(CONTENT, 1, g0.clock.day) }
    const appt = { id: 'a1', kind: 'club', day: g.clock.day, from: 600, to: 660, place: 'hall', members: ['baker', 'smith'], startedWith: ['baker', 'smith'], state: 'running', rewarded: false, remembered: false } as unknown as Appt
    const s = { ...g, clock: { ...g.clock, minute: 700 }, plans: { appts: [appt], nextId: 2 } }
    const before = affinityOf(s.gen!, 'baker', 'smith')
    const once = settleAppt(s, 'a1')
    expect(affinityOf(once.gen!, 'baker', 'smith')).toBe(Math.min(100, before + CLUB_AFFINITY))
    expect(affinityOf(settleAppt(once, 'a1').gen!, 'baker', 'smith')).toBe(affinityOf(once.gen!, 'baker', 'smith'))
    const work = { ...s, plans: { appts: [{ ...appt, kind: 'work' } as Appt], nextId: 2 } }
    expect(affinityOf(settleAppt(work, 'a1').gen!, 'baker', 'smith')).toBe(before)
  })
})

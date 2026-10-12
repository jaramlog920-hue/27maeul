// 2026-10-12 손님 점검 13 / 휴대폰 MOB-04 (사용자 결정 2): 다 자란 아이가 사는 곳은 직업에 따라 —
// 떠나는 직업(뱃사람·여행자·상인)은 다른 지역으로(마을에 안 보이고 편지·선물·닢), 마을 안 직업은 공동주택에서 산다.
// 단추·상태 줄·알림이 실제 사는 곳과 같아야 한다.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CONTENT } from '../content/catalog'
import { childHome, leavesVillage, newChild } from './child'
import { newGame } from './game'
import { lodgingChildren } from './lodging'
import { kidWorkJob } from './newland-life'
import { freshStats } from './stats'
import { useGame } from '../store/game-store'

vi.mock('../audio/sound', () => ({ sfx: vi.fn(), setAudioMuted: vi.fn() }))

const grown = (job: 'sailor' | 'cook' | 'merchant' | 'painter') => {
  const base = newGame(CONTENT)
  const child = { ...newChild(1, freshStats(), undefined), name: '나리', job, jobConfirmed: true, left: false }
  return { ...base, clock: { ...base.clock, day: 90 }, child }
}
beforeEach(() => useGame.setState({ toast: null, modal: null }))

describe('직업에 따라 떠나거나 남는다', () => {
  it('뱃사람·여행자·상인은 떠나는 직업', () => {
    expect(leavesVillage('sailor')).toBe(true)
    expect(leavesVillage('traveler')).toBe(true)
    expect(leavesVillage('merchant')).toBe(true)
    expect(leavesVillage('cook')).toBe(false)
    expect(leavesVillage('painter')).toBe(false)
  })
  it('떠나는 직업은 다른 지역으로 — 공동주택에 들지 않고, 알림도 떠났다고', () => {
    useGame.setState({ game: grown('sailor') })
    useGame.getState().setChildResidence('away')
    const g = useGame.getState().game
    expect(childHome(g)).toBe('away')
    expect(lodgingChildren(g).some((r) => r.id === 'playerChild')).toBe(false)
    expect(useGame.getState().toast?.text).toMatch(/떠났어요/)
    // 떠나는 직업은 공동주택을 고를 수 없다
    useGame.getState().setChildResidence('lodging')
    expect(childHome(useGame.getState().game)).toBe('away')
  })
  it('마을 안 직업은 공동주택에 — 다른 지역으로는 떠나지 않고, 새 터 일터도 그대로', () => {
    useGame.setState({ game: grown('cook') })
    useGame.getState().setChildResidence('lodging')
    const g = useGame.getState().game
    expect(childHome(g)).toBe('lodging')
    expect(lodgingChildren(g).some((r) => r.id === 'playerChild')).toBe(true)
    expect(useGame.getState().toast?.text).toMatch(/공동 주택/)
    expect(kidWorkJob(g)).toBe('cook')
    useGame.getState().setChildResidence('away')
    expect(childHome(useGame.getState().game)).toBe('lodging')
    useGame.getState().setChildResidence('home')
    expect(childHome(useGame.getState().game)).toBe('home')
  })
})

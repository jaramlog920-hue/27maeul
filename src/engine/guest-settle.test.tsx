// 손님 입주 (2026-10-08): 선물을 남기고 다시 온 손님에게 빈집을 내어 주면 이웃이 된다
import { render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { newGame, type GameState } from './game'
import type { Build } from './newland-build'
import {
  canInviteGuest, facilityAt, GUEST_GAP, guestHouseMorning, guestNow, inviteGuest, memoriesOf, settledAt, settledGuests, settledSpot,
} from './newland-life'
import { useGame } from '../store/game-store'
import { ModalLayer } from '../features/ModalLayer'

const done = (id: string, kind: Build['kind'], x: number, y: number, slot?: number): Build => ({
  id, kind, x, y, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false, ...(slot !== undefined ? { slot } : {}),
})
function land(builds: Build[], flags: Record<string, number> = {}): GameState {
  const base = newGame(CONTENT)
  return {
    ...base,
    scenes: [],
    clock: { day: 40, minute: 11 * 60 },
    flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1, ...flags },
    newland: { builds, tiles: {}, nextId: builds.length + 1, settledDay: 40 },
  }
}
const inn = done('b1', 'guest', 10, 12)
const house = done('b2', 'home', 16, 12, 0)

describe('손님 입주', () => {
  it('처음 온 손님·빈집 없음이면 내어 줄 수 없다', () => {
    const first = land([inn, house], { guestNow: 1, guestSince: 40 })
    expect(guestNow(first)).toBe('nelly')
    expect(canInviteGuest(first)).toBeNull()
    const noHome = land([inn], { guestNow: 1, guestSince: 40, 'guestGift:nelly': 20 })
    expect(canInviteGuest(noHome)).toBeNull()
  })

  it('다시 온 손님에게 빈집을 내어 주면 그 집에 살고, 손님집은 비고 다시 오지 않는다', () => {
    const s = land([inn, house], { guestNow: 1, guestSince: 40, 'guestGift:nelly': 20 })
    expect(canInviteGuest(s)).toBe('nelly')
    const t = inviteGuest(s)
    expect(guestNow(t)).toBeNull()
    expect(t.flags.guestNext).toBe(40 + GUEST_GAP)
    expect(settledGuests(t)).toEqual([{ id: 'nelly', home: house, day: 40 }])
    // 집 한 채에 한 사람: 빈집이 없으니 다음 손님에게는 못 내어 준다
    expect(canInviteGuest({ ...t, flags: { ...t.flags, guestNow: 2, guestSince: 40, 'guestGift:morris': 30 } })).toBeNull()
    // 다음 손님은 이웃이 된 손님을 빼고 고른다
    for (let d = 47; d < 80; d += 10) {
      const m = guestHouseMorning({ ...t, clock: { day: d, minute: 360 }, flags: { ...t.flags, guestNow: 0, guestNext: 0 } })
      expect(guestNow(m)).not.toBe('nelly')
    }
    // 기억 정원에 남는다
    expect(memoriesOf(t).some((m) => m.kind === 'settle' && m.who === 'nelly' && m.day === 40)).toBe(true)
  })

  it('집 앞 자리에 서면 그 사람의 창이 열리고 날마다 한 줄', () => {
    const t = inviteGuest(land([inn, house], { guestNow: 1, guestSince: 40, 'guestGift:nelly': 20 }))
    const spot = settledSpot(house)!
    expect(settledAt(t, spot)).toBe('nelly')
    expect(facilityAt(t, spot)).toBe('settled')
    useGame.setState({ game: { ...t, map: 'newland', player: { ...t.player, x: spot.x, y: spot.y, path: [] } }, modal: { kind: 'facility', id: 'settled' } as never })
    render(<ModalLayer />)
    expect(screen.getByRole('dialog', { name: '넬리의 집' })).toBeInTheDocument()
  })

  it('손님집 창에 "빈집을 내어 주기"는 내어 줄 수 있을 때만', () => {
    const s = land([inn, house], { guestNow: 1, guestSince: 40, 'guestGift:nelly': 20 })
    useGame.setState({ game: s, modal: { kind: 'facility', id: 'guest' } as never })
    const { unmount } = render(<ModalLayer />)
    expect(screen.getByRole('button', { name: '빈집을 내어 주기' })).toBeInTheDocument()
    unmount()
    useGame.setState({ game: land([inn, house], { guestNow: 1, guestSince: 40 }), modal: { kind: 'facility', id: 'guest' } as never })
    render(<ModalLayer />)
    expect(screen.queryByRole('button', { name: '빈집을 내어 주기' })).toBeNull()
  })
})

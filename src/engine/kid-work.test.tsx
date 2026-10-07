// 자란 아이의 집 겸 일터 (계획 18 B18-7, 2026-10-08)
import { render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { newGame, type GameState } from './game'
import type { Build } from './newland-build'
import { facilityAt, KID_DISHES, kidWorkJob, kidWorkSpot, memoriesOf, visitKidWork } from './newland-life'
import { DISHES } from './cooking'
import { OLD_BUILDINGS, OLD_CONSTRUCTION } from '../render/old-village-art'
import { ADULT_JOBS } from './child'
import { useGame } from '../store/game-store'
import { ModalLayer } from '../features/ModalLayer'

const work: Build = { id: 'b1', kind: 'kidWork', x: 10, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false }
function grown(job: 'cook' | 'potter', extra: Partial<GameState> = {}): GameState {
  const base = newGame(CONTENT)
  return {
    ...base,
    clock: { day: 300, minute: 10 * 60 },
    child: { born: 100, look: 'girl', name: '하나', job, left: false, jobConfirmed: true } as GameState['child'],
    flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1 },
    newland: { builds: [work], tiles: {}, nextId: 2, settledDay: 300 },
    ...extra,
  }
}

describe('자란 아이의 일터', () => {
  it('어른이 되어 마을에 남은 아이만 (떠난 아이·아직 어린 아이·아이 없음은 아님)', () => {
    expect(kidWorkJob(grown('cook'))).toBe('cook')
    expect(kidWorkJob(grown('cook', { child: { born: 290, look: 'girl', name: '하나' } as GameState['child'] }))).toBeNull()
    const left = grown('cook')
    expect(kidWorkJob({ ...left, child: { ...left.child!, left: true } })).toBeNull()
    expect(kidWorkJob({ ...left, child: null } as unknown as GameState)).toBeNull()
  })

  it('하루 한 번 들르면 요리사는 그날의 한 접시, 다른 일은 이야기만', () => {
    const s = grown('cook')
    const r = visitKidWork(s)!
    const dish = DISHES[KID_DISHES[300 % KID_DISHES.length]].item
    expect(r.dish).toBe(dish)
    expect(r.state.inv[dish]).toBe((s.inv[dish] ?? 0) + 1)
    expect(visitKidWork(r.state)).toBeNull()
    const p = visitKidWork(grown('potter'))!
    expect(p.dish).toBeUndefined()
  })

  it('후속: 세 번째·열 번째 들른 날은 특별한 말과 기억', () => {
    let s = grown('potter')
    const seen: (number | undefined)[] = []
    for (let d = 0; d < 10; d++) {
      const r = visitKidWork({ ...s, clock: { day: 300 + d, minute: 600 } })!
      seen.push(r.milestone)
      s = r.state
    }
    expect(seen[2]).toBe(3)
    expect(seen[9]).toBe(10)
    expect(seen.filter(Boolean)).toHaveLength(2)
    expect(memoriesOf(s).filter((m) => m.kind === 'kidWork').map((m) => m.n).sort()).toEqual([10, 3])
  })

  it('문 앞에 서면 일터 창, 모든 직업에 집 겸 일터 그림이 있다', () => {
    const s = grown('cook')
    const spot = kidWorkSpot(work)!
    expect(facilityAt(s, { x: spot.x - 1, y: spot.y })).toBe('kidWork')
    for (const job of ADULT_JOBS) {
      expect(OLD_BUILDINGS[job]?.down.rows.length).toBe(64)
      expect(OLD_CONSTRUCTION[job]?.down.rows.length).toBe(64)
    }
    useGame.setState({ game: s, modal: { kind: 'facility', id: 'kidWork' } as never })
    render(<ModalLayer />)
    expect(screen.getByRole('dialog', { name: '하나의 일터' })).toBeInTheDocument()
  })
})

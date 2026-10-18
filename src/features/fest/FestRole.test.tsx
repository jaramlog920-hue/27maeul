// 계절 잔치 맡은 일 (2026-10-18 감사 M-13·L-36): 모닥불 곁 이웃이 없거나 줄어도 끝낼 수 있고, 한 판의 차례 이웃은 시작할 때 정한 그대로
import { cleanup, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { newGame, type GameState } from '../../engine/game'
import { playRound } from '../../engine/club-round'
import { FESTIVAL_SPOTS, FIRE } from '../../engine/neighbors'
import { useGame } from '../../store/game-store'
import { FestSession } from './FestSession'

vi.mock('../../render/renderer', () => ({ drawGroupPreview: vi.fn() }))
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function fest(b: GameState, task?: { stage: number; selection: string; choice: string; guests?: string[] }, present: string[] = []): GameState {
  const npcs = Object.fromEntries(Object.entries(b.npcs).map(([id, n]) => [id, { ...n, visible: false }]))
  for (const id of present) npcs[id] = { ...b.npcs[id], ...FESTIVAL_SPOTS[id as keyof typeof FESTIVAL_SPOTS], visible: true, path: [] }
  return {
    ...b,
    clock: { day: 20, minute: 1090 },
    player: { ...b.player, ...FIRE },
    npcs,
    plans: { appts: [], nextId: 1 },
    clubSessions: {},
    fests: [{ id: 'fest:1', kind: 'festival', day: 20, place: 'bench', members: [], role: 'deco', reserve: {}, step: 'tidy', joined: false, consumed: false, closed: false, cancelled: false, ...(task ? { task } : {}) } as never],
  }
}

describe('잔치 맡은 일', () => {
  it('모닥불 곁에 아무도 없으면 한 판 없이 바로 맡은 일을 마칠 수 있다', () => {
    useGame.getState().load(fest(newGame(CONTENT)))
    render(<FestSession id="fest:1" />)
    expect(screen.getByRole('button', { name: T.fest.roleButton })).toBeEnabled()
  })

  it('한 판을 하다 닫았다 열었을 때 곁의 이웃이 줄어도 끝낼 수 있다', () => {
    useGame.getState().load(fest(newGame(CONTENT), { stage: 0, selection: '1', choice: 'baker' }, ['baker']))
    render(<FestSession id="fest:1" />)
    expect(screen.getByRole('button', { name: T.fest.roleButton })).toBeEnabled()
  })

  it('차례 이웃은 첫 차례에 정한 그대로 — 도중에 새 이웃이 와도 같은 이웃이 두 번 받지 않는다', () => {
    const present = Object.keys(FESTIVAL_SPOTS).slice(0, 3)
    const [a, b, c] = present
    let s = fest(newGame(CONTENT), undefined, [b, c])
    const first = playRound(s, 'fest:1', 'festivalDeco', [b, c], 0)
    s = first.state
    // a가 와서 지금 곁의 목록이 [a, b, c]로 바뀌어도 다음 차례는 처음 정한 c
    const heartsB = s.hearts[b] ?? 0
    const second = playRound(s, 'fest:1', 'festivalDeco', [a, b, c], 0)
    expect(second.state.hearts[b] ?? 0).toBe(heartsB)
    expect(second.state.fests[0].task?.guests).toEqual([b, c])
    expect(second.state.fests[0].task?.stage).toBe(3)
  })
})

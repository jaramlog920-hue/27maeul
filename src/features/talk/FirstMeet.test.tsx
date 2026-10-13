// 2026-10-13 사용자: 제일 처음 만났을 때 이웃과 인사 대화
import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import FIRST_MEET from '../../content/first-meet.json'
import { eventNow, newGame, openEvent, settle, type GameState } from '../../engine/game'
import { weatherOf } from '../../engine/calendar'
import { useGame } from '../../store/game-store'

beforeEach(() => {
  localStorage.clear()
  const g = newGame(CONTENT)
  useGame.getState().load({ ...g, flags: { ...g.flags, growthLegacy: 1 }, offers: {}, scenes: [] })
  useGame.setState({ modal: null, piecePopups: [], toast: null })
})

describe('처음 만난 이웃의 첫인사', () => {
  it('모든 이웃에게 첫인사가 있다', () => {
    for (const d of CONTENT.neighbors) expect((FIRST_MEET as Record<string, unknown>)[d.id], d.id).toBeTruthy()
  })
  it('처음 말을 걸면 첫인사, 두 번째부터는 평소 말', () => {
    const id = 'smith'
    act(() => useGame.getState().talkTo(id))
    const m = useGame.getState().modal
    expect(m?.kind).toBe('talk')
    if (m?.kind === 'talk') expect(m.line).toContain('브루노')
    expect(useGame.getState().game.notebook?.met).toContain(id)
    act(() => useGame.setState({ modal: null }))
    act(() => useGame.getState().talkTo(id))
    const m2 = useGame.getState().modal
    if (m2?.kind === 'talk') expect(m2.line).not.toContain('나는 브루노')
  })
  it('비 오는 날 열리는 이야기가 있어도 처음 말을 걸면 첫인사부터 (2026-10-14)', () => {
    // 사이가 깊어야 열리는 이야기도 있으니 마음을 넉넉히 (만난 적은 없다)
    const g1 = useGame.getState().game
    const base = { ...g1, hearts: Object.fromEntries(CONTENT.neighbors.map((d) => [d.id, 40])) }
    let found: { g: GameState; id: string } | null = null
    for (let day = 3; day < 120 && !found; day++) {
      if (weatherOf(day) !== 'rain') continue
      for (const minute of [600, 700, 800, 1100]) {
        const g0 = settle({ ...base, clock: { day, minute } }, CONTENT)
        for (const n of CONTENT.neighbors.map((d) => d.id)) {
          if (n === 'postman' || !(FIRST_MEET as Record<string, unknown>)[n] || !g0.npcs[n]) continue
          const e = eventNow(g0, n)
          if (!e) continue
          // 이야기 자리에 서 있게 (걸어오는 중이 아니게)
          const g = { ...g0, npcs: { ...g0.npcs, [n]: { ...g0.npcs[n], x: e.at.x, y: e.at.y, visible: true } } }
          if (openEvent(g, n)) { found = { g, id: n }; break }
        }
        if (found) break
      }
    }
    expect(found).not.toBeNull()
    const { g, id } = found!
    act(() => useGame.setState({ game: g, modal: null }))
    act(() => useGame.getState().talkTo(id))
    const m = useGame.getState().modal
    expect(m?.kind).toBe('talk')
    expect(useGame.getState().game.notebook?.met).toContain(id)
    // 다음에 말 걸면 그 이야기가 열린다
    act(() => useGame.setState({ modal: null }))
    act(() => useGame.getState().talkTo(id))
    expect(useGame.getState().modal?.kind).toBe('scene')
  })
})

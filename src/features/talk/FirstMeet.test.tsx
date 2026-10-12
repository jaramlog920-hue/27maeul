// 2026-10-13 사용자: 제일 처음 만났을 때 이웃과 인사 대화
import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import FIRST_MEET from '../../content/first-meet.json'
import { newGame } from '../../engine/game'
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
})

// 기존 생활 시나리오는 개편 이전 저장의 권한으로 검증한다. 새 해금은 late-growth.test.ts에서 검증한다.
import { legacyGame as newGame } from '../../engine/growth-test-support'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { newChild } from '../../engine/child'
import { type GameState } from '../../engine/game'
import { freshStats } from '../../engine/stats'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { pageThrough } from '../../test/scene-pages'

function reset(minute = 10 * 60) {
  localStorage.clear()
  const g = newGame(CONTENT)
  const child = { ...newChild(10, freshStats(), undefined), name: '루시', look: 'girl' as const }
  const game: GameState = { ...g, scenes: [], clock: { ...g.clock, day: 60, minute }, child }
  useGame.setState({ game, modal: null, rng: () => 0, decorating: null, toast: null })
}

describe('함께하는 시간 — 화면', () => {
  it('새 터에서는 마을로 돌아가라는 안내와 잠긴 활동 단추를 보인다',()=>{
    reset()
    const before={...useGame.getState().game,map:'newland' as const}
    useGame.setState({game:before,modal:{kind:'kidTime'}})
    render(<ModalLayer />)
    expect(screen.getAllByText(/아이는 마을에 있어요/).length).toBeGreaterThan(0)
    const read=screen.getByRole('button',{name:/같이 책 읽기/})
    expect(read).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(read)
    expect(useGame.getState().game).toBe(before)
  })
  it('아이를 누르면 [함께하기] → 고르기 → 짧은 장면과 결과, 처음이면 창을 닫은 뒤 앨범 장면', () => {
    reset()
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'follow', who: 'child' }))
    fireEvent.click(screen.getByRole('button', { name: '함께하기' }))
    expect(screen.getByRole('heading', { name: '함께하는 시간' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /같이 책 읽기/ }))
    const m = useGame.getState().modal
    expect(m).toMatchObject({ kind: 'kidTime', done: { act: 'read', album: true } })
    expect(screen.getByText('루시의 지능이 조금 자랐어요')).toBeInTheDocument()
    expect(screen.getByText('루시와 조금 더 가까워졌어요')).toBeInTheDocument()
    expect(screen.getByText('가족 앨범에 한 장이 남아요')).toBeInTheDocument()
    // 조사를 이름에 맞춘다 (루시가 / 루시와) — 남은 중괄호가 없다
    expect(document.body.textContent).not.toMatch(/\{/)
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    act(() => useGame.getState().frame(0.05))
    expect(useGame.getState().modal).toEqual({ kind: 'scene', id: 'fam:read' })
    expect(pageThrough()).toMatch(/루시, 처음 같이 책 읽은 날/)
  })

  it('두 번 하면 남은 일은 잠기고 "내일 또 해요" — 잠들기 전 이야기는 저녁부터', () => {
    reset()
    render(<ModalLayer />)
    act(() => useGame.getState().kidAct('puzzle'))
    act(() => useGame.getState().kidAct('ball'))
    act(() => useGame.getState().open({ kind: 'kidTime' }))
    expect(screen.getByRole('button', { name: /같이 책 읽기/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText(/내일 또 해요/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /잠들기 전 이야기/ })).toHaveAttribute('aria-disabled', 'true')
  })
})

// 기억 정원 표식 치우기·세우기 (계획 18 §13, 2026-10-08): 기억은 남고 정원의 표식만 감춘다
import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { newGame, type GameState } from './game'
import type { Build } from './newland-build'
import { markerShown, memoriesOf, toggleMarker } from './newland-life'
import { useGame } from '../store/game-store'
import { ModalLayer } from '../features/ModalLayer'

const garden: Build = { id: 'b1', kind: 'memorial', x: 16, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false }
function land(): GameState {
  const base = newGame(CONTENT)
  return { ...base, clock: { day: 50, minute: 600 }, flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1, allFeast: 2, allFeastDay: 30, 'yardMemo:40': 3 }, newland: { builds: [garden], tiles: {}, nextId: 2, settledDay: 50 } }
}

describe('기억 정원 표식', () => {
  it('치우면 표식만 감추고 기억은 그대로, 다시 세울 수 있다', () => {
    const s = land()
    const [first] = memoriesOf(s)
    expect(markerShown(s, first)).toBe(true)
    const hidden = toggleMarker(s, first)
    expect(markerShown(hidden, first)).toBe(false)
    expect(memoriesOf(hidden)).toEqual(memoriesOf(s))
    expect(markerShown(toggleMarker(hidden, first), first)).toBe(true)
  })

  it('정원 창의 줄마다 치우기·세우기', () => {
    useGame.setState({ game: land(), modal: { kind: 'facility', id: 'memorial' } as never })
    render(<ModalLayer />)
    const hide = screen.getAllByRole('button', { name: '표식 치우기' })
    expect(hide).toHaveLength(2)
    fireEvent.click(hide[0])
    expect(screen.getAllByRole('button', { name: '표식 세우기' })).toHaveLength(1)
  })
})

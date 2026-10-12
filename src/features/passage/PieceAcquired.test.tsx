import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

beforeEach(() => {
  localStorage.clear()
  useGame.getState().load({ ...newGame(CONTENT), scenes: [] })
})

it('고양이가 찾은 조각의 획득 창은 집에서 얻었다고 안내한다', () => {
  render(<ModalLayer />)
  const id = CONTENT.pieces[0].id
  act(() => useGame.setState(s => ({ game: { ...s.game, collected: [id], pieceLog: { [id]: { day: 5, from: 'petHome' } } } })))
  expect(screen.getByText('고양이가 집에서 말씀 조각을 찾아왔어요 · 도감에 담겼어요.')).toBeInTheDocument()
})

it('opens every new piece in a queue and restores the original screen after closing', () => {
  act(() => useGame.getState().open({ kind: 'menu', place: 'hill' }))
  render(<ModalLayer />)
  const pieces = CONTENT.pieces.slice(0, 2)
  act(() => useGame.setState(s => ({ game: { ...s.game, collected: pieces.map(p => p.id) } })))
  expect(screen.getByRole('dialog', { name: '말씀조각 획득' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: pieces[0].title })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '다음 조각 · 1개 남음' }))
  expect(screen.getByRole('heading', { name: pieces[1].title })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /닫기/ }))
  expect(useGame.getState().modal).toEqual({ kind: 'menu', place: 'hill' })
  expect(screen.queryByRole('dialog', { name: '말씀조각 획득' })).toBeNull()
})

it('does not show old pieces when loading and does not replay a duplicate acquisition window', () => {
  const piece = CONTENT.pieces[0]
  act(() => useGame.getState().load({ ...newGame(CONTENT), collected: [piece.id] }))
  expect(useGame.getState().piecePopups).toEqual([])
  act(() => useGame.getState().load(newGame(CONTENT)))
  act(() => useGame.setState(s => ({ game: { ...s.game, collected: [piece.id] }, modal: { kind: 'passage', pieceId: piece.id, askLine: false } })))
  render(<ModalLayer />)
  fireEvent.click(screen.getByRole('button', { name: /닫기/ }))
  expect(useGame.getState().modal).toBeNull()
  expect(useGame.getState().piecePopups).toEqual([])
})

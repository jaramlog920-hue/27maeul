import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { newGame, LIBRARY_READ_PRICE } from '../../engine/game'
import { deserialize, serialize } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  useGame.getState().load({ ...newGame(CONTENT), scenes: [], coins: 100, clock: { day: 3, minute: 600 } })
  useGame.setState({ modal: { kind: 'library' }, toast: null, piecePopups: [], copyResult: null })
})
afterEach(() => vi.restoreAllMocks())

it('열람석 클릭 후 이전 입력은 두 번째 비용·조각을 지급하지 않고 정상 재입장은 허용한다', () => {
  render(<ModalLayer />)
  const before = useGame.getState().game
  const lateRead = useGame.getState().libraryRead
  fireEvent.click(screen.getByRole('button', { name: '옮겨 적기 · 3닢' }))
  const first = useGame.getState().game
  const id = first.collected[0]
  expect(first.coins).toBe(before.coins - LIBRARY_READ_PRICE)
  expect(first.clock.minute).toBe(630)
  expect(first.pieceLog[id]).toEqual({ day: 3, from: 'library' })
  expect(useGame.getState().piecePopups).toEqual([id])
  expect(screen.getByRole('dialog', { name: '말씀조각 획득' })).toBeInTheDocument()
  act(() => lateRead())
  expect(useGame.getState().game).toBe(first)
  expect(useGame.getState().piecePopups).toEqual([id])
  fireEvent.click(screen.getByRole('button', { name: /닫기/ }))
  expect(useGame.getState().modal).toBeNull()
  act(() => lateRead())
  expect(useGame.getState().game).toBe(first)
  act(() => useGame.setState({ modal: { kind: 'library' } }))
  fireEvent.click(screen.getByRole('button', { name: '옮겨 적기 · 3닢' }))
  const second = useGame.getState().game
  expect(second.collected).toHaveLength(2)
  expect(new Set(second.collected).size).toBe(2)
  expect(second.coins).toBe(before.coins - LIBRARY_READ_PRICE * 2)
  const saved = deserialize(serialize(second), CONTENT)!
  expect(saved.collected).toEqual(second.collected)
  expect(saved.pieceLog).toEqual(second.pieceLog)
  act(() => useGame.getState().load(saved))
  expect(useGame.getState().piecePopups).toEqual([])
  act(() => useGame.setState({ modal: { kind: 'library' } }))
  expect(screen.getByRole('button', { name: '옮겨 적기 · 3닢' })).toBeDisabled()
})

it('다른 저장을 불러와 창이 닫힌 뒤 이전 열람 입력은 새 저장을 변경하지 않는다', () => {
  const lateRead = useGame.getState().libraryRead
  const saved = deserialize(serialize({ ...newGame(CONTENT), coins: 99 }), CONTENT)!
  act(() => useGame.getState().load(saved))
  act(() => lateRead())
  expect(useGame.getState().game).toBe(saved)
  expect(useGame.getState().modal).toBeNull()
})

import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { newGame, SCROLL_PRICE } from '../../engine/game'
import { deserialize, serialize } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  useGame.getState().load({ ...newGame(CONTENT), scenes: [], coins: 100, clock: { day: 7, minute: 600 } })
  useGame.setState({ modal: { kind: 'trade' }, toast: null, piecePopups: [], copyResult: null })
})
afterEach(() => vi.restoreAllMocks())
// 2026-10-12: 희귀 좌판도 아이콘 칸 — 옛 사본 칸을 고르면 자세히 칸에 사기 단추
const SCROLL = '다른 마을에서 온 옛 사본 (다음 대목)'
const scrollAction = () => {
  const slot = screen.getByRole('button', { name: SCROLL })
  if (slot.getAttribute('aria-pressed') !== 'true') fireEvent.click(slot)
  return document.querySelector('.bag-detail .actions button') as HTMLButtonElement
}
const buy = () => fireEvent.click(scrollAction())
const openRare = () => {
  act(() => useGame.setState({ modal: { kind: 'trade' } }))
  fireEvent.click(screen.getByRole('button', { name: '희귀 좌판' }))
}

it('사본 구매 뒤 늦은 입력은 닢·조각을 늘리지 않고 재입장 구매/저장 한도는 유지한다', () => {
  render(<ModalLayer />)
  fireEvent.click(screen.getByRole('button', { name: '희귀 좌판' }))
  const before = useGame.getState().game
  const lateBuy = useGame.getState().buyScroll
  buy()
  const first = useGame.getState().game
  const id = first.collected[0]
  expect(first.coins).toBe(before.coins - SCROLL_PRICE)
  expect(first.clock).toEqual(before.clock)
  expect(first.pieceLog[id]).toEqual({ day: 7, from: 'scroll' })
  expect(useGame.getState().piecePopups).toEqual([id])
  act(() => lateBuy())
  expect(useGame.getState().game).toBe(first)
  fireEvent.click(screen.getByRole('button', { name: /닫기/ }))
  act(() => lateBuy())
  expect(useGame.getState().game).toBe(first)
  openRare()
  buy()
  const second = useGame.getState().game
  expect(second.coins).toBe(before.coins - SCROLL_PRICE * 2)
  expect(new Set(second.collected).size).toBe(2)
  const saved = deserialize(serialize(second), CONTENT)!
  expect(saved.pieceLog).toEqual(second.pieceLog)
  act(() => useGame.getState().load(saved))
  expect(useGame.getState().piecePopups).toEqual([])
  openRare()
  expect(scrollAction()).toHaveTextContent('다 샀어요')
  expect(scrollAction()).toHaveAttribute('aria-disabled', 'true')
})

it.each(['closed', 'otherModal', 'loaded'] as const)('%s 상태의 이전 사본 구매 입력은 현재 저장을 보존한다', (reason) => {
  const lateBuy = useGame.getState().buyScroll
  act(() => {
    if (reason === 'loaded') useGame.getState().load(deserialize(serialize(useGame.getState().game), CONTENT)!)
    else useGame.setState({ modal: reason === 'closed' ? null : { kind: 'library' } })
  })
  const before = useGame.getState().game
  const modal = useGame.getState().modal
  act(() => lateBuy())
  expect(useGame.getState().game).toBe(before)
  expect(useGame.getState().modal).toBe(modal)
})

it('장날이 아니면 옛 사본 줄은 없고 이전 구매 입력도 재고와 닢을 바꾸지 않는다', () => {
  act(() => useGame.setState(s => ({ game: { ...s.game, clock: { day: 8, minute: 600 } } })))
  render(<ModalLayer />)
  fireEvent.click(screen.getByRole('button', { name: '희귀 좌판' }))
  expect(screen.queryByRole('button', { name: SCROLL })).toBeNull()
  const before = useGame.getState().game
  act(() => useGame.getState().buyScroll())
  expect(useGame.getState().game).toBe(before)
})

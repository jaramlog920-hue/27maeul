import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { itemName } from '../../content/text'
import { newGame } from '../../engine/game'
import { extendTurns, NEW_BOARD } from '../../engine/trip-board'
import { useGame } from '../../store/game-store'
import { TravelView } from './TravelView'

vi.mock('../../shared/ItemIcon', () => ({ ItemIcon: () => null }))

it('추가 주사위 비용 때문에 못 사는 물건은 귀환을 막고, 사지 않는 귀환은 허용한다', () => {
  const game = { ...newGame(CONTENT), coins: 50, scenes: [] }
  const rewards = extendTurns(NEW_BOARD, 15).rewards
  useGame.getState().load(game)
  useGame.setState({ modal: { kind: 'travel', dest: 'harbor', rewards } })
  render(<TravelView dest="harbor" rewards={rewards} />)
  expect(screen.getByText(/사용 가능한 닢 40/)).toBeInTheDocument()
  // 희귀품 가게는 아이콘 칸 — 칸을 고르고 '담기' (2026-10-12)
  fireEvent.click(screen.getByRole('button', { name: itemName('finePapyrus') }))
  fireEvent.click(screen.getByRole('button', { name: '담기' }))
  expect(screen.getByRole('button', { name: '하룻밤 묵고 돌아가기' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: '사지 않고 돌아가기' }))
  expect(useGame.getState().game.coins).toBe(5)
  expect(useGame.getState().game.flags['trip:harbor']).toBe(1)
})

it('여행에서 얻은 닢도 정산 후 사용 가능한 금액에 포함한다', () => {
  useGame.getState().load({ ...newGame(CONTENT), coins: 35, scenes: [] })
  const rewards = [{ kind: 'coins' as const, n: 15 }]
  useGame.setState({ modal: { kind: 'travel', dest: 'harbor', rewards } })
  render(<TravelView dest="harbor" rewards={rewards} />)
  // 희귀품 가게는 아이콘 칸 — 칸을 고르고 '담기' (2026-10-12)
  fireEvent.click(screen.getByRole('button', { name: itemName('finePapyrus') }))
  fireEvent.click(screen.getByRole('button', { name: '담기' }))
  const back = screen.getByRole('button', { name: '하룻밤 묵고 돌아가기' })
  expect(back).not.toBeDisabled()
  fireEvent.click(back)
  expect(useGame.getState().game.coins).toBe(0)
  expect(useGame.getState().game.inv.finePapyrus).toBe(1)
})

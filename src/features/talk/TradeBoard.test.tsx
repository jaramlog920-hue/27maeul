import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { itemName, T } from '../../content/text'
import { newGame } from '../../engine/game'
import { SELL_CAP } from '../../engine/merchant-selling'
import { useGame } from '../../store/game-store'
import { TradeBoard } from './TradeBoard'

beforeEach(() => {
  localStorage.clear()
  useGame.getState().load({ ...newGame(CONTENT), clock: { day: 7, minute: 600 }, inv: { herb: 2 } })
})

const selling = () => {
  render(<TradeBoard />)
  fireEvent.click(screen.getByRole('button', { name: T.ui.tradeSell }))
}

// 2026-10-12: 팔기 칸은 가방처럼 아이콘 칸 — 칸을 누르면 값·설명과 팔기 단추가 나온다
const slots = () => [...document.querySelectorAll('.bag-grid .bag-slot')] as HTMLButtonElement[]
const pick = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const action = () => document.querySelector('.bag-detail .actions button') as HTMLButtonElement

describe('merchant selling tab', () => {
  it('enables stocked goods for a beginning player and hides unowned slots', () => {
    selling()
    expect(slots()).toHaveLength(1)
    expect(slots()[0]).toHaveAccessibleName(itemName('herb'))
    expect(slots()[0]).toHaveTextContent('2')
    pick(itemName('herb'))
    expect(action()).toHaveTextContent(T.ui.tradeSell)
    expect(action()).toBeEnabled()
    expect(screen.getByRole('status')).toHaveTextContent(`오늘 팔 수 있는 물건 ${SELL_CAP}개`)
  })
  it('clicking sell updates inventory and pays the beginner player', () => {
    selling()
    pick(itemName('herb'))
    fireEvent.click(action())
    expect(useGame.getState().game.inv.herb).toBe(1)
    expect(useGame.getState().game.coins).toBe(4)
    expect(useGame.getState().game.flags.soldCount).toBe(1)
  })
  it.each(['notMarket', 'cap'] as const)('explains the %s restriction', (block) => {
    const game = useGame.getState().game
    useGame.setState({ game: block === 'notMarket' ? { ...game, clock: { day: 8, minute: 600 } } : { ...game, flags: { ...game.flags, soldDay: 7, soldCount: SELL_CAP } } })
    selling()
    pick(itemName('herb'))
    expect(action()).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('status')).toHaveTextContent(block === 'cap' ? '다음 장날' : '장날에 팔 수')
  })
})


it('가구를 살 때 차액과 필요한 재료를 모두 안내하고 함께 지불한다', () => {
  const game = useGame.getState().game
  useGame.setState({ game: { ...game, coins: 500, inv: { olive: 1, wool: 1 } } })
  const { container } = render(<TradeBoard />)
  fireEvent.click(screen.getByRole('button', { name: T.trades.chair }))
  const detail = container.querySelector('.bag-detail')!
  expect(detail).toHaveTextContent('145')
  expect(within(detail as HTMLElement).getByRole('img', { name: itemName('olive') })).toBeInTheDocument()
  expect(within(detail as HTMLElement).getByRole('img', { name: itemName('wool') })).toBeInTheDocument()
  fireEvent.click(detail.querySelector('.actions button')!)
  expect(useGame.getState().game.coins).toBe(355)
  expect(useGame.getState().game.inv.chair).toBe(1)
  expect(useGame.getState().game.inv.olive ?? 0).toBe(0)
  expect(useGame.getState().game.inv.wool ?? 0).toBe(0)
})

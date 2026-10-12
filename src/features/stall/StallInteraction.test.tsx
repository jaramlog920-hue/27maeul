import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { itemName, T } from '../../content/text'
import { isWet, weatherOf } from '../../engine/calendar'
import { interactTile, newGame, tapTile } from '../../engine/game'
import { STALL_SPOT, STALL_STAND } from '../../engine/stall'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

beforeEach(() => {
  localStorage.clear()
  let day = 7
  while (isWet(weatherOf(day))) day += 7
  const game = newGame(CONTENT)
  // 좌판은 신약 6권을 마쳐야 열린다 — 다 열린 옛 저장으로 (growthLegacy)
  useGame.getState().load({ ...game, scenes: [], flags: { ...game.flags, growthLegacy: 1 }, clock: { day, minute: 600 }, inv: { herb: 2 }, npcs: {}, player: { ...game.player, ...STALL_STAND } })
  useGame.setState({ trip: null, decorating: null })
})

it.each([STALL_SPOT, STALL_STAND])('tapping stall tile %j opens the goods dialog, including when standing on it', at => {
  render(<ModalLayer />)
  act(() => { useGame.getState().tap(at); useGame.getState().frame(0) })
  expect(useGame.getState().modal?.kind).toBe('stall')
  expect(screen.getByRole('heading', { name: T.stall.goodsTitle })).toBeInTheDocument()
})

it('space can open the stall and distant taps arrive at the standing spot', () => {
  const s = useGame.getState().game
  expect(interactTile({ ...s, player: { ...s.player, facing: 'up' } })).not.toBeNull()
  const from = { ...s, player: { ...s.player, x: 24, y: 20 } }
  expect(tapTile(from, STALL_SPOT).target?.kind).toBe('stall')
  useGame.getState().load(from)
  render(<ModalLayer />)
  act(() => {
    useGame.getState().tap(STALL_SPOT)
    for (let i = 0; i < 400 && !useGame.getState().modal; i++) useGame.getState().frame(0.05)
  })
  expect(useGame.getState().modal?.kind).toBe('stall')
})

it('a beginner can actually sell stocked material through the merchant UI', () => {
  useGame.getState().open({ kind: 'trade' })
  render(<ModalLayer />)
  fireEvent.click(screen.getByRole('button', { name: T.ui.tradeSell }))
  // 팔기 칸은 아이콘 칸 — 칸을 고르면 자세히 칸에 팔기 단추 (2026-10-12)
  fireEvent.click(screen.getByRole('button', { name: itemName('herb') }))
  fireEvent.click(document.querySelector('.bag-detail .actions button')!)
  expect(useGame.getState().game.inv.herb).toBe(1)
  expect(useGame.getState().game.coins).toBe(4)
  expect(useGame.getState().game.flags.soldCount).toBe(1)
})

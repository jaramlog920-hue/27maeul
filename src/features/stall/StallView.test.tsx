import { establishedGame as newGame } from "../../engine/growth-test-support"
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { loadGame } from '../../engine/save'
import { isMarketDay, isWet, weatherOf } from '../../engine/calendar'
import { DEFAULT_LOOK, openStall, STALL_STAND, STALL_SETUP_MINUTES, STALL_TO } from '../../engine/stall'
import { useGame } from '../../store/game-store'
import { StallView } from './StallView'

beforeEach(() => {
  localStorage.clear()
  let day = 7
  while (!isMarketDay(day) || isWet(weatherOf(day))) day += 7
  const game = newGame(CONTENT)
  useGame.getState().load({ ...game, clock: { day, minute: 600 }, inv: { herb: 2 }, player: { ...game.player, ...STALL_STAND } })
})

describe('player stall opening', () => {
  it('automatically closes and saves returned stock when waiting reaches 17:00', () => {
    const opened = openStall(useGame.getState().game, [{ item: 'herb', qty: 1, price: 'normal' }], DEFAULT_LOOK)
    useGame.setState({ game: { ...opened, npcs: {}, clock: { ...opened.clock, minute: STALL_TO - 15 } } })
    render(<StallView />)
    fireEvent.click(screen.getByRole('button', { name: T.stall.wait }))
    expect(screen.getByRole('heading', { name: T.stall.summaryTitle })).toBeInTheDocument()
    const game = useGame.getState().game
    expect(game.stall?.closed).toBe(true)
    expect(game.inv.herb).toBe(2)
    const saved = loadGame(CONTENT)!
    expect(saved.stall?.closed).toBe(true)
    expect(saved.inv.herb).toBe(2)
  })

  it('records and announces the 500-coin achievement immediately after a sale', () => {
    const opened = openStall(useGame.getState().game, [{ item: 'herb', qty: 1, price: 'normal' }], DEFAULT_LOOK)
    useGame.setState({ award: null, game: { ...opened, coins: 499, achieved: opened.achieved, stall: { ...opened.stall!, guest: { npc: 'baker', item: 'herb', score: 2, regular: false, phase: 'look' } } } })
    render(<StallView />)
    fireEvent.click(screen.getByRole('button', { name: T.stall.ways.explain }))
    const game = useGame.getState().game
    expect(game.coins).toBeGreaterThanOrEqual(500)
    expect(game.achieved).toContainEqual({ id: 'coins500', day: game.clock.day })
    expect(useGame.getState().award?.text).toContain('닢 오백')
    expect(loadGame(CONTENT)!.achieved).toContainEqual({ id: 'coins500', day: game.clock.day })
  })

  it('keeps the last sale and returns only unsold goods when serving ends at 17:00', () => {
    const opened = openStall(useGame.getState().game, [{ item: 'herb', qty: 2, price: 'normal' }], DEFAULT_LOOK)
    useGame.setState({ game: { ...opened, clock: { ...opened.clock, minute: STALL_TO - 15 }, stall: { ...opened.stall!, guest: { npc: 'baker', item: 'herb', score: 2, regular: false, phase: 'look' } } } })
    render(<StallView />)
    fireEvent.click(screen.getByRole('button', { name: T.stall.ways.explain }))
    const game = useGame.getState().game
    expect(screen.getByRole('heading', { name: T.stall.summaryTitle })).toBeInTheDocument()
    expect(game.stall).toMatchObject({ closed: true, returned: { herb: 1 }, served: ['baker'] })
    expect(game.stall!.sold).toHaveLength(1)
    expect(game.coins).toBe(opened.coins + game.stall!.earned)
    expect(game.inv.herb).toBe(1)
    expect(loadGame(CONTENT)!.stall).toEqual(game.stall)
  })

  it('reacts to a clock change while mounted and does not return stock twice on reopening', () => {
    const opened = openStall(useGame.getState().game, [{ item: 'herb', qty: 1, price: 'normal' }], DEFAULT_LOOK)
    useGame.setState({ game: opened })
    const view = render(<StallView />)
    act(() => useGame.setState({ game: { ...opened, clock: { ...opened.clock, minute: STALL_TO } } }))
    expect(useGame.getState().game.stall?.closed).toBe(true)
    expect(useGame.getState().game.inv.herb).toBe(2)
    view.unmount()
    render(<StallView />)
    expect(useGame.getState().game.inv.herb).toBe(2)
  })

  it.each(['over', 'away'] as const)('hides response buttons when a waiting guest cannot be served: %s', reason => {
    const opened = openStall(useGame.getState().game, [{ item: 'herb', qty: 1, price: 'normal' }], DEFAULT_LOOK)
    const waiting = { ...opened, stall: { ...opened.stall!, guest: { npc: 'baker', item: 'herb' as const, score: 2 as const, regular: false, phase: 'look' as const } } }
    useGame.setState({ game: reason === 'over'
      ? { ...waiting, clock: { ...waiting.clock, minute: STALL_TO - 14 } }
      : { ...waiting, player: { ...waiting.player, x: 5, y: 30 } } })
    render(<StallView />)
    for (const label of Object.values(T.stall.ways)) expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument()
    expect(screen.getByText(T.stall.status[reason])).toBeInTheDocument()
    expect(screen.getByRole('button', { name: T.stall.close })).toBeInTheDocument()
  })

  it('opens from the upper plaza with inventory and returns unsold stock on closing', () => {
    render(<StallView />)
    fireEvent.click(screen.getByRole('button', { name: T.stall.plus }))
    fireEvent.click(screen.getByRole('button', { name: T.stall.next }))
    fireEvent.click(screen.getByRole('button', { name: T.stall.open }))
    const opened = useGame.getState().game
    expect(opened.stall).toMatchObject({ closed: false, goods: [{ item: 'herb', qty: 1, left: 1, price: 'normal' }] })
    expect(opened.inv.herb).toBe(1)
    expect(opened.clock.minute).toBe(600 + STALL_SETUP_MINUTES)
    fireEvent.click(screen.getByRole('button', { name: T.stall.close }))
    expect(useGame.getState().game.inv.herb).toBe(2)
    expect(useGame.getState().game.stall?.closed).toBe(true)
  })
  it('offers a route from the merchant guide to the stall spot', () => {
    const game = useGame.getState().game
    useGame.setState({ modal: { kind: 'stall' }, game: { ...game, player: { ...game.player, x: 24, y: 20 } } })
    render(<StallView />)
    expect(screen.getByText(T.stall.block.away)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '좌판 자리로 가기' }))
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().game.player.path.length).toBeGreaterThan(0)
  })
})

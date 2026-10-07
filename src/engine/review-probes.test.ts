import { expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame, takeTrip } from './game'
import { canExtend, extendTurns, NEW_BOARD } from './trip-board'
import { deserialize, serialize, SAVE_KEY } from './save'
import { freshStats } from './stats'
import { useGame } from '../store/game-store'

it('reproduces negative coins after extension and shopping', () => {
  const base = newGame(CONTENT)
  const game = { ...base, coins: 50 }
  expect(canExtend(NEW_BOARD, 50 - 35)).toBe(true)
  const board = extendTurns(NEW_BOARD, 15)
  const returned = takeTrip(game, CONTENT, 'harbor', ['finePapyrus'], board.rewards)!
  expect(returned.coins).toBe(-10)
})

it('keeps user text through save migration (fixed 2026-10-08, 01-B)', () => {
  const game = newGame(CONTENT)
  game.myLines['guide:mt:1'] = 'innkeeper lamb:found lambFound'
  const loaded = deserialize(serialize(game), CONTENT)!
  expect(loaded.myLines['guide:mt:1']).toBe('innkeeper lamb:found lambFound')
})

it('keeps autosave achievements in live state (fixed 2026-10-08, 01-A)', () => {
  localStorage.clear()
  const game = { ...newGame(CONTENT), coins: 500, achieved: [] }
  useGame.setState({ game, clockMs: 19999, modal: { kind: 'settings' }, trip: null })
  useGame.getState().frame(0.05)
  expect(JSON.parse(localStorage.getItem(SAVE_KEY)!).achieved.some((a: { id: string }) => a.id === 'coins500')).toBe(true)
  expect(useGame.getState().game.achieved.some(a => a.id === 'coins500')).toBe(true)
})

it('reproduces family trip reward persisted before any trip is paid or recorded', () => {
  const base = newGame(CONTENT)
  const game = { ...base, coins: 50, clock: { day: 20, minute: 600 }, child: { name: '아이', look: 'girl' as const, born: 1, stats: freshStats(), lean: null, close: 0 } }
  useGame.setState({ game, modal: null, trip: null })
  useGame.getState().startTripBoard('harbor', true)
  useGame.getState().finishTripBoard([])
  const loaded = deserialize(localStorage.getItem(SAVE_KEY), CONTENT)!
  expect(loaded.child!.close).toBe(5)
  expect(loaded.coins).toBe(50)
  expect(loaded.clock.day).toBe(20)
  expect(loaded.flags['trip:harbor']).toBeUndefined()
})

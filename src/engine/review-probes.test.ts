import { expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { canTrip, newGame, takeTrip } from './game'
import { canExtend, extendTurns, NEW_BOARD } from './trip-board'
import { deserialize, serialize, SAVE_KEY } from './save'
import { freshStats } from './stats'
import { useGame } from '../store/game-store'

it('reserves extension costs before shopping and returns without negative coins', () => {
  const base = newGame(CONTENT)
  const game = { ...base, coins: 50 }
  expect(canExtend(NEW_BOARD, 50 - 35)).toBe(true)
  const board = extendTurns(NEW_BOARD, 15)
  expect(canTrip(game, 'harbor', ['finePapyrus'], true, board.rewards)).toBe('coins')
  expect(takeTrip(game, CONTENT, 'harbor', ['finePapyrus'], board.rewards)).toBeNull()
  const returned = takeTrip(game, CONTENT, 'harbor', [], board.rewards)!
  expect(returned.coins).toBe(5)
  expect(returned.flags['trip:harbor']).toBe(1)
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

it('awards and saves the family trip only after a successful return, once', () => {
  const base = newGame(CONTENT)
  // 순위 후원금이 지급되는 21일 아침을 피해 여행 정산만 검사한다.
  const game = { ...base, coins: 50, clock: { day: 19, minute: 600 }, child: { name: '아이', look: 'girl' as const, born: 14, stats: freshStats(), lean: null, close: 0 } }
  useGame.getState().load(game)
  const savedBefore = localStorage.getItem(SAVE_KEY)
  useGame.getState().startTripBoard('harbor', true)
  useGame.getState().finishTripBoard([])
  expect(localStorage.getItem(SAVE_KEY)).toBe(savedBefore)
  expect(useGame.getState().game.child!.close).toBe(0)
  // 귀환에 실패해도 가족 보상과 여행 비용은 그대로다.
  useGame.getState().goTrip('harbor', ['perfumeOil'])
  expect(useGame.getState().game).toBe(game)
  expect(localStorage.getItem(SAVE_KEY)).toBe(savedBefore)
  useGame.getState().goTrip('harbor', [])
  const returned = useGame.getState().game
  const loaded = deserialize(localStorage.getItem(SAVE_KEY), CONTENT)!
  expect(loaded.child!.close).toBe(5)
  expect(loaded.coins).toBe(15)
  expect(loaded.clock.day).toBe(20)
  expect(loaded.flags['trip:harbor']).toBe(1)
  useGame.getState().goTrip('harbor', [])
  expect(useGame.getState().game).toBe(returned)
})

it('closing the shop before returning leaves no family reward in the save', () => {
  const base = newGame(CONTENT)
  const game = { ...base, coins: 50, clock: { day: 20, minute: 600 }, child: { name: '아이', look: 'girl' as const, born: 15, stats: freshStats(), lean: null, close: 0 } }
  localStorage.setItem(SAVE_KEY, serialize(game))
  useGame.getState().load(game)
  useGame.getState().startTripBoard('harbor', true)
  useGame.getState().finishTripBoard([])
  useGame.getState().closeModal()
  const loaded = deserialize(localStorage.getItem(SAVE_KEY), CONTENT)!
  expect(loaded.child!.close ?? 0).toBe(0)
  expect(loaded.coins).toBe(50)
  expect(loaded.clock.day).toBe(20)
  expect(loaded.flags['trip:harbor']).toBeUndefined()
})

import { legacyGame as newGame } from '../../engine/growth-test-support'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { goToSleep } from '../../engine/game'
import { newGenState, relationId } from '../../engine/gen'
import { settleGen, withPairs } from '../../engine/gen-settle'
import { loadGame, saveGame, setActiveSlot } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { Settings } from './Settings'

beforeEach(() => { localStorage.clear(); setActiveSlot('1') })
afterEach(() => setActiveSlot('1'))

it('설정 클릭은 현재 저장 칸에만 남고 꺼 둔 기간의 관계 사건을 재개 때 몰아 처리하지 않는다', () => {
  const base = newGame(CONTENT)
  setActiveSlot('2')
  saveGame({ ...base, coins: 222 })
  const other = localStorage.getItem('twenty-seven/save/2')
  setActiveSlot('1')
  const gen = newGenState(CONTENT, 7919, 10, withPairs())
  const pair = relationId('rudy', 'poppy')
  useGame.getState().load({ ...base, scenes: [], clock: { day: 10, minute: 600 },
    gen: { ...gen, affinity: { ...gen.affinity, [pair]: 85 } } })
  render(<Settings />)
  fireEvent.click(screen.getByRole('tab', { name: '게임' }))
  const group = within(screen.getByRole('group', { name: '주민 자율 생활' }))
  fireEvent.click(group.getByRole('button', { name: '끔' }))
  expect(group.getByRole('button', { name: '끔' })).toHaveAttribute('aria-pressed', 'true')
  let state = loadGame(CONTENT)!
  expect(state.gen!.on).toBe(false)
  const originalLogs = state.gen!.log
  for (let i = 0; i < 12; i++) {
    state = goToSleep(state, CONTENT)
    expect(state.gen!.log).toEqual(originalLogs)
    expect(state.gen!.on).toBe(false)
    expect(saveGame(state)).toBe(true)
    state = loadGame(CONTENT)!
  }
  expect(state.clock.day).toBe(22)
  act(() => useGame.getState().load(state))
  expect(group.getByRole('button', { name: '끔' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(group.getByRole('button', { name: '켬' }))
  const resumed = loadGame(CONTENT)!
  expect(resumed.gen!.on).toBe(true)
  expect(resumed.gen!.settledDay).toBe(22)
  expect(settleGen(resumed, CONTENT).gen!.log).toEqual(originalLogs)
  const morning = goToSleep(resumed, CONTENT)
  expect(morning.gen!.settledDay).toBe(23)
  expect(morning.gen!.log.length).toBeGreaterThan(originalLogs.length)
  for (const entry of morning.gen!.log.slice(originalLogs.length)) expect(entry.day).toBe(23)
  expect(localStorage.getItem('twenty-seven/save/2')).toBe(other)
  expect(loadGame(CONTENT, localStorage, '2')!.coins).toBe(222)
})

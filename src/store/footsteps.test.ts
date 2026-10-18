import { beforeEach, expect, it, vi } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { sfx } from '../audio/sound'
import { useGame } from './game-store'

vi.mock('../audio/sound', () => ({ sfx: vi.fn(), setAudioMuted: vi.fn() }))

beforeEach(() => {
  const s = newGame(CONTENT)
  useGame.getState().load({ ...s, scenes: [], clock: { day: 1, minute: 600 },
    player: { ...s.player, x: 24, y: 22, path: [], walkTime: 0 } })
  useGame.setState({ modal: null, trip: null, decorating: null, clockMs: 0, rng: () => .5 })
  vi.mocked(sfx).mockClear()
})

const steps = () => vi.mocked(sfx).mock.calls.filter(([name]) => name === 'step').length

it('이동 클릭만으로는 소리를 내지 않고 실제 걸을 때 여러 번, 도착 후에는 멈춘다', () => {
  useGame.getState().tap({ x: 27, y: 22 })
  expect(steps()).toBe(0)
  for (let i = 0; i < 70; i++) useGame.getState().frame(1 / 60)
  expect(steps()).toBeGreaterThan(1)
  const count = steps()
  for (let i = 0; i < 60; i++) useGame.getState().frame(1 / 60)
  expect(steps()).toBe(count)
})

it('방향 이동에도 연결되고 모달을 연 동안에는 발소리가 쌓이지 않는다', () => {
  useGame.getState().walk(1, 0)
  for (let i = 0; i < 12; i++) useGame.getState().frame(1 / 60)
  expect(steps()).toBeGreaterThan(0)
  useGame.setState({ modal: { kind: 'talk', neighborId: 'baker', line: '안녕하세요' } })
  const count = steps()
  for (let i = 0; i < 120; i++) useGame.getState().frame(1 / 60)
  expect(steps()).toBe(count)
})

it('벽으로 막혀 실제 위치가 변하지 않으면 소리가 나지 않는다', () => {
  const s = useGame.getState().game
  useGame.setState({ game: { ...s, player: { ...s.player, x: 0, y: 0, path: [], walkTime: 0 } } })
  useGame.getState().walk(-1, 0)
  for (let i = 0; i < 30; i++) useGame.getState().frame(1 / 60)
  expect(steps()).toBe(0)
})

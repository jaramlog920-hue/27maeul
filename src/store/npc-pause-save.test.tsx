import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { newGame, settle } from '../engine/game'
import { allSightings, peopleData } from '../engine/people'
import { deserialize, serialize } from '../engine/save'
import { HOME_ENTRY } from '../engine/world'
import { ModalLayer } from '../features/ModalLayer'
import { useGame } from './game-store'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  const base = newGame(CONTENT)
  const seen = [...Object.values(peopleData().people).flatMap(p => (p.events ?? []).map(e => e.id)), ...allSightings().map(w => w.id)]
  const game = settle({ ...base, scenes: [], clock: { day: 1, minute: 600 }, player: { ...base.player, ...HOME_ENTRY },
    flags: { ...base.flags, villageLevel: 3, ...Object.fromEntries(CONTENT.neighbors.map(n => [`movedIn:${n.id}`, 1])) },
    life: { ...base.life!, seen } }, CONTENT)
  useGame.getState().load(game)
  useGame.setState({ rng: () => .5, clockMs: 0, trip: null, modal: null, copyResult: null, piecePopups: [], capture: null })
})
afterEach(() => vi.restoreAllMocks())

function expectMoving() {
  const before = useGame.getState().game
  for (let i = 0; i < 40; i++) act(() => useGame.getState().frame(.5))
  const after = useGame.getState().game
  expect(after.clock.minute).toBeGreaterThan(before.clock.minute)
  expect(Object.entries(after.npcs).some(([id, n]) => n.visible && before.npcs[id] &&
    (n.x !== before.npcs[id].x || n.y !== before.npcs[id].y))).toBe(true)
}

it('대화창 동안 멈춘 주민과 시계는 실제 닫기 버튼 뒤 다시 움직인다', () => {
  act(() => useGame.setState({ modal: { kind: 'talk', neighborId: 'baker', line: '안녕하세요' } }))
  render(<ModalLayer />)
  const before = useGame.getState().game
  for (let i = 0; i < 8; i++) act(() => useGame.getState().frame(1))
  expect(useGame.getState().game.clock).toEqual(before.clock)
  expect(useGame.getState().game.npcs).toEqual(before.npcs)
  fireEvent.click(screen.getByRole('button', { name: T.ui.close }))
  expect(useGame.getState().modal).toBeNull()
  expectMoving()
})

it('여행 주사위 중 다른 저장을 불러오면 옛 여행이 주민을 계속 멈추거나 보상을 열지 않는다', () => {
  act(() => useGame.getState().startTripBoard('harbor', false))
  const restored = deserialize(serialize(useGame.getState().game), CONTENT)!
  act(() => useGame.getState().load(restored))
  expect(useGame.getState().trip).toBeNull()
  act(() => useGame.getState().finishTripBoard([]))
  expect(useGame.getState().modal).toBeNull()
  expect(useGame.getState().game).toBe(restored)
  expectMoving()
})

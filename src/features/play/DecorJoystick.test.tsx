// 가구 옮기기를 조이스틱으로 (2026-10-19 사용자): 옮기는 동안은 겹쳐도 자리를 고를 수 있고, 확인을 누를 때만 겹침·통로를 검사한다
import { CONTENT } from '../../content/catalog'
import { legacyGame } from '../../engine/growth-test-support'
import { type Furniture } from '../../engine/room'
import { HOME_RECT } from '../../engine/world'
import { DECOR_GHOST_STEP_MS, useGame } from '../../store/game-store'

const h = (x: number, y: number) => ({ x: x + HOME_RECT.x0 - 2, y: y + HOME_RECT.y0 - 2 })
function moving(room: Furniture[]) {
  const base = legacyGame(CONTENT)
  useGame.getState().load({ ...base, room, inv: {}, scenes: [] })
  useGame.setState({ toast: null, decorMoving: false, decorGhost: null, decorGhostAt: 0, clockMs: 10_000, piecePopups: [], copyResult: null })
  useGame.getState().startDecorate('pick')
  useGame.getState().tap(room[0])
  useGame.getState().moveSelected()
}
const later = () => useGame.setState({ clockMs: useGame.getState().clockMs + DECOR_GHOST_STEP_MS })

beforeEach(() => localStorage.clear())

it('조이스틱으로 한 칸씩 자리를 고르고 확인을 누르면 그 자리에 놓인다', () => {
  moving([{ item: 'stool', ...h(5, 5) }])
  useGame.getState().walk(1, 0)
  useGame.getState().walk(1, 0) // 너무 빠른 반복은 한 칸으로
  expect(useGame.getState().decorGhost).toEqual(h(6, 5))
  later()
  useGame.getState().walk(1, 0)
  expect(useGame.getState().decorGhost).toEqual(h(7, 5))
  useGame.getState().press()
  expect(useGame.getState().game.room.find((f) => f.item === 'stool')).toMatchObject(h(7, 5))
  expect(useGame.getState().decorMoving).toBe(false)
  expect(useGame.getState().decorGhost).toBeNull()
})

it('다른 가구 위로도 지나갈 수 있지만, 겹친 자리에서 확인을 누르면 놓지 않고 알린다', () => {
  moving([{ item: 'stool', ...h(5, 5) }, { item: 'stool', ...h(6, 5) }])
  useGame.getState().walk(1, 0)
  expect(useGame.getState().decorGhost).toEqual(h(6, 5))
  useGame.getState().press()
  expect(useGame.getState().game.room.filter((f) => f.item === 'stool').map((f) => f.x)).toEqual([h(5, 5).x, h(6, 5).x])
  expect(useGame.getState().decorMoving).toBe(true)
  expect(useGame.getState().toast?.text).toContain('겹치')
  later()
  useGame.getState().walk(1, 0)
  useGame.getState().press()
  expect(useGame.getState().game.room.some((f) => f.item === 'stool' && f.x === h(7, 5).x)).toBe(true)
})

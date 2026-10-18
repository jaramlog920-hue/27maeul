import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { legacyGame } from '../engine/growth-test-support'
import { rotateFurniture, syncHome } from '../engine/game'
import { footprint, placement, type Furniture } from '../engine/room'
import { deserialize, saveGame, serialize, setActiveSlot, slotKey } from '../engine/save'
import { HOME_RECT } from '../engine/world'
import { T } from '../content/text'
import { DecorateBar } from '../features/play/DecorateBar'
import { useGame } from '../store/game-store'

const h = (x: number, y: number) => ({ x: x + HOME_RECT.x0 - 2, y: y + HOME_RECT.y0 - 2 })
function fixture(explicitFacing = true) {
  const base = legacyGame(CONTENT)
  syncHome(base)
  const at = h(7, 6)
  const table = placement(base.room, 'table', at, explicitFacing ? 'down' : undefined)!
  expect(table).not.toBeNull()
  const game = { ...base, scenes: [], room: [...base.room, table], inv: { table: 1, vase: 3 }, player: { ...base.player, x: at.x - 1, y: at.y, path: [] } }
  useGame.getState().load(game)
  useGame.setState({ toast: null, decorMoving: false, decorLook: null, piecePopups: [], copyResult: null })
  useGame.getState().startDecorate('table')
  useGame.getState().setDecorFacing('left')
  // 두 번째 차지 칸을 누르더라도 선택은 왼쪽 위의 가구를 가리켜야 한다.
  useGame.getState().tap({ x: at.x + 1, y: at.y })
  expect(useGame.getState().decorSel).toMatchObject({ item: 'table', ...at })
  return { game, table, at }
}

beforeEach(() => {
  localStorage.clear()
  setActiveSlot('1')
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => vi.restoreAllMocks())

describe('003 벽 끝 2칸 가구 회전 실패 상태', () => {
  it('실패한 UI 회전은 배치·가방·선택·설치 대기 방향·저장 값을 보존하고 안내한다', () => {
    const { game } = fixture()
    saveGame(game)
    const stored = localStorage.getItem(slotKey('1'))
    const before = useGame.getState()
    render(<DecorateBar />)
    fireEvent.click(screen.getByRole('button', { name: /^돌리기$/ }))
    const after = useGame.getState()
    expect(after.game).toBe(game)
    expect(after.game.room).toBe(game.room)
    expect(after.game.inv).toBe(game.inv)
    expect(after.decorSel).toBe(before.decorSel)
    expect(after.decorating).toBe('table')
    expect(after.decorFacing).toBe('left')
    expect(after.toast?.text).toBe(T.ui.decorateTurnBlocked)
    expect(localStorage.getItem(slotKey('1'))).toBe(stored)
  })

  it('반복 거절 뒤 취소해도 배치와 수량은 그대로다', () => {
    const { game, table } = fixture()
    for (let i = 0; i < 5; i++) useGame.getState().turnSelected()
    expect(useGame.getState().game).toBe(game)
    expect(useGame.getState().game.room.find(f => f === table)).toBe(table)
    useGame.getState().stopDecorate()
    expect(useGame.getState()).toMatchObject({ decorating: null, decorSel: null, decorMoving: false, decorLook: null })
    expect(useGame.getState().game).toBe(game)
  })

  it.each([true, false])('명시 방향 여부 %s: 저장 복원 후 다시 선택해도 거절과 배치가 동일하다', explicit => {
    const { game, table, at } = fixture(explicit)
    useGame.getState().turnSelected()
    const restored = deserialize(serialize(useGame.getState().game), CONTENT)!
    expect(restored).not.toBeNull()
    const back = restored.room.find(f => f.item === 'table')!
    expect(back).toEqual(table)
    expect(restored.inv).toEqual(game.inv)
    act(() => useGame.getState().load(restored))
    expect(useGame.getState().decorSel).toBeNull()
    useGame.getState().startDecorate('pick')
    useGame.getState().tap(at)
    useGame.getState().turnSelected()
    expect(useGame.getState().game).toBe(restored)
    expect(useGame.getState().toast?.text).toBe(T.ui.decorateTurnBlocked)
    expect(useGame.getState().decorSel).toMatchObject({ item: 'table', ...at })
  })

  it('경계 확인: 다음 90도는 벽과 겹쳐 거절되고, 180도 후보는 같은 자리에서 놓을 수 있다', () => {
    const { game, table, at } = fixture()
    const without = game.room.filter(f => f !== table)
    expect(placement(without, 'table', at, 'right')).toBeNull()
    const reverse = placement(without, 'table', at, 'up')
    expect(reverse).not.toBeNull()
    expect(footprint(reverse as Furniture)).toEqual(footprint(table))
    expect(rotateFurniture(game, table)).toBeNull()
    useGame.getState().turnSelected()
    useGame.getState().turnSelected()
    expect(useGame.getState().game.room.find(f => f.item === 'table')?.facing).toBe('down')
  })
})

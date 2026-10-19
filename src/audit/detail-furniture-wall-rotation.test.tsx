import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { legacyGame } from '../engine/growth-test-support'
import { rotateFurniture, syncHome } from '../engine/game'
import { footprint, placement, type Furniture } from '../engine/room'
import { deserialize, serialize, setActiveSlot } from '../engine/save'
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

// 2026-10-19 감사 L-68(D004)을 고친 뒤: 다음 90도가 벽에 막히면 같은 자리를 차지하는 180도로 바로 돈다
describe('003 벽 끝 2칸 가구 회전', () => {
  it('UI 돌리기는 막힌 90도를 건너뛰어 180도로 돌리고, 가방·선택·설치 대기 방향은 그대로다', () => {
    const { game, table, at } = fixture()
    const before = useGame.getState()
    render(<DecorateBar />)
    fireEvent.click(screen.getByRole('button', { name: /^돌리기$/ }))
    const after = useGame.getState()
    const turned = after.game.room.find(f => f.item === 'table' && f.x === at.x && f.y === at.y)!
    expect(turned.facing).toBe('up')
    expect(footprint(turned)).toEqual(footprint(table))
    expect(after.game.inv).toEqual(game.inv)
    expect(after.decorSel).toEqual(before.decorSel)
    expect(after.decorating).toBe('table')
    expect(after.decorFacing).toBe('left')
    expect(after.toast?.text).not.toBe(T.ui.decorateTurnBlocked)
  })

  it('한 번 더 돌리면 막힌 방향을 다시 건너뛰어 처음 방향으로 돌아온다', () => {
    const { game, at } = fixture()
    useGame.getState().turnSelected()
    useGame.getState().turnSelected()
    const room = useGame.getState().game.room
    expect(room.filter(f => f.item === 'table')).toHaveLength(game.room.filter(f => f.item === 'table').length)
    expect(room.find(f => f.item === 'table' && f.x === at.x && f.y === at.y)?.facing ?? 'down').toBe('down')
    useGame.getState().stopDecorate()
    expect(useGame.getState()).toMatchObject({ decorating: null, decorSel: null, decorMoving: false, decorLook: null })
  })

  it.each([true, false])('명시 방향 여부 %s: 돌린 방향은 저장 복원 뒤에도 그대로다', explicit => {
    const { game, at } = fixture(explicit)
    useGame.getState().turnSelected()
    const restored = deserialize(serialize(useGame.getState().game), CONTENT)!
    expect(restored).not.toBeNull()
    expect(restored.room.find(f => f.item === 'table' && f.x === at.x && f.y === at.y)?.facing).toBe('up')
    expect(restored.inv).toEqual(game.inv)
  })

  it('경계: 다음 90도는 벽과 겹쳐 못 놓고, 엔진은 180도 모습을 돌려준다', () => {
    const { game, table, at } = fixture()
    const without = game.room.filter(f => f !== table)
    expect(placement(without, 'table', at, 'right')).toBeNull()
    const reverse = placement(without, 'table', at, 'up') as Furniture
    expect(footprint(reverse)).toEqual(footprint(table))
    expect(rotateFurniture(game, table)!.room.find(f => f.item === 'table' && f.x === at.x && f.y === at.y)?.facing).toBe('up')
  })
})

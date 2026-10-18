import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { legacyGame } from '../engine/growth-test-support'
import { rotateFurniture, syncHome } from '../engine/game'
import { placement } from '../engine/room'
import { deserialize, saveGame, serialize, setActiveSlot, slotKey } from '../engine/save'
import { T } from '../content/text'
import { DecorateBar } from '../features/play/DecorateBar'
import { useGame } from '../store/game-store'

const tableAt = { x: 20, y: 112 }
const tableFreeEnd = { x: 21, y: 112 }
const floorAt = { x: 22, y: 113 }
function fixture(vases = 0) {
  const base = legacyGame(CONTENT)
  syncHome(base)
  const table = placement(base.room, 'table', tableAt, 'down')!
  expect(table).not.toBeNull()
  const vase = placement([...base.room, table], 'vase', tableAt)!
  expect(vase).toMatchObject({ on: true })
  const game = { ...base, scenes: [], room: [...base.room, table, vase], inv: { table: 1, ...(vases ? { vase: vases } : {}) }, player: { ...base.player, x: 20, y: 114, path: [] } }
  expect(rotateFurniture({ ...game, room: game.room.filter(f => f !== vase) }, table)).not.toBeNull()
  useGame.getState().load(game)
  useGame.setState({ toast: null, decorMoving: false, decorLook: null, piecePopups: [], copyResult: null })
  useGame.getState().startDecorate('pick')
  return { game, table, vase }
}
const selectTable = () => useGame.getState().tap(tableFreeEnd)
const selectVase = () => useGame.getState().tap(tableAt)

beforeEach(() => { localStorage.clear(); setActiveSlot('1'); vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null) })
afterEach(() => vi.restoreAllMocks())

describe('004 탁자 위 물건이 있는 회전 거절과 복구', () => {
  it('회전 거절은 물건·탁자·가방·선택·저장까지 보존하며 안내한다', () => {
    const { game, vase } = fixture()
    saveGame(game)
    const stored = localStorage.getItem(slotKey('1'))
    selectTable()
    const selected = useGame.getState().decorSel
    render(<DecorateBar />)
    fireEvent.click(screen.getByRole('button', { name: /^돌리기$/ }))
    expect(useGame.getState().game).toBe(game)
    expect(useGame.getState().game.room.at(-1)).toBe(vase)
    expect(useGame.getState().decorSel).toBe(selected)
    expect(useGame.getState().toast?.text).toBe(T.ui.decorateTurnBlocked)
    expect(localStorage.getItem(slotKey('1'))).toBe(stored)
  })

  it('물건을 바닥으로 옮기면 on 표식이 지워지고 수량 변화 없이 탁자가 회전한다', () => {
    fixture()
    selectTable()
    useGame.getState().turnSelected()
    selectVase()
    useGame.getState().moveSelected()
    useGame.getState().tap(floorAt)
    const moved = useGame.getState().game
    expect(moved.room.find(f => f.item === 'vase')).toMatchObject(floorAt)
    expect(moved.room.find(f => f.item === 'vase')?.on).toBeUndefined()
    expect(moved.inv.vase ?? 0).toBe(0)
    expect(useGame.getState().decorSel).toMatchObject({ item: 'vase', ...floorAt })
    selectTable()
    useGame.getState().turnSelected()
    expect(useGame.getState().game.room.find(f => f.item === 'table')?.facing).toBe('right')
    expect(useGame.getState().game.room.find(f => f.item === 'vase')).toEqual(moved.room.find(f => f.item === 'vase'))
  })

  it('물건만 회수하면 가방에 한 개 들어가고 재선택한 탁자가 회전한다', () => {
    fixture()
    selectTable()
    useGame.getState().turnSelected()
    selectVase()
    useGame.getState().removeSelected()
    expect(useGame.getState().game.room.some(f => f.item === 'vase')).toBe(false)
    expect(useGame.getState().game.inv.vase).toBe(1)
    expect(useGame.getState().game.room.some(f => f.item === 'table')).toBe(true)
    selectTable()
    useGame.getState().turnSelected()
    expect(useGame.getState().game.room.find(f => f.item === 'table')?.facing).toBe('right')
    expect(useGame.getState().game.inv.vase).toBe(1)
  })

  it('물건 이동 실패와 취소 뒤에도 on·선택·수량이 보존되고 탁자는 계속 거절된다', () => {
    const { game, vase } = fixture()
    selectVase()
    useGame.getState().moveSelected()
    useGame.getState().tap({ x: 0, y: 0 })
    expect(useGame.getState().game).toBe(game)
    expect(useGame.getState().decorSel).toMatchObject(vase)
    expect(useGame.getState().decorMoving).toBe(true)
    useGame.getState().moveSelected()
    selectTable()
    useGame.getState().turnSelected()
    expect(useGame.getState().game).toBe(game)
    expect(useGame.getState().toast?.text).toBe(T.ui.decorateTurnBlocked)
  })

  it('가방의 물건이 99개라 회수하지 못하면 물건과 탁자를 그대로 둔다', () => {
    const { game } = fixture(99)
    selectVase()
    useGame.getState().removeSelected()
    expect(useGame.getState().game).toBe(game)
    expect(useGame.getState().toast?.text).toBe(T.ui.bagFull)
    selectTable()
    useGame.getState().turnSelected()
    expect(useGame.getState().game).toBe(game)
    expect(useGame.getState().game.inv.vase).toBe(99)
  })

  it('이동 전후를 저장 복원해도 on 상태와 회전 가능 조건이 같고 물건은 한 개다', () => {
    const { game } = fixture()
    const before = deserialize(serialize(game), CONTENT)!
    expect(before.room.filter(f => f.item === 'vase')).toHaveLength(1)
    expect(before.room.find(f => f.item === 'vase')?.on).toBe(true)
    useGame.getState().load(before)
    useGame.getState().startDecorate('pick')
    selectTable()
    useGame.getState().turnSelected()
    expect(useGame.getState().game).toBe(before)
    selectVase()
    useGame.getState().moveSelected()
    useGame.getState().tap(floorAt)
    const after = deserialize(serialize(useGame.getState().game), CONTENT)!
    expect(after.room.filter(f => f.item === 'vase')).toHaveLength(1)
    expect(after.room.find(f => f.item === 'vase')?.on).toBeUndefined()
    useGame.getState().load(after)
    useGame.getState().startDecorate('pick')
    selectTable()
    useGame.getState().turnSelected()
    expect(useGame.getState().game.room.find(f => f.item === 'table')?.facing).toBe('right')
    expect(useGame.getState().game.inv.vase ?? 0).toBe(0)
  })
})

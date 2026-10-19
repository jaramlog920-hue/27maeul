import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { legacyGame } from '../engine/growth-test-support'
import { serialize, deserialize } from '../engine/save'
import { HOME_RECT } from '../engine/world'
import { type Furniture } from '../engine/room'
import { useGame } from '../store/game-store'
import { DecorateBar } from '../features/play/DecorateBar'
import { T } from '../content/text'

const h = (x: number, y: number) => ({ x: x + HOME_RECT.x0 - 2, y: y + HOME_RECT.y0 - 2 })
function fixture(room: Furniture[] = [], inv = { stool: 1, rug: 1, vase: 1 }) {
  const base = legacyGame(CONTENT)
  const game = { ...base, room, inv, scenes: [] }
  useGame.getState().load(game)
  useGame.setState({ toast: null, decorMoving: false, decorLook: null, piecePopups: [], copyResult: null })
  return game
}

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => vi.restoreAllMocks())

describe('001 가구 설치 실패·취소 세부 검사 (게임 동작 수정 없음)', () => {
  it('마지막 한 개 설치는 한 개만 소비하고 선택 모드로 바뀌며 저장에도 같은 배치가 남는다', () => {
    fixture()
    const store = useGame.getState()
    store.startDecorate('stool')
    store.tap(h(5, 5))
    const next = useGame.getState()
    expect(next.game.inv.stool ?? 0).toBe(0)
    expect(next.decorating).toBe('pick')
    expect(next.decorSel).toMatchObject({ item: 'stool', ...h(5, 5) })
    const restored = deserialize(serialize(next.game), CONTENT)!
    expect(restored.room).toEqual(next.game.room)
    expect(restored.inv).toEqual(next.game.inv)
  })

  it('빈 잘못된 자리에 놓지 못해도 원래 가구와 가방은 변하지 않는다', () => {
    const before = fixture()
    useGame.getState().startDecorate('stool')
    useGame.getState().tap({ x: 0, y: 0 })
    expect(useGame.getState().game).toBe(before)
    expect(useGame.getState().decorating).toBe('stool')
    expect(localStorage.getItem('twenty-seven/save')).toBeNull()
  })

  // 2026-10-19 감사 L-63(D001)을 고친 뒤: 놓을 수 없는 빈 자리에는 이유를 알린다
  it('D001 수정: 빈 잘못된 자리를 누르면 놓을 수 없는 이유를 알린다', () => {
    fixture()
    useGame.getState().startDecorate('stool')
    useGame.getState().tap({ x: 0, y: 0 })
    expect(useGame.getState().toast?.text).toBe(T.ui.decorateCannotPlace)
    expect(useGame.getState().decorSel).toBeNull()
  })

  // 2026-10-19 감사 L-67(D002)을 고친 뒤: 가구를 든 채 두 번 눌러도 있던 가구를 치우지 않는다
  it('D002 수정: 가구를 든 채 기존 가구를 두 번 눌러도 기존 가구는 그대로이고 안내만 한다', () => {
    const placed: Furniture = { item: 'stool', ...h(5, 5) }
    fixture([placed])
    useGame.getState().startDecorate('stool')
    useGame.getState().tap(h(5, 5))
    expect(useGame.getState().game.room).toEqual([placed])
    useGame.getState().tap(h(5, 5))
    expect(useGame.getState().game.room).toEqual([placed])
    expect(useGame.getState().game.inv.stool).toBe(1)
    expect(useGame.getState().decorating).toBe('stool')
    expect(useGame.getState().decorSel).toMatchObject({ item: 'stool', ...h(5, 5) })
    expect(useGame.getState().toast?.text).toBe(T.ui.decorateOccupied)
  })

  it('고르기 모드에서는 고른 가구를 한 번 더 누르면 지금처럼 치운다', () => {
    const placed: Furniture = { item: 'stool', ...h(5, 5) }
    fixture([placed])
    useGame.getState().startDecorate('pick')
    useGame.getState().tap(h(5, 5))
    useGame.getState().tap(h(5, 5))
    expect(useGame.getState().game.room).toEqual([])
    expect(useGame.getState().game.inv.stool).toBe(2)
  })

  it('옮기기 취소는 배치·가방을 바꾸지 않고, 완료는 선택·이동·시점 상태를 비운다', () => {
    const placed: Furniture = { item: 'stool', ...h(5, 5) }
    const before = fixture([placed])
    useGame.getState().startDecorate('pick')
    useGame.getState().tap(h(5, 5))
    useGame.getState().moveSelected()
    expect(useGame.getState().decorMoving).toBe(true)
    render(<DecorateBar />)
    fireEvent.click(screen.getByRole('button', { name: '옮기기 취소' }))
    expect(useGame.getState().decorMoving).toBe(false)
    expect(useGame.getState().game).toBe(before)
    fireEvent.click(screen.getByRole('button', { name: T.ui.decorateDone }))
    expect(useGame.getState()).toMatchObject({ decorating: null, decorMoving: false, decorSel: null, decorLook: null })
    expect(useGame.getState().game).toBe(before)
  })

  it('실패한 이동 뒤에도 취소하면 가구·가방은 원래 상태다', () => {
    const placed: Furniture = { item: 'stool', ...h(5, 5) }
    const before = fixture([placed])
    useGame.getState().startDecorate('pick')
    useGame.getState().tap(h(5, 5))
    useGame.getState().moveSelected()
    useGame.getState().tap({ x: 0, y: 0 })
    expect(useGame.getState().toast?.text).toContain('겹치거나 통로가 막혀요')
    expect(useGame.getState().game).toBe(before)
    act(() => useGame.getState().stopDecorate())
    expect(useGame.getState().game).toBe(before)
    expect(useGame.getState().decorMoving).toBe(false)
  })

  it('가방의 같은 가구가 99개면 회수를 거절하고 배치·수량을 보존하며 이유를 알린다', () => {
    const placed: Furniture = { item: 'stool', ...h(5, 5) }
    const before = fixture([placed], { stool: 99, rug: 1, vase: 1 })
    useGame.getState().startDecorate('pick')
    useGame.getState().tap(h(5, 5))
    useGame.getState().removeSelected()
    expect(useGame.getState().game).toBe(before)
    expect(useGame.getState().game.inv.stool).toBe(99)
    expect(useGame.getState().toast?.text).toBe(T.ui.bagFull)
    useGame.getState().stopDecorate()
    expect(useGame.getState().game.room).toEqual([placed])
  })

  it('탁자 위가 차서 작은 물건을 못 놓으면 처음 누를 때는 가방·배치를 보존한다', () => {
    const table: Furniture = { item: 'table', ...h(5, 5) }
    const candle: Furniture = { item: 'candle', ...h(5, 5), on: true }
    const before = fixture([table, candle])
    useGame.getState().startDecorate('vase')
    useGame.getState().tap(h(5, 5))
    expect(useGame.getState().game).toBe(before)
    expect(useGame.getState().game.inv.vase).toBe(1)
    expect(useGame.getState().decorSel).toMatchObject(candle)
    expect(useGame.getState().toast).toBeNull()
  })
})

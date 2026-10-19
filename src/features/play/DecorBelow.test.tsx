// 물건을 올린 한 칸 협탁 (2026-10-19 감사 L-69): 위 물건을 고른 뒤 '받침째 고르기'로 협탁을 골라 통째 옮기거나 치울 수 있다
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { legacyGame } from '../../engine/growth-test-support'
import { placement, type Furniture } from '../../engine/room'
import { HOME_RECT } from '../../engine/world'
import { useGame } from '../../store/game-store'
import { DecorateBar } from './DecorateBar'

const h = (x: number, y: number) => ({ x: x + HOME_RECT.x0 - 2, y: y + HOME_RECT.y0 - 2 })

function fixture() {
  const base = legacyGame(CONTENT)
  const stand = placement([], 'nightstand', h(5, 5))!
  expect(stand).not.toBeNull()
  const vase = placement([stand], 'vase', h(5, 5))!
  expect(vase.on).toBe(true)
  const game = { ...base, room: [stand, vase] as Furniture[], inv: {}, scenes: [] }
  useGame.getState().load(game)
  useGame.setState({ toast: null, decorMoving: false, decorLook: null, piecePopups: [], copyResult: null })
  useGame.getState().startDecorate('pick')
  useGame.getState().tap(h(5, 5))
  expect(useGame.getState().decorSel).toMatchObject({ item: 'vase', on: true })
  return game
}

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('받침째 고르기', () => {
  it('위 물건을 고르면 단추가 보이고, 누르면 협탁이 골라진다', () => {
    fixture()
    render(<DecorateBar />)
    fireEvent.click(screen.getByRole('button', { name: T.ui.decorateBelow }))
    expect(useGame.getState().decorSel).toMatchObject({ item: 'nightstand', ...h(5, 5) })
    expect(useGame.getState().decorSel?.on).toBeFalsy()
  })

  it('협탁을 골라 옮기면 위 꽃병도 함께 옮겨진다', () => {
    fixture()
    useGame.getState().selectBelow()
    useGame.getState().moveSelected()
    useGame.getState().tap(h(5, 6))
    const room = useGame.getState().game.room
    expect(room.find((f) => f.item === 'nightstand')).toMatchObject(h(5, 6))
    expect(room.find((f) => f.item === 'vase')).toMatchObject({ ...h(5, 6), on: true })
  })

  it('협탁을 골라 치우면 위 꽃병도 함께 가방으로 들어간다', () => {
    fixture()
    useGame.getState().selectBelow()
    useGame.getState().removeSelected()
    const s = useGame.getState().game
    expect(s.room.filter((f) => f.item === 'nightstand' || f.item === 'vase')).toEqual([])
    expect(s.inv).toMatchObject({ nightstand: 1, vase: 1 })
  })
})

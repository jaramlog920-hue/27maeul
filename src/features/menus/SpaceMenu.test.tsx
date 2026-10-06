import { act, fireEvent, render } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { newGame, syncHome } from '../../engine/game'
import { placement, type Furniture } from '../../engine/room'
import { setSpace } from '../../engine/space-life'
import { DecorateBar } from '../play/DecorateBar'
import { selectedPiece, useGame } from '../../store/game-store'
import { SpaceMenu } from './SpaceMenu'

function tea() {
  const s = { ...newGame(CONTENT), scenes: [] }
  syncHome(s)
  let room: Furniture[] = [...s.room]
  for (const [item, x, y, f] of [['table', 19, 112], ['chair', 19, 113, 'up']] as const) {
    room = [...room, placement(room, item, { x, y }, f as 'up' | undefined)!]
    syncHome({ ...s, room })
  }
  return { ...s, room, player: { ...s.player, x: 20, y: 114, path: [] } }
}

describe('집 안 자리: 쓰임 정하기와 쓰기 창', () => {
  it('방 꾸미기에서 가구를 고르면 되는 쓰임만 보이고, 고르면 자리가 정해진다', () => {
    const g = tea()
    const table = g.room.find((f) => f.item === 'table')!
    useGame.setState({ game: g, decorating: 'pick', decorSel: { item: table.item, x: table.x, y: table.y, on: table.on }, decorMoving: false, modal: null })
    const { container, getByText } = render(<DecorateBar />)
    expect(container.textContent).not.toContain(T.space.use.tea)
    act(() => fireEvent.click(getByText(T.space.decideButton)))
    expect(getByText(T.space.use.tea)).toBeTruthy()
    expect(container.textContent).not.toContain(T.space.use.pet)
    act(() => fireEvent.click(getByText(T.space.use.tea)))
    expect(useGame.getState().game.spaces).toHaveLength(1)
    expect(selectedPiece(useGame.getState().game.room, useGame.getState().decorSel)).toBeTruthy()
  })
  it('쓸 수 있는 자리에서 앉아 차를 마시면 창이 닫히고 동작이 시작된다', () => {
    const g = setSpace(tea(), tea().room.find((f) => f.item === 'table')!, 'tea')!
    const id = g.spaces[0].id
    useGame.setState({ game: g, decorating: null, modal: { kind: 'space', id } })
    const { getByText } = render(<SpaceMenu id={id} />)
    act(() => fireEvent.click(getByText(T.space.doIt.tea)))
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().game.act).toMatchObject({ kind: 'drink' })
  })
  it('쉬고 있는 자리는 아무것도 보이지 않는다', () => {
    const g = setSpace(tea(), tea().room.find((f) => f.item === 'table')!, 'tea')!
    const id = g.spaces[0].id
    const bare = { ...g, room: g.room.filter((f) => f.item !== 'chair') }
    useGame.setState({ game: bare, modal: { kind: 'space', id } })
    const { container } = render(<SpaceMenu id={id} />)
    expect(container.textContent).toBe('')
  })
})

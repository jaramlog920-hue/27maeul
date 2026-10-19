// 수납 가구를 누르면 가방이 아니라 보관함 창 (2026-10-19 사용자): 이름이 제목, 넣기·꺼내기, 집 밖에서는 막힘, 도구는 넣지 않음
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { newGame, putInChest, type GameState } from '../../engine/game'
import { HOME_ENTRY, HOME_FRONT } from '../../engine/world'
import { useGame } from '../../store/game-store'
import { StorageView } from './StorageView'

afterEach(cleanup)
beforeEach(() => localStorage.clear())

function home(): GameState {
  const s = newGame(CONTENT)
  return { ...s, scenes: [], flags: { ...s.flags, 'unlock:supplyChest': 1 }, inv: { fig: 3, goodPen: 1 }, chest: { reed: 2 }, player: { ...s.player, ...HOME_ENTRY, path: [] } }
}

describe('보관함 창', () => {
  it('가구 이름이 제목이고, 가방 물건을 넣고 보관함 물건을 꺼낸다', () => {
    useGame.getState().load(home())
    render(<StorageView item="supplyChest" />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('재료 궤짝')
    fireEvent.click(screen.getByRole('button', { name: /무화과 3/ }))
    fireEvent.click(screen.getByRole('button', { name: T.easy.storagePutAll }))
    expect(useGame.getState().game.chest).toMatchObject({ reed: 2, fig: 3 })
    expect(useGame.getState().game.inv.fig ?? 0).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: /갈대 2/ }))
    fireEvent.click(screen.getByRole('button', { name: T.easy.storageTake }))
    expect(useGame.getState().game.inv.reed).toBe(2)
  })

  it('집 밖에서는 넣지 못하고, 도구는 보관함에 넣지 않는다', () => {
    const s = home()
    expect(putInChest({ ...s, player: { ...s.player, ...HOME_FRONT } }, 'fig')).toBeNull()
    expect(putInChest(s, 'goodPen')).toBeNull()
    expect(putInChest(s, 'fig', 2)!.chest).toMatchObject({ fig: 2 })
  })

  it('수납 가구를 누르면 보관함 창이 열린다', () => {
    const s = home()
    useGame.getState().load({ ...s, room: [...s.room, { item: 'linenCupboard', x: HOME_ENTRY.x + 1, y: HOME_ENTRY.y - 2 }] })
    useGame.getState().tap({ x: HOME_ENTRY.x + 1, y: HOME_ENTRY.y - 2 })
    useGame.getState().frame(0.05)
    const m = useGame.getState().modal
    if (m) expect(m).toEqual({ kind: 'storage', item: 'linenCupboard' })
  })
})

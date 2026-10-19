import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { newGame } from '../engine/game'
import { deserialize, serialize, setActiveSlot } from '../engine/save'
import { HOME_ENTRY } from '../engine/world'
import { StorageView } from '../features/bag/StorageView'
import { useGame } from '../store/game-store'

function ready(box = 29, bag = 2) {
  const base = newGame(CONTENT)
  const game = { ...base, scenes: [], inv: { reed: bag }, chest: { reed: box },
    room: [...base.room, { item: 'linenCupboard' as const, x: HOME_ENTRY.x + 1, y: HOME_ENTRY.y - 1 }],
    player: { ...base.player, ...HOME_ENTRY, path: [] } }
  useGame.getState().load(game)
  useGame.setState({ modal: { kind: 'storage', item: 'linenCupboard' }, toast: null })
  return game
}
const pick = (n = 2) => fireEvent.click(screen.getByRole('button', { name: new RegExp('갈대.* ' + n + '$') }))
const put = () => fireEvent.click(screen.getByRole('button', { name: T.easy.storagePut }))
const putAll = () => fireEvent.click(screen.getByRole('button', { name: T.easy.storagePutAll }))
function conserved(total: number, bag: number, box: number) {
  const g = useGame.getState().game
  expect(g.inv.reed ?? 0).toBe(bag)
  expect(g.chest.reed ?? 0).toBe(box)
  expect((g.inv.reed ?? 0) + (g.chest.reed ?? 0)).toBe(total)
  const restored = deserialize(serialize(g), CONTENT)!
  expect(restored.inv).toEqual(g.inv)
  expect(restored.chest).toEqual(g.chest)
  return restored
}
beforeEach(() => { localStorage.clear(); setActiveSlot('1') })
afterEach(cleanup)

describe('R2-002 partial put-all into installed storage (isolated jsdom)', () => {
  it('29 + two put-all transfers only one, updates detail and removes put-all', () => {
    ready(); render(<StorageView item="linenCupboard" />)
    pick(); putAll()
    conserved(31, 1, 30)
    expect(document.querySelector('.bag-detail strong')).toHaveTextContent('갈대 1')
    expect(screen.queryByRole('button', { name: T.easy.storagePutAll })).not.toBeInTheDocument()
    const full = useGame.getState().game
    put()
    expect(useGame.getState().game).toBe(full)
    expect(useGame.getState().toast?.text).toBe(T.easy.storageFull)
    conserved(31, 1, 30)
  })

  it('exactly two free spaces exhaust bag and remove stale actions', () => {
    ready(28); render(<StorageView item="linenCupboard" />)
    pick(); const all = screen.getByRole('button', { name: T.easy.storagePutAll })
    putAll(); fireEvent.click(all)
    conserved(30, 0, 30)
    expect(screen.getByText(T.easy.storageBagEmpty)).toBeVisible()
    expect(screen.queryByRole('button', { name: T.easy.storagePut })).not.toBeInTheDocument()
  })

  it('full storage retains put-all and refuses without consuming anything', () => {
    const before = ready(30); render(<StorageView item="linenCupboard" />)
    pick(); putAll()
    expect(useGame.getState().game).toBe(before)
    expect(useGame.getState().toast?.text).toBe(T.easy.storageFull)
    expect(screen.getByRole('button', { name: T.easy.storagePutAll })).toBeEnabled()
    conserved(32, 2, 30)
  })

  it('cancel after selection and reopen preserves both inventories', () => {
    ready(); const view = render(<StorageView item="linenCupboard" />)
    pick(); fireEvent.click(screen.getByRole('button', { name: T.ui.close }))
    expect(useGame.getState().modal).toBeNull()
    const restored = conserved(31, 2, 29)
    view.unmount()
    act(() => useGame.getState().load(restored))
    render(<StorageView item="linenCupboard" />)
    expect(screen.queryByRole('button', { name: T.easy.storagePutAll })).not.toBeInTheDocument()
    pick(); putAll(); conserved(31, 1, 30)
  })

  it('open detail follows a changed bag quantity rather than transferring stale two', () => {
    ready(); render(<StorageView item="linenCupboard" />)
    pick()
    const g = useGame.getState().game
    act(() => useGame.setState({ game: { ...g, inv: { reed: 1 } } }))
    expect(screen.queryByRole('button', { name: T.easy.storagePutAll })).not.toBeInTheDocument()
    put(); conserved(30, 0, 30)
  })

  it('freeing room while detail stays open allows the last item on retry', () => {
    ready(); render(<StorageView item="linenCupboard" />)
    pick(); putAll(); put()
    const g = useGame.getState().game
    act(() => useGame.setState({ game: { ...g, chest: { reed: 29 } }, toast: null }))
    put(); conserved(30, 0, 30)
    expect(screen.queryByRole('button', { name: T.easy.storagePut })).not.toBeInTheDocument()
  })
})

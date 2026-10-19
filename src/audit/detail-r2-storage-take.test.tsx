import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { ITEM_TEXT, itemName, T } from '../content/text'
import { newGame, type GameState } from '../engine/game'
import { BAG_SLOTS, MAX_STACK, type Inventory } from '../engine/items'
import { deserialize, serialize, setActiveSlot } from '../engine/save'
import type { ItemId } from '../engine/types'
import { HOME_ENTRY } from '../engine/world'
import { StorageView } from '../features/bag/StorageView'
import { useGame } from '../store/game-store'

function fullBag(reed?: number): Inventory {
  const keys = (Object.keys(ITEM_TEXT) as ItemId[]).filter(id => id !== 'reed')
  return { ...Object.fromEntries(keys.slice(0, BAG_SLOTS - (reed ? 1 : 0)).map(id => [id, 1])), ...(reed ? { reed } : {}) }
}
function ready(inv: Inventory, n = 1) {
  const base = newGame(CONTENT)
  const game: GameState = { ...base, scenes: [], inv, chest: { reed: n },
    flags: { ...base.flags, 'unlock:supplyChest': 1 },
    player: { ...base.player, ...HOME_ENTRY, path: [] } }
  useGame.getState().load(game)
  useGame.setState({ modal: { kind: 'storage', item: 'supplyChest' }, toast: null })
  return game
}
function pick() {
  // The first matching reed button is the chest row.
  fireEvent.click(screen.getAllByRole('button', { name: new RegExp(itemName('reed') + '.*') })[0])
}
function take() { fireEvent.click(screen.getByRole('button', { name: T.easy.storageTake })) }
function roundtrip() {
  const state = useGame.getState().game
  const restored = deserialize(serialize(state), CONTENT)!
  expect(restored.inv).toEqual(state.inv)
  expect(restored.chest).toEqual(state.chest)
  return restored
}
beforeEach(() => { localStorage.clear(); setActiveSlot('1') })
afterEach(cleanup)

describe('R2-001 storage last-unit boundaries (isolated jsdom)', () => {
  it('50 kinds deny a new kind with feedback; closing and reloading preserve the last unit', () => {
    const before = ready(fullBag())
    const view = render(<StorageView item="supplyChest" />)
    pick(); take()
    expect(useGame.getState().game).toBe(before)
    expect(useGame.getState().toast?.text).toBe(T.easy.chestFull)
    expect(screen.getByRole('button', { name: T.easy.storageTake })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: T.ui.close }))
    expect(useGame.getState().modal).toBeNull()
    view.unmount()
    act(() => useGame.getState().load(roundtrip()))
    render(<StorageView item="supplyChest" />)
    pick()
    expect(document.querySelector('.bag-detail strong')).toHaveTextContent('갈대 1')
  })

  it('a free slot permits the last unit; depleted detail clears and stays gone on reopen', () => {
    const before = ready(fullBag())
    const view = render(<StorageView item="supplyChest" />)
    pick(); take()
    const inv = { ...before.inv }; delete inv[Object.keys(inv)[0] as ItemId]
    act(() => useGame.setState({ game: { ...before, inv }, toast: null }))
    take()
    expect(useGame.getState().game.inv.reed).toBe(1)
    expect(useGame.getState().game.chest.reed).toBeUndefined()
    expect(screen.queryByRole('button', { name: T.easy.storageTake })).not.toBeInTheDocument()
    expect(screen.getByText(T.easy.storageEmpty)).toBeVisible()
    view.unmount()
    act(() => useGame.getState().load(roundtrip()))
    render(<StorageView item="supplyChest" />)
    expect(screen.getByText(T.easy.storageEmpty)).toBeVisible()
    expect(useGame.getState().game.inv.reed).toBe(1)
  })

  it('50 occupied kinds still permit a top-up from 98 to 99 and repeated clicks cannot duplicate', () => {
    ready(fullBag(MAX_STACK - 1))
    render(<StorageView item="supplyChest" />)
    pick()
    const button = screen.getByRole('button', { name: T.easy.storageTake })
    take(); fireEvent.click(button)
    expect(useGame.getState().game.inv.reed).toBe(MAX_STACK)
    expect(useGame.getState().game.chest.reed ?? 0).toBe(0)
    roundtrip()
  })

  it('partial top-up leaves an accurate chest detail; retry at cap preserves both inventories', () => {
    ready(fullBag(MAX_STACK - 1), 2)
    render(<StorageView item="supplyChest" />)
    pick(); take()
    expect(document.querySelector('.bag-detail strong')).toHaveTextContent('갈대 1')
    const beforeRetry = useGame.getState().game
    take()
    expect(useGame.getState().game).toBe(beforeRetry)
    expect(useGame.getState().toast?.text).toBe(T.easy.chestFull)
    expect(beforeRetry.inv.reed).toBe(MAX_STACK)
    expect(beforeRetry.chest.reed).toBe(1)
    roundtrip()
  })

  it('cancel selection by closing performs no transfer', () => {
    const before = ready({ reed: MAX_STACK - 1 })
    render(<StorageView item="supplyChest" />)
    pick()
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: T.ui.close }))
    expect(useGame.getState().game).toBe(before)
    roundtrip()
  })
})

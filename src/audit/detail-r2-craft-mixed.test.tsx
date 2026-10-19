import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { newGame, stockOf, canCraft } from '../engine/game'
import { finishNow } from '../engine/minigame'
import { deserialize, serialize, setActiveSlot } from '../engine/save'
import { HOME_ENTRY } from '../engine/world'
import { PlaceMenu } from '../features/menus/PlaceMenu'
import { useGame } from '../store/game-store'

function ready() {
  const base = newGame(CONTENT)
  const game = { ...base, scenes: [], inv: { wool: 1 }, chest: { wool: 2 },
    room: [...base.room, { item: 'linenCupboard' as const, x: HOME_ENTRY.x + 1, y: HOME_ENTRY.y - 1 }],
    player: { ...base.player, ...HOME_ENTRY, path: [] } }
  useGame.getState().load(game)
  useGame.setState({ modal: { kind: 'menu', place: 'workbench' }, toast: null })
  return game
}
function finish() {
  const m = useGame.getState().modal
  if (m?.kind !== 'mini') throw new Error('Expected craft mini')
  useGame.setState({ modal: { ...m, state: finishNow(m.state) } })
  useGame.getState().miniTap()
}
beforeEach(() => { localStorage.clear(); setActiveSlot('1') })
afterEach(cleanup)

describe('R2 craft mixed bag and furniture storage', () => {
  it('reproduces misleading 1/3 requirement despite stock 3 and enabled make', () => {
    const game = ready()
    expect(stockOf(game, 'wool')).toBe(3)
    expect(canCraft(game, 'blanket')).toBeNull()
    render(<PlaceMenu place="workbench" />)
    fireEvent.click(screen.getByRole('button', { name: /담요/ }))
    expect(document.querySelector('.bag-detail')).toHaveTextContent('1/3')
    expect(document.querySelector('.need-list li')).toHaveClass('short')
    expect(screen.getByRole('button', { name: '만들기' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: '만들기' }))
    expect(useGame.getState().modal).toMatchObject({ kind: 'mini', pending: { kind: 'craft', recipe: 'blanket' } })
    expect(useGame.getState().game.inv.wool).toBe(1)
    expect(useGame.getState().game.chest.wool).toBe(2)
  })

  it('cancel does not consume either source and completion consumes 1+2 exactly once', () => {
    const before = ready()
    useGame.getState().startCraft('blanket')
    useGame.getState().quitMini()
    expect(useGame.getState().game).toBe(before)
    useGame.getState().startCraft('blanket')
    finish()
    const made = useGame.getState().game
    expect(made.inv.wool ?? 0).toBe(0)
    expect(made.chest.wool ?? 0).toBe(0)
    expect(made.inv.blanket).toBeGreaterThanOrEqual(1)
    expect(made.clock.minute).toBe(before.clock.minute + 60)
    useGame.getState().miniTap()
    expect(useGame.getState().game).toBe(made)
    const back = deserialize(serialize(made), CONTENT)!
    expect(back.inv).toEqual(made.inv)
    expect(back.chest).toEqual(made.chest)
  })

  it('fixture-only late loss of wool rejects completion without paying the remainder', () => {
    ready(); useGame.getState().startCraft('blanket')
    const g = useGame.getState().game
    const changed = { ...g, chest: { wool: 1 } }
    useGame.setState({ game: changed })
    finish()
    expect(useGame.getState().game.inv).toEqual(changed.inv)
    expect(useGame.getState().game.chest).toEqual(changed.chest)
    expect(useGame.getState().game.clock).toEqual(changed.clock)
    expect(changed.inv.wool).toBe(1)
    expect(useGame.getState().game.chest.wool).toBe(1)
    expect(useGame.getState().game.inv.blanket ?? 0).toBe(0)
  })

  it('fixture-only late output saturation rejects completion without consuming wool', () => {
    ready(); useGame.getState().startCraft('blanket')
    const g = useGame.getState().game
    const changed = { ...g, inv: { wool: 1, blanket: 99 }, chest: { wool: 2, blanket: 30 } }
    useGame.setState({ game: changed })
    finish()
    expect(useGame.getState().game.inv).toEqual(changed.inv)
    expect(useGame.getState().game.chest).toEqual(changed.chest)
    expect(useGame.getState().game.clock).toEqual(changed.clock)
    expect(useGame.getState().game.inv.wool).toBe(1)
    expect(useGame.getState().game.chest.wool).toBe(2)
    expect(useGame.getState().game.inv.blanket).toBe(99)
  })
})

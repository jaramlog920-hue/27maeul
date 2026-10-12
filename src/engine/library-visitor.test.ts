import { CONTENT } from '../content/catalog'
import { interactTile, newGame, tapTile, tick, walkDirection, type GameState } from './game'
import { libraryVisitorTile, visitorBeside } from './library-visitor'

function visiting(): GameState {
  const s = newGame(CONTENT)
  const base = { ...s, scenes: [], clock: { day: 9, minute: 12 * 60 }, guestbook: [{ day: 9, kind: 'learner' as const }], npcs: {} }
  const at = libraryVisitorTile(base)!
  return { ...base, player: { ...base.player, x: at.x - 1, y: at.y, facing: 'right' } }
}

it('the reading visitor is a keyboard interaction target and cannot be walked through', () => {
  const s = visiting(), at = libraryVisitorTile(s)!
  expect(visitorBeside(s)).toBe(true)
  expect(interactTile(s)).toEqual(at)
  expect(walkDirection(s, 1, 0).player.path).toEqual([])
  const tapped = tapTile(s, at)
  expect(tapped.target).toEqual({ kind: 'libraryVisitor', day: 9 })
  expect(tapped.player.path).toEqual([])
  expect(tick(tapped, 0, () => 0.5, CONTENT).events).toContainEqual({ type: 'arrived', target: { kind: 'libraryVisitor', day: 9 } })
})

it('a distant tap walks beside the visitor and arrives without entering the occupied tile', () => {
  let s = visiting()
  s = { ...s, player: { ...s.player, x: s.player.x - 2 } }
  const at = libraryVisitorTile(s)!
  s = tapTile(s, at)
  expect(s.target?.kind).toBe('libraryVisitor')
  expect(s.player.path).not.toContainEqual(at)
  let arrived = false
  for (let i = 0; i < 100 && !arrived; i++) {
    const next = tick(s, 0.05, () => 0.5, CONTENT)
    s = next.state
    arrived = next.events.some(e => e.type === 'arrived' && e.target.kind === 'libraryVisitor')
  }
  expect(arrived).toBe(true)
  expect(visitorBeside(s)).toBe(true)
})

it('no visitor interaction outside visit hours, on another map, or from yesterday', () => {
  const s = visiting()
  expect(libraryVisitorTile({ ...s, clock: { day: 9, minute: 17 * 60 } })).toBeNull()
  expect(libraryVisitorTile({ ...s, clock: { day: 10, minute: 12 * 60 } })).toBeNull()
  expect(libraryVisitorTile({ ...s, map: 'newland' })).toBeNull()
  expect(visitorBeside({ ...s, map: 'newland' })).toBe(false)
})

it('a visitor who has already left never fires an arrival conversation', () => {
  const s = visiting()
  const tapped = tapTile(s, libraryVisitorTile(s)!)
  const next = tick({ ...tapped, clock: { day: 9, minute: 17 * 60 } }, 0, () => 0.5, CONTENT)
  expect(next.events.filter(e => e.type === 'arrived' && e.target.kind === 'libraryVisitor')).toEqual([])
  expect(next.state.target).toBeNull()
})

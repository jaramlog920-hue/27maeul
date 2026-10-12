import { expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame, syncHome, walkDirection, type GameState } from './game'
import { canPlace, orderBuild, tilesOf } from './newland-build'
import { deserialize, serialize } from './save'

function land(): GameState {
  const base = newGame(CONTENT)
  return { ...base, map: 'newland', scenes: [], coins: 1000,
    flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1 },
    player: { ...base.player, x: 20, y: 20, path: [] } }
}

function threeSides() {
  let s = land()
  for (const [x,y] of [[19,20],[21,20],[20,19]]) {
    expect(canPlace(s, 'treeSmall', x, y)).toBeNull()
    s = orderBuild(s, 'treeSmall', x, y)!
  }
  return s
}

it('rejects enclosing the player on unpaved grass without charging or changing the layout', () => {
  const s = threeSides()
  const original = serialize(s)
  expect(canPlace(s, 'treeSmall', 20, 21)).toBe('sealed')
  expect(orderBuild(s, 'treeSmall', 20, 21)).toBeNull()
  expect(serialize(s)).toBe(original)
  expect(tilesOf(s)['20,21']).toBeUndefined()
})

it('keeps an escape route after reloading the accepted layout', () => {
  const s = deserialize(serialize(threeSides()), CONTENT)!
  syncHome(s)
  expect(walkDirection(s, 0, 1).player.path.length).toBeGreaterThan(0)
  expect(canPlace(s, 'treeSmall', 20, 21)).toBe('sealed')
})

it('still allows non-blocking decorations beside the player', () => {
  const s = threeSides()
  expect(canPlace(s, 'flower', 20, 21)).toBeNull()
})

it('does not treat another map or interior coordinates as newland outdoor positions', () => {
  const s = threeSides()
  expect(canPlace({ ...s, map: 'village' }, 'treeSmall', 20, 21)).toBeNull()
  expect(canPlace({ ...s, player: { ...s.player, x: 19, y: 38 } }, 'treeSmall', 20, 21)).toBeNull()
})

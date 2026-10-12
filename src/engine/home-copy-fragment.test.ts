import { CONTENT } from '../content/catalog'
import { homeCopyFragment, newGame, syncHome } from './game'
import { HOME_ENTRY } from './world'

it('home chapter rewards include both outcomes, never duplicate, and never reroll the same chapter', () => {
  let wins = 0
  for (let day = 1; day <= 100; day++) {
    const s = { ...newGame(CONTENT), clock: { day, minute: 600 }, player: { ...newGame(CONTENT).player, ...HOME_ENTRY } }
    syncHome(s)
    const next = homeCopyFragment(s, 'mt', 1, CONTENT)
    expect(next.flags['copyFragment:mt:1']).toBe(1)
    expect(homeCopyFragment(next, 'mt', 1, CONTENT)).toBe(next)
    if (next.collected.length) {
      wins++
      expect(next.collected).toHaveLength(1)
      expect(next.pieceLog?.[next.collected[0]].from).toBe('homeCopy')
    }
  }
  expect(wins).toBeGreaterThan(5)
  expect(wins).toBeLessThan(40)
})

it('does not reward copying outside home and safely handles a complete collection', () => {
  const s = newGame(CONTENT)
  const outside = { ...s, player: { ...s.player, x: 24, y: 18 } }
  expect(homeCopyFragment(outside, 'mt', 1, CONTENT)).toBe(outside)
  const full = { ...s, player: { ...s.player, ...HOME_ENTRY }, collected: CONTENT.pieces.map(p => p.id) }
  expect(homeCopyFragment(full, 'mt', 1, CONTENT).collected).toEqual(full.collected)
})

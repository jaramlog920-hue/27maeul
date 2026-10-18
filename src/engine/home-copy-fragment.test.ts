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

it('오늘 편지·이웃이 줄 조각은 집 필사 조각으로 가져가지 않는다 (2026-10-18 감사 L-28)', () => {
  const all = CONTENT.pieces.map((p) => p.id)
  const reserved = all.slice(0, Math.floor(all.length / 2))
  let hits = 0
  for (let day = 1; day <= 200; day++) {
    const base = newGame(CONTENT)
    const s = { ...base, clock: { day, minute: 600 }, player: { ...base.player, ...HOME_ENTRY }, post: reserved.slice(0, -1), offers: { baker: reserved.at(-1)! } }
    syncHome(s)
    const next = homeCopyFragment(s, 'mt', 1, CONTENT)
    if (next.collected.length) {
      hits++
      expect(reserved).not.toContain(next.collected[0])
    }
  }
  expect(hits).toBeGreaterThan(10)
})

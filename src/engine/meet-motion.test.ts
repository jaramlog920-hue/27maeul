import { CONTENT } from '../content/catalog'
import { newGame, tick } from './game'
import { mulberry32 } from './offers'
import { checkMeets } from './meet'
import { newGenState, affinityOf } from './gen'

it('conversation participants face each other and stay in place until the emote ends', () => {
  const base = newGame(CONTENT)
  const a = { ...base.npcs.baker, x: 12, y: 11, visible: true, facing: 'down' as const, path: [{ x: 11, y: 11 }] }
  const b = { ...base.npcs.grandpa, x: 13, y: 11, visible: true, facing: 'down' as const, path: [{ x: 14, y: 11 }] }
  const s = { ...base, clock: { day: 1, minute: 600 }, npcs: { ...base.npcs, baker: a, grandpa: b }, emotes: [{ npc: 'baker', partner: 'grandpa', kind: 'talk' as const, left: 5 }, { npc: 'grandpa', partner: 'baker', kind: 'talk' as const, left: 5 }] }
  const next = tick(s, 0.5, mulberry32(1), CONTENT).state
  expect(next.npcs.baker.x).toBe(12)
  expect(next.npcs.grandpa.x).toBe(13)
  expect(next.npcs.baker.facing).toBe('right')
  expect(next.npcs.grandpa.facing).toBe('left')
  expect(next.npcs.baker.path).toEqual(a.path)
})

it('a free-time conversation increases mutual affinity and records both participants', () => {
  const at = { rudy: { x: 12, y: 11 }, poppy: { x: 13, y: 11 } }
  for (let seed = 1; seed <= 20; seed++) {
    const g = newGenState(CONTENT, seed, 1)
    const met = checkMeets(g, at, new Set(Object.keys(at)), 1, 600, () => [])
    expect(affinityOf(met.g, 'rudy', 'poppy')).toBeGreaterThan(affinityOf(g, 'rudy', 'poppy'))
    expect(met.emotes[0].partner).toBe('rudy')
    expect(met.emotes[1].partner).toBe('poppy')
  }
})

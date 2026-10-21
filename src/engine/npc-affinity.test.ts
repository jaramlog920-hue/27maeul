import { CONTENT } from '../content/catalog'
import { gameAtChapters } from './growth-test-support'
import { npcAffinityScale } from './npc-affinity'
import { checkMeets } from './meet'
import { affinityOf, newGenState } from './gen'
import { withPairs, settleOneDay } from './gen-settle'
import { serialize, deserialize } from './save'

// 2026-10-22: 75장 뒤엔 두 배 (그 전엔 다섯에 하나) — 열리기 전은 열린 뒤의 열에 하나
it('positive NPC meeting gains accrue at one tenth of the post-unlock rate before the 75-chapter unlock', () => {
  const before = gameAtChapters(CONTENT, 74), after = gameAtChapters(CONTENT, 75)
  expect(npcAffinityScale(before)).toBe(0.2)
  expect(npcAffinityScale(after)).toBe(2)
  const g = newGenState(CONTENT, 5, 1, withPairs())
  const at = { rudy: { x: 12, y: 11 }, poppy: { x: 13, y: 11 } }, free = new Set(Object.keys(at))
  const slow = checkMeets(g, at, free, 3, 600, () => [], npcAffinityScale(before))
  const full = checkMeets(g, at, free, 3, 600, () => [], npcAffinityScale(after))
  expect(affinityOf(slow.g, 'rudy', 'poppy')).toBeCloseTo(affinityOf(full.g, 'rudy', 'poppy') / 10)
  expect(slow.g.meets).toEqual(full.g.meets)
  const saved = deserialize(serialize({ ...before, gen: slow.g }), CONTENT)!
  expect(affinityOf(saved.gen!, 'rudy', 'poppy')).toBe(affinityOf(slow.g, 'rudy', 'poppy'))
})

it('unlocking preserves accrued affinity and does not multiply or backfill it', () => {
  const before = gameAtChapters(CONTENT, 74), after = gameAtChapters(CONTENT, 75)
  const g = { ...newGenState(CONTENT, 5, 1, withPairs()), affinity: { 'poppy|rudy': 12.4 } }
  const held = settleOneDay(g, 2, before, CONTENT, {})
  const unlocked = settleOneDay(held, 3, after, CONTENT, {})
  expect(affinityOf(unlocked, 'rudy', 'poppy')).toBe(12.4)
  expect(unlocked.relations['poppy|rudy']?.stage).not.toBe('lover')
})

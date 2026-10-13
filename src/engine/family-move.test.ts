import { askToStay, familyHomes, familyMoveMorning, homeWishes, MOVE_AFTER_DAYS, MOVE_WAIT_DAYS, sayGoodbye, wantsToMove } from './gen-homes'

// 새 터 집에 사는 가구 하나 (h-1, b1 집) — 필요한 칸만
const home = { id: 'b1', kind: 'home', x: 10, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false, slot: 0 }
const base = (day: number, flags: Record<string, number> = {}) => ({
  clock: { day, minute: 360 },
  newland: { builds: [home], tiles: {}, nextId: 2 },
  gen: { households: { 'h-1': { id: 'h-1', members: ['g-1', 'g-2'], home: 'g-1' } }, persons: {} },
  flags: { 'familyHome:1': 1, 'familyHomeDay:1': 1, ...flags },
}) as never

describe('새 터 가족 이사 (2026-10-14)', () => {
  it('두 이레 전에는 이사 마음이 생기지 않고, 뒤로는 드물게 생긴다', () => {
    for (let d = 2; d < 1 + MOVE_AFTER_DAYS; d++) expect(wantsToMove(familyMoveMorning(base(d)), { id: 'h-1' } as never)).toBe(false)
    let n = 0
    for (let d = 20; d < 520; d++) if ((familyMoveMorning(base(d)) as { flags: Record<string, number> }).flags['moveWish:1']) n++
    expect(n).toBeGreaterThan(0)
    expect(n).toBeLessThan(60)
  })
  it('말리면 머물고, 인사하면 다음 아침 떠나 빈집이 되며, 그냥 두면 사흘 뒤 떠난다 — 떠난 가족은 한 달 동안 집을 바라지 않는다', () => {
    const h = { id: 'h-1', members: ['g-1', 'g-2'], home: 'g-1' } as never
    const wish = base(30, { 'moveWish:1': 30 })
    const stayed = askToStay(wish, h) as { flags: Record<string, number> }
    expect(stayed.flags['moveWish:1']).toBeUndefined()
    expect(familyHomes(familyMoveMorning({ ...(stayed as object), clock: { day: 31, minute: 360 } } as never))).toHaveLength(1)
    const bye = familyMoveMorning({ ...(sayGoodbye(wish, h) as object), clock: { day: 31, minute: 360 } } as never) as { flags: Record<string, number> }
    expect(familyHomes(bye as never)).toHaveLength(0)
    expect(bye.flags.familyLeft).toBe(1)
    expect(homeWishes(bye as never, () => false)).toHaveLength(0)
    const left = familyMoveMorning({ ...(wish as object), clock: { day: 30 + MOVE_WAIT_DAYS, minute: 360 } } as never)
    expect(familyHomes(left)).toHaveLength(0)
  })
})

// 이사 마음이 있던 가족의 집을 헐고 새 집을 내어 줘도, 옛 이사 마음을 들고 가지 않는다 (2026-10-18 감사 M-17)
import { familyHomes, familyMoveMorning, wantsToMove } from './gen-homes'
import { demolishBuild } from './newland-build'
import type { Household } from './gen'

const h1 = { id: 'b1', kind: 'home', x: 10, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 1500, items: {} }, refunded: false, slot: 0 }
const h2 = { ...h1, id: 'b2', x: 20, slot: 1 }
const family = { id: 'h-1' } as Household

function world() {
  return {
    coins: 0,
    inv: {},
    clock: { day: 40, minute: 360 },
    newland: { builds: [h1, h2], tiles: {}, nextId: 3 },
    gen: { households: { 'h-1': { id: 'h-1', members: ['g-1', 'g-2'], home: 'g-1' } }, persons: {} },
    flags: { 'familyHome:1': 1, 'familyHomeDay:1': 1, 'moveWish:1': 40, 'moveBye:1': 1, 'moveGift:g-1': 1, 'moveGift:g-2': 1, 'familyHome:2': 2, 'moveWish:2': 39 } as Record<string, number>,
  }
}

describe('새 터 가족 집 철거', () => {
  it('헐린 집에 살던 가족의 사는 집·이사 마음·인사 표식이 지워지고, 다른 집에 사는 가족은 그대로', () => {
    const s = demolishBuild(world() as never, 'b1') as unknown as ReturnType<typeof world>
    expect(s.flags['familyHome:1']).toBeUndefined()
    expect(s.flags['familyHomeDay:1']).toBeUndefined()
    expect(s.flags['moveWish:1']).toBeUndefined()
    expect(s.flags['moveBye:1']).toBeUndefined()
    expect(s.flags['moveGift:g-1']).toBe(1)
    expect(s.flags['familyHome:2']).toBe(2)
    expect(s.flags['moveWish:2']).toBe(39)
  })

  it('헐린 뒤 새 집에 들어간 가족은 곧바로 떠나지 않는다', () => {
    let s = demolishBuild(world() as never, 'b1') as unknown as ReturnType<typeof world>
    s = { ...s, clock: { day: 41, minute: 600 }, flags: { ...s.flags, 'familyHome:1': 2, 'familyHomeDay:1': 41 } }
    expect(wantsToMove(s, family)).toBe(false)
    const next = familyMoveMorning({ ...s, clock: { day: 43, minute: 360 } } as never) as unknown as ReturnType<typeof world>
    expect(next.flags.familyLeft).toBeUndefined()
    expect(familyHomes(next as never).length).toBeGreaterThan(0)
  })
})

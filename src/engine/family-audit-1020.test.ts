// 2026-10-20 아이·유전·이사 점검에서 고친 것들
import { CONTENT } from '../content/catalog'
import { newChild, TODDLER_AT, HELPER_AT } from './child'
import { goToSleep, sceneSeen, type GameState } from './game'
import { establishedGame } from './growth-test-support'
import { familyMoveMorning, sharedHomeOf } from './gen-homes'
import { cribDue } from './gen-birth'
import { kidWorkers, kidWorkOwners } from './kid-work'
import { lodgingChildren } from './lodging'
import { isKidFlag, nameSibling, selectKid, swapKid } from './siblings'

function family(): GameState {
  const s = establishedGame(CONTENT, 200)
  const day = 300
  return {
    ...s,
    homeLevel: 2,
    clock: { day, minute: 22 * 60 },
    romance: { partner: 'cosmo', stage: 'married', since: 1, weddingDay: 10, marriedDay: 10 },
    child: { ...newChild(day - 100, s.stats, undefined), born: day - 100, name: '하나', job: 'cook' },
    siblings: [{ ...newChild(day - 90, s.stats, undefined), born: day - 90, name: '둘', job: 'weaver' }],
    scenes: [],
  }
}

describe('아이 점검 (2026-10-20)', () => {
  it('주인 표시 없는 옛 일터는 아이를 바꿔도 원래 아이 몫으로 남는다', () => {
    const s = family()
    const work = { id: 'b9', kind: 'kidWork', x: 10, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false, slot: 0 }
    const old = { ...s, newland: { builds: [work], tiles: {}, nextId: 10, settledDay: 0 } } as GameState
    const swapped = swapKid(old, 0)
    expect(swapped.newland!.builds[0].owner).toBe(`me:${s.child!.born}`)
    expect(kidWorkOwners(swapped).map((o) => o.owner)).not.toContain(`me:${s.child!.born}`)
    expect(kidWorkers(swapped)[0].kid?.name).toBe('하나')
  })
  it('아침 장면 때문에 다른 아이가 앞에 서도, 장면을 다 보면 고른 아이로 돌아온다', () => {
    const s = family()
    // 둘째가 걸음마를 떼는 아침이 되도록
    const day = s.clock.day
    const s2 = { ...s, siblings: [{ ...s.siblings![0], born: day + 1 - TODDLER_AT }] }
    let next = goToSleep(s2, CONTENT)
    expect(next.child?.born).toBe(s2.siblings[0].born)
    expect(next.flags.pickedKid).toBe(s.child!.born)
    for (const id of [...next.scenes]) next = sceneSeen(next, id, [])
    expect(next.child?.born).toBe(s.child!.born)
    expect(next.flags.pickedKid).toBeUndefined()
  })
  it('동생 이름이 형제 이름과 같으면 처음 이름을 그대로 둔다', () => {
    const s = { ...family(), flags: { ...family().flags, siblingNaming: 1 } }
    expect(nameSibling(s, '하나').siblings![0].name).toBe('둘')
    expect(nameSibling(s, '셋').siblings![0].name).toBe('셋')
  })
  it('childPet은 집안 표식이라 아이를 바꿔도 남는다', () => {
    expect(isKidFlag('childPet')).toBe(false)
    const s = { ...family(), flags: { ...family().flags, childPet: 2 } }
    expect(selectKid(s, s.siblings![0].born).flags.childPet).toBe(2)
  })
  void HELPER_AT
})

describe('유전·세대 점검 (2026-10-20)', () => {
  it('자리를 이어받은 자녀 부부에게 그 자리 집은 제 집이다', () => {
    const g = {
      persons: { 'g-1': { id: 'g-1', spouse: 'g-2', household: 'h-1' }, 'g-2': { id: 'g-2', spouse: 'g-1', household: 'h-1' } },
      households: { 'h-1': { id: 'h-1', members: ['g-1', 'g-2'], home: 'baker', children: [] } },
      retired: { baker: { heir: 'g-1' } },
    } as never
    expect(sharedHomeOf(g, 'baker', () => true)).toBeNull()
    expect(sharedHomeOf(g, 'g-2', () => true)).toBe('baker')
  })
  it('마을 정원이 찼으면 아기 침대를 부탁하지 않는다', () => {
    const persons = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`g-${i}`, { id: `g-${i}`, origin: 'born', stage: 'child' }]))
    const h = { id: 'h-1', members: ['a', 'b'], home: 'a', children: [], since: 1, wedAffinity: 90 }
    expect(cribDue({ persons, households: { 'h-1': h }, relations: {} } as never, h as never, 100)).toBe(false)
  })
})

describe('이사 점검 (2026-10-20)', () => {
  const home = (id: string, x: number) => ({ id, kind: 'home', x, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false, slot: 0 })
  it('같은 아침 두 가족이 떠나면 둘 다 알림에 남는다', () => {
    const s = {
      clock: { day: 40, minute: 360 },
      newland: { builds: [home('b1', 10), home('b2', 20)], tiles: {}, nextId: 3 },
      gen: { households: { 'h-1': { id: 'h-1', members: ['g-1', 'g-2'], home: 'g-1' }, 'h-2': { id: 'h-2', members: ['g-3', 'g-4'], home: 'g-3' } }, persons: {} },
      flags: { 'familyHome:1': 1, 'familyHome:2': 2, 'moveWish:1': 30, 'moveWish:2': 30 },
    } as never
    const next = familyMoveMorning(s) as { flags: Record<string, number> }
    expect(next.flags.familyLeft).toBe(1)
    expect(next.flags['familyLeft:2']).toBe(1)
    const after = familyMoveMorning({ ...(next as object), clock: { day: 41, minute: 360 } } as never) as { flags: Record<string, number> }
    expect(after.flags.familyLeft).toBeUndefined()
    expect(after.flags['familyLeft:2']).toBeUndefined()
  })
  it('새 터로 옮긴 가구의, 함께 가지 않은 다 큰 자녀는 손님 자리에 그대로 있다', () => {
    const s = {
      flags: { 'familyHome:1': 1 },
      gen: {
        persons: { 'g-5': { id: 'g-5', origin: 'born', stage: 'adult', born: 10, household: 'h-1', name: '자녀' } },
        households: { 'h-1': { id: 'h-1', members: ['baker', 'smith'], home: 'baker', children: ['g-5'] } },
        retired: {},
      },
    } as never
    expect(lodgingChildren(s).map((x) => x.id)).toContain('g-5')
  })
})

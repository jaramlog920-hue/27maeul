import { CONTENT } from '../content/catalog'
import { HELPER_AT, newChild } from './child'
import { withPlayerFamily, MY_CHILD } from './family-tree'
import { goToSleep, type GameState } from './game'
import { establishedGame } from './growth-test-support'
import { deserialize, serialize } from './save'
import { allKids, askBaby, babyBlock, MAX_KIDS, nameSibling, PREGNANCY_DAYS, selectKid } from './siblings'

/** 결혼했고 첫째가 있는 집 (첫째 나이 age일) */
function family(age: number): GameState {
  const s = establishedGame(CONTENT, 200)
  const day = 300
  return {
    ...s,
    homeLevel: 2,
    clock: { day, minute: 22 * 60 },
    romance: { partner: 'cosmo', stage: 'married', since: 1, weddingDay: 10, marriedDay: 10 },
    child: { ...newChild(day - age, s.stats, undefined), born: day - age },
    scenes: [],
  }
}

/** 얘기한 뒤 아기가 태어나는 아침까지 잔다 (2026-10-14: 다음 날 아기 소식, PREGNANCY_DAYS째 아침에 출생) */
function sleepToBirth(s: GameState): GameState {
  for (let i = 0; i < PREGNANCY_DAYS; i++) s = goToSleep({ ...s, clock: { ...s.clock, minute: 22 * 60 } }, CONTENT)
  return s
}

describe('아이 셋 (2026-10-13)', () => {
  it('얘기한 다음 날 아침 아기 소식, 나흘째 아침에 태어난다 (2026-10-14 사용자: 임신과 출산)', () => {
    let s = askBaby(family(HELPER_AT))
    s = goToSleep(s, CONTENT)
    expect(s.scenes).toContain('pregnancy')
    expect(s.siblings ?? []).toHaveLength(0)
    expect(babyBlock(s)).toBe('waiting')
    for (let i = 1; i < PREGNANCY_DAYS - 1; i++) {
      s = goToSleep({ ...s, scenes: [], clock: { ...s.clock, minute: 22 * 60 } }, CONTENT)
      expect(s.scenes).not.toContain('pregnancy')
      expect(s.siblings ?? []).toHaveLength(0)
    }
    s = goToSleep({ ...s, scenes: [], clock: { ...s.clock, minute: 22 * 60 } }, CONTENT)
    expect(s.siblings).toHaveLength(1)
    expect(s.scenes).toContain('siblingBorn')
    expect(s.flags.babyWish).toBeUndefined()
    expect(s.flags.babyNews).toBeUndefined()
  })
  it('첫째도 얘기해야 생긴다 — 결혼만 해서는 아무리 지나도 안 오고, 얘기하고 나흘째 아침', () => {
    const base = family(0)
    let s: GameState = { ...base, child: null, clock: { day: 400, minute: 22 * 60 } }
    s = goToSleep(s, CONTENT)
    expect(s.child).toBeNull()
    s = sleepToBirth(askBaby({ ...s, clock: { ...s.clock, minute: 22 * 60 } }))
    expect(s.child).not.toBeNull()
    expect(s.scenes).toContain('childBorn')
    expect(s.flags.childNaming).toBe(1)
    expect(s.siblings ?? []).toHaveLength(0)
  })
  it('아이방(집 2단계)이 없으면 얘기할 수 없다', () => {
    expect(babyBlock({ ...family(HELPER_AT), child: null, homeLevel: 1 })).toBe('home')
  })
  it('함께할 아이를 바꾸면 아이별 표식·옷장 모습이 따라가고, 다시 고르면 돌아온다', () => {
    let s = sleepToBirth(askBaby(family(HELPER_AT)))
    s = nameSibling(s, '하람')
    const first = s.child!
    s = { ...s, flags: { ...s.flags, childWalked: 1, schoolDay: 5 }, looks: { child: { look: 'f', hairFront: 3 } as never } }
    const swapped = selectKid(s, s.siblings![0].born)
    expect(swapped.child!.name).toBe('하람')
    expect(swapped.flags.childWalked).toBeUndefined()
    expect(swapped.looks?.child).toBeUndefined()
    expect(swapped.siblings![0].name).toBe(first.name)
    const back = selectKid(swapped, first.born)
    expect(back.child!.name).toBe(first.name)
    expect(back.flags.childWalked).toBe(1)
    expect(back.flags.schoolDay).toBe(5)
    expect((back.looks?.child as { hairFront?: number })?.hairFront).toBe(3)
    expect(deserialize(serialize(swapped), CONTENT)!.siblings![0].kidFlags?.childWalked).toBe(1)
  })
  it('함께하지 않는 아이도 아침마다 자란다 — 걷기 시작하는 장면이 그 아이에게 생긴다', () => {
    let s = sleepToBirth(askBaby(family(HELPER_AT)))
    s = nameSibling(s, '하람')
    s = { ...s, clock: { day: s.clock.day + 15, minute: 22 * 60 }, scenes: [] }
    const next = goToSleep(s, CONTENT)
    expect(next.scenes).toContain('childWalks')
    // 장면이 생긴 아이가 함께하는 아이가 되어 장면 속 이름이 맞는다
    expect(next.child!.name).toBe('하람')
  })

  it('첫째가 어린이(돕는 아이)가 되기 전엔 못 하고, 된 뒤엔 얘기할 수 있다', () => {
    expect(babyBlock(family(HELPER_AT - 1))).toBe('youngest')
    expect(babyBlock(family(HELPER_AT))).toBeNull()
  })
  it('얘기하고 나흘째 아침 아기가 태어나 이름을 정하고, 저장에 남는다', () => {
    const s = askBaby(family(HELPER_AT))
    expect(s.flags.babyWish).toBeTruthy()
    expect(babyBlock(s)).toBe('waiting')
    const born = sleepToBirth(s)
    expect(born.siblings).toHaveLength(1)
    expect(born.scenes).toContain('siblingBorn')
    expect(born.flags.siblingNaming).toBe(1)
    const named = nameSibling(born, '하람')
    expect(named.siblings![0].name).toBe('하람')
    expect(named.flags.siblingNaming).toBeUndefined()
    expect(deserialize(serialize(named), CONTENT)!.siblings![0].name).toBe('하람')
    // 막내(갓난 둘째)가 어린이가 되기 전엔 셋째를 못 갖는다
    expect(babyBlock(named)).toBe('youngest')
  })
  it('아이는 셋까지 — 가족 나무에도 셋이 오른다', () => {
    let s = family(200)
    for (let i = 0; i < 2; i++) {
      s = sleepToBirth(askBaby(s))
      s = nameSibling(s, `아이${i}`)
      s = { ...s, clock: { ...s.clock, day: s.clock.day + HELPER_AT, minute: 22 * 60 } }
    }
    expect(allKids(s)).toHaveLength(MAX_KIDS)
    expect(babyBlock(s)).toBe('full')
    const tree = withPlayerFamily({ persons: {} } as never, s)
    expect(Object.keys(tree.persons).filter((id) => id.startsWith(MY_CHILD))).toHaveLength(3)
  })
})

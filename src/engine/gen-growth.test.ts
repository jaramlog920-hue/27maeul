import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { activeEligible, newGenState, sanitizeGen, type GenState } from './gen'
import { withPairs } from './gen-settle'
import { MOVE_AFTER, movedAway, movedHeir, RETIRE_AFTER, settleGrowth, slotPerson, stageByAge } from './gen-growth'
import { FAREWELL_LETTERS, farewellMorning, newGame } from './game'
import { deserialize, serialize } from './save'
import { T } from '../content/text'
import { companionsOf, genAvatar } from './gen-looks'
import { STAGE_AT } from './gen-config'
import { newsLine } from '../content/gen-text'

/** rudy·poppy 부부와 d0에 태어난 아이 하나 */
function family(d0 = 10): GenState {
  const g = newGenState(CONTENT, 7, 1, withPairs())
  return {
    ...g,
    persons: {
      ...g.persons,
      'g-0001': { id: 'g-0001', origin: 'born', born: d0, stage: 'baby', look: 'm', name: '아론', avatar: { skin: 2, top: 3 }, parents: ['rudy', 'poppy'], spouse: null, household: 'h-1' },
    },
    households: { 'h-1': { id: 'h-1', members: ['rudy', 'poppy'], home: 'rudy', children: ['g-0001'], lastBirth: d0, since: 1 } },
  }
}
const run = (g: GenState, from: number, to: number) => {
  for (let d = from; d <= to; d++) g = settleGrowth(g, d, { generations: true, retirement: true }) // 예전 세대교체 갈래 시험 (게임은 2026-10-21부터 끈 채로 부른다)
  return g
}

describe('세대교체', () => {
  it('플레이어 아이와 같은 속도로 자란다', () => {
    expect(stageByAge(0, STAGE_AT.child - 1)).toBe('baby')
    expect(stageByAge(0, STAGE_AT.child)).toBe('child')
    expect(stageByAge(0, STAGE_AT.teen)).toBe('teen')
    expect(stageByAge(0, STAGE_AT.adult)).toBe('adult')
  })
  it('어른이 되면 집 주인 쪽 일터에서 견습, 한 계절 뒤 부모는 은퇴하고 자리를 잇는다', () => {
    const adultDay = 10 + STAGE_AT.adult
    let g = run(family(), 10, adultDay)
    expect(g.persons['g-0001'].stage).toBe('adult')
    expect(g.heirs).toEqual({ rudy: { heir: 'g-0001', since: adultDay } })
    expect(g.retired).toBeUndefined()
    g = run(g, adultDay + 1, adultDay + RETIRE_AFTER)
    expect(g.retired).toEqual({ rudy: { heir: 'g-0001', day: adultDay + RETIRE_AFTER } })
    expect(slotPerson(g, 'rudy')).toBe('g-0001')
    expect(slotPerson(g, 'poppy')).toBe('poppy')
    expect(g.log.map((l) => l.kind)).toEqual(['grew:child', 'grew:teen', 'grew:adult', 'apprentice', 'retired'])
  })
  it('은퇴한 부모는 연애 대상에서 빠지고, 이어받은 어른 자녀가 들어온다', () => {
    const g = run(family(), 10, 10 + STAGE_AT.adult + RETIRE_AFTER)
    expect(activeEligible(g, 'g-0001')).toBe(true)
    if (activeEligible(newGenState(CONTENT, 7, 1, withPairs()), 'rudy')) expect(activeEligible(g, 'rudy')).toBe(false)
  })
  it('곁에 함께 있는 가족: 아이는 작게, 견습 자녀는 어른 크기로, 한 부모 곁에만', () => {
    let g = run(family(), 10, 10 + STAGE_AT.child)
    expect(companionsOf(g, 'rudy')).toEqual([{ person: g.persons['g-0001'], short: true }])
    expect(companionsOf(g, 'poppy')).toEqual([])
    g = run(g, 10 + STAGE_AT.child + 1, 10 + STAGE_AT.adult)
    expect(companionsOf(g, 'rudy')).toEqual([{ person: g.persons['g-0001'], short: false }])
    expect(genAvatar(g.persons['g-0001'])).toMatchObject({ look: 'm', name: '아론', skin: 2, top: 3 })
  })
  it('retired parents stay in the village beside their heirs indefinitely and after reload', () => {
    const r = 10 + STAGE_AT.adult + RETIRE_AFTER
    let g = run(family(), 10, r + MOVE_AFTER - 1)
    expect(movedHeir(g, 'rudy')).toBeNull()
    g = run(g, r + MOVE_AFTER, r + 1000)
    expect(g.retired?.rudy).toEqual({ heir: 'g-0001', day: r })
    expect(movedAway(g, 'rudy')).toBe(false)
    expect(movedHeir(g, 'rudy')).toBeNull()
    expect(slotPerson(g, 'rudy')).toBe('g-0001')
    expect(g.log.some(l => l.kind === 'movedAway')).toBe(false)
    // 은퇴한 부모가 곁에, 자녀는 자리 주인 (2026-10-11 사용자 결정)
    expect(companionsOf(g, 'rudy')).toEqual([{ person: g.persons.rudy, short: false, retiredParent: 'rudy' }])
    const restored = sanitizeGen(JSON.parse(JSON.stringify(g)), r + 1000)!
    expect(restored.retired).toEqual(g.retired)
    const base = newGame(CONTENT)
    expect(farewellMorning({ ...base, gen: restored }, CONTENT).farewellPopup).toBeUndefined()
  })
  it('legacy moved-away saves restore parents and preserve farewell history/rewards without duplicate gifts', () => {
    const r = 10 + STAGE_AT.adult + RETIRE_AFTER + MOVE_AFTER
    const grown = run(family(), 10, r)
    const gen = { ...grown, retired: { ...grown.retired, rudy: { ...grown.retired!.rudy, moved: r } },
      log: [...grown.log, { day: r, kind: 'movedAway', who: ['rudy', 'g-0001'] }] }
    const base = newGame(CONTENT)
    const s = farewellMorning({ ...base, clock: { ...base.clock, day: r }, gen }, CONTENT)
    const f = s.farewellPopup!
    expect(f.npc).toBe('rudy')
    expect(f.pieceId).toBeTruthy()
    expect(s.collected).toContain(f.pieceId)
    expect(Object.values(f.gift)).toEqual([1])
    const item = Object.keys(f.gift)[0] as keyof typeof s.inv
    expect(s.inv[item]).toBe((base.inv[item] ?? 0) + 1)
    expect(farewellMorning({ ...s, farewellPopup: undefined }, CONTENT).farewellPopup).toBeUndefined()
    expect((T.gen.farewell.letters as string[]).length).toBe(FAREWELL_LETTERS)
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.farewells).toEqual(s.farewells)
    // 2026-10-21: 은퇴를 없애 불러오면 은퇴 기록은 지워지고 부모가 제 자리로 (작별 편지·선물 기록은 남는다)
    expect(back.gen!.retired?.rudy).toBeUndefined()
    expect(back.gen!.log).toEqual(gen.log)
    expect(back.flags[`farewell:rudy`]).toBe(s.flags[`farewell:rudy`])
    expect(back.inv).toEqual(s.inv)
    expect(back.collected).toEqual(s.collected)
    // 은퇴 기록이 지워져 부모가 자리 주인 — 곁에 은퇴한 부모로 서지 않는다
    expect(companionsOf(back.gen, 'rudy').some((c) => c.retiredParent)).toBe(false)
    const nextGen = settleGrowth(back.gen!, r + 1000)
    const next = farewellMorning({ ...back, gen: nextGen, farewellPopup: undefined }, CONTENT)
    expect(next.farewellPopup).toBeUndefined()
    expect(next.inv).toEqual(back.inv)
    expect(next.farewells).toEqual(back.farewells)
    expect(next.gen!.log.filter(l => l.kind === 'movedAway')).toHaveLength(1)
    expect(gen.retired.rudy.moved).toBe(r)
    expect(settleGrowth(gen, r + 1).retired?.rudy.moved).toBeUndefined()
  })
  it('a legacy departure without claimed rewards returns without issuing a new farewell gift', () => {
    const day = 10 + STAGE_AT.adult + RETIRE_AFTER + MOVE_AFTER
    const g = run(family(), 10, day)
    const legacy = { ...g, retired: { rudy: { ...g.retired!.rudy, moved: day } } }
    const base = newGame(CONTENT)
    const restored = deserialize(serialize({ ...base, clock: { ...base.clock, day }, gen: legacy }), CONTENT)!
    const next = farewellMorning(restored, CONTENT)
    expect(next.inv).toEqual(restored.inv)
    expect(next.collected).toEqual(restored.collected)
    expect(next.farewellPopup).toBeUndefined()
    expect(movedAway(next.gen, 'rudy')).toBe(false)
  })
  it('자람·견습·은퇴 소식 글', () => {
    const g = run(family(), 10, 10 + STAGE_AT.adult + RETIRE_AFTER)
    const game = { gen: g, notebook: { met: ['rudy', 'poppy'] } } as never
    const lines = g.log.map((l) => newsLine(game, l))
    expect(lines.every((x) => typeof x === 'string' && x.length > 0 && !x.includes('{'))).toBe(true)
    expect(lines[0]).toContain('아론')
  })
})

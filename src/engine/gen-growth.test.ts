import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { activeEligible, newGenState, sanitizeGen, type GenState } from './gen'
import { withPairs } from './gen-settle'
import { MOVE_AFTER, movedHeir, RETIRE_AFTER, settleGrowth, slotPerson, stageByAge } from './gen-growth'
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
  for (let d = from; d <= to; d++) g = settleGrowth(g, d)
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
  it('은퇴 14일 뒤 이사 — 자리는 자녀, 곁에 따로 그리지 않는다, 저장해도 남는다', () => {
    const r = 10 + STAGE_AT.adult + RETIRE_AFTER
    let g = run(family(), 10, r + MOVE_AFTER - 1)
    expect(movedHeir(g, 'rudy')).toBeNull()
    g = run(g, r + MOVE_AFTER, r + MOVE_AFTER)
    expect(g.retired?.rudy.moved).toBe(r + MOVE_AFTER)
    expect(movedHeir(g, 'rudy')?.id).toBe('g-0001')
    expect(g.log.at(-1)?.kind).toBe('movedAway')
    expect(companionsOf(g, 'rudy')).toEqual([])
    expect(sanitizeGen(JSON.parse(JSON.stringify(g)), r + MOVE_AFTER)?.retired?.rudy.moved).toBe(r + MOVE_AFTER)
  })
  it('이사 간 아침: 편지·말씀 조각·선물 (한 번만)', () => {
    const r = 10 + STAGE_AT.adult + RETIRE_AFTER + MOVE_AFTER
    const gen = run(family(), 10, r)
    const base = newGame(CONTENT)
    const s = farewellMorning({ ...base, clock: { ...base.clock, day: r }, gen }, CONTENT)
    const f = s.farewellPopup!
    expect(f.npc).toBe('rudy')
    expect(f.pieceId).toBeTruthy()
    expect(s.collected).toContain(f.pieceId)
    const def = CONTENT.neighbors.find((n) => n.id === 'rudy')!
    for (const [id, n] of Object.entries(def.help.gives)) expect(s.inv[id as keyof typeof s.inv]).toBe((base.inv[id as keyof typeof base.inv] ?? 0) + (n ?? 0) * 2)
    expect(farewellMorning({ ...s, farewellPopup: undefined }, CONTENT).farewellPopup).toBeUndefined()
    expect((T.gen.farewell.letters as string[]).length).toBe(FAREWELL_LETTERS)
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.farewells).toEqual(s.farewells)
  })
  it('자람·견습·은퇴 소식 글', () => {
    const g = run(family(), 10, 10 + STAGE_AT.adult + RETIRE_AFTER)
    const game = { gen: g, notebook: { met: ['rudy', 'poppy'] } } as never
    const lines = g.log.map((l) => newsLine(game, l))
    expect(lines.every((x) => typeof x === 'string' && x.length > 0 && !x.includes('{'))).toBe(true)
    expect(lines[0]).toContain('아론')
  })
})

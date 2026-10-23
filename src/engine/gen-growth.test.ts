import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGenState, sanitizeGen, type GenState } from './gen'
import { withPairs } from './gen-settle'
import { settleGrowth, slotPerson, stageByAge } from './gen-growth'
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

describe('주민 아이의 자람 (은퇴·견습 없음 — 2026-10-21)', () => {
  it('플레이어 아이와 같은 속도로 자란다', () => {
    expect(stageByAge(0, STAGE_AT.child - 1)).toBe('baby')
    expect(stageByAge(0, STAGE_AT.child)).toBe('child')
    expect(stageByAge(0, STAGE_AT.teen)).toBe('teen')
    expect(stageByAge(0, STAGE_AT.adult)).toBe('adult')
  })
  it('어른이 되고 한 계절이 지나도 견습·은퇴가 생기지 않고 부모가 제 자리에 있다', () => {
    const g = run(family(), 10, 10 + STAGE_AT.adult + 45)
    expect(g.persons['g-0001'].stage).toBe('adult')
    expect(g.heirs).toBeUndefined()
    expect(g.retired).toBeUndefined()
    expect(slotPerson(g, 'rudy')).toBe('rudy')
    expect(g.log.map((l) => l.kind)).toEqual(['grew:child', 'grew:teen', 'grew:adult'])
  })
  it('곁에 함께 있는 가족: 아이는 작게, 어른 자녀는 어른 크기로, 한 부모 곁에만', () => {
    let g = run(family(), 10, 10 + STAGE_AT.child)
    expect(companionsOf(g, 'rudy')).toEqual([{ person: g.persons['g-0001'], short: true }])
    expect(companionsOf(g, 'poppy')).toEqual([])
    g = run(g, 10 + STAGE_AT.child + 1, 10 + STAGE_AT.adult)
    expect(companionsOf(g, 'rudy')).toEqual([{ person: g.persons['g-0001'], short: false }])
    expect(genAvatar(g.persons['g-0001'])).toMatchObject({ look: 'm', name: '아론', skin: 2, top: 3 })
  })
  it('예전 저장의 이사 간 표식은 불러올 때 버리고 이어받은 자리는 그대로', () => {
    const raw = JSON.parse(JSON.stringify({ ...family(), retired: { rudy: { heir: 'g-0001', day: 50, moved: 64 } } }))
    const back = sanitizeGen(raw, 65)!
    expect(back.retired?.rudy).toEqual({ heir: 'g-0001', day: 50 })
    expect(slotPerson(back, 'rudy')).toBe('g-0001')
  })
  it('자람 소식 글', () => {
    const g = run(family(), 10, 10 + STAGE_AT.adult)
    const game = { gen: g, notebook: { met: ['rudy', 'poppy'] } } as never
    const lines = g.log.map((l) => newsLine(game, l))
    expect(lines.every((x) => typeof x === 'string' && x.length > 0 && !x.includes('{'))).toBe(true)
    expect(lines[0]).toContain('아론')
  })
})

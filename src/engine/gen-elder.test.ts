import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGenState, sanitizeGen, type GenPerson, type GenState } from './gen'
import { STAGE_AT } from './gen-config'
import { settleGrowth, stageByAge, movedHeir } from './gen-growth'
import { companionsOf, genAvatar } from './gen-looks'
import { settleGen, withPairs } from './gen-settle'
import { newGame } from './game'
import { newsLine } from '../content/gen-text'
import { residentIsElder } from '../render/elder-details'
import { generationRows } from '../render/generation-art'
import { writerPalette } from '../render/sprites'

function family(): GenState {
  const g = newGenState(CONTENT, 7, 1, withPairs())
  const p: GenPerson = { id: 'g-0001', origin: 'born', born: 10, stage: 'baby', look: 'f', name: '루시', avatar: { skin: 4, hairFront: 10, hairBack: 2, top: 3, bottom: 2 }, parents: ['rudy', 'poppy'], spouse: null, household: 'h-1' }
  return { ...g, persons: { ...g.persons, [p.id]: p }, households: { 'h-1': { id: 'h-1', home: 'rudy', members: p.parents, children: [p.id], lastBirth: 10, since: 1 } } }
}
const elderDay = 10 + STAGE_AT.elder

describe('태어난 생성 주민의 노년', () => {
  it('성인 이후 네 계절을 지나면 노년이 되며 경계 전날까지는 성인이다', () => {
    expect(STAGE_AT.elder - STAGE_AT.adult).toBe(160)
    expect(stageByAge(10, elderDay - 1)).toBe('adult')
    expect(stageByAge(10, elderDay)).toBe('elder')
    expect(stageByAge(10, elderDay + 500)).toBe('elder')
    let g = family()
    for (let d = 10; d <= elderDay; d++) g = settleGrowth(g, d)
    expect(g.persons['g-0001'].stage).toBe('elder')
    expect(movedHeir(g, 'rudy')?.id).toBe('g-0001')
    expect(residentIsElder(g, movedHeir(g, 'rudy')!.id)).toBe(true)
    expect(g.persons['g-0001']).toMatchObject({ name: '루시', look: 'f', avatar: family().persons['g-0001'].avatar, born: 10 })
    const log = g.log.find(l => l.kind === 'grew:elder')!
    expect(log.day).toBe(elderDay)
    expect(newsLine({ gen: g, notebook: { met: ['rudy'] } } as never, log)).toContain('루시')
    expect(settleGrowth(g, elderDay + 1).log.filter(l => l.kind === 'grew:elder')).toHaveLength(1)
  })
  it('아침 정산과 저장 복원에서도 노년·선택 외형이 유지된다', () => {
    const s = newGame(CONTENT), gen = settleGrowth(family(), elderDay - 1)
    gen.settledDay = elderDay - 1
    const next = settleGen({ ...s, clock: { ...s.clock, day: elderDay }, gen }, CONTENT)
    expect(next.gen!.persons['g-0001'].stage).toBe('elder')
    const restored = sanitizeGen(JSON.parse(JSON.stringify(next.gen)), elderDay)!
    expect(restored.persons['g-0001']).toEqual(next.gen!.persons['g-0001'])
    expect(settleGrowth(restored, elderDay + 3).persons['g-0001'].stage).toBe('elder')
  })
  it('일터를 물려받지 않은 형제도 성인·노년 때 사라지지 않고 어른 크기로 보인다', () => {
    let g = family()
    const sibling = { ...g.persons['g-0001'], id: 'g-0002', name: '노라', born: 15 }
    g.persons[sibling.id] = sibling; g.households['h-1'].children.push(sibling.id)
    for (let d = 10; d <= elderDay + 5; d++) g = settleGrowth(g, d)
    expect(g.persons['g-0002'].stage).toBe('elder')
    expect(companionsOf(g, 'rudy')).toEqual([{ person: g.persons['g-0002'], short: false }])
  })
  it('생성 외형 그대로 노년의 네 방향·걷기 도트를 그리고 피부·옷·발을 보존한다', () => {
    const p = family().persons['g-0001'], avatar = genAvatar(p), opts = { frame: 0 as const, blink: false, avatar }
    const before = structuredClone(p), pal = writerPalette('spring', avatar)
    for (const facing of ['down', 'up', 'left', 'right'] as const) for (let f = 0; f < 3; f++) {
      const adult = generationRows('adult', facing, f, opts), elder = generationRows('elder', facing, f, opts)
      expect(elder).not.toEqual(adult)
      expect(elder.at(-1)).toEqual(adult.at(-1))
      expect(elder.every(r => r.length === 10 && [...r].every(c => c === '.' || pal[c]))).toBe(true)
    }
    expect(p).toEqual(before)
    expect(pal.s).toBe('#b88460')
  })
})

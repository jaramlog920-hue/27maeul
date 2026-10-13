import { CONTENT } from '../content/catalog'
import { ADULT_AT, newChild } from './child'
import type { GameState } from './game'
import { establishedGame } from './growth-test-support'
import { kidWorkOwners, ownerJob, ownerName } from './kid-work'
import { POINTS_PER_HEART } from './hearts'

const adult = (born: number, name: string, job: 'cook' | 'painter' | 'potter') => ({ ...newChild(born, establishedGame(CONTENT, 10).stats, undefined), born, name, job, jobConfirmed: true })

describe('집 겸 일터 주인 (2026-10-14)', () => {
  it('어른이 된 우리 아이 셋 모두 한 채씩 — 지은 아이는 후보에서 빠진다', () => {
    const base = establishedGame(CONTENT, 300)
    const day = 400
    const s: GameState = { ...base, clock: { day, minute: 600 }, child: adult(day - ADULT_AT - 30, '하나', 'cook'), siblings: [adult(day - ADULT_AT - 10, '두리', 'painter'), adult(day - ADULT_AT, '세찬', 'potter')] }
    expect(kidWorkOwners(s).map((o) => o.name)).toEqual(['하나', '두리', '세찬'])
    const built: GameState = { ...s, newland: { builds: [{ id: 'b1', kind: 'kidWork', x: 10, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false, owner: `me:${s.siblings![0].born}` }], tiles: {}, nextId: 2 } as never }
    expect(kidWorkOwners(built).map((o) => o.name)).toEqual(['하나', '세찬'])
    expect(ownerJob(built, `me:${s.siblings![0].born}`)).toBe('painter')
    expect(ownerName(built, `me:${s.siblings![0].born}`)).toBe('두리')
  })
  it('이웃이 낳은 아이도 어른이 되었고 부모와 마음이 다섯 이상이면 — 부모의 일을 잇는다', () => {
    const base = establishedGame(CONTENT, 300)
    const gen = { persons: { baker: { id: 'baker', origin: 'fixed', npc: 'baker', born: null, stage: 'adult', parents: [], spouse: null, household: null }, 'g-0001': { id: 'g-0001', origin: 'born', born: 10, stage: 'adult', name: '로완', parents: ['baker'], spouse: null, household: null } } } as never
    const far: GameState = { ...base, gen, hearts: { ...base.hearts, baker: 0 } }
    expect(kidWorkOwners(far).some((o) => o.owner === 'g-0001')).toBe(false)
    const close: GameState = { ...far, hearts: { ...far.hearts, baker: POINTS_PER_HEART * 5 } }
    const o = kidWorkOwners(close).find((x) => x.owner === 'g-0001')!
    expect(o.name).toBe('로완')
    expect(o.job).toBe('cook')
  })
})

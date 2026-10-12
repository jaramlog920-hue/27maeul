// 기존 생활 시나리오는 개편 이전 저장의 권한으로 검증한다. 새 해금은 late-growth.test.ts에서 검증한다.
import { legacyGame as newGame } from './growth-test-support'
import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { BREAKUP_COOLING, BREAKUP_HEART_CAP, breakUp, canBreakUp, canGiveBouquet, coolingAfterBreakup, type GameState } from './game'
import { NO_ROMANCE } from './romance'
import { canPair, newGenState, type GenState } from './gen'
import { settleOneDay, withPairs } from './gen-settle'

const def = CONTENT.neighbors.find((n) => n.id === 'poppy')!
const dating = (stage: 'dating' | 'engaged' | 'married' = 'dating'): GameState => {
  const g = newGame(CONTENT)
  return { ...g, clock: { ...g.clock, day: 30 }, hearts: { ...g.hearts, poppy: 95 }, romance: { ...NO_ROMANCE, partner: 'poppy', stage, since: 20, weddingDay: stage === 'engaged' ? 33 : null, marriedDay: stage === 'married' ? 25 : null } }
}

describe('헤어지기', () => {
  it('연인·약혼만, 부부는 없다', () => {
    expect(canBreakUp(dating(), 'poppy')).toBe(true)
    expect(canBreakUp(dating('engaged'), 'poppy')).toBe(true)
    expect(canBreakUp(dating('married'), 'poppy')).toBe(false)
    expect(canBreakUp(dating(), 'cosmo')).toBe(false)
    const m = dating('married')
    expect(breakUp(m, 'poppy')).toBe(m)
  })
  it('헤어지면 연애가 비고, 잔치도 없고, 마음은 다섯 하트 아래로', () => {
    const s = breakUp(dating('engaged'), 'poppy')
    expect(s.romance).toEqual(NO_ROMANCE)
    expect(s.hearts.poppy).toBe(BREAKUP_HEART_CAP)
    expect(s.flags['exPartner:poppy']).toBe(30)
  })
  it('14일 동안은 다시 다발을 건네지 못한다', () => {
    let s = breakUp(dating(), 'poppy')
    s = { ...s, hearts: { ...s.hearts, poppy: 90 }, inv: { ...s.inv, bouquet: 1 } }
    expect(coolingAfterBreakup(s, 'poppy')).toBe(true)
    expect(canGiveBouquet(s, def)).toBe('cooling')
    const later = { ...s, clock: { ...s.clock, day: 30 + BREAKUP_COOLING } }
    expect(coolingAfterBreakup(later, 'poppy')).toBe(false)
    expect(canGiveBouquet(later, def)).not.toBe('cooling')
  })
  it('헤어진 사람은 14일 동안 다른 주민과 사귀지 않는다', () => {
    const g: GenState = newGenState(CONTENT, 7, 1, withPairs())
    const partners = Object.keys(g.persons).filter((id) => id !== 'poppy' && canPair(g, null, 'poppy', id))
    expect(partners.length).toBeGreaterThan(0)
    const b = partners[0]
    expect(canPair(g, null, 'poppy', b, (id) => id === 'poppy')).toBe(false)
    // 친한 사이·호감도 가득이어도 유예 중엔 연인이 되지 않는다
    const rid = ['poppy', b].sort().join('|')
    const ready: GenState = { ...g, affinity: { ...g.affinity, [rid]: 90 }, relations: { ...g.relations, [rid]: { id: rid, a: ['poppy', b].sort()[0], b: ['poppy', b].sort()[1], stage: 'friend', since: 1 } } }
    const flags = { 'exPartner:poppy': 5 }
    const held = settleOneDay(ready, 10, { flags }, CONTENT, {})
    expect(held.relations[rid].stage).toBe('friend')
    // 유예가 끝나면 사귈 수 있다 — 연인은 하루 한 쌍·그날 다른 일이 없던 사람만이라 며칠 안에 (2026-10-13 웬델·파피 모습 맞바꿈 뒤 하루 밀림)
    let free = ready
    for (let i = 0; i < 4 && free.relations[rid].stage !== 'lover'; i++) free = settleOneDay(free, 5 + BREAKUP_COOLING + i, { flags }, CONTENT, {})
    expect(free.relations[rid].stage).toBe('lover')
  })
})

import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { BREAKUP_COOLING, BREAKUP_HEART_CAP, breakUp, canBreakUp, canGiveBouquet, coolingAfterBreakup, newGame, type GameState } from './game'
import { NO_ROMANCE } from './romance'
import { canPair, newGenState, type GenState } from './gen'
import { settleOneDay, withPairs } from './gen-settle'

const def = CONTENT.neighbors.find((n) => n.id === 'wendell')!
const dating = (stage: 'dating' | 'engaged' | 'married' = 'dating'): GameState => {
  const g = newGame(CONTENT)
  return { ...g, clock: { ...g.clock, day: 30 }, hearts: { ...g.hearts, wendell: 95 }, romance: { ...NO_ROMANCE, partner: 'wendell', stage, since: 20, weddingDay: stage === 'engaged' ? 33 : null, marriedDay: stage === 'married' ? 25 : null } }
}

describe('헤어지기', () => {
  it('연인·약혼만, 부부는 없다', () => {
    expect(canBreakUp(dating(), 'wendell')).toBe(true)
    expect(canBreakUp(dating('engaged'), 'wendell')).toBe(true)
    expect(canBreakUp(dating('married'), 'wendell')).toBe(false)
    expect(canBreakUp(dating(), 'cosmo')).toBe(false)
    const m = dating('married')
    expect(breakUp(m, 'wendell')).toBe(m)
  })
  it('헤어지면 연애가 비고, 잔치도 없고, 마음은 다섯 하트 아래로', () => {
    const s = breakUp(dating('engaged'), 'wendell')
    expect(s.romance).toEqual(NO_ROMANCE)
    expect(s.hearts.wendell).toBe(BREAKUP_HEART_CAP)
    expect(s.flags['exPartner:wendell']).toBe(30)
  })
  it('14일 동안은 다시 다발을 건네지 못한다', () => {
    let s = breakUp(dating(), 'wendell')
    s = { ...s, hearts: { ...s.hearts, wendell: 90 }, inv: { ...s.inv, bouquet: 1 } }
    expect(coolingAfterBreakup(s, 'wendell')).toBe(true)
    expect(canGiveBouquet(s, def)).toBe('cooling')
    const later = { ...s, clock: { ...s.clock, day: 30 + BREAKUP_COOLING } }
    expect(coolingAfterBreakup(later, 'wendell')).toBe(false)
    expect(canGiveBouquet(later, def)).not.toBe('cooling')
  })
  it('헤어진 사람은 14일 동안 다른 주민과 사귀지 않는다', () => {
    const g: GenState = newGenState(CONTENT, 7, 1, withPairs())
    const partners = Object.keys(g.persons).filter((id) => id !== 'wendell' && canPair(g, null, 'wendell', id))
    expect(partners.length).toBeGreaterThan(0)
    const b = partners[0]
    expect(canPair(g, null, 'wendell', b, (id) => id === 'wendell')).toBe(false)
    // 친한 사이·호감도 가득이어도 유예 중엔 연인이 되지 않는다
    const rid = ['wendell', b].sort().join('|')
    const ready: GenState = { ...g, affinity: { ...g.affinity, [rid]: 90 }, relations: { ...g.relations, [rid]: { id: rid, a: ['wendell', b].sort()[0], b: ['wendell', b].sort()[1], stage: 'friend', since: 1 } } }
    const flags = { 'exPartner:wendell': 5 }
    const held = settleOneDay(ready, 10, { flags }, CONTENT, {})
    expect(held.relations[rid].stage).toBe('friend')
    const free = settleOneDay(ready, 5 + BREAKUP_COOLING, { flags }, CONTENT, {})
    expect(free.relations[rid].stage).toBe('lover')
  })
})

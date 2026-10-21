// 2026-10-22 중반 점검 (순차 점검 둘째 판)
import { festivalOf, isMarketDay, isWet, weatherOf } from './calendar'
import { nextMarketAfter, nextWeddingDay } from './romance'

describe('결혼 잔치 날', () => {
  it('늘 장날이고, 계절 잔치 날·비 오는 날을 비킨다', () => {
    for (let d = 1; d <= 480; d++) {
      const w = nextWeddingDay(d)
      expect(w).toBeGreaterThan(d)
      expect(isMarketDay(w)).toBe(true)
      expect(festivalOf(w)).toBeNull()
      expect(isWet(weatherOf(w))).toBe(false)
    }
  })
  it('겹치지 않는 평범한 장날이면 바로 다음 장날 그대로', () => {
    const plain = Array.from({ length: 200 }, (_, i) => i + 1).find((d) => { const m = nextMarketAfter(d); return !festivalOf(m) && !isWet(weatherOf(m)) })!
    expect(nextWeddingDay(plain)).toBe(nextMarketAfter(plain))
  })
})

describe('주민 연애 속도와 상담 재촉 (2026-10-22 중후반)', () => {
  it('상담을 기다리는 쌍은 사흘마다 소식이 다시 뜨고, 소식은 쌍마다 하나만 남는다', async () => {
    const { CONTENT } = await import('../content/catalog')
    const { newGenState } = await import('./gen')
    const { settleRelations } = await import('./gen-relations')
    const { CONSULT_NUDGE } = await import('./gen-config')
    const base = newGenState(CONTENT, 7, 1, [])
    const [a, b] = Object.keys(base.persons).sort()
    const id = [a, b].sort().join('|')
    let g: import('./gen').GenState = { ...base, affinity: { [id]: 85 }, relations: { [id]: { id, a, b, stage: 'lover' as const, since: 1, consult: { asked: [], answers: [], nextAsk: 20, round: 20 } } } }
    const ctx = { partner: null, busy: () => false }
    for (let d = 20; d <= 20 + CONSULT_NUDGE * 3; d++) g = settleRelations(g, d, ctx)
    const logs = g.log.filter((l) => l.kind === 'consult')
    expect(logs).toHaveLength(1)
    expect(logs[0].day).toBe(20 + CONSULT_NUDGE * 3)
  })
  it('짝이 될 친한 사이는 연인 문턱까지, 연인은 상담 문턱까지만 저절로 가까워진다', async () => {
    const { CONTENT } = await import('../content/catalog')
    const { newGenState, affinityOf, canPair } = await import('./gen')
    const { withPairs } = await import('./gen-settle')
    const { settleRelations } = await import('./gen-relations')
    const { LOVER_AT, CONSULT_AT } = await import('./gen-config')
    const base = newGenState(CONTENT, 7, 1, withPairs())
    const ids = Object.keys(base.persons)
    const [a, b] = ids.flatMap((x) => ids.filter((y) => x < y && canPair(base, null, x, y)).map((y) => [x, y]))[0]
    const id = [a, b].sort().join('|')
    let g: import('./gen').GenState = { ...base, affinity: { ...base.affinity, [id]: LOVER_AT - 0.5 }, relations: { ...base.relations, [id]: { id, a, b, stage: 'friend' as const, since: 1 } } }
    g = settleRelations(g, 30, { partner: null, busy: () => false })
    expect(affinityOf(g, a, b)).toBeLessThanOrEqual(LOVER_AT)
    let lov: import('./gen').GenState = { ...base, affinity: { ...base.affinity, [id]: CONSULT_AT }, relations: { ...base.relations, [id]: { id, a, b, stage: 'lover' as const, since: 1 } } }
    lov = settleRelations(lov, 30, { partner: null, busy: () => false })
    expect(affinityOf(lov, a, b)).toBe(CONSULT_AT)
  })
})

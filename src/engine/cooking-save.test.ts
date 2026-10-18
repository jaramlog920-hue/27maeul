// 요리 저장 정리 (2026-10-18 감사 M-14·L-29)
import { gameAtChapters } from './growth-test-support'
import { CONTENT } from '../content/catalog'
import type { GameState } from './game'
import { canCook, cookOf, knownDish, sanitizeCooking, startCook } from './cooking'
import { featureAccess } from './feature-rules'
import { deserialize, serialize } from './save'

describe('요리 저장', () => {
  it('체험 단계에서 배우지 않고 끓이던 허브차는 다시 불러와도 이어 만든다 (재료는 이미 썼다)', () => {
    let s = gameAtChapters(CONTENT, 15)
    expect(featureAccess(s, 'cooking')).toBe('preview')
    s = { ...s, inv: { ...s.inv, herb: 1, water: 1 } } as GameState
    expect(knownDish(s, 'herbTea')).toBe(false)
    expect(canCook(s, 'herbTea')).toBeNull()
    const started = startCook(s, 'herbTea', () => 0.5)
    expect(cookOf(started).run?.dish).toBe('herbTea')
    const loaded = deserialize(serialize(started), CONTENT)!
    expect(cookOf(loaded).run?.dish).toBe('herbTea')
  })

  it('많이 만든 횟수는 999를 넘어도 0으로 돌아가지 않는다', () => {
    const out = sanitizeCooking({ learned: {}, looks: {}, made: { herbTea: 1500, beanDish: -3, fishDish: 'x' }, meals: 0, breadShape: 0 })!
    expect(out.made.herbTea).toBe(1500)
    expect(out.made.beanDish).toBeUndefined()
    expect(out.made.fishDish).toBeUndefined()
  })
})

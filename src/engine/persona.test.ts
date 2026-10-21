// 성격 (2026-10-21 사용자: 성격 6 + 특성 셋까지 + 말버릇)
import LINES from '../content/persona-lines.json'
import { forbiddenIn } from '../content/forbidden'
import { HELPER_AT, newChild, sanitizeChild, TODDLER_AT, ADULT_AT } from './child'
import { freshStats } from './stats'
import { cleanCatch, genPersona, kidPersona, MAX_TRAITS, personaLine, personaTags, TEMPERS, TRAITS, withCatch } from './persona'

const kid = (born: number, interests = {}) => ({ ...newChild(born, freshStats(), undefined), born, interests })

describe('성격', () => {
  it('대사 파일: 성격 여섯·특성 열 모두 있고 금지어가 없다', () => {
    const d = LINES as unknown as { temperLines: Record<string, unknown>; traitLines: Record<string, unknown> }
    for (const t of TEMPERS) expect(d.temperLines[t]).toBeDefined()
    for (const t of TRAITS) expect(d.traitLines[t]).toBeDefined()
    const all: string[] = []
    const walk = (o: unknown) => { if (typeof o === 'string') all.push(o); else if (o && typeof o === 'object') Object.values(o).forEach(walk) }
    walk(LINES)
    for (const s of all) { expect(forbiddenIn(s), s).toBeNull(); expect(s.includes('당신'), s).toBe(false) }
  })
  it('우리 아이 특성은 걷는 아이 하나 → 돕는 아이 둘 → 어른 셋, 같은 아이면 늘 같다', () => {
    const c = kid(100)
    expect(kidPersona(c, 100 + TODDLER_AT).traits).toHaveLength(1)
    expect(kidPersona(c, 100 + HELPER_AT).traits).toHaveLength(2)
    expect(kidPersona(c, 100 + ADULT_AT).traits).toHaveLength(MAX_TRAITS)
    expect(kidPersona(c, 100 + ADULT_AT)).toEqual(kidPersona(c, 100 + ADULT_AT))
  })
  it('함께한 일이 성격을 정한다 (책·글 → 똑 부러진)', () => {
    expect(kidPersona(kid(10, { scribe: 5, cook: 1 }), 80).temper).toBe('sharp')
    expect(kidPersona({ ...kid(10, { scribe: 5 }), temper: 'easy' }, 80).temper).toBe('easy')
  })
  it('같은 성격이어도 특성 조합이 여러 가지로 나뉜다', () => {
    const combos = new Set(Array.from({ length: 60 }, (_, i) => personaTags(kidPersona(kid(i * 3 + 1), i * 3 + 1 + ADULT_AT))))
    expect(combos.size).toBeGreaterThan(30)
  })
  it('말버릇은 마지막 문장 끝 부호 앞에 붙고, 정리되어 저장된다', () => {
    expect(withCatch('배고파!', '냠냠')).toBe('배고파, 냠냠!')
    expect(withCatch('오늘 비 와', '거든')).toBe('오늘 비 와, 거든.')
    expect(cleanCatch('  라구!! ')).toBe('라구')
    expect(cleanCatch('   ')).toBeUndefined()
    const saved = sanitizeChild({ ...kid(5), temper: 'bold', catch: '좋아' })!
    expect([saved.temper, saved.catch]).toEqual(['bold', '좋아'])
    expect(sanitizeChild({ ...kid(5), temper: 'nope' })!.temper).toBeUndefined()
  })
  it('오늘의 한마디: 자리 글자({parent} 등)가 남지 않고 같은 날이면 같다', () => {
    const p = kidPersona(kid(1), 1 + HELPER_AT)
    for (let d = 1; d < 40; d++) {
      const line = personaLine(p, 'kid', { day: d, minute: d % 2 ? 600 : 1250, weather: d % 3 ? 'sunny' : 'rain', parent: '엄마', salt: 'k' })
      expect(line.length).toBeGreaterThan(0)
      expect(line).not.toMatch(/\{\w+\}/)
      expect(personaLine(p, 'kid', { day: d, minute: d % 2 ? 600 : 1250, weather: d % 3 ? 'sunny' : 'rain', parent: '엄마', salt: 'k' })).toBe(line)
    }
  })
  it('주민 자녀·손주: 태어난 사람만 성격이 있고, 처음부터 있던 이웃은 없다', () => {
    const g = { seed: 7, persons: {
      baker: { id: 'baker', origin: 'fixed', npc: 'baker', parents: [], stage: 'adult' },
      x: { id: 'x', origin: 'born', parents: ['baker'], stage: 'adult' },
      c: { id: 'c', origin: 'born', parents: ['x'], stage: 'child', catch: '히히' },
    } } as never
    expect(genPersona(g, 'baker')).toBeNull()
    expect(genPersona(g, 'x')!.traits).toHaveLength(3)
    expect(genPersona(g, 'c')!.traits).toHaveLength(1)
    expect(genPersona(g, 'c')!.catch).toBe('히히')
  })
})

describe('성격 대사 다듬기 (2026-10-21 검토)', () => {
  it('일이 없으면 일 이야기를 하지 않고 {job} 자리가 비어 보이지 않는다', () => {
    const g = { seed: 3, persons: { x: { id: 'x', origin: 'born', parents: [], stage: 'adult' } } } as never
    const p = genPersona(g, 'x')!
    for (let d = 1; d < 80; d++) {
      const line = personaLine(p, 'villager', { day: d, minute: 600, weather: 'sunny', player: '하람', salt: 'x' })
      expect(line).not.toMatch(/\{\w+\}/)
      expect(line.startsWith(',')).toBe(false)
    }
  })
})

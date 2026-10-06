// 계획 20 작업 10: 친족 판정과 계보 복구
import { CONTENT } from '../content/catalog'
import { closeKin, repairKin } from './gen-kin'
import { newGenState, type GenPerson } from './gen'

const P = (id: string, extra: Partial<GenPerson> = {}): GenPerson => ({ id, origin: 'fixed', npc: id, born: null, stage: 'adult', parents: [], spouse: null, household: null, ...extra })
const map = (...ps: GenPerson[]) => Object.fromEntries(ps.map((p) => [p.id, p]))

describe('친족 판정 (계보 id로만)', () => {
  const people = map(
    P('gp'), P('mom', { parents: ['gp'] }), P('dad'), P('kid', { parents: ['mom', 'dad'] }), P('sis', { parents: ['mom', 'dad'] }),
    P('step', { parents: ['x'] }), P('x', { spouse: 'dad' }), P('stranger'), P('wife'),
  )
  people.dad = { ...people.dad, spouse: 'x' }
  it('부모·자녀·형제자매·조부모·손주', () => {
    expect(closeKin(people, 'mom', 'kid')).toBe(true)
    expect(closeKin(people, 'kid', 'mom')).toBe(true)
    expect(closeKin(people, 'kid', 'sis')).toBe(true)
    expect(closeKin(people, 'gp', 'kid')).toBe(true)
    expect(closeKin(people, 'kid', 'gp')).toBe(true)
  })
  it('의붓 관계도 친족: 의붓부모·의붓 형제', () => {
    expect(closeKin(people, 'kid', 'x')).toBe(true) // 아버지의 배우자
    expect(closeKin(people, 'kid', 'step')).toBe(true) // 의붓 형제
  })
  it('배우자와 배우자의 가까운 친족', () => {
    const p = map(P('a', { spouse: 'b' }), P('b', { spouse: 'a' }), P('c', { parents: ['b'] }), P('d'))
    expect(closeKin(p, 'a', 'b')).toBe(true)
    expect(closeKin(p, 'a', 'c')).toBe(true)
    expect(closeKin(p, 'a', 'd')).toBe(false)
  })
  it('남남과 없는 사람은 친족이 아니다. 자기 자신은 짝이 될 수 없다', () => {
    expect(closeKin(people, 'kid', 'stranger')).toBe(false)
    expect(closeKin(people, 'kid', 'nobody')).toBe(false)
    expect(closeKin(people, 'kid', 'kid')).toBe(true)
  })
  it('이름이 같아도 id가 다르면 친족이 아니다', () => {
    const p = map(P('g-0001', { origin: 'born', name: '루시', parents: ['mom'] }), P('g-0002', { origin: 'born', name: '루시' }), P('mom'))
    expect(closeKin(p, 'g-0001', 'g-0002')).toBe(false)
  })
  it('알려진 친척 표시(조부모·종류 모름)도 친족', () => {
    const p = map(P('old'), P('young', { kin: [{ id: 'old', rel: 'grandparent' }] }), P('aunt', { kin: [{ id: 'young', rel: 'relative' }] }))
    expect(closeKin(p, 'old', 'young')).toBe(true)
    expect(closeKin(p, 'young', 'aunt')).toBe(true)
  })
  it('고정 주민 계보: 목수의 자녀 루디와 대장장이의 자녀 틸리는 지금은 남이고, 두 부모가 부부면 의붓 형제', () => {
    const g = newGenState(CONTENT, 1, 1)
    expect(closeKin(g.persons, 'rudy', 'carpenter')).toBe(true)
    expect(closeKin(g.persons, 'rudy', 'tilly')).toBe(false)
    const wed = { ...g.persons, carpenter: { ...g.persons.carpenter, spouse: 'smith' }, smith: { ...g.persons.smith, spouse: 'carpenter' } }
    expect(closeKin(wed, 'rudy', 'tilly')).toBe(true)
    expect(closeKin(wed, 'smith', 'rudy')).toBe(true)
  })
})

describe('계보 복구', () => {
  const H = (id: string, members: string[], children: string[] = []) => ({ id, members, children })
  it('순환 부모는 그 연결만 끊고 나머지는 둔다', () => {
    const r = repairKin(map(P('a', { parents: ['b'] }), P('b', { parents: ['a'] }), P('c', { parents: ['a'] })), {})
    const loops = ['a', 'b'].filter((id) => r.persons[id].parents.length === 0)
    expect(loops.length).toBeGreaterThan(0)
    expect(r.persons.c.parents).toEqual(['a'])
  })
  it('자기 자신·없는 사람을 부모로 둔 것은 버린다', () => {
    const r = repairKin(map(P('a', { parents: ['a', 'ghost', 'b'] }), P('b')), {})
    expect(r.persons.a.parents).toEqual(['b'])
  })
  it('한쪽만 걸린 배우자: 상대가 비어 있으면 서로 잇고, 상대가 다른 사람이면 끊는다', () => {
    const r = repairKin(map(P('a', { spouse: 'b' }), P('b'), P('c', { spouse: 'd' }), P('d', { spouse: 'e' }), P('e', { spouse: 'd' })), {})
    expect(r.persons.b.spouse).toBe('a')
    expect(r.persons.c.spouse).toBeNull()
    expect(r.persons.d.spouse).toBe('e')
  })
  it('가구: 없는 구성원은 빼고 구성원이 없으면 가구를 버리며 사람 쪽 연결도 맞춘다', () => {
    const people = map(P('a', { household: 'h1' }), P('b', { household: 'h1' }), P('z', { household: 'gone' }))
    const r = repairKin(people, { h1: H('h1', ['a', 'ghost']), h2: H('h2', ['ghost']) })
    expect(r.households.h1.members).toEqual(['a'])
    expect(r.households.h2).toBeUndefined()
    expect(r.persons.b.household).toBeNull() // 구성원도 자녀도 아니다
    expect(r.persons.z.household).toBeNull()
  })
  it('가구 자녀: 부모가 구성원인 태어난 사람만, 사람 쪽에만 걸린 자녀는 목록에 채운다', () => {
    const people = map(P('m'), P('f'), P('k1', { origin: 'born', parents: ['m'], household: 'h1' }), P('k2', { origin: 'born', parents: ['m'], household: 'h1' }), P('x', { origin: 'born', parents: [] }))
    const r = repairKin(people, { h1: H('h1', ['m', 'f'], ['k1', 'x']) })
    expect(r.households.h1.children.sort()).toEqual(['k1', 'k2'])
  })
})

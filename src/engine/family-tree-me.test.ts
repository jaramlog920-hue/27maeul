import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { familyTreeLayout, ME, MY_CHILD, withPlayerFamily } from './family-tree'
import { newGenState } from './gen'
import { NO_ROMANCE } from './romance'

describe('가계도의 우리 가족 (2026-10-12)', () => {
  const g = newGenState(CONTENT, 0, 100)
  it('결혼하고 아이가 있으면 배우자 줄과 우리 아이가 이어진다', () => {
    const s = { romance: { ...NO_ROMANCE, stage: 'married' as const, partner: 'wendell' }, child: { name: '테디', look: 'boy' as const, born: 90 }, avatar: { look: 'f' as const, name: '점검' }, clock: { day: 100 } }
    const t = withPlayerFamily(g, s)
    expect(t.persons[ME].spouse).toBe('wendell')
    expect(t.persons.wendell.spouse).toBe(ME)
    expect(t.persons[MY_CHILD].parents).toEqual([ME, 'wendell'])
    const fromSpouse = familyTreeLayout(t, 'wendell')
    expect(fromSpouse.nodes.find((n) => n.id === ME)?.relation).toBe('spouse')
    expect(fromSpouse.nodes.find((n) => n.id === MY_CHILD)?.relation).toBe('child')
    // 배우자의 부모에겐 손주로
    const parent = t.persons.wendell.parents[0]
    if (parent) expect(familyTreeLayout(t, parent).nodes.find((n) => n.id === MY_CHILD)?.relation).toBe('grandchild')
  })
  it('결혼 전이고 아이도 없으면 넣지 않는다', () => {
    expect(withPlayerFamily(g, { romance: { ...NO_ROMANCE, stage: 'lover' as never, partner: 'wendell' }, child: null, clock: { day: 100 } })).toBe(g)
  })
})

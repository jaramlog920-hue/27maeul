import { CONTENT } from '../content/catalog'
import { inheritBorn, newChild, repairSpouseInheritance } from './child'
import { freshStats } from './stats'
import { newGame } from './game'
import { deserialize, serialize } from './save'

it('모든 결혼 후보는 배우자 쪽 능력치 유전을 제공한다', () => {
  for (const def of CONTENT.neighbors.filter(n => n.romanceable)) {
    expect(def.stat, def.id).toBeDefined()
    expect(inheritBorn(freshStats(), def.stat)).toEqual({ [def.stat!]: 1 })
  }
})

it.each(['merchant', 'presser', 'postman'])('%s의 옛 아이 유전 누락은 저장 복원 때 한 번만 보완한다', id => {
  const s = newGame(CONTENT)
  const stat = CONTENT.neighbors.find(n => n.id === id)!.stat!
  const child = newChild(10, freshStats(), undefined)
  child.stats[stat] = { level: 4, xp: 25, born: 1 }
  const game = { ...s, clock: { day: 20, minute: 600 }, child,
    romance: { partner: id, stage: 'married' as const, since: 1, weddingDay: null, marriedDay: 2 } }
  const restored = deserialize(serialize(game), CONTENT)!
  expect(restored.child!.lean).toBe(stat)
  expect(restored.child!.stats[stat]).toEqual({ level: 4, xp: 25, born: 2 })
  const twice = deserialize(serialize(restored), CONTENT)!
  expect(twice.child!.stats).toEqual(restored.child!.stats)
})

it('이미 유전된 아이나 다른 집안의 아이는 변경하지 않는다', () => {
  const child = newChild(10, freshStats(), 'charm')
  expect(repairSpouseInheritance(child, 'merchant', 'charm')).toBe(child)
  const legacy = newChild(10, freshStats(), undefined)
  expect(repairSpouseInheritance(legacy, 'rudy', 'wit')).toBe(legacy)
})

import { CONTENT } from '../content/catalog'
import { newChild } from './child'
import { doKidAct } from './family'
import { newGame } from './game'
import { freshStats } from './stats'

describe('가족의 실제 첫 경험', () => {
  function ready() {
    const s = newGame(CONTENT)
    return { ...s, scenes: [], clock: { ...s.clock, day: 60, minute: 600 }, child: newChild(10, freshStats(), undefined) }
  }
  it('첫 장난감의 앨범과 경험은 같은 ID로 한 번만 기록한다', () => {
    const first = doKidAct(ready(), 'make', CONTENT)!.state
    expect(first.life?.experiences['fam:make']?.with).toEqual(['family:child'])
    expect(first.life?.experiences['fam:make']?.first).toBe(60)
    const second = doKidAct(first, 'make', CONTENT)!.state
    expect(second.life?.experiences['fam:make']?.count).toBe(1)
    expect(second.scenes.filter(id => id === 'fam:make')).toHaveLength(1)
  })
  it('옛 앨범의 날짜를 새로 만들어 내지 않는다', () => {
    const s = ready()
    const old = { ...s, flags: { ...s.flags, 'fam:make': 1 } }
    expect(doKidAct(old, 'make', CONTENT)!.state.life?.experiences['fam:make']).toBeUndefined()
  })
  it('마을의 물 긷는 아이를 가족 경험의 참여자로 넣지 않는다', () => {
    expect(doKidAct(ready(), 'make', CONTENT)!.state.life?.memories.child).toBeUndefined()
  })
  it('성장한 아이에게 유아 경험을 새로 기록하지 않는다', () => {
    const s = ready()
    expect(doKidAct({ ...s, child: { ...s.child, born: -40 } }, 'make', CONTENT)).toBeNull()
  })
})

// 가족 옷장: 머리·옷·장신구·색은 바뀌고 피부는 그대로
import { CONTENT } from '../content/catalog'
import { withLookDefaults } from './avatar'
import { dressUp, lookOf, newGame } from './game'
import { deserialize, serialize } from './save'

describe('가족 옷장', () => {
  it('나: 머리부터 옷까지 바뀌고 피부·이름은 그대로', () => {
    const s = newGame(CONTENT, withLookDefaults({ look: 'f', name: '하늘', skin: 3 }))
    const want = { ...lookOf(s, 'me', CONTENT)!, skin: 7, hairFront: 2, hairBack: 4, top: 5, name: '다른' }
    const r = dressUp(s, 'me', want, CONTENT)
    const got = lookOf(r, 'me', CONTENT)!
    expect(got.skin).toBe(3)
    expect(got.name).toBe('하늘')
    expect([got.hairFront, got.hairBack, got.top]).toEqual([2, 4, 5])
  })

  it('배우자: 결혼한 뒤에만, 바꾼 모습은 저장했다 불러와도 남는다', () => {
    const s0 = newGame(CONTENT, withLookDefaults({ look: 'f', name: '하늘' }))
    expect(lookOf(s0, 'spouse', CONTENT)).toBeNull()
    const s = { ...s0, romance: { partner: 'wendell', stage: 'married' as const, since: 1, weddingDay: null, marriedDay: 3 } }
    const before = lookOf(s, 'spouse', CONTENT)!
    const r = dressUp(s, 'spouse', { ...before, hairFront: 5, skin: 0 }, CONTENT)
    expect(lookOf(r, 'spouse', CONTENT)!.hairFront).toBe(5)
    expect(lookOf(r, 'spouse', CONTENT)!.skin).toBe(before.skin)
    const back = deserialize(serialize(r), CONTENT)!
    expect(back.looks?.wendell?.hairFront).toBe(5)
  })
})

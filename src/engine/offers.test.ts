import { seededShuffle } from './offers'
import { moveItem } from './scroll'

describe('섞기', () => {
  it('섞기는 원소를 잃지 않고, 같은 씨앗이면 같은 순서', () => {
    expect(seededShuffle([1, 2, 3, 4, 5], 7).sort()).toEqual([1, 2, 3, 4, 5])
    expect(seededShuffle([1, 2, 3, 4, 5], 7)).toEqual(seededShuffle([1, 2, 3, 4, 5], 7))
  })
})

describe('카드 판 한 칸 옮기기', () => {
  it('moveItem은 자리를 바꾸고 범위 밖이면 그대로', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c'])
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c'])
    expect(moveItem(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'b', 'c'])
  })
})

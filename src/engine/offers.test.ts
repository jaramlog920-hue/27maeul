import { currentChapter, offersForDay, seededShuffle } from './offers'
import { canonicalOrder, checkArrangement, moveItem } from './scroll'
import type { Piece } from './types'

const P = (id: string, chapter: number): Piece => ({ id, book: 'lk', ref: '', chapter, title: '', stamps: [] })
const pieces = [P('lk-015-011', 15), P('lk-015-001', 15), P('lk-015-008', 15), P('lk-016-001', 16)]

describe('offers', () => {
  it('지금 장은 다 쓰지 않은 가장 앞 장', () => {
    expect(currentChapter(pieces, [])).toBe(15)
    expect(currentChapter(pieces, [15])).toBe(16)
    expect(currentChapter(pieces, [15, 16])).toBeNull()
  })
  it('같은 날에는 같은 제안, 섞기는 원소를 잃지 않는다', () => {
    const args = { day: 3, pieces, collected: [], chapter: 15, neighborIds: ['a', 'b'] }
    expect(offersForDay(args)).toEqual(offersForDay(args))
    expect(seededShuffle([1, 2, 3, 4, 5], 7).sort()).toEqual([1, 2, 3, 4, 5])
  })
  it('들은 조각과 다른 장 조각은 제안하지 않는다', () => {
    const o = offersForDay({ day: 1, pieces, collected: ['lk-015-001', 'lk-015-008'], chapter: 15, neighborIds: ['a', 'b'] })
    expect(Object.values(o)).toEqual(['lk-015-011'])
  })
  it('이웃 수만큼만, 장이 없으면 없음', () => {
    expect(Object.keys(offersForDay({ day: 1, pieces, collected: [], chapter: 15, neighborIds: ['a'] }))).toEqual(['a'])
    expect(offersForDay({ day: 1, pieces, collected: [], chapter: null, neighborIds: ['a'] })).toEqual({})
  })
  it('며칠이 지나면 모든 조각이 한 번씩 나온다', () => {
    const collected: string[] = []
    for (let day = 1; day <= 10; day++) {
      const o = offersForDay({ day, pieces, collected, chapter: 15, neighborIds: ['a'] })
      if (o.a) collected.push(o.a)
    }
    expect(collected.sort()).toEqual(['lk-015-001', 'lk-015-008', 'lk-015-011'])
  })
})

describe('scroll', () => {
  it('본문 순서', () => {
    expect(canonicalOrder(pieces, 15)).toEqual(['lk-015-001', 'lk-015-008', 'lk-015-011'])
  })
  it('모자람 → 틀림 → 완성', () => {
    const all = ['lk-015-001', 'lk-015-008', 'lk-015-011']
    expect(checkArrangement(pieces, 15, ['lk-015-001'], ['lk-015-001'])).toEqual({ kind: 'missing', missing: 2 })
    expect(checkArrangement(pieces, 15, ['lk-015-008', 'lk-015-001', 'lk-015-011'], all)).toEqual({ kind: 'wrong', firstWrong: 0 })
    expect(checkArrangement(pieces, 15, ['lk-015-001', 'lk-015-008'], all)).toEqual({ kind: 'wrong', firstWrong: 2 })
    expect(checkArrangement(pieces, 15, all, all)).toEqual({ kind: 'done' })
  })
  it('moveItem은 자리를 바꾸고 범위 밖이면 그대로', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c'])
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c'])
    expect(moveItem(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'b', 'c'])
  })
})

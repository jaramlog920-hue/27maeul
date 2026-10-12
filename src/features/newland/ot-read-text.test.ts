// 2026-10-11 구약 점검 2: "헤이즐와 읽기"처럼 받침 있는 이름에 '와'가 붙었다
import { expect, it } from 'vitest'
import { otReadText } from './OtShelf'

it('받침 있는 이름은 "과", 없는 이름은 "와"', () => {
  expect(otReadText('otShelf.readWith', '헤이즐')).toBe('헤이즐과 읽기')
  expect(otReadText('otShelf.readWith', '핀')).toBe('핀과 읽기')
  expect(otReadText('otShelf.readWith', '루디')).toBe('루디와 읽기')
  expect(otReadText('otShelf.readDone', '오웬')).toBe('오웬과 서고에서 한참 함께 읽었다.')
  expect(otReadText('otShelf.readMemory', '파피')).toBe('파피와 함께 읽었다')
})

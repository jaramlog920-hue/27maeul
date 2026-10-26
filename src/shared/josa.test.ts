import { fillSlots, josaFor } from './josa'

it('빈칸 뒤 조사를 받침에 맞춘다', () => {
  expect(fillSlots('{v}로 돌아가요', { v: '아랫섬' })).toBe('아랫섬으로 돌아가요')
  expect(fillSlots('{v}로 돌아가요', { v: '물방아골' })).toBe('물방아골로 돌아가요')
  expect(fillSlots('{v}로 돌아가요', { v: '버들내' })).toBe('버들내로 돌아가요')
  expect(fillSlots('{p}가 오면', { p: '민준' })).toBe('민준이 오면')
  expect(fillSlots('{p}는 좋아', { p: '파피' })).toBe('파피는 좋아')
  expect(fillSlots('{c}와 함께', { c: '아론' })).toBe('아론과 함께')
  expect(fillSlots('{m}를 보태면', { m: '올리브 2' })).toBe('올리브 2를 보태면')
  expect(fillSlots('닢 {n}이 왔어요', { n: 30 })).toBe('닢 30이 왔어요')
})
it('뒤에 한글이 이어지면 조사가 아니다 — 그대로 둔다', () => {
  expect(fillSlots('{p}이에요', { p: '파피' })).toBe('파피이에요')
  expect(fillSlots('{a}가는 길', { a: '민준' })).toBe('민준가는 길')
})
it('없는 빈칸', () => {
  expect(fillSlots('{a}와 {b}', { a: '파피' })).toBe('파피와 ')
  expect(fillSlots('{a}와 {b}', { a: '파피' }, 'keep')).toBe('파피와 {b}')
  expect(josaFor('3', '이')).toBeNull()
})

// 2026-10-11 시간·행사 점검 4: 잔치와 겹친 이웃에 "마을 잔치가 있는 날을 골라 주세요."(반대 뜻)가 나왔다
import { expect, it } from 'vitest'
import { T } from '../../content/text'
import { festBusyText, festErrorText } from './fest-text'

it('이웃이 마을 잔치와 겹쳐 바쁘면 "마을 행사와 겹쳐요"', () => {
  expect(festBusyText('festival')).toBe(T.clubs.errors.festival)
  expect(festErrorText('festival', 'tea')).toBe(T.clubs.errors.festival)
})
it('잔치 준비 역할에서 잔치 날이 아닌 날을 고르면 그대로 "잔치가 있는 날을 골라 주세요"', () => {
  expect(festErrorText('festival', 'festival')).toBe(T.fest.errors.festival)
  expect(festErrorText('members', 'tea')).toBe(T.fest.errors.members)
  expect(festErrorText('market', 'tea')).toBe(T.clubs.errors.market)
})

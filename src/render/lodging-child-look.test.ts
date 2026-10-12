// 2026-10-12 휴대폰 점검 MOB-05 / 손님 점검 14: 공동주택에 독립한 우리 아이는 옷장에서 입힌 모습으로 보여야 한다
import { expect, it } from 'vitest'
import { playerChildAvatar } from './player-child-look'

const kid = { name: '나리', look: 'girl' as const }

it('옷장에서 입힌 모습(머리·옷)과 부모 피부색을 쓴다', () => {
  const a = playerChildAvatar({ child: kid, avatar: { skin: 3 }, looks: { child: { look: 'f', name: '나리', hairFront: 5, top: 7, skin: 1 } } } as never)
  expect(a).toMatchObject({ look: 'f', hairFront: 5, top: 7, skin: 3 })
})
it('옷장을 연 적이 없으면 기본 모습 + 부모 피부색', () => {
  const a = playerChildAvatar({ child: { ...kid, look: 'boy' }, avatar: { skin: 2 } } as never)
  expect(a).toMatchObject({ look: 'm', name: '나리', skin: 2 })
})

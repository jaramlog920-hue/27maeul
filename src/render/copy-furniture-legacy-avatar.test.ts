import { expect, it } from 'vitest'
import { withLookDefaults } from '../engine/avatar'
import { copyFurnitureUseFrame } from './copy-furniture-motion'

it.each(['down','up','left','right'] as const)('옛 저장의 최소 아이 외형도 %s 가구 동작에서 기본값을 채운다', facing => {
  const avatar = { look: 'f' as const, name: '아이' }
  const minimal = copyFurnitureUseFrame('copyChildPicture', facing, 1, { child: { avatar, stage: 'toddler' } })
  const full = copyFurnitureUseFrame('copyChildPicture', facing, 1, { child: { avatar: withLookDefaults(avatar), stage: 'toddler' } })
  expect(minimal.participants.child).toBe(true)
  expect(minimal.layers[2]).toEqual(full.layers[2])
  expect(minimal.layers[2].rows.some(row => /[^.]/.test(row))).toBe(true)
})

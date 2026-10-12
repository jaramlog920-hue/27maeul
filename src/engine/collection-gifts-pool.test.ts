// 2026-10-11 점검(살림 결정 1·서고필사 2·구약 7): 이사 선물·떠나는 노인 선물에 배우자 방 가구·집 붙박이가 섞이면 안 된다
import { expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { collectionGift, COLLECTIBLE_ITEMS, GIFT_ITEMS } from './collection-gifts'
import { newGame } from './game'
import { deserialize, serialize } from './save'

const bad = (id: string) => id.startsWith('spouse:') || /^home[A-Z]/.test(id)

it('선물 후보에는 배우자 가구·붙박이가 없고, 도감 목록은 그대로다', () => {
  expect(COLLECTIBLE_ITEMS.some(bad)).toBe(true)
  expect(GIFT_ITEMS.filter(bad)).toEqual([])
  expect(GIFT_ITEMS.length).toBeGreaterThan(50)
})

it('여러 날·여러 사람의 선물을 뽑아도 배우자 가구가 나오지 않는다', () => {
  const s = newGame(CONTENT)
  for (let day = 1; day <= 200; day++)
    for (const who of ['baker', 'carpenter', 'weaver']) {
      const { item } = collectionGift({ ...s, clock: { ...s.clock, day } }, `moveIn:${who}`)
      expect(bad(item), `${day} ${who} ${item}`).toBe(false)
    }
})

it('이미 받은 저장의 이사 선물 기록에서 배우자 가구는 걸러진다', () => {
  const s = { ...newGame(CONTENT), moveInGifts: { baker: 'spouse:wendell:0', weaver: 'blanket' } } as never
  const back = deserialize(serialize(s), CONTENT)!
  expect(back.moveInGifts).toEqual({ weaver: 'blanket' })
})

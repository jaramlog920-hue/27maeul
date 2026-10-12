import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { ITEM_TEXT } from '../content/text'
import { foundItems } from './achievements'
import { collectionGift, COLLECTIBLE_ITEMS } from './collection-gifts'
import { farewellMorning, goToSleep, moveInMorning, newGame } from './game'
import { deserialize, serialize } from './save'

describe('이사 선물', () => {
  it('선물 후보는 도감의 가구·물건과 일치한다', () => {
    expect(new Set(COLLECTIBLE_ITEMS)).toEqual(new Set(Object.keys(ITEM_TEXT)))
  })
  it('아직 없는 마지막 한 물건을 고르고 과거 획득·보관·배치한 물건은 빼 준다', () => {
    const base = newGame(CONTENT)
    const missing = 'bronzeOrnament'
    const before = { ...base, found: COLLECTIBLE_ITEMS.filter(item => item !== missing), inv: { water: 1 }, chest: { ink: 2 }, pantry: { honeyBread: 1 } }
    const reward = collectionGift(before, 'moveIn:test')
    expect(reward.item).toBe(missing)
    expect(reward.state.inv[missing]).toBe(1)
    expect(reward.state.found).toContain(missing)
    expect(collectionGift(before, 'moveIn:test')).toEqual(reward)
    expect(collectionGift({ ...before, room: [...before.room, { item: missing, x: 1, y: 1 }] }, 'moveIn:test').state.found).toContain(missing)
  })
  it('도감이 가득 차면 기존 물건 중 한 개를 무작위로 더 받는다', () => {
    const base = { ...newGame(CONTENT), found: [...COLLECTIBLE_ITEMS] }
    const reward = collectionGift(base, 'farewell:test')
    expect(COLLECTIBLE_ITEMS).toContain(reward.item)
    expect(reward.state.inv[reward.item]).toBe((base.inv[reward.item] ?? 0) + 1)
  })
  it('한 아침에 두 이웃이 오면 다른 미획득 물건을 받고 다시 지급하지 않는다', () => {
    const base = newGame(CONTENT)
    const arrived = { ...base, flags: { ...base.flags, 'movedIn:carpenter': 1, 'movedIn:apothecary': 1 } }
    const next = moveInMorning(base, arrived, CONTENT)
    const rewards = Object.values(next.moveInGifts ?? {})
    expect(rewards.length).toBeGreaterThanOrEqual(2)
    expect(new Set(rewards).size).toBe(rewards.length)
    for (const item of rewards) expect(foundItems(base)).not.toContain(item)
    expect(moveInMorning(base, next, CONTENT)).toEqual(next)
    expect(deserialize(serialize(next), CONTENT)?.moveInGifts).toEqual(next.moveInGifts)
  })
  it('실제 잠들기 → 책 수에 따른 이사 아침에도 선물을 지급한다', () => {
    const base = newGame(CONTENT)
    const next = goToSleep({ ...base, shelved: { mt: 0 } }, CONTENT)
    expect(next.moveInGifts?.carpenter).toBeTruthy()
    expect(next.flags['moveGift:carpenter']).toBe(next.clock.day)
    expect(goToSleep(next, CONTENT).moveInGifts).toEqual(next.moveInGifts)
  })
  it('이사 가는 이웃의 편지에 미획득 물건 한 개가 남고 저장 뒤에도 중복 지급하지 않는다', () => {
    const base = newGame(CONTENT)
    const gen = { ...base.gen!, retired: { rudy: { heir: 'g-0001', day: 1, moved: 15 } } }
    const next = farewellMorning({ ...base, gen, clock: { ...base.clock, day: 15 } }, CONTENT)
    const gift = next.farewellPopup!.gift
    expect(Object.values(gift)).toEqual([1])
    expect(foundItems(base)).not.toContain(Object.keys(gift)[0])
    expect(farewellMorning(next, CONTENT).inv).toEqual(next.inv)
  })
})

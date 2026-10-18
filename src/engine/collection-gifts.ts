import lifeText from '../content/life-text.json'
import { foundItems, withFound } from './achievements'
import { FURNITURE_DEFS } from './furniture-defs'
import type { GameState } from './game'
import { addGift, TOOLS } from './items'
import { fragmentSeed } from './fragments'
import { mulberry32 } from './offers'
import type { ItemId } from './types'
import { isCopyFurniture } from './copy-furniture'

/** 도감의 가구·생활 물건과 같은 목록. 책 디자인·제작법은 물건 선물에 섞지 않는다. */
export const COLLECTIBLE_ITEMS = [...new Set([...Object.keys(lifeText.items), ...Object.keys(FURNITURE_DEFS)])] as ItemId[]
/** 선물로 고르는 목록: 도감 목록에서 배우자 방 고유 가구(spouse:)와 집 붙박이(home…)를 뺀다 (2026-10-11 사용자 결정) */
export const GIFT_ITEMS = COLLECTIBLE_ITEMS.filter((id) => !id.startsWith('spouse:') && !/^home[A-Z]/.test(id) && !isCopyFurniture(id))

export function collectionGift(s: GameState, source: string): { state: GameState; item: ItemId } {
  const found = foundItems(s)
  const missing = GIFT_ITEMS.filter(item => !found.includes(item))
  const pool = missing.length ? missing : GIFT_ITEMS.filter(item => !TOOLS.includes(item))
  const rng = mulberry32(fragmentSeed(s.clock.day, `${s.gen?.seed ?? 0}:${source}`))
  const item = pool[Math.floor(rng() * pool.length)]
  const inv = addGift(s.inv, { [item]: 1 })
  return { item, state: { ...s, inv, found: withFound(found, inv) } }
}

/** 처음 이사 온 날 한 번만 지급한다. 집을 다시 내어 주거나 저장을 불러와도 반복하지 않는다. */
export function moveInGift(s: GameState, personId: string): GameState {
  if (s.flags[`moveGift:${personId}`]) return s
  const reward = collectionGift(s, `moveIn:${personId}`)
  return {
    ...reward.state,
    flags: { ...s.flags, [`moveGift:${personId}`]: s.clock.day },
    moveInGifts: { ...s.moveInGifts, [personId]: reward.item },
  }
}

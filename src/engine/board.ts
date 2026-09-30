// 의뢰 게시판 (계획 13 작업 5): 사랑방 벽 게시판에 날마다 이웃 부탁 둘.
// 물건 몇 개를 가져다주면 닢과 마음, 가끔 희귀품. 날 씨앗으로 정해 저장하지 않아도 같은 날은 같은 부탁이다.
import { RARE_ITEMS } from './fixtures'
import { mulberry32 } from './offers'
import type { ItemId } from './types'

export interface BoardRequest {
  /** `${day}:${i}` — 끝낸 부탁은 flags[`board:${id}`] */
  id: string
  npc: string
  item: ItemId
  n: number
  coins: number
  rare?: ItemId
}

/** 부탁에 나오는 물건과 한 개 값 (장날 파는 값보다 조금 높게 — 발품 값) */
export const BOARD_ITEMS: Partial<Record<ItemId, number>> = {
  bread: 5,
  oil: 8,
  papyrus: 7,
  ink: 9,
  olive: 3,
  wool: 5,
  fig: 4,
  barley: 3,
  herb: 5,
  honey: 7,
  scentCandle: 10,
}

export const BOARD_SIZE = 2
/** 희귀품을 덤으로 얹는 부탁의 몫 */
export const BOARD_RARE_CHANCE = 0.25
/** 부탁을 들어주면 오르는 마음 */
export const BOARD_GAIN = 3

/**
 * 오늘 게시판의 부탁. npcs: 지금 마을에 사는 이웃과 그들이 좋아하는 것 —
 * 반쯤은 자기가 좋아하는 것을 부탁한다 (수첩의 ? 칸을 채우는 실마리)
 */
export function boardFor(day: number, npcs: readonly { id: string; likes: readonly ItemId[] }[]): BoardRequest[] {
  const rnd = mulberry32(day * 4231 + 17)
  const pool = [...npcs]
  const items = Object.keys(BOARD_ITEMS) as ItemId[]
  const out: BoardRequest[] = []
  for (let i = 0; i < BOARD_SIZE && pool.length; i++) {
    const who = pool.splice(Math.floor(rnd() * pool.length), 1)[0]
    const liked = who.likes.filter((x) => BOARD_ITEMS[x] !== undefined)
    const item = liked.length && rnd() < 0.5 ? liked[Math.floor(rnd() * liked.length)] : items[Math.floor(rnd() * items.length)]
    const n = 2 + Math.floor(rnd() * 3)
    const coins = Math.round(BOARD_ITEMS[item]! * n * 1.4)
    const rare = rnd() < BOARD_RARE_CHANCE ? RARE_ITEMS[Math.floor(rnd() * RARE_ITEMS.length)] : undefined
    out.push({ id: `${day}:${i}`, npc: who.id, item, n, coins, ...(rare ? { rare } : {}) })
  }
  return out
}

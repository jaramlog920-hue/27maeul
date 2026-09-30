import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { boardFor, BOARD_GAIN } from './board'
import {
  boardToday,
  buyRare,
  canBuyRare,
  canCraft,
  canFulfillBoard,
  canSell,
  finishCraft,
  fulfillBoard,
  giveGift,
  newGame,
  RARE_PRICES,
  rareStall,
  sell,
  type GameState,
} from './game'
import { RARE_ITEMS } from './fixtures'
import { PLACES, placeAt } from './world'
import type { NeighborDef } from './types'

const def = (id: string) => CONTENT.neighbors.find((n) => n.id === id) as NeighborDef
const on = (s: GameState, day: number, minute = 600): GameState => ({ ...s, clock: { ...s.clock, day, minute } })

describe('장날 희귀 좌판 (계획 13 작업 2)', () => {
  it('장날마다 희귀품 셋, 같은 날은 늘 같다', () => {
    const a = rareStall(7)
    expect(a).toHaveLength(3)
    expect(new Set(a).size).toBe(3)
    expect(rareStall(7)).toEqual(a)
    for (const x of a) expect(RARE_ITEMS).toContain(x)
    // 여러 장날에 걸쳐 다섯 가지가 모두 나온다
    const seen = new Set([7, 14, 21, 28, 35, 42, 49, 56].flatMap(rareStall))
    expect(seen.size).toBe(RARE_ITEMS.length)
  })

  it('닢으로 한 가지씩 하나만, 장날에만', () => {
    const item = rareStall(7)[0]
    const s = on({ ...newGame(CONTENT), coins: 500 }, 7)
    expect(canBuyRare(on(s, 8), item)).toBe('notMarket')
    const got = buyRare(s, item)!
    expect(got.coins).toBe(500 - RARE_PRICES[item]!)
    expect((got.inv[item] ?? 0) + (got.chest[item] ?? 0)).toBe(1)
    expect(canBuyRare(got, item)).toBe('bought')
    expect(canBuyRare({ ...s, coins: 1 }, item)).toBe('coins')
  })
})

describe('판매용 생산물과 향초 (계획 13 작업 4)', () => {
  it('작업대에서 기름 1 + 양털 1 → 향초 2', () => {
    const s = { ...newGame(CONTENT), inv: { oil: 1, wool: 1 } }
    expect(canCraft(s, 'scentCandle')).toBeNull()
    const made = finishCraft(s, 'scentCandle')
    expect(made.inv.scentCandle).toBe(2)
    expect(made.inv.oil ?? 0).toBe(0)
  })

  it('올리브·양털·포도·기름·향초·꿀을 장날에 판다', () => {
    const s = on({ ...newGame(CONTENT), inv: { scentCandle: 1, honey: 1, wool: 1 }, lettersDone: 99, shelved: { mk: 0 } }, 7)
    for (const id of ['scentCandle', 'honey', 'wool'] as const) expect(canSell(s, id)).toBeNull()
    expect(sell(s, 'scentCandle')!.coins).toBeGreaterThan(s.coins)
  })

  it('향유는 누구나 반기는 선물', () => {
    const s = { ...newGame(CONTENT), inv: { perfumeOil: 1 } }
    expect(giveGift(s, def('smith'), 'perfumeOil')!.liked).toBe(true)
  })
})

describe('의뢰 게시판 (계획 13 작업 5)', () => {
  it('날마다 서로 다른 이웃의 부탁 둘, 같은 날은 같다', () => {
    const s = newGame(CONTENT)
    const a = boardToday(s, CONTENT)
    expect(a).toHaveLength(2)
    expect(a[0].npc).not.toBe(a[1].npc)
    expect(boardToday(s, CONTENT)).toEqual(a)
    for (const r of a) expect(r.coins).toBeGreaterThan(0)
  })

  it('장날에만 오는 상인과 이사 오지 않은 이웃은 부탁하지 않는다', () => {
    const s = newGame(CONTENT)
    for (let d = 1; d < 60; d++) for (const r of boardToday(on(s, d), CONTENT)) expect(r.npc).not.toBe('merchant')
  })

  it('물건을 건네면 닢·마음·(덤) 희귀품, 하루 한 번', () => {
    const [r] = boardFor(3, [{ id: 'baker', likes: ['grapes'] }])
    let s = on({ ...newGame(CONTENT), inv: { [r.item]: r.n } }, 3)
    expect(canFulfillBoard(s, r)).toBeNull()
    s = fulfillBoard(s, r)!
    expect(s.coins).toBe(newGame(CONTENT).coins + r.coins)
    expect(s.hearts.baker).toBe(BOARD_GAIN)
    expect(canFulfillBoard(s, r)).toBe('done')
    expect(canFulfillBoard(on(newGame(CONTENT), 3), r)).toBe('needs')
  })

  it('게시판은 사랑방 벽에 있다', () => {
    expect(placeAt(PLACES.hallBoard.tiles[0])).toBe('hallBoard')
  })
})

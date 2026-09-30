import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { boardFor, BOARD_GAIN } from './board'
import {
  boardToday,
  buyRare,
  canBuyRare,
  canTrip,
  takeTrip,
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
import { DESTS, tripCost } from './travel'
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

describe('이웃 마을 여행 (계획 13 작업 6)', () => {
  it('나루의 배에서 떠난다', () => {
    expect(placeAt(PLACES.boat.tiles[0])).toBe('boat')
  })

  it('배를 타고 가서 사고, 하룻밤 묵고 다음 날 아침 돌아온다', () => {
    const s = { ...newGame(CONTENT), coins: 200 }
    const back = takeTrip(s, CONTENT, 'harbor', ['perfumeOil'])!
    expect(back.clock.day).toBe(s.clock.day + 1)
    expect(back.coins).toBe(200 - tripCost(DESTS.harbor, ['perfumeOil']))
    expect((back.inv.perfumeOil ?? 0) + (back.chest.perfumeOil ?? 0)).toBe(1)
    expect(back.flags['trip:harbor']).toBe(1)
    const warm = back.hearts.wendell
    expect(warm).toBeGreaterThan(0)
    expect(back.album.some((a) => a.id === 'trip:harbor')).toBe(true)
    // 두 번째는 이야기·마음 없이
    const again = takeTrip({ ...back, coins: 200 }, CONTENT, 'harbor')!
    expect(again.hearts.wendell).toBe(warm)
    expect(again.flags['trip:harbor']).toBe(2)
  })

  it('걸어가면 길양식이 든다, 정오가 지나면 못 떠난다, 닢이 모자라면 못 떠난다', () => {
    const s = { ...newGame(CONTENT), coins: 100, inv: {} }
    expect(canTrip(s, 'hillTown')).toBe('food')
    expect(canTrip({ ...s, inv: { bread: 2 } }, 'hillTown')).toBeNull()
    expect(canTrip(on({ ...s, inv: { bread: 2 } }, 1, 13 * 60), 'hillTown')).toBe('late')
    expect(canTrip({ ...s, coins: 5 }, 'harbor')).toBe('coins')
  })
})

describe('여행 주사위 보드게임', () => {
  it('스무 번 안에 끝나고, 한 바퀴를 돌면 바로 끝난다', async () => {
    const { NEW_BOARD, playTurn, TRIP_TURNS, BOARD } = await import('./trip-board')
    let b = NEW_BOARD
    const rnd = () => 0.5
    const ctx = { withChild: false, nextPiece: () => null }
    for (let i = 0; i < 30 && !b.done; i++) b = playTurn(b, 1, rnd, ctx).board
    expect(b.done).toBe(true)
    expect(b.turn).toBe(TRIP_TURNS)
    expect(b.lapped).toBe(false)
    let c = NEW_BOARD
    for (let i = 0; i < 30 && !c.done; i++) c = playTurn(c, 6, rnd, ctx).board
    expect(c.lapped).toBe(true)
    expect(c.turn).toBe(Math.ceil(BOARD.length / 6))
  })

  it('성경 칸은 지금 책의 다음 조각을 준다 (같은 조각을 두 번 주지 않는다)', async () => {
    const { chooseBook, nextTripPiece } = await import('./game')
    const s = chooseBook(newGame(CONTENT), 'lk', CONTENT)
    const a = nextTripPiece(s, CONTENT)!
    expect(a.startsWith('lk-001-')).toBe(true)
    expect(nextTripPiece(s, CONTENT, [a])).not.toBe(a)
    expect(nextTripPiece(newGame(CONTENT), CONTENT)).toBeNull()
  })

  it('돌아오면 얻은 것을 한꺼번에: 조각·능력치·재료·닢, 아이 능력치', async () => {
    const { applyTripRewards, chooseBook, nextTripPiece } = await import('./game')
    const { freshStats } = await import('./stats')
    let s = chooseBook(newGame(CONTENT), 'lk', CONTENT)
    s = { ...s, child: { name: '핀', look: 'boy', born: 1, stats: freshStats(), lean: null } }
    const piece = nextTripPiece(s, CONTENT)!
    const r = applyTripRewards(s, [
      { kind: 'piece', id: piece },
      { kind: 'stat', who: 'me', stat: 'luck', xp: 8 },
      { kind: 'stat', who: 'child', stat: 'hand', xp: 8 },
      { kind: 'items', items: { fig: 2 } },
      { kind: 'coins', n: 12 },
    ], CONTENT)
    expect(r.collected).toContain(piece)
    expect(r.stats.luck.xp).toBeGreaterThan(0)
    expect(r.child!.stats.hand.xp).toBeGreaterThan(0)
    expect((r.inv.fig ?? 0) + (r.chest.fig ?? 0)).toBe((s.inv.fig ?? 0) + (s.chest.fig ?? 0) + 2)
    expect(r.coins).toBe(s.coins + 12)
  })
})

describe('여행 판 동네 (새 장면)', () => {
  it('돌판 24개는 둘레 길 위에 1–2칸씩 띄워 놓이고, 걸어가는 길은 늘 흙길', async () => {
    const { BOARD, RING_TILES, stoneRingIndex, stoneTile, tripLayout, walkPath } = await import('./trip-board')
    for (const dest of ['harbor', 'hillTown'] as const) {
      const map = tripLayout(dest).map
      const idx = BOARD.map((_, i) => stoneRingIndex(i))
      expect(new Set(idx).size).toBe(BOARD.length)
      for (let i = 1; i < idx.length; i++) expect(idx[i] - idx[i - 1]).toBeGreaterThanOrEqual(2)
      for (let i = 0; i < BOARD.length; i++) expect(map[stoneTile(i).y][stoneTile(i).x]).toBe(',')
      for (const t of RING_TILES) expect(map[t.y][t.x]).toBe(',')
    }
    const path = walkPath(22, 4)
    expect(path.at(-1)).toEqual(stoneTile(0))
    expect(walkPath(0, 3).at(-1)).toEqual(stoneTile(3))
  })
})

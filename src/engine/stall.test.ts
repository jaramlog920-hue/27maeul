import { describe, expect, it } from 'vitest'
import { CONTENT, PEOPLE } from '../content/catalog'
import { T } from '../content/text'
import { canSell, newGame, sell, SELL_CAP, SELL_PRICES, type GameState } from './game'
import { isMarketDay, isWet, weatherOf } from './calendar'
import { TOOLS } from './items'
import { deserialize, serialize } from './save'
import { isWalkable, tileAt, VILLAGE_H, WIDTH, PLACES } from './world'
import { FESTIVAL_SPOTS } from './neighbors'
import { EXPERIENCE_KINDS } from './people'
import {
  answerGuest, BUYERS, buys, canOpenStall, closeStall, expireStall, guestText, openStall, regularOf, sanitizeStall, stallGoodsAvailable, stallPrice, stallSceneNow, stallStatus, stallVisitors, waitAtStall, welcomeGuest,
  DEFAULT_LOOK, STALL_COIN_CAP, STALL_FROM, STALL_GOODS, STALL_GOODS_MAX, STALL_GUEST_SPOT, STALL_PER_GOOD, STALL_SALES, STALL_SPOT, STALL_STAND, STALL_TO, STALL_VISITORS,
  type StallWay,
} from './stall'

const dryMarket = (from = 7): number => { for (let d = from; d < 800; d += 7) if (isMarketDay(d) && !isWet(weatherOf(d))) return d; throw new Error('맑은 장날 없음') }
const MARKET = dryMarket()
const everyone = Object.fromEntries(CONTENT.neighbors.map((n) => [`movedIn:${n.id}`, 1]))
const SKILLS = { clothColor: { day: 1, from: 'weaver', picked: 'blue' }, snackShape: { day: 1, from: 'baker', picked: 'round' }, flowerKeep: { day: 1, from: 'juniper', picked: 'warm' }, basketCare: { day: 1, from: 'grandpa', picked: 'plain' } }
/** 맑은 장날 오전, 좌판 자리에 서서 가방에 상품이 있고, 마을 사람들이 나와 있다 */
function market(day = MARKET, minute = 600): GameState {
  const s = newGame(CONTENT)
  const npcs = Object.fromEntries(CONTENT.neighbors.map((n) => [n.id, { ...s.npcs[n.id], x: 22 + (n.id.length % 5), y: 19, visible: true }]))
  return {
    ...s,
    clock: { day, minute },
    coins: 10,
    player: { ...s.player, x: STALL_STAND.x, y: STALL_STAND.y },
    flags: { ...s.flags, villageLevel: 10, ...everyone },
    inv: { scentCandle: 4, honey: 3, cushion: 2, blanket: 1, herb: 2, ink: 5, papyrus: 5, cover: 2 },
    skills: SKILLS,
    npcs: { ...s.npcs, ...npcs },
  } as unknown as GameState
}
const only = (s: GameState, ids: string[]): GameState => ({ ...s, npcs: Object.fromEntries(Object.entries(s.npcs).map(([id, n]) => [id, { ...n, visible: ids.includes(id) }])) as GameState['npcs'] })
const PICKS = [{ item: 'scentCandle' as const, qty: 3, price: 'normal' as const }, { item: 'cushion' as const, qty: 2, price: 'normal' as const }]
const opened = (s = market(), picks = PICKS) => openStall(s, picks, DEFAULT_LOOK)
const serve = (s: GameState, way: StallWay): GameState => answerGuest(welcomeGuest(s, CONTENT), way)

describe('좌판 자리와 상품 목록', () => {
  it('좌판 자리는 광장 위쪽 빈 칸 — 길·문·상인 좌판·우물·잔치 자리를 막지 않는다', () => {
    const tiles = Array.from({ length: 6 }, (_, i) => ({ x: STALL_SPOT.x + (i % 3), y: STALL_SPOT.y + Math.floor(i / 3) }))
    for (const t of tiles) {
      expect(t.x >= 18 && t.x <= 31 && t.y >= 12 && t.y <= 23).toBe(true)
      expect(t.x === 24 || t.x === 25).toBe(false)
      expect(t.y === 17 || t.y === 18).toBe(false)
      expect(tileAt(t.x, t.y)).toBe(',')
      expect(Object.values(FESTIVAL_SPOTS).some((f) => f.x === t.x && f.y === t.y)).toBe(false)
      expect(PLACES.well.tiles.some((w) => w.x === t.x && w.y === t.y)).toBe(false)
    }
    for (let x = 0; x < WIDTH; x++) for (let y = 0; y < VILLAGE_H; y++) if (tileAt(x, y) === 'm') expect(tiles.some((t) => t.x === x && t.y === y)).toBe(false)
    expect(isWalkable(STALL_STAND)).toBe(true)
    expect(isWalkable(STALL_GUEST_SPOT)).toBe(true)
    // 좌판 칸을 막힌 칸으로 쳐도 마을의 걸을 수 있는 칸이 그대로 이어진다 (그림일 뿐이지만 막는다고 가정해도 안전)
    const blocked = new Set(tiles.map((t) => `${t.x},${t.y}`))
    const reach = (block: Set<string>) => {
      const seen = new Set<string>([`${STALL_STAND.x},${STALL_STAND.y}`])
      const q = [STALL_STAND]
      while (q.length) {
        const c = q.pop()!
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = { x: c.x + dx, y: c.y + dy }, k = `${n.x},${n.y}`
          if (n.x < 0 || n.y < 0 || n.x >= WIDTH || n.y >= VILLAGE_H || seen.has(k) || block.has(k) || !isWalkable(n)) continue
          seen.add(k); q.push(n)
        }
      }
      return seen
    }
    const before = reach(new Set()), after = reach(blocked)
    for (const k of before) if (!blocked.has(k)) expect(after.has(k)).toBe(true)
  })
  it('상품은 만들거나 거둔 생활 물건뿐 — 쓰기 재료·말씀 관련·도구·집 가구 값은 없다', () => {
    const banned = ['ink', 'papyrus', 'cover', 'creamPaper', 'fineThread', 'finePapyrus', 'sealWax', 'scrolls', 'inkpot', 'inkJar', 'goldLeaf', 'bouquet', 'promiseCord']
    for (const g of STALL_GOODS) {
      expect(banned).not.toContain(g)
      expect(TOOLS).not.toContain(g)
      expect(String(g).startsWith('spouse:') || String(g).startsWith('home')).toBe(false)
      const name = (T.items as Record<string, { name: string }>)[g]?.name ?? ''
      expect(name).toBeTruthy()
      expect(name).not.toMatch(/말씀|조각|필사|성경|두루마리|원고/)
    }
    const s = market()
    expect(stallGoodsAvailable(s).map((g) => g.item).sort()).toEqual(['blanket', 'cushion', 'herb', 'honey', 'scentCandle'])
    // 가방에 있어도 쓰기 재료는 올릴 수 없다
    const forced = openStall(s, [{ item: 'ink', qty: 3, price: 'normal' } as never, { item: 'cover', qty: 1, price: 'normal' } as never], DEFAULT_LOOK)
    expect(forced).toBe(s)
    // 배우지 않은 기술의 물건은 올릴 수 없다
    expect(stallGoodsAvailable({ ...s, skills: {} }).map((g) => g.item)).not.toContain('cushion')
  })
  it('손님 취향은 모든 이웃에 있고 선물 취향과 따로이며, 구경만 하는 이웃이 있다', () => {
    for (const n of CONTENT.neighbors) expect(BUYERS[n.id], n.id).toBeTruthy()
    for (const b of Object.values(BUYERS)) for (const w of b.wants) expect(STALL_GOODS).toContain(w)
    expect(BUYERS.child.browseOnly && BUYERS.merchant.browseOnly).toBe(true)
  })
  it('이웃 대사에 좌판 한 줄이 있고 상인 말투는 반말이다', () => {
    const lines = Object.entries(PEOPLE.people).filter(([, p]) => p.stallLines)
    expect(lines.length).toBeGreaterThanOrEqual(10)
    for (const [, p] of lines) for (const v of Object.values(p.stallLines!)) expect(v).not.toMatch(/필사가님|죄책/)
    for (const v of Object.values(PEOPLE.people.merchant.stallLines!)) expect(v).not.toMatch(/군요|당신/)
  })
  it('경험 종류에 좌판이 있다', () => { expect(EXPERIENCE_KINDS).toContain('stall') })
})

describe('여는 조건 — 불이익 없이', () => {
  it('장날 맑은 날 아침 이후 좌판 곁에서만 열린다', () => {
    const s = market()
    expect(canOpenStall(s)).toBeNull()
    expect(canOpenStall({ ...s, clock: { day: MARKET + 1, minute: 600 } })).toBe('notMarket')
    expect(canOpenStall({ ...s, clock: { day: MARKET, minute: STALL_FROM - 60 } })).toBe('early')
    expect(canOpenStall({ ...s, clock: { day: MARKET, minute: STALL_TO - 20 } })).toBe('late')
    expect(canOpenStall({ ...s, player: { ...s.player, x: 5, y: 30 } })).toBe('away')
    expect(canOpenStall({ ...s, inv: {} })).toBe('none')
    // 비 오는 날은 접어 둔다 (장날이어도)
    let rain = 0
    for (let d = 7; d < 800 && !rain; d += 7) if (isWet(weatherOf(d))) rain = d
    expect(rain).toBeGreaterThan(0)
    expect(canOpenStall({ ...s, clock: { day: rain, minute: 600 } })).toBe('wet')
  })
  it('열지 않아도 아무 일이 없다 — 마감도 정산도 벌어지지 않는다', () => {
    const s = market()
    const later = { ...s, clock: { day: MARKET + 7, minute: 600 } }
    expect(later.stall).toBeUndefined()
    expect(expireStall(later)).toBe(later)
    expect(canOpenStall(later)).toBeNull()
  })
  it('열면 가방에서 좌판으로 옮겨지고 스무 분이 걸리며 외형이 남는다', () => {
    const s = market()
    const o = opened(s)
    expect(o.stall!.goods).toEqual([{ item: 'scentCandle', qty: 3, left: 3, price: 'normal' }, { item: 'cushion', qty: 2, left: 2, price: 'normal' }])
    expect(o.inv.scentCandle).toBe(1)
    expect(o.inv.cushion).toBeUndefined()
    expect(o.clock.minute - s.clock.minute).toBe(20)
    expect(o.stallLook).toEqual(DEFAULT_LOOK)
    // 같은 날 두 번 열 수 없다
    expect(openStall(o, PICKS, DEFAULT_LOOK)).toBe(o)
    // 상품은 셋·한 가지 네 개까지
    const rich = { ...s, inv: { scentCandle: 9, honey: 9, herb: 9, cushion: 9, blanket: 9 } } as GameState
    const many = openStall(rich, ['scentCandle', 'honey', 'herb', 'cushion'].map((item) => ({ item: item as never, qty: 9, price: 'normal' as const })), { sign: 2, cloth: 'rose', deco: 'plant' })
    expect(many.stall!.goods).toHaveLength(STALL_GOODS_MAX)
    expect(many.stall!.goods.every((g) => g.qty === STALL_PER_GOOD)).toBe(true)
    expect(many.stallLook).toEqual({ sign: 2, cloth: 'rose', deco: 'plant' })
    // 틀린 외형은 기본으로
    expect(openStall(s, PICKS, { sign: 99, cloth: 'x', deco: 'y' } as never).stallLook).toEqual(DEFAULT_LOOK)
    // 하나도 고르지 못하면 열지 않는다
    expect(openStall(s, [{ item: 'cushion', qty: 0, price: 'normal' }], DEFAULT_LOOK)).toBe(s)
  })
})

describe('가격과 경제', () => {
  it('값은 상인 표에서 시작해 작은 범위만, 높다고 늘 이득은 아니다', () => {
    const s = market()
    for (const item of STALL_GOODS) {
      const low = stallPrice(s, item, 'low'), mid = stallPrice(s, item, 'normal'), high = stallPrice(s, item, 'high')
      expect(low).toBeLessThanOrEqual(mid)
      expect(high).toBeGreaterThanOrEqual(mid)
      expect(high).toBeLessThanOrEqual(Math.ceil(mid * 1.3))
      expect(high).toBeLessThan(40)
    }
    expect(stallPrice(s, 'scentCandle', 'normal')).toBe(SELL_PRICES.scentCandle)
    // 높은 값은 찾던 것을 알맞게 맞이해야만 산다
    expect(buys(2, 'high', 'talk', 'talk')).toBe(true)
    expect(buys(2, 'high', 'wait', 'talk')).toBe(false)
    expect(buys(1, 'high', 'talk', 'talk')).toBe(false)
    expect(buys(1, 'normal', 'talk', 'talk')).toBe(true)
    expect(buys(1, 'normal', 'wait', 'talk')).toBe(false)
    expect(buys(2, 'normal', 'wait', 'talk')).toBe(true)
    expect(buys(1, 'low', 'wait', 'talk')).toBe(true)
    expect(buys(0, 'low', 'talk', 'talk')).toBe(false)
  })
  it('하루 한도가 상인 판매 한도와 따로 있고 더 작다', () => {
    expect(STALL_SALES).toBeLessThan(SELL_CAP)
    expect(STALL_COIN_CAP).toBeLessThanOrEqual(SELL_CAP * 9)
    expect(STALL_VISITORS).toBeLessThanOrEqual(8)
  })
})

describe('손님과 판매', () => {
  it('손님은 마을에 나와 있고 이사 온 이웃만, 한 사람은 하루 한 번', () => {
    const s = opened()
    const v = stallVisitors(s, CONTENT)
    expect(v.length).toBeGreaterThan(5)
    const hidden = { ...s, npcs: { ...s.npcs, [v[0]]: { ...s.npcs[v[0]], visible: false } } }
    expect(stallVisitors(hidden, CONTENT)).not.toContain(v[0])
    // 아직 이사 오지 않은 이웃은 오지 않는다
    const early = { ...s, flags: { ...s.flags, villageLevel: 0, ...Object.fromEntries(CONTENT.neighbors.map((n) => [`movedIn:${n.id}`, 0])) } }
    for (const id of stallVisitors(early, CONTENT)) {
      const d = CONTENT.neighbors.find((n) => n.id === id)!
      expect(d.joinsAt === undefined && d.joinsAtBooks === undefined && !d.joinsWithFamily).toBe(true)
    }
    // 같은 날 두 번 오지 않는다
    let n = welcomeGuest(s, CONTENT)
    const first = n.stall!.guest!.npc
    n = answerGuest(n, 'talk')
    expect(stallVisitors(n, CONTENT)).not.toContain(first)
    expect(welcomeGuest(n, CONTENT).stall!.guest!.npc).not.toBe(first)
  })
  it('손님을 맞아 응대하면 재고·닢·경험이 한 번씩 바뀐다', () => {
    const s = opened()
    const w = welcomeGuest(s, CONTENT)
    const g = w.stall!.guest!
    expect(g.phase).toBe('look')
    const buyer = BUYERS[g.npc]
    const wanted = s.stall!.goods.find((x) => buyer.wants.includes(x.item))
    expect(g.item).toBe(wanted?.item ?? s.stall!.goods[0].item)
    const a = answerGuest(w, buyer.way)
    if (!buyer.browseOnly) {
      expect(a.stall!.sold).toHaveLength(1)
      expect(a.stall!.goods.reduce((n, x) => n + x.left, 0)).toBe(s.stall!.goods.reduce((n, x) => n + x.left, 0) - 1)
      expect(a.coins).toBe(s.coins + a.stall!.sold[0].coins)
      expect(a.life.experiences[`stallBuy:${g.npc}`]).toMatchObject({ kind: 'stall', item: g.item, count: 1 })
    }
    expect(a.life.experiences[`stall:${g.npc}`]).toMatchObject({ kind: 'stall', with: [g.npc], count: 1 })
    expect(a.stall!.served).toEqual([g.npc])
    expect(a.clock.minute - w.clock.minute).toBe(15)
    // 이미 응대한 손님에게 한 번 더 답해도 바뀌지 않는다
    expect(answerGuest(a, buyer.way)).toBe(a)
  })
  it('구경만 하는 손님은 사지 않고 마음·닢·재고 그대로', () => {
    const s = only(opened(), ['child', 'merchant'])
    const a = serve(s, 'talk')
    expect(['child', 'merchant']).toContain(a.stall!.guest!.npc)
    expect(a.stall!.guest!.result).toBe('looked')
    expect(a.stall!.sold).toHaveLength(0)
    expect(a.coins).toBe(s.coins)
    expect(a.hearts).toEqual(s.hearts)
    expect(a.stall!.goods).toEqual(s.stall!.goods)
  })
  it('사지 않는 응대로도 사이는 나빠지지 않는다', () => {
    const s = opened()
    const w = welcomeGuest(s, CONTENT)
    const g = w.stall!.guest!
    const theirs = BUYERS[g.npc].way
    const wrong = (['explain', 'talk', 'wait'] as StallWay[]).find((x) => x !== theirs)!
    const a = answerGuest(w, wrong)
    expect(a.hearts).toEqual(w.hearts)
    expect(a.life.cool).toEqual(w.life.cool)
    expect(a.stall!.guest!.phase).toBe('done')
  })
  it('하루 손님 수·판매 개수·닢 한도를 넘지 않는다', () => {
    const rich = { ...market(), inv: { scentCandle: 9, honey: 9, herb: 9 } } as GameState
    let s = openStall(rich, [{ item: 'scentCandle', qty: 4, price: 'low' }, { item: 'honey', qty: 4, price: 'low' }, { item: 'herb', qty: 4, price: 'low' }], DEFAULT_LOOK)
    let guard = 0
    while (guard++ < 40) {
      const st = stallStatus(s, CONTENT)
      if (st === 'ready') s = serve(s, 'talk')
      else if (st === 'quiet') s = waitAtStall(s, CONTENT)
      else break
    }
    const st = s.stall!
    expect(st.served.length).toBeLessThanOrEqual(STALL_VISITORS)
    expect(st.sold.length).toBeLessThanOrEqual(STALL_SALES)
    expect(st.earned).toBeLessThanOrEqual(STALL_COIN_CAP)
    expect(s.coins - 10).toBe(st.earned)
    expect(st.earned).toBe(st.sold.reduce((n, x) => n + x.coins, 0))
    expect(new Set(st.served).size).toBe(st.served.length)
    expect(st.served.length).toBeGreaterThan(0)
  })
  it('닢 한도에 닿으면 더 사지 않고 손님은 다음 장날을 기약한다', () => {
    let s = only(opened(), ['penelope', 'poppy'])
    s = { ...s, stall: { ...s.stall!, earned: STALL_COIN_CAP - 1 } }
    const w = welcomeGuest(s, CONTENT)
    const buyer = BUYERS[w.stall!.guest!.npc]
    const a = answerGuest(w, buyer.way)
    expect(a.stall!.guest!.result).toBe('cap')
    expect(a.coins).toBe(s.coins)
    expect(a.stall!.sold).toHaveLength(0)
    expect(guestText(a.stall!.guest!).reply).toBeTruthy()
  })
})

describe('상인 판매와 이중 판매 없음', () => {
  it('좌판에 올린 물건은 가방에서 빠져 상인에게 팔 수 없고 상인 판매 개수와 따로 센다', () => {
    const base = { ...market(), inv: { scentCandle: 3 }, skills: {} } as unknown as GameState
    const o = openStall(base, [{ item: 'scentCandle', qty: 3, price: 'normal' }], DEFAULT_LOOK)
    expect(o.inv.scentCandle).toBeUndefined()
    expect(sell(o, 'scentCandle')).toBeNull()
    expect(canSell(o, 'scentCandle')).toBe('none')
    const sold = answerGuest(welcomeGuest(o, CONTENT), 'talk')
    expect(sold.flags.soldCount).toBeUndefined()
    expect(sold.flags.soldDay).toBeUndefined()
  })
  it('마감하면 안 팔린 물건이 정확히 돌아오고 두 번 돌려주지 않는다', () => {
    const s = market()
    const o = opened(s)
    const a = serve(o, 'talk')
    const back = closeStall(a)
    expect(back.stall!.closed).toBe(true)
    const soldOf = (id: string) => a.stall!.sold.filter((x) => x.item === id).length
    expect(back.inv.scentCandle ?? 0).toBe((s.inv.scentCandle ?? 0) - soldOf('scentCandle'))
    expect(back.inv.cushion ?? 0).toBe((s.inv.cushion ?? 0) - soldOf('cushion'))
    expect(closeStall(back)).toBe(back)
    expect(expireStall(back)).toBe(back)
    expect(canOpenStall(back)).toBe('done')
    // 가방이 가득해도 돌아오는 것은 잃지 않는다
    const full = closeStall({ ...o, inv: { scentCandle: 9 } } as GameState)
    expect(full.inv.scentCandle).toBe(9 + 3)
  })
  it('날이 바뀌거나 영업이 끝나면 마감이 한 번만 처리된다', () => {
    const o = opened()
    const next = expireStall({ ...o, clock: { day: o.clock.day + 1, minute: 360 } })
    expect(next.stall!.closed).toBe(true)
    expect(next.inv.scentCandle).toBe(4)
    expect(next.inv.cushion).toBe(2)
    expect(expireStall(next)).toBe(next)
    const late = expireStall({ ...o, clock: { day: o.clock.day, minute: STALL_TO } })
    expect(late.stall!.closed).toBe(true)
    // 아직 영업 중이면 그대로
    expect(expireStall(o)).toBe(o)
    // 건너뛴 시간의 수익은 없다
    expect(next.coins).toBe(o.coins)
  })
})

describe('떠나기·날씨·저장', () => {
  it('좌판 곁을 떠나 있으면 새 손님도 판매도 멈추고 좌판은 그대로', () => {
    const o = opened()
    const w = welcomeGuest(o, CONTENT)
    const gone = { ...w, player: { ...w.player, x: 5, y: 30 } }
    expect(stallStatus(gone, CONTENT)).toBe('away')
    expect(answerGuest(gone, 'talk')).toBe(gone)
    const away = { ...o, player: gone.player }
    expect(welcomeGuest(away, CONTENT)).toBe(away)
    expect(gone.stall).toEqual(w.stall)
  })
  it('열린 좌판만 그림에 보이고, 영업 시간이 끝나면 사라진다', () => {
    const o = opened()
    expect(stallSceneNow(o)).toMatchObject({ look: DEFAULT_LOOK, goods: ['scentCandle', 'cushion'] })
    expect(stallSceneNow({ ...o, clock: { day: o.clock.day, minute: STALL_TO } })).toBeNull()
    expect(stallSceneNow(market())).toBeNull()
    expect(stallSceneNow(closeStall(o))).toBeNull()
  })
  it('저장·불러오기에 열린 좌판·손님·외형·마감이 그대로 남는다', () => {
    const o = opened()
    const w = welcomeGuest(o, CONTENT)
    const back = deserialize(serialize({ ...w, stallLook: { sign: 1, cloth: 'blue', deco: 'candle' } }), CONTENT)!
    expect(back.stall).toEqual(w.stall)
    expect(back.stallLook).toEqual({ sign: 1, cloth: 'blue', deco: 'candle' })
    expect(back.inv).toEqual(w.inv)
    const done = closeStall(answerGuest(w, BUYERS[w.stall!.guest!.npc].way))
    const back2 = deserialize(serialize(done), CONTENT)!
    expect(back2.stall).toEqual(done.stall)
    expect(back2.inv).toEqual(done.inv)
    expect(expireStall(back2)).toBe(back2)
  })
  it('옛 저장·망가진 값은 빈 좌판으로 시작하고 다른 상태는 지켜진다', () => {
    const old = JSON.parse(serialize(market()))
    delete old.stall
    delete old.stallLook
    const loaded = deserialize(JSON.stringify(old), CONTENT)!
    expect(loaded.stall).toBeUndefined()
    expect(loaded.stallLook).toBeUndefined()
    expect(loaded.coins).toBe(10)
    expect(sanitizeStall(null)).toBeUndefined()
    expect(sanitizeStall({ id: 'x', day: 7, goods: [{ item: 'ink', qty: 3, left: 3, price: 'high' }, { item: 'honey', qty: 2, left: 5 }, { item: 'oil', qty: 2, left: 1, price: 'zzz' }] })!.goods).toEqual([{ item: 'oil', qty: 2, left: 1, price: 'normal' }])
    const bad = JSON.parse(serialize(market()))
    bad.stall = { id: 3, day: 'a' }
    bad.stallLook = { sign: -4, cloth: 5 }
    const fixed = deserialize(JSON.stringify(bad), CONTENT)!
    expect(fixed.stall).toBeUndefined()
    expect(fixed.stallLook).toEqual(DEFAULT_LOOK)
  })
  it('지난 날의 열린 좌판은 불러올 때 마감되어 물건이 돌아온다 (한 번만)', () => {
    const o = opened()
    const moved = { ...o, clock: { day: o.clock.day + 3, minute: 480 } }
    const loaded = deserialize(serialize(moved), CONTENT)!
    expect(loaded.stall!.closed).toBe(true)
    expect(loaded.inv.scentCandle).toBe(4)
    expect(loaded.inv.cushion).toBe(2)
    const again = deserialize(serialize(loaded), CONTENT)!
    expect(again.inv).toEqual(loaded.inv)
  })
})

describe('단골과 구매 기억', () => {
  const visit = (npc: string, day: number, st: GameState, goodQty = 2): GameState => {
    let n = openStall({ ...st, clock: { day, minute: 600 }, inv: { scentCandle: 3, cushion: 3, blanket: 1 }, player: { ...st.player, x: STALL_STAND.x, y: STALL_STAND.y } } as GameState, [{ item: 'cushion', qty: goodQty, price: 'normal' }], DEFAULT_LOOK)
    n = only(n, [npc])
    n = answerGuest(welcomeGuest(n, CONTENT), BUYERS[npc].way)
    return closeStall(n)
  }
  it('단골은 여러 장날 들른 경험으로만 생기고 값·닢에는 영향이 없다', () => {
    let s = market()
    const npc = 'penelope'
    expect(regularOf(s, npc)).toBe(false)
    const days = [MARKET, dryMarket(MARKET + 7), dryMarket(MARKET + 70), dryMarket(MARKET + 140)]
    s = visit(npc, days[0], s)
    s = visit(npc, days[1], s)
    expect(regularOf(s, npc)).toBe(false)
    s = visit(npc, days[2], s)
    expect(regularOf(s, npc)).toBe(true)
    expect(s.life.experiences[`stall:${npc}`].count).toBe(3)
    // 단골이어도 같은 값에 같은 닢 — 높은 값을 받아 주지 않는다
    const before = s.coins
    s = visit(npc, days[3], s)
    expect(s.coins - before).toBe(stallPrice(s, 'cushion', 'normal'))
  })
  it('지난번에 산 물건은 다음 방문에서 이야기하고, 구경만 한 이웃은 기억하지 않는다', () => {
    const npc = 'penelope'
    const first = visit(npc, MARKET, market())
    expect(first.stall!.sold[0].item).toBe('cushion')
    expect(first.life.experiences[`stallBuy:${npc}`]).toMatchObject({ item: 'cushion', count: 1 })
    // 같은 날에는 후기가 없다
    const day2 = dryMarket(MARKET + 7)
    let m = openStall({ ...first, clock: { day: day2, minute: 600 }, inv: { cushion: 2 } } as GameState, [{ item: 'cushion', qty: 1, price: 'normal' }], DEFAULT_LOOK)
    m = only(m, [npc])
    const g = welcomeGuest(m, CONTENT).stall!.guest!
    expect(g.npc).toBe(npc)
    expect(g.review).toBe('cushion')
    expect(guestText(g).review).toBe(T.stall.review.cushion)
    const day1 = openStall({ ...market(), inv: { cushion: 2 } } as GameState, [{ item: 'cushion', qty: 1, price: 'normal' }], DEFAULT_LOOK)
    expect(welcomeGuest(only(day1, [npc]), CONTENT).stall!.guest!.review).toBeUndefined()
    // 구경만 한 아이는 산 기억이 없다
    const kid = answerGuest(welcomeGuest(only(opened(), ['child']), CONTENT), 'talk')
    expect(kid.life.experiences['stallBuy:child']).toBeUndefined()
    expect(kid.life.experiences['stall:child']).toMatchObject({ count: 1 })
  })
  it('이웃마다 정해진 한 줄이 있으면 그것이, 없으면 공통 문구가 나온다 — 죄책감 말은 없다', () => {
    for (const id of Object.keys(BUYERS)) {
      const g = { npc: id, item: 'cushion' as const, score: 1 as const, regular: true, phase: 'done' as const, way: 'talk' as const, result: 'looked' as const }
      const t = guestText(g)
      expect(t.arrive).toBeTruthy()
      expect(t.reply).toBeTruthy()
      for (const line of [t.arrive, t.want, t.hint, t.regular, t.reply]) expect(line ?? '').not.toMatch(/죄송|미안|실망|사지 않아/)
    }
    expect(guestText({ npc: 'penelope', item: 'cushion', score: 2, regular: false, phase: 'look' }).arrive).toBe(PEOPLE.people.penelope.stallLines!.look)
    expect(guestText({ npc: 'dummy', item: 'cushion', score: 2, regular: false, phase: 'look' }).arrive).toContain('방석')
  })
})

describe('필사·말씀과 무관', () => {
  it('좌판은 필사 상태·서고·직업 단계를 읽지 않고 쓰기 재료도 건드리지 않는다', () => {
    const s = market()
    expect(canOpenStall(s)).toBeNull()
    const o = openStall(s, PICKS, DEFAULT_LOOK)
    const a = answerGuest(welcomeGuest(o, CONTENT), 'talk')
    expect(a.inv.ink).toBe(5)
    expect(a.inv.papyrus).toBe(5)
    expect(a.inv.cover).toBe(2)
    expect(a.progress).toEqual(s.progress)
    expect(a.copy).toEqual(s.copy)
    expect(a.shelved).toEqual(s.shelved)
  })
})

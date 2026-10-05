// 내 작은 장날 좌판 (계획 16 작업 19, 기획 03): 장날 광장에 작은 좌판을 열고, 마을에 나와 있는 이웃 손님을 맞아 직접 만든 물건을 판다.
// 경제: 상인 판매(SELL_CAP)와 따로 하루 판매 개수·닢 한도를 둔다. 값은 상인 값과 같은 표(SELL_PRICES)에서 시작하고 가격 선택은 작은 범위뿐.
// 열지 않아도, 팔지 못해도 불이익·관계 하락·죄책감 문구 없음. 필사·책상·서고에는 아무 조건도 걸지 않는다 (직업 단계로도 막지 않는다).
// 말씀 조각·필사본·성경 본문·쓰기 재료·가게 소유 물건은 상품 목록에 없다 (STALL_GOODS만 올릴 수 있다).
import { availability } from './plans'
import { notYet, passTime, playerTile, recordExperienceIn, sellPrice, SELL_PRICES, type GameState } from './game'
import { addGift, count, take } from './items'
import { isMarketDay, isWet, weatherOf } from './calendar'
import { personOf } from './people'
import lifeText from '../content/life-text.json'
import type { GameContent, ItemId, Tile } from './types'

/** 좌판 그림 왼쪽 위 칸 (가로 3칸 × 세로 2칸) — 광장 위쪽, 큰길 줄·상인 좌판·우물·잔치 자리를 비킨 곳. 길을 막지 않는다(그림만) */
export const STALL_SPOT: Tile = { x: 26, y: 12 }
/** 기록자가 좌판을 보며 서는 칸 (좌판 바로 아래) */
export const STALL_STAND: Tile = { x: 27, y: 14 }
/** 손님이 좌판 곁에 와 서는 칸 */
export const STALL_GUEST_SPOT: Tile = { x: 28, y: 14 }
/** 좌판 곁(이만큼 안)에 있어야 열고 손님을 맞는다 — 떠나면 새 판매가 멈춘다 */
export const STALL_NEAR = 5

export const STALL_FROM = 9 * 60
export const STALL_TO = 17 * 60
/** 여는 데 걸리는 시간 / 손님 한 사람 맞는 시간 (분) */
export const STALL_SETUP_MINUTES = 20
export const STALL_MINUTES = 15
/** 하루 손님 수 · 판매 개수 · 받는 닢 (상인 판매 SELL_CAP과 따로 — 장날 하루 상인 판매보다 작게) */
export const STALL_VISITORS = 6
export const STALL_SALES = 6
export const STALL_COIN_CAP = 60
export const STALL_GOODS_MAX = 3
export const STALL_PER_GOOD = 4
/** 이만큼 다른 장날에 들른 이웃이 단골 (작은 반응·후기만, 값에는 영향 없음) */
export const STALL_REGULAR_VISITS = 3

export type StallPrice = 'low' | 'normal' | 'high'
export type StallWay = 'explain' | 'talk' | 'wait'
export const STALL_PRICE_MULT: Record<StallPrice, number> = { low: 0.8, normal: 1, high: 1.25 }
export const STALL_PRICES: readonly StallPrice[] = ['low', 'normal', 'high']
export const STALL_WAYS: readonly StallWay[] = ['explain', 'talk', 'wait']
export const STALL_SIGNS = 4
export const STALL_CLOTHS = ['plain', 'blue', 'rose'] as const
export const STALL_DECOS = ['none', 'candle', 'plant', 'basket'] as const
export type StallCloth = (typeof STALL_CLOTHS)[number]
export type StallDeco = (typeof STALL_DECOS)[number]

/** 직접 만들거나 거둔 생활 물건만 — 쓰기 재료(먹물·파피루스·표지)와 말씀 관련 물건은 없다 */
export const STALL_CRAFTED: readonly ItemId[] = ['scentCandle', 'oil', 'blanket']
export const STALL_PRODUCE: readonly ItemId[] = ['herb', 'grapes', 'honey']
/** 배운 생활 기술(skill-defs)로 만든 물건 — 그 기술을 배운 뒤에만 올릴 수 있다 */
export const STALL_SKILLED: Readonly<Record<string, string>> = { cushion: 'clothColor', fruitBowl: 'snackShape', dryFlowers: 'flowerKeep', basket: 'basketCare' }
export const STALL_GOODS: readonly ItemId[] = [...STALL_CRAFTED, ...STALL_PRODUCE, ...(Object.keys(STALL_SKILLED) as ItemId[])]
/** 상인 표에 없는 물건의 좌판 기본값 (들어간 재료를 상인 값으로 셈한 것보다 조금 위) */
const STALL_EXTRA: Partial<Record<ItemId, number>> = { blanket: 14, cushion: 11, fruitBowl: 10, dryFlowers: 9, basket: 8 }

/** 좌판 외형: 고른 값은 다음 장날에도 남는다. 꾸밈은 모습일 뿐 매출 조건이 아니다 */
export interface StallLook { sign: number; cloth: StallCloth; deco: StallDeco }
export const DEFAULT_LOOK: StallLook = { sign: 0, cloth: 'plain', deco: 'none' }

export interface StallGood { item: ItemId; qty: number; left: number; price: StallPrice }
export interface StallSale { npc: string; item: ItemId; coins: number }
export interface StallGuest {
  npc: string
  /** 눈길이 머문 상품 */
  item: ItemId
  /** 이 손님에게 그 상품이 얼마나 끌리는가 (0 구경만, 1 보통, 2 찾던 것) */
  score: 0 | 1 | 2
  regular: boolean
  /** 지난번에 산 물건 (다음 방문에서 쓴 이야기) */
  review?: ItemId
  phase: 'look' | 'done'
  way?: StallWay
  result?: 'sold' | 'looked' | 'cap'
  coins?: number
}
export interface Stall {
  id: string
  day: number
  goods: StallGood[]
  look: StallLook
  /** 오늘 맞은 이웃 (한 사람은 하루에 한 번만) */
  served: string[]
  sold: StallSale[]
  earned: number
  guest?: StallGuest
  closed: boolean
  /** 마감할 때 가방으로 돌아간 것 (요약용) */
  returned?: Partial<Record<ItemId, number>>
}

/** 손님의 구매 취향 — 선물 취향(neighbors.json)과 따로, 일과 생활에서 필요한 물건. wants: 찾던 것, way: 반가워하는 응대 */
interface Buyer { wants: readonly ItemId[]; way: StallWay; browseOnly?: boolean }
export const BUYERS: Readonly<Record<string, Buyer>> = {
  tilly: { wants: ['dryFlowers', 'basket'], way: 'talk' },
  wendell: { wants: ['fruitBowl', 'honey'], way: 'explain' },
  smith: { wants: ['scentCandle', 'oil'], way: 'explain' },
  poppy: { wants: ['cushion', 'dryFlowers'], way: 'talk' },
  postman: { wants: ['blanket', 'basket'], way: 'wait' },
  baker: { wants: ['honey', 'herb', 'fruitBowl'], way: 'explain' },
  cosmo: { wants: ['oil', 'scentCandle'], way: 'wait' },
  rudy: { wants: ['scentCandle', 'dryFlowers'], way: 'wait' },
  dexter: { wants: ['dryFlowers', 'herb'], way: 'wait' },
  basil: { wants: ['herb', 'honey', 'dryFlowers'], way: 'explain' },
  marigold: { wants: ['grapes', 'basket', 'fruitBowl'], way: 'talk' },
  penelope: { wants: ['cushion', 'blanket'], way: 'talk' },
  juniper: { wants: ['dryFlowers', 'honey'], way: 'talk' },
  fisher: { wants: ['oil', 'blanket'], way: 'wait' },
  carpenter: { wants: ['oil', 'basket'], way: 'explain' },
  shepherd: { wants: ['blanket', 'cushion'], way: 'wait' },
  beekeeper: { wants: ['dryFlowers', 'scentCandle'], way: 'wait' },
  child: { wants: [], way: 'wait', browseOnly: true },
  grandpa: { wants: ['grapes', 'basket'], way: 'talk' },
  merchant: { wants: [], way: 'explain', browseOnly: true },
  presser: { wants: ['basket', 'herb'], way: 'explain' },
  weaver: { wants: ['dryFlowers', 'honey'], way: 'talk' },
  apothecary: { wants: ['dryFlowers', 'basket'], way: 'explain' },
}
const DEFAULT_BUYER: Buyer = { wants: [], way: 'talk' }
export const buyerOf = (npc: string): Buyer => BUYERS[npc] ?? DEFAULT_BUYER

/** 좌판 값: 상인 표에 있는 것은 같은 값에서(매력 보너스 포함), 없는 것은 좌판 기본값. 그 위에 작은 범위의 가격 선택 */
export function stallBase(s: Pick<GameState, 'stats'>, item: ItemId): number {
  return SELL_PRICES[item] !== undefined ? sellPrice(s, item)! : (STALL_EXTRA[item] ?? 1)
}
export function stallPrice(s: Pick<GameState, 'stats'>, item: ItemId, tier: StallPrice): number {
  return Math.max(1, Math.round(stallBase(s, item) * STALL_PRICE_MULT[tier]))
}

const near = (a: Tile, b: Tile, d: number) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= d
const nearStall = (s: GameState) => near(playerTile(s), STALL_STAND, STALL_NEAR)

/** 올릴 수 있는 물건 — 가방에 있고, 배워야 하는 것은 배운 것만 */
export function stallGoodsAvailable(s: GameState): { item: ItemId; have: number }[] {
  return STALL_GOODS.filter((item) => {
    const skill = STALL_SKILLED[item]
    return count(s.inv, item) > 0 && (!skill || !!s.skills?.[skill])
  }).map((item) => ({ item, have: count(s.inv, item) }))
}

const todays = (s: GameState): Stall | undefined => (s.stall && s.stall.day === s.clock.day ? s.stall : undefined)
export const stallOpenNow = (s: GameState): boolean => {
  const st = todays(s)
  return !!st && !st.closed && s.clock.minute >= STALL_FROM && s.clock.minute < STALL_TO
}

export type StallBlock = 'notMarket' | 'wet' | 'early' | 'late' | 'away' | 'done' | 'open' | 'none' | null
export function canOpenStall(s: GameState): StallBlock {
  if (!isMarketDay(s.clock.day)) return 'notMarket'
  if (isWet(weatherOf(s.clock.day))) return 'wet'
  const st = todays(s)
  if (st) return st.closed ? 'done' : 'open'
  if (s.clock.minute < STALL_FROM) return 'early'
  if (s.clock.minute + STALL_SETUP_MINUTES + STALL_MINUTES > STALL_TO) return 'late'
  if (!nearStall(s)) return 'away'
  if (stallGoodsAvailable(s).length === 0) return 'none'
  return null
}

export interface StallPick { item: ItemId; qty: number; price: StallPrice }
/** 상품을 가방에서 좌판으로 옮기고 연다 — 고를 수 없는 것은 버리고, 하나도 없으면 열지 않는다 */
export function openStall(s: GameState, picks: StallPick[], look: StallLook): GameState {
  if (canOpenStall(s)) return s
  const avail = new Map(stallGoodsAvailable(s).map((g) => [g.item, g.have]))
  const goods: StallGood[] = []
  for (const p of picks) {
    if (goods.length >= STALL_GOODS_MAX || goods.some((g) => g.item === p.item) || !avail.has(p.item)) continue
    const qty = Math.min(avail.get(p.item)!, STALL_PER_GOOD, Math.floor(p.qty))
    if (!(qty >= 1)) continue
    goods.push({ item: p.item, qty, left: qty, price: STALL_PRICES.includes(p.price) ? p.price : 'normal' })
  }
  if (!goods.length) return s
  const inv = take(s.inv, Object.fromEntries(goods.map((g) => [g.item, g.qty])))
  if (!inv) return s
  const safe = sanitizeStallLook(look)
  const next: GameState = { ...s, inv, stallLook: safe, stall: { id: `stall:${s.clock.day}`, day: s.clock.day, goods, look: safe, served: [], sold: [], earned: 0, closed: false } }
  return passTime(next, STALL_SETUP_MINUTES)
}

/** 마감: 안 팔린 것은 가방으로(넘치는 수도 잃지 않게 선물처럼) — 한 번만 처리한다 */
export function closeStall(s: GameState): GameState {
  const st = s.stall
  if (!st || st.closed) return s
  const back: Partial<Record<ItemId, number>> = {}
  for (const g of st.goods) if (g.left > 0) back[g.item] = (back[g.item] ?? 0) + g.left
  return { ...s, inv: addGift(s.inv, back), stall: { ...st, goods: st.goods.map((g) => ({ ...g, left: 0 })), closed: true, guest: undefined, returned: back } }
}
/** 날이 바뀌었거나 영업 시간이 끝났으면 마감 (자동 영업·건너뛴 시간의 수익은 없다 — 그동안 판 것이 없다) */
export function expireStall(s: GameState): GameState {
  const st = s.stall
  if (!st || st.closed) return s
  return st.day < s.clock.day || s.clock.minute >= STALL_TO ? closeStall(s) : s
}

const hash = (t: string) => [...t].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
const stockLeft = (st: Stall) => st.goods.filter((g) => g.left > 0)

/** 지금 좌판 앞에 올 수 있는 이웃: 마을에 나와 있고, 이사 온 사람이고, 약속이 없고, 오늘 아직 안 온 사람 */
export function stallVisitors(s: GameState, content: GameContent): string[] {
  const st = todays(s)
  if (!st) return []
  const level = s.flags.villageLevel ?? 0
  return content.neighbors
    .filter((d) => {
      const n = s.npcs[d.id]
      if (!n?.visible || notYet(d, level, s.flags) || st.served.includes(d.id)) return false
      return availability(s, d.id, s.clock.day, s.clock.minute, s.clock.minute + STALL_MINUTES, content) === 'ok'
    })
    .map((d) => d.id)
    .sort((a, b) => hash(`${st.day}:${a}`) - hash(`${st.day}:${b}`) || a.localeCompare(b))
}

export type StallStatus = 'none' | 'over' | 'away' | 'guest' | 'finished' | 'quiet' | 'ready'
export function stallStatus(s: GameState, content: GameContent): StallStatus {
  const st = todays(s)
  if (!st || st.closed) return 'none'
  if (s.clock.minute >= STALL_TO || s.clock.minute + STALL_MINUTES > STALL_TO) return 'over'
  if (!nearStall(s)) return 'away'
  if (st.guest?.phase === 'look') return 'guest'
  if (st.served.length >= STALL_VISITORS || st.sold.length >= STALL_SALES || st.earned >= STALL_COIN_CAP || !stockLeft(st).length) return 'finished'
  return stallVisitors(s, content).length ? 'ready' : 'quiet'
}

export const regularOf = (s: GameState, npc: string): boolean => (s.life?.experiences?.[`stall:${npc}`]?.count ?? 0) >= STALL_REGULAR_VISITS
/** 지난 장날 이 이웃이 산 물건 (오늘 산 것은 아직 후기가 없다) */
function lastBought(s: GameState, npc: string): ItemId | undefined {
  const e = s.life?.experiences?.[`stallBuy:${npc}`]
  return e?.item && (e.last ?? 0) < s.clock.day && (STALL_GOODS as readonly string[]).includes(e.item) ? (e.item as ItemId) : undefined
}

/** 다음 손님을 맞는다 — 눈길이 가는 것은 좌판에 놓은 순서대로 찾던 것 먼저 */
export function welcomeGuest(s: GameState, content: GameContent): GameState {
  const st = todays(s)
  if (!st || (stallStatus(s, content) !== 'ready')) return s
  const npc = stallVisitors(s, content)[0]
  const buyer = buyerOf(npc)
  const stock = stockLeft(st)
  const wanted = buyer.browseOnly ? undefined : stock.find((g) => buyer.wants.includes(g.item))
  const eyed = wanted ?? stock[0]
  const score: 0 | 1 | 2 = buyer.browseOnly ? 0 : wanted ? 2 : 1
  const review = lastBought(s, npc)
  const guest: StallGuest = { npc, item: eyed.item, score, regular: regularOf(s, npc), phase: 'look', ...(review ? { review } : {}) }
  return { ...s, stall: { ...st, guest } }
}

/** 이 응대·값·끌림에서 사는가 — 정해진 규칙뿐(무작위 없음). 높은 값은 찾던 것을 반가운 응대로 맞을 때만 */
export function buys(score: 0 | 1 | 2, price: StallPrice, way: StallWay, theirs: StallWay): boolean {
  if (score === 0) return false
  if (price === 'high') return score === 2 && way === theirs
  if (price === 'normal') return score === 2 || way === theirs
  return true
}

/** 응대한다: 사면 재고가 줄고 닢을 받는다. 못 사도 사이는 그대로 — 방문과 구매는 경험으로 남는다 */
export function answerGuest(s: GameState, way: StallWay): GameState {
  const st = todays(s)
  const g = st?.guest
  if (!st || st.closed || !g || g.phase !== 'look' || !STALL_WAYS.includes(way) || s.clock.minute >= STALL_TO || !nearStall(s)) return s
  const good = st.goods.find((x) => x.item === g.item)
  let result: 'sold' | 'looked' | 'cap' = 'looked'
  let coins = 0
  if (good && good.left > 0 && buys(g.score, good.price, way, buyerOf(g.npc).way)) {
    coins = stallPrice(s, good.item, good.price)
    result = st.earned + coins > STALL_COIN_CAP || st.sold.length >= STALL_SALES ? 'cap' : 'sold'
  }
  const sold = result === 'sold'
  let next: GameState = {
    ...s,
    coins: s.coins + (sold ? coins : 0),
    stall: {
      ...st,
      goods: sold ? st.goods.map((x) => (x.item === g.item ? { ...x, left: x.left - 1 } : x)) : st.goods,
      served: [...st.served, g.npc],
      sold: sold ? [...st.sold, { npc: g.npc, item: g.item, coins }] : st.sold,
      earned: st.earned + (sold ? coins : 0),
      guest: { ...g, phase: 'done', way, result, ...(sold ? { coins } : {}) },
    },
  }
  next = recordExperienceIn(next, { id: `stall:${g.npc}`, kind: 'stall', with: [g.npc], place: 'plaza' })
  if (sold) next = recordExperienceIn(next, { id: `stallBuy:${g.npc}`, kind: 'stall', with: [g.npc], place: 'plaza', item: g.item })
  return passTime(next, STALL_MINUTES)
}

/** 손님이 없을 때 조금 기다린다 (새 손님이 올 수 있다) */
export function waitAtStall(s: GameState, content: GameContent): GameState {
  const status = stallStatus(s, content)
  return status === 'quiet' || status === 'ready' ? passTime(s, STALL_MINUTES) : s
}

/** 손님 카드에 보일 말: 이웃마다 정해진 한 줄이 있으면 그것, 없으면 공통 문구 (취향·단골·지난번 산 물건이 말에 드러난다) */
export function guestText(g: StallGuest): { arrive: string; want: string; hint: string; regular?: string; review?: string; reply?: string } {
  const T = lifeText.stall
  const name = (lifeText.items as Record<string, { name: string }>)[g.item]?.name ?? ''
  const mine = personOf(g.npc)?.stallLines
  const buyer = buyerOf(g.npc)
  const out: ReturnType<typeof guestText> = {
    arrive: mine?.look ?? T.guestLook.replace('{good}', name),
    want: buyer.browseOnly ? T.guestOnlyLook : g.score === 2 ? T.guestWants : T.guestBrowse,
    hint: T.wayHint[buyer.way],
  }
  if (g.regular) out.regular = mine?.regular ?? T.regularLine
  if (g.review) out.review = (T.review as Record<string, string>)[g.review]
  if (g.phase === 'done') out.reply = g.result === 'sold' ? (mine?.sold ?? T.genericSold) : g.result === 'cap' ? T.genericCap : (mine?.looked ?? T.genericLooked)
  return out
}

/** 하루 요약 */
export function stallSummary(st: Stall): { sold: number; coins: number; visitors: number } {
  return { sold: st.sold.length, coins: st.earned, visitors: st.served.length }
}

/** 마을 지도에 좌판을 그릴 때 필요한 것 (영업 중일 때만) */
export function stallSceneNow(s: GameState): { look: StallLook; goods: ItemId[] } | null {
  const st = todays(s)
  if (!st || st.closed || s.clock.minute < STALL_FROM || s.clock.minute >= STALL_TO) return null
  return { look: st.look, goods: stockLeft(st).map((g) => g.item) }
}
/** 지금 좌판 곁에서 기다리는 손님 (일과보다 먼저 이 자리로) */
export function stallGuestNow(s: Pick<GameState, 'stall' | 'clock'>): string | null {
  const st = s.stall
  return st && !st.closed && st.day === s.clock.day && st.guest?.phase === 'look' ? st.guest.npc : null
}

export function sanitizeStallLook(raw: unknown): StallLook {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<StallLook>
  return {
    sign: Number.isInteger(r.sign) && r.sign! >= 0 && r.sign! < STALL_SIGNS ? r.sign! : 0,
    cloth: (STALL_CLOTHS as readonly unknown[]).includes(r.cloth) ? r.cloth! : 'plain',
    deco: (STALL_DECOS as readonly unknown[]).includes(r.deco) ? r.deco! : 'none',
  }
}
const isCount = (v: unknown, max = 99): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max
/** 옛 저장·모양이 틀린 값은 버린다. 마감 안 된 좌판의 상품은 불러올 때 지금 상품 표 안의 것만 남긴다 */
export function sanitizeStall(raw: unknown): Stall | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Partial<Stall>
  if (typeof r.id !== 'string' || !Number.isInteger(r.day) || r.day! < 1 || !Array.isArray(r.goods)) return undefined
  const goods: StallGood[] = []
  for (const g of r.goods as unknown[]) {
    const x = g as Partial<StallGood>
    if (!g || typeof g !== 'object' || !(STALL_GOODS as readonly unknown[]).includes(x.item) || goods.some((y) => y.item === x.item)) continue
    if (!isCount(x.qty, STALL_PER_GOOD) || !isCount(x.left, STALL_PER_GOOD) || x.qty! < 1 || x.left! > x.qty! || goods.length >= STALL_GOODS_MAX) continue
    goods.push({ item: x.item!, qty: x.qty!, left: x.left!, price: STALL_PRICES.includes(x.price as StallPrice) ? (x.price as StallPrice) : 'normal' })
  }
  const strs = (v: unknown): string[] => (Array.isArray(v) ? [...new Set((v as unknown[]).filter((n): n is string => typeof n === 'string'))] : [])
  const sold: StallSale[] = (Array.isArray(r.sold) ? (r.sold as unknown[]) : [])
    .filter((x): x is StallSale => !!x && typeof x === 'object' && typeof (x as StallSale).npc === 'string' && (STALL_GOODS as readonly unknown[]).includes((x as StallSale).item) && isCount((x as StallSale).coins, 999))
    .map((x) => ({ npc: x.npc, item: x.item, coins: x.coins }))
  const closed = r.closed === true
  const out: Stall = {
    id: r.id,
    day: r.day!,
    goods,
    look: sanitizeStallLook(r.look),
    served: strs(r.served),
    sold,
    earned: Math.min(STALL_COIN_CAP, sold.reduce((a, x) => a + x.coins, 0)),
    closed,
  }
  const g = r.guest as Partial<StallGuest> | undefined
  if (!closed && g && typeof g.npc === 'string' && (STALL_GOODS as readonly unknown[]).includes(g.item) && (g.phase === 'look' || g.phase === 'done') && [0, 1, 2].includes(g.score as number)) {
    const guest: StallGuest = { npc: g.npc, item: g.item!, score: g.score!, regular: g.regular === true, phase: g.phase }
    if (g.review && (STALL_GOODS as readonly unknown[]).includes(g.review)) guest.review = g.review
    if (g.phase === 'done' && STALL_WAYS.includes(g.way as StallWay) && ['sold', 'looked', 'cap'].includes(g.result as string)) {
      guest.way = g.way
      guest.result = g.result
      if (isCount(g.coins, 999)) guest.coins = g.coins
    }
    if (g.phase === 'look' || guest.result) out.guest = guest
  }
  if (closed && r.returned && typeof r.returned === 'object') {
    const back: Partial<Record<ItemId, number>> = {}
    for (const [k, v] of Object.entries(r.returned)) if ((STALL_GOODS as readonly string[]).includes(k) && isCount(v)) back[k as ItemId] = v
    out.returned = back
  }
  return out
}

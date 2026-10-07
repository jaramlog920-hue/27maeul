// 직접 요리하고 함께 먹는 생활 (계획 16 작업 25, 기획 13): 화덕에서 요리 → 혼자 먹기 / 식탁에 차려 함께 먹기.
// 기존 빵 굽기(RECIPES.bread)·배고픔·가족 저녁·행사 간식·좌판 상품 위에 얹는다 — 별도 빵 아이템·별도 저녁 체계를 만들지 않는다.
// 규칙: 재료는 요리를 시작할 때 한 번만 쓴다(시작한 요리는 끝까지 이어 만들 수 있어 사라지지 않는다). 실패로 재료를 잃지 않는다 —
// 가끔 모양이 조금 삐뚤어질 뿐(맛·분량 같음). 완성품이 가방에 안 들어가면 가방을 비울 때까지 그대로 기다린다.
// 식탁에 차린 음식은 가방에서 식탁으로 옮겨 한 곳에서만 쓴다: 먹기·치우기(남은 것 한 번 돌려받기)·날짜가 바뀌거나 자리가 없어지면 돌려받기.
// 함께 먹은 기억은 그 자리에 실제로 있던 사람만, 식사 한 번마다 고유 id. 말씀 조각·필사본·성경 장면을 음식 재료·상품으로 쓰지 않는다.
import { childTile, overflows, passTime, playerTile, putAway, recordExperienceIn, startAct, startCookAct, syncHome, useStock, haveStock, catchSoot, type GameState } from './game'
import { childStage } from './child'
import { addGift, count, COOKED_ITEMS, DISH_HUNGER, take } from './items'
import { startMini, stepMini, tapMini, isDone, type MiniState } from './minigame'
import { exhausted } from './needs'
import { npcTile } from './neighbors'
import { mulberry32 } from './offers'
import { personOf } from './people'
import { heartsOf } from './hearts'
import { liveSpaces, reserveSeats, type HomeSpace } from './spaces'
import { isHome } from './world'
import type { ItemId, Minigame, Rng, Tile } from './types'

export type DishId = 'bread' | 'beanDish' | 'herbBeanDish' | 'honeyBread' | 'figPlate' | 'herbTea'
export const DISH_IDS: readonly DishId[] = ['bread', 'beanDish', 'herbBeanDish', 'honeyBread', 'figPlate', 'herbTea']
export interface DishDef {
  id: DishId
  item: ItemId
  needs: Partial<Record<ItemId, number>>
  /** 한 번에 나오는 분량 (한 개 = 한 끼 한 접시) */
  qty: number
  minutes: number
  /** 손 동작: 손질 → 조리 순서로 1~2개 (기존 손일 엔진 재사용, 실패 없음, 계속 누르기 없음) */
  hands: readonly Minigame[]
  /** 함께 배울 수 있는 이웃 (비어 있으면 처음부터 안다) */
  teachers: readonly string[]
  /** 담는 모습 둘 — assets/cooking 도트 id (모습일 뿐 분량·효과는 같다) */
  art: readonly [string, string]
}
export const DISHES: Record<DishId, DishDef> = {
  // 기존 빵: 제작법·분량·미니게임은 RECIPES.bread 그대로 (이 표는 안내용)
  bread: { id: 'bread', item: 'bread', needs: { barley: 1, water: 1 }, qty: 2, minutes: 30, hands: ['mash'], teachers: [], art: ['breadLong', 'breadRound'] },
  beanDish: { id: 'beanDish', item: 'beanDish', needs: { bean: 1, water: 1 }, qty: 1, minutes: 30, hands: ['pick', 'timing'], teachers: [], art: ['beanBowl', 'beanPotReady'] },
  herbBeanDish: { id: 'herbBeanDish', item: 'herbBeanDish', needs: { bean: 1, water: 1, herb: 1 }, qty: 1, minutes: 30, hands: ['mash', 'timing'], teachers: ['grandpa', 'marigold'], art: ['herbBeanBowl', 'herbBeanPot'] },
  honeyBread: { id: 'honeyBread', item: 'honeyBread', needs: { bread: 1, honey: 1 }, qty: 1, minutes: 15, hands: ['weave'], teachers: ['baker', 'wendell'], art: ['honeyBread', 'honeyBreadPrep'] },
  figPlate: { id: 'figPlate', item: 'figPlate', needs: { fig: 1 }, qty: 1, minutes: 10, hands: ['pick'], teachers: [], art: ['figPlate', 'figCut'] },
  herbTea: { id: 'herbTea', item: 'herbTea', needs: { herb: 1, water: 1 }, qty: 1, minutes: 15, hands: ['timing'], teachers: ['basil', 'poppy'], art: ['herbTea', 'teaBrewing'] },
}
/** 새 요리(빵 빼고): 이 화면의 요리 흐름으로 만든다 */
export const NEW_DISHES: readonly DishId[] = ['beanDish', 'herbBeanDish', 'honeyBread', 'figPlate', 'herbTea']
export const dishOfItem = (item: ItemId): DishId | undefined => NEW_DISHES.find(d => DISHES[d].item === item)
/** 식탁은 두 접시부터 네 접시까지 */
export const TABLE_MAX = 4
/** 먹는 데 걸리는 분 (차는 짧게) */
export const EAT_MINUTES = 20
export const TEA_MINUTES = 15
export const TABLE_MINUTES = 30
/** 가끔 모양이 조금 삐뚤어지는 날 (날 씨앗) — 맛·분량·값은 그대로 */
export const UNEVEN_CHANCE = 0.18

export interface CookRun {
  dish: DishId
  day: number
  phase: 'hand' | 'finish' | 'ready'
  hand: number
  mini?: MiniState
  look: number
  /** 아이가 접시를 골라 줬는가 (-1 아니오, 아니면 고른 모습) */
  kid: number
  uneven: boolean
}
export interface TableMeal { id: string; day: number; item: ItemId; left: number; space: string; ate: string[] }
export interface Cooking {
  learned: Record<string, { day: number; from: string }>
  run?: CookRun
  table?: TableMeal
  /** 요리마다 마지막으로 고른 담는 모습 (가방 아이템은 종류 하나 — 모습만 마지막 것으로 보인다) */
  looks: Record<string, number>
  made: Record<string, number>
  /** 식탁을 차린 횟수 (식탁·식사 기억 id를 겹치지 않게) */
  meals: number
  /** 빵 굽기에서 고른 모양 (모습만) */
  breadShape: number
}
export const NO_COOKING: Cooking = { learned: {}, looks: {}, made: {}, meals: 0, breadShape: 0 }
export const cookOf = (s: Pick<GameState, 'cooking'>): Cooking => s.cooking ?? NO_COOKING
const withCooking = (s: GameState, c: Partial<Cooking>): GameState => ({ ...s, cooking: { ...cookOf(s), ...c } })

export const knownDish = (s: Pick<GameState, 'cooking'>, d: DishId): boolean => DISHES[d].teachers.length === 0 || !!cookOf(s).learned[d]
/** 이 이웃이 가르쳐 주는 요리 (한 이웃 = 한 요리) */
export const dishTaughtBy = (npc: string): DishId | undefined => NEW_DISHES.find(d => DISHES[d].teachers.includes(npc))

// ── 만들기 ──
export type CookBlock = 'unknown' | 'busy' | 'tired' | 'needs' | 'full' | null
export function canCook(s: GameState, dish: DishId): CookBlock {
  const def = DISHES[dish]
  if (dish === 'bread') return null
  if (cookOf(s).run) return 'busy'
  if (!knownDish(s, dish)) return 'unknown'
  if (exhausted(s.needs)) return 'tired'
  if (!haveStock(s, def.needs)) return 'needs'
  if (overflows(useStock(s, def.needs)!, { [def.item]: def.qty })) return 'full'
  return null
}
/** 모자란 재료 (안내용) */
export function missingFor(s: GameState, dish: DishId): { item: ItemId; need: number; have: number }[] {
  return (Object.entries(DISHES[dish].needs) as [ItemId, number][]).map(([item, need]) => ({ item, need, have: count(s.inv, item) + count(s.chest ?? {}, item) })).filter(m => m.have < m.need)
}

/** 시작: 재료를 한 번 쓰고 손질부터. 이미 시작했으면 그대로 */
export function startCook(s: GameState, dish: DishId, rng: Rng): GameState {
  if (canCook(s, dish) || dish === 'bread') return s
  const def = DISHES[dish]
  const paid = useStock(s, def.needs)!
  const uneven = mulberry32(s.clock.day * 977 + NEW_DISHES.indexOf(dish) * 31 + (cookOf(s).made[dish] ?? 0))() < UNEVEN_CHANCE
  return withCooking(paid, { run: { dish, day: s.clock.day, phase: 'hand', hand: 0, mini: startMini(def.hands[0], rng), look: 0, kid: -1, uneven } })
}
function handRun(s: GameState): CookRun | null {
  const r = cookOf(s).run
  return r && r.phase === 'hand' && r.mini ? r : null
}
export function cookHand(s: GameState, kind: 'tick' | 'tap', input: number, rng: Rng): GameState {
  const r = handRun(s)
  if (!r) return s
  const mini = kind === 'tick' ? stepMini(r.mini!, Math.min(0.2, Math.max(0, input)), rng) : tapMini(r.mini!, input)
  return withCooking(s, { run: { ...r, mini } })
}
/** 손 동작을 끝내고 다음으로 (끝나지 않은 동작은 건너뛰지 못한다) */
export function nextCookStep(s: GameState, rng: Rng): GameState {
  const r = handRun(s)
  if (!r || !isDone(r.mini!)) return s
  const hands = DISHES[r.dish].hands
  if (r.hand + 1 < hands.length) return withCooking(s, { run: { ...r, hand: r.hand + 1, mini: startMini(hands[r.hand + 1], rng) } })
  return withCooking(s, { run: { ...r, phase: 'finish', mini: undefined } })
}
/** 아이가 곁에서 접시 모양을 고를 수 있는가: 걷는·돕는 아이가 집에 있을 때만 (아기는 요리에 함께하지 않는다) */
export function kidCanChoose(s: GameState): boolean {
  const c = s.child
  if (!c || !['toddler', 'helper'].includes(childStage(c, s.clock.day))) return false
  const t = childTile(s)
  return !!t && isHome(t) && isHome(playerTile(s))
}
/** 마무리: 담는 모습을 고른다 (아이가 있으면 접시를 아이가 골라도 된다). 재료는 다시 빼지 않는다 */
export function chooseLook(s: GameState, look: number, byKid = false): GameState {
  const r = cookOf(s).run
  if (!r || r.phase !== 'finish' || ![0, 1].includes(look)) return s
  const kid = byKid && kidCanChoose(s) ? look : -1
  return deliverCook(withCooking(s, { run: { ...r, phase: 'ready', look, kid } }))
}
export const readyBlock = (s: GameState): 'full' | null => {
  const r = cookOf(s).run
  return r && r.phase === 'ready' && overflows(s, { [DISHES[r.dish].item]: DISHES[r.dish].qty }) ? 'full' : null
}
/** 완성품 받기: 가방(궤짝)에 자리가 없으면 그대로 기다린다 — 조용히 사라지지 않는다. 시간은 이때 한 번 */
export function deliverCook(s: GameState): GameState {
  const c = cookOf(s), r = c.run
  if (!r || r.phase !== 'ready' || readyBlock(s)) return s
  const def = DISHES[r.dish]
  let next = putAway(s, { [def.item]: def.qty })
  next = {
    ...next,
    flags: { ...next.flags, [`cook:first:${r.dish}`]: next.flags[`cook:first:${r.dish}`] ?? next.clock.day, cookDay: next.clock.day },
    cooking: { ...c, run: undefined, looks: { ...c.looks, [r.dish]: r.look }, made: { ...c.made, [r.dish]: (c.made[r.dish] ?? 0) + 1 } },
  }
  if (r.kid >= 0) next = kidCookMemory(next, r.kid)
  return startCookAct(catchSoot(passTime(next, def.minutes)), r.dish)
}
/** 아이가 접시를 골라 준 날: 가족 기억(그 자리에 있던 아이만), 처음은 가족 앨범 한 장 */
function kidCookMemory(s: GameState, choice: number): GameState {
  let next = recordExperienceIn(s, { id: 'fam:cook', kind: 'family', with: ['family:child'], place: 'home', choice })
  if (!next.flags['fam:cook']) next = { ...next, flags: { ...next.flags, 'fam:cook': 1 }, scenes: [...next.scenes, 'fam:cook'] }
  return next
}
export function setBreadShape(s: GameState, shape: number): GameState {
  return [0, 1].includes(shape) ? withCooking(s, { breadShape: shape }) : s
}

// ── 먹기 ──
export type EatBlock = 'none' | 'notFood' | null
export function canEatDish(s: GameState, item: ItemId): EatBlock {
  if (!COOKED_ITEMS.includes(item)) return 'notFood'
  return count(s.inv, item) > 0 ? null : 'none'
}
function eatEffect(s: GameState, item: ItemId, shared: boolean): GameState {
  const tea = item === 'herbTea'
  const hunger = Math.max(0, s.needs.hunger - (DISH_HUNGER[item] ?? 0))
  return {
    ...s,
    needs: { ...s.needs, hunger },
    flags: { ...s.flags, mealDay: s.clock.day, ...(shared ? { sharedMealDay: s.clock.day } : {}), ...(tea ? {} : { ateDay: s.clock.day }) },
  }
}
/** 혼자 먹기·마시기: 가방에서 한 접시. 시간이 조금 흐르고 그날 기분이 조금 좋아진다 */
export function eatDish(s: GameState, item: ItemId): GameState {
  if (canEatDish(s, item)) return s
  const tea = item === 'herbTea'
  const next = eatEffect({ ...s, inv: take(s.inv, { [item]: 1 })! }, item, false)
  return startAct(passTime(next, tea ? TEA_MINUTES : EAT_MINUTES), tea ? 'drink' : 'sit')
}

// ── 식탁 ──
/** 식탁이 되는 자리: 정해 둔 차 자리(탁자 + 앉을 곳) */
export function diningSpaces(s: Pick<GameState, 'room' | 'spaces' | 'homeLevel' | 'flags' | 'romance' | 'village'>): HomeSpace[] {
  syncHome(s)
  return liveSpaces(s).filter(sp => sp.use === 'tea')
}
const seatIds = ['a', 'b', 'c', 'd']
/** 이 자리에서 동시에 앉을 수 있는 수 (넷까지) */
export function tableCapacity(s: Pick<GameState, 'room'>, sp: HomeSpace): number {
  return Object.keys(reserveSeats(s.room, sp, seatIds)).length
}
export type ServeBlock = 'away' | 'noSpace' | 'busy' | 'noFood' | null
export function canServe(s: GameState): ServeBlock {
  if (!isHome(playerTile(s))) return 'away'
  if (!diningSpaces(s).length) return 'noSpace'
  if (cookOf(s).table) return 'busy'
  if (!COOKED_ITEMS.some(i => count(s.inv, i) > 0)) return 'noFood'
  return null
}
/** 차릴 수 있는 접시 수: 가진 만큼, 자리 수·넷까지 */
export function serveMax(s: GameState, item: ItemId): number {
  const sp = diningSpaces(s)[0]
  return sp ? Math.min(TABLE_MAX, tableCapacity(s, sp), count(s.inv, item)) : 0
}
/** 식탁에 차린다: 가방의 접시를 식탁 회차 재고로 한 번 옮긴다 (먹기·치우기 한 곳에서만 쓴다) */
export function serveTable(s: GameState, item: ItemId, n: number): GameState {
  if (canServe(s) || !COOKED_ITEMS.includes(item) || !Number.isInteger(n) || n < 1 || n > serveMax(s, item)) return s
  const sp = diningSpaces(s)[0]
  const c = cookOf(s)
  const table: TableMeal = { id: `table:${c.meals + 1}`, day: s.clock.day, item, left: n, space: sp.id, ate: [] }
  return withCooking({ ...s, inv: take(s.inv, { [item]: n })! }, { table, meals: c.meals + 1 })
}
/** 식탁이 아직 쓸 수 있는가 (날이 바뀌었거나 가구가 옮겨져 자리가 없어졌으면 아니다) */
function tableLive(s: GameState, t: TableMeal): boolean {
  return t.day === s.clock.day && diningSpaces(s).some(sp => sp.id === t.space)
}
/** 남은 접시 돌려받기 (한 번 — 식탁이 비워진다). 가방이 차도 잃지 않는다 */
export function clearTable(s: GameState): GameState {
  const t = cookOf(s).table
  if (!t) return s
  const back = t.left > 0 ? addGift(s.inv, { [t.item]: t.left }) : s.inv
  return { ...withCooking(s, { table: undefined }), inv: back }
}
/** 틱마다: 날짜가 바뀌었거나 식탁 자리가 없어졌으면 남은 접시를 한 번 돌려주고 비운다 */
export function settleTable(s: GameState): GameState {
  const t = s.cooking?.table
  if (!t) return s
  return tableLive(s, t) ? s : clearTable(s)
}

export interface Diner { id: string; /** 같이 앉을 수 있는가 / 못 앉는 까닭 */ block: null | 'supperDone' | 'busy' }
const near = (a: Tile, b: Tile, d: number) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= d
/** 식탁에 초대할 수 있는 사람: 지금 집 안 식탁 곁에 실제로 있는 배우자·아이·이웃 (아기는 아니다) */
export function dinersNear(s: GameState): Diner[] {
  const t = cookOf(s).table
  const sp = t && diningSpaces(s).find(x => x.id === t.space)
  if (!sp) return []
  const out: Diner[] = []
  const running = new Set(s.plans.appts.filter(a => a.state === 'running').flatMap(a => a.startedWith ?? a.members))
  const partner = s.romance?.stage === 'married' ? s.romance.partner : undefined
  const kid = s.child && ['toddler', 'helper'].includes(childStage(s.child, s.clock.day)) ? childTile(s) : null
  if (kid && isHome(kid) && near(kid, sp.at, 4)) out.push({ id: 'family:child', block: null })
  for (const n of Object.values(s.npcs)) {
    if (!n.visible) continue
    const at = npcTile(n)
    if (!isHome(at) || !near(at, sp.at, 4)) continue
    // 이미 가족 저녁을 먹은 날은 배우자와 새 식사 회차를 만들지 않는다 (같은 날 소비·기억·마음을 두 번 처리하지 않음)
    out.push({ id: n.id, block: n.id === partner && s.flags.supperDay === s.clock.day ? 'supperDone' : running.has(n.id) ? 'busy' : null })
  }
  return out
}
export interface MealReaction { npc: string; kind: 'like' | 'quiet' | 'new' }
/** 주민 취향 반응: 캐릭터의 생활 취향(차·맛보기·텃밭 활동)에서 — 선물 취향을 복사하지 않고, 싫어한다고 관계가 떨어지지 않는다 */
export function mealReaction(npc: string, item: ItemId): MealReaction {
  const a = personOf(npc)?.tastes?.activity ?? {}
  const tea = item === 'herbTea'
  const bean = item === 'beanDish' || item === 'herbBeanDish'
  const likes = tea ? a.tea === 1 : bean ? a.garden === 1 || a.taste === 1 : a.taste === 1
  if (likes) return { npc, kind: 'like' }
  if ((tea ? a.tea : a.taste) === -1) return { npc, kind: 'quiet' }
  return { npc, kind: 'new' }
}
export type SitBlock = 'none' | 'few' | 'away' | 'who' | null
export function canSit(s: GameState, guests: readonly string[]): SitBlock {
  const t = cookOf(s).table
  if (!t || t.left < 1) return 'none'
  if (!isHome(playerTile(s)) || !tableLive(s, t)) return 'away'
  if (t.left < 1 + guests.length) return 'few'
  const ok = new Map(dinersNear(s).map(d => [d.id, d.block]))
  if (new Set(guests).size !== guests.length || guests.some(g => ok.get(g) !== null)) return 'who'
  return null
}
export interface SitResult { state: GameState; reactions: MealReaction[]; firstFamily: boolean }
/** 식탁에서 먹기: 나 + 초대한 사람 수만큼 접시를 쓴다. 함께 먹은 기억은 실제로 앉은 사람만, 식사 한 번마다 고유 id */
export function sitTable(s: GameState, guests: readonly string[]): SitResult | null {
  if (canSit(s, guests)) return null
  const c = cookOf(s), t = c.table!
  const people = [...guests]
  const used = 1 + people.length
  const left = t.left - used
  const shared = people.length > 0
  let next = eatEffect(s, t.item, shared)
  const ate = [...new Set([...t.ate, 'me', ...people])]
  next = withCooking(next, { table: left > 0 ? { ...t, left, ate } : undefined })
  const tableNo = t.id.split(':')[1]
  if (shared) next = recordExperienceIn(next, { id: `meal:${tableNo}`, kind: 'meal', with: people, place: 'home', item: t.item })
  const partner = s.romance?.stage === 'married' ? s.romance.partner : undefined
  const family = people.includes('family:child') || (!!partner && people.includes(partner))
  // 배우자와 함께 앉았으면 오늘의 가족 저녁으로 친다 — 같은 날 가족 저녁 장면이 또 따로 나오지 않는다
  if (partner && people.includes(partner)) next = { ...next, flags: { ...next.flags, supperDay: next.clock.day } }
  const firstFamily = family && !next.flags['fam:meal']
  if (firstFamily) {
    next = recordExperienceIn(next, { id: 'fam:meal', kind: 'family', with: people.filter(p => p === 'family:child' || p === partner), place: 'home', item: t.item })
    next = { ...next, flags: { ...next.flags, 'fam:meal': 1 }, scenes: [...next.scenes, 'fam:meal'] }
  }
  next = startAct(passTime(next, t.item === 'herbTea' ? TEA_MINUTES : TABLE_MINUTES), t.item === 'herbTea' ? 'drink' : 'sit')
  return { state: next, reactions: people.map(p => mealReaction(p, t.item)), firstFamily }
}

// ── 이웃에게 요리 배우기 ──
/** 레시피는 함께한 시간이 아니라 호감도로 연다 (2026-10-07 사용자): 하트가 이만큼 차면 말을 걸 때 알려 준다 */
export const LEARN_HEARTS = 3
export type LearnBlock = 'none' | 'known' | 'unknown' | null
/** 가르쳐 줄 이웃이고, 아직 모르는 요리이고, 하트가 LEARN_HEARTS 이상일 때만 */
export function canLearnDish(s: GameState, npc: string): LearnBlock {
  const dish = dishTaughtBy(npc)
  if (!dish) return 'none'
  if (cookOf(s).learned[dish]) return 'known'
  if (heartsOf(s.hearts[npc]) < LEARN_HEARTS) return 'unknown'
  return null
}
/** 말을 걸 때 알려 준다: 한 번만, 시간은 흐르지 않는다. 재료·물건 보상은 없고, 배운 기억이 가르쳐 준 이웃에게만 남는다 */
export function learnDish(s: GameState, npc: string): GameState {
  if (canLearnDish(s, npc)) return s
  const dish = dishTaughtBy(npc)!
  const next = withCooking(s, { learned: { ...cookOf(s).learned, [dish]: { day: s.clock.day, from: npc } } })
  return recordExperienceIn(next, { id: `learn:cook:${dish}`, kind: 'learn', with: [npc], item: DISHES[dish].item })
}

// ── 저장 ──
const isNat = (v: unknown, max = 999): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max
/** 저장에서 읽기: 모양이 맞는 것만. 하던 요리의 손 동작은 처음 상태로 다시 시작한다(재료는 이미 썼으므로 끝까지 이어 만든다) */
export function sanitizeCooking(raw: unknown): Cooking | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const r = raw as Partial<Cooking>
  const learned: Cooking['learned'] = {}
  for (const d of NEW_DISHES) {
    const v = (r.learned as Record<string, { day?: unknown; from?: unknown }> | undefined)?.[d]
    if (v && DISHES[d].teachers.length && isNat(v.day, 99999) && (v.day as number) > 0 && typeof v.from === 'string' && DISHES[d].teachers.includes(v.from)) learned[d] = { day: v.day as number, from: v.from }
  }
  const looks: Record<string, number> = {}, made: Record<string, number> = {}
  for (const d of NEW_DISHES) {
    const lk = (r.looks as Record<string, unknown> | undefined)?.[d], mk = (r.made as Record<string, unknown> | undefined)?.[d]
    if (lk === 0 || lk === 1) looks[d] = lk
    if (isNat(mk)) made[d] = mk
  }
  const out: Cooking = { learned, looks, made, meals: isNat(r.meals, 99999) ? r.meals : 0, breadShape: r.breadShape === 1 ? 1 : 0 }
  const run = r.run as Partial<CookRun> | undefined
  if (run && typeof run === 'object' && NEW_DISHES.includes(run.dish as DishId) && isNat(run.day, 99999) && ['hand', 'finish', 'ready'].includes(run.phase as string)) {
    const def = DISHES[run.dish as DishId]
    const hand = isNat(run.hand, 9) ? Math.min(run.hand, def.hands.length - 1) : 0
    if (knownDish({ cooking: { ...out } }, run.dish as DishId)) {
      out.run = { dish: run.dish as DishId, day: run.day as number, phase: run.phase as CookRun['phase'], hand, look: run.look === 1 ? 1 : 0, kid: run.kid === 0 || run.kid === 1 ? run.kid : -1, uneven: run.uneven === true,
        mini: run.phase === 'hand' ? startMini(def.hands[hand], () => 0.5) : undefined }
    }
  }
  const t = r.table as Partial<TableMeal> | undefined
  if (t && typeof t === 'object' && typeof t.id === 'string' && /^table:\d+$/.test(t.id) && COOKED_ITEMS.includes(t.item as ItemId) && isNat(t.day, 99999) && isNat(t.left, TABLE_MAX) && (t.left as number) >= 1 && typeof t.space === 'string') {
    out.table = { id: t.id, day: t.day as number, item: t.item as ItemId, left: t.left as number, space: t.space, ate: Array.isArray(t.ate) ? t.ate.filter((a): a is string => typeof a === 'string').slice(0, 8) : [] }
  }
  return out
}

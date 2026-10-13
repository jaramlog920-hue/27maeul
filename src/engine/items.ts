// 가방과 만들기. 모든 수는 0 이상 정수, 한 칸(물건 한 가지)은 최대 MAX_STACK개, 칸은 BAG_SLOTS개까지 (2026-10-12 사용자: 한 칸 99개·50칸).
import type { ItemId, Minigame } from './types'

export type Inventory = Partial<Record<ItemId, number>>
export const MAX_STACK = 99
/** 예전 가죽 가방의 한 칸 최대 — 이제 한 칸 한도가 하나라 MAX_STACK과 같다 (옛 이름을 쓰는 곳을 위해 남김) */
export const BIG_STACK = MAX_STACK
/** 가방 칸 수 — 물건 한 가지가 한 칸 (도구도 한 칸) */
export const BAG_SLOTS = 50

/** 한 번 사면 계속 쓰는 도구 (가방에 하나). 가죽 가방·신 둘은 계획 11 작업 2 (가죽 가방은 2026-10-12부터 팔지 않는다) */
export const TOOLS: readonly ItemId[] = ['goodPen', 'handyKit', 'brightLamp', 'wideDesk', 'leatherBag', 'sturdyShoes', 'lightShoes', 'homeKey', 'speedClock', 'setClock']

/** 한 칸 최대 */
export function stackCap(_inv: Inventory): number {
  return MAX_STACK
}

/** 쓰고 있는 칸 수 (가진 물건 가짓수) */
export function slotsUsed(inv: Inventory): number {
  return Object.values(inv).filter((n) => (n ?? 0) > 0).length
}

/** 이 물건을 넣을 칸이 있는가 — 이미 가진 물건이면 그 칸에, 새 물건이면 빈칸이 있어야 한다 */
export function hasSlotFor(inv: Inventory, id: ItemId): boolean {
  return count(inv, id) > 0 || slotsUsed(inv) < BAG_SLOTS
}
/** 먹을 수 있는 것과 배고픔을 덜어 주는 정도 (좋은 것부터) */
export const FOODS: readonly [ItemId, number][] = [
  ['bread', 50],
  ['honey', 40],
  ['fig', 20],
  ['bean', 15],
  // 직접 만든 음식 (기획 13): 먼저 있는 재료·빵을 아끼지 않도록 뒤에 둔다. 허브 차는 마시는 것이라 포만과 분리(COOKED_ITEMS)
  ['honeyBread', 55],
  ['herbBeanDish', 45],
  ['beanDish', 35],
  ['figPlate', 25],
]
/** 화덕에서 직접 만든 완성 음식 (cooking.ts) — 행사 간식·좌판 상품·식탁에 올릴 수 있다. 말씀과 무관한 생활 음식뿐 */
export const COOKED_ITEMS: readonly ItemId[] = ['beanDish', 'herbBeanDish', 'honeyBread', 'figPlate', 'herbTea']
/** 한 끼(한 접시)가 덜어 주는 배고픔. 허브 차는 0 — 약효를 붙이지 않는다 */
export const DISH_HUNGER: Partial<Record<ItemId, number>> = { honeyBread: 55, herbBeanDish: 45, beanDish: 35, figPlate: 25, herbTea: 0 }

export function count(inv: Inventory, id: ItemId): number {
  return inv[id] ?? 0
}

export function has(inv: Inventory, need: Partial<Record<ItemId, number>>): boolean {
  return (Object.entries(need) as [ItemId, number][]).every(([id, n]) => count(inv, id) >= n)
}

/** 넣기. 넘치는 만큼은 버려지고, 실제로 들어간 수를 함께 돌려준다 */
export function add(inv: Inventory, gives: Partial<Record<ItemId, number>>): Inventory {
  const out = { ...inv }
  const stack = stackCap(inv)
  for (const [id, n] of Object.entries(gives) as [ItemId, number][]) {
    if (n <= 0) continue
    // 빈칸이 없으면 새 물건은 들어가지 않는다
    if (!hasSlotFor(out, id)) continue
    const cap = TOOLS.includes(id) ? 1 : stack
    const now = count(out, id)
    // 선물로 이미 한도를 넘은 수는 줄이지 않는다
    out[id] = Math.max(now, Math.min(cap, now + n))
  }
  return out
}

/**
 * 이웃의 선물·돌려받는 물건처럼 거절할 수 없는 것: 한 칸 99개·50칸을 넘어도 받는다 (도구는 하나) —
 * 잃어버리지 않는 쪽 (2026-10-12: 한 칸 99개·50칸은 내가 넣는 것에만)
 */
export function addGift(inv: Inventory, gives: Partial<Record<ItemId, number>>): Inventory {
  const out = { ...inv }
  for (const [id, n] of Object.entries(gives) as [ItemId, number][]) out[id] = TOOLS.includes(id) ? 1 : count(out, id) + n
  return out
}

export function take(inv: Inventory, need: Partial<Record<ItemId, number>>): Inventory | null {
  if (!has(inv, need)) return null
  const out = { ...inv }
  for (const [id, n] of Object.entries(need) as [ItemId, number][]) {
    const left = count(out, id) - n
    if (left > 0) out[id] = left
    else delete out[id]
  }
  return out
}

export type RecipeId = 'bread' | 'papyrus' | 'ink' | 'oil' | 'blanket' | 'cover' | 'scentCandle' | 'creamPaper' | 'fineThread' | 'homeCradle'

export interface Recipe {
  id: RecipeId
  at: 'hearth' | 'workbench' | 'press'
  needs: Partial<Record<ItemId, number>>
  gives: Partial<Record<ItemId, number>>
  minutes: number
  minigame: Minigame
}

export const RECIPES: Record<RecipeId, Recipe> = {
  bread: { id: 'bread', at: 'hearth', needs: { barley: 1, water: 1 }, gives: { bread: 2 }, minutes: 30, minigame: 'mash' },
  papyrus: { id: 'papyrus', at: 'workbench', needs: { reed: 1 }, gives: { papyrus: 1 }, minutes: 30, minigame: 'weave' },
  ink: { id: 'ink', at: 'workbench', needs: { soot: 1, water: 1 }, gives: { ink: 1 }, minutes: 20, minigame: 'mash' },
  oil: { id: 'oil', at: 'press', needs: { olive: 2 }, gives: { oil: 1 }, minutes: 30, minigame: 'hold' },
  blanket: { id: 'blanket', at: 'workbench', needs: { wool: 3 }, gives: { blanket: 1 }, minutes: 60, minigame: 'timing' },
  cover: { id: 'cover', at: 'workbench', needs: { papyrus: 2, wool: 1 }, gives: { cover: 1 }, minutes: 40, minigame: 'order' },
  // 향초 (계획 13 작업 4): 장날에 파는 물건
  scentCandle: { id: 'scentCandle', at: 'workbench', needs: { oil: 1, wool: 1 }, gives: { scentCandle: 2 }, minutes: 40, minigame: 'hold' },
  // 꾸미기 재료 (계획 14): 파피루스 두 장을 곱게 펴 크림색 종이 한 장, 양털 한 뭉치를 자아 좋은 실 한 타래 — 특별 제본에 쓴다
  creamPaper: { id: 'creamPaper', at: 'workbench', needs: { papyrus: 2 }, gives: { creamPaper: 1 }, minutes: 20, minigame: 'weave' },
  fineThread: { id: 'fineThread', at: 'workbench', needs: { wool: 1 }, gives: { fineThread: 1 }, minutes: 20, minigame: 'timing' },
  homeCradle: { id: 'homeCradle', at: 'workbench', needs: { reed: 3, blanket: 1 }, gives: { homeCradle: 1 }, minutes: 60, minigame: 'weave' },
}

/** 생활 제작의 결과. */
export function recipeGives(r: Recipe, _inv: Inventory, flags: Record<string, number> = {}): Partial<Record<ItemId, number>> {
  // 새 손잡이를 단 기름틀은 한 병 더
  if (r.id === 'oil' && (flags['unlock:pressHandle'] ?? 0) > 0) return { oil: 2 }
  return r.gives
}

export function craft(inv: Inventory, r: Recipe, flags: Record<string, number> = {}): Inventory | null {
  const left = take(inv, r.needs)
  return left ? add(left, recipeGives(r, inv, flags)) : null
}

/** 한 장을 다 쓰는 데 드는 것 */
export const CHAPTER_COST: Partial<Record<ItemId, number>> = { papyrus: 1, ink: 1 }

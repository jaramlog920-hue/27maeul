// 가방과 만들기. 모든 수는 0 이상 정수, 한 물건은 최대 stackCap(inv)개 (가죽 가방이 있으면 BIG_STACK).
import type { ItemId, Minigame } from './types'

export type Inventory = Partial<Record<ItemId, number>>
export const MAX_STACK = 9
/** 가죽 가방이 있을 때 한 칸 최대 (계획 11 작업 2) */
export const BIG_STACK = 18

/** 한 번 사면 계속 쓰는 도구 (가방에 하나). 가죽 가방·신 둘은 계획 11 작업 2 */
export const TOOLS: readonly ItemId[] = ['goodPen', 'handyKit', 'brightLamp', 'wideDesk', 'leatherBag', 'sturdyShoes', 'lightShoes']

/** 이 가방의 한 칸 최대 — 가죽 가방이 있으면 18 */
export function stackCap(inv: Inventory): number {
  return (inv.leatherBag ?? 0) > 0 ? BIG_STACK : MAX_STACK
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
    const cap = TOOLS.includes(id) ? 1 : stack
    const now = count(out, id)
    // 선물로 이미 한도를 넘은 수는 줄이지 않는다
    out[id] = Math.max(now, Math.min(cap, now + n))
  }
  return out
}

/** 이웃의 선물처럼 거절할 수 없는 것: 한도를 넘어도 받는다 (도구는 하나) */
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

export type RecipeId = 'bread' | 'papyrus' | 'ink' | 'oil' | 'blanket' | 'cover' | 'scentCandle' | 'creamPaper' | 'fineThread'

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

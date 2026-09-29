// 가방과 만들기. 모든 수는 0 이상 정수, 한 물건은 최대 MAX_STACK개.
import type { ItemId } from './types'

export type Inventory = Partial<Record<ItemId, number>>
export const MAX_STACK = 9

export const TOOLS: readonly ItemId[] = ['goodPen', 'brightLamp']
/** 먹을 수 있는 것과 배고픔을 덜어 주는 정도 (좋은 것부터) */
export const FOODS: readonly [ItemId, number][] = [
  ['bread', 50],
  ['honey', 40],
  ['fig', 20],
  ['bean', 15],
]

export function count(inv: Inventory, id: ItemId): number {
  return inv[id] ?? 0
}

export function has(inv: Inventory, need: Partial<Record<ItemId, number>>): boolean {
  return (Object.entries(need) as [ItemId, number][]).every(([id, n]) => count(inv, id) >= n)
}

/** 넣기. 넘치는 만큼은 버려지고, 실제로 들어간 수를 함께 돌려준다 */
export function add(inv: Inventory, gives: Partial<Record<ItemId, number>>): Inventory {
  const out = { ...inv }
  for (const [id, n] of Object.entries(gives) as [ItemId, number][]) {
    const cap = TOOLS.includes(id) ? 1 : MAX_STACK
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

export type RecipeId = 'bread' | 'papyrus' | 'ink' | 'oil' | 'blanket'

export interface Recipe {
  id: RecipeId
  at: 'hearth' | 'workbench' | 'press'
  needs: Partial<Record<ItemId, number>>
  gives: Partial<Record<ItemId, number>>
  minutes: number
  minigame: 'mash' | 'timing' | 'pick'
}

export const RECIPES: Record<RecipeId, Recipe> = {
  bread: { id: 'bread', at: 'hearth', needs: { barley: 1, water: 1 }, gives: { bread: 2 }, minutes: 30, minigame: 'mash' },
  papyrus: { id: 'papyrus', at: 'workbench', needs: { reed: 1 }, gives: { papyrus: 1 }, minutes: 30, minigame: 'timing' },
  ink: { id: 'ink', at: 'workbench', needs: { soot: 1, water: 1 }, gives: { ink: 1 }, minutes: 20, minigame: 'mash' },
  oil: { id: 'oil', at: 'press', needs: { olive: 2 }, gives: { oil: 1 }, minutes: 30, minigame: 'mash' },
  blanket: { id: 'blanket', at: 'workbench', needs: { wool: 3 }, gives: { blanket: 1 }, minutes: 60, minigame: 'timing' },
}

/** 좋은 펜이 있으면 잉크 한 번 만들 때 두 병 */
export function recipeGives(r: Recipe, inv: Inventory, flags: Record<string, number> = {}): Partial<Record<ItemId, number>> {
  if (r.id === 'ink' && count(inv, 'goodPen') > 0) return { ink: 2 }
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

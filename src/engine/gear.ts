// 장비 (2026-10-13 사용자: 신발처럼 능력이 붙는 물건은 장비처럼 빼고 낄 수 있게).
// 가방에 있으면 기본으로 낀 것이다 — 뺀 것만 gearOff에 적는다 (옛 저장은 모두 낀 채로).
// 신은 한 켤레만: 하나를 끼면 다른 신은 빠진다.
import { count, type Inventory } from './items'
import type { ItemId } from './types'

export const GEAR: readonly ItemId[] = ['sturdyShoes', 'lightShoes', 'goodPen', 'brightLamp', 'handyKit']
const SHOES: readonly ItemId[] = ['sturdyShoes', 'lightShoes']

export const isGear = (id: ItemId): boolean => GEAR.includes(id)

type Worn = { inv: Inventory; gearOff?: readonly ItemId[] }

/** 지금 끼고 있는가 (가방에 있고, 빼 두지 않았다) */
export function wearing(s: Worn, id: ItemId): boolean {
  if (count(s.inv, id) <= 0) return false
  if (s.gearOff?.includes(id)) return false
  // 신 둘을 다 가졌고 둘 다 낀 옛 저장: 더 좋은 가벼운 신만 신은 것으로 본다
  if (id === 'sturdyShoes' && wearing(s, 'lightShoes')) return false
  return true
}

/** 끼기·빼기. 신을 끼면 다른 신은 뺀다 */
export function toggleGear<S extends Worn>(s: S, id: ItemId): S {
  if (!isGear(id) || count(s.inv, id) <= 0) return s
  const off = new Set(s.gearOff ?? [])
  if (wearing(s, id)) off.add(id)
  else {
    off.delete(id)
    if (SHOES.includes(id)) for (const o of SHOES) if (o !== id && count(s.inv, o) > 0) off.add(o)
  }
  return { ...s, gearOff: [...off] }
}

/** 불러올 때: 장비 id만, 한 번씩 */
export function sanitizeGearOff(raw: unknown): ItemId[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out = [...new Set(raw.filter((x): x is ItemId => typeof x === 'string' && GEAR.includes(x as ItemId)))]
  return out.length ? out : undefined
}

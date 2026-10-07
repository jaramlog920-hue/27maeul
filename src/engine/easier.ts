// 편해지는 살림 (계획 11 작업 1): 아침에 저절로 생기는 재료와 재료 궤짝.
// 모두 "덜 반복"이지 "공짜"가 아니다 — 저절로 생기는 것은 하루 한두 개로 묶는다 (설계의 하루 리듬, 균형 시뮬레이션 테스트).
// 가진 것은 flags[`unlock:${id}`] (이웃 부탁이 연 것과 같은 표식) — 가방 칸을 차지하지 않는 설치물이다.
// 계획 14부터 틀과 항아리는 파피루스·잉크 대신 꾸미기 재료(크림색 종이·푸른 염료)를 만든다 — 하루 양은 그대로.
// 잉크 항아리·재료 궤짝은 방 꾸미기 가구로도 받아 집 안 자리를 고를 수 있다(그림일 뿐, 효과는 설치 표식으로).
import { unlocked } from './bonds'
import { add, count, MAX_STACK, stackCap, TOOLS, type Inventory } from './items'
import type { ItemId } from './types'

type Items = Partial<Record<ItemId, number>>

export type EasyId = 'rainJar' | 'reedRack' | 'sootCatcher' | 'inkJar' | 'supplyChest' | 'homeMailbox' | 'homeCoolCupboard'

export function owns(flags: Record<string, number>, id: EasyId): boolean {
  return unlocked(flags, id)
}

/** 목수에게 부탁해 짓는 것 (부탁한 다음 날 아침 지어진다 — 집 넓히기와 같은 흐름) */
export interface CarpenterWork {
  id: Extract<EasyId, 'reedRack' | 'sootCatcher' | 'supplyChest' | 'homeCoolCupboard'>
  coins: number
  /** 지어지면 가방에 들어오는 가구 (집 안 자리를 고른다) */
  item?: ItemId
}
export const CARPENTER_WORKS: readonly CarpenterWork[] = [
  { id: 'supplyChest', coins: 50, item: 'supplyChest' },
  { id: 'sootCatcher', coins: 60 },
  { id: 'reedRack', coins: 80 },
  // 서늘한 찬장 (2026-10-08): 음식만 넣어 두는 찬장 — 집 안 자리를 고른다
  { id: 'homeCoolCupboard', coins: 70, item: 'homeCoolCupboard' },
]

/** 빗물 항아리: 아침마다 물 1, 비 온 다음 날 아침 물 3 */
export const RAIN_WATER = { usual: 1, afterRain: 3 } as const
/**
 * 갈대 말리는 틀: 밤마다 크림색 종이 1 (계획 14 — 필사에 재료가 들지 않으니 파피루스 대신 특별 제본의 꾸미기 재료).
 * 가방·궤짝에 이만큼 있으면 쉬어 간다 — 가죽 가방이 있어도 9, 과하게 쌓이지 않게
 */
export const RACK_PAPER = 1
export const RACK_HOLD = MAX_STACK
/** 그을음 받이: 화덕을 쓸 때마다 그을음 1 — 하루 두 번까지, 가진 그을음이 다섯이면 더 모이지 않는다 */
export const SOOT_CATCH = { perDay: 2, hold: 5 } as const
/**
 * 잉크 항아리: 물 1이 있으면 아침마다 푸른 염료 1 (계획 14 — 잉크 대신 특별 제본의 꾸미기 재료).
 * 가진 염료가 셋이면 쉬어 간다 (과하게 쌓이지 않게)
 */
export const INK_JAR_HOLD = 3
/** 재료 궤짝 한 칸 최대 */
export const CHEST_STACK = 30

// ── 가방과 궤짝 ──

/** 가방과 궤짝을 합친 수 */
export function stock(inv: Inventory, chest: Inventory | null, id: ItemId): number {
  return count(inv, id) + (chest ? count(chest, id) : 0)
}

export function hasStock(inv: Inventory, chest: Inventory | null, need: Items): boolean {
  return (Object.entries(need) as [ItemId, number][]).every(([id, n]) => stock(inv, chest, id) >= n)
}

/** 가방에서 먼저, 모자라면 궤짝에서 꺼내 쓴다. 모자라면 null */
export function takeStock(inv: Inventory, chest: Inventory | null, need: Items): { inv: Inventory; chest: Inventory | null } | null {
  if (!hasStock(inv, chest, need)) return null
  const bag = { ...inv }
  const box = chest ? { ...chest } : null
  for (const [id, n] of Object.entries(need) as [ItemId, number][]) {
    const fromBag = Math.min(count(bag, id), n)
    const left = count(bag, id) - fromBag
    if (left > 0) bag[id] = left
    else delete bag[id]
    const rest = n - fromBag
    if (rest > 0 && box) {
      const l = count(box, id) - rest
      if (l > 0) box[id] = l
      else delete box[id]
    }
  }
  return { inv: bag, chest: box }
}

/** 받은 것을 넣는다: 가방이 차면 남는 것은 궤짝으로 (궤짝이 없거나 차면 예전처럼 넘치는 만큼 버려진다). 도구는 가방에 하나 */
export function stash(inv: Inventory, chest: Inventory | null, gives: Items): { inv: Inventory; chest: Inventory | null } {
  if (!chest) return { inv: add(inv, gives), chest }
  let bag = inv
  const box = { ...chest }
  for (const [id, n] of Object.entries(gives) as [ItemId, number][]) {
    if (TOOLS.includes(id)) {
      bag = add(bag, { [id]: n })
      continue
    }
    const room = Math.max(0, stackCap(bag) - count(bag, id))
    const toBag = Math.min(room, n)
    if (toBag > 0) bag = add(bag, { [id]: toBag })
    const toBox = Math.min(n - toBag, Math.max(0, CHEST_STACK - count(box, id)))
    if (toBox > 0) box[id] = count(box, id) + toBox
  }
  return { inv: bag, chest: box }
}

/** 넣으면 넘쳐서 버려지는 것이 있는가 (가방 + 궤짝) */
export function stashOverflows(inv: Inventory, chest: Inventory | null, gives: Items): boolean {
  return (Object.entries(gives) as [ItemId, number][]).some(([id, n]) => {
    if (TOOLS.includes(id)) return false
    if (!chest) return count(inv, id) + n > stackCap(inv)
    return Math.max(0, stackCap(inv) - count(inv, id)) + Math.max(0, CHEST_STACK - count(chest, id)) < n
  })
}

/** 궤짝에서 가방으로 꺼낸다 (가방에 들어가는 만큼만). 꺼낼 것이 없으면 null */
export function fromChest(inv: Inventory, chest: Inventory, id: ItemId): { inv: Inventory; chest: Inventory } | null {
  const n = Math.min(count(chest, id), Math.max(0, stackCap(inv) - count(inv, id)))
  if (n <= 0) return null
  const box = { ...chest }
  if (count(box, id) - n > 0) box[id] = count(box, id) - n
  else delete box[id]
  return { inv: { ...inv, [id]: count(inv, id) + n }, chest: box }
}

// ── 신 (계획 11 작업 2) ──

/** 걷는 속도 배수: 튼튼한 신(장날) ×1.2, 가벼운 신(양치기 선물) ×1.4 — 이 이상은 없다 (도트가 미끄러져 보이지 않게) */
export const WALK_MUL = { sturdyShoes: 1.2, lightShoes: 1.4 } as const

export function walkMul(inv: Inventory): number {
  if (count(inv, 'lightShoes') > 0) return WALK_MUL.lightShoes
  if (count(inv, 'sturdyShoes') > 0) return WALK_MUL.sturdyShoes
  return 1
}

/** 가벼운 신: 튼튼한 신을 산 뒤, 양치기와 마음 5가 되면 인사할 때 준다 (한 번) */
export const LIGHT_SHOES = { npc: 'shepherd', hearts: 5 } as const

// ── 집 앞 편지함 (계획 11 작업 3) ──

/** 집 앞 편지함: 편지 나르는 이웃과 마음 4가 되면 문 왼쪽에 세워 준다 (한 번, 짧은 장면) */
export const HOME_MAILBOX = { npc: 'postman', hearts: 4 } as const

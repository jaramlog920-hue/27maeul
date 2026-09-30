// 아이 (계획 12): 결혼 뒤 태어나 자라고, 자라서 살림을 돕는다. 대를 이어 아이로 플레이하지 않는다 (사용자 결정 2026-09-30).
// 아이는 부모의 능력치 '타고난 값'을 물려받는다 — 플레이어 쪽: 단계 4 이상인 능력치 +1, 배우자 쪽: 집안의 잘하는 능력치 +1 (최대 2).
// 자라는 단계: 아기(요람) → 걷는 아이(곁을 따라다님) → 돕는 아이(혼자 마을을 다니며 하루 한 번 돕는다).
// 모든 도움은 "덜 반복"이지 "공짜"가 아니다 — 하루 한 번, 한 개씩.
import { mulberry32 } from './offers'
import { freshStats, sanitizeStats, STAT_IDS, type StatId, type Stats } from './stats'
import type { Tile } from './types'
import { HOME_FRONT, SIDE_ROOM } from './world'

export type ChildLook = 'boy' | 'girl'
export type ChildStage = 'baby' | 'toddler' | 'helper'

export interface Child {
  name: string
  look: ChildLook
  /** 태어난 날 */
  born: number
  /** 아이의 능력치 (타고난 값은 부모에게서, 단계는 스스로 돕는 일로 오른다) */
  stats: Stats
  /** 같을 때 먼저 고르는 능력치 (배우자 집안의 능력치) */
  lean: StatId | null
}

/** 결혼하고 이만큼 지난 아침에 태어난다 */
export const CHILD_AFTER_WEDDING = 14
/** 아기 → 걷는 아이 → 돕는 아이 (태어난 날부터 센 날) */
export const TODDLER_AT = 14
export const HELPER_AT = 42

/** 이름 (성 없이 이름만, 짧은 목록에서 골라 주고 '다른 이름'으로 다시 뽑는다 — 2026-09-30 사용자 결정) */
export const CHILD_NAMES: Record<ChildLook, readonly string[]> = {
  boy: ['테디', '핀', '재스퍼', '오티스'],
  girl: ['루시', '윌로우', '데이지', '로지'],
}

export function childStage(c: Pick<Child, 'born'>, day: number): ChildStage {
  const age = day - c.born
  return age >= HELPER_AT ? 'helper' : age >= TODDLER_AT ? 'toddler' : 'baby'
}

/** 물려받는 타고난 값: 플레이어의 단계 4 이상 능력치 +1, 배우자 집안 능력치 +1, 한 능력치 최대 2 */
export function inheritBorn(player: Stats, spouseStat: StatId | undefined): Partial<Record<StatId, number>> {
  const out: Partial<Record<StatId, number>> = {}
  for (const id of STAT_IDS) if ((player[id]?.level ?? 1) >= 4) out[id] = 1
  if (spouseStat) out[spouseStat] = Math.min(2, (out[spouseStat] ?? 0) + 1)
  return out
}

/** 날 씨앗으로 아이의 모습과 첫 이름 */
export function newChild(day: number, player: Stats, spouseStat: StatId | undefined): Child {
  const rnd = mulberry32(day * 613 + 29)
  const look: ChildLook = rnd() < 0.5 ? 'boy' : 'girl'
  const names = CHILD_NAMES[look]
  return { name: names[Math.floor(rnd() * names.length)], look, born: day, stats: freshStats(inheritBorn(player, spouseStat)), lean: spouseStat ?? null }
}

/** '다른 이름': 목록에서 지금 이름 다음 것 */
export function nextName(c: Pick<Child, 'name' | 'look'>): string {
  const names = CHILD_NAMES[c.look]
  return names[(names.indexOf(c.name) + 1) % names.length]
}

/** 아이가 하루 한 번 하는 일: 타고난 값이 가장 높은 능력치 (같으면 배우자 쪽 능력치를 먼저) */
export function helpStat(c: Pick<Child, 'stats' | 'lean'>): StatId {
  let best: StatId = c.lean ?? 'strength'
  let n = c.stats[best]?.born ?? 0
  for (const id of STAT_IDS) {
    const b = c.stats[id]?.born ?? 0
    if (b > n) [best, n] = [id, b]
  }
  return best
}

/** 요람 자리와 아이가 밤에 자는 자리: 내 집 넓힌 방 */
export const CRADLE_SPOT: Tile = { x: SIDE_ROOM.x0 + 1, y: SIDE_ROOM.y1 }

/** 돕는 아이가 하루 동안 다니는 자리 (아침 우물가 → 낮 장터 → 저녁 집 앞 → 밤 집 안) */
export const HELPER_SPOTS: readonly { from: number; at: Tile }[] = [
  { from: 7 * 60, at: { x: 23, y: 15 } },
  { from: 11 * 60, at: { x: 28, y: 15 } },
  { from: 16 * 60, at: { x: HOME_FRONT.x - 1, y: HOME_FRONT.y } },
  { from: 20 * 60, at: CRADLE_SPOT },
]

export function helperSpot(minute: number): Tile {
  let at = CRADLE_SPOT
  for (const s of HELPER_SPOTS) if (minute >= s.from) at = s.at
  return at
}

export function sanitizeChild(raw: unknown): Child | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<Child>
  if (typeof o.name !== 'string' || (o.look !== 'boy' && o.look !== 'girl') || typeof o.born !== 'number') return null
  const lean = typeof o.lean === 'string' && (STAT_IDS as readonly string[]).includes(o.lean) ? (o.lean as StatId) : null
  return { name: o.name.slice(0, 12), look: o.look, born: o.born, stats: sanitizeStats(o.stats), lean }
}

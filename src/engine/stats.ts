// 능력치 다섯 (계획 11 작업 4): 지능·손재주·매력·근력·운.
// 능력치마다 단계(1–5, 일을 하면 오름)·경험치·타고난 값(0–2, 물려받는 값 — 한 칸마다 경험치가 25% 더 빨리 쌓인다).
// 플레이어의 타고난 값은 모두 0. 아이(계획 12)도 같은 모양을 한 벌 더 가진다.
// 모두 "덜 반복"이지 "공짜"가 아니다 — 효과는 작고, 필사(옮겨 적기·엮기)는 빨라지지 않는다.
import { mulberry32 } from './offers'

export type StatId = 'wit' | 'hand' | 'charm' | 'strength' | 'luck'
/** 화면에 보이는 차례: 지능·손재주·매력·근력·운 */
export const STAT_IDS: readonly StatId[] = ['wit', 'hand', 'charm', 'strength', 'luck']

export interface Stat {
  /** 단계 1–5 */
  level: number
  /** 지금 단계에서 쌓인 경험치 */
  xp: number
  /** 타고난 값 0–2 (물려받는 값) */
  born: number
}
export type Stats = Record<StatId, Stat>

export const MAX_LEVEL = 5
export const MAX_BORN = 2
/** 다음 단계까지 필요한 경험치 (1→2, 2→3, 3→4, 4→5) */
export const XP_TO_NEXT: readonly number[] = [30, 60, 100, 150]
/** 타고난 값 한 칸마다 경험치가 이만큼 더 쌓인다 */
export const BORN_BONUS = 0.25

/** 하는 일마다 쌓이는 경험치 */
export const XP = {
  /** 지능: 장 기록 퀴즈를 맞힐 때마다, 서고 퀴즈, 이웃 이야기 듣기 */
  quizRight: 3,
  listen: 2,
  /** 손재주: 작업대·화덕 일 */
  craft: 3,
  /** 매력: 인사·선물·돕기 */
  greet: 1,
  gift: 2,
  help: 2,
  /** 근력: 모으기(물·갈대·보리·열매)·텃밭·돕기 */
  gather: 2,
  garden: 1,
  /** 운: 일로는 오르지 않는다 — 맑은 밤 별 보기·마을 잔치 같은 날에만 조금 */
  stars: 4,
  festival: 6,
} as const

export function freshStats(born: Partial<Record<StatId, number>> = {}): Stats {
  return Object.fromEntries(STAT_IDS.map((id) => [id, { level: 1, xp: 0, born: clampBorn(born[id]) }])) as Stats
}

function clampBorn(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(MAX_BORN, Math.floor(n))) : 0
}

/** 옛 저장(칸이 없던 때)이나 이상한 값은 1단계·0으로 */
export function sanitizeStats(raw: unknown): Stats {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, Partial<Stat> | undefined>
  const out = freshStats()
  for (const id of STAT_IDS) {
    const r = o[id]
    if (!r || typeof r !== 'object') continue
    const level = typeof r.level === 'number' && Number.isFinite(r.level) ? Math.max(1, Math.min(MAX_LEVEL, Math.floor(r.level))) : 1
    const cap = level >= MAX_LEVEL ? 0 : XP_TO_NEXT[level - 1]
    const xp = typeof r.xp === 'number' && Number.isFinite(r.xp) ? Math.max(0, Math.min(cap, r.xp)) : 0
    out[id] = { level, xp, born: clampBorn(r.born) }
  }
  return out
}

/** 지금 단계 (저장에 칸이 없어도 1) */
export function levelOf(stats: Stats | undefined, id: StatId): number {
  return stats?.[id]?.level ?? 1
}

/** 경험치를 더한다 (타고난 값만큼 더 빨리). 5단계면 더 쌓이지 않는다 */
export function addXp(stats: Stats | undefined, id: StatId, xp: number): Stats {
  const base = stats ?? freshStats()
  const cur = base[id] ?? { level: 1, xp: 0, born: 0 }
  if (cur.level >= MAX_LEVEL || xp <= 0) return base
  let level = cur.level
  let got = cur.xp + xp * (1 + BORN_BONUS * cur.born)
  while (level < MAX_LEVEL && got >= XP_TO_NEXT[level - 1]) {
    got -= XP_TO_NEXT[level - 1]
    level++
  }
  // 소수는 둘째 자리까지 (저장을 깔끔하게)
  return { ...base, [id]: { ...cur, level, xp: level >= MAX_LEVEL ? 0 : Math.round(got * 100) / 100 } }
}

/** 1단계부터 쌓은 경험치 모두 */
export function totalXp(stat: Stat | undefined): number {
  if (!stat) return 0
  return XP_TO_NEXT.slice(0, stat.level - 1).reduce((a, b) => a + b, 0) + stat.xp
}

/** 한 번의 일로 쌓일 수 있는 가장 큰 경험치 (타고난 값 2까지 쳐서) — 이보다 크게 뛰면 저장을 불러온 것이다 */
export const MAX_STEP_XP = Math.max(...Object.values(XP)) * (1 + BORN_BONUS * MAX_BORN)

/**
 * 이번 일로 단계가 오른 능력치들 (알림용). 저장을 불러오거나 새로 시작해 한꺼번에 크게 바뀐 것은 치지 않는다
 */
export function leveledUp(before: Stats | undefined, after: Stats | undefined): StatId[] {
  if (!after) return []
  return STAT_IDS.filter((id) => {
    const gained = totalXp(after[id]) - totalXp(before?.[id] ?? { level: 1, xp: 0, born: 0 })
    return levelOf(after, id) > levelOf(before, id) && gained > 0 && gained <= MAX_STEP_XP
  })
}

/** 다음 단계까지 얼마나 찼는가 0–1 (5단계면 1) */
export function progressOf(stat: Stat): number {
  if (stat.level >= MAX_LEVEL) return 1
  return Math.min(1, stat.xp / XP_TO_NEXT[stat.level - 1])
}

// ── 효과 (작게) ──

/** 가끔 하나 더: 손재주·근력 단계마다 4%, 운 단계마다 3% (1단계는 0) */
export function extraChance(stats: Stats | undefined, id: 'hand' | 'strength'): number {
  return 0.04 * (levelOf(stats, id) - 1) + 0.03 * (levelOf(stats, 'luck') - 1)
}

/**
 * 가끔 하나 더 — 같은 날·같은 일·몇 번째인지로 정해지는 씨앗 (엔진은 난수를 받지 않는 함수가 많아서).
 * salt: 일마다 다른 수, n: 오늘 몇 번째
 */
export function luckyExtra(stats: Stats | undefined, id: 'hand' | 'strength', day: number, salt: number, n: number): boolean {
  const chance = extraChance(stats, id)
  if (chance <= 0) return false
  return mulberry32(day * 9973 + salt * 131 + n * 7 + 17)() < chance
}

/** 근력: 일할 때 피로가 덜 쌓인다 — 단계마다 6% (5단계 24%) */
export function tiredScale(stats: Stats | undefined): number {
  return 1 - 0.06 * (levelOf(stats, 'strength') - 1)
}

/** 매력: 하트가 조금 더 — 3단계 +1점, 5단계 +2점 (하트 하나 = 10점) */
export function charmBonus(stats: Stats | undefined): number {
  return Math.floor((levelOf(stats, 'charm') - 1) / 2)
}

/** 매력: 장날 파는 값 +1닢 (3단계부터) */
export function sellBonus(stats: Stats | undefined): number {
  return levelOf(stats, 'charm') >= 3 ? 1 : 0
}

/** 지능: 장 기록 퀴즈에서 흐리게 보이는 틀린 보기 수 — 3단계 하나, 5단계 둘 */
export function quizDims(stats: Stats | undefined): number {
  const l = levelOf(stats, 'wit')
  return l >= 5 ? 2 : l >= 3 ? 1 : 0
}

/** 손재주: 작업대 손놀림이 너그럽게 — 단계마다 5% (찧기 한 번에 더 차고, 타이밍 구간이 넓어진다) */
export function handEase(stats: Stats | undefined): number {
  return 0.05 * (levelOf(stats, 'hand') - 1)
}

/** 운: 비 온 다음 날 빗물 +1 (3단계부터) */
export function rainBonus(stats: Stats | undefined): number {
  return levelOf(stats, 'luck') >= 3 ? 1 : 0
}

/** 운: 이웃이 찾아와 선물할 확률에 더하는 값 — 단계마다 +5% */
export function visitBonus(stats: Stats | undefined): number {
  return 0.05 * (levelOf(stats, 'luck') - 1)
}

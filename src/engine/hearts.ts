// 이웃과의 마음: 속으로는 점수(0~100)를 쌓고, 10점마다 하트 하나로 보인다.
// 반복 교류는 주민별 하루 총량으로 제한하고, 중요한 첫 이야기는 별도로 보상한다.

export const MAX_POINTS = 100
export const POINTS_PER_HEART = 10
export const DAILY_HEART_CAP = 6
export const ROMANCE_HEART_CAPS = { early: 50, close: 70, confession: 80, dating: 90 } as const
/** 그날 실제로 오른 일상 마음과 실제 적용한 매력 보너스. 저장 후에도 이어진다. */
export interface HeartDay { day: number; gains: Record<string, number>; charm: string[] }
export function sanitizeHeartDay(raw: unknown, day: number, ids: readonly string[]): HeartDay | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const value = raw as Partial<HeartDay>
  if (value.day !== day || !value.gains || typeof value.gains !== 'object' || Array.isArray(value.gains)) return undefined
  const allowed = new Set(ids)
  const gains = Object.fromEntries(Object.entries(value.gains).filter(([id, n]) => allowed.has(id) && Number.isInteger(n) && n >= 0 && n <= DAILY_HEART_CAP))
  const charm = Array.isArray(value.charm) ? [...new Set(value.charm.filter(id => typeof id === 'string' && allowed.has(id)))] : []
  return { day, gains, charm }
}

export const GAIN = {
  talk: 1,
  help: 2,
  /** 함께 일하기를 끝까지 (2시간) — 돕기보다 조금 더 (2026-10-07 사용자) */
  work: 3,
  giftLiked: 3,
  giftPlain: 1,
  request: 6,
  dinner: 4,
} as const

export function heartsOf(points: number | undefined): number {
  return Math.floor(Math.min(MAX_POINTS, Math.max(0, points ?? 0)) / POINTS_PER_HEART)
}

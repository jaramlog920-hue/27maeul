// 게임 시간. 실제 1초 = 게임 1분. 시간 제한은 없고, 잠자리에 들어야 다음 날이 된다.
import type { Phase, Season } from './types'

export interface Clock {
  day: number
  minute: number
}

export const DAY_START = 6 * 60
export const LATE = 23 * 60
export const LATE_WAKE = 8 * 60
/** 이 시각(다음 날 02:00)에서 시간이 멈춘다 — 밤을 무한히 흘리지 않기 위해 */
export const MINUTE_CAP = 26 * 60
export const MINUTES_PER_SECOND = 1
/** 한 계절은 40일 (1년 160일 — 2026-09-30 사용자) */
export const SEASON_DAYS = 40
const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter']

export function newClock(): Clock {
  return { day: 1, minute: DAY_START }
}

export function advance(c: Clock, seconds: number): Clock {
  return { day: c.day, minute: Math.min(c.minute + seconds * MINUTES_PER_SECOND, MINUTE_CAP) }
}

export function phaseOf(minute: number): Phase {
  const m = minute % 1440
  if (m < 5 * 60) return 'night'
  if (m < 11 * 60) return 'morning'
  if (m < 17 * 60) return 'day'
  if (m < 21 * 60) return 'evening'
  return 'night'
}

/** 잠들면 다음 날. 23시를 넘겨 자면 늦잠을 잔다 */
export function sleepClock(c: Clock): Clock {
  return { day: c.day + 1, minute: c.minute >= LATE ? LATE_WAKE : DAY_START }
}

export function seasonOf(day: number): Season {
  return SEASONS[Math.floor((day - 1) / SEASON_DAYS) % SEASONS.length]
}

export function formatTime(minute: number): string {
  const m = Math.floor(minute) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t))
export const NIGHT_DARK = 0.58

/** 화면을 덮는 어둠의 정도(0~NIGHT_DARK) */
export function darkness(minute: number): number {
  const h = (minute % 1440) / 60
  if (h < 5) return NIGHT_DARK
  if (h < 7) return lerp(NIGHT_DARK, 0, (h - 5) / 2)
  if (h < 17) return 0
  if (h < 21) return lerp(0, 0.35, (h - 17) / 4)
  if (h < 23) return lerp(0.35, NIGHT_DARK, (h - 21) / 2)
  return NIGHT_DARK
}

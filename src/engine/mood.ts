// 기분: 따로 쌓지 않고 그때그때 계산한다 (설계 §2.6). 좋은 날씨·꾸민 방·좋은 도구로 오르고, 몸이 힘들면 내려간다.
import { weatherOf } from './calendar'
import type { GameState } from './game'
import { count } from './items'

export const GOOD_MOOD = 70
/** 연인과 함께 간 날 (계획 10 작업 4): 그날 하루 기분 + */
export const DATE_MOOD = 10

const WEATHER_MOOD: Record<string, number> = { sunny: 10, wind: 0, fog: 0, rain: -5, snow: -5, hot: -5 }

export function moodOf(s: Pick<GameState, 'needs' | 'clock' | 'room' | 'inv'> & Partial<Pick<GameState, 'flags'>>): number {
  let m = 50 + (WEATHER_MOOD[weatherOf(s.clock.day)] ?? 0)
  if (s.flags?.dateDay === s.clock.day) m += DATE_MOOD
  m += Math.min(15, s.room.length * 3)
  if (count(s.inv, 'goodPen') > 0) m += 5
  if (count(s.inv, 'brightLamp') > 0) m += 5
  if (s.needs.hunger >= 70) m -= 15
  if (s.needs.fatigue >= 75) m -= 15
  if (Math.max(s.needs.cold, s.needs.heat ?? 0) >= 60) m -= 10
  return Math.max(0, Math.min(100, m))
}

export function inGoodMood(s: Pick<GameState, 'needs' | 'clock' | 'room' | 'inv'> & Partial<Pick<GameState, 'flags'>>): boolean {
  return moodOf(s) >= GOOD_MOOD
}

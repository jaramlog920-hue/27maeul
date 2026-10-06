import { FIXTURES } from './home-layout'
// 기분: 따로 쌓지 않고 그때그때 계산한다 (설계 §2.6). 좋은 날씨·꾸민 방·좋은 도구로 오르고, 몸이 힘들면 내려간다.
import { weatherOf } from './calendar'
import type { GameState } from './game'
import { count } from './items'

export const GOOD_MOOD = 70
/** 연인과 함께 간 날 (계획 10 작업 4): 그날 하루 기분 + */
export const DATE_MOOD = 10
/** 집 안 정해 둔 자리에서 쉰 날: 그날 하루 기분 + (기분 말고는 아무 덤도 없다) */
export const SPACE_MOOD = 5
/** 직접 만든 음식을 먹은 날 / 식탁에서 누군가와 함께 먹은 날: 그날 하루 기분 + (함께 먹은 날이 더 크지만 겹치지 않는다) */
export const MEAL_MOOD = 4
export const SHARED_MEAL_MOOD = 7

const WEATHER_MOOD: Record<string, number> = { sunny: 10, wind: 0, fog: 0, rain: -5, snow: -5, hot: -5 }

export function moodOf(s: Pick<GameState, 'needs' | 'clock' | 'room' | 'inv'> & Partial<Pick<GameState, 'flags'>>): number {
  let m = 50 + (WEATHER_MOOD[weatherOf(s.clock.day)] ?? 0)
  if (s.flags?.dateDay === s.clock.day) m += DATE_MOOD
  // 정해 둔 자리에서 쉰 날 (계획 16 작업 23): 그날 하루 기분 +
  if (s.flags?.spaceDay === s.clock.day) m += SPACE_MOOD
  // 직접 만든 음식 (계획 16 작업 25)
  if (s.flags?.sharedMealDay === s.clock.day) m += SHARED_MEAL_MOOD
  else if (s.flags?.mealDay === s.clock.day) m += MEAL_MOOD
  // 꾸민 방: 붙박이(침대·책상…)와 결혼할 때 따라온 배우자방 가구는 세지 않는다
  m += Math.min(15, s.room.filter(f => !FIXTURES[f.item as keyof typeof FIXTURES] && !f.item.startsWith('spouse:')).length * 3)
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

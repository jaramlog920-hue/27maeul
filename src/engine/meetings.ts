// 계획 21 R7: 마을 행사 이름을 바꿔서 — "마을 소리내어 읽기 모임"(일주일에 한 번, 사랑방 저녁)과 "계절 필사"(계절마다 한 번).
// 장소·요일에 회당·안식일·절기 말을 쓰지 않고, 성경 장면을 흉내 내지 않는다. 경쟁 없음.
import { seasonDay, yearOf } from './calendar'
import { seasonOf } from './clock'
import type { ItemId, Season } from './types'

/** 읽기 모임: 일곱 날에 한 번, 저녁 일곱 시부터 아홉 시까지 사랑방 */
export const READING_FROM = 19 * 60
export const READING_TO = 21 * 60
export const isReadingDay = (day: number): boolean => day % 7 === 5
/** 함께 읽으면 오르는 마음 (그날 사랑방에 모인 이웃마다) */
export const READING_GAIN = 2

export type ReadingBlock = 'notToday' | 'time' | 'done' | null
export function canRead(s: { clock: { day: number; minute: number }; flags: Record<string, number> }): ReadingBlock {
  if (!isReadingDay(s.clock.day)) return 'notToday'
  if (s.clock.minute < READING_FROM || s.clock.minute >= READING_TO) return 'time'
  if (s.flags.readDay === s.clock.day) return 'done'
  return null
}

/** 계절 필사: 계절의 15–21일에 장 하나를 마치면 그 계절에 한 번, 계절 장식 하나 (경쟁 없음) */
export const SEASON_COPY_FROM = 15
export const SEASON_COPY_TO = 21
export const SEASON_GIFT: Record<Season, ItemId> = { spring: 'dryFlowers', summer: 'vase', autumn: 'fruitBowl', winter: 'candle' }

export const seasonCopyKey = (day: number): string => `seasonCopy:${yearOf(day)}:${seasonOf(day)}`
export function seasonCopyOpen(day: number): boolean {
  const d = seasonDay(day)
  return d >= SEASON_COPY_FROM && d <= SEASON_COPY_TO
}
/** 오늘 장을 마치면 받을 계절 장식 (이미 받았거나 주간이 아니면 null) */
export function seasonCopyGift(day: number, flags: Record<string, number>): ItemId | null {
  return seasonCopyOpen(day) && !flags[seasonCopyKey(day)] ? SEASON_GIFT[seasonOf(day)] : null
}

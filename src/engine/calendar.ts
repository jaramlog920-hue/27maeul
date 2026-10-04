// 날씨·장날·계절 행사. 모두 날짜로 정해지므로 저장하지 않아도 같은 날은 같은 날씨다.
import { mulberry32 } from './offers'
import { seasonOf, SEASON_DAYS } from './clock'
import type { Season, Weather } from './types'

const TABLE: Record<Season, [Weather, number][]> = {
  spring: [['sunny', 0.55], ['rain', 0.25], ['wind', 0.1], ['fog', 0.1]],
  summer: [['sunny', 0.55], ['hot', 0.35], ['wind', 0.1]],
  autumn: [['sunny', 0.45], ['rain', 0.3], ['wind', 0.15], ['fog', 0.1]],
  winter: [['sunny', 0.4], ['rain', 0.2], ['snow', 0.2], ['fog', 0.1], ['wind', 0.1]],
}

export function weatherOf(day: number): Weather {
  if (day <= 2) return 'sunny' // 처음 이틀은 맑게 — 마을을 둘러보기 좋게
  const season = seasonOf(day)
  // 잔치 날은 맑게 — 한 해에 한 번뿐인 행사가 비로 사라지지 않도록
  if (festivalOf(day)) return 'sunny'
  // 겨울의 둘째 날은 첫눈 (한 해에 한 번은 꼭 오도록)
  if (season === 'winter' && seasonDay(day) === 2) return 'snow'
  let r = mulberry32(day * 7919 + 13)()
  for (const [w, p] of TABLE[season]) {
    r -= p
    if (r < 0) return w
  }
  return 'sunny'
}

export const isWet = (w: Weather) => w === 'rain' || w === 'snow'

/** 계절 안에서 몇째 날인가 (1~SEASON_DAYS) */
export function seasonDay(day: number): number {
  return ((day - 1) % SEASON_DAYS) + 1
}

const SEASON_ORDER: readonly Season[] = ['spring', 'summer', 'autumn', 'winter']
/** 그 계절 n째 날이 게임의 며칠째인가 (year째 해, 1부터) */
export function dayOf(season: Season, n: number, year = 1): number {
  return (year - 1) * SEASON_DAYS * 4 + SEASON_ORDER.indexOf(season) * SEASON_DAYS + n
}

/** 몇째 해인가 (1부터) */
export function yearOf(day: number): number {
  return Math.floor((day - 1) / (SEASON_DAYS * 4)) + 1
}

/** 이레마다 장이 선다 */
export function isMarketDay(day: number): boolean {
  return day % 7 === 0
}

export type Festival = 'blossom' | 'barley' | 'grapes' | 'hearth'

/** 오늘 저녁(18~21시)에 열리는 마을 행사 */
export function festivalOf(day: number): Festival | null {
  const s = seasonOf(day)
  const d = seasonDay(day)
  if (s === 'spring' && d === 20) return 'blossom' // 봄꽃 잔치 (2026-09-30 사용자)
  if (s === 'summer' && d === 25) return 'barley'
  if (s === 'autumn' && d === 30) return 'grapes'
  if (s === 'winter' && d === 20) return 'hearth'
  return null
}

export const FESTIVAL_FROM = 18 * 60
export const FESTIVAL_TO = 21 * 60

/** 비 온 뒤 길에 물웅덩이가 남는 때 (계획 15): 비 온 날 저녁(17시)부터 다음 날 낮(18시 전)까지 */
export function puddlesOut(day: number, minute: number): boolean {
  return (weatherOf(day) === 'rain' && minute >= 17 * 60) || (day > 1 && weatherOf(day - 1) === 'rain' && minute < 18 * 60)
}

/** 추운 아침 (계획 15): 겨울 맑은 날 6–9시 — 호숫가 물가에 살얼음이 한 줄 언다 */
export function icyMorning(day: number, minute: number): boolean {
  return seasonOf(day) === 'winter' && weatherOf(day) === 'sunny' && minute >= 6 * 60 && minute < 9 * 60
}

/** 굴뚝 연기 (계획 15): 겨울엔 깨어 있는 내내(5–22시) 집집마다 많이, 다른 계절엔 밥 짓는 때(6–8시, 17–19시)에만 몇 집 조금 */
export function chimneySmoke(day: number, minute: number): 'none' | 'meal' | 'winter' {
  const h = minute / 60
  if (seasonOf(day) === 'winter' && h >= 5 && h < 22) return 'winter'
  if ((h >= 6 && h < 8) || (h >= 17 && h < 19)) return 'meal'
  return 'none'
}

/** 보리를 거둘 수 있는 때: 여름 열닷새째부터 */
export function barleyRipe(day: number): boolean {
  return seasonOf(day) === 'summer' && seasonDay(day) >= 15
}

/** 포도를 딸 수 있는 때: 여름 끝 무렵부터 가을 내내 */
export function grapesRipe(day: number): boolean {
  const s = seasonOf(day)
  return s === 'autumn' || (s === 'summer' && seasonDay(day) >= 32)
}

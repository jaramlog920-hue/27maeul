// 모이는 곳과 둘이 가는 곳 (계획 10): 마을 사랑방·정원 찻집·호숫가 정자.
// 모두 가상의 마을 시설 — 예식·예배 장소가 아니다(설계 §8). 장면 문구에 성경 구절을 넣지 않는다.
import { mulberry32 } from './offers'
import type { Tile } from './types'
import { PLACES } from './world'

// ── 사랑방: 저녁에 이웃 셋이 모여 논다 (비 오는 날에도 — 집 안이라) ──

/** 사랑방에 모이는 때 (18:00–20:30) */
export const HALL_FROM = 18 * 60
export const HALL_TO = 20 * 60 + 30
/** 모이는 이웃 수 */
export const HALL_GUESTS = 3
/** 사랑방 긴 탁자 둘레 방석 자리 (탁자 위·아래, 들어오는 길은 비워 둔다) */
export const HALL_SPOTS: readonly Tile[] = (() => {
  const [t0] = PLACES.hallTable.tiles
  return [
    { x: t0.x, y: t0.y - 1 },
    { x: t0.x + 3, y: t0.y - 1 },
    { x: t0.x + 4, y: t0.y },
  ]
})()
/** 사랑방에 오지 않는 이웃: 상인(장날에만 온다), 아이(저녁엔 글자를 배우러 가거나 집에 있다) */
const HALL_SKIP = new Set(['merchant', 'child'])

/** 오늘 저녁 사랑방에 모이는 이웃 (날 씨앗 — 같은 날은 늘 같다). candidates: 오늘 마을에 나온 이웃 */
export function hallGuests(day: number, candidates: readonly string[]): string[] {
  const pool = candidates.filter((id) => !HALL_SKIP.has(id))
  const r = mulberry32(day * 4241 + 97)
  const out: string[] = []
  const left = [...pool]
  while (out.length < HALL_GUESTS && left.length) out.push(left.splice(Math.floor(r() * left.length), 1)[0])
  return out
}

export function hallOpen(minute: number): boolean {
  return minute >= HALL_FROM && minute < HALL_TO
}

/** 사랑방 놀이 한 번에 함께 논 이웃마다 오르는 마음 점수 (하루 한 번) */
export const HALL_PLAY_GAIN = 3
export const HALL_PLAY_MINUTES = 40

// ── 정원 찻집: 차 한 잔 (닢 2), 쉬어 간다 ──

/** 찻집이 여는 때 (08:00–19:00) */
export const TEA_FROM = 8 * 60
export const TEA_TO = 19 * 60
export const TEA_PRICE = 2
export const TEA_MINUTES = 30

export function teaOpen(minute: number): boolean {
  return minute >= TEA_FROM && minute < TEA_TO
}

// ── 호숫가 정자: 노을 보기 ──

/** 노을이 지는 때 (17:30–19:30), 맑은 날만 */
export const SUNSET_FROM = 17 * 60 + 30
export const SUNSET_TO = 19 * 60 + 30
export const SUNSET_MINUTES = 30

export function sunsetTime(minute: number): boolean {
  return minute >= SUNSET_FROM && minute < SUNSET_TO
}

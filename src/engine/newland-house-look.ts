// 새 터 집의 겉모습 (2026-10-13 사용자): 신약 마을 집과 같은 생김새로 그리고, 처음 지을 때 지붕·벽 색을 고른다.
// 색은 신약 마을 집 표(render/renderer.ts HOUSE_STYLES)에 이미 있는 것만 — 새 색 조합을 만들지 않는다.
// 이 파일은 값 모음이다 (엔진·화면·그림이 함께 읽는다).
import type { BuildKind } from './newland-sites'

export interface HouseLook {
  /** HOUSE_ROOFS 번호 */
  roof: number
  /** HOUSE_WALLS 번호 */
  wall: number
  /** HOUSE_WINDOWS 번호 (없으면 네모) */
  window?: number
  /** HOUSE_TRIMS 번호 — 신약 집의 나무 기둥·차양 (없으면 없음) */
  trim?: number
}

export interface RoofColor {
  name: string
  /** [바탕, 줄·테두리, 빛] */
  colors: [string, string, string]
}
export interface WallColor {
  name: string
  wall: string
  base: string
}

export const HOUSE_ROOFS: readonly RoofColor[] = [
  { name: '붉은 기와', colors: ['#c07058', '#a86048', '#cc8468'] },
  { name: '주홍 기와', colors: ['#bc6c54', '#a45a44', '#cc8068'] },
  { name: '밤색 기와', colors: ['#a06450', '#885444', '#b07864'] },
  { name: '장미 기와', colors: ['#b05860', '#944850', '#c06c74'] },
  { name: '분홍 기와', colors: ['#cc70a0', '#b05c88', '#d888b4'] },
  { name: '노란 기와', colors: ['#c8a04c', '#ac883c', '#d4b060'] },
  { name: '초록 기와', colors: ['#58984c', '#488040', '#6cac5c'] },
  { name: '청록 기와', colors: ['#4898a4', '#3c808c', '#5cacb8'] },
  { name: '파란 기와', colors: ['#4880b4', '#3c6c9c', '#5c94c4'] },
]

export const HOUSE_WALLS: readonly WallColor[] = [
  { name: '흰 벽', wall: '#f4e0c0', base: '#f0d8b0' },
  { name: '살구 벽', wall: '#f8c094', base: '#eeb080' },
]

/** 창 모양 (신약 집 표의 window) */
export const HOUSE_WINDOWS = [
  { id: 'square', name: '네모 창' },
  { id: 'arch', name: '아치 창' },
  { id: 'round', name: '둥근 창' },
] as const
/** 집 장식 (신약 집 표의 timber·awning — 둘 중 하나만, 신약 집도 함께 달지 않는다) */
export const HOUSE_TRIMS = [
  { id: 'none', name: '장식 없음' },
  { id: 'timber', name: '나무 기둥' },
  { id: 'awning', name: '줄무늬 차양' },
] as const

export const DEFAULT_LOOK: HouseLook = { roof: 0, wall: 0, window: 0, trim: 0 }

/** 색을 고르는 집 (입주 주택·손님집). 일터·꿈터·그림방은 저마다의 그림을 그대로 쓴다 */
export const hasHouseLook = (k: BuildKind): boolean => k === 'home' || k === 'guest'

/** 저장에서 읽은 값 → 맞는 번호만 (아니면 undefined — 기본 모습) */
export function sanitizeLook(raw: unknown): HouseLook | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const { roof, wall, window, trim } = raw as { roof?: unknown; wall?: unknown; window?: unknown; trim?: unknown }
  const ok = (v: unknown, n: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < n
  if (!ok(roof, HOUSE_ROOFS.length) || !ok(wall, HOUSE_WALLS.length)) return undefined
  // 창·장식은 나중에 더한 칸 — 없거나 틀리면 기본(네모·없음)
  return { roof, wall, window: ok(window, HOUSE_WINDOWS.length) ? window : 0, trim: ok(trim, HOUSE_TRIMS.length) ? trim : 0 }
}

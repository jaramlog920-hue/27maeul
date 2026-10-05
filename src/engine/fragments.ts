// 말씀 조각 (계획 14 작업 5): 조각은 필사 재료가 아니라 말씀 수집품이다. 그래서 드물게 온다 —
// 편지나 이웃과의 특별한 대화로 일주일에 몇 번 (날 씨앗으로 정해진다). 평소 대화엔 직업다운 선물만.
// 어느 길로 받든 한 번에 한 조각, 27권 전체의 아직 없는 조각 중 무작위 하나 (drawFragment).
// 조각은 직업과 묶지 않는다: 어느 이웃이 건네든 27권 어느 책의 조각이든 될 수 있다 ("빵집 이웃 = 특정 구절"이 아니다).
// 이 파일은 순수 계산 — 오늘 조각이 오는가, 어떤 조각인가, 누가 건네는가, 받은 기록, 평소 대화의 직업 선물.
import { VISIT_GIFTS } from './bonds'
import { SEASON_DAYS, seasonOf } from './clock'
import { heartsOf } from './hearts'
import { mulberry32, seededShuffle } from './offers'
import { POSTMAN } from './post'
import type { ItemId, Piece, Season } from './types'

/** 한 주 */
export const WEEK_DAYS = 7
/** 한 주에 조각이 오는 날 수 — 편지 한 번, 특별한 대화 한 번, 나머지 한 번은 날 씨앗으로 */
export const FRAGMENTS_PER_WEEK = 3

export type FragmentWay = 'letter' | 'talk'

/** 오늘 조각이 오는가, 온다면 편지로인가 특별한 대화로인가 (같은 날은 늘 같다) */
export function fragmentWayOf(day: number): FragmentWay | null {
  const week = Math.floor((day - 1) / WEEK_DAYS)
  const offset = (((day - 1) % WEEK_DAYS) + WEEK_DAYS) % WEEK_DAYS
  const days = seededShuffle(
    Array.from({ length: WEEK_DAYS }, (_, i) => i),
    week * 31 + 5,
  ).slice(0, FRAGMENTS_PER_WEEK)
  const i = days.indexOf(offset)
  if (i < 0) return null
  if (i === 0) return 'letter'
  if (i === 1) return 'talk'
  return mulberry32(week * 7919 + i * 131 + 3)() < 0.5 ? 'letter' : 'talk'
}

const idSeed = (id: string) => [...id].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7)

/**
 * 말씀 조각 한 개 뽑기 (2026-10-06 사용자 결정): 어느 길로 받든 — 편지·특별한 대화·여행·서고 열람석·두루마리·밤 필사·
 * 아이의 편지·언덕 별 보기 — 27권 전체의 아직 없는 조각 중 무작위 하나다. 그날 몫 1~2장이나 장 순서·책 제한은 없다.
 * 씨앗은 날과 길(source)로 정해져서 같은 날 같은 길은 불러와도 같은 조각이다. 다 모았으면 null (오류 없음)
 */
export function drawFragment(pieces: readonly Piece[], collected: readonly string[], seed: number): string | null {
  const got = new Set(collected)
  const left = pieces.filter((p) => !got.has(p.id))
  if (!left.length) return null
  return left[Math.min(left.length - 1, Math.floor(mulberry32(seed)() * left.length))].id
}

/** 날과 받는 길로 정하는 씨앗. 오늘의 조각('day')은 예전 씨앗 그대로 */
export function fragmentSeed(day: number, source: string): number {
  return day * 4441 + 17 + (source === 'day' ? 0 : idSeed(source) * 100003)
}

/** 아직 받지 않은 조각 중 하나 (날 씨앗). 27권 어느 책이든 — 다 받았으면 null */
export function pickFragment(pieces: readonly Piece[], collected: readonly string[], day: number): string | null {
  return drawFragment(pieces, collected, fragmentSeed(day, 'day'))
}

/**
 * 오늘의 조각: 편지 날이면 편지(post) 하나, 특별한 대화 날이면 오늘 나온 이웃 한 명(편지 나르는 이웃은 빼고)이 하나.
 * 대화 날인데 건넬 이웃이 없으면(궂은 날 등) 편지로 온다. 조각 없는 날·다 받았으면 빈 값
 */
export function fragmentsForDay(args: {
  day: number
  pieces: readonly Piece[]
  collected: readonly string[]
  present: readonly string[]
}): { offers: Record<string, string>; post: string[] } {
  const none = { offers: {}, post: [] }
  const way = fragmentWayOf(args.day)
  if (!way) return none
  const id = pickFragment(args.pieces, args.collected, args.day)
  if (!id) return none
  if (way === 'talk') {
    const tellers = args.present.filter((n) => n !== POSTMAN)
    if (tellers.length) return { offers: { [seededShuffle(tellers, args.day + 7777)[0]]: id }, post: [] }
  }
  return { offers: {}, post: [id] }
}

// ── 받은 기록 ──

/** 조각 하나를 받은 날과 어디서 ('npc:baker' · 'letter' · 'trip:harbor' · 'child' · 'library' · 'scroll' · 'night' · 'stars') */
export interface PieceGot {
  day: number
  from: string
}
export type PieceLog = Record<string, PieceGot>

export type PieceSource =
  | { kind: 'npc' | 'trip'; who: string }
  | { kind: 'letter' | 'child' | 'library' | 'scroll' | 'night' | 'stars' | 'unknown' }

const PLAIN = ['letter', 'child', 'library', 'scroll', 'night', 'stars'] as const

/** 기록의 from을 읽는다 — 모르는 값·기록 없음(옛 저장)은 unknown */
export function pieceFrom(from: string | undefined): PieceSource {
  if (!from) return { kind: 'unknown' }
  const [kind, who] = from.split(':')
  if (kind === 'npc' && who) return { kind, who }
  // 여행은 어느 곳인지 몰라도 여행길로 (보드게임 보상만 따로 받은 경우)
  if (kind === 'trip') return { kind, who: who ?? '' }
  if ((PLAIN as readonly string[]).includes(from)) return { kind: from as (typeof PLAIN)[number] }
  return { kind: 'unknown' }
}

/** 받은 기록을 더한다 (이미 있는 기록은 그대로 — 처음 받은 날이 남는다) */
export function logPieces(log: PieceLog | undefined, ids: readonly string[], day: number, from: string): PieceLog {
  const out = { ...(log ?? {}) }
  for (const id of ids) if (!out[id]) out[id] = { day, from }
  return out
}

/** 날 → 몇 년째 어느 계절 며칠 (한 해 160일, 한 계절 40일) */
export function whenOf(day: number): { year: number; season: Season; d: number } {
  return { year: Math.floor((day - 1) / (SEASON_DAYS * 4)) + 1, season: seasonOf(day), d: ((day - 1) % SEASON_DAYS) + 1 }
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** 저장 정리: 받은 조각의 기록만, 모양이 맞는 것만. 옛 저장(칸이 없던 때)은 빈 기록 — 화면은 "언제 받았는지 남아 있지 않은 조각" */
export function sanitizePieceLog(raw: unknown, collected: readonly string[]): PieceLog {
  if (!isObj(raw)) return {}
  const got = new Set(collected)
  const out: PieceLog = {}
  for (const [id, v] of Object.entries(raw)) {
    if (!got.has(id) || !isObj(v)) continue
    if (!Number.isInteger(v.day) || (v.day as number) < 0 || typeof v.from !== 'string') continue
    out[id] = { day: v.day as number, from: v.from }
  }
  return out
}

// ── 평소 대화의 직업 선물 ──

/** 이만큼 마음이 열린 이웃부터 평소 대화에 직업 선물을 챙겨 준다 (하트 수) */
export const TALK_GIFT_HEARTS = 2
/** 하루에 그 이웃이 챙겨 줄 확률 (날 씨앗 — 같은 날은 늘 같다) */
const TALK_GIFT_CHANCE = 0.3

/**
 * 평소 대화의 직업 선물: 빵 굽는 이웃은 빵, 양치기는 양털, 어부는 갈대… (bonds.VISIT_GIFTS — 아침 방문 선물과 같은 직업 물건).
 * 마음이 TALK_GIFT_HEARTS 이상이고, 오늘 아직 받지 않았고, 날 씨앗이 맞는 날만. 직업 선물이 없는 이웃은 null.
 * 말씀 조각과는 따로다 — 조각을 주지 않는다
 */
export function talkGiftOf(
  npc: string,
  day: number,
  hearts: Readonly<Record<string, number>>,
  flags: Readonly<Record<string, number>>,
): Partial<Record<ItemId, number>> | null {
  const gift = VISIT_GIFTS[npc]
  if (!gift) return null
  if (heartsOf(hearts[npc]) < TALK_GIFT_HEARTS) return null
  if (flags[`talkGift:${npc}`] === day) return null
  if (mulberry32(day * 613 + idSeed(npc))() >= TALK_GIFT_CHANCE) return null
  return gift
}

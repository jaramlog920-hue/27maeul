// 마음이 쌓일수록 풍부해지는 마을 (사용자 요청 2026-09-26, 6번 A~E). 모두 게임 창작 — 문구는 life-text.json.
// 원칙: 이웃 이벤트는 성경의 사건·비유를 떠올리게 하는 소재를 쓰지 않는다 (exclusion-list §2-5).
import { heartsOf, MAX_POINTS } from './hearts'
import { mulberry32 } from './offers'
import { festivalOf, isWet, weatherOf } from './calendar'
import { seasonOf } from './clock'
import type { ItemId, Tile } from './types'

type Items = Partial<Record<ItemId, number>>

// ── A. 이웃의 부탁 ──

export interface Request {
  id: string
  npc: string
  /** 이 하트 수부터 부탁한다 */
  hearts: number
  needs: Items
  reward: Items
  /** 마을에 생기는 변화 (flags[`unlock:${unlock}`]) */
  unlock: string
}

export const REQUESTS: readonly Request[] = [
  { id: 'baker:1', npc: 'baker', hearts: 4, needs: { barley: 3 }, reward: { bowl: 1 }, unlock: 'bakeryBench' },
  { id: 'baker:2', npc: 'baker', hearts: 7, needs: { wool: 2 }, reward: { cushion: 1, candle: 1 }, unlock: 'babyBlanket' },
  { id: 'child:1', npc: 'child', hearts: 4, needs: { reed: 2, papyrus: 1 }, reward: { bird: 1 }, unlock: 'kite' },
  { id: 'child:2', npc: 'child', hearts: 7, needs: { fig: 2 }, reward: { vase: 1 }, unlock: 'childGarden' },
  { id: 'grandpa:1', npc: 'grandpa', hearts: 4, needs: { bread: 2, water: 2 }, reward: { jar: 1 }, unlock: 'grapeTrellis' },
  { id: 'grandpa:2', npc: 'grandpa', hearts: 7, needs: { olive: 2, oil: 1 }, reward: { nightstand: 1 }, unlock: 'grandpaBench' },
  { id: 'merchant:1', npc: 'merchant', hearts: 4, needs: { bread: 3 }, reward: { papyrus: 2 }, unlock: 'moreTrades' },
  { id: 'merchant:2', npc: 'merchant', hearts: 7, needs: { soot: 2, oil: 1 }, reward: { rug: 1 }, unlock: 'stallAwning' },
  { id: 'smith:1', npc: 'smith', hearts: 4, needs: { wool: 2, oil: 1 }, reward: { soot: 2 }, unlock: 'bigBellows' },
  { id: 'smith:2', npc: 'smith', hearts: 7, needs: { olive: 2, bread: 1 }, reward: { candle: 1 }, unlock: 'lanterns' },
  { id: 'shepherd:1', npc: 'shepherd', hearts: 4, needs: { reed: 3 }, reward: { wool: 2 }, unlock: 'penBig' },
  { id: 'shepherd:2', npc: 'shepherd', hearts: 7, needs: { bread: 2, grapes: 2 }, reward: { cushion: 1 }, unlock: 'shearing' },
  { id: 'presser:1', npc: 'presser', hearts: 4, needs: { olive: 4 }, reward: { oil: 2 }, unlock: 'pressHandle' },
  { id: 'presser:2', npc: 'presser', hearts: 7, needs: { bread: 2 }, reward: { jar: 1, oil: 2 }, unlock: 'oliveGrove' },
  { id: 'weaver:1', npc: 'weaver', hearts: 4, needs: { wool: 3 }, reward: { rug: 1 }, unlock: 'loomAwning' },
  { id: 'beekeeper:1', npc: 'beekeeper', hearts: 4, needs: { reed: 2, olive: 2 }, reward: { honey: 2 }, unlock: 'moreHives' },
]

/** 0 = 아직, 1 = 부탁을 들음, 2 = 들어줌 */
export const reqState = (flags: Record<string, number>, id: string) => flags[`req:${id}`] ?? 0

/** 지금 이 이웃에게서 들을 수 있는 부탁 (앞 부탁을 다 들어줘야 다음) */
export function requestFor(npc: string, points: number | undefined, flags: Record<string, number>): Request | null {
  for (const r of REQUESTS.filter((x) => x.npc === npc)) {
    const st = reqState(flags, r.id)
    if (st === 2) continue
    return heartsOf(points) >= r.hearts ? r : null
  }
  return null
}

export const unlocked = (flags: Record<string, number>, name: string) => (flags[`unlock:${name}`] ?? 0) > 0

// ── B. 먼저 찾아오기와 저녁 초대 ──

export const VISIT_HEARTS = 5
export const INVITE_HEARTS = 7
export const VISIT_FROM = 7 * 60
export const VISIT_TO = 9 * 60 + 30
export const VISIT_SPOT: Tile = { x: 8, y: 8 }
export const INVITE_FROM = 18 * 60
export const INVITE_TO = 20 * 60 + 30
/** 저녁에 초대하는 이웃과 그 집 문 */
export const INVITE_DOORS: Record<string, Tile> = {
  baker: { x: 5, y: 11 },
  child: { x: 23, y: 11 },
  grandpa: { x: 23, y: 4 },
}
export const VISIT_GIFTS: Record<string, Items> = {
  baker: { bread: 2 },
  child: { fig: 1 },
  grandpa: { grapes: 1, fig: 1 },
  merchant: { papyrus: 1 },
  smith: { soot: 1 },
  shepherd: { wool: 1 },
  presser: { oil: 1 },
  weaver: { wool: 1 },
  beekeeper: { honey: 1 },
}

/** 오늘 아침 집 앞에 들르는 이웃 (마음 5 이상, 나흘에 한 번까지) */
export function pickVisitor(day: number, hearts: Record<string, number>, flags: Record<string, number>, present: readonly string[]): string | null {
  const r = mulberry32(day * 131 + 7)
  if (r() > 0.6) return null
  const cand = present.filter((id) => heartsOf(hearts[id]) >= VISIT_HEARTS && day - (flags[`visitDay:${id}`] ?? -99) >= 4 && VISIT_GIFTS[id])
  if (!cand.length) return null
  return cand[Math.min(cand.length - 1, Math.floor(r() * cand.length))]
}

/** 오늘 저녁 초대하는 이웃 (마음 7 이상, 엿새에 한 번까지, 잔치 날·궂은 날은 없음) */
export function pickInviter(day: number, hearts: Record<string, number>, flags: Record<string, number>): string | null {
  if (festivalOf(day) || isWet(weatherOf(day))) return null
  const r = mulberry32(day * 977 + 3)
  if (r() > 0.35) return null
  const cand = Object.keys(INVITE_DOORS).filter((id) => heartsOf(hearts[id]) >= INVITE_HEARTS && day - (flags[`inviteDay:${id}`] ?? -99) >= 6)
  if (!cand.length) return null
  return cand[Math.min(cand.length - 1, Math.floor(r() * cand.length))]
}

// ── C. 마을이 자란다 ──

/** 모든 이웃과의 마음 점수를 더한 값이 이만큼 되면 한 단계씩 */
export const VILLAGE_STEPS = [100, 220, 360, 520] as const
export function villageLevel(hearts: Record<string, number>): number {
  const sum = Object.values(hearts).reduce((a, b) => a + Math.min(MAX_POINTS, b), 0)
  return VILLAGE_STEPS.filter((s) => sum >= s).length
}
/** 새 이웃이 이사 오는 단계 */
export const JOINS_AT: Record<string, number> = { weaver: 2, beekeeper: 4 }

// ── D. 이웃끼리 ──

export const FRIENDS_HEARTS = 5
export const FRIENDS_SPOT: Tile = { x: 4, y: 18 }
export const FRIENDS_FROM = 14 * 60
export const FRIENDS_TO = 16 * 60
export const BABY_PARTY_DAY = 22
export const GATHER_FROM = 18 * 60
export const GATHER_TO = 20 * 60
export const PICNIC_FROM = 11 * 60 + 30
export const PICNIC_TO = 13 * 60 + 30
export const STARS_FROM = 20 * 60
export const STARS_TO = 22 * 60

/** 모임 자리 (빵집 앞 아기 잔치 / 언덕 소풍·별 보기) */
export const BABY_PARTY_SPOTS: Record<string, Tile> = {
  baker: { x: 6, y: 10 },
  child: { x: 4, y: 10 },
  grandpa: { x: 7, y: 10 },
  smith: { x: 3, y: 9 },
  presser: { x: 2, y: 9 },
  weaver: { x: 9, y: 9 },
  beekeeper: { x: 4, y: 9 },
}
export const HILL_SPOTS: Record<string, Tile> = {
  baker: { x: 13, y: 3 },
  child: { x: 15, y: 3 },
  grandpa: { x: 16, y: 2 },
  smith: { x: 12, y: 2 },
  shepherd: { x: 15, y: 1 },
  presser: { x: 17, y: 2 },
  weaver: { x: 13, y: 4 },
  beekeeper: { x: 16, y: 4 },
}

export type Gathering = 'babyParty' | 'picnic' | 'starNight'

/** 오늘 열리는 이웃 모임 (flags[`gathering:${day}`]가 정해진 날) */
export function gatheringOf(day: number, flags: Record<string, number>): Gathering | null {
  const g = flags[`gathering:${day}`]
  return g === 1 ? 'babyParty' : g === 2 ? 'picnic' : g === 3 ? 'starNight' : null
}

export function gatheringWindow(g: Gathering): [number, number] {
  return g === 'babyParty' ? [GATHER_FROM, GATHER_TO] : g === 'picnic' ? [PICNIC_FROM, PICNIC_TO] : [STARS_FROM, STARS_TO]
}

/** 새 날에 모임을 정한다: 아기 잔치(정해진 날) · 소풍(마을 2단계 뒤 첫 맑은 봄·여름날) · 별 보는 밤(마을 3단계 뒤 첫 맑은 날) */
export function planGathering(day: number, level: number, flags: Record<string, number>): Gathering | null {
  if (festivalOf(day)) return null
  const w = weatherOf(day)
  const clear = w === 'sunny' || w === 'hot'
  if (day === BABY_PARTY_DAY && !isWet(w)) return 'babyParty'
  const s = seasonOf(day)
  if (level >= 2 && !flags['done:picnic'] && clear && (s === 'spring' || s === 'summer')) return 'picnic'
  if (level >= 3 && !flags['done:starNight'] && clear && Math.abs(day - BABY_PARTY_DAY) > 7) return 'starNight'
  return null
}

// ── E. 마음 9 ──
export const BOND_HEARTS = 9

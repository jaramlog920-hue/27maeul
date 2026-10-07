// 계획 21 R3·R4: 주민 부탁 필사 — 사랑방 게시판의 닢 의뢰를 바꾼다.
// 이웃이 축복·위로·격려·기념·배움·생업 부탁을 하면, 플레이어가 모은 말씀 조각 하나를 골라 써 준다 (정답 없음).
// 보답은 이웃의 고마움(마음 + 그 이웃이 좋아하는 물건, 가끔 희귀 재료) — 닢은 없다 (말씀을 팔지 않는다, exclusion §3-3).
// 부탁은 날 씨앗으로 정해 저장하지 않아도 같은 날은 같다. 끝낸 부탁만 flags[`req:${id}`] = 별 수.
import { mulberry32 } from './offers'
import type { ItemId } from './types'

export type RequestKind = 'bless' | 'comfort' | 'cheer' | 'remember' | 'learn' | 'work'
export const REQUEST_KINDS: readonly RequestKind[] = ['bless', 'comfort', 'cheer', 'remember', 'learn', 'work']
export type RequestCond = 'short' | 'care'
/** content/piece-moods.ts의 Mood와 같은 이름 (엔진은 콘텐츠를 import하지 않는다) */
export type MoodName = 'joy' | 'comfort' | 'hope' | 'courage' | 'thanks' | 'wisdom' | 'faithful'

/** 부탁마다 이웃이 반길 분위기 */
export const KIND_MOODS: Record<RequestKind, readonly MoodName[]> = {
  bless: ['joy', 'thanks', 'hope'],
  comfort: ['comfort', 'hope'],
  cheer: ['courage', 'hope'],
  remember: ['thanks', 'joy'],
  learn: ['wisdom'],
  work: ['faithful', 'wisdom'],
}

export interface CopyRequest {
  /** `${day}:${i}` 또는 계획 20 주민 가족 소식에서 온 것 `gen:${day}:${who}` */
  id: string
  npc: string
  kind: RequestKind
  /** 붙은 날, 이 날까지 (넘기면 조용히 사라진다) */
  day: number
  until: number
  cond?: RequestCond
}

export const REQUESTS_PER_DAY = 2
/** 짧은 구절: 띄어쓰기를 뺀 글자 수 */
export const SHORT_CHARS = 60
/** 보답 마음 = 기본 + 별마다 */
export const REQ_HEART_BASE = 2
export const REQ_HEART_PER_STAR = 2

/** 그날 붙는 부탁 (날 씨앗) — 아이는 배움 부탁만 */
export function requestsOn(day: number, npcs: readonly string[]): CopyRequest[] {
  const rnd = mulberry32(day * 7193 + 41)
  const pool = [...npcs]
  const out: CopyRequest[] = []
  for (let i = 0; i < REQUESTS_PER_DAY && pool.length; i++) {
    const npc = pool.splice(Math.floor(rnd() * pool.length), 1)[0]
    const kind: RequestKind = npc === 'child' ? 'learn' : REQUEST_KINDS[Math.floor(rnd() * REQUEST_KINDS.length)]
    const span = 3 + Math.floor(rnd() * 5)
    const c = rnd()
    const cond: RequestCond | undefined = kind === 'learn' || c < 0.15 ? 'short' : c < 0.25 ? 'care' : undefined
    out.push({ id: `${day}:${i}`, npc, kind, day, until: day + span - 1, ...(cond ? { cond } : {}) })
  }
  return out
}

/** 주민 가족 소식(결혼·출생)에서 온 축복 부탁 (계획 21 R4) — 그 집의 한 사람이 5일 동안 */
export function familyRequests(log: readonly { day: number; kind: string; who: string[] }[], fixed: (id: string) => boolean): CopyRequest[] {
  return log
    .filter((l) => (l.kind === 'married' || l.kind === 'birth') && fixed(l.who[0]))
    .map((l) => ({ id: `gen:${l.day}:${l.who[0]}`, npc: l.who[0], kind: 'bless' as const, day: l.day, until: l.day + 4 }))
}

/** 오늘 게시판에 있는 부탁: 지난 7일 안에 붙고 아직 기한이 남은 것 (끝낸 것도 '끝냄'으로 보인다) */
export function requestsToday(today: number, npcs: readonly string[], extra: readonly CopyRequest[] = []): CopyRequest[] {
  const out: CopyRequest[] = []
  for (let d = Math.max(1, today - 7); d <= today; d++) for (const r of requestsOn(d, npcs)) if (r.until >= today) out.push(r)
  for (const r of extra) if (r.day <= today && r.until >= today && !out.some((x) => x.id === r.id)) out.push(r)
  return out
}

export interface PieceFacts {
  moods: readonly MoodName[]
  chars: number
  /** 그 조각이 든 장에 정성 도장이 있나 */
  care: boolean
}

/** 별 (1–3): 분위기가 하나 맞으면 +1, 둘이면 +1 더, 조건을 지키면 +1 (최대 3) */
export function starsFor(r: CopyRequest, p: PieceFacts): number {
  const want = KIND_MOODS[r.kind]
  const hit = p.moods.filter((m) => want.includes(m)).length
  let s = 1 + (hit >= 1 ? 1 : 0) + (hit >= 2 ? 1 : 0)
  if (r.cond === 'short' && p.chars <= SHORT_CHARS) s++
  if (r.cond === 'care' && p.care) s++
  return Math.min(3, s)
}

/** 보답 물건: 그 이웃이 좋아하는 것 하나(별 셋이면 둘), 별 셋이면 셋에 하나꼴로 희귀 재료 하나 더 (부탁 id 씨앗) */
export function giftFor(r: CopyRequest, stars: number, likes: readonly ItemId[], rare: readonly ItemId[]): Partial<Record<ItemId, number>> {
  const out: Partial<Record<ItemId, number>> = {}
  const liked = likes[0]
  if (liked) out[liked] = stars >= 3 ? 2 : 1
  let h = 0
  for (const ch of r.id) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0
  if (stars >= 3 && rare.length && mulberry32(h)() < 1 / 3) {
    const x = rare[h % rare.length]
    out[x] = (out[x] ?? 0) + 1
  }
  return out
}

// 이웃이 보내는 꿀팁 편지 (2026-10-14 사용자: 가끔 이웃이 편지로 가이드 — 스포·꿀팁, 200개, 이레에 2~3번).
// 안내문이 아니라 이웃이 근황을 쓰다 슬쩍 알려 주는 말투. 지금 진행에 맞는 편지만, 이미 해 본 일은 건너뛴다.
// 받은 편지는 game.tips(id 차례)에 남고, 새 편지가 온 아침엔 flags.tipNew = 1 (창이 뜨면 지운다).
import tipData from '../content/tip-letters.json'
import { owns } from './easier'
import { featureAccess } from './feature-rules'
import type { GameState } from './game'
import { count } from './items'
import { BOOKS, GOSPELS } from './types'

export interface TipLetter {
  id: string
  /** 보내는 이웃 id */
  from: string
  /** 보낼 때 (TIP_WHEN 키, 없으면 언제든) */
  when?: string
  text: string
}
export const TIP_LETTERS: readonly TipLetter[] = tipData as TipLetter[]

const shelvedCount = (s: GameState) => BOOKS.filter((b) => s.shelved[b] !== undefined).length
const stage = (s: GameState) => s.romance?.stage ?? null
const hasShoes = (s: GameState) => count(s.inv, 'sturdyShoes') > 0 || count(s.inv, 'lightShoes') > 0

/** 보낼 때인가 — 편지마다 지금 이야기가 맞는지 (아직 먼 이야기·이미 해 본 일은 건너뛴다) */
export const TIP_WHEN: Record<string, (s: GameState) => boolean> = {
  early: (s) => shelvedCount(s) < 4,
  mid: (s) => shelvedCount(s) >= 2,
  late: (s) => shelvedCount(s) >= 12,
  nearEnd: (s) => shelvedCount(s) >= 20 && !s.flags.newlandGift,
  newland: (s) => !!s.flags.newlandGift,
  gospelsAhead: (s) => !GOSPELS.every((b) => s.shelved[b] !== undefined),
  noShoes: (s) => !hasShoes(s),
  sturdyOnly: (s) => count(s.inv, 'sturdyShoes') > 0 && count(s.inv, 'lightShoes') === 0,
  hasShoes,
  noRainJar: (s) => !owns(s.flags, 'rainJar'),
  noReedRack: (s) => !owns(s.flags, 'reedRack'),
  noChest: (s) => !owns(s.flags, 'supplyChest'),
  noSoot: (s) => !owns(s.flags, 'sootCatcher'),
  sootNoInk: (s) => owns(s.flags, 'sootCatcher') && !owns(s.flags, 'inkJar'),
  noPantry: (s) => !owns(s.flags, 'homeCoolCupboard'),
  noKey: (s) => count(s.inv, 'homeKey') === 0,
  noKit: (s) => count(s.inv, 'handyKit') === 0,
  noPen: (s) => count(s.inv, 'goodPen') === 0,
  single: (s) => stage(s) === null,
  dating: (s) => stage(s) === 'dating',
  engaged: (s) => stage(s) === 'engaged',
  married: (s) => stage(s) === 'married',
  marriedNoKid: (s) => stage(s) === 'married' && !s.child,
  hasKid: (s) => !!s.child,
  homeSmall: (s) => (s.homeLevel ?? 0) < 1,
  homeMid: (s) => (s.homeLevel ?? 0) >= 1 && (s.homeLevel ?? 0) < 3,
  noPet: (s) => !s.companion,
  hasPet: (s) => !!s.companion,
  clubs: (s) => featureAccess(s, 'clubs') !== 'locked',
  stall: (s) => featureAccess(s, 'stall') !== 'locked',
  travel: (s) => featureAccess(s, 'travel') !== 'locked',
  cooking: (s) => featureAccess(s, 'cooking') !== 'locked',
  library: (s) => featureAccess(s, 'library') !== 'locked',
  romance: (s) => featureAccess(s, 'dating') !== 'locked',
  // 그 기능이 열린 뒤에만 오는 편지 (2026-10-21 점검: 몇십 장 앞서 와서 막힌 단추로 보냈다)
  spouseRoomSmall: (s) => (s.homeLevel ?? 0) < 1 && featureAccess(s, 'spouseRoom') === 'full',
  events: (s) => featureAccess(s, 'events') === 'full',
  rank: (s) => featureAccess(s, 'rank') === 'full',
  // 마지막 열 장 동안만 (다 쓴 뒤에 "열 장 남았다면서요?"가 오지 않게 — 2026-10-21 점검)
  finale: (s) => featureAccess(s, 'finale') === 'full' && !s.flags.growthLegacy && !s.flags.lastManuscriptScene && !s.flags.newlandGift,
  marriedFamily: (s) => stage(s) === 'married' && !!s.child && featureAccess(s, 'childActivities') === 'full',
}

/** 오늘 아침 편지가 오는 날인가: 이레에 두 번(둘째·다섯째 날)과 두 이레에 한 번 더 — 이레에 2~3통 */
export function tipDay(day: number): boolean {
  const w = day % 7
  return w === 2 || w === 5 || day % 14 === 10
}

/** 지금 보낼 수 있는 다음 편지 (차례대로 — 이른 이야기가 먼저) */
export function nextTip(s: GameState): TipLetter | null {
  const got = new Set(s.tips ?? [])
  return TIP_LETTERS.find((t) => !got.has(t.id) && (!t.when || (TIP_WHEN[t.when]?.(s) ?? false))) ?? null
}

/** 아침: 오는 날이면 한 통 */
export function tipMorning(s: GameState): GameState {
  if (s.clock.day < 3 || !tipDay(s.clock.day)) return s
  const t = nextTip(s)
  if (!t) return s
  return { ...s, tips: [...(s.tips ?? []), t.id], flags: { ...s.flags, tipNew: 1 } }
}

export const tipById = (id: string): TipLetter | undefined => TIP_LETTERS.find((t) => t.id === id)

/** 불러올 때: 아는 편지 id만, 한 번씩 */
export function sanitizeTips(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const ids = new Set(TIP_LETTERS.map((t) => t.id))
  const out = [...new Set(raw.filter((x): x is string => typeof x === 'string' && ids.has(x)))]
  return out.length ? out : undefined
}

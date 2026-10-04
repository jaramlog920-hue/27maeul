// 가족과 함께 있는 필사 (계획 14 작업 10, 계획 12 "아이와 함께 보내는 시간").
// 아이가 어느 정도 자라면 책상에 앉을 때 가끔 "옆에 앉고 싶어 해요" — [같이 있기]면 아이는 곁에서 그림을 그리고, 책장을 넘기다
// 졸다 잠든다. 아이는 필사하지 않고 능력치도 얻지 않는다 (보상 없음). 배우자는 저녁에 같은 방에서 책을 읽는다.
// 처음 잠든 날은 가족 앨범에 한 장 (장면 fam:deskNap — 책상에서 나온 뒤 마을에서 열린다).
import { mulberry32 } from './offers'
import { isMarketDay } from './calendar'
import { childMode, childStage } from './child'
import { seasonOf } from './clock'
import { childAtSchool, heartUp, neighborsPresent, passTime, putAway, type GameState } from './game'
import { NO_ROMANCE, SPOUSE_HOME_FROM, SPOUSE_HOME_TO } from './romance'
import { addXp, type StatId } from './stats'
import type { GameContent } from './types'
import type { ItemId } from './types'

/** 아이가 곁에서 하는 일: 그림 그리기 → 책장 넘겨 보기 → 졸다 잠들기 (같이 쓴 절 수로) */
export type DeskPose = 'draw' | 'book' | 'doze'
/** 이만큼 같이 쓰면 책을 넘겨 보고, 이만큼이면 졸기 시작한다 */
export const DESK_BOOK_AT = 3
export const DESK_DOZE_AT = 6
/** 옆에 앉고 싶어 하는 날 (날 씨앗, 대략 이틀에 한 번) */
export const DESK_ASK_CHANCE = 0.5

type DeskState = Pick<GameState, 'child' | 'clock' | 'flags'>

/** 아이가 책상 곁에 앉을 수 있는가: 걷는 아이·돕는 아이이고, 배움터에 가 있지 않다 (아기·어른·먼 곳에 사는 아이는 아니다) */
export function deskKidReady(s: DeskState): boolean {
  const c = s.child
  if (!c) return false
  const st = childStage(c, s.clock.day)
  if (st !== 'toddler' && st !== 'helper') return false
  if (childMode(c, s.clock.day) === 'away') return false
  return !childAtSchool(s)
}

/** 오늘 책상에 앉으면 아이가 옆에 앉고 싶어 하는가 (하루 한 번만 묻는다, 날 씨앗) */
export function deskAsks(s: DeskState): boolean {
  if (!deskKidReady(s)) return false
  if (s.flags.deskAskDay === s.clock.day) return false
  return mulberry32(s.clock.day * 7919 + 41)() < DESK_ASK_CHANCE
}

/** 물어본 날을 적는다 ([같이 있기]면 오늘은 아이가 곁에 앉는다) */
export function answerDesk<S extends DeskState>(s: S, together: boolean): S {
  const day = s.clock.day
  const flags: Record<string, number> = { ...s.flags, deskAskDay: day }
  if (together) {
    flags.deskKidDay = day
    flags.deskKidVerses = 0
  }
  return { ...s, flags }
}

/** 오늘 아이가 책상 곁에 있는가 */
export function deskKidWith(s: DeskState): boolean {
  return s.flags.deskKidDay === s.clock.day && deskKidReady(s)
}

/** 아이가 지금 곁에서 하는 일 */
export function deskPose(s: Pick<GameState, 'flags'>): DeskPose {
  const n = s.flags.deskKidVerses ?? 0
  return n >= DESK_DOZE_AT ? 'doze' : n >= DESK_BOOK_AT ? 'book' : 'draw'
}

/** 아이가 곁에 있는 동안 한 절을 적었다: 같이 쓴 절을 세고, 처음 졸다 잠들면 앨범 장면 (한 번) */
export function deskKidVerse(s: GameState): GameState {
  if (!deskKidWith(s)) return s
  const n = (s.flags.deskKidVerses ?? 0) + 1
  const flags: Record<string, number> = { ...s.flags, deskKidVerses: n }
  if (n >= DESK_DOZE_AT && !s.flags.deskNap) {
    flags.deskNap = 1
    return { ...s, flags, scenes: [...s.scenes, 'fam:deskNap'] }
  }
  return { ...s, flags }
}

// ── 아이와 함께 보내는 시간 (계획 12, 2026-10-04 사용자) ──
// 배움터 = 빠르고 편한 능력치(닢 15, 경험치 15). 직접 함께하기 = 조금 느리지만(닢 없이 경험치 8) 가까움 + 추억 + 장면.
// 미니게임 없이 누르기 → 짧은 장면 → 결과. 하루에 두 번까지(잠들기 전 이야기는 따로 하룻밤 한 번), 배움터와 같은 날에도 된다.
// 아이의 신앙을 수치로 키우는 것·매일 해야 하는 아이 퀘스트는 넣지 않는다.

export type KidAct = 'read' | 'puzzle' | 'make' | 'cook' | 'walk' | 'ball' | 'tour' | 'errand' | 'story'
export const KID_ACTS: readonly KidAct[] = ['read', 'puzzle', 'make', 'cook', 'walk', 'ball', 'tour', 'errand', 'story']
interface KidActDef {
  /** 아이 능력치 경험치 */
  gains: Partial<Record<StatId, number>>
  minutes: number
  /** 밖에서 하는 일 (어두워지면 못 한다) */
  outdoor?: boolean
}
export const KID_ACT_DEFS: Record<KidAct, KidActDef> = {
  read: { gains: { wit: 8 }, minutes: 30 },
  puzzle: { gains: { wit: 5, hand: 5 }, minutes: 30 },
  make: { gains: { hand: 8 }, minutes: 40 },
  cook: { gains: { hand: 8 }, minutes: 40 },
  walk: { gains: { strength: 8 }, minutes: 40, outdoor: true },
  ball: { gains: { strength: 8 }, minutes: 30, outdoor: true },
  tour: { gains: { charm: 8 }, minutes: 40, outdoor: true },
  errand: { gains: { charm: 8 }, minutes: 30, outdoor: true },
  story: { gains: {}, minutes: 20 },
}
/** 하루에 함께하는 일 (잠들기 전 이야기 빼고) */
export const KID_ACTS_PER_DAY = 2
/** 밖에서 하는 일은 이때까지, 잠들기 전 이야기는 이때부터 */
export const KID_DUSK = 19 * 60
export const KID_CLOSE_GAIN = 3
export const STORY_CLOSE_GAIN = 5
export const CLOSE_MAX = 100
/** 같이 만들기에서 생기는 것 (번갈아) — 집 꾸미기 가구로 놓을 수 있다 */
export const KID_MADE: readonly ItemId[] = ['woodToy', 'clothDoll']
/** 산책길에서 줍는 것 (날마다 다르게) */
export const WALK_FINDS: readonly ItemId[] = ['herb', 'fig', 'olive', 'reed']
/** 같이 요리하면 가끔 빵이 탄다: 넷째마다 한 번 (둘째, 여섯째…) */
export function cookBurns(nth: number): boolean {
  return nth % 4 === 2
}

export type KidBlock = 'noChild' | 'baby' | 'grown' | 'school' | 'done' | 'dark' | 'notYet' | 'storyDone' | null

/** 오늘 함께한 일 수 (잠들기 전 이야기 빼고) */
export function kidActsToday(s: Pick<GameState, 'flags' | 'clock'>): number {
  return s.flags.kidActDay === s.clock.day ? (s.flags.kidActs ?? 0) : 0
}

export function canKidAct(s: Pick<GameState, 'child' | 'clock' | 'flags'>, act: KidAct): KidBlock {
  const c = s.child
  if (!c) return 'noChild'
  const st = childStage(c, s.clock.day)
  if (st === 'baby') return 'baby'
  if (st === 'adult' || childMode(c, s.clock.day) === 'away') return 'grown'
  if (childAtSchool(s)) return 'school'
  const m = s.clock.minute
  if (act === 'story') {
    if (s.flags.kidStoryDay === s.clock.day) return 'storyDone'
    return m >= KID_DUSK ? null : 'notYet'
  }
  if (kidActsToday(s) >= KID_ACTS_PER_DAY) return 'done'
  if (KID_ACT_DEFS[act].outdoor && m >= KID_DUSK) return 'dark'
  return null
}

export interface KidResult {
  state: GameState
  act: KidAct
  /** 짧은 장면의 몇째 문장 */
  variant: number
  /** 아이 능력치에 쌓인 경험치 */
  gains: Partial<Record<StatId, number>>
  /** 받은 것 (만든 장난감·구운 빵·주운 것) */
  got: Partial<Record<ItemId, number>>
  /** 마을 구경·심부름에서 만난 이웃 */
  who: string | null
  burnt: boolean
}

/** 처음 있는 일은 가족 앨범에 한 장 (한 번) */
function firstTime(s: GameState, id: string): GameState {
  if (s.flags[id]) return s
  return { ...s, flags: { ...s.flags, [id]: 1 }, scenes: [...s.scenes, id] }
}

/** 날마다 정해지는 이웃 하나 (오늘 마을에 나온 이웃 중, 배우자 빼고) */
function neighborToday(s: GameState, content: GameContent, salt: number): string | null {
  const spouse = s.romance?.stage === 'married' ? s.romance.partner : null
  const ids = neighborsPresent(s, content).filter((id) => id !== spouse && id !== 'child')
  if (!ids.length) return null
  return ids[Math.floor(mulberry32(s.clock.day * 131 + salt)() * ids.length)]
}

/** 함께하기: 누르기 → 짧은 장면 → 결과 */
export function doKidAct(s: GameState, act: KidAct, content: GameContent): KidResult | null {
  if (canKidAct(s, act)) return null
  const def = KID_ACT_DEFS[act]
  const day = s.clock.day
  const c = s.child!
  let stats = c.stats
  for (const [id, xp] of Object.entries(def.gains) as [StatId, number][]) stats = addXp(stats, id, xp)
  const close = Math.min(CLOSE_MAX, (c.close ?? 0) + (act === 'story' ? STORY_CLOSE_GAIN : KID_CLOSE_GAIN))
  const flags = { ...s.flags }
  if (act === 'story') flags.kidStoryDay = day
  else {
    flags.kidActs = kidActsToday(s) + 1
    flags.kidActDay = day
  }
  let next: GameState = passTime({ ...s, child: { ...c, stats, close }, flags }, def.minutes)
  const variant = Math.floor(mulberry32(day * 31 + KID_ACTS.indexOf(act) * 7 + 3)() * 3)
  let got: Partial<Record<ItemId, number>> = {}
  let who: string | null = null
  let burnt = false
  switch (act) {
    case 'read':
      next = firstTime(next, 'fam:read')
      break
    case 'make': {
      const n = next.flags.kidMade ?? 0
      got = { [KID_MADE[n % KID_MADE.length]]: 1 }
      next = firstTime({ ...next, flags: { ...next.flags, kidMade: n + 1 } }, 'fam:make')
      break
    }
    case 'cook': {
      const n = (next.flags.kidCooks ?? 0) + 1
      burnt = cookBurns(n)
      if (!burnt) got = { bread: 1 }
      next = { ...next, flags: { ...next.flags, kidCooks: n } }
      if (burnt) next = firstTime(next, 'fam:burnt')
      break
    }
    case 'walk':
      got = { [WALK_FINDS[day % WALK_FINDS.length]]: 1 }
      next = firstTime(next, 'fam:walk')
      // 봄에 처음 나선 산책은 봄 소풍으로
      if (seasonOf(day) === 'spring') next = firstTime(next, 'fam:picnic')
      break
    case 'tour':
      who = neighborToday(next, content, 1)
      if (isMarketDay(day)) next = firstTime(next, 'fam:market')
      break
    case 'errand':
      who = neighborToday(next, content, 2)
      if (who) next = heartUp(next, who, 3)
      break
    case 'story':
      // 잠들기 전 이야기: 능력치 없이 가까움과 마음 — 하루의 피로가 조금 풀린다
      next = { ...next, needs: { ...next.needs, fatigue: Math.max(0, next.needs.fatigue - 10) } }
      next = firstTime(next, 'fam:story')
      break
  }
  if (Object.keys(got).length) next = putAway(next, got)
  return { state: next, act, variant, gains: def.gains, got, who, burnt }
}

/** 아이를 데리고 다녀온 여행 (나루의 배, 계획 13 작업 6): 가까움, 처음이면 가족 앨범 한 장 */
export function familyTrip(s: GameState): GameState {
  const c = s.child
  if (!c) return s
  return firstTime({ ...s, child: { ...c, close: Math.min(CLOSE_MAX, (c.close ?? 0) + STORY_CLOSE_GAIN) } }, 'fam:trip')
}

/** 가까움을 다섯 칸으로 */
export function closeHearts(c: { close?: number } | null | undefined): number {
  return Math.round((c?.close ?? 0) / 20)
}

// ── 가족 앨범: 앨범의 "가족" 쪽에 모이는 장 (우리 아이·배우자·동물 친구의 날과 fam: 장면) ──
const FAMILY_ALBUM = new Set(['childBorn', 'childWalks', 'childHelps', 'childStays', 'childLeaves', 'companionJoined', 'dateTea', 'dateSunset'])
export function isFamilyAlbum(id: string): boolean {
  return id.startsWith('fam:') || id.startsWith('wedding:') || id.startsWith('confess:') || FAMILY_ALBUM.has(id)
}

/** 배우자가 같은 방에서 책을 읽는가: 부부이고, 배우자가 집에 있는 저녁·밤 */
export function spouseReading(s: Pick<GameState, 'clock'> & Partial<Pick<GameState, 'romance'>>): boolean {
  const r = s.romance ?? NO_ROMANCE
  const m = s.clock.minute
  return r.stage === 'married' && !!r.partner && (m >= SPOUSE_HOME_FROM || m < SPOUSE_HOME_TO)
}

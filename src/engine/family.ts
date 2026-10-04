// 가족과 함께 있는 필사 (계획 14 작업 10, 계획 12 "아이와 함께 보내는 시간").
// 아이가 어느 정도 자라면 책상에 앉을 때 가끔 "옆에 앉고 싶어 해요" — [같이 있기]면 아이는 곁에서 그림을 그리고, 책장을 넘기다
// 졸다 잠든다. 아이는 필사하지 않고 능력치도 얻지 않는다 (보상 없음). 배우자는 저녁에 같은 방에서 책을 읽는다.
// 처음 잠든 날은 가족 앨범에 한 장 (장면 fam:deskNap — 책상에서 나온 뒤 마을에서 열린다).
import { mulberry32 } from './offers'
import { childMode, childStage } from './child'
import { childAtSchool, type GameState } from './game'
import { NO_ROMANCE, SPOUSE_HOME_FROM, SPOUSE_HOME_TO } from './romance'

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

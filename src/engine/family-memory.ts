// 아이의 첫 경험과 가족 기억 (계획 16 작업 22, 기획 08): 배우자와 함께하는 가족 활동, 배움터에서 작품 보여 주기.
// 모두 기존 가족 앨범(`fam:` 장면)·경험 기록(Life.experiences)과 같은 ID를 쓴다. 보상·능력치·신앙 수치 없음,
// 안 해도 손해 표시 없음, 아이에게 부모의 고민이나 위험한 일을 맡기지 않는다. 아이는 색·모양·놀이 중 제 선택을 한다.
import { seasonOf } from './clock'
import { weatherOf } from './calendar'
import { childMode, childStage } from './child'
import { CLOSE_MAX, KID_CLOSE_GAIN, KID_MADE, SUPPER_TO, spouseReading } from './family'
import { childAtSchool, homeSeatsNow, passTime, recordExperienceIn, type GameState } from './game'
import { SPACE_TOGETHER_ID } from './space-life'
import { NO_LIFE, recordExperience } from './people'
import { SPOUSE_HOME_FROM } from './romance'
import { isHome } from './world'

/** 아이가 고르는 가짓수 */
export const FAMILY_CHOICES = 3

/** 배우자와 함께한 가족 활동의 경험·앨범 ID */
export function spouseActId(partner: string): string {
  return `fam:with:${partner}`
}

export type SpouseActBlock = 'noSpouse' | 'noChild' | 'baby' | 'grown' | 'school' | 'time' | 'notHome' | 'done' | null

type ActState = Pick<GameState, 'child' | 'clock' | 'flags' | 'romance' | 'player'>

/**
 * 오늘 배우자와 아이가 함께하는 활동을 할 수 있는가: 부부, 걷는 아이·돕는 아이(집에 있음, 배움터에 안 감),
 * 배우자가 집에 있는 저녁(저녁 먹는 때까지), 기록자도 집 안, 하루 한 번
 */
export function canSpouseAct(s: ActState): SpouseActBlock {
  const r = s.romance
  if (r?.stage !== 'married' || !r.partner) return 'noSpouse'
  const c = s.child
  if (!c) return 'noChild'
  const st = childStage(c, s.clock.day)
  if (st === 'baby') return 'baby'
  if (st === 'adult' || childMode(c, s.clock.day) === 'away') return 'grown'
  if (childAtSchool(s)) return 'school'
  const m = s.clock.minute
  if (m < SPOUSE_HOME_FROM || m >= SUPPER_TO || !spouseReading(s)) return 'time'
  if (!isHome({ x: Math.round(s.player.x), y: Math.round(s.player.y) })) return 'notHome'
  if (s.flags.spouseActDay === s.clock.day) return 'done'
  return null
}

export const SPOUSE_ACT_MINUTES = 30

export interface SpouseActResult {
  state: GameState
  partner: string
  choice: number
  /** 처음이라 가족 앨범에 한 장 */
  album: boolean
}

/** 배우자와 아이가 고른 것으로 함께하는 짧은 활동: 아이의 선택 → 경험 기록(같은 ID, 횟수만 갱신) → 처음이면 앨범 */
export function doSpouseAct(s: GameState, choice: number): SpouseActResult | null {
  if (canSpouseAct(s) || !Number.isInteger(choice) || choice < 0 || choice >= FAMILY_CHOICES) return null
  const partner = s.romance.partner!
  const id = spouseActId(partner)
  const c = s.child!
  let next: GameState = passTime({
    ...s,
    child: { ...c, close: Math.min(CLOSE_MAX, (c.close ?? 0) + KID_CLOSE_GAIN) },
    flags: { ...s.flags, spouseActDay: s.clock.day },
  }, SPOUSE_ACT_MINUTES)
  // 정해 둔 차 자리·가족 쉼터가 있으면 식구가 그 자리에 둘러앉아 한다 (작업 23): 그날 기분 + 함께 정한 자리의 기억 한 번
  const seated = homeSeatsNow(s)
  if (seated.spouse && seated.child)
    next = recordExperienceIn({ ...next, flags: { ...next.flags, spaceDay: s.clock.day } }, { id: SPACE_TOGETHER_ID, kind: 'family', with: ['family:child', partner], place: 'home' })
  const had = !!next.life?.experiences?.[id]
  if (!had && next.flags[id]) {
    // 옛 저장에 앨범만 남은 경우 — 없던 첫 날짜를 지어내지 않고 이번부터 적는다
    next = recordSpouseAct(next, id, partner, choice)
    return { state: next, partner, choice, album: false }
  }
  if (!had) {
    next = { ...recordSpouseAct(next, id, partner, choice), flags: { ...next.flags, [id]: 1 }, scenes: [...next.scenes, id] }
    return { state: next, partner, choice, album: true }
  }
  return { state: recordSpouseAct(next, id, partner, choice), partner, choice, album: false }
}

function recordSpouseAct(s: GameState, id: string, partner: string, choice: number): GameState {
  const life = recordExperience(s.life ?? NO_LIFE, { id, kind: 'family', with: ['family:child', partner], choice, place: 'home' },
    { day: s.clock.day, minute: s.clock.minute, season: seasonOf(s.clock.day), weather: weatherOf(s.clock.day) })
  return { ...s, life }
}

// ── 배움터에서 작품 보여 주기 (기획 08 §5): 발표·그림 보여 주기·조용히 구경하기 중 편한 방식 ──
export type ShowMode = 'speak' | 'draw' | 'watch'
export const SHOW_MODES: readonly ShowMode[] = ['speak', 'draw', 'watch']
export const SHOW_ID = 'fam:show'
export const WATCH_ID = 'fam:watch'

export type ShowBlock = 'noChild' | 'stage' | 'notAtSchool' | 'nothing' | 'done' | null

/** 아이가 만든 작은 작품이 있는가 (같이 만들기를 한 번이라도 마친 뒤) */
export function madeWorks(s: Pick<GameState, 'flags'>): number {
  return s.flags.kidMade ?? 0
}

/** 교실에 내놓을 수 있는 가장 최근 작품 (장난감·헝겊 인형) */
export function latestWork(s: Pick<GameState, 'flags'>): (typeof KID_MADE)[number] | null {
  const n = madeWorks(s)
  return n > 0 ? KID_MADE[(n - 1) % KID_MADE.length] : null
}

/** 배움터에 맡긴 날(돕는 아이)에만, 하루 한 번. 조용히 구경하기는 작품이 없어도 된다 */
export function canShow(s: Pick<GameState, 'child' | 'clock' | 'flags'>, mode: ShowMode): ShowBlock {
  const c = s.child
  if (!c) return 'noChild'
  if (childStage(c, s.clock.day) !== 'helper' || childMode(c, s.clock.day) === 'away') return 'stage'
  if (!childAtSchool(s)) return 'notAtSchool'
  if (s.flags.showDay === s.clock.day) return 'done'
  if (mode !== 'watch' && !latestWork(s)) return 'nothing'
  return null
}

export interface ShowResult {
  state: GameState
  mode: ShowMode
  item: string | null
  album: boolean
}

/**
 * 배움터에서 작품을 보여 준다. 순위·점수 없음. 발표·그림은 '처음 작품을 보여 준 날'(앨범 fam:show, 처음 한 번)과 교실 전시(item),
 * 조용히 구경하기는 경험만(fam:watch). 보여 준 날은 `showDay`, 같은 경험은 횟수만 늘고 첫 날짜는 그대로
 */
export function showAtSchool(s: GameState, mode: ShowMode): ShowResult | null {
  if (canShow(s, mode)) return null
  const flags = { ...s.flags, showDay: s.clock.day }
  const moment = { day: s.clock.day, minute: s.clock.minute, season: seasonOf(s.clock.day), weather: weatherOf(s.clock.day) }
  let next: GameState = { ...s, flags }
  if (mode === 'watch') {
    next = { ...next, life: recordExperience(next.life ?? NO_LIFE, { id: WATCH_ID, kind: 'family', with: ['family:child'], place: 'classroom', choice: 2 }, moment) }
    return { state: next, mode, item: null, album: false }
  }
  const item = latestWork(s)!
  const choice = mode === 'speak' ? 0 : 1
  const had = !!next.life?.experiences?.[SHOW_ID]
  if (had) {
    next = { ...next, life: recordExperience(next.life ?? NO_LIFE, { id: SHOW_ID, kind: 'family', with: ['family:child'], place: 'classroom', item, choice }, moment) }
    return { state: next, mode, item, album: false }
  }
  if (next.flags[SHOW_ID]) {
    // 옛 저장에 앨범만 남은 경우: 날짜를 지어내지 않고 이번부터 적는다
    next = { ...next, life: recordExperience(next.life ?? NO_LIFE, { id: SHOW_ID, kind: 'family', with: ['family:child'], place: 'classroom', item, choice }, moment) }
    return { state: next, mode, item, album: false }
  }
  next = {
    ...next,
    life: recordExperience(next.life ?? NO_LIFE, { id: SHOW_ID, kind: 'family', with: ['family:child'], place: 'classroom', item, choice }, moment),
    flags: { ...next.flags, [SHOW_ID]: 1 },
    scenes: [...next.scenes, SHOW_ID],
  }
  return { state: next, mode, item, album: true }
}

/** 교실에 전시 중인 작품 (보여 준 적이 있으면 그 물건) */
export function classroomWork(s: Pick<GameState, 'life'>): string | null {
  return s.life?.experiences?.[SHOW_ID]?.item ?? null
}

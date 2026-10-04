// 연애와 결혼 (계획 6): 이웃 집안의 젊은 사람 열 명(남 다섯·여 다섯, 성 없이 이름만).
// 주인공과 다른 모습의 후보만 연애할 수 있고, 같은 모습이면 친구로 지낸다(교단마다 입장이 갈리는 부분을 게임이 먼저 열지 않는다).
// 단계: 인사·선물로 마음 → 4·6에 그 사람의 이야기 → 8 + 들꽃 다발이면 연인 → 연인 7일 + 마음 10 + 약속의 끈이면 약혼
// → 다음 장날 저녁 광장 마을 잔치(교파 예식이 아니다)에서 결혼 → 배우자가 내 집(넓힌 방)에서 함께 산다.
// 연애 대화·장면에 성경 구절을 넣지 않는다 (설계 §8).
import { isMarketDay } from './calendar'
import type { Tile } from './types'
import { HOME_EXPAND_RECT } from './world'

/** 연애 후보 (neighbors.json의 romanceable과 같다 — 테스트가 맞춰 본다) */
export const CANDIDATE_IDS = ['wendell', 'cosmo', 'rudy', 'dexter', 'basil', 'marigold', 'penelope', 'tilly', 'juniper', 'poppy'] as const
export type CandidateId = (typeof CANDIDATE_IDS)[number]

export function isCandidateId(id: string): id is CandidateId {
  return (CANDIDATE_IDS as readonly string[]).includes(id)
}

export type RomanceStage = 'dating' | 'engaged' | 'married'
export interface Romance {
  /** 연인·약혼자·배우자 (한 명) */
  partner: string | null
  stage: RomanceStage | null
  /** 연인이 된 날 */
  since: number | null
  /** 결혼 잔치 날 (약혼한 다음 장날) */
  weddingDay: number | null
  marriedDay: number | null
}
export const NO_ROMANCE: Romance = { partner: null, stage: null, since: null, weddingDay: null, marriedDay: null }

/** 마음 단계 (하트 수) */
export const STORY_HEARTS = [4, 6] as const
export const BOUQUET_HEARTS = 8
export const CORD_HEARTS = 10
/** 연인으로 지낸 날 수 (이만큼 지나야 약속의 끈) */
export const DATING_DAYS = 7
/** 들꽃 다발·약속의 끈을 건네면 오르는 마음 점수 */
export const BOUQUET_GAIN = 5
export const CORD_GAIN = 5

/**
 * 함께 가기 (계획 10 작업 4): 연인·약혼·부부가 되면 찻집 탁자·호숫가 정자·언덕 벤치에서 그 사람과 함께 간다.
 * 하루에 한 번 (어느 곳이든) — 마음 +5점, 오늘 기분 +, 곳마다 처음 간 날은 앨범 한 장.
 */
export type DatePlace = 'tea' | 'sunset' | 'walk'
export const DATE_PLACES: readonly DatePlace[] = ['tea', 'sunset', 'walk']
export const DATE_TEA_PRICE = 4
export const DATE_GAIN = 5
/** 곳마다 처음 함께 간 날의 장면 (앨범) — 그다음부터는 date:<곳>:<0~2> 짧은 장면 */
export const DATE_FIRST_SCENE: Record<DatePlace, string> = { tea: 'dateTea', sunset: 'dateSunset', walk: 'dateWalk' }
/** 곳마다 함께 간 횟수를 세는 표식 */
export const DATE_COUNT_FLAG: Record<DatePlace, string> = { tea: 'dateTeas', sunset: 'dateSunsets', walk: 'dateWalks' }
export const DATE_VARIANTS = 3
/** 언덕길을 걷기 좋은 때 (06:00–19:30), 비·눈이 오면 미끄러워 걷지 않는다 */
export const WALK_FROM = 6 * 60
export const WALK_TO = 19 * 60 + 30
export const WALK_MINUTES = 40
/**
 * 그 사람의 집안 일 (people.json 일과의 doing). 이 일을 하고 있는 동안은 바빠서 함께 가지 못한다.
 * 점심처럼 누구와 함께 있는 때(일과의 with)는 쉬는 때로 본다. 찻집 일을 하는 파피는 찻집에서는 잠깐 마주 앉을 수 있다.
 */
export const PARTNER_WORK: Record<CandidateId, string> = {
  wendell: 'bread',
  cosmo: 'net',
  rudy: 'wood',
  dexter: 'sheep',
  basil: 'herb',
  marigold: 'grape',
  penelope: 'weave',
  tilly: 'hammer',
  juniper: 'bee',
  poppy: 'tea',
}
/** 일하는 곳이 곧 그곳이라 일하면서도 잠깐 앉을 수 있는 곳 */
export const WORK_HERE: Partial<Record<string, DatePlace>> = { tea: 'tea' }

/** 결혼 잔치: 광장 모닥불 바로 위 (신랑·신부 자리) */
export const WEDDING_SPOT: Tile = { x: 24, y: 19 }
/** 배우자가 저녁부터 아침까지 지내는 곳: 내 집 넓힌 방 */
export const SPOUSE_SPOT: Tile = { x: HOME_EXPAND_RECT.x0 + 1, y: HOME_EXPAND_RECT.y0 + 2 }
/** 배우자가 집에 돌아오는 때 (19:00), 아침에 나가는 때 (07:00) */
export const SPOUSE_HOME_FROM = 19 * 60
export const SPOUSE_HOME_TO = 7 * 60

/** 약혼한 날 다음 장날 (장날 당일에 약혼하면 그다음 장날) */
export function nextMarketAfter(day: number): number {
  let d = day + 1
  while (!isMarketDay(d)) d++
  return d
}

/** 옛 저장·이상한 값 → 빈 연애 */
export function sanitizeRomance(raw: unknown): Romance {
  if (!raw || typeof raw !== 'object') return NO_ROMANCE
  const o = raw as Partial<Romance>
  const partner = typeof o.partner === 'string' && isCandidateId(o.partner) ? o.partner : null
  const stage = partner && (o.stage === 'dating' || o.stage === 'engaged' || o.stage === 'married') ? o.stage : null
  if (!partner || !stage) return NO_ROMANCE
  const num = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n : null)
  return { partner, stage, since: num(o.since), weddingDay: stage === 'engaged' ? num(o.weddingDay) : null, marriedDay: stage === 'married' ? num(o.marriedDay) : null }
}

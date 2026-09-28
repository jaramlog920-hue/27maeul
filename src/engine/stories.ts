// 이웃 이야기와 특별한 순간 (설계 2.4·2.9). 모두 게임 창작이며 문구는 life-text.json의 scenes에 있다.
import { festivalOf, FESTIVAL_FROM, FESTIVAL_TO, isWet, weatherOf, yearOf } from './calendar'
import { phaseOf, seasonOf } from './clock'
import type { ItemId, Tile } from './types'

export const BABY_DAY = 8
export const BABY_CRAWL = 16
export const BABY_WALK = 26
export const CHILD_ASKS_AT = 3
export const LETTERS_TOTAL = 7
/** 이만큼 배웠으면 잔치에서 한 줄을 읽는다 */
export const LETTERS_TO_READ = 5
export const LESSON_FROM = 18 * 60
export const LESSON_TO = 19 * 60 + 30
export const LESSON_SPOT: Tile = { x: 7, y: 4 }

/** 하트가 이만큼 되면 이웃이 선물을 준다 */
export const MILESTONES = [3, 6, 9] as const
export const MILESTONE_GIFTS: Record<string, Partial<Record<(typeof MILESTONES)[number], Partial<Record<ItemId, number>>>>> = {
  baker: { 3: { basket: 1 }, 6: { rug: 1 }, 9: { candle: 1 } },
  child: { 3: { vase: 1 }, 6: { pot: 1 }, 9: { bird: 1 } },
  grandpa: { 3: { fig: 3 }, 6: { table: 1 }, 9: { bowl: 1 } },
  merchant: { 3: { papyrus: 2 }, 9: { rug: 1 } },
  smith: { 3: { brightLamp: 1 }, 9: { nightstand: 1 } },
  shepherd: { 3: { cushion: 1 }, 6: { wool: 3 }, 9: { cushion: 1 } },
  presser: { 3: { oil: 2 }, 9: { jar: 1 } },
  weaver: { 3: { cushion: 1 }, 6: { rug: 1 }, 9: { basket: 1 } },
  beekeeper: { 3: { honey: 2 }, 6: { candle: 1 }, 9: { jar: 1 } },
}

export type BabyStage = 'none' | 'baby' | 'crawl' | 'walk'
export function babyStage(day: number): BabyStage {
  if (day < BABY_DAY) return 'none'
  if (day < BABY_CRAWL) return 'baby'
  if (day < BABY_WALK) return 'crawl'
  return 'walk'
}

/** 아이의 키: 계절이 바뀔 때마다 1픽셀씩 (최대 3) */
export function childGrowth(day: number): number {
  return Math.min(3, Math.floor((day - 1) / 7))
}

/** 해마다 한 번만 보는 장면의 표식 */
export const onceKey = (id: string, day: number) => `seen:${id}:${yearOf(day)}`

/** 장터 안인가 (행사가 열리는 곳) */
export function inMarket(t: Tile): boolean {
  return t.x >= 12 && t.x <= 19 && t.y >= 11 && t.y <= 16
}

export interface MomentContext {
  day: number
  minute: number
  outdoors: boolean
  player: Tile
  flags: Record<string, number>
}

/** 지금 이 자리에서 일어나는 특별한 순간 (한 번에 하나) */
export function momentNow(ctx: MomentContext): string | null {
  const { day, minute, flags } = ctx
  const w = weatherOf(day)
  const fest = festivalOf(day)
  // 이웃들이 모닥불까지 걸어올 틈(30분)을 두고 장면을 연다
  if (fest && !isWet(w) && minute >= FESTIVAL_FROM + 30 && minute < FESTIVAL_TO && inMarket(ctx.player) && !flags[onceKey(`festival:${fest}`, day)])
    return `festival:${fest}`
  if (ctx.outdoors && seasonOf(day) === 'autumn' && w === 'rain' && minute >= 16 * 60 && minute < 17.5 * 60 && !flags[onceKey('rainbow', day)])
    return 'rainbow'
  if (ctx.outdoors && w === 'snow' && phaseOf(minute) !== 'night' && !flags[onceKey('firstSnow', day)]) return 'firstSnow'
  return null
}

/** 무지개가 보이는 때 (그리기용) */
export function rainbowVisible(day: number, minute: number): boolean {
  return seasonOf(day) === 'autumn' && weatherOf(day) === 'rain' && minute >= 16 * 60 && minute < 17.5 * 60
}

/** 다 쓴 날 아침, 이웃들이 모이는 마당 자리 (기록자의 집 앞) */
export const ENDING_SPOTS: Record<string, Tile> = {
  baker: { x: 4, y: 8 },
  child: { x: 5, y: 8 },
  grandpa: { x: 7, y: 8 },
  smith: { x: 8, y: 8 },
  shepherd: { x: 3, y: 9 },
  presser: { x: 9, y: 9 },
  merchant: { x: 2, y: 8 },
  weaver: { x: 8, y: 9 },
  beekeeper: { x: 4, y: 9 },
}
export const ENDING_UNTIL = 12 * 60

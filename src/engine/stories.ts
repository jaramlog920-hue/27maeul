// 이웃 이야기와 특별한 순간 (설계 2.4·2.9). 모두 게임 창작이며 문구는 life-text.json의 scenes에 있다.
import { festivalOf, FESTIVAL_FROM, FESTIVAL_TO, isMarketDay, isWet, weatherOf, yearOf } from './calendar'
import { phaseOf, seasonOf } from './clock'
import type { ItemId, Tile } from './types'

export const BABY_DAY = 8
export const BABY_CRAWL = 16
export const BABY_WALK = 26
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
  postman: { 3: { papyrus: 2 }, 9: { basket: 1 } },
  apothecary: { 3: { seedHerb: 3 }, 6: { pot: 1 }, 9: { teapot: 1 } },
  fisher: { 3: { reed: 3 }, 6: { basket: 1 }, 9: { bowl: 1 } },
  carpenter: { 3: { stool: 1 }, 6: { chair: 1 }, 9: { bookcase: 1 } },
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

/** 장터 광장 안인가 (모닥불 행사가 열리는 곳 — world.ts의 광장 19~29, 13~20) */
export function inMarket(t: Tile): boolean {
  return t.x >= 19 && t.x <= 29 && t.y >= 13 && t.y <= 20
}

/** 복음서 방 잔치 저녁, 광장 모닥불에서 보는 장면 (잔치 날 한 번) */
export const FEAST_FIRE = 'feastFire'
/** 스물일곱 권 잔치 저녁, 광장 모닥불에서 보는 장면 (잔치 날 한 번) */
export const ALL_FEAST_FIRE = 'allFeastFire'

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
  // 복음서 방 잔치는 비가 와도 연다 (잔치 날은 flags.gospelFeast === 1)
  if (flags.gospelFeast === 1 && minute >= FESTIVAL_FROM + 30 && minute < FESTIVAL_TO && inMarket(ctx.player) && !flags[onceKey(FEAST_FIRE, day)])
    return FEAST_FIRE
  // 스물일곱 권 잔치도 같은 자리·같은 시각, 비가 와도 연다 (잔치 날은 flags.allFeast === 1)
  if (flags.allFeast === 1 && minute >= FESTIVAL_FROM + 30 && minute < FESTIVAL_TO && inMarket(ctx.player) && !flags[onceKey(ALL_FEAST_FIRE, day)])
    return ALL_FEAST_FIRE
  if (fest && !isWet(w) && minute >= FESTIVAL_FROM + 30 && minute < FESTIVAL_TO && inMarket(ctx.player) && !flags[onceKey(`festival:${fest}`, day)])
    return `festival:${fest}`
  if (ctx.outdoors && rainbowVisible(day, minute) && !flags[onceKey('rainbow', day)])
    return 'rainbow'
  if (ctx.outdoors && w === 'snow' && phaseOf(minute) !== 'night' && !flags[onceKey('firstSnow', day)]) return 'firstSnow'
  if (ctx.outdoors && !isWet(w) && isMarketDay(day) && minute >= 18 * 60 && minute < 19.5 * 60 && inMarket(ctx.player) && !flags[onceKey('marketEvening', day)]) return 'marketEvening'
  if (ctx.outdoors && !isWet(w) && minute >= 10 * 60 && minute < 16 * 60) {
    const nearHill = Math.abs(ctx.player.x - 14) + Math.abs(ctx.player.y - 12) <= 3
    const atWater = ctx.player.x >= 10 && ctx.player.x <= 16 && ctx.player.y >= 30 && ctx.player.y <= 33
    const id = seasonOf(day) === 'spring' && nearHill ? 'springWalk' : seasonOf(day) === 'autumn' && nearHill ? 'autumnPath' : seasonOf(day) === 'summer' && atWater ? 'summerCreek' : null
    if (id && !flags[onceKey(id, day)]) return id
  }
  return null
}

/**
 * 무지개가 뜨는 날 (2026-10-13 사용자: 비 올 때가 아니라 비 갠 뒤, 매번은 아니게): 전날 비가 오고 오늘 갠 날 중
 * 열에 넷쯤 (날로 정해 다시 불러와도 같다)
 */
export function rainbowDay(day: number): boolean {
  if (day < 2 || isWet(weatherOf(day)) || weatherOf(day - 1) !== 'rain') return false
  const h = Math.imul(day ^ 0x5bd1e995, 0x27d4eb2d) >>> 0
  return h % 10 < 4
}

/** 무지개가 보이는 때 (그리기용): 그런 날 오후 네 시부터 다섯 시 반 */
export function rainbowVisible(day: number, minute: number): boolean {
  return rainbowDay(day) && minute >= 16 * 60 && minute < 17.5 * 60
}

// 집 오른쪽 위 텃밭 열두 칸 (설계 §2.5). 씨앗을 심고, 날마다 물을 주면 자라고, 다 자라면 거둔다. 겨울엔 쉰다.
import { seasonOf } from './clock'
import type { GameState } from './game'
import { stash, stashOverflows, owns } from './easier'
import { has, take } from './items'
import { addXp, XP } from './stats'
import type { ItemId, Tile } from './types'

export type CropId = 'herb' | 'bean'
export interface Plot {
  crop: CropId
  grown: number
  wateredDay: number | null
}

export const CROPS: Record<CropId, { seed: ItemId; days: number; gives: Partial<Record<ItemId, number>> }> = {
  herb: { seed: 'seedHerb', days: 3, gives: { herb: 2 } },
  bean: { seed: 'seedBean', days: 4, gives: { bean: 3 } },
}

/** 지도 텃밭('l', world.ts의 rect(11, 4, 14, 6))과 같은 칸 — 두 목록이 같은지는 테스트가 본다 */
export const GARDEN_TILES: readonly Tile[] = [11, 12, 13, 14].flatMap((x) => [4, 5, 6].map((y) => ({ x, y }))).sort((a, b) => a.y - b.y || a.x - b.x)

const keyOf = (t: Tile) => `${t.x},${t.y}`
const isPlot = (t: Tile) => GARDEN_TILES.some((g) => g.x === t.x && g.y === t.y)

export type PlantBlock = 'winter' | 'taken' | 'noSeed' | null
export function canPlant(s: Pick<GameState, 'clock' | 'garden' | 'inv'>, at: Tile, crop: CropId): PlantBlock {
  if (!isPlot(at)) return 'taken'
  if (seasonOf(s.clock.day) === 'winter') return 'winter'
  if (s.garden[keyOf(at)]) return 'taken'
  if (!has(s.inv, { [CROPS[crop].seed]: 1 })) return 'noSeed'
  return null
}

export function plant(s: GameState, at: Tile, crop: CropId): GameState | null {
  if (canPlant(s, at, crop)) return null
  // 텃밭 일은 근력을 조금 올린다 (계획 11 작업 4)
  return { ...s, stats: addXp(s.stats, 'strength', XP.garden), inv: take(s.inv, { [CROPS[crop].seed]: 1 })!, garden: { ...s.garden, [keyOf(at)]: { crop, grown: 0, wateredDay: null } } }
}

export function water(s: GameState, at: Tile): GameState | null {
  const p = s.garden[keyOf(at)]
  if (!p || p.wateredDay === s.clock.day || isRipe(p) || seasonOf(s.clock.day) === 'winter') return null
  return { ...s, stats: addXp(s.stats, 'strength', XP.garden), garden: { ...s.garden, [keyOf(at)]: { ...p, wateredDay: s.clock.day } } }
}

export function isRipe(p: Plot): boolean {
  return p.grown >= CROPS[p.crop].days
}

export function harvest(s: GameState, at: Tile): GameState | null {
  const p = s.garden[keyOf(at)]
  if (!p || !isRipe(p)) return null
  const gives = CROPS[p.crop].gives
  // 가방이 차면 재료 궤짝으로 (채집·돕기 보상과 같은 규칙) — 둘 다 차면 거두지 않고 작물을 남긴다
  const chest = owns(s.flags, 'supplyChest') ? (s.chest ?? {}) : null
  if (stashOverflows(s.inv, chest, gives)) return null
  const garden = { ...s.garden }
  delete garden[keyOf(at)]
  const put = stash(s.inv, chest, gives)
  return { ...s, stats: addXp(s.stats, 'strength', XP.garden), inv: put.inv, chest: put.chest ?? s.chest, garden }
}

/** 잠들 때: 오늘 물 준 칸만 하루 자란다 */
export function growGarden(garden: Record<string, Plot>, day: number): Record<string, Plot> {
  return Object.fromEntries(Object.entries(garden).map(([k, p]) => [k, p.wateredDay === day && !isRipe(p) ? { ...p, grown: p.grown + 1 } : p]))
}

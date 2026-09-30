// 동반 동물 (설계 2.8): 둘째 날 새끼 고양이와 강아지가 찾아오고, 먼저 밥을 준 쪽이 식구가 된다.
import { findPath, stepActor, type Actor } from './movement'
import { isWalkable, sameTile } from './world'
import type { Tile } from './types'

export type Animal = 'cat' | 'dog'

export interface Companion extends Actor {
  kind: Animal
  name: string
  since: number
}

export const STRAY_DAY = 2
/** 둘째 날 떠돌이 새끼들이 기다리는 곳 — 내 집 앞 풀밭 (집이 왼쪽으로 넓어질 1·2열의 문 앞 줄) */
export const STRAY_SPOTS: Record<Animal, Tile> = { cat: { x: 2, y: 8 }, dog: { x: 8, y: 8 } }
/** 비 오는 날 웅크리는 처마 밑 (집 앞벽 오른쪽 아래) */
export const EAVES: Tile = { x: 7, y: 8 }
export const GROWN_AFTER = 10
export const COMPANION_SPEED = 4
export const NAME_MAX = 8

export function adopt(kind: Animal, name: string, day: number, at: Tile): Companion {
  return { kind, name, since: day, x: at.x, y: at.y, path: [], facing: 'down', walkTime: 0 }
}

export function isGrown(c: Companion, day: number): boolean {
  return day - c.since >= GROWN_AFTER
}

/** 이름: 앞뒤 공백을 떼고 8자까지. 비면 기본 이름 */
export function cleanName(raw: string, kind: Animal): string {
  const s = raw.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX)
  return s || (kind === 'cat' ? '나비' : '누렁이')
}

const ADJ: readonly Tile[] = [
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
]

/** 동물이 가고 싶은 칸: 비 오고 기록자가 밖이면 처마 밑, 아니면 기록자 옆 */
export function companionGoal(player: Tile, playerOutdoorsInRain: boolean): Tile | null {
  if (playerOutdoorsInRain) return EAVES
  for (const d of ADJ) {
    const t = { x: player.x + d.x, y: player.y + d.y }
    if (isWalkable(t)) return t
  }
  return null
}

export function stepCompanion(c: Companion, goal: Tile | null, dt: number): Companion {
  if (!goal) return c
  const here = { x: Math.round(c.x), y: Math.round(c.y) }
  const dest = c.path.at(-1)
  let path = c.path
  // 목표가 바뀌었을 때만 길을 다시 찾는다 — 이미 옆에 있으면 가만히
  if (!sameTile(here, goal) && (!dest || !sameTile(dest, goal))) {
    const p = findPath(here, goal)
    path = p ? (c.x !== here.x || c.y !== here.y ? [here, ...p] : p) : []
  }
  const { actor } = stepActor({ ...c, path }, dt * (COMPANION_SPEED / 3.5))
  return { ...c, ...actor }
}

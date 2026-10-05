// 동반 동물 (설계 2.8): 둘째 날 새끼 고양이와 강아지가 찾아오고, 먼저 밥을 준 쪽이 식구가 된다.
import { findPath, stepActor, type Actor } from './movement'
import { isHome, isWalkable, PET_HOME, sameTile, tileAt } from './world'
import type { Tile } from './types'

export type Animal = 'cat' | 'dog'

export interface Companion extends Actor {
  kind: Animal
  name: string
  since: number
  /** 집에 두기: 따라다니지 않고 집 안 자리(PET_HOME)에서 기다린다 */
  stay?: boolean
  ways?: PetWays
  found?: ('play' | 'rest')[]
  moments?: Partial<Record<'play' | 'rest' | 'walk', number>>
  lastInteraction?: number
  motion?: { action: 'play' | 'rest'; left: number }
}

export interface PetWays { curious: number; distance: number; energy: number }

/** 옛 식구도 이름과 입양일이 같으면 늘 같은 성향을 가진다. */
export function petWays(c: Pick<Companion, 'name' | 'since' | 'kind' | 'ways'>): PetWays {
  if (c.ways && [c.ways.curious, c.ways.distance, c.ways.energy].every(v => Number.isInteger(v) && v >= 0 && v <= 2)) return c.ways
  let seed = 2166136261
  for (const char of `${c.name}:${c.since}:${c.kind}`) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0
  return { curious: seed % 3, distance: Math.floor(seed / 3) % 3, energy: Math.floor(seed / 9) % 3 }
}

export function sanitizeCompanion(c: Companion | null): Companion | null {
  if (!c) return null
  if (!['cat', 'dog'].includes(c.kind) || typeof c.name !== 'string' || !Number.isFinite(c.since)) return null
  const moments = Object.fromEntries(Object.entries(c.moments ?? {}).filter(([k, v]) => ['play', 'rest', 'walk'].includes(k) && Number.isInteger(v) && v >= c.since))
  return { ...c, ways: petWays(c), found: [...new Set((Array.isArray(c.found) ? c.found : []).filter(k => k === 'play' || k === 'rest'))], moments,
    lastInteraction: Number.isFinite(c.lastInteraction) ? c.lastInteraction : undefined, motion: undefined }
}

/** 집 안에서만 고른다. 가구나 사람이 쓰는 자리를 피한다. */
export function petHomeGoal(c: Companion, blocked: ReadonlySet<string> = new Set()): Tile {
  const candidates: Tile[] = []
  for (let y = PET_HOME.y - 6; y <= PET_HOME.y + 6; y++) for (let x = PET_HOME.x - 6; x <= PET_HOME.x + 6; x++) {
    const t = { x, y }
    if (isHome(t) && isWalkable(t, blocked) && tileAt(x, y) === 'f') candidates.push(t)
  }
  const ways = petWays(c)
  candidates.sort((a,b) => {
    const score = (t: Tile) => c.kind === 'cat' && ways.curious > 0
      ? Math.abs(t.x - PET_HOME.x) + Math.abs(t.y - PET_HOME.y + 2)
      : Math.abs(t.x - PET_HOME.x) + Math.abs(t.y - PET_HOME.y)
    return score(a)-score(b) || a.y-b.y || a.x-b.x
  })
  return candidates.find(t => findPath(PET_HOME, t, blocked)) ?? PET_HOME
}

export const PET_INTERACTION_GAP = 30
export function interactPet(c: Companion, action: 'play' | 'rest', day: number, minute: number): Companion | null {
  const now = day * 1440 + minute
  if (c.lastInteraction !== undefined && now - c.lastInteraction < PET_INTERACTION_GAP) return null
  return { ...c, ways: petWays(c), found: [...new Set([...(c.found ?? []), action])],
    moments: { ...c.moments, [action]: c.moments?.[action] ?? day }, lastInteraction: now,
    motion: { action, left: 4 } }
}

export const STRAY_DAY = 2
/** 둘째 날 떠돌이 새끼들이 기다리는 곳 — 내 집 앞 풀밭 (집이 왼쪽으로 넓어질 1·2열의 문 앞 줄) */
export const STRAY_SPOTS: Record<Animal, Tile> = { cat: { x: 1, y: 8 }, dog: { x: 8, y: 8 } }
/** 비 오는 날 웅크리는 처마 밑 (집 앞벽 오른쪽 아래) */
export const EAVES: Tile = { x: 7, y: 8 }
export const GROWN_AFTER = 10
export const COMPANION_SPEED = 4
export const NAME_MAX = 8

export function adopt(kind: Animal, name: string, day: number, at: Tile): Companion {
  const c: Companion = { kind, name, since: day, x: at.x, y: at.y, path: [], facing: 'down', walkTime: 0 }
  return { ...c, ways: petWays(c), found: [], moments: {} }
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

export function stepCompanion(c: Companion, goal: Tile | null, dt: number, blockers?: ReadonlySet<string>): Companion {
  if (!goal) return c
  const here = { x: Math.round(c.x), y: Math.round(c.y) }
  const dest = c.path.at(-1)
  let path = c.path
  // 목표가 바뀌었을 때만 길을 다시 찾는다 — 이미 옆에 있으면 가만히
  if (!sameTile(here, goal) && (!dest || !sameTile(dest, goal))) {
    const p = findPath(here, goal, blockers)
    path = p ? (c.x !== here.x || c.y !== here.y ? [here, ...p] : p) : []
  }
  const { actor } = stepActor({ ...c, path }, dt * (COMPANION_SPEED / 3.5))
  return { ...c, ...actor }
}

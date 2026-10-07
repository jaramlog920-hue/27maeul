// 동반 동물 (설계 2.8): 둘째 날 새끼 고양이와 강아지가 찾아오고, 먼저 밥을 준 쪽이 식구가 된다.
import { findPath, stepActor, type Actor } from './movement'
import { HOME_ENTRY, HOME_ROOM, isHome, isWalkable, key, PET_HOME, PLACES, sameTile, tileAt, WARPS } from './world'
import { seasonOf } from './clock'
import type { Season, Tile, Weather } from './types'

export type Animal = 'cat' | 'dog'

export interface Companion extends Actor {
  kind: Animal
  name: string
  since: number
  /** 집에 두기: 따라다니지 않고 집 안 자리(PET_HOME)에서 기다린다 */
  stay?: boolean
  ways?: PetWays
  found?: PetFound[]
  moments?: Partial<Record<PetFound, number>>
  lastInteraction?: number
  motion?: { action: PetMotion; left: number }
  /** 함께 논 횟수 (좋아하는 장난감을 알아보는 데만 쓴다 — 보상 없음) */
  plays?: number
  /** 함께 걸어 본 곳 → 처음 닿은 날 */
  walked?: Record<string, number>
  /** 걷다가 익숙한 곳에서 보인 마지막 반응 (날 × 1440 + 분) */
  lastWalkReact?: number
  /** 마을 이웃과 마주친 날 수와 마지막 날 */
  met?: Record<string, { n: number; last: number }>
}

/** 동물 기록에 남는 것: 처음 논 날·처음 쉰 날·처음 걸은 날·좋아하는 장난감·좋아하는 자리·먼저 옆에 온 날 */
export type PetFound = 'play' | 'rest' | 'walk' | 'toy' | 'spot' | 'came'
export const PET_FOUND: readonly PetFound[] = ['play', 'rest', 'walk', 'toy', 'spot', 'came']
/** 도트(assets/furniture/expansion/pets)의 여섯 동작: walk·wait·sniff·play·fetch·wag. rest는 wait 그림 */
export type PetMotion = 'play' | 'rest' | 'sniff' | 'wait' | 'wag' | 'fetch'

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
  const moments = Object.fromEntries(Object.entries(c.moments ?? {}).filter(([k, v]) => (PET_FOUND as readonly string[]).includes(k) && Number.isInteger(v) && v >= c.since))
  const found = [...new Set((Array.isArray(c.found) ? c.found : []).filter((k): k is PetFound => (PET_FOUND as readonly string[]).includes(k)))]
  const rawWalked = c.walked && typeof c.walked === 'object' && !Array.isArray(c.walked) ? c.walked : {}
  const walked = Object.fromEntries(Object.entries(rawWalked).filter(([k, v]) => WALK_PLACES.includes(k) && Number.isInteger(v) && v >= c.since))
  const rawMet = c.met && typeof c.met === 'object' && !Array.isArray(c.met) ? c.met : {}
  const met = Object.fromEntries(Object.entries(rawMet).filter(([k, v]) => k.length <= 24 && !!v && Number.isInteger(v.n) && v.n >= 1 && v.n <= 999 && Number.isInteger(v.last) && v.last >= c.since).slice(0, 30))
  return { ...c, ways: petWays(c), found, moments,
    plays: Number.isInteger(c.plays) && (c.plays as number) >= 0 ? Math.min(c.plays as number, 999) : 0,
    walked, met, lastWalkReact: Number.isFinite(c.lastWalkReact) ? c.lastWalkReact : undefined,
    lastInteraction: Number.isFinite(c.lastInteraction) ? c.lastInteraction : undefined, motion: undefined }
}

// ── 습관: 하루의 자리와 자세 (저장하지 않고 시각·날씨·계절·성향에서 늘 같게 다시 계산한다) ──

export type PetSpot = 'door' | 'window' | 'blanket' | 'toy' | 'hearth' | 'cool'
export type PetPose = 'nap' | 'wait' | 'sniff' | 'play' | 'fetch' | 'wag'
export interface PetHabit { spot: PetSpot; pose: PetPose; key: string }

function seedOf(c: Pick<Companion, 'name' | 'since' | 'kind'>, salt: string): number {
  let seed = 2166136261
  for (const char of `${c.name}:${c.since}:${c.kind}:${salt}`) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0
  return seed
}

/** 낮잠 자리 취향 — 담요·창가·화덕 곁(고양이) / 담요·문 앞·화덕 곁(강아지). 이름+입양일 씨앗으로 늘 같다 */
export function favoriteSpot(c: Pick<Companion, 'name' | 'since' | 'kind'>): PetSpot {
  const list: PetSpot[] = c.kind === 'cat' ? ['window', 'blanket', 'hearth'] : ['blanket', 'door', 'hearth']
  return list[seedOf(c, 'spot') % list.length]
}
export const PET_TOYS = { cat: ['feather', 'ball', 'cloth'], dog: ['ball', 'rope', 'stick'] } as const
export type PetToy = typeof PET_TOYS.cat[number] | typeof PET_TOYS.dog[number]
export function favoriteToy(c: Pick<Companion, 'name' | 'since' | 'kind'>): PetToy {
  const list = PET_TOYS[c.kind]
  return list[seedOf(c, 'toy') % list.length]
}

const MEALS = [8 * 60 + 30, 13 * 60, 19 * 60]
const AFTER_MEAL = 40

/**
 * 지금 이 동물이 집에서 하는 습관. 집에 두었을 때의 자리와 자세이고, 따라다니기·집에 두기 명령이 늘 먼저다.
 * 활동량이 높으면 놀이가 많고, 호기심이 높으면 살피는 시간이 많고, 낮잠 자리는 좋아하는 자리.
 */
export function petHabit(c: Pick<Companion, 'name' | 'since' | 'kind' | 'ways'>, day: number, minute: number, weather: Weather): PetHabit {
  const w = petWays(c), cat = c.kind === 'cat', m = minute % 1440, h = m / 60, season: Season = seasonOf(day)
  const wet = weather === 'rain' || weather === 'snow'
  const nap = (key: string, spot: PetSpot = favoriteSpot(c)): PetHabit => ({ spot, pose: 'nap', key })
  const wait: PetHabit = cat ? { spot: 'window', pose: 'wait', key: 'sunWindow' } : { spot: 'door', pose: 'wait', key: 'doorWait' }
  if (MEALS.some((x) => m >= x && m < x + AFTER_MEAL)) return nap('afterMeal', 'blanket')
  if (wet) {
    if (cat && w.curious > 0 && h < 20) return { spot: 'window', pose: 'wait', key: 'rainWindow' }
    if (!cat && w.energy === 2 && h >= 9 && h < 18) return { spot: 'toy', pose: 'fetch', key: 'rainToy' }
    return nap('rainBlanket', 'blanket')
  }
  if (h < 9) return cat ? { spot: 'window', pose: w.curious > 0 ? 'sniff' : 'wait', key: 'sunWindow' } : wait
  if (h >= 21) return nap('blanketNap')
  if (season === 'summer' && h >= 12 && h < 16) return nap('coolFloor', 'cool')
  if (season === 'winter' && h >= 15) return nap('warmHearth', 'hearth')
  const active = (h >= 9 && h < 11.5) || (h >= 15 && h < 18.5)
  if (active) {
    if (w.energy === 2) return { spot: 'toy', pose: cat ? 'play' : 'fetch', key: 'toyPlay' }
    if (season === 'spring' && w.curious > 0) return { spot: 'window', pose: 'sniff', key: 'springWindow' }
    if (w.energy === 1) return w.curious > 0 ? { spot: 'toy', pose: 'sniff', key: 'sniffAround' } : wait
    return nap('blanketNap')
  }
  if (h >= 18.5) return cat || w.energy > 0 ? wait : nap('blanketNap')
  return w.energy === 2 ? wait : nap('blanketNap')
}

/**
 * 집에 둔 동물 곁에 놓이는 작은 소품(계획 17): 담요 자리에 있으면 깔개, 장난감 자리에 있으면 장난감.
 * 그림만 — 동물이 이미 선 안전한 칸(문·길을 막지 않는 칸)에만 얹고 지도·길·충돌은 건드리지 않는다.
 * 움직이는 중이거나 명령(motion)이 있으면 없다. 장난감은 바라보는 쪽 옆으로 반 칸 비켜 놓는다.
 */
export function petCornerProp(c: Companion, day: number, minute: number, weather: Weather): { art: 'petBlanket' | 'petToy'; at: Tile; side: 'left' | 'right' } | null {
  if (!c.stay || c.path.length > 0 || c.motion) return null
  const at = { x: Math.round(c.x), y: Math.round(c.y) }
  if (!isHome(at) || !petSpotSafe(at)) return null
  const spot = petHabit(c, day, minute, weather).spot
  const side = c.facing === 'left' ? 'left' : 'right'
  if (spot === 'blanket') return { art: 'petBlanket', at, side }
  if (spot === 'toy') return { art: 'petToy', at, side }
  return null
}

/** 따라다니는 동안 기록자가 가만히 서 있을 때 곁에서 하는 작은 자세 (초 단위 가만히, 15초가 넘으면 졸기는 그리는 쪽이 맡는다) */
export function petFollowPose(c: Pick<Companion, 'name' | 'since' | 'kind' | 'ways'>, idleSeconds: number, weather: Weather): PetPose | null {
  const w = petWays(c)
  if (idleSeconds < 3 || idleSeconds >= 15) return null
  if (idleSeconds < 8) return 'wait'
  if (weather === 'snow' && w.energy > 0) return 'play'
  return w.curious > 0 ? 'sniff' : w.distance === 0 ? 'wag' : 'wait'
}

// ── 안전한 쉬는 자리 ──

const STEPS: readonly Tile[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
const at = (dx: number, dy: number): Tile => ({ x: PET_HOME.x + dx, y: PET_HOME.y + dy })

function anchorOf(c: Companion, spot: PetSpot): Tile {
  const w = petWays(c)
  switch (spot) {
    case 'door': return PET_HOME
    case 'window': return at(1, -3)
    case 'toy': return at(2, 0)
    case 'hearth': return at(2, -2)
    case 'cool': return at(-2, 0)
    case 'blanket': return w.distance === 0 ? at(0, -1) : w.distance === 1 ? at(-1, 0) : at(4, 0)
  }
}

function homeFloor(t: Tile): boolean {
  return isHome(t) && tileAt(t.x, t.y) === 'f'
}

/** 이 칸에 동물이 있어도 문과 길이 막히지 않는가: 들어오는 칸·문깔개 곁이 아니고, 놓은 뒤에도 문에서 집 안 모든 바닥에 닿는다 */
export function petSpotSafe(t: Tile, blocked: ReadonlySet<string> = new Set()): boolean {
  if (!homeFloor(t) || blocked.has(key(t)) || sameTile(t, HOME_ENTRY) || WARPS.has(key(t))) return false
  if (STEPS.some((d) => { const n = { x: t.x + d.x, y: t.y + d.y }; return WARPS.has(key(n)) || sameTile(n, HOME_ROOM.exit) })) return false
  const reach = (extra: string | null) => {
    const seen = new Set([key(HOME_ENTRY)]), queue: Tile[] = [HOME_ENTRY]
    for (let i = 0; i < queue.length; i++) for (const d of STEPS) {
      const n = { x: queue[i].x + d.x, y: queue[i].y + d.y }, k = key(n)
      if (!seen.has(k) && k !== extra && isHome(n) && isWalkable(n, blocked)) { seen.add(k); queue.push(n) }
    }
    return seen
  }
  const before = reach(null), after = reach(key(t))
  for (const k of before) if (k !== key(t) && !after.has(k)) return false
  return true
}

/** 집 안에서만 고른다. 가구나 사람이 쓰는 자리를 피하고, 문과 길을 막는 칸은 쓰지 않는다. 자리가 사라졌으면 안전한 다른 칸 */
export function petHomeGoal(c: Companion, blocked: ReadonlySet<string> = new Set(), spot: PetSpot = 'door'): Tile {
  const candidates: Tile[] = []
  for (let y = PET_HOME.y - 6; y <= PET_HOME.y + 6; y++) for (let x = PET_HOME.x - 8; x <= PET_HOME.x + 14; x++) {
    const t = { x, y }
    if (homeFloor(t) && isWalkable(t, blocked)) candidates.push(t)
  }
  const anchor = anchorOf(c, spot)
  const windowRow = (t: Tile) => (spot === 'window' && tileAt(t.x, t.y - 1) === 'N' ? 0 : 1)
  const far = (t: Tile) => Math.abs(t.x - anchor.x) + Math.abs(t.y - anchor.y)
  candidates.sort((a, b) => windowRow(a) - windowRow(b) || far(a) - far(b) || a.y - b.y || a.x - b.x)
  let tries = 0
  for (const t of candidates) {
    if (++tries > 12) break
    if (petSpotSafe(t, blocked) && findPath(PET_HOME, t, blocked)) return t
  }
  const any = candidates.find((t) => petSpotSafe(t, blocked))
  return any ?? (petSpotSafe(PET_HOME, blocked) ? PET_HOME : candidates[0] ?? PET_HOME)
}

/** 친숙해지면 저녁에 먼저 기록자 곁으로 오는 성향 — 거리가 가까운 성향은 일찍, 먼 성향은 오래 지난 뒤 */
export function comesToPlayer(c: Companion, day: number): boolean {
  const w = petWays(c), age = day - c.since
  const familiar = (c.found ?? []).filter((f) => f === 'play' || f === 'rest' || f === 'walk').length
  return age >= [2, 5, 9][w.distance] && familiar >= (w.distance === 2 ? 2 : 1)
}

export const PET_INTERACTION_GAP = 30
export function interactPet(c: Companion, action: 'play' | 'rest', day: number, minute: number): Companion | null {
  const now = day * 1440 + minute
  if (c.lastInteraction !== undefined && now - c.lastInteraction < PET_INTERACTION_GAP) return null
  const plays = (c.plays ?? 0) + (action === 'play' ? 1 : 0)
  const found = new Set<PetFound>([...(c.found ?? []), action])
  const moments = { ...c.moments, [action]: c.moments?.[action] ?? day }
  // 세 번 함께 놀면 어떤 장난감 곁에서 오래 머무는지 알게 된다 (선택지·보상 없음)
  if (plays >= 3 && !found.has('toy')) { found.add('toy'); moments.toy = day }
  return { ...c, ways: petWays(c), found: [...found], plays: Math.min(plays, 999),
    moments, lastInteraction: now,
    motion: { action: action === 'play' ? (c.kind === 'dog' && petWays(c).energy > 0 ? 'fetch' : 'play') : 'rest', left: 4 } }
}

/** 함께 걸어 본 곳으로 기억하는 마을 자리 (우물가·언덕·벤치 앞·정자·기름틀 곁·대장간 앞·집 앞 벤치) */
export const WALK_PLACES: readonly string[] = ['well', 'hill', 'bench', 'pavilion', 'press', 'anvil', 'homeBench']
export function walkPlaceAt(t: Tile): string | null {
  for (const id of WALK_PLACES) {
    const p = PLACES[id as keyof typeof PLACES]
    const c = p.stand ?? p.tiles[0]
    if (c && Math.abs(c.x - t.x) + Math.abs(c.y - t.y) <= 2) return id
  }
  return null
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
export function companionGoal(player: Tile, playerOutdoorsInRain: boolean, blockers?: ReadonlySet<string>): Tile | null {
  if (playerOutdoorsInRain) return EAVES
  for (const d of ADJ) {
    const t = { x: player.x + d.x, y: player.y + d.y }
    // 문·문깔개 위에는 서지 않는다 — 기록자가 드나드는 길을 막지 않도록. 가구가 있는 칸도 고르지 않는다 (2026-10-08 버그 23-B)
    if (isWalkable(t, blockers) && !WARPS.has(key(t))) return t
  }
  return null
}

export function stepCompanion(c: Companion, goal: Tile | null, dt: number, blockers?: ReadonlySet<string>): Companion {
  if (!goal) return c
  const here = { x: Math.round(c.x), y: Math.round(c.y) }
  const dest = c.path.at(-1)
  let path = c.path
  // 이미 새 목표 칸에 있으면 옛 길을 버린다 (2026-10-08 버그 23-D)
  if (sameTile(here, goal) && dest && !sameTile(dest, goal)) path = c.x !== here.x || c.y !== here.y ? [here] : []
  // 목표가 바뀌었을 때만 길을 다시 찾는다 — 이미 옆에 있으면 가만히
  else if (!sameTile(here, goal) && (!dest || !sameTile(dest, goal))) {
    const p = findPath(here, goal, blockers)
    path = p ? (c.x !== here.x || c.y !== here.y ? [here, ...p] : p) : []
  }
  const { actor } = stepActor({ ...c, path }, dt * (COMPANION_SPEED / 3.5))
  return { ...c, ...actor }
}

// 이웃의 하루: 시간표대로 걸어가고, 밤·궂은 날에는 집으로 들어가 보이지 않는다.
import { FESTIVAL_FROM, FESTIVAL_TO } from './calendar'
import { findPath, stepActor, type Actor } from './movement'
import { key, sameTile, WARPS } from './world'
import type { NeighborDef, Tile } from './types'

export interface Npc extends Actor {
  id: string
  visible: boolean
  goal: Tile | null
}

export const NPC_SPEED = 2.4
export const MAX_HEART = 10

/** 행사 날 저녁, 장터 모닥불 둘레 */
export const FESTIVAL_SPOTS: Record<string, Tile> = {
  baker: { x: 22, y: 16 },
  child: { x: 24, y: 15 },
  grandpa: { x: 26, y: 16 },
  smith: { x: 22, y: 18 },
  shepherd: { x: 26, y: 18 },
  presser: { x: 25, y: 19 },
  merchant: { x: 23, y: 19 },
  weaver: { x: 21, y: 17 },
  beekeeper: { x: 27, y: 17 },
  postman: { x: 20, y: 15 },
  apothecary: { x: 23, y: 14 },
  fisher: { x: 28, y: 15 },
  carpenter: { x: 20, y: 19 },
  // 연애 후보 열 (계획 6): 바깥 둘레
  wendell: { x: 19, y: 17 },
  cosmo: { x: 29, y: 17 },
  rudy: { x: 21, y: 20 },
  dexter: { x: 27, y: 20 },
  basil: { x: 25, y: 13 },
  marigold: { x: 22, y: 13 },
  penelope: { x: 29, y: 19 },
  tilly: { x: 19, y: 19 },
  juniper: { x: 28, y: 19 },
  poppy: { x: 26, y: 14 },
}
export const FIRE: Tile = { x: 24, y: 17 }

export interface GoalContext {
  minute: number
  wet: boolean
  market: boolean
  festival: boolean
  /** 이야기 때문에 잠시 다른 곳에 가는 이웃 (null = 집) */
  special?: Record<string, Tile | null>
  /** 아직 열리지 않은 칸 — 이웃도 들어가지 않는다 */
  locked?: ReadonlySet<string>
}

/** 지금 이 이웃이 있어야 할 곳. null이면 집 안(보이지 않음) */
export function goalFor(def: NeighborDef, ctx: GoalContext): Tile | null {
  if (ctx.special && def.id in ctx.special) return ctx.special[def.id]
  if (def.marketOnly && !ctx.market) return null
  if (ctx.minute >= 24 * 60) return null
  if (ctx.festival && ctx.minute >= FESTIVAL_FROM && ctx.minute < FESTIVAL_TO && FESTIVAL_SPOTS[def.id]) return FESTIVAL_SPOTS[def.id]
  let entry = null
  for (const e of def.schedule) if (e.from <= ctx.minute) entry = e
  if (!entry) return null
  const goal = ctx.wet ? (entry.tile ? (entry.wet ?? null) : null) : (entry.tile ?? null)
  if (!goal || !ctx.locked?.has(key(goal))) return goal
  // 가려던 곳이 아직 덤불로 막혀 있으면, 하루 중 열린 다른 자리에서 지낸다 (없으면 집에)
  return def.schedule.map((e) => e.tile).find((t): t is Tile => !!t && !ctx.locked!.has(key(t))) ?? null
}

/** 불러온 직후에는 걸어오지 않고 제자리에 있게 한다 */
export function placeNpc(def: NeighborDef, goal: Tile | null): Npc {
  const at = goal ?? def.door
  return { id: def.id, x: at.x, y: at.y, path: [], facing: 'down', walkTime: 0, visible: goal !== null, goal }
}

export function stepNpc(npc: Npc, def: NeighborDef, goal: Tile | null, dt: number, blockers: ReadonlySet<string> = new Set()): Npc {
  const here = { x: Math.round(npc.x), y: Math.round(npc.y) }
  // 걷는 동안 방을 꾸몄다면 기존 경로도 다시 확인한다.
  const blocked = npc.path.some((t) => blockers.has(key(t)))
  // 집으로 가야 한다
  if (goal === null) {
    if (!npc.visible) return npc
    if (sameTile(here, def.door) && npc.path.length === 0) return { ...npc, visible: false, goal: null }
    const across = crossing(npc, here, def.door, blockers)
    if (across) return walk({ ...across, goal: null }, dt)
    let n = npc
    if (npc.goal !== null || blocked || npc.path.length === 0) n = { ...npc, goal: null, path: pathOrEmpty(here, def.door, npc, blockers) }
    return walk(n, dt)
  }
  // 집에서 나온다
  if (!npc.visible) {
    return walk({ ...npc, x: def.door.x, y: def.door.y, visible: true, goal, path: route(def.door, goal, blockers) ?? [] }, dt)
  }
  // 다른 방으로 건너가려고 문(문깔개)에 닿았다 — 건너편으로 옮겨 가서 이어 걷는다
  const across = crossing(npc, here, goal, blockers)
  if (across) return walk(across, dt)
  if (npc.goal === null || !sameTile(npc.goal, goal) || blocked || (npc.path.length === 0 && !sameTile(here, goal)))
    return walk({ ...npc, goal, path: pathOrEmpty(here, goal, npc, blockers) }, dt)
  return walk(npc, dt)
}

/**
 * 걸어서 닿지 않는 곳(예: 내 집 안 — 지도 아래 따로 된 방)은 문을 건너서 간다.
 * 곧장 가는 길이 있으면 그 길, 없으면 건너편에서 목적지에 닿는 문까지의 길 (문에 닿으면 crossing이 옮긴다)
 */
export function route(from: Tile, to: Tile, blockers: ReadonlySet<string> = new Set()): Tile[] | null {
  const direct = findPath(from, to, blockers)
  if (direct) return direct
  for (const [k, dest] of WARPS) {
    const [x, y] = k.split(',').map(Number)
    const door = { x, y }
    if (findPath(dest, to, blockers) === null) continue
    const p = findPath(from, door, blockers)
    if (p) return p
  }
  return null
}

/** 문(문깔개)에 서서 길이 끝났는데 목적지가 건너편이면 건너편으로 옮기고 이어 갈 길을 준다 */
function crossing(npc: Npc, here: Tile, to: Tile, blockers: ReadonlySet<string>): Npc | null {
  if (npc.path.length || sameTile(here, to)) return null
  const dest = WARPS.get(key(here))
  if (!dest || findPath(here, to, blockers) !== null) return null
  return { ...npc, x: dest.x, y: dest.y, path: route(dest, to, blockers) ?? [] }
}

function pathOrEmpty(from: Tile, to: Tile, npc: Actor, blockers: ReadonlySet<string>): Tile[] {
  const p = route(from, to, blockers)
  if (!p) return []
  // 칸 사이에 있으면 먼저 가까운 칸으로
  return npc.x !== from.x || npc.y !== from.y ? [from, ...p] : p
}

function walk(npc: Npc, dt: number): Npc {
  const { actor } = stepActor(npc, dt * (NPC_SPEED / 3.5))
  return { ...npc, ...actor }
}

export function npcTile(n: Npc): Tile {
  return { x: Math.round(n.x), y: Math.round(n.y) }
}

export function isNear(a: Tile, b: Tile, d = 1): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= d
}

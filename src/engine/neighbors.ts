// 이웃의 하루: 시간표대로 걸어가고, 밤·궂은 날에는 집으로 들어가 보이지 않는다.
import { FESTIVAL_FROM, FESTIVAL_TO } from './calendar'
import { findPath, findWarpRoute, stepActor, type Actor } from './movement'
import { isWalkable, key, sameTile, WARPS } from './world'
import type { NeighborDef, Tile } from './types'
import { LODGING_SEATS, LODGING_WORK_SPOTS, lodgingNpcSpot } from './lodging'

export interface Npc extends Actor {
  id: string
  visible: boolean
  goal: Tile | null
}

export const NPC_SPEED = 1.7
export const MAX_HEART = 10

/** 행사 날 저녁, 장터 모닥불 둘레 */
export const FESTIVAL_SPOTS: Record<string, Tile> = {
  baker: { x: 22, y: 19 },
  child: { x: 24, y: 18 },
  grandpa: { x: 26, y: 19 },
  smith: { x: 22, y: 21 },
  shepherd: { x: 26, y: 21 },
  presser: { x: 25, y: 22 },
  merchant: { x: 23, y: 22 },
  weaver: { x: 21, y: 20 },
  beekeeper: { x: 27, y: 20 },
  postman: { x: 20, y: 18 },
  apothecary: { x: 23, y: 17 },
  fisher: { x: 28, y: 18 },
  carpenter: { x: 20, y: 22 },
  // 연애 후보 열 (계획 6): 바깥 둘레
  wendell: { x: 19, y: 20 },
  cosmo: { x: 29, y: 20 },
  rudy: { x: 21, y: 23 },
  dexter: { x: 27, y: 23 },
  basil: { x: 25, y: 16 },
  marigold: { x: 22, y: 16 },
  penelope: { x: 29, y: 22 },
  tilly: { x: 19, y: 22 },
  juniper: { x: 28, y: 22 },
  poppy: { x: 26, y: 17 },
}
export const FIRE: Tile = { x: 24, y: 20 }

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
  if (ctx.special && def.id in ctx.special) {
    const at = ctx.special[def.id]
    return at ? lodgingNpcSpot(def.id, at) : null
  }
  if (def.marketOnly && !ctx.market) return null
  if (ctx.minute >= 24 * 60) return null
  if (ctx.festival && ctx.minute >= FESTIVAL_FROM && ctx.minute < FESTIVAL_TO && FESTIVAL_SPOTS[def.id]) return FESTIVAL_SPOTS[def.id]
  let entry = null
  for (const e of def.schedule) if (e.from <= ctx.minute) entry = e
  if (!entry) return null
  if (LODGING_SEATS[def.id] && (ctx.wet || ctx.minute>=20*60 || ctx.minute<6*60)) return LODGING_SEATS[def.id]
  if (def.id==='smith' && entry.tile?.x===42 && entry.tile.y===22) return LODGING_WORK_SPOTS.smith
  if (def.id==='presser' && entry.tile && entry.tile.x>=44 && entry.tile.y<=24) return LODGING_WORK_SPOTS.presser
  const raw = ctx.wet ? (entry.tile ? (entry.wet ?? null) : null) : (entry.tile ?? null)
  const goal = raw ? lodgingNpcSpot(def.id, raw) : null
  if (!goal || !ctx.locked?.has(key(goal))) return goal
  // 가려던 곳이 아직 덤불로 막혀 있으면, 하루 중 열린 다른 자리에서 지낸다 (없으면 집에)
  return def.schedule.map((e) => e.tile).find((t): t is Tile => !!t && !ctx.locked!.has(key(t))) ?? null
}

/** 불러온 직후에는 걸어오지 않고 제자리에 있게 한다 */
export function placeNpc(def: NeighborDef, goal: Tile | null): Npc {
  const at = goal ?? def.door
  return { id: def.id, x: at.x, y: at.y, path: [], facing: 'down', walkTime: 0, visible: goal !== null, goal }
}

export function stepNpc(npc: Npc, def: NeighborDef, goal: Tile | null, dt: number, blockers: ReadonlySet<string> = new Set(), occupied?: Tile): Npc {
  const advance = (n: Npc) => walk(n, dt, occupied)
  const here = { x: Math.round(npc.x), y: Math.round(npc.y) }
  // 걷는 동안 방을 꾸몄다면 기존 경로도 다시 확인한다.
  const blocked = npc.path.some((t) => blockers.has(key(t)))
  // 집으로 가야 한다
  if (goal === null) {
    if (!npc.visible) return npc
    if (sameTile(here, def.door) && npc.path.length === 0) return { ...npc, visible: false, goal: null }
    const across = crossing(npc, here, def.door, blockers)
    if (across) return advance({ ...across, goal: null })
    let n = npc
    if (npc.goal !== null || blocked || npc.path.length === 0) n = { ...npc, goal: null, path: pathOrEmpty(here, def.door, npc, blockers) }
    return advance(n)
  }
  // 집에서 나온다
  if (!npc.visible) {
    return advance({ ...npc, x: def.door.x, y: def.door.y, visible: true, goal, path: route(def.door, goal, blockers) ?? [] })
  }
  // 다른 방으로 건너가려고 문(문깔개)에 닿았다 — 건너편으로 옮겨 가서 이어 걷는다
  const across = crossing(npc, here, goal, blockers)
  if (across) return advance(across)
  if (npc.goal === null || !sameTile(npc.goal, goal) || blocked || (npc.path.length === 0 && !sameTile(here, goal)))
    return advance({ ...npc, goal, path: pathOrEmpty(here, goal, npc, blockers) })
  return advance(npc)
}

/**
 * 걸어서 닿지 않는 곳(예: 내 집 안 — 지도 아래 따로 된 방)은 문을 건너서 간다.
 * 곧장 가는 길이 있으면 그 길, 없으면 건너편에서 목적지에 닿는 문까지의 길 (문에 닿으면 crossing이 옮긴다)
 */
export function route(from: Tile, to: Tile, blockers: ReadonlySet<string> = new Set()): Tile[] | null {
  // 사람이 잠시 목적지를 점유해도 모든 집의 문을 탐색하지 않는다.
  if (!sameTile(from, to) && !isWalkable(to, blockers)) return null
  const direct = findPath(from, to, blockers)
  if (direct) return direct
  return findWarpRoute(from, to, blockers)
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

function walk(npc: Npc, dt: number, occupied?: Tile): Npc {
  // 플레이어는 일시적인 점유다. 경로를 유지하고 점유된 칸 직전에서 기다린다.
  const stop = occupied ? npc.path.findIndex(t => sameTile(t, occupied)) : -1
  if (stop < 0) {
    const { actor } = stepActor(npc, dt * (NPC_SPEED / 3.5))
    return { ...npc, ...actor }
  }
  const approach = npc.path.slice(0, stop)
  const { actor } = stepActor({ ...npc, path: approach }, dt * (NPC_SPEED / 3.5))
  const consumed = approach.length - actor.path.length
  return { ...npc, ...actor, path: consumed ? npc.path.slice(consumed) : npc.path }
}

export function npcTile(n: Npc): Tile {
  return { x: Math.round(n.x), y: Math.round(n.y) }
}

export function isNear(a: Tile, b: Tile, d = 1): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= d
}

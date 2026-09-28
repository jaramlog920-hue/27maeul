// 이웃의 하루: 시간표대로 걸어가고, 밤·궂은 날에는 집으로 들어가 보이지 않는다.
import { FESTIVAL_FROM, FESTIVAL_TO } from './calendar'
import { findPath, stepActor, type Actor } from './movement'
import { key, sameTile } from './world'
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
  baker: { x: 14, y: 13 },
  child: { x: 15, y: 13 },
  grandpa: { x: 17, y: 13 },
  smith: { x: 14, y: 15 },
  shepherd: { x: 17, y: 15 },
  presser: { x: 16, y: 16 },
  merchant: { x: 15, y: 16 },
  weaver: { x: 13, y: 14 },
  beekeeper: { x: 18, y: 14 },
}
export const FIRE: Tile = { x: 15, y: 14 }

export interface GoalContext {
  minute: number
  wet: boolean
  market: boolean
  festival: boolean
  /** 이야기 때문에 잠시 다른 곳에 가는 이웃 (null = 집) */
  special?: Record<string, Tile | null>
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
  if (ctx.wet) return entry.tile ? (entry.wet ?? null) : null
  return entry.tile ?? null
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
    let n = npc
    if (npc.goal !== null || blocked || npc.path.length === 0) n = { ...npc, goal: null, path: pathOrEmpty(here, def.door, npc, blockers) }
    return walk(n, dt)
  }
  // 집에서 나온다
  if (!npc.visible) {
    return walk({ ...npc, x: def.door.x, y: def.door.y, visible: true, goal, path: findPath(def.door, goal, blockers) ?? [] }, dt)
  }
  if (npc.goal === null || !sameTile(npc.goal, goal) || blocked || (npc.path.length === 0 && !sameTile(here, goal)))
    return walk({ ...npc, goal, path: pathOrEmpty(here, goal, npc, blockers) }, dt)
  return walk(npc, dt)
}

function pathOrEmpty(from: Tile, to: Tile, npc: Actor, blockers: ReadonlySet<string>): Tile[] {
  const p = findPath(from, to, blockers)
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

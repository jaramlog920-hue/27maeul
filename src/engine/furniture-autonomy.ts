import { ADDITION_FURNITURE, isAddition } from './furniture-additions'
import { CHILD_FURNITURE } from './family-furniture'
import { MINUTES_PER_SECOND } from './clock'
import { SPOUSE_FURNITURE } from './furniture-defs'
import { childMode, childStage } from './child'
import { facingFor, findPath, stepActor, type Actor } from './movement'
import { NPC_SPEED } from './neighbors'
import { facingOf, footprint, keepClear, solidTiles, type Furniture } from './room'
import { isHome, key, roomAt, sameTile } from './world'
import type { Facing, Tile } from './types'
import type { GameState } from './game'

export type FurnitureUserAge = 'adult' | 'helper' | 'toddler'
export interface FurnitureUseSpec { kind: 'addition' | 'base' | 'open' | 'child'; action: string }
const SCENES = ['rock', 'sew', 'knead', 'washFace', 'harp', 'paint', 'washDishes', 'mill', 'waterPlant', 'tuckDoll', 'pushCart']
const BASE: Record<string, string> = {
  chair: 'sit', stool: 'sit', longBench: 'sit', cushion: 'sit', mat: 'sit', pillows: 'lie', daybed: 'lie',
  table: 'drink', teapot: 'drink', bookcase: 'read', lectern: 'read', homeShelf: 'read',
  homeWorkbench: 'craft', loom: 'craft', basket: 'craft', supplyChest: 'reach', cupboard: 'reach',
  nightstand: 'reach', jar: 'reach', barrel: 'reach', woodToy: 'pet', clothDoll: 'pet',
}

/** Only furniture with an actual use animation. Decorations, pet supplies and production/reward actions are excluded. */
export function furnitureUseSpec(item: string, age: FurnitureUserAge): FurnitureUseSpec | null {
  if ((CHILD_FURNITURE as readonly string[]).includes(item)) {
    if (age === 'adult' || (age === 'toddler' && item === 'childDrawingTable') || (age === 'helper' && item === 'toddlerRockingHorse')) return null
    return { kind: 'child', action: item }
  }
  if (item.startsWith('spouse:')) {
    const source = SPOUSE_FURNITURE[item]?.id ?? ''
    const action = /chair|bench|stool|seat/i.test(source) ? 'sit' : /bed|daybed/i.test(source) ? 'lie' : /book|shelf|desk/i.test(source) ? 'read' : /table|tea/i.test(source) ? 'drink' : null
    return action && (age !== 'toddler' || action === 'sit' || action === 'read') ? { kind: 'base', action } : null
  }
  let spec: FurnitureUseSpec | null = null
  if (isAddition(item)) {
    const use = ADDITION_FURNITURE[item].use
    spec = SCENES.includes(use) ? { kind: 'addition', action: use } : use === 'open' ? { kind: 'open', action: 'reach' }
      : ['sit', 'drink', 'read'].includes(use) ? { kind: 'base', action: use } : null
  } else if (BASE[item]) spec = { kind: 'base', action: BASE[item] }
  if (age === 'toddler' && spec && !['sit', 'pet', 'read'].includes(spec.action)) return null
  if (age === 'helper' && spec && ['sew', 'knead', 'mill', 'washDishes'].includes(spec.action)) return null
  return spec
}

export interface FurnitureActivity {
  furniture: Furniture
  spec: FurnitureUseSpec
  stand: Tile
  facing: Facing
  phase: 'approach' | 'use' | 'cooldown'
  actor: Actor
  left: number
  elapsed: number
  turn: number
}
export type FurnitureAutonomy = Record<string, FurnitureActivity>
export const FURNITURE_USE_SECONDS = 4.8
const at = (a: Tile): Tile => ({ x: Math.round(a.x), y: Math.round(a.y) })
const sameFurniture = (a: Furniture, b: Furniture) => a.item === b.item && sameTile(a, b) && facingOf(a) === facingOf(b) && !!a.on === !!b.on
const hash = (id: string) => [...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7)
const sameRoom = (a: Tile, b: Tile) => isHome(a) ? isHome(b) : !!roomAt(a) && roomAt(a) === roomAt(b)
export const isFurnitureActive = (a: FurnitureActivity | undefined) => !!a && a.phase !== 'cooldown'

export function furnitureUseStands(f: Furniture, spec: FurnitureUseSpec): Tile[] {
  const own = footprint(f)
  if (spec.kind === 'child' || ['cushion', 'mat', 'pillows'].includes(f.item)) return own
  const front = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[facingOf(f)]
  return [...own.map(p => ({ x: p.x + front[0], y: p.y + front[1] })),
    ...own.flatMap(p => [{ x: p.x, y: p.y + 1 }, { x: p.x - 1, y: p.y }, { x: p.x + 1, y: p.y }, { x: p.x, y: p.y - 1 }])]
    .filter(p => !own.some(o => sameTile(o, p)))
}

export interface FurnitureAutonomyContext {
  npcs: ReadonlySet<string>
  child: Tile | null
  roamingChild?: boolean
  room?: readonly Furniture[]
  inside?: (t: Tile) => boolean
  clear?: readonly Tile[]
}

/** Ephemeral visual life only: no inventory, rewards, affection or extra game time. */
export function stepFurnitureAutonomy(s: GameState, dt: number, ctx: FurnitureAutonomyContext): GameState {
  const room = ctx.room ?? s.room, before = s.furnitureAuto ?? {}, auto: FurnitureAutonomy = {}
  const blocked = solidTiles(room)
  const protectedStands = new Set((ctx.clear ?? keepClear()).map(key))
  const area = (a: Tile, b: Tile) => ctx.inside ? ctx.inside(a) && ctx.inside(b) : sameRoom(a, b)
  const reserved = new Set<string>()
  const actors: { id: string; actor: Actor; age: FurnitureUserAge; eligible: boolean }[] = []
  for (const [id, n] of Object.entries(s.npcs)) if (n.visible) actors.push({ id: `npc:${id}`, actor: n, age: id === 'child' ? 'helper' : 'adult', eligible: ctx.npcs.has(id) && !s.emotes?.some(e => e.npc === id && e.partner) })
  if (s.child && ctx.child && (childMode(s.child, s.clock.day) === 'home' || (ctx.roamingChild && childMode(s.child,s.clock.day)==='roam'))) {
    const stage = childStage(s.child, s.clock.day)
    if (stage !== 'baby') actors.push({ id: 'child', actor: before.child?.actor ?? { ...ctx.child, path: [], facing: 'down', walkTime: 0 }, age: stage === 'helper' ? 'helper' : stage === 'toddler' ? 'toddler' : 'adult', eligible: s.clock.minute >= 7 * 60 && s.clock.minute < 21 * 60 && !s.act })
  }
  const people = new Map(actors.map(a => [a.id, key(at(a.actor))]))
  people.set('player', key(at(s.player)))
  if (s.companion) people.set('pet', key(at(s.companion)))
  // Existing users reserve first, preventing a newly idle actor from taking an occupied piece.
  for (const [id, a] of Object.entries(before)) if (isFurnitureActive(a) && actors.some(p => p.id === id && p.eligible)) {
    footprint(a.furniture).forEach(p => reserved.add(key(p))); reserved.add(key(a.stand))
  }
  let npcs = s.npcs
  const busy = s.scenes.length > 0 || s.clock.minute < 6 * 60 || s.clock.minute >= 22 * 60
  for (const user of actors) {
    let a = before[user.id]
    const occupied = new Set([...people].filter(([id]) => id !== user.id).map(([, p]) => p))
    const own = a && isFurnitureActive(a) ? new Set([...footprint(a.furniture).map(key), key(a.stand)]) : new Set<string>()
    const otherClaims = [...reserved].filter(k => !own.has(k))
    const barriers = new Set([...blocked, ...occupied, ...otherClaims])
    barriers.delete(key(at(user.actor)))
    const free = user.eligible && !busy && area(at(user.actor), at(user.actor))
    const valid = a && !(s.act?.spot && sameTile(a.furniture, s.act.spot)) && room.some(f => sameFurniture(f, a.furniture)) && !!furnitureUseSpec(a.furniture.item, user.age) &&
      !footprint(a.furniture).some(p => occupied.has(key(p)) || otherClaims.includes(key(p))) && !barriers.has(key(a.stand)) && !protectedStands.has(key(a.stand))
    if (a?.phase === 'cooldown') {
      a = { ...a, actor: user.actor, left: a.left - dt }
      if (a.left > 0) { auto[user.id] = a; continue }
    } else if (a && (!free || !valid)) {
      a = { ...a, phase: 'cooldown', left: 12, actor: { ...user.actor, path: [] } }
      auto[user.id] = a
      if (user.id.startsWith('npc:')) { const id = user.id.slice(4); npcs = { ...npcs, [id]: { ...npcs[id], ...a.actor } } }
      continue
    }
    if (!a || a.phase === 'cooldown') {
      if (!free || user.actor.path.length) continue
      // Search at most once every three real seconds per idle actor, not on every animation frame.
      const offset = hash(user.id) % 3
      if (!a && Math.floor((s.clock.minute + offset) / 3) === Math.floor((s.clock.minute - dt * MINUTES_PER_SECOND + offset) / 3)) continue
      const choices: { furniture: Furniture; spec: FurnitureUseSpec; stand: Tile; path: Tile[] }[] = []
      for (const f of room) {
        const spec = furnitureUseSpec(f.item, user.age)
        if (!spec || f.on || (s.act?.spot && sameTile(f, s.act.spot)) || !area(at(user.actor), f) || Math.abs(f.x - user.actor.x) + Math.abs(f.y - user.actor.y) > 6 ||
          footprint(f).some(p => occupied.has(key(p)) || reserved.has(key(p)))) continue
        for (const stand of furnitureUseStands(f, spec)) {
          if (barriers.has(key(stand)) || protectedStands.has(key(stand)) || !area(stand, f)) continue
          const path = findPath(at(user.actor), stand, barriers)
          if (path && path.length <= 8 && path.every(p => area(p, f))) { choices.push({ furniture: { ...f }, spec, stand, path }); break }
        }
      }
      const turn = (a?.turn ?? 0) + 1, c = choices[(hash(user.id) + turn + Math.floor(s.clock.minute / 20)) % choices.length]
      if (!c) continue
      a = { furniture: c.furniture, spec: c.spec, stand: c.stand, facing: ['sit', 'lie'].includes(c.spec.action) ? facingOf(c.furniture) : facingFor(c.furniture.x - c.stand.x, c.furniture.y - c.stand.y, facingOf(c.furniture)), phase: 'approach', actor: { ...user.actor, path: c.path }, left: 15, elapsed: 0, turn }
      footprint(a.furniture).forEach(p => reserved.add(key(p))); reserved.add(key(a.stand))
    }
    if (a.phase === 'approach') {
      let path = a.actor.path
      if (path.some(p => barriers.has(key(p)))) path = findPath(at(a.actor), a.stand, barriers) ?? []
      const actor = stepActor({ ...a.actor, path }, dt * (user.id.startsWith('npc:') ? NPC_SPEED / 3.5 : 1)).actor
      a = { ...a, actor, left: a.left - dt }
      if (!actor.path.length && sameTile(at(actor), a.stand) && Math.abs(actor.x - a.stand.x) < 0.01 && Math.abs(actor.y - a.stand.y) < 0.01) a = { ...a, phase: 'use', left: FURNITURE_USE_SECONDS, elapsed: 0, actor: { ...actor, facing: a.facing } }
      else if (a.left <= 0 || !path.length) a = { ...a, phase: 'cooldown', left: 12, actor: { ...actor, path: [] } }
    } else if (a.phase === 'use') {
      a = { ...a, left: a.left - dt, elapsed: a.elapsed + dt }
      if (a.left <= 0) a = { ...a, phase: 'cooldown', left: 12 + hash(user.id) % 9 }
    }
    auto[user.id] = a; people.set(user.id, key(at(a.actor)))
    if (user.id.startsWith('npc:')) { const id = user.id.slice(4); npcs = { ...npcs, [id]: { ...npcs[id], ...a.actor } } }
  }
  return { ...s, npcs, furnitureAuto: auto }
}

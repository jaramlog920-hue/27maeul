import { onceKey } from './stories'
import { peopleData, setPeopleData } from './people'
import { legacyGame } from './growth-test-support'
import { CONTENT, PEOPLE } from '../content/catalog'
import { furnitureUseSpec, stepFurnitureAutonomy, isFurnitureActive, type FurnitureAutonomyContext } from './furniture-autonomy'
import { ADDITION_FURNITURE } from './furniture-additions'
import { newChild } from './child'
import { freshStats } from './stats'
import { childTile, startAct, syncHome, tick, type GameState } from './game'
import { deserialize, serialize } from './save'
import { key, sameTile } from './world'
import { footprint, type Furniture } from './room'
import { stepControlledIdle, greet, IDLE_RESET } from './autonomy'

function game(item: Furniture['item'] = 'rockingChair'): GameState {
  const s = legacyGame(CONTENT)
  const room = [...s.room.filter(f => !furnitureUseSpec(f.item, 'adult')), { item, x: 22, y: 113, facing: 'down' as const }]
  const out = { ...s, room, scenes: [], act: undefined, target: null, npcs: { baker: { id: 'baker', visible: true, goal: null, x: 20, y: 114, facing: 'down' as const, walkTime: 0, path: [] } }, clock: { day: 30, minute: 780 }, player: { ...s.player, x: 18, y: 114, path: [] }, idle: { seconds: 99, cooldown: 0, action: null } }
  syncHome(out)
  return out
}
const context = (s: GameState): FurnitureAutonomyContext => ({ npcs: new Set(Object.keys(s.npcs)), child: s.child ? childTile(s) : null })
function step(s: GameState, dt = 0.1): GameState {
  return stepFurnitureAutonomy({ ...s, clock: { ...s.clock, minute: s.clock.minute + dt } }, dt, context(s))
}
function until(s: GameState, predicate: (s: GameState) => boolean, n = 160) {
  for (let i = 0; i < n && !predicate(s); i++) s = step(s)
  expect(predicate(s)).toBe(true)
  return s
}
const using = (s: GameState) => s.furnitureAuto?.['npc:baker']?.phase === 'use'

it('registers dedicated motions, opening furniture and age-appropriate base uses', () => {
  for (const [id, f] of Object.entries(ADDITION_FURNITURE)) {
    // Family-dependent collectible use is explicitly tapped, never invented by an idle NPC.
    if (f.use === 'copyFurniture') expect(furnitureUseSpec(id, 'adult'), id).toBeNull()
    else if (f.use !== 'reach') expect(furnitureUseSpec(id, 'adult'), id).not.toBeNull()
  }
  expect(furnitureUseSpec('homeWorkbench', 'adult')).toEqual({ kind: 'base', action: 'craft' })
  for (const id of ['wallMoonMobile', 'petBowlStation']) expect(furnitureUseSpec(id, 'adult')).toBeNull()
  expect(furnitureUseSpec('sewingTable', 'toddler')).toBeNull()
  expect(furnitureUseSpec('sewingTable', 'helper')).toBeNull()
  expect(furnitureUseSpec('toddlerRockingHorse', 'adult')).toBeNull()
})

it('never creates player autonomy or moves the player, even after a long idle', () => {
  let s = game()
  const player = s.player
  for (let i = 0; i < 500; i++) s = step(s)
  expect(s.furnitureAuto?.player).toBeUndefined()
  expect(s.player).toBe(player)
  expect(s.player.path).toEqual([])
  let idle = IDLE_RESET
  for (let i = 0; i < 1000; i++) idle = stepControlledIdle(idle, 0.1)
  expect(idle.action).toBeNull()
  expect(stepControlledIdle(greet(), 0.1).action?.kind).toBe('greet')
})

it('NPCs walk to a reachable stand, start motion only on arrival and rest between uses', () => {
  let s = until(game(), s => s.furnitureAuto?.['npc:baker']?.phase === 'approach')
  expect(s.npcs.baker.path.length).toBeGreaterThan(0)
  expect(s.furnitureAuto!['npc:baker'].spec.action).toBe('rock')
  const prev = s.npcs.baker
  s = step(s)
  expect(Math.abs(s.npcs.baker.x - prev.x) + Math.abs(s.npcs.baker.y - prev.y)).toBeLessThanOrEqual(0.171)
  s = until(s, using)
  expect(s.npcs.baker.path).toEqual([])
  expect(sameTile(s.npcs.baker, s.furnitureAuto!['npc:baker'].stand)).toBe(true)
  s = until(s, s => s.furnitureAuto?.['npc:baker']?.phase === 'cooldown')
  expect(s.furnitureAuto!['npc:baker'].left).toBeGreaterThan(10)
})

it('home children approach age-appropriate pieces; following and newborn children do not', () => {
  let s = game('childBlockMat')
  s = { ...s, npcs: {}, child: { ...newChild(10, freshStats(), undefined), mode: 'home' } }
  s = until(s, s => s.furnitureAuto?.child?.phase === 'approach')
  s = until(s, s => s.furnitureAuto?.child?.phase === 'use')
  expect(childTile(s)).toEqual({ x: 22, y: 113 })
  expect(step({ ...s, child: { ...s.child!, mode: 'follow' } }).furnitureAuto?.child).toBeUndefined()
  expect(step({ ...s, child: { ...s.child!, born: s.clock.day } }).furnitureAuto?.child).toBeUndefined()
})

it('reserves whole furniture footprints and stands so NPCs cannot use the same piece together', () => {
  let s = game('windowBench')
  s = { ...s, npcs: { ...s.npcs, carpenter: { ...s.npcs.baker, id: 'carpenter', x: 21, y: 115 } } }
  for (let i = 0; i < 100; i++) {
    s = step(s)
    const active = Object.values(s.furnitureAuto ?? {}).filter(isFurnitureActive)
    expect(active.length).toBeLessThanOrEqual(1)
    const claims = active.flatMap(a => [...footprint(a.furniture).map(key), key(a.stand)])
    expect(new Set(claims).size).toBe(claims.length)
  }
})

it('occupied, removed and rotated furniture cannot start or keep use motion', () => {
  let blocked = game()
  blocked = { ...blocked, player: { ...blocked.player, x: 22, y: 113 } }
  for (let i = 0; i < 40; i++) blocked = step(blocked)
  expect(blocked.furnitureAuto?.['npc:baker']).toBeUndefined()
  const s = until(game(), using)
  const gone = step({ ...s, room: s.room.filter(f => f.item !== 'rockingChair') })
  expect(gone.furnitureAuto?.['npc:baker']?.phase).toBe('cooldown')
  expect(gone.npcs.baker.path).toHaveLength(0)
  const turned = step({ ...s, room: s.room.map(f => f.item === 'rockingChair' ? { ...f, facing: 'right' } : f) })
  expect(turned.furnitureAuto?.['npc:baker']?.phase).toBe('cooldown')
})

it('manual player use, scenes and revoking free time take priority over NPC use', () => {
  const s = until(game('wardrobe'), using)
  const manual = step({ ...s, act: { kind: 'reach', left: 2, total: 2, facing: 'down', spot: { item: 'wardrobe', x: 22, y: 113, facing: 'down' } } })
  expect(manual.furnitureAuto?.['npc:baker']?.phase).toBe('cooldown')
  expect(step({ ...s, scenes: ['test'] as never }).furnitureAuto?.['npc:baker']?.phase).toBe('cooldown')
  expect(stepFurnitureAutonomy(s, 0.1, { npcs: new Set(), child: null }).furnitureAuto?.['npc:baker']?.phase).toBe('cooldown')
  expect(startAct(s, 'read').furnitureAuto).toBe(s.furnitureAuto)
})

it('does not add resources, affection or extra game time, and never saves animation state', () => {
  const s = until(game('sewingTable'), using)
  const before = JSON.stringify([s.inv, s.coins, s.hearts, s.needs, s.clock, s.child, s.flags])
  const next = stepFurnitureAutonomy(s, 0.2, context(s))
  expect(JSON.stringify([next.inv, next.coins, next.hearts, next.needs, next.clock, next.child, next.flags])).toBe(before)
  const raw = JSON.parse(serialize(s))
  expect(raw.furnitureAuto).toBeUndefined()
  raw.furnitureAuto = s.furnitureAuto
  expect(deserialize(JSON.stringify(raw), CONTENT)!.furnitureAuto).toBeUndefined()
})

it('the real game tick leaves a long-idle player still and creates no autonomous idle actions', () => {
  let s = { ...game('smallHarp'), npcs: {} }
  const at = { x: s.player.x, y: s.player.y, facing: s.player.facing }
  for (let i = 0; i < 200; i++) s = tick(s, 0.1, () => 0.5, CONTENT).state
  expect(s.player).toMatchObject(at)
  expect(s.player.path).toEqual([])
  expect(s.idle.action).toBeNull()
  expect(s.furnitureAuto?.player).toBeUndefined()
})

it('the real game tick lets a resting spouse use placed furniture while the player remains still', () => {
  const saved = peopleData()
  try {
    let s = game('smallHarp')
    setPeopleData({ ...PEOPLE, people: {} })
    s = { ...s, flags: { ...s.flags, [onceKey('spouseReturn', 3)]: 1 }, clock: { day: 3, minute: 20 * 60 }, romance: { ...s.romance, partner: 'poppy', stage: 'married', marriedDay: 1 }, npcs: { poppy: { ...s.npcs.baker, id: 'poppy' } } }
    const player = { x: s.player.x, y: s.player.y }
    for (let i = 0; i < 200 && s.furnitureAuto?.['npc:poppy']?.phase !== 'use'; i++) s = tick(s, 0.1, () => 0.5, CONTENT).state
    expect(s.furnitureAuto?.['npc:poppy']?.phase).toBe('use')
    expect(s.furnitureAuto?.['npc:poppy']?.spec.action).toBe('harp')
    expect(s.player).toMatchObject(player)
    expect(s.furnitureAuto?.player).toBeUndefined()
  } finally { setPeopleData(saved) }
})


it.each(['down', 'up', 'left', 'right'] as const)('자율 앉기와 직접 앉기는 의자의 %s 방향을 따른다', facing => {
  let s = game('chair')
  s = { ...s, room: s.room.map(f => f.item === 'chair' ? { ...f, facing } : f) }
  const chair = s.room.find(f => f.item === 'chair')!
  expect(startAct(s, 'sit', chair).act?.facing).toBe(facing)
  s = until(s, using)
  expect(s.furnitureAuto!['npc:baker'].facing).toBe(facing)
  expect(s.npcs.baker.facing).toBe(facing)
})


it.each(['read', 'drink', 'craft'] as const)('의자에 앉아 %s할 때도 의자 방향을 보존한다', kind => {
  const s = game('chair')
  const chair = { ...s.room.find(f => f.item === 'chair')!, facing: 'left' as const }
  const room = s.room.map(f => f.item === 'chair' ? chair : f)
  expect(startAct({ ...s, room }, kind, chair).act?.facing).toBe('left')
})

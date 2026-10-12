import { expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame, playerTile, syncHome, tick, walkDirection, type GameState } from './game'
import { advanceBuilds, buildsOf, doorOf, orderBuild } from './newland-build'
import { ROOM_SLOTS, NEWLAND_PORTAL_FRONT } from './newland-config'
import { deserialize, serialize } from './save'
import type { Facing } from './types'

function homes(facing: Facing) {
  const base = newGame(CONTENT)
  let s: GameState = { ...base, map: 'newland', scenes: [], coins: 10000, inv: { olive: 9, papyrus: 9 },
    clock: { day: 10, minute: 600 }, flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1 },
    player: { ...base.player, ...NEWLAND_PORTAL_FRONT, path: [] } }
  s = orderBuild(s, 'home', 8, 11, facing)!
  expect(s).not.toBeNull()
  s = orderBuild(s, 'home', 20, 11, facing)!
  expect(s).not.toBeNull()
  s = advanceBuilds({ ...s, clock: { ...s.clock, day: 12 } })
  return s
}

function step(s: GameState, dx: number, dy: number) {
  s = walkDirection(s, dx, dy)
  for (let i=0; i<20 && s.player.path.length; i++) s = tick(s, 0.1, () => 0, CONTENT).state
  return s
}

it.each(['down', 'left', 'right'] as const)('enters and exits both home slots through %s-facing doors after reload', facing => {
  const original = homes(facing)
  for (const b of buildsOf(original)) {
    const d = doorOf(b.kind, b.x, b.y, b.facing)!
    let s: GameState = { ...original, player: { ...original.player, ...d.front, path: [] } }
    syncHome(s)
    s = step(s, d.door.x-d.front.x, d.door.y-d.front.y)
    expect(playerTile(s)).toEqual(ROOM_SLOTS[b.slot!].entry)
    s = deserialize(serialize(s), CONTENT)!
    expect(playerTile(s)).toEqual(ROOM_SLOTS[b.slot!].entry)
    syncHome(s)
    const slot = ROOM_SLOTS[b.slot!]
    s = step(s, slot.exit.x-slot.entry.x, slot.exit.y-slot.entry.y)
    expect(playerTile(s)).toEqual(d.front)
  }
})

it('blocks entering an occupied house at night but always allows leaving it', () => {
  const original = homes('down')
  const b = buildsOf(original)[0], d = doorOf(b.kind,b.x,b.y,b.facing)!, slot = ROOM_SLOTS[b.slot!]
  const s = { ...original, flags: { ...original.flags, 'settled:nelly': Number(b.id.slice(1)) },
    clock: { day: 12, minute: 22*60 }, player: { ...original.player, ...d.front, path: [] } }
  syncHome(s)
  expect(step(s,0,-1).player.path).toEqual([])
  expect(playerTile(step(s,0,-1))).toEqual(d.front)
  const inside = { ...s, player: { ...s.player, ...slot.entry, path: [] } }
  syncHome(inside)
  expect(playerTile(step(inside,0,1))).toEqual(d.front)
})

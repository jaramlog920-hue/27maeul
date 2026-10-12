import { CONTENT } from '../content/catalog'
import { enterDoor, newGame, syncHome, tapTile, tick } from './game'
import { nightDoorLocked } from './night-doors'
import { ROOMS } from './world'
import { mulberry32 } from './offers'

it('locks after the resident comes home at night, opens in the morning, and permits leaving', () => {
  const room = ROOMS.find(r => r.owner === 'baker')!
  const base = newGame(CONTENT)
  const s = { ...base, clock: { day: 1, minute: 22 * 60 }, npcs: { ...base.npcs, baker: { ...base.npcs.baker, visible: false } } }
  syncHome(s)
  expect(nightDoorLocked(s, room.door, CONTENT)).toBe(true)
  expect(enterDoor(s, room.door)).toBe(s)
  expect(tapTile(s, room.door)).toBe(s)
  expect(nightDoorLocked({ ...s, clock: { day: 1, minute: 600 } }, room.door, CONTENT)).toBe(false)
  expect(nightDoorLocked({ ...s, npcs: { ...s.npcs, baker: { ...s.npcs.baker, visible: true, x: 24, y: 18 } } }, room.door, CONTENT)).toBe(false)
  const inside = { ...s, player: { ...s.player, x: room.exit.x, y: room.exit.y - 1, path: [room.exit] } }
  const out = tick(inside, 1, mulberry32(1), CONTENT)
  expect(out.state.player.y).toBeLessThan(room.y0)
})

it('stops a route that was planned before the door locked', () => {
  const room = ROOMS.find(r => r.owner === 'baker')!
  const base = newGame(CONTENT)
  const front = { x: room.door.x, y: room.door.y + 1 }
  const s = { ...base, clock: { day: 1, minute: 22 * 60 }, npcs: { ...base.npcs, baker: { ...base.npcs.baker, visible: false } }, player: { ...base.player, ...front, path: [room.door] } }
  syncHome(s)
  const next = tick(s, 1, mulberry32(1), CONTENT)
  expect(next.state.player.x).toBe(front.x)
  expect(next.state.player.y).toBe(front.y)
  expect(next.events.some(e => e.type === 'lockedHouse')).toBe(true)
})

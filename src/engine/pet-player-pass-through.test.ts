import { CONTENT } from '../content/catalog'
import { adopt } from './companion'
import { legacyGame } from './growth-test-support'
import { tick, walkDirection, syncHome } from './game'
import { petStayGoal } from './pet-life'
import { HOME_ENTRY, isWalkable } from './world'
import { solidTiles } from './room'

function resting(kind: 'cat' | 'dog') {
  const fresh = legacyGame(CONTENT)
  const base = { ...fresh, room: [], scenes: [], npcs: {}, clock: { day: 30, minute: 13 * 60 }, player: { ...fresh.player, ...HOME_ENTRY, path: [] }, target: null }
  syncHome(base)
  const pet = { ...adopt(kind, '나비', 1, HOME_ENTRY), stay: true }
  const goal = petStayGoal(base, pet, solidTiles(base.room), HOME_ENTRY)
  return { ...base, companion: { ...pet, ...goal, path: [] } }
}

it.each(['cat', 'dog'] as const)('%s와 같은 칸에 서도 반려동물을 밀거나 순간이동시키지 않는다', kind => {
  let s = resting(kind)
  const pet = s.companion!
  s = { ...s, player: { ...s.player, x: pet.x, y: pet.y, path: [] } }
  for (let i = 0; i < 10; i++) {
    s = tick(s, 0.1, () => 0.5, CONTENT).state as typeof s
    expect(s.companion).toMatchObject({ x: pet.x, y: pet.y, path: [] })
  }
})

it.each(['cat', 'dog'] as const)('유저가 %s가 있는 칸으로 걸어 들어가고 나올 수 있다', kind => {
  let s = resting(kind)
  const pet = s.companion!
  const from = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }].find(d => isWalkable({ x: pet.x - d.dx, y: pet.y - d.dy }) && isWalkable({ x: pet.x + d.dx, y: pet.y + d.dy }))!
  expect(from).toBeDefined()
  s = { ...s, player: { ...s.player, x: pet.x - from.dx, y: pet.y - from.dy, path: [] } }
  s = walkDirection(s, from.dx, from.dy) as typeof s
  expect(s.player.path).toContainEqual({ x: pet.x, y: pet.y })
  for (let i = 0; i < 5; i++) s = tick(s, 0.1, () => 0.5, CONTENT).state as typeof s
  expect(s.player.x).toBe(pet.x)
  expect(s.player.y).toBe(pet.y)
  expect(s.companion).toMatchObject({ x: pet.x, y: pet.y })
  s = walkDirection(s, from.dx, from.dy) as typeof s
  for (let i = 0; i < 5; i++) s = tick(s, 0.1, () => 0.5, CONTENT).state as typeof s
  expect(s.player.x).toBe(pet.x + from.dx)
  expect(s.player.y).toBe(pet.y + from.dy)
  expect(s.companion).toMatchObject({ x: pet.x, y: pet.y })
})

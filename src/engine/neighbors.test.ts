import { CONTENT } from '../content/catalog'
import { newGame, tick, type GameState } from './game'
import { findPath } from './movement'
import { npcTile, placeNpc } from './neighbors'
import { placement, solidTiles } from './room'
import { LESSON_FROM, LESSON_SPOT } from './stories'
import { key } from './world'

const child = CONTENT.neighbors.find((n) => n.id === 'child')!

function lesson() {
  const s = newGame(CONTENT)
  s.clock.minute = LESSON_FROM
  s.flags.childAsked = 1
  s.npcs.child = placeNpc(child, null)
  return s
}

function chairOnRoute() {
  const route = findPath(child.door, LESSON_SPOT)!
  const chair = route.map((t) => placement([], 'stool', t)).find((f) => f !== null)
  expect(chair).toBeTruthy()
  return chair!
}

function walkSafely(s: GameState) {
  const blockers = solidTiles(s.room)
  for (let i = 0; i < 800; i++) {
    s = tick(s, 0.05, () => 0, CONTENT).state
    expect(blockers.has(key(npcTile(s.npcs.child)))).toBe(false)
    expect(s.npcs.child.path.some((t) => blockers.has(key(t)))).toBe(false)
  }
  return s
}

it('아이는 가구를 피해 수업 자리에 오고 수업 후 집으로 돌아간다', () => {
  let s = lesson()
  s.room = [chairOnRoute()]
  s = walkSafely(s)
  expect(npcTile(s.npcs.child)).toEqual(LESSON_SPOT)
  s.clock.minute = 21 * 60
  s = walkSafely(s)
  expect(npcTile(s.npcs.child)).toEqual(child.door)
  expect(s.npcs.child.visible).toBe(false)
})

it('아이가 출발한 뒤 길에 가구를 놓아도 돌아서 도착한다', () => {
  let s = tick(lesson(), 0.05, () => 0, CONTENT).state
  const chair = chairOnRoute()
  expect(s.npcs.child.path).toContainEqual({ x: chair.x, y: chair.y })
  s.room = [chair]
  s = walkSafely(s)
  expect(npcTile(s.npcs.child)).toEqual(LESSON_SPOT)
})

it('움직인 이웃을 다시 따라가는 기록자도 가구를 피한다', () => {
  const s = lesson()
  s.room = [chairOnRoute()]
  s.player = { ...s.player, ...child.door, path: [] }
  s.npcs = { child: placeNpc(child, LESSON_SPOT) }
  s.target = { kind: 'neighbor', id: 'child', tries: 0 }
  const next = tick(s, 0, () => 0, CONTENT).state
  expect(next.player.path.length).toBeGreaterThan(0)
  expect(next.player.path.some((t) => solidTiles(s.room).has(key(t)))).toBe(false)
})

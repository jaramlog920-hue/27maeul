import { CONTENT } from '../content/catalog'
import { goToSleep, neighborsPresent, newGame, settle, tick, type GameState } from './game'
import type { Grade } from './library'
import { findPath } from './movement'
import { npcTile, placeNpc } from './neighbors'
import { placement, solidTiles } from './room'
import { LESSON_FROM, LESSON_SPOT } from './stories'
import type { Book } from './types'
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

describe('서고 권수로 이사 오는 이웃', () => {
  const nextMorning = (shelved: Partial<Record<Book, Grade>>): GameState => settle(goToSleep({ ...newGame(CONTENT), shelved }, CONTENT), CONTENT)
  it('편지 나르는 이웃은 처음부터, 주막 주인은 1권, 어부는 2권, 목수는 3권부터 마을에 보인다', () => {
    const none = nextMorning({})
    expect(Object.keys(none.npcs)).toContain('postman')
    expect(neighborsPresent(none, CONTENT)).not.toContain('innkeeper')
    expect(neighborsPresent(nextMorning({ mk: 1 }), CONTENT)).toContain('innkeeper')
    expect(neighborsPresent(nextMorning({ mk: 1 }), CONTENT)).not.toContain('fisher')
    expect(neighborsPresent(nextMorning({ mk: 1, lk: 0 }), CONTENT)).toContain('fisher')
    expect(neighborsPresent(nextMorning({ mk: 1, lk: 0 }), CONTENT)).not.toContain('carpenter')
  })
  it('이사 온 날 아침에 소개 장면', () => {
    const s = { ...newGame(CONTENT), shelved: { mk: 1 as const } }
    expect(goToSleep(s, CONTENT).scenes).toContain('movedIn:innkeeper')
    const again = goToSleep(goToSleep(s, CONTENT), CONTENT)
    expect(again.scenes.filter((x) => x === 'movedIn:innkeeper')).toHaveLength(1)
  })
  it('낮에 책을 꽂아도 그날은 아직 보이지 않고, 소개 장면이 나온 아침부터 보인다', () => {
    // 책을 아직 꽂지 않은 채로 하루를 시작 — 서고 권수는 나중에 낮 동안 올라간다
    const before = newGame(CONTENT)
    expect(neighborsPresent(before, CONTENT)).not.toContain('innkeeper')
    // 낮 동안 책을 꽂아 서고 권수가 올라가도, 잠들기 전까지는 아직 나타나지 않는다
    const midDay = { ...before, shelved: { mk: 1 as const } }
    expect(neighborsPresent(midDay, CONTENT)).not.toContain('innkeeper')
    // 잠들며 소개 장면이 걸린 다음 날 아침부터 보인다
    const next = settle(goToSleep(midDay, CONTENT), CONTENT)
    expect(next.scenes).toContain('movedIn:innkeeper')
    expect(neighborsPresent(next, CONTENT)).toContain('innkeeper')
  })
})

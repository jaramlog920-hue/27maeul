// 집 안 벽 세우기·허물기, 벽걸이 (2026-10-12 사용자)
import { legacyGame as newGame } from './growth-test-support'
import { CONTENT, PEOPLE } from '../content/catalog'
import { buildWall, canBuildWall, canRemoveWall, isInnerWall, placeFurniture, removeWall, settle, syncHome, type GameState } from './game'
import { setPeopleData } from './people'
import { BABY_DOOR, BABY_ROOM, LIVING_DOOR, WORKSHOP } from './home-layout'
import { isHome, tileAt } from './world'
import { WALL_BUILD_COINS } from './home-walls'
import { deserialize, serialize } from './save'

beforeEach(() => setPeopleData(PEOPLE))

function house(level: 0 | 1 | 2 | 3 = 3): GameState {
  const s = settle(newGame(CONTENT, { look: 'f', name: '하늘' } as never), CONTENT)
  const g: GameState = { ...s, homeLevel: level, coins: 100, flags: { ...s.flags, growthLegacy: 1 } }
  syncHome(g)
  return g
}
// 작업실과 아이방 사이 벽(x=24)에서 문이 아닌 칸
const inner = { x: BABY_ROOM.x0, y: BABY_DOOR.y + 1 }

describe('집 안 벽', () => {
  it('방 사이 벽만 허물 수 있다 — 바깥벽은 안 된다', () => {
    const s = house()
    expect(isInnerWall(inner)).toBe(true)
    expect(isInnerWall({ x: WORKSHOP.x0 + 3, y: WORKSHOP.y1 })).toBe(false) // 아래 바깥벽
    expect(canRemoveWall(s, { x: BABY_ROOM.x1, y: BABY_DOOR.y })).toBe('notInner')
    const opened = removeWall(s, inner)!
    expect(tileAt(inner.x, inner.y)).toBe('f')
    expect(isHome(inner)).toBe(true)
    expect(opened.homeWalls?.removed).toEqual([`${inner.x},${inner.y}`])
  })
  it('넓히기 전에는 벽을 건드리지 않는다', () => {
    const s = house(0)
    expect(canBuildWall(s, { x: WORKSHOP.x0 + 3, y: WORKSHOP.y0 + 2 })).toBe('locked')
  })
  it('빈 바닥에 벽을 세우면 닢이 들고, 다시 허물 수 있다', () => {
    const s = house()
    const t = { x: BABY_ROOM.x0 + 3, y: BABY_ROOM.y0 + 1 }
    expect(canBuildWall(s, t)).toBeNull()
    const b = buildWall(s, t)!
    expect(tileAt(t.x, t.y)).toBe('#')
    expect(b.coins).toBe(100 - WALL_BUILD_COINS)
    const r = removeWall(b, t)!
    expect(tileAt(t.x, t.y)).toBe('f')
    expect(r.homeWalls?.built).toEqual([])
  })
  it('갈 수 있던 곳이 막히는 벽은 세우지 않는다', () => {
    const s = house()
    // 생활방 문 바로 안쪽 칸을 막아도 문 앞 비워 둘 칸이라 안 되고, 문을 가로막는 줄을 세우면 마지막 칸에서 막힌다
    expect(canBuildWall(s, { x: LIVING_DOOR.x - 1, y: LIVING_DOOR.y })).toBe('occupied')
    let g = s
    const col = BABY_ROOM.x0 + 2
    let last: string | null = null
    for (let y = BABY_ROOM.y0 + 1; y < BABY_ROOM.y1; y++) {
      const why = canBuildWall(g, { x: col, y })
      if (why) { last = why; break }
      g = buildWall(g, { x: col, y })!
    }
    expect(last).toBe('cutsOff')
  })
  it('닢이 모자라면 세우지 않는다', () => {
    const s = { ...house(), coins: WALL_BUILD_COINS - 1 }
    expect(canBuildWall(s, { x: BABY_ROOM.x0 + 3, y: BABY_ROOM.y0 + 1 })).toBe('coins')
  })
  it('세우고 허문 벽은 저장된다', () => {
    const s = removeWall(buildWall(house(), { x: BABY_ROOM.x0 + 3, y: BABY_ROOM.y0 + 1 })!, inner)!
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.homeWalls).toEqual(s.homeWalls)
    syncHome(back)
    expect(tileAt(inner.x, inner.y)).toBe('f')
    expect(tileAt(BABY_ROOM.x0 + 3, BABY_ROOM.y0 + 1)).toBe('#')
  })
})

describe('벽걸이', () => {
  it('바닥 바로 위 벽에만 걸리고, 걸린 벽은 허물기 전에 내린다', () => {
    const s = { ...house(), inv: { ...house().inv, spiceShelf: 1 } }
    // 아이방 위쪽 벽 (아래가 바닥)
    const wall = { x: BABY_ROOM.x0 + 2, y: BABY_ROOM.y0 }
    expect(placeFurniture(s, 'spiceShelf', { x: BABY_ROOM.x0 + 2, y: BABY_ROOM.y0 + 1 })).toBeNull() // 바닥에는 안 걸린다
    const hung = placeFurniture(s, 'spiceShelf', wall)!
    expect(hung.room.some((f) => f.item === 'spiceShelf' && f.x === wall.x && f.y === wall.y)).toBe(true)
    // 세운 벽에도 건다
    const t = { x: BABY_ROOM.x0 + 4, y: BABY_ROOM.y0 + 3 }
    const b = buildWall({ ...hung, inv: { ...hung.inv, potHanger: 1 } }, t)!
    const t2 = { x: t.x + 1, y: t.y }
    const b2 = buildWall(b, t2)!
    const hung2 = placeFurniture(b2, 'potHanger', t)!
    expect(hung2.room.some((f) => f.item === 'potHanger')).toBe(true)
    expect(canRemoveWall(hung2, t)).toBe('hung')
  })
})

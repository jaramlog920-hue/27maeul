import { MAP, WIDTH, HEIGHT, PLACES, START, isWalkable, placeAt, cameraFor, VIEW_W, VIEW_H, VILLAGE_H, isHome, tileAt, ROOMS, WARPS, roomAt, key, ROOM_W, ROOM_H, LOCKED_DOORS } from './world'
import { findPath, pathToward, stepActor, type Actor } from './movement'

const adjacent = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1

describe('world', () => {
  it('지도 크기가 맞고 테두리는 막혀 있다', () => {
    expect(MAP).toHaveLength(HEIGHT)
    for (const row of MAP) expect(row).toHaveLength(WIDTH)
    for (let x = 0; x < WIDTH; x++) {
      expect(isWalkable({ x, y: 0 })).toBe(false)
      expect(isWalkable({ x, y: HEIGHT - 1 })).toBe(false)
    }
  })
  it('서는 칸은 걸을 수 있고 물건 칸 옆이다', () => {
    expect(isWalkable(START)).toBe(true)
    for (const [id, p] of Object.entries(PLACES)) {
      expect(p.tiles.length, id).toBeGreaterThan(0)
      if (p.stand) {
        expect(isWalkable(p.stand), id).toBe(true)
        expect(p.tiles.some((t) => adjacent(t, p.stand!)), id).toBe(true)
      }
    }
  })
  it('모든 장소는 시작 칸에서 닿을 수 있다', () => {
    for (const [id, p] of Object.entries(PLACES)) {
      const t = p.tiles[0]
      // 방 안의 장소는 그 방에 들어온 자리에서 걷는다
      const from = roomAt(t)?.entry ?? START
      const path = p.stand ? findPath(from, p.stand) : pathToward(from, t)
      expect(path, id).not.toBeNull()
    }
  })
  it('placeAt·집 안', () => {
    expect(placeAt({ x: 3, y: 5 })).toBe('desk')
    expect(placeAt({ x: 6, y: 33 })).toBe('reeds')
    expect(placeAt({ x: 15, y: 27 })).toBe('field')
    expect(placeAt({ x: 36, y: 50 })).toBe('library')
    expect(placeAt({ x: 7, y: 8 })).toBe('basket')
    expect(placeAt({ x: 5, y: 5 })).toBeNull()
    expect(isHome({ x: 5, y: 5 })).toBe(true)
    expect(isHome({ x: 5, y: 12 })).toBe(false)
    expect(tileAt(-1, 3)).toBe('T')
  })
  it('카메라는 지도 밖을 보여 주지 않는다', () => {
    expect(cameraFor(0, 0)).toEqual({ x: 0, y: 0 })
    expect(cameraFor(WIDTH - 1, VILLAGE_H - 1)).toEqual({ x: WIDTH - VIEW_W, y: VILLAGE_H - VIEW_H })
    const c = cameraFor(15, 14)
    expect(c.x).toBeCloseTo(15.5 - VIEW_W / 2)
  })
  it('텃밭은 집 앞 여덟 칸', () => {
    expect(PLACES.garden.tiles).toHaveLength(8)
  })
})

describe('이웃집 안', () => {
  it('집마다 방이 있고, 문 ↔ 방 안이 서로 이어진다', () => {
    expect(ROOMS.map((r) => r.owner)).toEqual(['baker', 'child', 'grandpa', 'weaver', 'beekeeper', 'library'])
    for (const r of ROOMS) {
      expect(tileAt(r.door.x, r.door.y), r.owner).toBe(r.owner === 'library' ? 'L' : 'D')
      const inside = WARPS.get(key(r.door))!
      expect(roomAt(inside)?.owner).toBe(r.owner)
      expect(isWalkable(inside)).toBe(true)
      const out = WARPS.get(key(r.exit))!
      expect(roomAt(out)).toBeNull()
      expect(isWalkable(out), r.owner).toBe(true)
      expect(isWalkable(r.sit), r.owner).toBe(true)
      // 방 안 어디든 들어온 자리에서 걸어갈 수 있고, 방 밖으로 새지 않는다
      expect(findPath(inside, r.sit), r.owner).not.toBeNull()
      expect(findPath(inside, START)).toBeNull()
    }
  })
  it('방 안에서는 카메라가 방을 가운데에 둔다', () => {
    const r = ROOMS[0]
    const c = cameraFor(r.entry.x, r.entry.y)
    expect(c.x + VIEW_W / 2).toBeCloseTo(r.x0 + ROOM_W / 2)
    expect(c.y + VIEW_H / 2).toBeCloseTo(r.y0 + ROOM_H / 2)
  })
  it('서고 안: 복음서 선반 앞에 설 수 있고, 잠긴 방 문 넷은 막혀 있다', () => {
    const lib = ROOMS.find((r) => r.owner === 'library')!
    expect(roomAt(PLACES.library.stand!)).toBe(lib)
    expect(findPath(lib.entry, PLACES.library.stand!)).not.toBeNull()
    expect(LOCKED_DOORS).toHaveLength(4)
    for (const d of LOCKED_DOORS) {
      expect(tileAt(d.x, d.y)).toBe('K')
      expect(isWalkable(d)).toBe(false)
    }
    // 왼쪽 위 → 왼쪽 아래 → 오른쪽 위 → 오른쪽 아래
    expect(LOCKED_DOORS[0].x).toBeLessThan(LOCKED_DOORS[2].x)
    expect(LOCKED_DOORS[0].y).toBeLessThan(LOCKED_DOORS[1].y)
  })
})

describe('movement', () => {
  it('경로는 인접 칸으로 이어지고 도착 칸에서 끝난다', () => {
    const to = { x: 27, y: 12 }
    const path = findPath(START, to)!
    expect(path.at(-1)).toEqual(to)
    let prev = START
    for (const t of path) {
      expect(adjacent(prev, t)).toBe(true)
      expect(isWalkable(t)).toBe(true)
      prev = t
    }
  })
  it('막힌 칸으로는 경로가 없고, 제자리는 빈 경로', () => {
    expect(findPath(START, { x: 2, y: 2 })).toBeNull()
    expect(findPath(START, START)).toEqual([])
  })
  it('가로막힌 칸을 피해 돌아간다', () => {
    const path = findPath({ x: 12, y: 9 }, { x: 14, y: 9 }, new Set(['13,9']))!
    expect(path.some((t) => t.x === 13 && t.y === 9)).toBe(false)
    expect(path.at(-1)).toEqual({ x: 14, y: 9 })
  })
  it('stepActor는 속도만큼 움직이고 도착을 알린다', () => {
    const a: Actor = { x: 5, y: 4, path: [{ x: 6, y: 4 }], facing: 'down', walkTime: 0 }
    const half = stepActor(a, 0.1)
    expect(half.actor.x).toBeCloseTo(5.35)
    expect(half.actor.facing).toBe('right')
    const done = stepActor(half.actor, 1)
    expect(done.arrived).toBe(true)
    expect(done.actor.x).toBe(6)
  })
})

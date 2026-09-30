import { MAP, WIDTH, HEIGHT, PLACES, HOUSES, START, HOME_DOOR, HOME_ENTRY, HOME_FRONT, HOME_ROOM, HOUSE_RECT, homeHouse, houseAt, isWalkable, placeAt, cameraFor, VIEW_W, VIEW_H, VILLAGE_H, isHome, tileAt, ROOMS, WARPS, roomAt, key, ROOM_W, ROOM_H, LOCKED_DOORS, ATTIC, inAttic, ACTS_DOOR, ACTS_ROOM, setActsOpen, setHomeLevel } from './world'
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
      // 방 안의 장소는 그 방에 들어온 자리에서 걷는다 (다락 창은 다락 문깔개 앞에서, 집 안은 집 문깔개 앞에서)
      const from = roomAt(t)?.entry ?? (inAttic(t) ? ATTIC.entry : t.y >= HOME_ROOM.y0 && t.x >= HOME_ROOM.x0 ? HOME_ENTRY : HOME_FRONT)
      const path = p.stand ? findPath(from, p.stand) : pathToward(from, t)
      expect(path, id).not.toBeNull()
    }
  })
  it('placeAt·집 안', () => {
    expect(placeAt({ x: HOME_ROOM.x0 + 1, y: HOME_ROOM.y0 + 3 })).toBe('desk')
    expect(placeAt({ x: 6, y: 33 })).toBe('reeds')
    expect(placeAt({ x: 12, y: 26 })).toBe('field')
    expect(placeAt({ x: 36, y: 50 })).toBe('library')
    expect(placeAt({ x: HOME_DOOR.x + 1, y: HOME_DOOR.y + 1 })).toBe('basket')
    expect(placeAt(START)).toBeNull()
    expect(isHome(START)).toBe(true)
    expect(isHome({ x: 5, y: 12 })).toBe(false)
    // 예전 집 자리(지도 위 2~10열)는 이제 풀밭
    expect(isHome({ x: 5, y: 5 })).toBe(false)
    expect(tileAt(5, 5)).toBe('.')
    expect(tileAt(-1, 3)).toBe('T')
  })
  it('카메라는 지도 밖을 보여 주지 않는다', () => {
    expect(cameraFor(0, 0)).toEqual({ x: 0, y: 0 })
    expect(cameraFor(WIDTH - 1, VILLAGE_H - 1)).toEqual({ x: WIDTH - VIEW_W, y: VILLAGE_H - VIEW_H })
    const c = cameraFor(15, 14)
    expect(c.x).toBeCloseTo(15.5 - VIEW_W / 2)
  })
  it('텃밭은 집 오른쪽 위 열두 칸', () => {
    expect(PLACES.garden.tiles).toHaveLength(12)
  })

  it('새 이웃 집 넷은 문 앞이 걸을 수 있는 길과 이어진다', () => {
    for (const [id, door] of [['postman', { x: 43, y: 22 }], ['carpenter', { x: 14, y: 22 }], ['innkeeper', { x: 20, y: 28 }], ['fisher', { x: 12, y: 31 }]] as const) {
      expect(HOUSES.some((h) => h.id === id), id).toBe(true)
      expect(isWalkable({ x: door.x, y: door.y + 1 }), id).toBe(true)
    }
    expect(PLACES.field.tiles.length).toBe(10)
  })

  it('물 긷는 아이네 집과 편지 나르는 이웃 집 사이(40열)로 지나갈 수 있다', () => {
    // 두 집이 39열에서 대각선으로 맞붙어 막혔던 곳 (사용자, 2026-09-30)
    for (let y = 13; y <= 22; y++) expect(isWalkable({ x: 40, y }), `40,${y}`).toBe(true)
    const path = findPath({ x: 37, y: 18 }, { x: 42, y: 14 })
    expect(path).not.toBeNull()
    expect(path!.some((t) => t.x === 40)).toBe(true)
  })
})

describe('이웃집 안', () => {
  it('집마다 방이 있고, 문 ↔ 방 안이 서로 이어진다', () => {
    expect(ROOMS.map((r) => r.owner)).toEqual(['baker', 'child', 'grandpa', 'weaver', 'beekeeper', 'library', 'acts'])
    // 사도행전 방은 서고 안 잠긴 문에서 드나든다 (아래 '사도행전 방'에서 따로)
    for (const r of ROOMS.filter((r) => r.owner !== 'acts')) {
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
      expect(findPath(inside, HOME_FRONT)).toBeNull()
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

describe('내 집 (계획 7-1 작업 5)', () => {
  afterEach(() => setHomeLevel(0))
  it('밖에서 보는 집은 가장 작은 이웃집(어부 집)과 같은 5칸×4줄, 문은 아래 줄 가운데', () => {
    const fisher = HOUSES.find((h) => h.id === 'fisher')!
    const h = homeHouse()
    expect(h.x1 - h.x0).toBe(fisher.x1 - fisher.x0)
    expect(h.y1 - h.y0).toBe(fisher.y1 - fisher.y0)
    expect(h.x1 - h.x0 + 1).toBe(5)
    expect(h.y1 - h.y0 + 1).toBe(4)
    expect(HOME_DOOR).toEqual({ x: (h.x0 + h.x1) / 2, y: h.y1 })
    expect(tileAt(HOME_DOOR.x, HOME_DOOR.y)).toBe('D')
    for (let y = h.y0; y <= h.y1; y++)
      for (let x = h.x0; x <= h.x1; x++) {
        expect(houseAt(x, y)?.id, `${x},${y}`).toBe('home')
        if (x !== HOME_DOOR.x || y !== HOME_DOOR.y) expect(isWalkable({ x, y }), `${x},${y}`).toBe(false)
      }
    // 문 앞에서 큰길까지 흙길, 옆에 편지 바구니
    for (let y = HOME_FRONT.y; y < 10; y++) expect(tileAt(HOME_DOOR.x, y)).toBe(',')
    expect(placeAt({ x: HOME_FRONT.x + 1, y: HOME_FRONT.y })).toBe('basket')
  })
  it('텃밭은 그대로, 집 옆 가까이에 있다', () => {
    expect(PLACES.garden.tiles).toHaveLength(12)
    for (const t of PLACES.garden.tiles) expect(t.x >= 14 && t.x <= 17 && t.y >= 3 && t.y <= 5).toBe(true)
    // 넓힌 집(13열까지)과도 겹치지 않는다
    expect(Math.min(...PLACES.garden.tiles.map((t) => t.x))).toBeGreaterThan(HOUSE_RECT.x1 + 1)
  })
  it('예전 집 자리는 풀밭 (나무를 흩어 두지 않는다)', () => {
    for (let y = 2; y <= 7; y++)
      for (let x = 2; x <= 7; x++) expect(tileAt(x, y), `${x},${y}`).toBe('.')
  })
  it('문을 밟으면 집 안 방으로, 문깔개를 밟으면 문 앞으로', () => {
    expect(WARPS.get(key(HOME_DOOR))).toEqual(HOME_ENTRY)
    expect(isHome(HOME_ENTRY)).toBe(true)
    expect(isWalkable(HOME_ENTRY)).toBe(true)
    expect(tileAt(HOME_ROOM.exit.x, HOME_ROOM.exit.y)).toBe('E')
    expect(WARPS.get(key(HOME_ROOM.exit))).toEqual(HOME_FRONT)
    expect(isHome(HOME_FRONT)).toBe(false)
    // 집 안은 지도 아래 보이지 않는 곳, 마을과 걸어서 이어지지 않는다
    expect(HOME_ROOM.y0).toBeGreaterThanOrEqual(VILLAGE_H)
    expect(findPath(HOME_ENTRY, HOME_FRONT)).toBeNull()
    expect(roomAt(HOME_ENTRY)).toBeNull()
    // 다른 방과 겹치지 않는다 (넓힌 새 방까지 3칸 더)
    const w = HOME_ROOM.w + 3
    for (const r of [...ROOMS, ATTIC]) {
      const apart = r.x0 + r.w <= HOME_ROOM.x0 || HOME_ROOM.x0 + w <= r.x0 || r.y0 + r.h <= HOME_ROOM.y0 || HOME_ROOM.y0 + HOME_ROOM.h <= r.y0
      expect(apart, r.owner).toBe(true)
    }
    expect(HOME_ROOM.y0 + HOME_ROOM.h).toBeLessThan(HEIGHT)
  })
  it('집 안은 예전과 같은 넓이·배치: 침대·화덕·선반 윗줄, 책상·작업대 아랫줄', () => {
    expect([HOME_ROOM.w, HOME_ROOM.h]).toEqual([9, 6])
    const at = (id: 'bed' | 'hearth' | 'shelf' | 'desk' | 'workbench') => {
      const t = PLACES[id].tiles[0]
      return [t.x - HOME_ROOM.x0, t.y - HOME_ROOM.y0]
    }
    expect(at('bed')).toEqual([1, 1])
    expect(at('hearth')).toEqual([4, 1])
    expect(at('shelf')).toEqual([7, 1])
    expect(at('desk')).toEqual([1, 3])
    expect(at('workbench')).toEqual([7, 3])
    for (const id of ['bed', 'hearth', 'shelf', 'desk', 'workbench'] as const) {
      expect(isHome(PLACES[id].stand!), id).toBe(true)
      expect(findPath(HOME_ENTRY, PLACES[id].stand!), id).not.toBeNull()
    }
    expect(isHome(START)).toBe(true)
  })
  it('집 안에서는 카메라가 방을 가운데에 둔다', () => {
    const c = cameraFor(HOME_ENTRY.x, HOME_ENTRY.y)
    expect(c.x + VIEW_W / 2).toBeCloseTo(HOME_ROOM.x0 + HOME_ROOM.w / 2)
    expect(c.y + VIEW_H / 2).toBeCloseTo(HOME_ROOM.y0 + HOME_ROOM.h / 2)
  })
  it('1단계에는 밖의 집이 양옆으로 한 칸씩 넓어진다 (문은 가운데 그대로)', () => {
    setHomeLevel(1)
    const h = homeHouse()
    expect([h.x0, h.x1]).toEqual([HOUSE_RECT.x0 - 1, HOUSE_RECT.x1 + 1])
    expect((h.x0 + h.x1) / 2).toBe(HOME_DOOR.x)
    for (const x of [h.x0, h.x1]) {
      expect(tileAt(x, h.y0)).toBe('R')
      expect(tileAt(x, h.y1)).toBe('#')
      expect(houseAt(x, h.y1)?.id).toBe('home')
    }
    // 텃밭은 여전히 밟고 들어갈 수 있다
    for (const t of PLACES.garden.tiles) expect(isWalkable(t)).toBe(true)
    expect(findPath(HOME_FRONT, PLACES.garden.tiles[0])).not.toBeNull()
  })
})

describe('사도행전 방 (계획 5 작업 5)', () => {
  afterEach(() => setActsOpen(false))
  const lib = () => ROOMS.find((r) => r.owner === 'library')!

  it('문은 서고 왼쪽 위 잠긴 문 — 닫혀 있으면 막히고, 열리면 걸어 들어가는 문(J)', () => {
    expect(ACTS_DOOR).toEqual(LOCKED_DOORS[0])
    expect(ACTS_ROOM.door).toEqual(ACTS_DOOR)
    expect(tileAt(ACTS_DOOR.x, ACTS_DOOR.y)).toBe('K')
    expect(findPath(lib().entry, ACTS_DOOR)).toBeNull()
    setActsOpen(true)
    expect(tileAt(ACTS_DOOR.x, ACTS_DOOR.y)).toBe('J')
    expect(isWalkable(ACTS_DOOR)).toBe(true)
    expect(findPath(lib().entry, ACTS_DOOR)).not.toBeNull()
    // 다른 잠긴 문 셋은 그대로
    for (const d of LOCKED_DOORS.slice(1)) expect(isWalkable(d)).toBe(false)
  })

  it('문을 밟으면 방 안으로, 문깔개를 밟으면 서고 안 문 옆으로', () => {
    const inside = WARPS.get(key(ACTS_DOOR))!
    expect(roomAt(inside)).toBe(ACTS_ROOM)
    expect(isWalkable(inside)).toBe(true)
    const out = WARPS.get(key(ACTS_ROOM.exit))!
    expect(roomAt(out)).toBe(lib())
    expect(out).toEqual({ x: ACTS_DOOR.x + 1, y: ACTS_DOOR.y })
    expect(isWalkable(out)).toBe(true)
    // 방은 마을과 이어지지 않는다
    expect(findPath(inside, HOME_FRONT)).toBeNull()
  })

  it('방 안: 선반·여정 판·읽는 탁자에 다가갈 수 있고, 다른 방과 겹치지 않는다', () => {
    const inside = WARPS.get(key(ACTS_DOOR))!
    for (const id of ['actsShelf', 'journeyBoard', 'actsTable'] as const) {
      const p = PLACES[id]
      expect(roomAt(p.tiles[0]), id).toBe(ACTS_ROOM)
      expect(findPath(inside, p.stand!), id).not.toBeNull()
      for (const t of p.tiles) expect(placeAt(t), id).toBe(id)
    }
    for (const r of [...ROOMS, ATTIC].filter((r) => r !== ACTS_ROOM)) {
      const apart = r.x0 + r.w <= ACTS_ROOM.x0 || ACTS_ROOM.x0 + ACTS_ROOM.w <= r.x0 || r.y0 + r.h <= ACTS_ROOM.y0 || ACTS_ROOM.y0 + ACTS_ROOM.h <= r.y0
      expect(apart, r.owner).toBe(true)
    }
    expect(ACTS_ROOM.y0 + ACTS_ROOM.h).toBeLessThan(HEIGHT)
  })
})

describe('movement', () => {
  it('경로는 인접 칸으로 이어지고 도착 칸에서 끝난다', () => {
    const to = { x: 27, y: 12 }
    const path = findPath(HOME_FRONT, to)!
    expect(path.at(-1)).toEqual(to)
    let prev = HOME_FRONT
    for (const t of path) {
      expect(adjacent(prev, t)).toBe(true)
      expect(isWalkable(t)).toBe(true)
      prev = t
    }
  })
  it('막힌 칸으로는 경로가 없고, 제자리는 빈 경로', () => {
    expect(findPath(HOME_FRONT, { x: 0, y: 2 })).toBeNull()
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

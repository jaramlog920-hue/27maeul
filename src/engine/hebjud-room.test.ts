// 계획 8 작업 5: 히브리서–유다서 방 — 서고 오른쪽 위 잠긴 문, 편지 선반·편지꽂이·읽는 탁자 (지도 높이 70 → 80)
import { CONTENT } from '../content/catalog'
import { openDoorsFor } from './books'
import { goToSleep, newGame, settle, syncHome, type GameState } from './game'
import { findPath } from './movement'
import { deserialize, serialize } from './save'
import { shelfRoom } from './shelf-rooms'
import {
  ACTS_DOOR,
  ACTS_ROOM,
  ATTIC,
  HEB_JUD_DOOR,
  HEB_JUD_ROOM,
  HEIGHT,
  HOME_EXPAND_RECT,
  HOME_ROOM,
  HOME_FRONT,
  isRightWallDoor,
  isWalkable,
  key,
  LETTERS_DOOR,
  LETTERS_ROOM,
  LOCKED_DOORS,
  MAP,
  openDoors,
  placeAt,
  PLACES,
  ROOMS,
  roomAt,
  setOpenDoors,
  tileAt,
  WARPS,
  WIDTH,
} from './world'

const lib = () => ROOMS.find((r) => r.owner === 'library')!
const ROM_PHM = shelfRoom('romPhm').books
/** 로마서–빌레몬서 방이 열린 상태 (네 복음서·사도행전을 꽂고 잔치가 지났다) */
function romPhmOpen(): GameState {
  const s = newGame(CONTENT)
  return { ...s, flags: { ...s.flags, gospelFeast: 2, 'room:romPhm': 1 }, shelved: { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1 } }
}
/** 로마서–빌레몬서 열세 권을 모두 꽂은 상태 (아직 자지 않았다) */
function romPhmFull(): GameState {
  const s = romPhmOpen()
  return { ...s, shelved: { ...s.shelved, ...Object.fromEntries(ROM_PHM.map((b) => [b, 1])) } }
}
/** 히브리서–유다서 방이 열린 상태 */
function hebJudOpen(): GameState {
  const s = romPhmFull()
  return { ...s, flags: { ...s.flags, 'room:hebJud': 1 } }
}

afterEach(() => setOpenDoors([]))

describe('지도 높이 80', () => {
  it('지도는 80줄, 모든 줄은 폭이 같고 마지막 두 줄(78–79)은 막힌 빈 곳', () => {
    expect(HEIGHT).toBe(90)
    expect(MAP).toHaveLength(HEIGHT)
    for (const row of MAP) expect(row).toHaveLength(WIDTH)
    for (const y of [78, 79]) for (let x = 0; x < WIDTH; x++) expect(isWalkable({ x, y }), `${x},${y}`).toBe(false)
  })

  it('모든 방(이웃집·서고 방·다락·넓힌 내 집)이 서로 겹치지 않고 지도 안에 있다', () => {
    const all = [...ROOMS, ATTIC, { ...HOME_ROOM, owner: 'home', w: HOME_EXPAND_RECT.x1 - HOME_ROOM.x0 + 1 }]
    for (const [i, a] of all.entries()) {
      expect(a.y0 + a.h, a.owner).toBeLessThanOrEqual(HEIGHT)
      expect(a.x0 + a.w, a.owner).toBeLessThanOrEqual(WIDTH)
      for (const b of all.slice(i + 1)) {
        const apart = a.x0 + a.w <= b.x0 || b.x0 + b.w <= a.x0 || a.y0 + a.h <= b.y0 || b.y0 + b.h <= a.y0
        expect(apart, `${a.owner} / ${b.owner}`).toBe(true)
      }
    }
  })
})

describe('히브리서–유다서 방 자리', () => {
  it('문은 서고 오른쪽 위 잠긴 문(방 표의 문 번호 2)', () => {
    expect(shelfRoom('hebJud').door).toBe(2)
    expect(HEB_JUD_DOOR).toEqual(LOCKED_DOORS[2])
    expect(HEB_JUD_DOOR).toEqual({ x: 42, y: 52 })
    expect(HEB_JUD_ROOM.door).toEqual(HEB_JUD_DOOR)
    expect(HEB_JUD_ROOM.owner).toBe('hebJud')
    expect([HEB_JUD_ROOM.x0, HEB_JUD_ROOM.y0, HEB_JUD_ROOM.w, HEB_JUD_ROOM.h]).toEqual([30, 70, 11, 8])
  })

  it('오른쪽 벽 문은 오른쪽 위·오른쪽 아래 둘뿐 (열린 문 그림을 좌우로 뒤집는 문)', () => {
    expect(LOCKED_DOORS.map((d) => isRightWallDoor(d.x, d.y))).toEqual([false, false, true, true])
    expect(isRightWallDoor(HEB_JUD_DOOR.x, HEB_JUD_DOOR.y + 1)).toBe(false)
  })

  it('방 안은 문을 가운데 둔 좌우 대칭: 위 벽 편지꽂이와 같은 창 둘, 왼쪽 편지 선반·오른쪽 책장, 가운데 탁자', () => {
    const { x0, y0, w, h } = HEB_JUD_ROOM
    const mid = x0 + (w - 1) / 2
    expect(HEB_JUD_ROOM.exit.x).toBe(mid)
    const row = (y: number) => Array.from({ length: w }, (_, i) => tileAt(x0 + i, y)).join('')
    const top = row(y0)
    expect(top).toBe([...top].reverse().join(''))
    expect(top.slice(4, 7)).toBe('VVV')
    expect(top.split('N')).toHaveLength(3)
    expect(row(y0 + 1)).toBe('#YYYfffsss#')
    expect(tileAt(mid, y0 + 4)).toBe('n')
    // 놀이판 없음
    for (let y = y0; y < y0 + h; y++) expect(row(y)).not.toContain('M')
    // 붙박이·가구 칸 모양(막힘/걸음)이 좌우 대칭 — 선반 줄(편지 선반과 책장)만 빼고
    const blockedRow = (y: number) => Array.from({ length: w }, (_, i) => (isWalkable({ x: x0 + i, y }) ? '.' : 'x')).join('')
    for (let y = y0 + 2; y < y0 + h; y++) {
      const b = blockedRow(y)
      expect(b, `줄 ${y - y0}`).toBe([...b].reverse().join(''))
    }
  })

  it('로마서–빌레몬서 방과 구분되는 가구 (가구 그림이 좌우 대칭 자리에)', () => {
    expect(HEB_JUD_ROOM.decor.length).toBeGreaterThanOrEqual(2)
    expect(LETTERS_ROOM.decor).toEqual([])
    const w = HEB_JUD_ROOM.w
    const items = HEB_JUD_ROOM.decor.map(([dx, dy, item]) => `${dx},${dy},${item}`)
    for (const [dx, dy, item] of HEB_JUD_ROOM.decor) {
      const width = item === 'rug' ? 3 : 1
      expect(items, item).toContain(`${w - dx - width},${dy},${item}`)
    }
  })
})

describe('히브리서–유다서 방 문', () => {
  it('닫혀 있으면 셋째 문은 막혀 있고, 열리면 걸어 들어가는 문(J) — 다른 문은 따로', () => {
    syncHome(romPhmFull())
    expect(tileAt(HEB_JUD_DOOR.x, HEB_JUD_DOOR.y)).toBe('K')
    expect(isWalkable(HEB_JUD_DOOR)).toBe(false)
    expect(findPath(lib().entry, HEB_JUD_DOOR)).toBeNull()
    syncHome(hebJudOpen())
    expect(tileAt(HEB_JUD_DOOR.x, HEB_JUD_DOOR.y)).toBe('J')
    expect(findPath(lib().entry, HEB_JUD_DOOR)).not.toBeNull()
    expect(isWalkable(ACTS_DOOR)).toBe(true)
    expect(isWalkable(LETTERS_DOOR)).toBe(true)
    expect(isWalkable(LOCKED_DOORS[3])).toBe(false)
    expect(openDoors()).toEqual([0, 1, 2])
    expect(openDoorsFor(hebJudOpen().flags)).toEqual([0, 1, 2])
  })

  it('열세 권을 다 꽂은 날 밤을 자고 나면 문이 열린다', () => {
    syncHome(goToSleep(romPhmFull(), CONTENT))
    expect(isWalkable(HEB_JUD_DOOR)).toBe(true)
  })

  it('문을 밟으면 방 안으로, 문깔개를 밟으면 서고 안 그 문 왼쪽으로 (오른쪽 벽)', () => {
    const inside = WARPS.get(key(HEB_JUD_DOOR))!
    expect(roomAt(inside)).toBe(HEB_JUD_ROOM)
    expect(inside).toEqual(HEB_JUD_ROOM.entry)
    expect(isWalkable(inside)).toBe(true)
    const out = WARPS.get(key(HEB_JUD_ROOM.exit))!
    expect(out).toEqual({ x: HEB_JUD_DOOR.x - 1, y: HEB_JUD_DOOR.y })
    expect(roomAt(out)).toBe(lib())
    expect(isWalkable(out)).toBe(true)
    expect(findPath(lib().entry, out)).not.toBeNull()
    expect(findPath(inside, HOME_FRONT)).toBeNull()
  })

  it('선반·읽는 탁자에 걸어서 닿는다', () => {
    const inside = WARPS.get(key(HEB_JUD_DOOR))!
    for (const id of ['hebJudShelf', 'hebJudTable'] as const) {
      const p = PLACES[id]
      expect(roomAt(p.tiles[0]), id).toBe(HEB_JUD_ROOM)
      expect(findPath(inside, p.stand!), id).not.toBeNull()
      for (const t of p.tiles) expect(placeAt(t), id).toBe(id)
    }
    expect(PLACES.hebJudShelf.tiles.map((t) => tileAt(t.x, t.y))).toEqual(['Y', 'Y', 'Y'])
    expect(tileAt(PLACES.hebJudTable.tiles[0].x, PLACES.hebJudTable.tiles[0].y)).toBe('n')
    expect(findPath(inside, HEB_JUD_ROOM.exit)).not.toBeNull()
  })
})

describe('저장과 불러오기', () => {
  it('불러오면 문 상태가 그대로 (열림·닫힘 모두)', () => {
    setOpenDoors([0, 1, 2])
    deserialize(serialize(romPhmFull()), CONTENT)
    expect(isWalkable(HEB_JUD_DOOR)).toBe(false)
    expect(isWalkable(LETTERS_DOOR)).toBe(true)
    deserialize(serialize(hebJudOpen()), CONTENT)
    expect(isWalkable(HEB_JUD_DOOR)).toBe(true)
  })

  it('계획 7 배포본 모양 저장(서고·내 집·로마서–빌레몬서 방 안에 선 것)을 불러와도 자리가 그대로이고 걸을 수 있다', () => {
    const s = romPhmOpen()
    const spots = [
      { where: '서고', at: lib().entry },
      { where: '내 집', at: HOME_ROOM.entry },
      { where: '로마서–빌레몬서 방', at: LETTERS_ROOM.entry },
    ]
    for (const { where, at } of spots) {
      const saved = serialize({ ...s, player: { ...s.player, x: at.x, y: at.y, path: [] } })
      // 저장에는 지도 크기가 들어가지 않는다
      expect(saved).not.toMatch(/"(height|HEIGHT|mapH)"/)
      const back = deserialize(saved, CONTENT)!
      expect(back, where).not.toBeNull()
      expect({ x: back.player.x, y: back.player.y }, where).toEqual(at)
      expect(isWalkable(at), where).toBe(true)
    }
  })

  it('방이 열리기 전 저장이 방 자리 칸에 서 있어도 갇히지 않는다', () => {
    const s = romPhmFull()
    const inside = WARPS.get(key(HEB_JUD_DOOR))!
    const settled = settle({ ...s, player: { ...s.player, x: inside.x, y: inside.y } }, CONTENT)
    expect(isWalkable({ x: settled.player.x, y: settled.player.y })).toBe(true)
    expect(roomAt({ x: settled.player.x, y: settled.player.y })).toBe(HEB_JUD_ROOM)
    expect(findPath(inside, HEB_JUD_ROOM.exit)).not.toBeNull()
  })

  it('사도행전·로마서–빌레몬서 방 동작은 그대로', () => {
    expect(WARPS.get(key(ACTS_ROOM.exit))).toEqual({ x: ACTS_DOOR.x + 1, y: ACTS_DOOR.y })
    expect(WARPS.get(key(LETTERS_ROOM.exit))).toEqual({ x: LETTERS_DOOR.x + 1, y: LETTERS_DOOR.y })
    expect(roomAt(WARPS.get(key(ACTS_DOOR))!)).toBe(ACTS_ROOM)
    expect(roomAt(WARPS.get(key(LETTERS_DOOR))!)).toBe(LETTERS_ROOM)
  })
})

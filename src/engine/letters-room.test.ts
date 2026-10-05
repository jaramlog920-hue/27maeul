// 계획 7 작업 7: 로마서–빌레몬서 방 — 서고 왼쪽 아래 잠긴 문, 편지 선반·편지꽂이·읽는 탁자
import { CONTENT } from '../content/catalog'
import { openDoorsFor } from './books'
import { newGame, settle, syncHome, type GameState } from './game'
import { findPath } from './movement'
import { deserialize, serialize } from './save'
import { shelfRoom } from './shelf-rooms'
import {
  ACTS_DOOR,
  ACTS_ROOM,
  HEIGHT,
  HOME_EXPAND_RECT,
  HOME_ROOM,
  HOME_FRONT,
  isWalkable,
  key,
  LETTERS_DOOR,
  LETTERS_ROOM,
  LOCKED_DOORS,
  openDoors,
  placeAt,
  PLACES,
  ROOMS,
  roomAt,
  setOpenDoors,
  tileAt,
  WARPS,
} from './world'

const lib = () => ROOMS.find((r) => r.owner === 'library')!
/** 네 복음서와 사도행전을 꽂고 잔치가 지난 상태 */
function actsShelved(): GameState {
  const s = newGame(CONTENT)
  return { ...s, flags: { ...s.flags, gospelFeast: 2 }, shelved: { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1 } }
}
/** 로마서–빌레몬서 방이 열린 상태 */
function lettersOpen(): GameState {
  const s = actsShelved()
  return { ...s, flags: { ...s.flags, 'room:romPhm': 1 } }
}

afterEach(() => setOpenDoors([]))

describe('로마서–빌레몬서 방 자리', () => {
  it('문은 서고 왼쪽 아래 잠긴 문(방 표의 문 번호 1)', () => {
    expect(shelfRoom('romPhm').door).toBe(1)
    expect(LETTERS_DOOR).toEqual(LOCKED_DOORS[1])
    expect(LETTERS_ROOM.door).toEqual(LETTERS_DOOR)
    expect([LETTERS_ROOM.w, LETTERS_ROOM.h]).toEqual([11, 8])
  })

  it('지도 아래 보이지 않는 곳에 있고 다른 방·다락·내 집(넓힌 방까지)과 겹치지 않는다', () => {
    const others = [...ROOMS.filter((r) => r !== LETTERS_ROOM), { ...HOME_ROOM, w: HOME_EXPAND_RECT.x1 - HOME_ROOM.x0 + 1 }]
    for (const r of others) {
      const apart =
        r.x0 + r.w <= LETTERS_ROOM.x0 || LETTERS_ROOM.x0 + LETTERS_ROOM.w <= r.x0 || r.y0 + r.h <= LETTERS_ROOM.y0 || LETTERS_ROOM.y0 + LETTERS_ROOM.h <= r.y0
      expect(apart, r.owner).toBe(true)
    }
    expect(LETTERS_ROOM.y0).toBeGreaterThanOrEqual(40)
    expect(LETTERS_ROOM.y0 + LETTERS_ROOM.h).toBeLessThan(HEIGHT)
  })

  it('방 안은 문을 가운데 둔 좌우 대칭: 위 벽 가운데 편지꽂이, 양옆 같은 창 둘, 왼쪽 편지 선반·오른쪽 책장, 가운데 탁자', () => {
    const { x0, y0, w } = LETTERS_ROOM
    const mid = x0 + (w - 1) / 2
    expect(LETTERS_ROOM.exit.x).toBe(mid)
    const row = (y: number) => Array.from({ length: w }, (_, i) => tileAt(x0 + i, y)).join('')
    // 위 벽: 창 · 편지꽂이 세 칸 · 창 (대칭)
    const top = row(y0)
    expect(top).toBe([...top].reverse().join(''))
    expect(top.slice(4, 7)).toBe('VVV')
    expect(top.split('N')).toHaveLength(3)
    // 선반 줄: 왼쪽 편지 선반 세 칸, 오른쪽 책장 세 칸 (같은 자리)
    expect(row(y0 + 1)).toBe('#YYYfffsss#')
    expect(tileAt(mid, y0 + 4)).toBe('n')
    // 놀이판(여정 판 같은 것)은 없다
    expect(top).not.toContain('M')
  })
})

describe('로마서–빌레몬서 방 문', () => {
  it('새 게임에서도 둘째 문은 열려 있어 걸어 들어가는 문(J) — 첫 문(사도행전 방)도 열림', () => {
    syncHome(newGame(CONTENT))
    expect(tileAt(LETTERS_DOOR.x, LETTERS_DOOR.y)).toBe('J')
    expect(findPath(lib().entry, LETTERS_DOOR)).not.toBeNull()
    expect(isWalkable(ACTS_DOOR)).toBe(true)
    for (const d of LOCKED_DOORS) expect(isWalkable(d)).toBe(true)
  })

  it('열린 문 번호는 방 표로 정한다 — 방 표식이 없어도 모두', () => {
    expect(openDoorsFor({})).toEqual([0, 1, 2, 3])
    expect(openDoorsFor({ gospelFeast: 2 })).toEqual([0, 1, 2, 3])
    expect(openDoorsFor({ gospelFeast: 2, 'room:romPhm': 1 })).toEqual([0, 1, 2, 3])
    syncHome(lettersOpen())
    expect(openDoors()).toEqual([0, 1, 2, 3])
  })

  it('문을 밟으면 방 안으로, 문깔개를 밟으면 서고 안 그 문 오른쪽으로', () => {
    const inside = WARPS.get(key(LETTERS_DOOR))!
    expect(roomAt(inside)).toBe(LETTERS_ROOM)
    expect(isWalkable(inside)).toBe(true)
    const out = WARPS.get(key(LETTERS_ROOM.exit))!
    expect(out).toEqual({ x: LETTERS_DOOR.x + 1, y: LETTERS_DOOR.y })
    expect(roomAt(out)).toBe(lib())
    expect(isWalkable(out)).toBe(true)
    expect(findPath(inside, HOME_FRONT)).toBeNull()
  })

  it('선반·읽는 탁자에 걸어서 닿는다', () => {
    const inside = WARPS.get(key(LETTERS_DOOR))!
    for (const id of ['lettersShelf', 'lettersTable'] as const) {
      const p = PLACES[id]
      expect(roomAt(p.tiles[0]), id).toBe(LETTERS_ROOM)
      expect(findPath(inside, p.stand!), id).not.toBeNull()
      for (const t of p.tiles) expect(placeAt(t), id).toBe(id)
    }
    expect(PLACES.lettersShelf.tiles.map((t) => tileAt(t.x, t.y))).toEqual(['Y', 'Y', 'Y'])
  })
})

describe('저장과 불러오기', () => {
  it('불러오면 문이 모두 열린다 (옛 저장에 방 표식이 없어도)', () => {
    setOpenDoors([])
    deserialize(serialize(actsShelved()), CONTENT)
    expect(isWalkable(LETTERS_DOOR)).toBe(true)
    expect(isWalkable(ACTS_DOOR)).toBe(true)
    deserialize(serialize(lettersOpen()), CONTENT)
    expect(isWalkable(LETTERS_DOOR)).toBe(true)
  })

  it('방이 열리기 전 저장이 방 자리 칸에 서 있어도 갇히지 않는다', () => {
    const s = actsShelved()
    const inside = WARPS.get(key(LETTERS_DOOR))!
    const settled = settle({ ...s, player: { ...s.player, x: inside.x, y: inside.y } }, CONTENT)
    // 방 안은 걸을 수 있는 방이므로 그대로 두되, 문깔개로 서고에 나갈 수 있다
    expect(isWalkable({ x: settled.player.x, y: settled.player.y })).toBe(true)
    expect(roomAt({ x: settled.player.x, y: settled.player.y })).toBe(LETTERS_ROOM)
    expect(findPath(inside, LETTERS_ROOM.exit)).not.toBeNull()
  })

  it('사도행전 방 동작은 그대로', () => {
    expect(ACTS_ROOM.door).toEqual(LOCKED_DOORS[0])
    expect(WARPS.get(key(ACTS_ROOM.exit))).toEqual({ x: ACTS_DOOR.x + 1, y: ACTS_DOOR.y })
  })
})

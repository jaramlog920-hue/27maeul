// 계획 9 작업 4: 요한계시록 방 — 서고 오른쪽 아래 잠긴 문, 한 권 선반·일곱 교회 카드 판·읽는 탁자 (16열·70줄, 지도 높이 80 그대로)
import { CONTENT } from '../content/catalog'
import { openDoorsFor } from './books'
import { goToSleep, newGame, settle, syncHome, type GameState } from './game'
import { FURNITURE_DEFS } from './furniture-defs'
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
  REV_DOOR,
  REV_ROOM,
  ROOMS,
  roomAt,
  setOpenDoors,
  tileAt,
  WARPS,
  WIDTH,
} from './world'

const lib = () => ROOMS.find((r) => r.owner === 'library')!
const ROM_PHM = shelfRoom('romPhm').books
const HEB_JUD = shelfRoom('hebJud').books
/** 히브리서–유다서 방이 열린 상태 (그 앞 방은 다 찼다) */
function hebJudOpen(): GameState {
  const s = newGame(CONTENT)
  return {
    ...s,
    flags: { ...s.flags, gospelFeast: 2, 'room:romPhm': 1, 'room:hebJud': 1 },
    shelved: { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1, ...Object.fromEntries(ROM_PHM.map((b) => [b, 1])) },
  }
}
/** 히브리서–유다서 여덟 권을 모두 꽂은 상태 (아직 자지 않았다) */
function hebJudFull(): GameState {
  const s = hebJudOpen()
  return { ...s, shelved: { ...s.shelved, ...Object.fromEntries(HEB_JUD.map((b) => [b, 1])) } }
}
/** 요한계시록 방이 열린 상태 */
function revOpen(): GameState {
  const s = hebJudFull()
  return { ...s, flags: { ...s.flags, 'room:rev': 1 } }
}

afterEach(() => setOpenDoors([]))

describe('요한계시록 방 자리', () => {
  it('16–26열 × 70–77줄 (11×8), 지도 높이는 80 그대로이고 78–79줄은 빈 곳', () => {
    expect([REV_ROOM.x0, REV_ROOM.y0, REV_ROOM.w, REV_ROOM.h]).toEqual([16, 70, 11, 8])
    expect(REV_ROOM.owner).toBe('rev')
    expect(HEIGHT).toBe(80)
    expect(MAP).toHaveLength(HEIGHT)
    for (const row of MAP) expect(row).toHaveLength(WIDTH)
    for (const y of [78, 79]) for (let x = 0; x < WIDTH; x++) expect(isWalkable({ x, y }), `${x},${y}`).toBe(false)
  })

  it('모든 방(이웃집·서고 방 넷·다락·넓힌 내 집)이 서로 겹치지 않고 지도 안에 있다', () => {
    const home = { ...HOME_ROOM, owner: 'home', w: HOME_EXPAND_RECT.x1 - HOME_ROOM.x0 + 1 }
    expect([home.x0, home.y0, home.x0 + home.w - 1, home.y0 + home.h - 1]).toEqual([16, 60, 27, 65])
    const all = [...ROOMS, ATTIC, home]
    for (const [i, a] of all.entries()) {
      expect(a.y0 + a.h, a.owner).toBeLessThanOrEqual(HEIGHT)
      expect(a.x0 + a.w, a.owner).toBeLessThanOrEqual(WIDTH)
      for (const b of all.slice(i + 1)) {
        const apart = a.x0 + a.w <= b.x0 || b.x0 + b.w <= a.x0 || a.y0 + a.h <= b.y0 || b.y0 + b.h <= a.y0
        expect(apart, `${a.owner} / ${b.owner}`).toBe(true)
      }
    }
  })

  it('방 둘레는 벽, 문깔개만 아래 벽 가운데', () => {
    const { x0, y0, w, h } = REV_ROOM
    for (let x = x0; x < x0 + w; x++) {
      expect(tileAt(x, y0 + h - 1), `아래 ${x}`).toBe(x === REV_ROOM.exit.x ? 'E' : '#')
      expect(isWalkable({ x, y: y0 }), `위 ${x}`).toBe(false)
    }
    for (let y = y0; y < y0 + h; y++) {
      expect(tileAt(x0, y), `왼쪽 ${y}`).toBe('#')
      expect(tileAt(x0 + w - 1, y), `오른쪽 ${y}`).toBe('#')
    }
  })

  it('문은 서고 오른쪽 아래 잠긴 문 (방 표의 문 번호 3)', () => {
    expect(shelfRoom('rev').door).toBe(3)
    expect(REV_DOOR).toEqual(LOCKED_DOORS[3])
    expect(REV_DOOR).toEqual({ x: 42, y: 55 })
    expect(REV_ROOM.door).toEqual(REV_DOOR)
    expect(isRightWallDoor(REV_DOOR.x, REV_DOOR.y)).toBe(true)
    expect(isRightWallDoor(HEB_JUD_DOOR.x, HEB_JUD_DOOR.y)).toBe(true)
  })

  it('방 안은 문을 가운데 둔 좌우 대칭: 위 벽 가운데 카드 판·같은 창 둘, 왼쪽 한 권 선반·오른쪽 책장, 가운데 탁자, 구석 화분 둘', () => {
    const { x0, y0, w, h } = REV_ROOM
    const mid = x0 + (w - 1) / 2
    expect(REV_ROOM.exit.x).toBe(mid)
    const row = (y: number) => Array.from({ length: w }, (_, i) => tileAt(x0 + i, y)).join('')
    const top = row(y0)
    expect(top).toBe('##N#CCC#N##')
    expect(top).toBe([...top].reverse().join(''))
    expect(row(y0 + 1)).toBe('#QQQfffsss#')
    expect(tileAt(mid, y0 + 4)).toBe('n')
    expect(tileAt(x0 + 1, y0 + 6)).toBe('p')
    expect(tileAt(x0 + w - 2, y0 + 6)).toBe('p')
    // 여정 판·편지꽂이·편지 선반은 없다
    for (let y = y0; y < y0 + h; y++) for (const ch of ['M', 'V', 'Y']) expect(row(y)).not.toContain(ch)
    // 막힘/걸음 모양이 좌우 대칭 — 선반 줄(한 권 선반과 책장)만 빼고
    const blockedRow = (y: number) => Array.from({ length: w }, (_, i) => (isWalkable({ x: x0 + i, y }) ? '.' : 'x')).join('')
    for (let y = y0 + 2; y < y0 + h; y++) {
      const b = blockedRow(y)
      expect(b, `줄 ${y - y0}`).toBe([...b].reverse().join(''))
    }
  })

  it('가구 그림은 탁자 아래 둥근 깔개 하나 — 반 칸 옮겨 방 가운데에, 등잔대(촛대와 헷갈리는 것)는 없다', () => {
    expect(REV_ROOM.decor).toHaveLength(1)
    const [dx, dy, item, how] = REV_ROOM.decor[0]
    expect(item).toBe('roundRug')
    expect(how).toBe('half')
    // 두 칸 폭 깔개를 반 칸 옮기면 가운데가 문 줄 가운데
    expect(dx + FURNITURE_DEFS.roundRug!.w / 2 + 0.5).toBe((REV_ROOM.w - 1) / 2 + 0.5)
    expect(dy).toBe(5)
    for (const [, , it] of REV_ROOM.decor) expect(it).not.toBe('lampStand')
    // 탁자는 깔개에 덮이지 않는다
    expect(tileAt(REV_ROOM.x0 + 5, REV_ROOM.y0 + 4)).toBe('n')
  })

  it('카드 판(C)은 막힌 칸, 새 글자는 방 밖 어디에도 없다', () => {
    const cs: string[] = []
    MAP.forEach((r, y) => [...r].forEach((c, x) => c === 'C' && cs.push(`${x},${y}`)))
    expect(cs).toEqual(PLACES.churchBoard.tiles.map(key))
    for (const t of PLACES.churchBoard.tiles) expect(isWalkable(t)).toBe(false)
  })
})

describe('요한계시록 방 문', () => {
  it('닫혀 있으면 넷째 문은 막혀 있고, 열리면 걸어 들어가는 문(J) — 다른 문은 그대로', () => {
    syncHome(hebJudFull())
    expect(tileAt(REV_DOOR.x, REV_DOOR.y)).toBe('K')
    expect(isWalkable(REV_DOOR)).toBe(false)
    expect(findPath(lib().entry, REV_DOOR)).toBeNull()
    expect(openDoors()).toEqual([0, 1, 2])
    syncHome(revOpen())
    expect(tileAt(REV_DOOR.x, REV_DOOR.y)).toBe('J')
    expect(findPath(lib().entry, REV_DOOR)).not.toBeNull()
    for (const d of [ACTS_DOOR, LETTERS_DOOR, HEB_JUD_DOOR]) expect(isWalkable(d)).toBe(true)
    expect(openDoors()).toEqual([0, 1, 2, 3])
    expect(openDoorsFor(revOpen().flags)).toEqual([0, 1, 2, 3])
  })

  it('여덟 권을 다 꽂은 날 밤을 자고 나면 문이 열린다', () => {
    syncHome(goToSleep(hebJudFull(), CONTENT))
    expect(isWalkable(REV_DOOR)).toBe(true)
  })

  it('문을 밟으면 방 문깔개 위로, 문깔개를 밟으면 서고 안 그 문 왼쪽으로 (오른쪽 벽)', () => {
    const inside = WARPS.get(key(REV_DOOR))!
    expect(inside).toEqual(REV_ROOM.entry)
    expect(inside).toEqual({ x: REV_ROOM.exit.x, y: REV_ROOM.exit.y - 1 })
    expect(roomAt(inside)).toBe(REV_ROOM)
    expect(isWalkable(inside)).toBe(true)
    const out = WARPS.get(key(REV_ROOM.exit))!
    expect(out).toEqual({ x: REV_DOOR.x - 1, y: REV_DOOR.y })
    expect(roomAt(out)).toBe(lib())
    expect(isWalkable(out)).toBe(true)
    expect(findPath(lib().entry, out)).not.toBeNull()
    expect(findPath(inside, HOME_FRONT)).toBeNull()
  })

  it('선반·카드 판·읽는 탁자에 걸어서 닿는다', () => {
    const inside = WARPS.get(key(REV_DOOR))!
    for (const id of ['revShelf', 'churchBoard', 'revTable'] as const) {
      const p = PLACES[id]
      expect(roomAt(p.tiles[0]), id).toBe(REV_ROOM)
      expect(isWalkable(p.stand!), id).toBe(true)
      expect(findPath(inside, p.stand!), id).not.toBeNull()
      for (const t of p.tiles) expect(placeAt(t), id).toBe(id)
    }
    expect(PLACES.revShelf.tiles.map((t) => tileAt(t.x, t.y))).toEqual(['Q', 'Q', 'Q'])
    expect(PLACES.churchBoard.tiles.map((t) => tileAt(t.x, t.y))).toEqual(['C', 'C', 'C'])
    expect(tileAt(PLACES.revTable.tiles[0].x, PLACES.revTable.tiles[0].y)).toBe('n')
    expect(findPath(inside, REV_ROOM.exit)).not.toBeNull()
  })
})

describe('저장과 불러오기', () => {
  it('불러오면 문 상태가 그대로 (열림·닫힘 모두)', () => {
    setOpenDoors([0, 1, 2, 3])
    deserialize(serialize(hebJudFull()), CONTENT)
    expect(isWalkable(REV_DOOR)).toBe(false)
    expect(isWalkable(HEB_JUD_DOOR)).toBe(true)
    deserialize(serialize(revOpen()), CONTENT)
    expect(isWalkable(REV_DOOR)).toBe(true)
  })

  it('계획 7·8 모양 저장(서고·내 집·서고 방 셋 안에 선 것)을 불러와도 자리가 그대로이고 걸을 수 있다', () => {
    const s = hebJudOpen()
    const spots = [
      { where: '서고', at: lib().entry },
      { where: '내 집', at: HOME_ROOM.entry },
      { where: '사도행전 방', at: ACTS_ROOM.entry },
      { where: '로마서–빌레몬서 방', at: LETTERS_ROOM.entry },
      { where: '히브리서–유다서 방', at: HEB_JUD_ROOM.entry },
    ]
    for (const { where, at } of spots) {
      const raw = JSON.parse(serialize({ ...s, player: { ...s.player, x: at.x, y: at.y, path: [] } }))
      // 계획 7·8 모양: 일곱 교회 판도 요한계시록 진행도 없던 때
      delete raw.churches
      if (raw.progress) delete raw.progress.rev
      const back = deserialize(JSON.stringify(raw), CONTENT)!
      expect(back, where).not.toBeNull()
      expect({ x: back.player.x, y: back.player.y }, where).toEqual(at)
      expect(isWalkable(at), where).toBe(true)
      expect(back.churches, where).toEqual([])
    }
  })

  it('방이 열리기 전 저장이 방 자리 칸에 서 있어도 갇히지 않는다', () => {
    const s = hebJudFull()
    const inside = WARPS.get(key(REV_DOOR))!
    const settled = settle({ ...s, player: { ...s.player, x: inside.x, y: inside.y } }, CONTENT)
    expect(isWalkable({ x: settled.player.x, y: settled.player.y })).toBe(true)
    expect(findPath(inside, REV_ROOM.exit)).not.toBeNull()
  })

  it('다른 세 방 동작은 그대로', () => {
    expect(WARPS.get(key(ACTS_ROOM.exit))).toEqual({ x: ACTS_DOOR.x + 1, y: ACTS_DOOR.y })
    expect(WARPS.get(key(LETTERS_ROOM.exit))).toEqual({ x: LETTERS_DOOR.x + 1, y: LETTERS_DOOR.y })
    expect(WARPS.get(key(HEB_JUD_ROOM.exit))).toEqual({ x: HEB_JUD_DOOR.x - 1, y: HEB_JUD_DOOR.y })
    expect(roomAt(WARPS.get(key(ACTS_DOOR))!)).toBe(ACTS_ROOM)
    expect(roomAt(WARPS.get(key(LETTERS_DOOR))!)).toBe(LETTERS_ROOM)
    expect(roomAt(WARPS.get(key(HEB_JUD_DOOR))!)).toBe(HEB_JUD_ROOM)
  })
})

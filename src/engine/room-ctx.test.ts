// 계획 20 작업 7: 건물 안 가구 — 방 기준 일반화(집 동작 불변), 소유 공간별 저장
import { CONTENT } from '../content/catalog'
import { newGame, moveFurniture, placeFurniture, removeFurniture, rotateFurniture, syncHome, type GameState } from './game'
import { setActiveMap } from './maps'
import { setNewlandOpen, newlandWarp } from './newland'
import {
  advanceBuilds, buildsOf, canPlace, cancelBuild, demolishBuild, doorOf, MAX_BUILDS, MAX_HOMES, orderBuild, roomKeyFor, type Build,
} from './newland-build'
import { INTERIOR, NEWLAND_H, NEWLAND_PORTAL_FRONT, NEWLAND_VISIBLE_H, NEWLAND_W, ROOM_H, ROOM_SLOTS, ROOM_W } from './newland-config'
import { homeAtSlot, inBuildingRoom, roomOf, roomTarget, slotCtx } from './newland-rooms'
import { findPath } from './movement'
import { FURNITURE_DEFS, HOME_CTX, footprint, initialHomeFurniture, placement, refitRoom, removal, rotation, type Furniture } from './room'
import { runScenario } from './room-pin.helper'
import expected from './room-pin.expected.json'
import { deserialize, serialize } from './save'
import { tileAt, warpAt } from './world'

afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
})

describe('집 안 동작 고정 (HOME_CTX)', () => {
  it('집 단계 0–3의 대표 배치 20가지가 RoomCtx를 넣기 전과 한 글자도 다르지 않다', () => {
    expect(expected).toHaveLength(20)
    const api = { placement, rotation, removal, refitRoom }
    for (let i = 0; i < 20; i++) expect(runScenario(api, i), `시나리오 ${i}`).toBe(expected[i])
  })

  it('ctx를 넘기지 않는 것과 HOME_CTX를 넘기는 것은 같다', () => {
    setActiveMap('village')
    const room = initialHomeFurniture()
    const a = placement(room, 'stool', { x: 18, y: 112 })
    const b = placement(room, 'stool', { x: 18, y: 112 }, undefined, HOME_CTX)
    expect(b).toEqual(a)
  })
})

describe('새 터 방 칸', () => {
  it('숨은 줄에서 서고 안 방을 뺀 곳에 8×6 방이 들어가는 만큼 칸을 나눈다', () => {
    const hidden = NEWLAND_H - NEWLAND_VISIBLE_H
    const perBand = Math.floor(INTERIOR.x0 / ROOM_W) + Math.floor((NEWLAND_W - INTERIOR.x0 - INTERIOR.w) / ROOM_W)
    expect(ROOM_SLOTS).toHaveLength(perBand * Math.floor(hidden / ROOM_H))
    expect(ROOM_SLOTS).toHaveLength(2)
    expect(MAX_HOMES).toBe(ROOM_SLOTS.length)
  })

  it('방 칸은 8×6, 숨은 줄 안, 서고 안 방·서로와 겹치지 않는다', () => {
    for (const [i, r] of ROOM_SLOTS.entries()) {
      expect([r.w, r.h]).toEqual([8, 6])
      expect(r.y0).toBeGreaterThanOrEqual(NEWLAND_VISIBLE_H)
      expect(r.y0 + r.h).toBeLessThanOrEqual(NEWLAND_H)
      expect(r.x0).toBeGreaterThanOrEqual(0)
      expect(r.x0 + r.w).toBeLessThanOrEqual(NEWLAND_W)
      const overlapsArchive = r.x0 < INTERIOR.x0 + INTERIOR.w && INTERIOR.x0 < r.x0 + r.w && r.y0 < INTERIOR.y0 + INTERIOR.h && INTERIOR.y0 < r.y0 + r.h
      expect(overlapsArchive).toBe(false)
      for (const o of ROOM_SLOTS.slice(i + 1)) expect(r.x0 + r.w <= o.x0 || o.x0 + o.w <= r.x0 || r.y0 + r.h <= o.y0 || o.y0 + o.h <= r.y0).toBe(true)
    }
  })

  it('방 칸은 벽·바닥·문깔개로 지도에 있고 문깔개 위 칸이 들어와 서는 칸이다', () => {
    setActiveMap('newland')
    for (const r of ROOM_SLOTS) {
      expect(tileAt(r.x0, r.y0)).toBe('#')
      expect(tileAt(r.x0 + 3, r.y0 + 1)).toBe('#')
      expect(tileAt(r.x0 + 3, r.y0 + 2)).toBe('f')
      expect(tileAt(r.exit.x, r.exit.y)).toBe('E')
      expect(r.entry).toEqual({ x: r.exit.x, y: r.exit.y - 1 })
      expect(tileAt(r.entry.x, r.entry.y)).toBe('f')
    }
  })
})

describe('새 방의 규칙 (같은 가구 규칙, 방 기준)', () => {
  const slot = ROOM_SLOTS[0]
  const ctx = slotCtx(slot)
  const at = (dx: number, dy: number) => ({ x: slot.x0 + dx, y: slot.y0 + dy })
  const put = (room: Furniture[], item: Furniture['item'], dx: number, dy: number, facing?: Furniture['facing']) => {
    const f = placement(room, item, at(dx, dy), facing, ctx)
    return f ? [...room, f] : null
  }
  beforeEach(() => setActiveMap('newland'))

  it('바닥에 놓을 수 있고, 벽·방 밖에는 못 놓는다', () => {
    expect(placement([], 'stool', at(1, 3), undefined, ctx)).not.toBeNull()
    expect(placement([], 'stool', at(1, 1), undefined, ctx)).toBeNull() // 벽
    expect(placement([], 'stool', at(-1, 3), undefined, ctx)).toBeNull() // 방 밖
    expect(placement([], 'table', at(7, 3), undefined, ctx)).toBeNull() // 둘째 칸이 방 밖
    expect(placement([], 'rug', at(3, 4), undefined, ctx)).toBeNull() // 깔개 3×2가 문깔개까지 덮는다
    expect(placement([], 'rug', at(0, 4), undefined, ctx)).not.toBeNull()
    expect(placement([], 'rug', at(0, 3), undefined, ctx)).not.toBeNull()
  })

  it('문 앞(들어와 서는 칸)과 문깔개에는 길을 막는 가구를 못 놓는다', () => {
    expect(placement([], 'stool', slot.entry, undefined, ctx)).toBeNull()
    expect(placement([], 'candle', slot.entry, undefined, ctx)).toBeNull()
    expect(placement([], 'stool', slot.exit, undefined, ctx)).toBeNull()
    // 두 칸 가구가 문 앞에 걸쳐도 못 놓는다
    expect(placement([], 'table', { x: slot.entry.x - 1, y: slot.entry.y }, undefined, ctx)).toBeNull()
  })

  it('탁자 위 작은 물건·돌리기·치우기도 집과 같다', () => {
    const room = put([], 'table', 1, 3)!
    const withVase = put(room, 'vase', 1, 3)!
    expect(withVase[1].on).toBe(true)
    // 위에 물건이 있으면 돌릴 수 없다
    expect(rotation(withVase, withVase[0], ctx)).toBeNull()
    const turned = rotation(room, room[0], ctx)
    expect(turned?.facing).toBe('right')
    expect(removal(withVase, at(1, 3))).toEqual([withVase[1]])
    expect(removal(room, at(2, 3))).toEqual([room[0]])
  })

  it('길을 막아 안에 갇히게 되는 배치는 거절한다', () => {
    // 들어와 서는 칸·문깔개 둘레를 다섯 칸 막으면, 안쪽 가구는 닿을 칸이 없어 놓을 수 없다
    let room: Furniture[] = []
    for (const [dx, dy] of [[4, 3], [3, 4], [5, 4], [3, 5], [5, 5]] as const) room = put(room, 'stool', dx, dy)!
    expect(placement(room, 'stool', at(1, 3), undefined, ctx)).toBeNull()
    expect(placement(room, 'stool', at(6, 2), undefined, ctx)).toBeNull()
    // 막지 않은 방에서는 같은 자리가 된다
    expect(placement([], 'stool', at(1, 3), undefined, ctx)).not.toBeNull()
    // 문깔개에서 문 앞에는 늘 닿는다
    const solid = new Set(room.flatMap((f) => footprint(f).map((p) => `${p.x},${p.y}`)))
    expect(findPath(slot.entry, slot.exit, solid)).not.toBeNull()
  })

  it('방 모양에 맞지 않는 가구는 가방으로 (refitRoom)', () => {
    const ok = placement([], 'stool', at(2, 3), undefined, ctx)!
    const bad: Furniture = { item: 'stool', x: slot.entry.x, y: slot.entry.y }
    const out = refitRoom([ok, bad], { jar: 1 }, ctx)
    expect(out.room).toEqual([ok])
    expect(out.inv).toEqual({ jar: 1, stool: 1 })
  })

  it('가구 정의는 집과 같은 표를 쓴다 (새 가구 종류가 없다)', () => {
    expect(FURNITURE_DEFS.stool).toBeDefined()
    expect(Object.keys(FURNITURE_DEFS).length).toBeGreaterThan(20)
  })
})

// ── 상태 수준 ──

function land(extra: Partial<GameState> = {}): GameState {
  const base = newGame(CONTENT)
  const g: GameState = {
    ...base,
    scenes: [],
    clock: { day: 10, minute: 10 * 60 },
    coins: 5000,
    inv: { olive: 40, papyrus: 40, reed: 40, table: 1, stool: 3, rug: 1, vase: 2, cushion: 9, jar: 9 },
    flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1 },
    map: 'newland',
    player: { ...base.player, x: NEWLAND_PORTAL_FRONT.x, y: NEWLAND_PORTAL_FRONT.y, path: [] },
    ...extra,
  }
  syncHome(g)
  return g
}
const must = <T,>(v: T | null): T => {
  expect(v).not.toBeNull()
  return v as T
}
const buy = (s: GameState, kind: 'home' | 'courtyard', x: number, y: number, facing: Build['facing'] = 'down'): GameState => {
  const n = must(orderBuild(s, kind, x, y, facing))
  syncHome(n)
  return n
}
/** 입주 주택 둘을 지어 완공까지 (b1 = 방 칸 0, b2 = 방 칸 1) */
function twoHomes(): GameState {
  let s = buy(land(), 'home', 8, 11)
  s = buy(s, 'home', 20, 11)
  s = advanceBuilds({ ...s, clock: { ...s.clock, day: s.clock.day + 2 } })
  syncHome(s)
  return s
}
const stand = (s: GameState, t: { x: number; y: number }): GameState => {
  const n = { ...s, player: { ...s.player, x: t.x, y: t.y, path: [] } }
  syncHome(n)
  return n
}
const inRoom = (s: GameState, i: number) => stand(s, ROOM_SLOTS[i].entry)

describe('소유 공간별 저장', () => {
  it('입주 주택은 주문할 때 앞 방 칸을 받고, 그 칸은 저장에도 남는다', () => {
    const s = twoHomes()
    expect(buildsOf(s).map((b) => [b.id, b.slot])).toEqual([['b1', 0], ['b2', 1]])
    expect(homeAtSlot(s, 0)?.id).toBe('b1')
    expect(roomKeyFor('b1')).toBe('newland:b1')
    const loaded = must(deserialize(serialize(s), CONTENT))
    expect(buildsOf(loaded).map((b) => b.slot)).toEqual([0, 1])
  })

  it('입주 주택은 방 칸 수만큼만 — 셋째는 거절, 마당은 상관없다', () => {
    const s = twoHomes()
    expect(canPlace(s, 'home', 14, 20)).toBe('homes')
    expect(orderBuild(s, 'home', 14, 20, 'down')).toBeNull()
    expect(canPlace(s, 'courtyard', 14, 20)).toBeNull()
    expect(MAX_HOMES).toBeLessThanOrEqual(MAX_BUILDS)
  })

  it('문을 밟으면 방 안으로, 문깔개를 밟으면 문 앞으로 (완공된 뒤에만)', () => {
    setActiveMap('newland')
    const ordered = buy(land(), 'home', 8, 11)
    const d = doorOf('home', 8, 11, 'down')!
    expect(newlandWarp(d.door)).toBeUndefined()
    const s = advanceBuilds({ ...ordered, clock: { ...ordered.clock, day: ordered.clock.day + 2 } })
    syncHome(s)
    expect(newlandWarp(d.door)).toEqual(ROOM_SLOTS[0].entry)
    expect(warpAt(ROOM_SLOTS[0].exit)).toEqual(d.front)
    const gone = must(demolishBuild(s, 'b1'))
    syncHome(gone)
    expect(newlandWarp(d.door)).toBeUndefined()
  })

  it('방 안에서 놓기·돌리기·옮기기·치우기는 그 건물의 가구만 바꾸고 첫 마을 집은 그대로다', () => {
    const base = twoHomes()
    const home = base.room
    let s = inRoom(base, 0)
    expect(inBuildingRoom(s)).toBe(true)
    const r = ROOM_SLOTS[0]
    s = must(placeFurniture(s, 'table', { x: r.x0 + 1, y: r.y0 + 3 }))
    expect(s.rooms?.['newland:b1']).toHaveLength(1)
    expect(s.room).toBe(home)
    expect(s.inv.table ?? 0).toBe(0)
    s = must(rotateFurniture(s, roomOf(s)[0]))
    expect(roomOf(s)[0].facing).toBe('right')
    s = must(moveFurniture(s, roomOf(s)[0], { x: r.x0 + 5, y: r.y0 + 3 }))
    expect(roomOf(s)[0]).toMatchObject({ x: r.x0 + 5, y: r.y0 + 3 })
    s = must(placeFurniture(s, 'vase', { x: r.x0 + 5, y: r.y0 + 3 }))
    expect(roomOf(s)).toHaveLength(2)
    // 위에 올린 꽃병이 먼저 치워지고, 그다음 탁자
    const gone2 = removeFurniture(s, { x: r.x0 + 5, y: r.y0 + 3 })
    expect(roomOf(gone2)).toHaveLength(1)
    expect(gone2.inv.vase).toBe(2)
    const gone3 = removeFurniture(gone2, { x: r.x0 + 5, y: r.y0 + 3 })
    expect(roomOf(gone3)).toHaveLength(0)
    expect(gone3.rooms?.['newland:b1']).toBeUndefined()
    expect(gone3.inv.table).toBe(1)
    expect(gone3.room).toBe(home)
  })

  it('방 밖(바깥 땅)에서는 꾸밀 방이 없다', () => {
    const s = twoHomes()
    expect(roomTarget(s)).toBeUndefined()
    expect(placeFurniture(s, 'stool', { x: 10, y: 20 })).toBeNull()
    expect(roomOf(s)).toEqual([])
  })

  it('두 집은 서로의 가구를 모른다', () => {
    let s = inRoom(twoHomes(), 0)
    s = must(placeFurniture(s, 'stool', { x: ROOM_SLOTS[0].x0 + 1, y: ROOM_SLOTS[0].y0 + 3 }))
    expect(roomOf(s)).toHaveLength(1)
    const other = inRoom(s, 1)
    expect(roomOf(other)).toEqual([])
    const placed = must(placeFurniture(other, 'stool', { x: ROOM_SLOTS[1].x0 + 2, y: ROOM_SLOTS[1].y0 + 4 }))
    expect(Object.keys(placed.rooms ?? {}).sort()).toEqual(['newland:b1', 'newland:b2'])
    expect(roomOf(inRoom(placed, 0))).toHaveLength(1)
    // 다른 집의 칸에는 놓을 수 없다 (칸이 다르면 좌표가 맞지 않는다)
    expect(placeFurniture(inRoom(s, 1), 'stool', { x: ROOM_SLOTS[0].x0 + 2, y: ROOM_SLOTS[0].y0 + 4 })).toBeNull()
  })

  it('첫 마을 집(room)과 새 터 집(rooms)은 같은 칸을 쓰지 않는다', () => {
    const s = twoHomes()
    const village: GameState = { ...s }
    delete village.map
    syncHome(village)
    expect(roomTarget(village)?.key).toBeNull()
    expect(roomOf(village)).toBe(village.room)
    expect(roomOf(inRoom(s, 0))).not.toBe(s.room)
  })

  it('문 앞 배치는 상태 수준에서도 거절하고, 가방에 없는 물건은 놓지 않는다', () => {
    let s = inRoom(twoHomes(), 0)
    s = must(placeFurniture(s, 'stool', { x: ROOM_SLOTS[0].x0 + 1, y: ROOM_SLOTS[0].y0 + 3 }))
    expect(placeFurniture(s, 'stool', ROOM_SLOTS[0].entry)).toBeNull()
    expect(placeFurniture({ ...s, inv: {} }, 'stool', { x: ROOM_SLOTS[0].x0 + 2, y: ROOM_SLOTS[0].y0 + 3 })).toBeNull()
  })

  const stuffed = (): GameState => {
    let s = inRoom(twoHomes(), 0)
    const r = ROOM_SLOTS[0]
    s = must(placeFurniture(s, 'stool', { x: r.x0 + 1, y: r.y0 + 3 }))
    s = must(placeFurniture(s, 'stool', { x: r.x0 + 2, y: r.y0 + 3 }))
    s = must(placeFurniture(s, 'stool', { x: r.x0 + 6, y: r.y0 + 3 }))
    s = must(placeFurniture(s, 'table', { x: r.x0 + 1, y: r.y0 + 5 }))
    return { ...s, inv: { ...s.inv, stool: 7 } }
  }

  it('철거하면 안의 가구가 가방 한도까지 가방으로, 궤짝이 없으면 남는 것도 사라지지 않고 가방에 얹힌다', () => {
    const out = must(demolishBuild(stuffed(), 'b1'))
    expect(out.inv.stool).toBe(10)
    expect(out.inv.table).toBe(1)
    expect(out.rooms).toBeUndefined()
  })

  it('철거하면 가방이 가득 찬 만큼은 궤짝으로 (궤짝이 있을 때)', () => {
    const s = { ...stuffed(), flags: { ...stuffed().flags, 'unlock:supplyChest': 1 }, chest: { stool: 2 } }
    const out = must(demolishBuild(s, 'b1'))
    expect(out.inv.stool).toBe(9)
    expect(out.chest?.stool).toBe(3)
    expect(out.inv.table).toBe(1)
    expect(out.rooms).toBeUndefined()
  })

  it('다른 집의 가구는 철거해도 그대로다', () => {
    let s = inRoom(twoHomes(), 1)
    s = must(placeFurniture(s, 'stool', { x: ROOM_SLOTS[1].x0 + 2, y: ROOM_SLOTS[1].y0 + 3 }))
    const out = must(demolishBuild(s, 'b1'))
    expect(out.rooms?.['newland:b2']).toHaveLength(1)
  })

  it('공사 중 취소도 안의 가구를 가방으로 (남은 기록이 없다)', () => {
    const s = buy(land(), 'home', 8, 11)
    const withRoom: GameState = { ...s, rooms: { 'newland:b1': [{ item: 'stool', x: ROOM_SLOTS[0].x0 + 1, y: ROOM_SLOTS[0].y0 + 3 }] } }
    const out = must(cancelBuild(withRoom, 'b1'))
    expect(out.rooms).toBeUndefined()
    expect(out.inv.stool).toBe((withRoom.inv.stool ?? 0) + 1)
  })
})

describe('저장과 불러오기', () => {
  it('저장하고 불러오면 방의 가구가 같은 방에 그대로 있다', () => {
    let s = inRoom(twoHomes(), 1)
    const r = ROOM_SLOTS[1]
    s = must(placeFurniture(s, 'table', { x: r.x0 + 1, y: r.y0 + 3 }))
    s = must(placeFurniture(s, 'vase', { x: r.x0 + 1, y: r.y0 + 3 }))
    const loaded = must(deserialize(serialize(s), CONTENT))
    expect(loaded.rooms).toEqual(s.rooms)
    expect(loaded.rooms?.['newland:b1']).toBeUndefined()
    syncHome(loaded)
    expect(roomOf(loaded)).toHaveLength(2)
  })

  it('옛 저장(rooms 없음)은 그대로 열리고 칸을 만들지 않는다', () => {
    const raw = JSON.parse(serialize(twoHomes())) as Record<string, unknown>
    delete raw.rooms
    const loaded = must(deserialize(JSON.stringify(raw), CONTENT))
    expect(loaded.rooms).toBeUndefined()
    expect(buildsOf(loaded)).toHaveLength(2)
    // 건물이 없는 옛 저장도
    const plain = JSON.parse(serialize(newGame(CONTENT))) as Record<string, unknown>
    expect('rooms' in must(deserialize(JSON.stringify(plain), CONTENT))).toBe(false)
  })

  it('작업 6의 저장(건물에 칸 번호 없음)은 앞 빈 칸부터 잇는다', () => {
    const raw = JSON.parse(serialize(twoHomes())) as { newland: { builds: Record<string, unknown>[] } }
    for (const b of raw.newland.builds) delete b.slot
    const loaded = must(deserialize(JSON.stringify(raw), CONTENT))
    expect(buildsOf(loaded).map((b) => b.slot)).toEqual([0, 1])
  })

  it('주인 없는 방·모르는 키·깨진 가구는 가방으로 돌아가거나 버려진다', () => {
    const base = inRoom(twoHomes(), 0)
    const raw = JSON.parse(serialize(base)) as Record<string, unknown>
    const r = ROOM_SLOTS[0]
    raw.rooms = {
      'newland:b1': [
        { item: 'stool', x: r.x0 + 1, y: r.y0 + 3 },
        { item: 'stool', x: r.entry.x, y: r.entry.y }, // 문 앞 — 지금 규칙으로 못 놓는다
        { item: 'noSuchThing', x: 1, y: 1 },
        { item: 'stool', x: 'a', y: 2 },
      ],
      'newland:b9': [{ item: 'table', x: r.x0 + 1, y: r.y0 + 3 }], // 없는 건물
      weird: [{ item: 'vase', x: 1, y: 1 }],
    }
    const bag = base.inv.stool ?? 0
    const loaded = must(deserialize(JSON.stringify(raw), CONTENT))
    expect(Object.keys(loaded.rooms ?? {})).toEqual(['newland:b1'])
    expect(loaded.rooms!['newland:b1']).toHaveLength(1)
    expect(loaded.inv.stool).toBe(bag + 1)
    expect(loaded.inv.table).toBe((base.inv.table ?? 0) + 1)
  })

  it('건물이 지워진 방 칸에 서 있던 저장은 새 터 입구 앞에서 시작한다', () => {
    const s = twoHomes()
    const raw = JSON.parse(serialize(inRoom(s, 0))) as { newland: { builds: Record<string, unknown>[] } }
    raw.newland.builds = raw.newland.builds.filter((b) => b.id !== 'b1')
    const loaded = must(deserialize(JSON.stringify(raw), CONTENT))
    expect([Math.round(loaded.player.x), Math.round(loaded.player.y)]).toEqual([NEWLAND_PORTAL_FRONT.x, NEWLAND_PORTAL_FRONT.y])
  })

  it('건물 8채·가구 80개여도 저장 길이가 관리된다', () => {
    let s = twoHomes()
    for (const [x, y] of [[8, 18], [14, 18], [20, 18], [26, 18], [14, 11], [26, 11]] as const) s = buy(s, 'courtyard', x, y)
    expect(buildsOf(s)).toHaveLength(8)
    // 방마다 가구 40개: 바닥 깔개 31칸 + 그 위 작은 물건 9
    const rooms: Record<string, Furniture[]> = {}
    for (const [i, key] of ['newland:b1', 'newland:b2'].entries()) {
      const r = ROOM_SLOTS[i]
      const list: Furniture[] = []
      for (let y = r.y0 + 2; y < r.y0 + r.h; y++) for (let x = r.x0; x < r.x0 + r.w; x++) if (!(x === r.exit.x && y === r.exit.y)) list.push({ item: 'cushion', x, y })
      for (let k = 0; k < 9; k++) list.push({ item: 'jar', x: r.x0 + (k % 8), y: r.y0 + 2 + Math.floor(k / 8) })
      rooms[key] = list
    }
    expect(rooms['newland:b1'].length + rooms['newland:b2'].length).toBe(80)
    const full: GameState = { ...s, rooms }
    const json = serialize(full)
    const loaded = must(deserialize(json, CONTENT))
    expect(Object.values(loaded.rooms ?? {}).reduce((n, l) => n + l.length, 0)).toBe(80)
    const slice = JSON.stringify({ newland: full.newland, rooms: full.rooms })
    expect(slice.length).toBeLessThan(9000)
    expect(json.length).toBeLessThan(400_000)
  })
})

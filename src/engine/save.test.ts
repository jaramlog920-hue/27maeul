// 계획 20 작업 3: 두 지도 저장 — 맵·마지막 자리, 옛 저장, 잘못된 값
import { CONTENT } from '../content/catalog'
import { newGame, playerTile, syncHome, travel, type GameState } from './game'
import { currentMapId, setActiveMap } from './maps'
import { setNewlandOpen } from './newland'
import { ARCHIVE, INTERIOR_ENTRY, NEWLAND_PORTAL_FRONT, VILLAGE_PORTAL_FRONT } from './newland-config'
import { deserialize, serialize } from './save'
import { HOME_FRONT, tileAt, walkableOn } from './world'

afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
})

function opened(extra: Partial<GameState> = {}): GameState {
  const base = newGame(CONTENT)
  const g: GameState = {
    ...base,
    scenes: [],
    clock: { day: 5, minute: 10 * 60 },
    flags: { ...base.flags, newlandGift: 1 },
    player: { ...base.player, x: VILLAGE_PORTAL_FRONT.x, y: VILLAGE_PORTAL_FRONT.y, path: [] },
    ...extra,
  }
  syncHome(g)
  return g
}

/** 저장 글자를 고쳐 불러온다 (손으로 고친 저장·다른 버전이 남긴 값) */
function reload(s: GameState, edit: (o: Record<string, unknown>) => void): GameState {
  const o = JSON.parse(serialize(s)) as Record<string, unknown>
  edit(o)
  return deserialize(JSON.stringify(o), CONTENT)!
}

describe('두 지도 저장', () => {
  it('옛 저장(map 없음)은 첫 마을이고 위치도 그대로', () => {
    const s = opened({ player: { ...opened().player, x: 20, y: 17 } })
    const raw = JSON.parse(serialize(s)) as Record<string, unknown>
    expect('map' in raw).toBe(false)
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.map).toBeUndefined()
    expect(back.mapAt).toBeUndefined()
    expect(playerTile(back)).toEqual({ x: 20, y: 17 })
    expect(currentMapId()).toBe('village')
  })

  it('새 터에서 저장 → 불러오기: 맵과 칸이 그대로, 서고 문 앞도 유효한 칸', () => {
    const there = travel(opened(), 'newland', CONTENT)
    for (const at of [NEWLAND_PORTAL_FRONT, ARCHIVE.front, INTERIOR_ENTRY, { x: 12, y: 15 }]) {
      const back = deserialize(serialize({ ...there, flags: { ...there.flags, newlandRevealed: 1 }, player: { ...there.player, x: at.x, y: at.y, path: [] } }), CONTENT)!
      expect(back.map, JSON.stringify(at)).toBe('newland')
      expect(playerTile(back)).toEqual(at)
      expect(currentMapId()).toBe('newland')
      expect(walkableOn('newland', playerTile(back))).toBe(true)
    }
  })

  it('왕복 저장에서 떠난 지도의 자리(mapAt)가 유지된다', () => {
    const base = opened({ player: { ...opened().player, x: 22, y: 17 } })
    const there = travel(base, 'newland', CONTENT)
    const back = deserialize(serialize(there), CONTENT)!
    expect(back.mapAt).toEqual({ village: { x: 22, y: 17 } })
    const home = deserialize(serialize(travel(back, 'village', CONTENT)), CONTENT)!
    expect(home.map).toBe('village')
    expect(home.mapAt?.village).toEqual({ x: 22, y: 17 })
    expect(playerTile(home)).toEqual(VILLAGE_PORTAL_FRONT)
  })

  it('열리지 않은 새 터(선물 없음)·모르는 값이면 첫 마을로, 위치는 마지막 첫 마을 자리 또는 집 앞', () => {
    const there = travel(opened(), 'newland', CONTENT)
    const noGift = reload(there, (o) => {
      ;(o.flags as Record<string, number>).newlandGift = 0
    })
    expect(noGift.map).toBe('village')
    expect(playerTile(noGift)).toEqual(VILLAGE_PORTAL_FRONT)
    expect(currentMapId()).toBe('village')
    // 마지막 자리가 없으면 집 앞
    const noAt = reload(there, (o) => {
      ;(o.flags as Record<string, number>).newlandGift = 0
      delete o.mapAt
    })
    expect(playerTile(noAt)).toEqual(HOME_FRONT)
    const unknown = reload(opened(), (o) => {
      o.map = 'mars'
    })
    expect(unknown.map).toBeUndefined()
    const typo = reload(opened(), (o) => {
      o.map = 7
    })
    expect(typo.map).toBeUndefined()
  })

  it('새 터 칸이 걸을 수 없거나 범위 밖이면 새 터 입구 앞으로', () => {
    const there = travel(opened(), 'newland', CONTENT)
    for (const bad of [{ x: 0, y: 0 }, { x: 18, y: 4 }, { x: 47, y: 17 }, { x: 5, y: 80 }, { x: -3, y: 4 }]) {
      const back = reload(there, (o) => {
        o.player = { ...(o.player as object), ...bad }
      })
      expect(back.map, JSON.stringify(bad)).toBe('newland')
      expect(playerTile(back), JSON.stringify(bad)).toEqual(NEWLAND_PORTAL_FRONT)
    }
  })

  it('mapAt의 칸이 그 지도에서 걸을 수 없거나 범위 밖이면 그 지도의 입구 앞으로', () => {
    const there = travel(opened(), 'newland', CONTENT)
    const back = reload(there, (o) => {
      o.mapAt = { village: { x: 0, y: 0 }, newland: { x: 999, y: 4 } }
    })
    expect(back.mapAt).toEqual({ village: VILLAGE_PORTAL_FRONT, newland: NEWLAND_PORTAL_FRONT })
    const ok = reload(there, (o) => {
      o.mapAt = { village: { x: 20, y: 17 } }
    })
    expect(ok.mapAt).toEqual({ village: { x: 20, y: 17 } })
    const junk = reload(there, (o) => {
      o.mapAt = { village: 'here', newland: null, mars: { x: 1, y: 1 } }
    })
    expect(junk.mapAt?.village).toEqual(VILLAGE_PORTAL_FRONT)
    expect('mars' in (junk.mapAt ?? {})).toBe(false)
  })

  it('불러온 뒤에도 같은 상태를 다시 저장해도 같다 (왕복해도 변하지 않는다)', () => {
    const there = travel(opened(), 'newland', CONTENT)
    const once = deserialize(serialize(there), CONTENT)!
    const twice = deserialize(serialize(once), CONTENT)!
    expect(twice.map).toBe('newland')
    expect(twice.mapAt).toEqual(once.mapAt)
    expect(twice.player).toEqual(once.player)
    expect(tileAt(twice.player.x, twice.player.y)).not.toBe('T')
  })
})

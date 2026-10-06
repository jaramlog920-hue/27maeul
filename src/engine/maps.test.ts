// 계획 20 작업 3: 두 지도의 크기·칸·입구·서고 자리
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SITES } from './village-sites'
import { findPath } from './movement'
import { currentMapId, mapHeight, mapVisibleHeight, mapWidth, setActiveMap } from './maps'
import { NEWLAND_MAP, inArchiveRoom, newlandOpen, newlandTileAt, newlandWarp, portalAt, setNewlandOpen } from './newland'
import {
  ARCHIVE, BUILD_RECT, INTERIOR, INTERIOR_DESK, INTERIOR_ENTRY, INTERIOR_EXIT, INTERIOR_SHELF, NEWLAND_H, NEWLAND_PORTAL, NEWLAND_PORTAL_FRONT, NEWLAND_VISIBLE_H, NEWLAND_W,
  VILLAGE_PORTAL, VILLAGE_PORTAL_FRONT,
} from './newland-config'
import {
  BED_STAND, HEIGHT, HOME_DOOR, HOME_ENTRY, HOME_FRONT, HOME_ROOM, HOUSES, isIndoor, isWalkable, lockedTiles, MAP, PLACES, ROOMS, tileAt, VILLAGE_H, walkableOn, WIDTH, warpAt, zoneAt, ZONES,
} from './world'

afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
})

describe('지도 크기', () => {
  it('첫 마을의 크기는 그대로 (48 × 120, 보이는 40줄)', () => {
    expect([mapWidth(), mapHeight(), mapVisibleHeight()]).toEqual([48, 120, 40])
    expect([WIDTH, HEIGHT, VILLAGE_H]).toEqual([48, 120, 40])
    expect(MAP).toHaveLength(HEIGHT)
  })
  it('새 터는 40 × 40줄, 보이는 땅 30줄 + 안 방 10줄', () => {
    setActiveMap('newland')
    expect(currentMapId()).toBe('newland')
    expect([mapWidth(), mapHeight(), mapVisibleHeight()]).toEqual([40, 40, 30])
    expect(NEWLAND_MAP).toHaveLength(NEWLAND_H)
    for (const row of NEWLAND_MAP) expect(row).toHaveLength(NEWLAND_W)
    expect(NEWLAND_VISIBLE_H + INTERIOR.h).toBe(NEWLAND_H)
  })
  it('새 터에 있으면 tileAt이 새 터 칸을 돌려주고, 나가면 첫 마을 칸', () => {
    const village = tileAt(0, 0)
    setActiveMap('newland')
    expect(tileAt(ARCHIVE.door.x, ARCHIVE.door.y)).toBe('D')
    expect(tileAt(NEWLAND_W, 0)).toBe('T')
    setActiveMap('village')
    expect(tileAt(0, 0)).toBe(village)
  })
})

describe('새 터 칸 구성', () => {
  it('가장자리는 숲, 서고 바깥은 돌벽과 문', () => {
    for (let x = 0; x < NEWLAND_W; x++) {
      expect(newlandTileAt(x, 0)).toBe('T')
      expect(newlandTileAt(x, NEWLAND_VISIBLE_H - 1)).toBe('T')
    }
    for (let y = 0; y < NEWLAND_VISIBLE_H; y++) {
      expect(newlandTileAt(0, y)).toBe('T')
      expect(newlandTileAt(NEWLAND_W - 1, y)).toBe('T')
    }
    for (let y: number = ARCHIVE.y0 + 1; y <= ARCHIVE.y0 + ARCHIVE.h; y++)
      for (let x: number = ARCHIVE.x0; x < ARCHIVE.x0 + ARCHIVE.w; x++)
        expect(newlandTileAt(x, y), `${x},${y}`).toBe(x === ARCHIVE.door.x && y === ARCHIVE.door.y ? 'D' : 'S')
    // 북쪽 가운데
    expect(ARCHIVE.x0 + ARCHIVE.w / 2).toBe(NEWLAND_W / 2)
    expect(ARCHIVE.y0).toBeLessThan(NEWLAND_VISIBLE_H / 3)
  })

  it('서고 자리는 자산 manifest의 archive footprint·entry에서 읽은 값과 맞다', () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'assets/old-testament-generations/manifest.json'), 'utf8')) as {
      tileSize: number
      items: { id: string; group: string; facing?: string; visualTiles?: { w: number; h: number }; footprint?: { w: number; h: number }; entry?: { x: number; y: number } | null }[]
    }
    const a = manifest.items.find((i) => i.id === 'archive' && i.group === 'buildings' && i.facing === 'down')!
    expect(a.footprint).toEqual({ w: ARCHIVE.w, h: ARCHIVE.h })
    expect(a.visualTiles).toEqual({ w: ARCHIVE.w, h: ARCHIVE.h + 1 })
    // entry 화소 → 그림 안의 칸. 가로는 4칸 폭 가운데 두 칸 중 오른쪽 칸(엔진 문), 세로는 맨 아랫줄
    const col = Math.floor(a.entry!.x / manifest.tileSize)
    const row = Math.floor(a.entry!.y / manifest.tileSize)
    expect(ARCHIVE.door).toEqual({ x: ARCHIVE.x0 + col, y: ARCHIVE.y0 + row })
    expect(row).toBe(ARCHIVE.h)
    expect(ARCHIVE.front).toEqual({ x: ARCHIVE.door.x, y: ARCHIVE.door.y + 1 })
  })

  it('건축 가능 구역은 28×18 빈 풀밭이고 서고·길·입구와 겹치지 않는다', () => {
    expect(BUILD_RECT.x1 - BUILD_RECT.x0 + 1).toBe(28)
    expect(BUILD_RECT.y1 - BUILD_RECT.y0 + 1).toBe(18)
    for (let y = BUILD_RECT.y0; y <= BUILD_RECT.y1; y++)
      for (let x = BUILD_RECT.x0; x <= BUILD_RECT.x1; x++) expect(newlandTileAt(x, y), `${x},${y}`).toBe('.')
    expect(BUILD_RECT.y1).toBeLessThan(NEWLAND_VISIBLE_H - 1)
  })

  it('서고 안 방: 벽·바닥·문깔개, 책상·책장 칸과 서는 자리가 있고 서로 이어진다', () => {
    setActiveMap('newland')
    expect(newlandTileAt(INTERIOR_EXIT.x, INTERIOR_EXIT.y)).toBe('E')
    expect(tileAt(INTERIOR_DESK.tile.x, INTERIOR_DESK.tile.y)).toBe('d')
    expect(tileAt(INTERIOR_SHELF.tile.x, INTERIOR_SHELF.tile.y)).toBe('s')
    expect(isWalkable(INTERIOR_DESK.tile)).toBe(false)
    expect(isWalkable(INTERIOR_SHELF.tile)).toBe(false)
    for (const t of [INTERIOR_DESK.stand, INTERIOR_SHELF.stand, INTERIOR_ENTRY, INTERIOR_EXIT]) {
      expect(isWalkable(t), `${t.x},${t.y}`).toBe(true)
      expect(isIndoor(t)).toBe(true)
      expect(inArchiveRoom(t)).toBe(true)
    }
    // 문 앞 → 문(들어감) → 안쪽 책상·책장 앞, 문깔개(나감) 모두 걸어 닿는다
    expect(findPath(ARCHIVE.front, ARCHIVE.door)).not.toBeNull()
    expect(newlandWarp(ARCHIVE.door)).toEqual(INTERIOR_ENTRY)
    expect(findPath(INTERIOR_ENTRY, INTERIOR_DESK.stand)).not.toBeNull()
    expect(findPath(INTERIOR_ENTRY, INTERIOR_SHELF.stand)).not.toBeNull()
    expect(findPath(INTERIOR_ENTRY, INTERIOR_EXIT)).not.toBeNull()
    expect(newlandWarp(INTERIOR_EXIT)).toEqual(ARCHIVE.front)
    expect(warpAt(ARCHIVE.door)).toEqual(INTERIOR_ENTRY)
    // 방 밖에서는 방 안이 아니다
    expect(inArchiveRoom({ x: INTERIOR.x0 - 1, y: INTERIOR.y0 })).toBe(false)
    expect(inArchiveRoom(ARCHIVE.front)).toBe(false)
  })
})

describe('입구', () => {
  it('두 입구 칸은 모두 걸을 수 있고, 서로 다른 지도의 다른 자리다', () => {
    expect(walkableOn('village', VILLAGE_PORTAL)).toBe(true)
    expect(walkableOn('village', VILLAGE_PORTAL_FRONT)).toBe(true)
    expect(walkableOn('newland', NEWLAND_PORTAL)).toBe(true)
    expect(walkableOn('newland', NEWLAND_PORTAL_FRONT)).toBe(true)
    expect(VILLAGE_PORTAL).not.toEqual(NEWLAND_PORTAL)
    expect(VILLAGE_PORTAL_FRONT).not.toEqual(VILLAGE_PORTAL)
    expect(NEWLAND_PORTAL_FRONT).not.toEqual(NEWLAND_PORTAL)
  })

  it('첫 마을 입구는 동쪽 테두리 가까이(y 14–18)이고 구역·잠금·시설·집 문·장소와 겹치지 않는다', () => {
    expect(VILLAGE_PORTAL.x).toBeGreaterThanOrEqual(WIDTH - 3)
    expect(VILLAGE_PORTAL.y).toBeGreaterThanOrEqual(14)
    expect(VILLAGE_PORTAL.y).toBeLessThanOrEqual(18)
    for (const t of [VILLAGE_PORTAL, VILLAGE_PORTAL_FRONT]) {
      const k = `${t.x},${t.y}`
      expect(zoneAt(t), `구역 ${k}`).toBeNull()
      expect(lockedTiles(0).has(k), `잠금 ${k}`).toBe(false)
      for (const z of ZONES) expect(t.x >= z.x0 && t.x <= z.x1 && t.y >= z.y0 && t.y <= z.y1).toBe(false)
      for (const site of Object.values(SITES)) {
        expect(site.tiles.some((s) => s.x === t.x && s.y === t.y), `시설 ${k}`).toBe(false)
        if (site.stand) expect(site.stand.x === t.x && site.stand.y === t.y).toBe(false)
      }
      for (const h of HOUSES) expect(t.x === h.doorX && t.y === h.y1, `집 문 ${k}`).toBe(false)
      for (const r of ROOMS) expect(t.x === r.door.x && t.y === r.door.y).toBe(false)
      expect(t.x === HOME_DOOR.x && t.y === HOME_DOOR.y).toBe(false)
      for (const p of Object.values(PLACES)) {
        expect(p.tiles.some((s) => s.x === t.x && s.y === t.y), `장소 ${k}`).toBe(false)
        if (p.stand) expect(p.stand.x === t.x && p.stand.y === t.y).toBe(false)
      }
    }
  })

  it('개방 전에는 입구가 없고(그냥 길), 개방 뒤에는 표식이 선다', () => {
    expect(newlandOpen()).toBe(false)
    expect(tileAt(VILLAGE_PORTAL.x, VILLAGE_PORTAL.y)).toBe(',')
    expect(portalAt(VILLAGE_PORTAL)).toBeNull()
    setNewlandOpen(true)
    expect(tileAt(VILLAGE_PORTAL.x, VILLAGE_PORTAL.y)).toBe('>')
    expect(portalAt(VILLAGE_PORTAL)).toBe('newland')
    expect(isWalkable(VILLAGE_PORTAL)).toBe(true)
    // 다른 칸은 입구가 아니다
    expect(portalAt(VILLAGE_PORTAL_FRONT)).toBeNull()
    setNewlandOpen(false)
    expect(tileAt(VILLAGE_PORTAL.x, VILLAGE_PORTAL.y)).toBe(',')
  })

  it('침대에서 집 문 앞을 거쳐 입구까지 길찾기로 닿는다 (집 단계 0)', () => {
    setNewlandOpen(true)
    const locked = lockedTiles(0)
    const bed = PLACES.bed.stand ?? BED_STAND
    expect(findPath(bed, HOME_ROOM.exit)).not.toBeNull()
    expect(findPath(HOME_ENTRY, HOME_ROOM.exit)).not.toBeNull()
    // 문깔개를 밟으면 문 앞으로 나온다
    expect(warpAt(HOME_ROOM.exit)).toEqual(HOME_FRONT)
    expect(findPath(HOME_FRONT, VILLAGE_PORTAL_FRONT, locked)).not.toBeNull()
    expect(findPath(HOME_FRONT, VILLAGE_PORTAL, locked)).not.toBeNull()
  })

  it('새 터에서는 입구에서 서고 문 앞까지 길로 닿는다', () => {
    setActiveMap('newland')
    expect(portalAt(NEWLAND_PORTAL)).toBe('village')
    expect(portalAt(NEWLAND_PORTAL_FRONT)).toBeNull()
    expect(findPath(NEWLAND_PORTAL_FRONT, ARCHIVE.front)).not.toBeNull()
    expect(findPath(NEWLAND_PORTAL_FRONT, { x: BUILD_RECT.x0, y: BUILD_RECT.y0 })).not.toBeNull()
    expect(findPath(NEWLAND_PORTAL_FRONT, { x: BUILD_RECT.x1, y: BUILD_RECT.y1 })).not.toBeNull()
  })
})

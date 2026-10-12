// 2026-10-13 구약맵 점검(docs/playtest-구약맵-2026-10-13.md)에서 고친 것: 넘어가는 길·외딴 나무·집 색 고르기
import { CONTENT } from '../content/catalog'
import { newGame, syncHome, type GameState } from './game'
import { setActiveMap } from './maps'
import { NEWLAND_MAP, setNewlandOpen } from './newland'
import { areaOf, canPlace, costOf, doorOf, orderBuild, sanitizeNewlandBuild } from './newland-build'
import { NEWLAND_PORTAL, NEWLAND_PORTAL_FRONT, VILLAGE_PORTAL } from './newland-config'
import { HOUSE_ROOFS, HOUSE_WALLS, sanitizeLook } from './newland-house-look'
import { tileAt } from './world'

afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
})

describe('구약 터로 넘어가는 길', () => {
  it('열리기 전에는 큰길 끝부터 숲까지 풀·나무 그대로', () => {
    setNewlandOpen(false)
    for (let x = 41; x <= VILLAGE_PORTAL.x; x++) expect(tileAt(x, VILLAGE_PORTAL.y)).toBe('.')
    expect(tileAt(VILLAGE_PORTAL.x + 1, VILLAGE_PORTAL.y)).toBe('T')
  })
  it('열린 뒤에는 큰길에서 표식까지 길이 이어지고 표식 뒤 나무가 걷힌다', () => {
    setNewlandOpen(true)
    for (let x = 36; x < VILLAGE_PORTAL.x; x++) expect(tileAt(x, VILLAGE_PORTAL.y)).toBe(',')
    expect(tileAt(VILLAGE_PORTAL.x, VILLAGE_PORTAL.y)).toBe('>')
    expect(tileAt(VILLAGE_PORTAL.x + 1, VILLAGE_PORTAL.y)).toBe(',')
    // 위아래 숲은 그대로
    expect(tileAt(VILLAGE_PORTAL.x + 1, VILLAGE_PORTAL.y - 1)).toBe('T')
    expect(tileAt(VILLAGE_PORTAL.x + 1, VILLAGE_PORTAL.y + 1)).toBe('T')
  })
  it('새 터 쪽도 표식 뒤 숲 가장자리가 길로 열려 있고, 입구 아래 외딴 나무는 없다', () => {
    expect(NEWLAND_MAP[NEWLAND_PORTAL.y][0]).toBe(',')
    expect(NEWLAND_MAP[NEWLAND_PORTAL.y + 1][0]).toBe(',')
    expect(NEWLAND_MAP[NEWLAND_PORTAL.y - 1][0]).toBe('T')
    expect(NEWLAND_MAP[12][2]).toBe('.')
  })
})

describe('집 색 고르기', () => {
  function land(): GameState {
    const base = newGame(CONTENT)
    const g: GameState = {
      ...base,
      scenes: [],
      clock: { day: 10, minute: 600 },
      coins: 1000,
      inv: { olive: 9, papyrus: 9, reed: 9 },
      flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1 },
      map: 'newland',
      player: { ...base.player, x: NEWLAND_PORTAL_FRONT.x, y: NEWLAND_PORTAL_FRONT.y, path: [] },
    }
    syncHome(g)
    return g
  }

  it('지을 때 고른 지붕·벽 색이 집 기록에 남고 저장 정리를 거쳐도 그대로', () => {
    const s = orderBuild(land(), 'home', 10, 12, 'down', 1, { roof: 6, wall: 1 })!
    const b = s.newland!.builds[0]
    expect(b.look).toEqual({ roof: 6, wall: 1, window: 0, trim: 0 })
    const clean = sanitizeNewlandBuild(JSON.parse(JSON.stringify(s.newland)), 10)!
    expect(clean.builds[0].look).toEqual({ roof: 6, wall: 1, window: 0, trim: 0 })
  })
  it('손님집도 색을 고르고, 일터·마당은 색이 없다', () => {
    const s = orderBuild(land(), 'guest', 10, 12, 'down', 1, { roof: 2, wall: 0 })!
    expect(s.newland!.builds[0].look).toEqual({ roof: 2, wall: 0, window: 0, trim: 0 })
    const yard = orderBuild(land(), 'courtyard', 10, 12, 'down', 4, { roof: 2, wall: 0 })!
    expect(yard.newland!.builds[0].look).toBeUndefined()
  })
  it('없는 번호는 버린다 (기본 모습)', () => {
    expect(sanitizeLook({ roof: HOUSE_ROOFS.length, wall: 0 })).toBeUndefined()
    expect(sanitizeLook({ roof: 0, wall: HOUSE_WALLS.length })).toBeUndefined()
    expect(sanitizeLook({ roof: 1.5, wall: 0 })).toBeUndefined()
    expect(sanitizeLook('붉은')).toBeUndefined()
    const s = orderBuild(land(), 'home', 10, 12, 'down', 1, { roof: 99, wall: 0 })!
    expect(s.newland!.builds[0].look).toBeUndefined()
  })
})

describe('창 모양·장식', () => {
  it('고른 창·장식이 남고, 없는 번호는 기본(네모·없음)으로', () => {
    expect(sanitizeLook({ roof: 1, wall: 0, window: 2, trim: 1 })).toEqual({ roof: 1, wall: 0, window: 2, trim: 1 })
    expect(sanitizeLook({ roof: 1, wall: 0, window: 9, trim: -1 })).toEqual({ roof: 1, wall: 0, window: 0, trim: 0 })
  })
})

describe('집 단계 (1단계 4칸 · 2단계 6칸 · 3단계 8칸)', () => {
  function land(): GameState {
    const base = newGame(CONTENT)
    const g: GameState = {
      ...base, scenes: [], clock: { day: 10, minute: 600 }, coins: 5000, inv: { olive: 30, papyrus: 30, reed: 30 },
      flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1 }, map: 'newland',
      player: { ...base.player, x: NEWLAND_PORTAL_FRONT.x, y: NEWLAND_PORTAL_FRONT.y, path: [] },
    }
    syncHome(g)
    return g
  }
  it('단계마다 막히는 칸이 가로로 넓어지고 값이 오른다', () => {
    expect(areaOf('home', 10, 12, 4)).toHaveLength(12)
    expect(areaOf('home', 10, 12, 6)).toHaveLength(18)
    expect(areaOf('home', 10, 12, 8)).toHaveLength(24)
    expect(costOf('home', 6).coins).toBe(240)
    expect(costOf('home', 8).coins).toBe(330)
  })
  it('문: 아래 문은 본채 가운데, 오른쪽 문은 오른쪽 끝, 왼쪽 문은 왼쪽 끝', () => {
    expect(doorOf('home', 10, 12, 'down', 4)!.door).toEqual({ x: 12, y: 15 })
    expect(doorOf('home', 10, 12, 'down', 6)!.door).toEqual({ x: 12, y: 15 })
    expect(doorOf('home', 10, 12, 'down', 8)!.door).toEqual({ x: 14, y: 15 })
    expect(doorOf('home', 10, 12, 'right', 8)!.front).toEqual({ x: 18, y: 15 })
    expect(doorOf('home', 10, 12, 'left', 8)!.front).toEqual({ x: 9, y: 15 })
  })
  it('지은 단계가 기록·저장에 남고, 넓은 집 옆자리는 겹침', () => {
    const s = orderBuild(land(), 'home', 10, 12, 'down', 8)!
    expect(s.newland!.builds[0].size).toBe(8)
    syncHome(s)
    expect(canPlace(s, 'home', 15, 12)).toBe('overlap')
    const clean = sanitizeNewlandBuild(JSON.parse(JSON.stringify(s.newland)), 10)!
    expect(clean.builds[0].size).toBe(8)
    const one = orderBuild(land(), 'home', 10, 12, 'down', 4)!
    expect(one.newland!.builds[0].size).toBeUndefined()
  })
})

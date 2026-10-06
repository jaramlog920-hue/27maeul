// 계획 20 작업 6: 새 터 건축 — 놓기 검사, 주문·공사 하루, 환불, 저장, 필사와 무관
import { CONTENT } from '../content/catalog'
import { goToSleep, newGame, playerTile, settle, syncHome, travel, type GameState } from './game'
import { findPath } from './movement'
import { setActiveMap } from './maps'
import { setNewlandOpen } from './newland'
import {
  advanceBuilds, buildsOf, canOrder, canPlace, cancelBuild, clearTile, demolishBuild, doorOf, MAX_BUILDS, orderBuild, sanitizeNewlandBuild, tilesOf, type Build, type NewlandState,
} from './newland-build'
import { ARCHIVE, BUILD_RECT, INTERIOR_ENTRY, NEWLAND_PORTAL_FRONT } from './newland-config'
import { deserialize, serialize } from './save'
import { isWalkable, PLACES, tileAt } from './world'

afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
})

/** 새 터에 있고 땅이 드러난 저장 (닢·재료는 넉넉히) */
function land(extra: Partial<GameState> = {}): GameState {
  const base = newGame(CONTENT)
  const g: GameState = {
    ...base,
    scenes: [],
    clock: { day: 10, minute: 10 * 60 },
    coins: 1000,
    inv: { olive: 9, papyrus: 9, reed: 9 },
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

/** 집을 놓고 syncHome까지 */
function place(s: GameState, kind: 'home' | 'courtyard' | 'path' | 'garden', x: number, y: number, facing: 'down' | 'left' | 'right' = 'down', size = 1): GameState {
  const next = must(orderBuild(s, kind, x, y, facing, size))
  syncHome(next)
  return next
}

const house = (id: string, x: number, y: number, facing: Build['facing'] = 'down', state: Build['state'] = 'done'): Build => ({
  id, kind: 'home', x, y, facing, state, orderedDay: 1, paid: { coins: 150, items: { olive: 4, papyrus: 3 } }, refunded: false,
})

describe('놓기 검사', () => {
  it('땅이 드러나기 전에는 어디에도 놓을 수 없다', () => {
    const s = land({ flags: { ...land().flags, newlandRevealed: 0 } })
    expect(canPlace(s, 'home', 10, 12)).toBe('unrevealed')
    expect(orderBuild(s, 'home', 10, 12)).toBeNull()
  })

  it('구역 안이면 놓을 수 있다', () => {
    const s = land()
    expect(canPlace(s, 'home', BUILD_RECT.x0, BUILD_RECT.y0)).toBeNull()
    expect(canPlace(s, 'home', BUILD_RECT.x1 - 3, BUILD_RECT.y1 - 3)).toBeNull()
    expect(canPlace(s, 'courtyard', 12, 14)).toBeNull()
    expect(canPlace(s, 'path', 12, 14)).toBeNull()
    expect(canPlace(s, 'garden', 12, 14, 'down', 3)).toBeNull()
  })

  it('구역 밖(서고 둘레·길·가장자리)은 거절', () => {
    const s = land()
    expect(canPlace(s, 'home', BUILD_RECT.x0 - 1, 12)).toBe('outside')
    expect(canPlace(s, 'home', BUILD_RECT.x1 - 2, 12)).toBe('outside')
    expect(canPlace(s, 'home', 10, BUILD_RECT.y0 - 1)).toBe('outside')
    expect(canPlace(s, 'home', 10, BUILD_RECT.y1 - 2)).toBe('outside')
    expect(canPlace(s, 'path', ARCHIVE.front.x, ARCHIVE.front.y)).toBe('outside')
    expect(canPlace(s, 'path', 10, 9)).toBe('outside')
    expect(canPlace(s, 'garden', BUILD_RECT.x1, BUILD_RECT.y1, 'down', 3)).toBe('outside')
  })

  it('다른 건물과 겹치면 거절 (영역·그림 상자 모두)', () => {
    const s = place(land(), 'home', 10, 12)
    expect(canPlace(s, 'home', 10, 12)).toBe('overlap')
    expect(canPlace(s, 'home', 12, 13)).toBe('overlap')
    expect(canPlace(s, 'courtyard', 8, 13)).toBe('overlap')
    // 맨 윗줄은 지붕이 걸치는 줄이라 막히지 않지만, 위 건물의 영역을 덮는 상자는 거절
    expect(canPlace(s, 'home', 10, 9 + 1 + 0)).toBe('overlap')
    expect(canPlace(s, 'path', 11, 14)).toBe('overlap')
    expect(canPlace(s, 'garden', 9, 13, 'down', 3)).toBe('overlap')
  })

  it('이미 깔린 길·정원 칸과 다른 것은 겹침, 같은 것은 "이미"', () => {
    const s = place(land(), 'path', 20, 20)
    expect(canPlace(s, 'garden', 20, 20)).toBe('overlap')
    expect(canPlace(s, 'path', 20, 20)).toBe('same')
    expect(canPlace(s, 'home', 18, 19)).toBe('overlap')
  })

  it('서 있는 자리에는 건물을 놓을 수 없다', () => {
    const base = land()
    const s = { ...base, player: { ...base.player, x: 11, y: 14 } }
    expect(canPlace(s, 'home', 10, 12)).toBe('standing')
    // 걸을 수 있는 길·마당은 서 있어도 된다
    expect(canPlace(s, 'path', 11, 14)).toBeNull()
  })

  it('문 앞이 막히는 배치는 거절 — 집 안에 갇히는 집', () => {
    // 먼저 놓인 집(10,12)의 영역이 오른쪽 문(왼쪽 집)의 문 앞을 덮는다
    const s = place(land(), 'home', 10, 12)
    expect(canPlace(s, 'home', 6, 12, 'right')).toBe('door')
    // 문이 다른 쪽을 향하면 된다
    expect(canPlace(s, 'home', 6, 12, 'down')).toBeNull()
    expect(canPlace(s, 'home', 6, 12, 'left')).toBeNull()
    // 뒤를 보는 방향은 놓을 수 없다
    expect(canPlace(s, 'home', 6, 12, 'up' as 'down')).toBe('facing')
  })

  it('이미 있는 집의 문 앞을 막는 배치도 거절', () => {
    const s = place(land(), 'home', 6, 12, 'right')
    const d = doorOf('home', 6, 12, 'right')!
    expect(d.front).toEqual({ x: 10, y: 15 })
    // 문 앞 칸을 영역으로 덮는 집
    expect(canPlace(s, 'home', 10, 12)).toBe('door')
    expect(canPlace(s, 'home', 10, 13)).toBe('door')
    // 문 앞을 비켜 가면 된다 (영역이 문 앞 줄 아래에서 시작)
    expect(canPlace(s, 'home', 10, 15)).toBeNull()
  })

  it('길 막힘: 닿지 못하는 칸이 생기는 배치는 거절 (둘러싸인 칸)', () => {
    // 한 칸을 네 집이 에워싼 상태 (검사를 거치지 않고 만든 저장) — 그 칸에 길을 깔면 입구에서 닿지 못한다
    const base = land()
    const ring: Build[] = [house('b1', 10, 10, 'right'), house('b2', 10, 14, 'right'), house('b3', 6, 13, 'left'), house('b4', 11, 13, 'right')]
    const s: GameState = { ...base, newland: { builds: ring, tiles: {}, nextId: 5, settledDay: 0 } }
    syncHome(s)
    expect(canPlace(s, 'path', 10, 14)).toBe('sealed')
  })

  it('놓은 뒤에도 서고 문·모든 집의 문 앞에 길찾기로 닿는다', () => {
    let s = land({ inv: { olive: 20, papyrus: 20, reed: 20 } })
    s = place(s, 'home', 8, 11)
    s = place(s, 'home', 14, 11)
    s = place(s, 'home', 20, 11)
    s = place(s, 'courtyard', 12, 18)
    s = place(s, 'path', 12, 15, 'down', 3)
    syncHome(s)
    const from = { ...NEWLAND_PORTAL_FRONT }
    expect(findPath(from, ARCHIVE.door)).not.toBeNull()
    for (const b of buildsOf(s)) {
      const d = doorOf(b.kind, b.x, b.y, b.facing)
      if (d) expect(findPath(from, d.front)).not.toBeNull()
    }
  })

  it('건물은 열두 채까지', () => {
    let s = land({ coins: 99999, inv: { olive: 9, papyrus: 9, reed: 9 } })
    for (let i = 0; i < MAX_BUILDS; i++) {
      const col = i % 6
      const row = Math.floor(i / 6)
      const next = orderBuild({ ...s, inv: { olive: 9, papyrus: 9, reed: 9 } }, 'courtyard', 6 + col * 4, 11 + row * 5, 'down', 1)
      expect(next).not.toBeNull()
      s = next!
      syncHome(s)
    }
    expect(buildsOf(s)).toHaveLength(MAX_BUILDS)
    expect(canPlace(s, 'courtyard', 6, 22)).toBe('many')
  })
})

describe('비용과 주문', () => {
  it('닢이 모자라면 거절 — 아무것도 바뀌지 않는다', () => {
    const s = land({ coins: 149 })
    expect(canOrder(s, 'home', 10, 12)).toBe('coins')
    expect(orderBuild(s, 'home', 10, 12)).toBeNull()
    expect(s.coins).toBe(149)
  })

  it('재료가 모자라면 거절', () => {
    const s = land({ inv: { olive: 3, papyrus: 3 } })
    expect(canOrder(s, 'home', 10, 12)).toBe('items')
    expect(canOrder(land({ inv: {} }), 'courtyard', 10, 12)).toBe('items')
    expect(orderBuild(s, 'home', 10, 12)).toBeNull()
  })

  it('주문하면 닢·재료를 내고 기록이 생긴다 (집 150닢+올리브 4+파피루스 3)', () => {
    const s = must(orderBuild(land(), 'home', 10, 12, 'left'))
    expect(s.coins).toBe(850)
    expect(s.inv).toEqual({ olive: 5, papyrus: 6, reed: 9 })
    const b = buildsOf(s)[0]
    expect(b).toMatchObject({ id: 'b1', kind: 'home', x: 10, y: 12, facing: 'left', state: 'ordered', orderedDay: 10, refunded: false, paid: { coins: 150, items: { olive: 4, papyrus: 3 } } })
    expect(s.newland!.nextId).toBe(2)
  })

  it('마당은 40닢+갈대 4, 길 한 칸 1닢, 정원 한 칸 3닢, 3×3은 아홉 칸값, 깔린 칸은 빼고 센다', () => {
    let s = must(orderBuild(land(), 'courtyard', 10, 12))
    expect([s.coins, s.inv.reed]).toEqual([960, 5])
    s = must(orderBuild(s, 'path', 20, 20))
    expect(s.coins).toBe(959)
    s = must(orderBuild(s, 'garden', 22, 20))
    expect(s.coins).toBe(956)
    expect(tilesOf(s)).toEqual({ '20,20': 'path', '22,20': 'garden' })
    s = must(orderBuild(s, 'path', 19, 19, 'down', 3))
    // 아홉 칸 중 (20,20)은 이미 길이라 여덟 칸값
    expect(s.coins).toBe(948)
    expect(Object.keys(tilesOf(s))).toHaveLength(10)
  })

  it('길·정원 칸은 바로 깔려 걸을 수 있다 (칸 글자 덧씌움)', () => {
    const s = place(land(), 'garden', 20, 20)
    expect(isWalkable({ x: 20, y: 20 })).toBe(true)
    expect(tileAt(20, 20)).toBe('.')
    place(s, 'path', 21, 20)
    expect(tileAt(21, 20)).toBe(',')
    expect(isWalkable({ x: 21, y: 20 })).toBe(true)
  })

  it('집 칸은 막히고 문 칸은 완공 뒤에만 열린다, 마당은 걸을 수 있다', () => {
    let s = place(land(), 'home', 10, 12)
    const d = doorOf('home', 10, 12, 'down')!
    expect(isWalkable({ x: 10, y: 13 })).toBe(false)
    expect(isWalkable(d.door)).toBe(false)
    expect(isWalkable(d.front)).toBe(true)
    s = advanceBuilds({ ...s, clock: { ...s.clock, day: 12 } })
    syncHome(s)
    expect(buildsOf(s)[0].state).toBe('done')
    expect(isWalkable(d.door)).toBe(true)
    expect(isWalkable({ x: 10, y: 13 })).toBe(false)
    const c = place(land(), 'courtyard', 10, 12)
    expect(isWalkable({ x: 11, y: 13 })).toBe(false)
    const c2 = advanceBuilds({ ...c, clock: { ...c.clock, day: 12 } })
    syncHome(c2)
    expect(isWalkable({ x: 11, y: 13 })).toBe(true)
  })
})

describe('공사 하루', () => {
  it('주문한 다음 날 아침 공사 시작, 그다음 날 아침 완공', () => {
    let s = place(land(), 'home', 10, 12)
    expect(buildsOf(s)[0].state).toBe('ordered')
    // 같은 날에는 그대로
    s = advanceBuilds(s)
    expect(buildsOf(s)[0].state).toBe('ordered')
    s = advanceBuilds({ ...s, clock: { ...s.clock, day: 11 } })
    expect(buildsOf(s)[0].state).toBe('building')
    s = advanceBuilds({ ...s, clock: { ...s.clock, day: 12 } })
    expect(buildsOf(s)[0].state).toBe('done')
  })

  it('같은 날 두 번 정산해도 진행이 겹치지 않는다', () => {
    let s = place(land(), 'home', 10, 12)
    s = advanceBuilds({ ...s, clock: { ...s.clock, day: 11 } })
    const again = advanceBuilds(s)
    expect(again).toBe(s)
    expect(buildsOf(again)[0].state).toBe('building')
    expect(s.newland!.settledDay).toBe(11)
  })

  it('잠자기(goToSleep)의 아침이 한 번씩 진행시킨다', () => {
    let s = place(land(), 'home', 10, 12)
    s = goToSleep(s, CONTENT)
    expect(s.clock.day).toBe(11)
    expect(buildsOf(s)[0].state).toBe('building')
    s = goToSleep({ ...s, clock: { ...s.clock, minute: 22 * 60 } }, CONTENT)
    expect(buildsOf(s)[0].state).toBe('done')
  })

  it('저장·불러오기·첫 기회(settle)·맵 이동은 진행시키지 않는다', () => {
    let s = place(land(), 'home', 10, 12)
    s = goToSleep(s, CONTENT)
    const loaded = must(deserialize(serialize(s), CONTENT))
    expect(buildsOf(loaded)[0].state).toBe('building')
    const settled = settle(loaded, CONTENT)
    expect(buildsOf(settled)[0].state).toBe('building')
    const there = travel({ ...settled, clock: { day: settled.clock.day, minute: 10 * 60 } }, 'newland', CONTENT)
    expect(buildsOf(there)[0].state).toBe('building')
    const back = travel(there, 'village', CONTENT)
    expect(buildsOf(back)[0].state).toBe('building')
    expect(back.newland!.settledDay).toBe(11)
  })

  it('건물이 없으면 상태를 만들지 않는다', () => {
    const s = land()
    expect(advanceBuilds({ ...s, clock: { ...s.clock, day: 20 } })).toEqual({ ...s, clock: { ...s.clock, day: 20 } })
  })
})

describe('취소·철거·환불', () => {
  const ordered = () => place(land(), 'home', 10, 12)

  it('공사 시작 전 취소는 100% (닢·재료)', () => {
    const s = ordered()
    const c = must(cancelBuild(s, 'b1'))
    expect(c.coins).toBe(1000)
    expect(c.inv).toEqual({ olive: 9, papyrus: 9, reed: 9 })
    expect(buildsOf(c)).toHaveLength(0)
  })

  it('공사 중 취소는 50% — 닢·재료 각각 소수 버림', () => {
    let s = ordered()
    s = advanceBuilds({ ...s, clock: { ...s.clock, day: 11 } })
    expect(buildsOf(s)[0].state).toBe('building')
    const c = must(cancelBuild(s, 'b1'))
    // 150→75, 올리브 4→2, 파피루스 3→1 (소수 버림)
    expect(c.coins).toBe(850 + 75)
    expect(c.inv).toEqual({ olive: 5 + 2, papyrus: 6 + 1, reed: 9 })
  })

  it('홀수 닢은 소수를 버린다 (정원 3×3이 아닌 마당 40닢·갈대 4는 20·2)', () => {
    let s = place(land(), 'courtyard', 10, 12)
    s = advanceBuilds({ ...s, clock: { ...s.clock, day: 11 } })
    const c = must(cancelBuild(s, 'b1'))
    expect([c.coins, c.inv.reed]).toEqual([960 + 20, 5 + 2])
  })

  it('완공 뒤 철거는 닢 50%, 재료는 돌려주지 않고, 기록이 사라진다', () => {
    let s = ordered()
    s = advanceBuilds({ ...s, clock: { ...s.clock, day: 12 } })
    expect(buildsOf(s)[0].state).toBe('done')
    const d = must(demolishBuild(s, 'b1'))
    expect(d.coins).toBe(850 + 75)
    expect(d.inv).toEqual({ olive: 5, papyrus: 6, reed: 9 })
    expect(buildsOf(d)).toHaveLength(0)
    syncHome(d)
    expect(isWalkable({ x: 10, y: 13 })).toBe(true)
  })

  it('완공된 것은 취소가 아니고, 공사 중인 것은 철거가 아니다', () => {
    const s = ordered()
    expect(demolishBuild(s, 'b1')).toBeNull()
    const done = advanceBuilds({ ...s, clock: { ...s.clock, day: 12 } })
    expect(cancelBuild(done, 'b1')).toBeNull()
  })

  it('이중 눌림: 환불은 한 번뿐 (두 번째는 아무 일도 없다)', () => {
    const s = ordered()
    const once = must(cancelBuild(s, 'b1'))
    expect(cancelBuild(once, 'b1')).toBeNull()
    // 같은 옛 상태에서 두 번 눌러도 — 상태가 갈라지지 않는 한 한 번씩만
    const r = must(demolishBuild(advanceBuilds({ ...s, clock: { ...s.clock, day: 12 } }), 'b1'))
    expect(demolishBuild(r, 'b1')).toBeNull()
  })

  it('이미 환불 표식이 있는 기록은 다시 환불하지 않는다', () => {
    const s = ordered()
    const marked: GameState = { ...s, newland: { ...s.newland!, builds: [{ ...buildsOf(s)[0], refunded: true }] } }
    expect(cancelBuild(marked, 'b1')).toBeNull()
  })

  it('재접속 뒤에도 환불은 한 번: 저장 → 불러오기 → 같은 건물 다시 취소 불가', () => {
    const s = ordered()
    const c = must(cancelBuild(s, 'b1'))
    const loaded = must(deserialize(serialize(c), CONTENT))
    expect(loaded.coins).toBe(1000)
    expect(cancelBuild(loaded, 'b1')).toBeNull()
    expect(loaded.coins).toBe(1000)
  })

  it('환불한 재료는 가방이 가득해도 받는다', () => {
    const s = place(land({ inv: { olive: 9, papyrus: 9, reed: 9 } }), 'home', 10, 12)
    const full = { ...s, inv: { olive: 9, papyrus: 9, reed: 9 } }
    const c = must(cancelBuild(full, 'b1'))
    expect(c.inv.olive).toBe(13)
  })

  it('서고는 철거할 수 없다', () => {
    const s = ordered()
    expect(demolishBuild(s, 'archive')).toBeNull()
    expect(cancelBuild(s, 'archive')).toBeNull()
    expect(demolishBuild(land(), 'archive')).toBeNull()
    // 서고 자리는 건물 기록에 없다 — 깔 수도, 걷어낼 수도 없다
    expect(clearTile(s, ARCHIVE.door.x, ARCHIVE.door.y)).toBeNull()
  })

  it('깐 길·정원 걷어내기: 낸 닢을 돌려받고 칸이 비는 한 번뿐', () => {
    const s = place(land(), 'garden', 20, 20)
    expect(s.coins).toBe(997)
    const c = must(clearTile(s, 20, 20))
    expect(c.coins).toBe(1000)
    expect(tilesOf(c)).toEqual({})
    expect(clearTile(c, 20, 20)).toBeNull()
  })
})

describe('저장', () => {
  it('저장·불러오기: 건물·길·정원·번호가 그대로', () => {
    let s = place(land(), 'home', 10, 12, 'left')
    s = place(s, 'path', 20, 20, 'down', 3)
    const loaded = must(deserialize(serialize(s), CONTENT))
    expect(loaded.newland).toEqual(s.newland)
  })

  it('옛 저장(newland 없음)은 그대로 열리고 건물 0채다', () => {
    const s = land()
    const raw = JSON.parse(serialize(s)) as Record<string, unknown>
    delete raw.newland
    const loaded = must(deserialize(JSON.stringify(raw), CONTENT))
    expect(loaded.newland).toBeUndefined()
    expect(buildsOf(loaded)).toEqual([])
    expect(loaded.flags.newlandRevealed).toBe(1)
  })

  it('깨진 기록은 걸러 낸다 (모르는 종류·구역 밖·겹침·환불 표식·중복 번호)', () => {
    const good = house('b1', 10, 12)
    const raw = {
      builds: [
        good,
        { ...house('b2', 10, 12) },
        { ...house('b3', 0, 0) },
        { ...house('b4', 20, 12), kind: 'castle' },
        { ...house('b5', 20, 12), refunded: true },
        { ...house('b1', 24, 12) },
        { ...house('b6', 24, 12, 'up') },
        { ...house('b7', 24, 12), state: 'weird' },
        'x',
      ],
      tiles: { '20,20': 'path', '11,13': 'path', '1,1': 'garden', '20,21': 'lava', bad: 'path' },
      nextId: 'x',
    }
    const out = sanitizeNewlandBuild(raw, 30)!
    expect(out.builds.map((b) => b.id)).toEqual(['b1'])
    expect(out.tiles).toEqual({ '20,20': 'path' })
    expect(out.nextId).toBe(2)
    expect(out.settledDay).toBe(0)
    expect(sanitizeNewlandBuild(undefined, 30)).toBeUndefined()
    expect(sanitizeNewlandBuild([], 30)).toBeUndefined()
  })

  it('날짜는 미래로 가지 않게 오늘까지, 지나치게 큰 값은 막는다', () => {
    const out = sanitizeNewlandBuild({ builds: [{ ...house('b1', 10, 12, 'down', 'ordered'), orderedDay: 999, paid: { coins: 1e9, items: { olive: 1e9, gold: 5 } } }], tiles: {}, nextId: 1, settledDay: 999 }, 30)!
    expect(out.builds[0].orderedDay).toBe(30)
    expect(out.builds[0].paid).toEqual({ coins: 0, items: {} })
    expect(out.settledDay).toBe(30)
  })

  it('불러올 때 서 있던 칸이 지은 집 안이면 입구 앞으로 돌려놓는다', () => {
    const s = place(land(), 'home', 10, 12)
    const raw = JSON.parse(serialize({ ...s, player: { ...s.player, x: 11, y: 14 } })) as Record<string, unknown>
    const loaded = must(deserialize(JSON.stringify(raw), CONTENT))
    expect(playerTile(loaded)).toEqual(NEWLAND_PORTAL_FRONT)
  })

  it('저장 크기: 건물 열두 채와 길·정원 수백 칸도 작다', () => {
    const builds: Build[] = []
    for (let i = 0; i < MAX_BUILDS; i++) builds.push(house(`b${i + 1}`, 6 + (i % 6) * 4, 11 + Math.floor(i / 6) * 5))
    const tiles: Record<string, 'path' | 'garden'> = {}
    for (let x = 6; x <= 33; x++) tiles[`${x},27`] = 'path'
    const nl: NewlandState = { builds, tiles, nextId: 13, settledDay: 0 }
    expect(JSON.stringify(nl).length).toBeLessThan(6000)
  })
})

describe('필사·서고와 무관', () => {
  it('건물 0채여도 서고 문까지 걸어가고 안 책상·책장 자리가 그대로다', () => {
    const s = land()
    expect(buildsOf(s)).toHaveLength(0)
    expect(findPath(NEWLAND_PORTAL_FRONT, ARCHIVE.door)).not.toBeNull()
    expect(findPath(INTERIOR_ENTRY, PLACES.otDesk.stand!)).not.toBeNull()
    expect(PLACES.otDesk.tiles.length).toBeGreaterThan(0)
  })

  it('건물을 놓고 취소해도 필사·구약 진행·서고는 한 글자도 바뀌지 않는다', () => {
    const s = land()
    let t = place(s, 'home', 10, 12)
    t = place(t, 'courtyard', 20, 12)
    t = must(cancelBuild(t, 'b1'))
    t = must(cancelBuild(t, 'b2'))
    for (const k of ['copy', 'copyStats', 'otProgress', 'otCopyStats', 'progress', 'shelved', 'godRecords', 'bound', 'collected'] as const) {
      expect(t[k]).toEqual(s[k])
    }
    expect(t.coins).toBe(s.coins)
    expect(t.inv).toEqual(s.inv)
  })

  it('건물이 가득 차 있어도 서고·책상 길은 막히지 않는다 (놓기 검사가 지킨다)', () => {
    let s = land({ coins: 5000, inv: { olive: 99, papyrus: 99 } })
    const spots: [number, number][] = [[6, 11], [11, 11], [16, 11], [21, 11], [26, 11], [6, 17], [11, 17], [16, 17], [21, 17], [26, 17]]
    for (const [x, y] of spots) {
      const next = orderBuild(s, 'home', x, y, 'down')
      if (next) {
        s = next
        syncHome(s)
      }
    }
    expect(buildsOf(s).length).toBeGreaterThan(5)
    expect(findPath(NEWLAND_PORTAL_FRONT, ARCHIVE.door)).not.toBeNull()
    for (const b of buildsOf(s)) expect(findPath(NEWLAND_PORTAL_FRONT, doorOf(b.kind, b.x, b.y, b.facing)!.front)).not.toBeNull()
  })
})

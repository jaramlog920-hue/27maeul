// 집 넓히기 2단계(방 하나 더 → 다락 서재)와 넓은 책상 (계획 4 작업 5)
import {
  bindMinutes,
  canOrderHome,
  chooseBook,
  goToSleep,
  newGame,
  orderHome,
  peaceful,
  placeFurniture,
  setArrangement,
  submitChapter,
  tapTile,
  tick,
  trade,
  TRADES,
  walkDirection,
  HOME_STAGES,
  type GameState,
} from './game'
import {
  ATTIC,
  ATTIC_WINDOW,
  HOME_EXPAND_RECT,
  HOME_DOOR,
  HOME_RECT,
  LADDER,
  MAP,
  PLACES,
  SIDE_DOOR,
  SIDE_ROOM,
  homeRect,
  isHome,
  isWalkable,
  placeAt,
  setHomeLevel,
  tileAt,
  viewRoomAt,
  roomAt,
} from './world'
import { findPath } from './movement'
import { placement } from './room'
import { deserialize, serialize } from './save'
import { CONTENT, piecesOf } from '../content/catalog'
import { SCENES, T } from '../content/text'
import { TOOLS } from './items'

const zero = () => 0
const at = (s: GameState, minute: number, day = s.clock.day): GameState => ({ ...s, clock: { day, minute } })
/** 목수가 이사 온 뒤, 넉넉한 닢과 재료 */
const rich = (s: GameState = newGame(CONTENT)): GameState => ({
  ...s,
  coins: 1000,
  inv: { olive: 9, papyrus: 9 },
  flags: { ...s.flags, 'movedIn:carpenter': 1 },
})
const sleep = (s: GameState, opts: { read?: boolean; pieceId?: string; attic?: boolean } = {}) =>
  goToSleep(at({ ...s, scenes: [] }, 22 * 60), CONTENT, opts)

afterEach(() => setHomeLevel(0))

describe('집 넓히기 자리', () => {
  it('넓힐 빈 땅(11~13열, 2~7줄)에는 지금 아무것도 없다', () => {
    expect(HOME_EXPAND_RECT).toEqual({ x0: 11, y0: 2, x1: 13, y1: 7 })
    for (let y = HOME_EXPAND_RECT.y0; y <= HOME_EXPAND_RECT.y1; y++)
      for (let x = HOME_EXPAND_RECT.x0; x <= HOME_EXPAND_RECT.x1; x++) {
        expect(MAP[y][x], `${x},${y}`).toBe('.')
        expect(placeAt({ x, y }), `${x},${y}`).toBeNull()
      }
    // 이웃 시간표의 자리도 그 땅에 없다
    for (const d of CONTENT.neighbors)
      for (const e of d.schedule)
        for (const t of [e.tile, e.wet])
          if (t) expect(t.x >= HOME_EXPAND_RECT.x0 && t.x <= HOME_EXPAND_RECT.x1 && t.y >= HOME_EXPAND_RECT.y0 && t.y <= HOME_EXPAND_RECT.y1, d.id).toBe(false)
  })
  it('다락은 지도 아래 보이지 않는 곳, 8×6, 다른 방과 겹치지 않는다', () => {
    expect(ATTIC.w).toBe(8)
    expect(ATTIC.h).toBe(6)
    expect(ATTIC.y0).toBeGreaterThanOrEqual(40)
    for (let y = ATTIC.y0; y < ATTIC.y0 + ATTIC.h; y++)
      for (let x = ATTIC.x0; x < ATTIC.x0 + ATTIC.w; x++) expect(roomAt({ x, y }), `${x},${y}`).toBeNull()
  })
})

describe('집 넓히기 1단계: 방 하나 더', () => {
  it('처음엔 넓힐 땅이 풀밭, 새 방은 집이 아니다', () => {
    expect(isWalkable({ x: 11, y: 4 })).toBe(true)
    expect(isHome({ x: 11, y: 4 })).toBe(false)
    expect(homeRect()).toEqual(HOME_RECT)
  })
  it('목수가 이사 오기 전에는 부탁할 수 없다', () => {
    const s = { ...rich(), flags: { heartPoints: 1 } }
    expect(canOrderHome(s)).toBe('notMoved')
    expect(orderHome(s)).toBeNull()
  })
  it('닢 120 + 올리브 5, 모자라면 못 한다', () => {
    expect(HOME_STAGES[0]).toMatchObject({ level: 1, coins: 120, needs: { olive: 5 } })
    expect(canOrderHome({ ...rich(), coins: 119 })).toBe('coins')
    expect(canOrderHome({ ...rich(), inv: { olive: 4 } })).toBe('needs')
    const s = orderHome(rich())!
    expect(s.coins).toBe(880)
    expect(s.inv.olive).toBe(4)
    // 부탁한 날은 아직 그대로, 두 번 부탁하지 않는다
    expect(s.homeLevel).toBe(0)
    expect(canOrderHome(s)).toBe('ordered')
    expect(orderHome(s)).toBeNull()
  })
  it('다음 날 아침 집이 넓어진다: 새 방, 사이 벽의 문, 넓어진 지붕', () => {
    const s = sleep(orderHome(rich())!)
    expect(s.homeLevel).toBe(1)
    expect(s.scenes).toContain('home:1')
    expect(SCENES['home:1']).toBeDefined()
    // 새 방
    // 새 방은 두 칸 폭 × 네 줄
    expect(SIDE_ROOM).toEqual({ x0: 11, y0: 3, x1: 12, y1: 6 })
    for (let y = SIDE_ROOM.y0; y <= SIDE_ROOM.y1; y++)
      for (let x = SIDE_ROOM.x0; x <= SIDE_ROOM.x1; x++) {
        expect(tileAt(x, y)).toBe('f')
        expect(isHome({ x, y })).toBe(true)
      }
    // 바깥 벽
    for (let y = 2; y <= 7; y++) expect(tileAt(13, y)).toBe('#')
    for (const x of [11, 12]) {
      expect(tileAt(x, 2)).toBe('#')
      expect(tileAt(x, 7)).toBe('#')
    }
    // 사이 벽의 문
    expect(isWalkable(SIDE_DOOR)).toBe(true)
    expect(isHome(SIDE_DOOR)).toBe(true)
    expect(homeRect()).toEqual({ x0: 2, y0: 2, x1: 13, y1: 7 })
    // 집 안에서 보는 화면도 넓어진다
    expect(viewRoomAt({ x: 11, y: 4 })).toEqual({ x0: 2, y0: 2, w: 12, h: 6 })
  })
  it('넓힌 뒤 문에서 새 방까지 걸어갈 수 있고, 밖에서는 벽이 길을 막는다', () => {
    const s = sleep(orderHome(rich())!)
    expect(findPath(HOME_DOOR, { x: 11, y: 6 })).not.toBeNull()
    expect(findPath(HOME_DOOR, { x: 12, y: 3 })).not.toBeNull()
    expect(isWalkable({ x: 13, y: 4 })).toBe(false)
    // 바로 옆 텃밭은 그대로 밟고 들어갈 수 있다
    for (const t of PLACES.garden.tiles) expect(isWalkable(t)).toBe(true)
    expect(findPath(HOME_DOOR, { x: 14, y: 4 })).not.toBeNull()
    // 걸어서 들어가 본다
    const walk = tapTile({ ...s, npcs: {}, player: { ...s.player, x: 6, y: 6, path: [] } }, { x: 11, y: 3 })
    expect(walk.player.path.at(-1)).toEqual({ x: 11, y: 3 })
  })
  it('넓힌 뒤에도 모든 장소에 닿는다 (텃밭·우물·서고)', () => {
    setHomeLevel(2)
    for (const id of ['garden', 'well', 'bench', 'basket'] as const) {
      const p = PLACES[id]
      const path = p.stand ? findPath(HOME_DOOR, p.stand) : findPath(HOME_DOOR, { x: p.tiles[0].x, y: p.tiles[0].y + 1 })
      expect(path, id).not.toBeNull()
    }
    // 텃밭 열두 칸은 그대로
    expect(PLACES.garden.tiles).toHaveLength(12)
    for (const t of PLACES.garden.tiles) expect(tileAt(t.x, t.y)).toBe('l')
  })
  it('새 방 바닥에도 가구를 놓을 수 있고, 새 방으로 가는 길은 막지 않는다', () => {
    const s = sleep(orderHome(rich())!)
    const withChair = placeFurniture({ ...s, inv: { chair: 1, nightstand: 1 } }, 'chair', { x: 11, y: 6 })
    expect(withChair).not.toBeNull()
    // 문 안쪽 칸을 막으면 새 방에 못 들어간다
    expect(placement([], 'nightstand', { x: 11, y: 4 })).toBeNull()
    expect(placement([], 'nightstand', SIDE_DOOR)).toBeNull()
  })
  it('넓히기 전에는 새 방 자리에 가구를 놓을 수 없다', () => {
    expect(placement([], 'chair', { x: 11, y: 5 })).toBeNull()
  })
})

describe('집 넓히기 2단계: 다락 서재', () => {
  const stage1 = () => sleep(orderHome(rich())!)
  it('1단계 전에는 부탁할 수 없고, 1단계 뒤 닢 200 + 파피루스 5', () => {
    expect(HOME_STAGES[1]).toMatchObject({ level: 2, coins: 200, needs: { papyrus: 5 } })
    const one = stage1()
    expect(canOrderHome({ ...one, coins: 199 })).toBe('coins')
    expect(canOrderHome({ ...one, inv: { papyrus: 4 } })).toBe('needs')
    const paid = orderHome(one)!
    expect(paid.coins).toBe(one.coins - 200)
    expect(paid.inv.papyrus).toBe(4)
    const two = sleep(paid)
    expect(two.homeLevel).toBe(2)
    expect(two.scenes).toContain('home:2')
    expect(SCENES['home:2']).toBeDefined()
    expect(canOrderHome(two)).toBe('done')
  })
  it('선반 옆 사다리를 누르면 다락으로 올라가고, 문깔개로 내려온다', () => {
    const two = sleep(orderHome(stage1())!)
    expect(placeAt(LADDER)).toBe('ladder')
    expect(PLACES.ladder.stand).toBeDefined()
    // 사다리는 길찾기가 지나가지 않는다 (지나가다 올라가 버리지 않게)
    expect(isWalkable(LADDER)).toBe(false)
    let s = tapTile({ ...two, npcs: {}, player: { ...two.player, x: 6, y: 5, path: [] } }, LADDER)
    for (let i = 0; i < 200 && !(s.player.y >= ATTIC.y0); i++) s = tick(s, 0.05, zero, CONTENT).state
    expect(s.player.y).toBeGreaterThanOrEqual(ATTIC.y0)
    expect(isHome({ x: Math.round(s.player.x), y: Math.round(s.player.y) })).toBe(true)
    expect(viewRoomAt({ x: Math.round(s.player.x), y: Math.round(s.player.y) })).toMatchObject({ x0: ATTIC.x0, y0: ATTIC.y0, w: 8, h: 6 })
    // 문깔개를 밟으면 사다리 앞으로
    s = tapTile({ ...s, player: { ...s.player, path: [] } }, ATTIC.exit)
    for (let i = 0; i < 200 && s.player.y >= ATTIC.y0; i++) s = tick(s, 0.05, zero, CONTENT).state
    expect({ x: s.player.x, y: s.player.y }).toEqual(PLACES.ladder.stand)
  })
  it('키보드로 사다리 쪽으로 걸으면 올라간다', () => {
    const two = sleep(orderHome(stage1())!)
    const stand = PLACES.ladder.stand!
    const s = walkDirection({ ...two, npcs: {}, player: { ...two.player, x: stand.x, y: stand.y, path: [] } }, LADDER.x - stand.x, LADDER.y - stand.y)
    expect(s.player.y).toBeGreaterThanOrEqual(ATTIC.y0)
  })
  it('1단계만으로는 사다리가 없다', () => {
    stage1()
    expect(placeAt(LADDER)).toBeNull()
    expect(tileAt(LADDER.x, LADDER.y)).toBe('f')
  })
  it('다락엔 책장·독서대·창이 있고, 방 꾸미기도 된다', () => {
    const two = sleep(orderHome(stage1())!)
    expect(ATTIC.decor.map((d) => d[2])).toEqual(expect.arrayContaining(['bookcase', 'lectern']))
    expect(placeAt(ATTIC_WINDOW)).toBe('atticWindow')
    const free = { x: ATTIC.x0 + 1, y: ATTIC.y0 + 4 }
    expect(tileAt(free.x, free.y)).toBe('f')
    expect(placeFurniture({ ...two, inv: { chair: 1 } }, 'chair', free)).not.toBeNull()
    // 창 앞과 문깔개 앞은 막지 않는다
    expect(placement([], 'chair', PLACES.atticWindow.stand!)).toBeNull()
    expect(placement([], 'chair', ATTIC.entry)).toBeNull()
  })
  it('다락이 생기면 사다리 자리의 가구는 가방으로 돌아간다', () => {
    const one = stage1()
    const withStool = placeFurniture({ ...one, inv: { ...one.inv, stool: 1 } }, 'stool', LADDER)!
    expect(withStool.room).toHaveLength(1)
    const two = sleep(orderHome(withStool)!)
    expect(two.room).toHaveLength(0)
    expect(two.inv.stool).toBe(1)
  })
})

describe("다락 창가에서 읽고 자면 '평안'이 하루 더", () => {
  it('보통 자기 전 읽기: 다음 날 하루', () => {
    const s = sleep(newGame(CONTENT), { read: true })
    expect(peaceful(s)).toBe(true)
    const next = sleep(s)
    expect(peaceful(next)).toBe(false)
  })
  it('다락 창가: 다음 날과 그다음 날까지', () => {
    const s = sleep({ ...newGame(CONTENT), homeLevel: 2 }, { read: true, attic: true })
    expect(peaceful(s)).toBe(true)
    const next = sleep(s)
    expect(peaceful(next)).toBe(true)
    expect(peaceful(sleep(next))).toBe(false)
  })
  it('읽지 않으면 다락 창가라도 평안이 붙지 않는다, 다락이 없으면 하루만', () => {
    expect(peaceful(sleep({ ...newGame(CONTENT), homeLevel: 2 }, { attic: true }))).toBe(false)
    const s = sleep(newGame(CONTENT), { read: true, attic: true })
    expect(peaceful(sleep(s))).toBe(false)
  })
})

describe('넓은 책상', () => {
  const chapter1 = piecesOf('lk').filter((p) => p.chapter === 1).map((p) => p.id)
  const ready = (): GameState => setArrangement({ ...chooseBook(newGame(CONTENT), 'lk', CONTENT), collected: chapter1 }, 'lk', 1, [...chapter1])
  it('장날 닢 80, 도구라 하나만', () => {
    expect(TOOLS).toContain('wideDesk')
    const t = TRADES.find((x) => x.get.wideDesk)!
    expect(t.coins).toBe(80)
    const s = { ...newGame(CONTENT), coins: 200 }
    expect(trade(at(s, 600, 6), t)).toBeNull()
    const bought = trade(at(s, 600, 7), t)!
    expect(bought.coins).toBe(120)
    expect(bought.inv.wideDesk).toBe(1)
    expect(trade(bought, t)).toBeNull()
    expect(trade({ ...at(s, 600, 7), coins: 79 }, t)).toBeNull()
    expect(T.trades[t.id as keyof typeof T.trades]).toBeDefined()
  })
  it('장 엮기 시간이 20% 줄어든다', () => {
    const base = ready()
    const plain = bindMinutes(base)
    expect(bindMinutes({ ...base, inv: { wideDesk: 1 } })).toBe(Math.round(plain * 0.8))
    const a = submitChapter({ ...base, inv: { papyrus: 1, ink: 1 } }, 'lk', 1, CONTENT).state
    const b = submitChapter({ ...base, inv: { papyrus: 1, ink: 1, wideDesk: 1 } }, 'lk', 1, CONTENT).state
    expect(a.clock.minute - base.clock.minute).toBe(plain)
    expect(b.clock.minute - base.clock.minute).toBe(Math.round(plain * 0.8))
  })
})

describe('저장·불러오기', () => {
  it('집 단계와 부탁이 저장되고, 옛 저장은 0단계', () => {
    const one = orderHome(sleep(orderHome(rich())!))!
    const back = deserialize(serialize(one), CONTENT)!
    expect(back.homeLevel).toBe(1)
    expect(back.flags.homeOrder).toBe(2)
    const { homeLevel: _drop, ...old } = JSON.parse(serialize(newGame(CONTENT)))
    expect(deserialize(JSON.stringify(old), CONTENT)!.homeLevel).toBe(0)
    // 이상한 값은 0으로
    expect(deserialize(JSON.stringify({ ...old, homeLevel: 7 }), CONTENT)!.homeLevel).toBe(0)
  })
  it('새 방에 놓은 가구는 불러와도 그대로', () => {
    const one = sleep(orderHome(rich())!)
    const placed = placeFurniture({ ...one, inv: { chair: 1 } }, 'chair', { x: 11, y: 6 })!
    setHomeLevel(0)
    const back = deserialize(serialize(placed), CONTENT)!
    expect(back.room).toEqual([{ item: 'chair', x: 11, y: 6 }])
  })
})

describe('집 단계와 지도 맞추기', () => {
  it('불러오면 저장된 단계로, 새 게임은 0단계로 지도가 맞춰진다', () => {
    const one = sleep(orderHome(rich())!)
    setHomeLevel(0)
    deserialize(serialize(one), CONTENT)
    expect(tileAt(11, 4)).toBe('f')
    newGame(CONTENT)
    expect(tileAt(11, 4)).toBe('.')
  })
})

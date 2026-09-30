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
  HOME_ENTRY,
  HOME_FRONT,
  HOME_RECT,
  HOUSE_GROW,
  HOUSE_RECT,
  homeHouse,
  LADDER,
  MAP,
  PLACES,
  SIDE_DOOR,
  SIDE_ROOM,
  START,
  homeRect,
  inAttic,
  isHome,
  isWalkable,
  placeAt,
  setHomeLevel,
  tileAt,
  viewRoomAt,
  roomAt,
  WARPS,
  key,
} from './world'
import { findPath } from './movement'
import { placement } from './room'
import { deserialize, serialize } from './save'
import { CONTENT, piecesOf } from '../content/catalog'
import { SCENES, T } from '../content/text'
import { TOOLS } from './items'
import { BABY_PARTY_SPOTS, FRIENDS_SPOT, HILL_SPOTS, VISIT_SPOT } from './bonds'
import { EAVES, STRAY_SPOTS } from './companion'
import { FESTIVAL_SPOTS } from './neighbors'
import { LESSON_SPOT } from './stories'
import { drawDecor, LANTERNS } from '../render/decor'

const zero = () => 0
const playerTileOf = (s: GameState) => ({ x: Math.round(s.player.x), y: Math.round(s.player.y) })
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
  it('집 안 방 오른쪽(넓힐 곳)은 지금 비어 있고, 방은 지도 아래 보이지 않는 곳', () => {
    expect(HOME_EXPAND_RECT).toEqual({ x0: HOME_RECT.x1 + 1, y0: HOME_RECT.y0, x1: HOME_RECT.x1 + 3, y1: HOME_RECT.y1 })
    expect(HOME_RECT.y0).toBeGreaterThanOrEqual(40)
    for (let y = HOME_EXPAND_RECT.y0; y <= HOME_EXPAND_RECT.y1; y++)
      for (let x = HOME_EXPAND_RECT.x0; x <= HOME_EXPAND_RECT.x1; x++) {
        expect(MAP[y][x], `${x},${y}`).toBe('_')
        expect(roomAt({ x, y }), `${x},${y}`).toBeNull()
      }
  })
  it('밖에서 집이 넓어질 왼쪽 두 줄은 넓히기 전 빈 풀밭 — 등불·손님·동물·이웃·모임 자리도 없다', () => {
    expect(HOUSE_GROW).toEqual({ x0: HOUSE_RECT.x0 - 2, y0: HOUSE_RECT.y0, x1: HOUSE_RECT.x0 - 1, y1: HOUSE_RECT.y1 })
    const inGrow = (t: { x: number; y: number }) => t.x >= HOUSE_GROW.x0 && t.x <= HOUSE_GROW.x1 && t.y >= HOUSE_GROW.y0 && t.y <= HOUSE_GROW.y1
    for (let y = HOUSE_GROW.y0; y <= HOUSE_GROW.y1; y++)
      for (let x = HOUSE_GROW.x0; x <= HOUSE_GROW.x1; x++) {
        expect(MAP[y][x], `${x},${y}`).toBe('.')
        expect(tileAt(x, y), `${x},${y}`).toBe('.')
        expect(placeAt({ x, y }), `${x},${y}`).toBeNull()
      }
    const spots: [string, { x: number; y: number }][] = [
      ['EAVES', EAVES],
      ['VISIT_SPOT', VISIT_SPOT],
      ['LESSON_SPOT', LESSON_SPOT],
      ['FRIENDS_SPOT', FRIENDS_SPOT],
      ...Object.entries(STRAY_SPOTS),
      ...Object.entries(FESTIVAL_SPOTS),
      ...Object.entries(BABY_PARTY_SPOTS),
      ...Object.entries(HILL_SPOTS),
      ...LANTERNS.map((t, i) => [`등불 ${i}`, t] as [string, { x: number; y: number }]),
      ...Object.values(PLACES).flatMap((p) => [...p.tiles, ...(p.stand ? [p.stand] : [])]).map((t) => ['장소', t] as [string, { x: number; y: number }]),
    ]
    for (const d of CONTENT.neighbors)
      for (const e of d.schedule) for (const t of [e.tile, e.wet]) if (t) spots.push([d.id, t])
    for (const [name, t] of spots) expect(inGrow(t), `${name} ${t.x},${t.y}`).toBe(false)
    // 마을 꽃길(1단계)도 그 땅에 그리지 않는다
    const ctx = { calls: [] as { x: number; y: number }[], fillStyle: '', strokeStyle: '', lineWidth: 1, fillRect(x: number, y: number) { this.calls.push({ x, y }) }, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} }
    drawDecor(ctx as unknown as CanvasRenderingContext2D, { ...newGame(CONTENT), flags: { villageLevel: 4, 'unlock:lanterns': 1 } }, 'sunny', 0, true)
    for (const c of ctx.calls) expect(inGrow({ x: Math.floor(c.x / 16), y: Math.floor(c.y / 16) }), `${c.x},${c.y}`).toBe(false)
  })
  it('다락은 지도 아래 보이지 않는 곳, 8×6, 다른 방과 겹치지 않는다', () => {
    expect(ATTIC.w).toBe(8)
    expect(ATTIC.h).toBe(6)
    expect(ATTIC.y0).toBeGreaterThanOrEqual(40)
    for (let y = ATTIC.y0; y < ATTIC.y0 + ATTIC.h; y++)
      for (let x = ATTIC.x0; x < ATTIC.x0 + ATTIC.w; x++) expect(roomAt({ x, y }), `${x},${y}`).toBeNull()
  })
})

describe('잠들 때 집 단계 맞추기', () => {
  it('모듈 전역이 0이어도 상태의 집 단계(1)로 지도를 맞춘 채 자고, 이웃도 그 지도로 놓는다', () => {
    const s = { ...newGame(CONTENT), homeLevel: 1 as const }
    setHomeLevel(0)
    const wing = { x: HOUSE_GROW.x0, y: HOUSE_RECT.y1 - 1 }
    expect(isWalkable(wing)).toBe(true)
    expect(tileAt(SIDE_ROOM.x0, SIDE_ROOM.y0)).toBe('_')
    const after = sleep(s)
    expect(after.homeLevel).toBe(1)
    expect(tileAt(wing.x, wing.y)).toBe('#')
    expect(isHome({ x: SIDE_ROOM.x0, y: SIDE_ROOM.y0 + 1 })).toBe(true)
    for (const n of Object.values(after.npcs)) expect(n.x === wing.x && n.y === wing.y).toBe(false)
  })
})

describe('집 넓히기 1단계: 방 하나 더', () => {
  it('처음엔 새 방 자리가 비어 있고 집이 아니다, 밖의 집은 5칸', () => {
    expect(isWalkable({ x: SIDE_ROOM.x0, y: SIDE_ROOM.y0 + 1 })).toBe(false)
    expect(isHome({ x: SIDE_ROOM.x0, y: SIDE_ROOM.y0 + 1 })).toBe(false)
    expect(homeRect()).toEqual(HOME_RECT)
    expect(homeHouse().x1 - homeHouse().x0 + 1).toBe(5)
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
    expect(SIDE_ROOM).toEqual({ x0: HOME_RECT.x1 + 1, y0: HOME_RECT.y0 + 1, x1: HOME_RECT.x1 + 2, y1: HOME_RECT.y1 - 1 })
    for (let y = SIDE_ROOM.y0; y <= SIDE_ROOM.y1; y++)
      for (let x = SIDE_ROOM.x0; x <= SIDE_ROOM.x1; x++) {
        expect(tileAt(x, y)).toBe('f')
        expect(isHome({ x, y })).toBe(true)
      }
    // 바깥 벽
    for (let y = HOME_RECT.y0; y <= HOME_RECT.y1; y++) expect(tileAt(HOME_EXPAND_RECT.x1, y)).toBe('#')
    for (const x of [SIDE_ROOM.x0, SIDE_ROOM.x1]) {
      expect(tileAt(x, HOME_RECT.y0)).toBe('#')
      expect(tileAt(x, HOME_RECT.y1)).toBe('#')
    }
    // 사이 벽의 문
    expect(isWalkable(SIDE_DOOR)).toBe(true)
    expect(isHome(SIDE_DOOR)).toBe(true)
    expect(homeRect()).toEqual({ ...HOME_RECT, x1: HOME_EXPAND_RECT.x1 })
    // 집 안에서 보는 화면도 넓어진다
    expect(viewRoomAt({ x: SIDE_ROOM.x0, y: SIDE_ROOM.y0 + 1 })).toEqual({ x0: HOME_RECT.x0, y0: HOME_RECT.y0, w: 12, h: 6 })
    // 밖에서는 집이 왼쪽으로만 두 칸, 문은 그대로
    expect(homeHouse()).toMatchObject({ x0: HOUSE_GROW.x0, x1: HOUSE_RECT.x1, doorX: HOME_DOOR.x })
  })
  it('넓힌 뒤 들어온 자리에서 새 방까지 걸어갈 수 있고, 밖에서는 넓어진 벽이 길을 막는다', () => {
    const s = sleep(orderHome(rich())!)
    expect(findPath(HOME_ENTRY, { x: SIDE_ROOM.x0, y: SIDE_ROOM.y1 })).not.toBeNull()
    expect(findPath(HOME_ENTRY, { x: SIDE_ROOM.x1, y: SIDE_ROOM.y0 })).not.toBeNull()
    expect(isWalkable({ x: HOUSE_GROW.x1, y: HOUSE_RECT.y1 - 1 })).toBe(false)
    // 오른쪽(텃밭 쪽 13열)은 그대로 풀밭
    expect(tileAt(HOUSE_RECT.x1 + 1, HOUSE_RECT.y1 - 1)).toBe('.')
    // 바로 옆 텃밭은 그대로 밟고 들어갈 수 있다
    for (const t of PLACES.garden.tiles) expect(isWalkable(t)).toBe(true)
    expect(findPath(HOME_FRONT, { x: 14, y: 4 })).not.toBeNull()
    // 걸어서 들어가 본다
    const walk = tapTile({ ...s, npcs: {}, player: { ...s.player, ...HOME_ENTRY, path: [] } }, { x: SIDE_ROOM.x0, y: SIDE_ROOM.y0 })
    expect(walk.player.path.at(-1)).toEqual({ x: SIDE_ROOM.x0, y: SIDE_ROOM.y0 })
  })
  it('넓힌 뒤에도 모든 장소에 닿는다 (텃밭·우물·서고)', () => {
    setHomeLevel(2)
    for (const id of ['garden', 'well', 'bench', 'basket'] as const) {
      const p = PLACES[id]
      const path = p.stand ? findPath(HOME_FRONT, p.stand) : findPath(HOME_FRONT, { x: p.tiles[0].x, y: p.tiles[0].y + 1 })
      expect(path, id).not.toBeNull()
    }
    // 텃밭 열두 칸은 그대로
    expect(PLACES.garden.tiles).toHaveLength(12)
    for (const t of PLACES.garden.tiles) expect(tileAt(t.x, t.y)).toBe('l')
  })
  it('새 방 바닥에도 가구를 놓을 수 있고, 새 방으로 가는 길은 막지 않는다', () => {
    const s = sleep(orderHome(rich())!)
    const withChair = placeFurniture({ ...s, inv: { chair: 1, nightstand: 1 } }, 'chair', { x: SIDE_ROOM.x0, y: SIDE_ROOM.y1 })
    expect(withChair).not.toBeNull()
    // 문 안쪽 칸을 막으면 새 방에 못 들어간다
    expect(placement([], 'nightstand', { x: SIDE_DOOR.x + 1, y: SIDE_DOOR.y })).toBeNull()
    expect(placement([], 'nightstand', SIDE_DOOR)).toBeNull()
  })
  it('넓히기 전에는 새 방 자리에 가구를 놓을 수 없다', () => {
    expect(placement([], 'chair', { x: SIDE_ROOM.x0, y: SIDE_ROOM.y0 + 2 })).toBeNull()
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
    let s = tapTile({ ...two, npcs: {}, player: { ...two.player, ...START, path: [] } }, LADDER)
    for (let i = 0; i < 200 && !inAttic(s.player); i++) s = tick(s, 0.05, zero, CONTENT).state
    expect(inAttic(s.player)).toBe(true)
    expect(isHome({ x: Math.round(s.player.x), y: Math.round(s.player.y) })).toBe(true)
    expect(viewRoomAt({ x: Math.round(s.player.x), y: Math.round(s.player.y) })).toMatchObject({ x0: ATTIC.x0, y0: ATTIC.y0, w: 8, h: 6 })
    // 문깔개를 밟으면 사다리 앞으로
    s = tapTile({ ...s, player: { ...s.player, path: [] } }, ATTIC.exit)
    for (let i = 0; i < 200 && inAttic(s.player); i++) s = tick(s, 0.05, zero, CONTENT).state
    expect({ x: s.player.x, y: s.player.y }).toEqual(PLACES.ladder.stand)
  })
  it('키보드로 사다리 쪽으로 걸으면 올라간다', () => {
    const two = sleep(orderHome(stage1())!)
    const stand = PLACES.ladder.stand!
    const s = walkDirection({ ...two, npcs: {}, player: { ...two.player, x: stand.x, y: stand.y, path: [] } }, LADDER.x - stand.x, LADDER.y - stand.y)
    expect(inAttic(s.player)).toBe(true)
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
    const spot = { x: SIDE_ROOM.x0, y: SIDE_ROOM.y1 }
    const placed = placeFurniture({ ...one, inv: { chair: 1 } }, 'chair', spot)!
    setHomeLevel(0)
    const back = deserialize(serialize(placed), CONTENT)!
    expect(back.room).toEqual([{ item: 'chair', ...spot }])
  })
})

describe('옛 저장: 집 안이 지도 위에 있던 때 (계획 7-1 작업 5)', () => {
  /** 집 안을 따로 된 방으로 옮기기 전 저장 (homeRoom 표식이 없다) */
  const oldSave = (s: GameState, player: { x: number; y: number }, extra: Partial<GameState> = {}) => {
    const { homeRoom: _drop, ...flags } = s.flags
    return JSON.stringify({ ...JSON.parse(serialize(s)), ...extra, flags, player: { ...s.player, ...player } })
  }
  const h = (x: number, y: number) => ({ x: x + 14, y: y + 58 })

  it('새 게임에는 표식이 있고, 예전 집 안 칸은 같은 자리의 새 방 칸으로 옮긴다', () => {
    expect(newGame(CONTENT).flags.homeRoom).toBe(1)
    expect(h(5, 4)).toEqual(START)
    expect(h(3, 3)).toEqual(PLACES.bed.tiles[0])
    expect(h(6, 3)).toEqual(PLACES.hearth.tiles[0])
    expect(h(9, 3)).toEqual(PLACES.shelf.tiles[0])
    expect(h(3, 5)).toEqual(PLACES.desk.tiles[0])
    expect(h(9, 5)).toEqual(PLACES.workbench.tiles[0])
    expect(h(8, 3)).toEqual(LADDER)
    expect(h(10, 4)).toEqual(SIDE_DOOR)
  })
  it('집 안에 서 있던 기록자는 새 방의 같은 자리로, 문에 서 있었으면 들어와 서는 칸으로', () => {
    const s = newGame(CONTENT)
    const back = deserialize(oldSave(s, { x: 7, y: 5 }), CONTENT)!
    expect({ x: back.player.x, y: back.player.y }).toEqual(h(7, 5))
    expect(isHome(playerTileOf(back))).toBe(true)
    expect(back.flags.homeRoom).toBe(1)
    const door = deserialize(oldSave(s, { x: 6, y: 7 }), CONTENT)!
    expect({ x: door.player.x, y: door.player.y }).toEqual(HOME_ENTRY)
    // 집 밖에 있던 기록자는 그대로
    const out = deserialize(oldSave(s, { x: 20, y: 10 }), CONTENT)!
    expect({ x: out.player.x, y: out.player.y }).toEqual({ x: 20, y: 10 })
  })
  it('방 꾸미기로 놓은 가구도 같은 자리로 옮긴다 (넓힌 새 방까지), 집 단계·텃밭은 그대로', () => {
    const s = { ...newGame(CONTENT), homeLevel: 1 as const }
    const garden = { '15,4': { crop: 'herb' as const, grown: 1, wateredDay: 1 } }
    const raw = oldSave(s, { x: 12, y: 5 }, {
      room: [
        { item: 'rug', x: 4, y: 4 },
        { item: 'chair', x: 11, y: 6 },
        { item: 'table', x: 7, y: 6 },
        { item: 'jar', x: 8, y: 6, on: true },
      ],
      garden,
    } as Partial<GameState>)
    const back = deserialize(raw, CONTENT)!
    expect(back.homeLevel).toBe(1)
    expect(back.room).toEqual([
      { item: 'rug', ...h(4, 4) },
      { item: 'chair', ...h(11, 6) },
      { item: 'table', ...h(7, 6) },
      { item: 'jar', ...h(8, 6), on: true },
    ])
    expect(h(11, 6).x).toBeGreaterThanOrEqual(SIDE_ROOM.x0)
    expect({ x: back.player.x, y: back.player.y }).toEqual(h(12, 5))
    expect(back.garden).toEqual(garden)
  })
  it('동반 동물도 집 안에 있었으면 함께 옮긴다', () => {
    const s = newGame(CONTENT)
    const cat = { kind: 'cat', name: '나비', since: 1, x: 4, y: 4, path: [], facing: 'down', walkTime: 0 }
    const back = deserialize(oldSave(s, { x: 5, y: 4 }, { companion: cat } as unknown as Partial<GameState>), CONTENT)!
    expect({ x: back.companion!.x, y: back.companion!.y }).toEqual(h(4, 4))
  })
  it('이미 옮긴 저장은 다시 옮기지 않는다 (예전 집 자리 풀밭에 서 있어도)', () => {
    const s = newGame(CONTENT)
    const back = deserialize(serialize({ ...s, player: { ...s.player, x: 5, y: 4 } }), CONTENT)!
    expect({ x: back.player.x, y: back.player.y }).toEqual({ x: 5, y: 4 })
  })
})

describe('문을 드나드는 동반 동물', () => {
  it('내 집 문을 밟으면 동물도 함께 들어오고, 문깔개로 나가면 함께 나간다', () => {
    const s0 = newGame(CONTENT)
    const cat = { kind: 'cat' as const, name: '나비', since: 1, x: HOME_FRONT.x - 1, y: HOME_FRONT.y, path: [], facing: 'down' as const, walkTime: 0 }
    let s: GameState = { ...s0, npcs: {}, companion: cat, player: { ...s0.player, ...HOME_FRONT, path: [HOME_DOOR] } }
    for (let i = 0; i < 40 && !isHome(playerTileOf(s)); i++) s = tick(s, 0.05, zero, CONTENT).state
    expect(playerTileOf(s)).toEqual(HOME_ENTRY)
    const inside = { x: Math.round(s.companion!.x), y: Math.round(s.companion!.y) }
    expect(isHome(inside)).toBe(true)
    // 문깔개(나가는 문) 위가 아니라 기록자 위쪽 칸에
    expect(WARPS.has(key(inside))).toBe(false)
    expect(inside).toEqual({ x: HOME_ENTRY.x, y: HOME_ENTRY.y - 1 })
    s = { ...s, player: { ...s.player, path: [{ x: HOME_ENTRY.x, y: HOME_ENTRY.y + 1 }] } }
    for (let i = 0; i < 40 && isHome(playerTileOf(s)); i++) s = tick(s, 0.05, zero, CONTENT).state
    expect(playerTileOf(s)).toEqual(HOME_FRONT)
    const outside = { x: Math.round(s.companion!.x), y: Math.round(s.companion!.y) }
    expect(isHome(outside)).toBe(false)
    // 밖에서도 문 위에는 세우지 않는다
    expect(WARPS.has(key(outside))).toBe(false)
    expect(isWalkable(outside)).toBe(true)
  })
})

describe('집 단계와 지도 맞추기', () => {
  it('불러오면 저장된 단계로, 새 게임은 0단계로 지도가 맞춰진다', () => {
    const one = sleep(orderHome(rich())!)
    setHomeLevel(0)
    deserialize(serialize(one), CONTENT)
    expect(tileAt(SIDE_ROOM.x0, SIDE_ROOM.y0 + 1)).toBe('f')
    expect(tileAt(HOUSE_RECT.x0 - 1, HOUSE_RECT.y1)).toBe('#')
    newGame(CONTENT)
    expect(tileAt(SIDE_ROOM.x0, SIDE_ROOM.y0 + 1)).toBe('_')
    expect(tileAt(HOUSE_RECT.x0 - 1, HOUSE_RECT.y1)).toBe('.')
  })
})

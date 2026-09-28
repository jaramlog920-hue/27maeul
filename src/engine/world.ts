// 이름 없는 작은 마을 (exclusion-list §2-3). 한 칸 = TILE 픽셀. 지도는 코드로 짓는다 — 폭이 어긋나는 실수를 막기 위해.
// 언덕 위 서고, 가운데 장터 광장, 알록달록한 기와지붕 이웃집, 포도원·올리브 숲, 남쪽 호숫가 나루.
// 범례
//   집 안: n 탁자 · g 항아리 · p 화분 · W 베틀 · G 복음서 선반 · K 잠긴 방 문 · Z 큰 가구 (막힘), z 바닥 가구 (걸음) · e 깔개 · E 문깔개(밟으면 밖으로) (걸음) · _ 빈 곳
//   막힘: T 나무 · # 벽 · R 지붕 · S 서고 돌벽 · b 침대 · d 책상 · h 화덕 · s 선반 · k 작업대 · w 우물 · B 벤치
//         ~ 호수 · r 갈대 · v 포도나무 · L 서고 문 · o 올리브나무 · P 기름틀 · A 모루 · O 빵 굽는 가마 · m 장터 좌판
//         x 울타리 · q 편지 바구니 · u 고깃배
//   걸음: . 풀 · , 흙길 · f 집 안 바닥 · D 문 · = 나루 · y 보리밭 · * 꽃
import { FURNITURE_DEFS } from './furniture-defs'
import type { ItemId, PlaceId, Tile } from './types'

export const TILE = 16
export const WIDTH = 48
/** 마을 부분의 높이. 그 아래(40~58줄)는 이웃집 안 방들이 있는 보이지 않는 곳 */
export const VILLAGE_H = 40
export const HEIGHT = 60
/** 화면에 보이는 칸 수 */
export const VIEW_W = 16
export const VIEW_H = 20

/** 주인공의 집 (밖에서는 지붕이 덮이고, 들어가면 안이 보인다) */
export const HOME_RECT = { x0: 2, y0: 2, x1: 10, y1: 7 }
/** 집을 넓힐 빈 땅 (집 안은 나중에 따로 화면으로 들어가고, 밖에서는 지붕만 이만큼 커진다). 여기엔 아무것도 두지 않는다 */
export const HOME_EXPAND_RECT = { x0: 11, y0: 2, x1: 12, y1: 7 }

/** 집 안 방 (이웃집은 벽 포함 10×8, 서고는 13×10). 바깥 문을 밟으면 entry로, 안의 문깔개(exit)를 밟으면 문 앞으로 */
export const ROOM_W = 10
export const ROOM_H = 8
export interface Room {
  owner: string
  x0: number
  y0: number
  w: number
  h: number
  /** 마을에 있는 이 집의 문 */
  door: Tile
  entry: Tile
  exit: Tile
  /** 집에 있을 때 주인이 서 있는 곳 */
  sit: Tile
  /** 붙박이 [x0에서 떨어진 칸, y0에서 떨어진 칸, 글자] */
  things: [number, number, string][]
  /** 가구 그림 [칸, 칸, 가구] — 바닥 것은 밟고, 큰 것은 막고, 작은 것은 탁자 위에 */
  decor: [number, number, ItemId, 'flip'?][]
}

function room(
  owner: string,
  x0: number,
  y0: number,
  door: Tile,
  sit: [number, number],
  things: [number, number, string][],
  decor: [number, number, ItemId, 'flip'?][] = [],
  w = ROOM_W,
  h = ROOM_H,
): Room {
  const exit = { x: x0 + Math.floor((w - 1) / 2), y: y0 + h - 1 }
  return { owner, x0, y0, w, h, door, entry: { x: exit.x, y: exit.y - 1 }, exit, sit: { x: x0 + sit[0], y: y0 + sit[1] }, things, decor }
}

/** 서고 안: 가운데 복음서 선반, 양옆 책장, 좌우 벽의 잠긴 방 문 넷 (13×10) */
export const LIBRARY_W = 13
export const LIBRARY_H = 10
const libraryThings: [number, number, string][] = [
  [5, 1, 'G'], [6, 1, 'G'], [7, 1, 'G'],
  [1, 1, 's'], [2, 1, 's'], [3, 1, 's'], [9, 1, 's'], [10, 1, 's'], [11, 1, 's'],
  [0, 3, 'K'], [0, 6, 'K'], [12, 3, 'K'], [12, 6, 'K'],
  [3, 4, 'n'], [9, 4, 'n'], [3, 6, 'n'], [9, 6, 'n'],
  [1, 8, 'p'], [11, 8, 'p'],
  [6, 3, 'e'], [6, 4, 'e'], [6, 5, 'e'], [6, 6, 'e'], [6, 7, 'e'],
]

export const ROOMS: readonly Room[] = [
  // 빵 굽는 이웃: 가마 둘, 찬장, 밀가루 항아리, 과일 접시·주전자 올린 탁자, 둥근 깔개
  room('baker', 2, 41, { x: 5, y: 17 }, [5, 4],
    [[1, 1, 'O'], [2, 1, 'O'], [8, 1, 'g'], [8, 2, 'g'], [3, 3, 'n'], [4, 3, 'n'], [8, 5, 'b']],
    [[4, 1, 'cupboard'], [7, 1, 'barrel'], [2, 3, 'chair'], [5, 3, 'chair', 'flip'], [3, 3, 'fruitBowl'], [4, 3, 'teapot'],
     [5, 4, 'roundRug'], [1, 5, 'bigPlant'], [7, 5, 'pillows'], [1, 2, 'lampStand']]),
  // 물 긷는 아이네: 침대 둘, 궤짝, 화덕, 물항아리, 둘러앉는 탁자, 돗자리
  room('child', 16, 41, { x: 36, y: 17 }, [3, 4],
    [[1, 1, 'b'], [2, 1, 'b'], [5, 1, 'h'], [8, 1, 'g'], [8, 2, 'g'], [4, 3, 'n'], [5, 3, 'n']],
    [[3, 1, 'chest'], [3, 3, 'chair'], [6, 3, 'chair', 'flip'], [4, 3, 'teapot'], [5, 3, 'fruitBowl'],
     [2, 5, 'mat'], [1, 5, 'pillows'], [8, 5, 'bigPlant'], [8, 3, 'lampStand']]),
  // 포도원 할아버지: 책장 둘, 포도주 통, 화덕, 평상, 모래시계 올린 탁자
  room('grandpa', 30, 41, { x: 35, y: 5 }, [5, 3],
    [[1, 1, 'b'], [6, 1, 'h'], [2, 4, 'n']],
    [[3, 1, 'bookcase'], [4, 1, 'bookcase'], [8, 1, 'barrel'], [8, 2, 'barrel'], [2, 4, 'hourglass'], [1, 4, 'chair'],
     [3, 3, 'roundRug'], [6, 5, 'daybed'], [8, 4, 'lampStand'], [1, 6, 'bigPlant']]),
  // 베 짜는 이웃: 베틀, 물레, 실 선반, 궤짝, 둥근 깔개, 말린 꽃
  room('weaver', 2, 50, { x: 28, y: 28 }, [4, 3],
    [[1, 1, 'W'], [2, 1, 'W'], [5, 1, 's'], [6, 1, 's'], [8, 1, 'b'], [6, 4, 'n']],
    [[3, 1, 'wheel'], [8, 3, 'chest'], [8, 2, 'pillows'], [3, 4, 'roundRug'], [7, 4, 'chair', 'flip'], [6, 4, 'dryFlowers'],
     [1, 4, 'lampStand'], [1, 6, 'bigPlant']]),
  // 벌 치는 이웃: 꿀 항아리, 선반, 찬장, 주전자 올린 탁자, 꽃 화분, 문 앞 돗자리
  room('beekeeper', 16, 50, { x: 42, y: 31 }, [4, 3],
    [[1, 1, 's'], [2, 1, 'g'], [3, 1, 'g'], [4, 1, 'g'], [8, 1, 'b'], [5, 4, 'n'], [1, 4, 'p'], [8, 5, 'p']],
    [[6, 1, 'cupboard'], [6, 4, 'chair', 'flip'], [5, 4, 'teapot'], [8, 3, 'lampStand'], [1, 5, 'bigPlant'], [3, 6, 'mat'],
     [8, 2, 'pillows']]),
  // 마을 서고
  // 서고는 리모델링 전 모습이 좋다 (사용자, 2026-09-29) — 가구 그림을 더하지 않는다
  room('library', 30, 49, { x: 24, y: 5 }, [6, 2], libraryThings, [], LIBRARY_W, LIBRARY_H),
]

/** 서고 안 잠긴 방 문 (왼쪽 위 → 왼쪽 아래 → 오른쪽 위 → 오른쪽 아래 = life-text의 lockedRooms 순서) */
export const LOCKED_DOORS: readonly Tile[] = (() => {
  const lib = ROOMS.find((r) => r.owner === 'library')!
  return lib.things
    .filter(([, , ch]) => ch === 'K')
    .map(([dx, dy]) => ({ x: lib.x0 + dx, y: lib.y0 + dy }))
    .sort((a, b) => a.x - b.x || a.y - b.y)
})()

/** 마을의 집들 (그리는 쪽이 집마다 다른 모양을 입힌다). 지도를 지을 때 채워진다 */
export interface House {
  id: string
  x0: number
  y0: number
  x1: number
  /** 앞벽 아래 줄 (문이 있는 줄) */
  y1: number
  doorX: number
}
export const HOUSES: House[] = []

export function houseAt(x: number, y: number): House | null {
  return HOUSES.find((h) => x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1) ?? null
}

function build(): string[] {
  const g: string[][] = Array.from({ length: HEIGHT }, (_, y) => Array<string>(WIDTH).fill(y < VILLAGE_H ? '.' : '_'))
  const set = (x: number, y: number, c: string) => {
    g[y][x] = c
  }
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c)
  }
  const building = (x0: number, y0: number, x1: number, y1: number, door: Tile) => {
    rect(x0, y0, x1, y1, '#')
    rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, 'f')
    set(door.x, door.y, 'D')
  }
  /** 이웃집: 비스듬히 내려다본 지붕과 앞벽 두 줄, 문은 아래 줄에. 집 앞에는 꽃밭 */
  const roofed = (id: string, x0: number, y0: number, x1: number, y1: number, doorX: number, wall = '#') => {
    rect(x0, y0, x1, y1 - 2, 'R')
    rect(x0, y1 - 1, x1, y1, wall)
    set(doorX, y1, wall === 'S' ? 'L' : 'D')
    HOUSES.push({ id, x0, y0, x1, y1, doorX })
  }
  const bed = (y: number, xs: number[]) => {
    for (const x of xs) if (g[y][x] === '.') set(x, y, '*')
  }

  // 테두리 (위·양옆은 나무, 아래는 호수 건너 숲)
  rect(0, 0, WIDTH - 1, 0, 'T')
  rect(0, VILLAGE_H - 1, WIDTH - 1, VILLAGE_H - 1, 'T')
  rect(0, 0, 0, VILLAGE_H - 1, 'T')
  rect(WIDTH - 1, 0, WIDTH - 1, VILLAGE_H - 1, 'T')

  // 큰길 둘 (동서), 서고 → 장터 → 나루로 내려가는 길
  rect(1, 10, 46, 10, ',')
  rect(1, 23, 46, 23, ',')
  rect(24, 6, 24, 32, ',')

  // ── 북쪽: 내 집, 벤치 언덕, 서고, 할아버지 집과 포도원 ──
  building(2, 2, 10, 7, { x: 6, y: 7 })
  set(3, 3, 'b')
  set(6, 3, 'h')
  set(9, 3, 's')
  set(3, 5, 'd')
  set(9, 5, 'k')
  rect(6, 8, 6, 9, ',') // 집 문 앞
  set(7, 8, 'q') // 문 앞 편지 바구니
  for (const [x, y] of [[13, 2], [16, 1], [17, 3], [16, 3], [13, 1], [15, 4], [17, 5], [14, 6]]) set(x, y, '*')
  set(14, 2, 'B') // 언덕 벤치
  set(15, 7, 'w') // 우물
  rect(15, 8, 15, 9, ',')
  roofed('library', 20, 1, 28, 5, 24, 'S') // 마을 서고
  bed(6, [21, 22, 26, 27])
  for (const [x, y] of [[19, 3], [29, 3], [19, 7], [29, 7]]) set(x, y, '*')
  roofed('grandpa', 32, 2, 38, 5, 35) // 포도원 할아버지
  bed(6, [33, 34, 36, 37])
  rect(35, 6, 35, 9, ',')
  for (const y of [2, 4, 6, 8]) for (let x = 40; x <= 46; x++) if (x !== 43) set(x, y, 'v')

  // ── 가운데: 빵집, 장터 광장, 아이네, 올리브 숲 ──
  roofed('baker', 2, 13, 8, 17, 5) // 빵 굽는 이웃
  bed(18, [3, 6, 7])
  set(9, 16, 'O') // 바깥 화덕
  rect(5, 18, 5, 22, ',')
  rect(19, 13, 29, 20, ',') // 장터 광장
  set(20, 14, 'm')
  set(28, 14, 'm')
  set(30, 17, 'B') // 장터 벤치
  roofed('child', 34, 14, 38, 17, 36) // 물 긷는 아이네 (작은 집)
  bed(18, [34, 35, 37, 38])
  rect(36, 18, 36, 22, ',')
  for (const y of [13, 15, 17, 19, 21]) for (const x of [41, 43, 45]) set(x + (y % 4 === 1 ? 0 : 1), y, 'o')

  // ── 남쪽: 양 우리, 보리밭, 베 짜는 집, 대장간, 기름틀, 벌 치는 집 ──
  rect(2, 25, 9, 30, 'x')
  rect(3, 26, 8, 29, '.')
  set(5, 25, ',')
  set(5, 24, ',')
  rect(12, 25, 19, 30, 'y')
  roofed('weaver', 26, 25, 30, 28, 28) // 베 짜는 이웃
  bed(29, [26, 27, 29, 30])
  rect(28, 29, 28, 31, ',')
  // 모루와 기름틀은 큰길에서 이어지는 흙마당 위에 (풀밭 한가운데 흙 한 칸만 뜨지 않게)
  rect(32, 24, 34, 26, ',')
  rect(36, 24, 39, 26, ',')
  set(33, 25, 'A') // 모루
  set(38, 25, 'P') // 기름틀
  for (let x = 34; x <= 38; x += 2) set(x, 28, 'o')
  roofed('beekeeper', 40, 28, 44, 31, 42) // 벌 치는 이웃

  // ── 호숫가: 모래길, 갈대, 나루와 고깃배 ──
  rect(1, 32, 46, 32, ',')
  rect(1, 33, 46, VILLAGE_H - 2, '~')
  for (let x = 3; x <= 9; x++) set(x, 33, 'r')
  for (let x = 36; x <= 40; x++) set(x, 33, 'r')
  rect(24, 33, 24, 35, '=')
  set(25, 35, 'u')

  // 나무 몇 그루
  for (const [x, y] of [
    [1, 1], [11, 1], [18, 1], [30, 1], [12, 8], [18, 8], [31, 8], [46, 11], [11, 13], [16, 16], [31, 13], [31, 21],
    [1, 20], [11, 21], [21, 26], [22, 29], [46, 26], [10, 31], [33, 30],
  ])
    set(x, y, 'T')

  // ── 이웃집 안 ──
  for (const room of ROOMS) {
    const { x0, y0 } = room
    rect(x0, y0, x0 + room.w - 1, y0 + room.h - 1, '#')
    rect(x0 + 1, y0 + 1, x0 + room.w - 2, y0 + room.h - 2, 'f')
    set(room.exit.x, room.exit.y, 'E')
    for (const [dx, dy, ch] of room.things) set(x0 + dx, y0 + dy, ch)
    // 가구: 바닥에 까는 것은 밟는 칸(z), 큰 것은 막는 칸(Z), 작은 것은 그 자리 그대로(탁자 위)
    for (const [dx, dy, item] of room.decor) {
      const d = FURNITURE_DEFS[item]
      if (!d || d.layer === 'small') continue
      for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) set(x0 + dx + xx, y0 + dy + yy, d.layer === 'floor' ? 'z' : 'Z')
    }
  }
  return g.map((r) => r.join(''))
}

export const MAP: readonly string[] = build()

const BLOCKED = new Set(['_', 'Z', 'n', 'g', 'p', 'W', 'G', 'K', 'T', '#', 'R', 'S', 'u', 'b', 'd', 'h', 's', 'k', 'w', 'B', '~', 'r', 'v', 'o', 'P', 'A', 'O', 'm', 'x', 'q'])

export function tileAt(x: number, y: number): string {
  return MAP[y]?.[x] ?? 'T'
}

export const key = (t: Tile): string => `${t.x},${t.y}`

export function sameTile(a: Tile, b: Tile): boolean {
  return a.x === b.x && a.y === b.y
}

export function isWalkable(t: Tile, blockers: ReadonlySet<string> = new Set()): boolean {
  return !BLOCKED.has(tileAt(t.x, t.y)) && !blockers.has(key(t))
}

export function isIndoor(t: Tile): boolean {
  const c = tileAt(t.x, t.y)
  return c === 'f' || c === 'D' || c === 'e' || c === 'E' || c === 'z'
}

// ── 서고에 책이 꽂힐수록 열리는 구역 (설계 §2.7) ──
export type ZoneId = 'vineyard' | 'dock' | 'hives' | 'forge'
export interface Zone {
  id: ZoneId
  /** 서고에 꽂힌 책이 이만큼이면 열린다 */
  books: number
  x0: number
  y0: number
  x1: number
  y1: number
}
export const ZONES: readonly Zone[] = [
  { id: 'vineyard', books: 1, x0: 39, y0: 1, x1: 46, y1: 9 },
  { id: 'dock', books: 2, x0: 21, y0: 31, x1: 26, y1: 35 },
  { id: 'hives', books: 3, x0: 34, y0: 28, x1: 46, y1: 32 },
  { id: 'forge', books: 4, x0: 32, y0: 24, x1: 34, y1: 27 },
]

export function zoneAt(t: Tile): Zone | null {
  return ZONES.find((z) => t.x >= z.x0 && t.x <= z.x1 && t.y >= z.y0 && t.y <= z.y1) ?? null
}

/** 아직 열리지 않은 구역 */
export function lockedZones(books: number): Zone[] {
  return ZONES.filter((z) => books < z.books)
}

const lockedCache = new Map<number, ReadonlySet<string>>()
/** 아직 열리지 않은 칸들 (길찾기에서 막는다) */
export function lockedTiles(books: number): ReadonlySet<string> {
  let set = lockedCache.get(books)
  if (!set) {
    const out = new Set<string>()
    for (const z of lockedZones(books)) for (let y = z.y0; y <= z.y1; y++) for (let x = z.x0; x <= z.x1; x++) out.add(`${x},${y}`)
    lockedCache.set(books, (set = out))
  }
  return set
}

/** 이 칸이 들어 있는 이웃집 방 */
export function roomAt(t: Tile): Room | null {
  return ROOMS.find((r) => t.x >= r.x0 && t.x < r.x0 + r.w && t.y >= r.y0 && t.y < r.y0 + r.h) ?? null
}

/** 화면을 방 하나로 좁혀 보여 주는 곳: 이웃집·서고 방, 그리고 내 집 안 */
export function viewRoomAt(t: Tile): { x0: number; y0: number; w: number; h: number } | null {
  const r = roomAt(t)
  if (r) return r
  const { x0, y0, x1, y1 } = HOME_RECT
  return isHome(t) ? { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } : null
}

/** 문을 밟으면 옮겨 가는 곳: 바깥 문 → 방 안, 방의 문깔개 → 바깥 문 앞 */
export const WARPS: ReadonlyMap<string, Tile> = new Map(
  ROOMS.flatMap((r) => [
    [key(r.door), r.entry] as const,
    [key(r.exit), { x: r.door.x, y: r.door.y + 1 }] as const,
  ]),
)

/** 기록자의 집 안인가 */
export function isHome(t: Tile): boolean {
  return t.x >= 3 && t.x <= 9 && t.y >= 3 && t.y <= 7 && isIndoor(t)
}

/** 상호작용하는 곳. stand가 없으면 눌린 칸 옆으로 간다 */
export interface Place {
  tiles: Tile[]
  stand?: Tile
}

const tilesOf = (ch: string): Tile[] => {
  const out: Tile[] = []
  MAP.forEach((row, y) => [...row].forEach((c, x) => c === ch && out.push({ x, y })))
  return out
}

export const BED_STAND: Tile = { x: 4, y: 3 }
export const HEARTH_STAND: Tile = { x: 6, y: 4 }

export const PLACES: Record<PlaceId, Place> = {
  bed: { tiles: [{ x: 3, y: 3 }], stand: BED_STAND },
  desk: { tiles: [{ x: 3, y: 5 }], stand: { x: 4, y: 5 } },
  hearth: { tiles: [{ x: 6, y: 3 }], stand: HEARTH_STAND },
  shelf: { tiles: [{ x: 9, y: 3 }], stand: { x: 9, y: 4 } },
  workbench: { tiles: [{ x: 9, y: 5 }], stand: { x: 8, y: 5 } },
  well: { tiles: [{ x: 15, y: 7 }], stand: { x: 15, y: 8 } },
  hill: { tiles: [{ x: 14, y: 2 }], stand: { x: 14, y: 3 } },
  bench: { tiles: [{ x: 30, y: 17 }], stand: { x: 29, y: 17 } },
  // 저녁 초대를 받는 이웃집 문 (빵집·아이네·할아버지 집)
  house: { tiles: [{ x: 5, y: 17 }, { x: 36, y: 17 }, { x: 35, y: 5 }] },
  reeds: { tiles: tilesOf('r') },
  vine: { tiles: tilesOf('v') },
  olive: { tiles: tilesOf('o') },
  press: { tiles: [{ x: 38, y: 25 }], stand: { x: 37, y: 25 } },
  anvil: { tiles: [{ x: 33, y: 25 }], stand: { x: 33, y: 26 } },
  field: { tiles: tilesOf('y') },
  // 서고 안 복음서 선반 (문은 걸어 들어가는 문)
  library: { tiles: [{ x: 35, y: 50 }, { x: 36, y: 50 }, { x: 37, y: 50 }], stand: { x: 36, y: 51 } },
  basket: { tiles: [{ x: 7, y: 8 }], stand: { x: 6, y: 8 } },
}

export function placeAt(t: Tile): PlaceId | null {
  for (const [id, p] of Object.entries(PLACES) as [PlaceId, Place][]) if (p.tiles.some((pt) => sameTile(pt, t))) return id
  return null
}

export const START: Tile = { x: 5, y: 4 }
export const HOME_DOOR: Tile = { x: 6, y: 7 }

/** 카메라 왼쪽 위 (칸 단위, 소수 가능). 기록자를 가운데 두되 지도 밖은 보이지 않게 */
export function cameraFor(x: number, y: number, zoom = 1): { x: number; y: number } {
  // 집 안(이웃집·서고·내 집): 방을 화면 가운데에 둔다 (둘레는 그리는 쪽에서 가린다)
  const room = viewRoomAt({ x: Math.round(x), y: Math.round(y) })
  if (room) return { x: room.x0 + room.w / 2 - VIEW_W / zoom / 2, y: room.y0 + room.h / 2 - VIEW_H / zoom / 2 }
  const cx = Math.min(Math.max(x + 0.5 - VIEW_W / zoom / 2, 0), WIDTH - VIEW_W / zoom)
  const cy = Math.min(Math.max(y + 0.5 - VIEW_H / zoom / 2, 0), VILLAGE_H - VIEW_H / zoom)
  return { x: cx, y: cy }
}

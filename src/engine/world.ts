// 이름 없는 작은 마을 (exclusion-list §2-3). 한 칸 = TILE 픽셀. 지도는 코드로 짓는다 — 폭이 어긋나는 실수를 막기 위해.
// 범례
//   막힘: T 나무 · # 벽 · b 침대 · d 책상 · h 화덕 · s 선반 · k 작업대 · w 우물 · B 벤치 · ~ 강 · r 갈대 · v 포도나무
//         o 올리브나무 · P 기름틀 · A 모루 · O 빵 굽는 가마 · m 장터 좌판 · x 울타리
//   걸음: . 풀 · , 흙길 · f 집 안 바닥 · D 문 · = 나루 · y 보리밭 · * 꽃
import type { PlaceId, Tile } from './types'

export const TILE = 16
export const WIDTH = 32
export const HEIGHT = 28
/** 화면에 보이는 칸 수 */
export const VIEW_W = 16
export const VIEW_H = 20

function build(): string[] {
  const g: string[][] = Array.from({ length: HEIGHT }, () => Array<string>(WIDTH).fill('.'))
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

  // 테두리와 강
  rect(0, 0, WIDTH - 1, 0, 'T')
  rect(0, HEIGHT - 1, WIDTH - 1, HEIGHT - 1, 'T')
  rect(0, 0, 0, HEIGHT - 1, 'T')
  rect(WIDTH - 1, 0, WIDTH - 1, HEIGHT - 1, 'T')
  rect(29, 1, 30, HEIGHT - 2, '~')

  // 길
  rect(1, 9, 28, 9, ',')
  rect(11, 1, 11, 26, ',')
  rect(1, 17, 28, 17, ',')
  rect(6, 8, 6, 8, ',') // 집 문 앞
  rect(5, 10, 5, 10, ',') // 빵집 문 앞
  rect(23, 10, 23, 10, ',') // 아이네 문 앞
  rect(23, 5, 23, 8, ',') // 할아버지 집 → 큰길
  rect(27, 10, 27, 16, ',') // 강가 길
  rect(24, 18, 24, 22, ',') // 기름틀 가는 길

  // 집들
  building(2, 2, 10, 7, { x: 6, y: 7 }) // 기록자의 집
  building(2, 11, 8, 15, { x: 5, y: 11 }) // 빵 굽는 이웃
  building(21, 11, 26, 15, { x: 23, y: 11 }) // 물 긷는 아이네
  building(21, 1, 26, 4, { x: 23, y: 4 }) // 포도원 할아버지

  // 기록자의 집 안
  set(3, 3, 'b')
  set(6, 3, 'h')
  set(9, 3, 's')
  set(3, 5, 'd')
  set(9, 5, 'k')
  // 빵집 가마
  set(3, 12, 'O')

  // 언덕(꽃과 벤치), 우물
  for (const [x, y] of [[12, 1], [13, 2], [16, 1], [17, 3], [12, 3], [16, 3], [13, 1]]) set(x, y, '*')
  set(14, 2, 'B')
  set(14, 6, 'w')

  // 포도원: 포도나무 줄 사이로 걷는다
  for (const y of [6, 8]) for (let x = 19; x <= 27; x++) if (x !== 23) set(x, y, 'v')

  // 장터
  rect(12, 11, 19, 16, ',')
  set(13, 12, 'm')
  set(18, 12, 'm')
  set(19, 15, 'B') // 장터 벤치

  // 양 우리
  rect(2, 19, 8, 24, 'x')
  rect(3, 20, 7, 23, '.')
  set(5, 19, ',')
  set(5, 18, ',')

  // 보리밭
  rect(13, 19, 19, 24, 'y')

  // 대장간과 기름틀, 올리브나무
  set(22, 18, 'A')
  set(25, 21, 'P')
  for (let x = 21; x <= 27; x++) if (x !== 24) set(x, 24, 'o')

  // 갈대와 나루
  for (let y = 13; y <= 16; y++) set(28, y, 'r')
  rect(28, 11, 30, 11, '=')

  // 나무
  for (const [x, y] of [
    [1, 1], [18, 2], [10, 10], [1, 16], [9, 18], [9, 25], [20, 26], [26, 26], [1, 26], [18, 10], [20, 16], [28, 25], [28, 3],
  ])
    set(x, y, 'T')
  return g.map((r) => r.join(''))
}

export const MAP: readonly string[] = build()

const BLOCKED = new Set(['T', '#', 'b', 'd', 'h', 's', 'k', 'w', 'B', '~', 'r', 'v', 'o', 'P', 'A', 'O', 'm', 'x'])

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
  return c === 'f' || c === 'D'
}

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
  well: { tiles: [{ x: 14, y: 6 }], stand: { x: 14, y: 7 } },
  hill: { tiles: [{ x: 14, y: 2 }], stand: { x: 14, y: 3 } },
  bench: { tiles: [{ x: 19, y: 15 }], stand: { x: 18, y: 15 } },
  // 저녁 초대를 받는 이웃집 문 (빵집·아이네·할아버지 집)
  house: { tiles: [{ x: 5, y: 11 }, { x: 23, y: 11 }, { x: 23, y: 4 }] },
  reeds: { tiles: tilesOf('r') },
  vine: { tiles: tilesOf('v') },
  olive: { tiles: tilesOf('o') },
  press: { tiles: [{ x: 25, y: 21 }], stand: { x: 24, y: 21 } },
  anvil: { tiles: [{ x: 22, y: 18 }], stand: { x: 22, y: 17 } },
  field: { tiles: tilesOf('y') },
}

export function placeAt(t: Tile): PlaceId | null {
  for (const [id, p] of Object.entries(PLACES) as [PlaceId, Place][]) if (p.tiles.some((pt) => sameTile(pt, t))) return id
  return null
}

export const START: Tile = { x: 5, y: 4 }
export const HOME_DOOR: Tile = { x: 6, y: 7 }

/** 카메라 왼쪽 위 (칸 단위, 소수 가능). 기록자를 가운데 두되 지도 밖은 보이지 않게 */
export function cameraFor(x: number, y: number, zoom = 1): { x: number; y: number } {
  const cx = Math.min(Math.max(x + 0.5 - VIEW_W / zoom / 2, 0), WIDTH - VIEW_W / zoom)
  const cy = Math.min(Math.max(y + 0.5 - VIEW_H / zoom / 2, 0), HEIGHT - VIEW_H / zoom)
  return { x: cx, y: cy }
}

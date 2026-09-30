// 이름 없는 작은 마을 (exclusion-list §2-3). 한 칸 = TILE 픽셀. 지도는 코드로 짓는다 — 폭이 어긋나는 실수를 막기 위해.
// 언덕 위 서고, 가운데 장터 광장, 알록달록한 기와지붕 이웃집, 포도원·올리브 숲, 남쪽 호숫가 나루.
// 범례
//   집 안: n 탁자 · g 항아리 · p 화분 · W 베틀 · G 복음서 선반 · K 잠긴 방 문 · Q 한 권 선반(사도행전·요한계시록) · M 여정 판
//          C 일곱 교회 카드 판 · Y 편지 선반 · V 편지꽂이 · N 방 창 · Z 큰 가구 (막힘)
//          J 열린 서고 방 문 (걸음), z 바닥 가구 (걸음) · e 깔개 · E 문깔개(밟으면 밖으로) (걸음) · _ 빈 곳
//   막힘: T 나무 · # 벽 · R 지붕 · S 서고 돌벽 · b 침대 · d 책상 · h 화덕 · s 선반 · k 작업대 · w 우물 · B 벤치
//         ~ 호수 · r 갈대 · v 포도나무 · L 서고 문 · o 올리브나무 · P 기름틀 · A 모루 · O 빵 굽는 가마 · m 장터 좌판
//         x 울타리 · q 편지 바구니 · u 고깃배
//   걸음: . 풀 · , 흙길 · f 집 안 바닥 · D 문 · = 나루 · y 보리밭 · * 꽃 · l 텃밭 (보리밭처럼 밟고 들어가 돌본다)
import { FURNITURE_DEFS } from './furniture-defs'
import type { ItemId, PlaceId, Tile } from './types'

export const TILE = 16
export const WIDTH = 48
/**
 * 마을 부분의 높이. 그 아래(40~79줄)는 이웃집 안 방들이 있는 보이지 않는 곳
 * (60줄부터 사도행전 방, 내 집 안, 로마서–빌레몬서 방 / 70줄부터 요한계시록 방, 히브리서–유다서 방. 78–79줄은 비워 둔다)
 */
export const VILLAGE_H = 40
/** 계획 8 작업 5에서 70 → 80 (히브리서–유다서 방 자리). 저장에는 지도 크기가 들어가지 않는다 */
export const HEIGHT = 80
/** 화면에 보이는 칸 수 */
export const VIEW_W = 16
export const VIEW_H = 20

/**
 * 주인공의 집 (계획 7-1 작업 5): 밖에서 보는 집은 가장 작은 이웃집(어부 집)과 같은 5칸×4줄 — 지붕 두 줄, 앞벽 두 줄, 문은 아래 줄 가운데.
 * 집 안은 이웃집처럼 지도 아래 보이지 않는 곳의 방(HOME_ROOM). 문을 밟으면 들어가고 문깔개로 나온다.
 * 1단계 "방 하나 더"에는 밖의 집이 왼쪽으로만 두 칸 넓어진다 (문·길·바구니는 그대로, 오른쪽 텃밭 쪽 13열은 풀밭). 지금 모양은 homeHouse()
 * 집 왼쪽 땅(HOUSE_GROW)은 집 넓히기 자리 — 다른 건물·자리를 두지 않는다
 */
export const HOUSE_RECT = { x0: 8, y0: 4, x1: 12, y1: 7 }
/** 1단계에 밖의 집이 넓어지는 왼쪽 두 줄 (넓히기 전에는 빈 풀밭) */
export const HOUSE_GROW = { x0: HOUSE_RECT.x0 - 2, y0: HOUSE_RECT.y0, x1: HOUSE_RECT.x0 - 1, y1: HOUSE_RECT.y1 }
/** 밖에서 들어가는 내 집 문 */
export const HOME_DOOR: Tile = { x: 10, y: 7 }
/** 내 집 문 앞 (문깔개로 나오면 서는 곳) */
export const HOME_FRONT: Tile = { x: HOME_DOOR.x, y: HOME_DOOR.y + 1 }

/** 집 안 방 — 넓히기 전 (벽 포함 9×6, 지도 아래 보이지 않는 곳). 지금 크기는 homeRect() */
export const HOME_RECT = { x0: 16, y0: 60, x1: 24, y1: 65 }
/** 집 안 방 오른쪽의 빈 곳 (1단계 "방 하나 더"에서 새 방이 된다) */
export const HOME_EXPAND_RECT = { x0: 25, y0: 60, x1: 27, y1: 65 }
/** 1단계에서 생기는 새 방의 바닥 (두 칸 폭 × 네 줄 — 계획 6에서 짝의 방이 된다). 바깥 벽은 27열 */
export const SIDE_ROOM = { x0: 25, y0: 61, x1: 26, y1: 64 }
/** 작업실과 새 방 사이 벽에 낸 문 (선반 앞 칸 옆) */
export const SIDE_DOOR: Tile = { x: 24, y: 62 }
/** 2단계 "다락 서재": 작업실 선반 옆의 사다리 */
export const LADDER: Tile = { x: 22, y: 61 }
/** 옛 저장의 집 안 (지도 위 2~10열, 넓히면 13열까지, 2~7줄) → 새 방으로 옮기는 거리 */
export const OLD_HOME = { x0: 2, y0: 2, x1: 10, x1Wide: 13, y1: 7, dx: HOME_RECT.x0 - 2, dy: HOME_RECT.y0 - 2 }

/**
 * 집 단계 (0 작업실, 1 방 하나 더, 2 다락 서재). 지도 문자열은 고정이므로 넓힌 칸은 tileAt이 덧씌워 돌려준다.
 * 게임 상태(homeLevel)와 맞추는 것은 엔진 입구(game.ts의 syncHome)가 한다.
 */
let homeLevel = 0
export function setHomeLevel(level: number): void {
  homeLevel = level === 1 || level === 2 ? level : 0
}
export function currentHomeLevel(): number {
  return homeLevel
}

/**
 * 서고의 열린 방 문 번호들 (LOCKED_DOORS 번호 = 방 표 shelf-rooms의 door — 판정은 books.openDoorsFor,
 * 게임 상태와 맞추는 것은 game.ts의 syncHome). 열린 방의 잠긴 문(K)은 걸을 수 있는 열린 문(J)이 된다
 */
let openDoorSet: ReadonlySet<number> = new Set()
export function setOpenDoors(doors: readonly number[]): void {
  openDoorSet = new Set(doors)
}
/** 지금 열린 문 번호 (작은 것부터) */
export function openDoors(): number[] {
  return [...openDoorSet].sort((a, b) => a - b)
}

/** 단계별로 덧씌우는 칸 ('x,y' → 글자) */
const HOME_OVERLAY: readonly ReadonlyMap<string, string>[] = (() => {
  const one = new Map<string, string>()
  const { x0, y0, x1, y1 } = HOME_EXPAND_RECT
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) one.set(`${x},${y}`, x === x1 || y === y0 || y === y1 ? '#' : 'f')
  one.set(`${SIDE_DOOR.x},${SIDE_DOOR.y}`, 'D')
  // 밖에서는 집이 왼쪽으로 두 칸 (지붕 두 줄, 앞벽 두 줄)
  for (let x = HOUSE_GROW.x0; x <= HOUSE_GROW.x1; x++)
    for (let y = HOUSE_GROW.y0; y <= HOUSE_GROW.y1; y++) one.set(`${x},${y}`, y <= HOUSE_RECT.y1 - 2 ? 'R' : '#')
  const two = new Map(one)
  two.set(`${LADDER.x},${LADDER.y}`, 'H')
  return [new Map(), one, two]
})()

/** 지금 집의 크기 (벽 포함) */
export function homeRect(level = homeLevel): { x0: number; y0: number; x1: number; y1: number } {
  return level >= 1 ? { ...HOME_RECT, x1: HOME_EXPAND_RECT.x1 } : HOME_RECT
}

/** 밖에서 보는 지금 내 집 (1단계부터 왼쪽으로 두 칸 넓다) */
export function homeHouse(level = homeLevel): House {
  return { id: 'home', x0: level >= 1 ? HOUSE_GROW.x0 : HOUSE_RECT.x0, y0: HOUSE_RECT.y0, x1: HOUSE_RECT.x1, y1: HOUSE_RECT.y1, doorX: HOME_DOOR.x }
}

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
  /**
   * 가구 그림 [칸, 칸, 가구, 모양] — 바닥 것은 밟고, 큰 것은 막고, 작은 것은 탁자 위에.
   * 모양 'flip'은 좌우를 뒤집어, 'half'는 그림만 반 칸 오른쪽으로 옮겨 그린다 (짝수 폭 가구를 홀수 폭 방 가운데에 — 칸은 그대로)
   */
  decor: Decor[]
  /** 문깔개를 밟으면 나가는 곳 (없으면 문 바로 아래 칸) */
  out?: Tile
}

export type Decor = [number, number, ItemId, ('flip' | 'half')?]

function room(
  owner: string,
  x0: number,
  y0: number,
  door: Tile,
  sit: [number, number],
  things: [number, number, string][],
  decor: Decor[] = [],
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
const LIBRARY_X0 = 30
const LIBRARY_Y0 = 49
/** 서고 왼쪽 위 잠긴 문 = 사도행전 방 문 (LOCKED_DOORS[0]) */
export const ACTS_DOOR: Tile = { x: LIBRARY_X0 + 0, y: LIBRARY_Y0 + 3 }

/**
 * 사도행전 방 (계획 5 작업 5, 11×8, 지도 아래 60줄부터 보이지 않는 곳). 서고 왼쪽 위 문을 밟으면 들어오고,
 * 문깔개를 밟으면 서고 안 그 문 오른쪽 칸으로 나간다.
 * 벽 가운데에 여정 판(M), 왼쪽에 사도행전 선반(Q), 오른쪽에 책장, 가운데 읽는 탁자 — 문을 가운데 둔 대칭
 */
export const ACTS_W = 11
export const ACTS_H = 8
const ACTS_X0 = 2
const ACTS_Y0 = 60
const actsThings: [number, number, string][] = [
  [4, 0, 'M'], [5, 0, 'M'], [6, 0, 'M'],
  [1, 1, 'Q'], [2, 1, 'Q'], [3, 1, 'Q'], [7, 1, 's'], [8, 1, 's'], [9, 1, 's'],
  [5, 4, 'n'],
  [5, 5, 'e'], [5, 6, 'e'],
  [1, 6, 'p'], [9, 6, 'p'],
]

/** 서고 왼쪽 아래 잠긴 문 = 로마서–빌레몬서 방 문 (LOCKED_DOORS[1], 방 표 romPhm의 door) */
export const LETTERS_DOOR: Tile = { x: LIBRARY_X0 + 0, y: LIBRARY_Y0 + 6 }

/**
 * 로마서–빌레몬서 방 (계획 7 작업 7, 11×8, 지도 아래 60줄 — 서고 바로 아래 보이지 않는 곳).
 * 계획서는 15열을 적었지만 계획 7-1에서 내 집 안(16~27열)이 그 자리로 와서, 겹치지 않는 30열로 옮겼다.
 * 서고 왼쪽 아래 문을 밟으면 들어오고, 문깔개를 밟으면 서고 안 그 문 오른쪽 칸으로 나간다.
 * 문을 가운데 둔 대칭: 위 벽 가운데 편지꽂이(V), 그 양옆에 같은 창(N) 둘, 왼쪽 편지 선반(Y)·오른쪽 책장, 가운데 읽는 탁자. 놀이판은 없다
 */
export const LETTERS_W = 11
export const LETTERS_H = 8
const LETTERS_X0 = 30
const LETTERS_Y0 = 60
const lettersThings: [number, number, string][] = [
  [2, 0, 'N'], [4, 0, 'V'], [5, 0, 'V'], [6, 0, 'V'], [8, 0, 'N'],
  [1, 1, 'Y'], [2, 1, 'Y'], [3, 1, 'Y'], [7, 1, 's'], [8, 1, 's'], [9, 1, 's'],
  [5, 4, 'n'],
  [5, 5, 'e'], [5, 6, 'e'],
  [1, 6, 'p'], [9, 6, 'p'],
]

/** 서고 오른쪽 위 잠긴 문 = 히브리서–유다서 방 문 (LOCKED_DOORS[2], 방 표 hebJud의 door) */
export const HEB_JUD_DOOR: Tile = { x: LIBRARY_X0 + LIBRARY_W - 1, y: LIBRARY_Y0 + 3 }

/**
 * 히브리서–유다서 방 (계획 8 작업 5, 11×8, 지도 아래 70줄 — 로마서–빌레몬서 방 바로 아래 보이지 않는 곳).
 * 서고 오른쪽 위 문을 밟으면 들어오고, 문깔개를 밟으면 서고 안 그 문 **왼쪽** 칸으로 나간다 (오른쪽 벽 문).
 * 붙박이는 로마서–빌레몬서 방과 같다(위 벽 편지꽂이·같은 창 둘, 왼쪽 편지 선반·오른쪽 책장, 가운데 읽는 탁자).
 * 두 방을 가르는 것은 구석 화분 대신 등잔대 둘, 탁자 아래 깔개, 선반 위 테 색과 책등 색 묶음. 놀이판은 없다.
 * 계획 9(요한계시록 방)는 같은 70줄의 16열에 지었다 — 지도 높이를 다시 늘리지 않게
 */
export const HEB_JUD_W = 11
export const HEB_JUD_H = 8
const HEB_JUD_X0 = 30
const HEB_JUD_Y0 = 70
const hebJudThings: [number, number, string][] = [
  [2, 0, 'N'], [4, 0, 'V'], [5, 0, 'V'], [6, 0, 'V'], [8, 0, 'N'],
  [1, 1, 'Y'], [2, 1, 'Y'], [3, 1, 'Y'], [7, 1, 's'], [8, 1, 's'], [9, 1, 's'],
  [5, 4, 'n'],
]
/** 등잔대 둘(좌우 거울)과 탁자 아래 세 칸 깔개(문 앞 긴 깔개 자리를 대신한다) — 문을 가운데 둔 대칭 */
const hebJudDecor: Decor[] = [
  [1, 6, 'lampStand'], [9, 6, 'lampStand', 'flip'],
  [4, 5, 'rug'],
]

/** 서고 오른쪽 아래 잠긴 문 = 요한계시록 방 문 (LOCKED_DOORS[3], 방 표 rev의 door) */
export const REV_DOOR: Tile = { x: LIBRARY_X0 + LIBRARY_W - 1, y: LIBRARY_Y0 + 6 }

/**
 * 요한계시록 방 (계획 9 작업 4, 11×8, 지도 아래 70줄 16열 — 내 집 안(16–27 × 60–65) 바로 아래, 히브리서–유다서 방 왼쪽).
 * 서고 오른쪽 아래 문을 밟으면 들어오고, 문깔개를 밟으면 서고 안 그 문 **왼쪽** 칸으로 나간다 (오른쪽 벽 문).
 * 문을 가운데 둔 대칭: 위 벽 가운데 일곱 교회 카드 판(C, 여정 판과 같은 나무 테), 그 양옆에 같은 창(N) 둘,
 * 왼쪽 한 권 선반(Q — 사도행전 선반 그림, 위 테 색만 다름)·오른쪽 책장, 가운데 읽는 탁자와 그 아래 둥근 깔개, 구석 화분 둘.
 * 요한계시록의 상(별·촛대 등)은 그리지 않는다 — 등잔대도 두지 않는다 (exclusion §4-7)
 */
export const REV_W = 11
export const REV_H = 8
const REV_X0 = 16
const REV_Y0 = 70
const revThings: [number, number, string][] = [
  [2, 0, 'N'], [4, 0, 'C'], [5, 0, 'C'], [6, 0, 'C'], [8, 0, 'N'],
  [1, 1, 'Q'], [2, 1, 'Q'], [3, 1, 'Q'], [7, 1, 's'], [8, 1, 's'], [9, 1, 's'],
  [5, 4, 'n'],
  [1, 6, 'p'], [9, 6, 'p'],
]
/** 탁자 아래 둥근 깔개 (두 칸 폭이라 그림만 반 칸 옮겨 문 줄 가운데에) */
const revDecor: Decor[] = [[4, 5, 'roundRug', 'half']]

// ── 모이는 곳과 둘이 가는 곳 (계획 10) ──
/** 사랑방·찻집 안 (지도 아래 보이지 않는 곳) */
const HALL_ROOM_X0 = 2
const HALL_ROOM_Y0 = 70
const TEA_ROOM_X0 = 41
const TEA_ROOM_Y0 = 60
/** 마을 사랑방 (7칸×4줄) — 문 앞이 큰길 */
export const HALL_RECT = { x0: 15, y0: 6, x1: 21, y1: 9 }
export const HALL_DOOR: Tile = { x: 18, y: 9 }
/** 정원 찻집 (5칸×4줄) — 문 앞이 큰길 */
export const TEA_RECT = { x0: 28, y0: 6, x1: 32, y1: 9 }
export const TEA_DOOR: Tile = { x: 30, y: 9 }
/** 호숫가 정자 (5칸×2줄 그림, 약방 앞벽과 한 줄 띄움) 가운데 벤치 — 앉는 자리는 그 아래 호숫가 길 */
export const PAVILION_RECT = { x0: 15, y0: 30, x1: 19, y1: 31 }
export const PAVILION_SEAT: Tile = { x: 17, y: 31 }
/** 들 약초 자리 (지도 'j'): 북쪽 울타리 곁, 빵집 옆 모퉁이, 올리브 숲 위, 양 우리 아래 — 캐서 약방에 판다 */
export const WILD_HERBS: readonly Tile[] = [
  { x: 12, y: 1 },
  { x: 1, y: 22 },
  { x: 45, y: 11 },
  { x: 8, y: 31 },
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
  room('library', LIBRARY_X0, LIBRARY_Y0, { x: 24, y: 5 }, [6, 2], libraryThings, [], LIBRARY_W, LIBRARY_H),
  // 사도행전 방: 문은 서고 안 잠긴 문, 나가면 그 문 오른쪽 서고 바닥
  { ...room('acts', ACTS_X0, ACTS_Y0, ACTS_DOOR, [5, 3], actsThings, [], ACTS_W, ACTS_H), out: { x: ACTS_DOOR.x + 1, y: ACTS_DOOR.y } },
  // 로마서–빌레몬서 방: 문은 서고 안 둘째 잠긴 문, 나가면 그 문 오른쪽 서고 바닥
  { ...room('letters', LETTERS_X0, LETTERS_Y0, LETTERS_DOOR, [5, 3], lettersThings, [], LETTERS_W, LETTERS_H), out: { x: LETTERS_DOOR.x + 1, y: LETTERS_DOOR.y } },
  // 히브리서–유다서 방: 문은 서고 오른쪽 위 잠긴 문, 나가면 그 문 왼쪽 서고 바닥 (오른쪽 벽)
  { ...room('hebJud', HEB_JUD_X0, HEB_JUD_Y0, HEB_JUD_DOOR, [5, 3], hebJudThings, hebJudDecor, HEB_JUD_W, HEB_JUD_H), out: { x: HEB_JUD_DOOR.x - 1, y: HEB_JUD_DOOR.y } },
  // 요한계시록 방: 문은 서고 오른쪽 아래 잠긴 문, 나가면 그 문 왼쪽 서고 바닥 (오른쪽 벽)
  { ...room('rev', REV_X0, REV_Y0, REV_DOOR, [5, 3], revThings, revDecor, REV_W, REV_H), out: { x: REV_DOOR.x - 1, y: REV_DOOR.y } },
  // 마을 사랑방 (계획 10): 긴 탁자 둘레에 방석, 등불, 선반과 항아리, 화분 — 저녁에 이웃이 모여 논다
  room('hall', HALL_ROOM_X0, HALL_ROOM_Y0, HALL_DOOR, [2, 4],
    [[3, 0, 'N'], [5, 0, 'F'], [6, 0, 'F'], [8, 0, 'N'], [1, 1, 's'], [2, 1, 's'], [9, 1, 'g'], [10, 1, 'g'], [4, 3, 'n'], [5, 3, 'n'], [6, 3, 'n'], [7, 3, 'n'], [1, 6, 'p'], [10, 6, 'p']],
    [[4, 2, 'pillows'], [7, 2, 'pillows'], [3, 3, 'pillows'], [8, 3, 'pillows'], [5, 3, 'teapot'], [6, 3, 'fruitBowl'], [10, 3, 'lampStand'], [1, 3, 'lampStand'], [2, 5, 'mat']],
    12, 8),
  // 정원 찻집 (계획 10): 작은 탁자 둘, 찻주전자와 말린 꽃, 찻잎 항아리 — 차 한 잔 쉬어 가는 곳
  room('teahouse', TEA_ROOM_X0, TEA_ROOM_Y0, TEA_DOOR, [1, 5],
    [[3, 0, 'N'], [1, 1, 'g'], [2, 1, 'g'], [5, 1, 's'], [2, 3, 'n'], [4, 3, 'n']],
    [[2, 3, 'teapot'], [4, 3, 'dryFlowers'], [1, 3, 'chair'], [5, 3, 'chair', 'flip'], [5, 5, 'bigPlant']],
    7, 7),
]
/** 사도행전 방 */
export const ACTS_ROOM: Room = ROOMS.find((r) => r.owner === 'acts')!
/** 로마서–빌레몬서 방 */
export const LETTERS_ROOM: Room = ROOMS.find((r) => r.owner === 'letters')!
/** 히브리서–유다서 방 */
export const HEB_JUD_ROOM: Room = ROOMS.find((r) => r.owner === 'hebJud')!
/** 요한계시록 방 */
export const REV_ROOM: Room = ROOMS.find((r) => r.owner === 'rev')!

/**
 * 다락 서재 (8×6, 지도 아래 보이지 않는 곳 — 할아버지 집 방 오른쪽). 사다리로 올라오고 문깔개로 내려간다.
 * 위 벽 가운데에 창(I), 책장·독서대는 붙박이. door는 사다리 (밟는 문이 아니라 누르는 곳)
 */
export const ATTIC: Room = room(
  'attic',
  40,
  41,
  LADDER,
  [3, 2],
  [[3, 0, 'I'], [4, 0, 'I']],
  [[1, 1, 'bookcase'], [2, 1, 'bookcase'], [5, 1, 'lectern']],
  8,
  6,
)
/** 다락 창 (자기 전 읽기를 하는 곳) */
export const ATTIC_WINDOW: Tile = { x: ATTIC.x0 + 3, y: ATTIC.y0 }

/**
 * 내 집 안 (계획 7-1 작업 5): 예전 지도 위 집과 같은 넓이·배치 — 침대·화덕·선반은 윗벽 쪽, 책상·작업대는 그 아래.
 * 밖의 문(HOME_DOOR)을 밟으면 entry로, 문깔개(exit)를 밟으면 문 앞(HOME_FRONT)으로. 넓히면 오른쪽에 새 방
 */
export const HOME_ROOM: Room = {
  ...room(
    'home',
    HOME_RECT.x0,
    HOME_RECT.y0,
    HOME_DOOR,
    [3, 2],
    [[1, 1, 'b'], [4, 1, 'h'], [7, 1, 's'], [1, 3, 'd'], [7, 3, 'k']],
    [],
    HOME_RECT.x1 - HOME_RECT.x0 + 1,
    HOME_RECT.y1 - HOME_RECT.y0 + 1,
  ),
  out: HOME_FRONT,
}
/** 집에 들어오면 서는 칸 (문깔개 바로 위) */
export const HOME_ENTRY: Tile = HOME_ROOM.entry
/** 집 안 칸 (dx, dy는 방 왼쪽 위 벽에서 떨어진 칸) */
const home = (dx: number, dy: number): Tile => ({ x: HOME_RECT.x0 + dx, y: HOME_RECT.y0 + dy })

/** 서고 안 잠긴 방 문 (왼쪽 위 → 왼쪽 아래 → 오른쪽 위 → 오른쪽 아래 = life-text의 lockedRooms 순서) */
export const LOCKED_DOORS: readonly Tile[] = (() => {
  const lib = ROOMS.find((r) => r.owner === 'library')!
  return lib.things
    .filter(([, , ch]) => ch === 'K')
    .map(([dx, dy]) => ({ x: lib.x0 + dx, y: lib.y0 + dy }))
    .sort((a, b) => a.x - b.x || a.y - b.y)
})()

/** 서고 오른쪽 벽의 잠긴 방 문인가 (열린 문 그림을 좌우로 뒤집고, 방에서 나오면 문 왼쪽 칸에 선다) */
export function isRightWallDoor(x: number, y: number): boolean {
  return x === LIBRARY_X0 + LIBRARY_W - 1 && LOCKED_DOORS.some((d) => d.x === x && d.y === y)
}

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


/** 지금 마을에 선 집 모두 (내 집은 지금 단계의 크기로) */
export function housesNow(): House[] {
  return [...HOUSES, homeHouse()]
}

export function houseAt(x: number, y: number): House | null {
  return housesNow().find((h) => x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1) ?? null
}

function build(): string[] {
  const g: string[][] = Array.from({ length: HEIGHT }, (_, y) => Array<string>(WIDTH).fill(y < VILLAGE_H ? '.' : '_'))
  const set = (x: number, y: number, c: string) => {
    g[y][x] = c
  }
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c)
  }
  /** 이웃집: 비스듬히 내려다본 지붕과 앞벽 두 줄, 문은 아래 줄에. 집 앞에는 꽃밭 */
  const roofed = (id: string, x0: number, y0: number, x1: number, y1: number, doorX: number, wall = '#') => {
    rect(x0, y0, x1, y1 - 2, 'R')
    rect(x0, y1 - 1, x1, y1, wall)
    set(doorX, y1, wall === 'S' ? 'L' : 'D')
    // 내 집은 단계마다 크기가 달라 homeHouse()가 따로 알려 준다
    if (id !== 'home') HOUSES.push({ id, x0, y0, x1, y1, doorX })
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
  // 내 집: 가장 작은 이웃집만 한 5칸×4줄 (집 안은 지도 아래 HOME_ROOM). 예전 집 자리는 풀밭으로 비워 둔다
  roofed('home', HOUSE_RECT.x0, HOUSE_RECT.y0, HOUSE_RECT.x1, HOUSE_RECT.y1, HOME_DOOR.x)
  rect(HOME_DOOR.x, HOME_DOOR.y + 1, HOME_DOOR.x, 9, ',') // 집 문 앞에서 큰길까지
  set(HOME_DOOR.x + 1, HOME_DOOR.y + 1, 'q') // 문 앞 편지 바구니
  // 텃밭 열두 칸은 집 오른쪽 위 볕 드는 곳에 (집과 텃밭 사이 13열은 풀밭, 집은 왼쪽으로만 넓어진다), 둘레에 꽃
  rect(14, 3, 17, 5, 'l')
  for (const [x, y] of [[14, 2], [17, 2], [18, 5], [16, 7]]) set(x, y, '*')
  // 언덕 벤치와 우물은 큰길 아래 빈 풀밭으로
  set(14, 13, 'B') // 언덕 벤치
  set(17, 12, 'w') // 우물
  for (const [x, y] of [[12, 12], [15, 11], [13, 15], [16, 14], [12, 16]]) set(x, y, '*')
  roofed('library', 20, 1, 28, 5, 24, 'S') // 마을 서고
  bed(6, [21, 22, 26, 27])
  for (const [x, y] of [[19, 3], [29, 3], [19, 7], [29, 7]]) set(x, y, '*')
  roofed('grandpa', 32, 2, 38, 5, 35) // 포도원 할아버지
  bed(6, [33, 34, 36, 37])
  rect(35, 6, 35, 9, ',')
  for (const y of [2, 4, 6, 8]) for (let x = 40; x <= 46; x++) if (x !== 43) set(x, y, 'v')

  // ── 가운데: 빵집, 장터 광장, 아이네, 올리브 숲 ──
  roofed('baker', 2, 12, 8, 17, 5) // 빵 굽는 이웃
  bed(18, [3, 6, 7])
  set(9, 16, 'O') // 바깥 화덕
  rect(5, 18, 5, 22, ',')
  rect(19, 13, 29, 20, ',') // 장터 광장
  set(20, 14, 'm')
  set(28, 14, 'm')
  set(30, 17, 'B') // 장터 벤치
  roofed('child', 33, 13, 39, 17, 36) // 물 긷는 아이네
  bed(18, [33, 34, 38, 39])
  rect(36, 18, 36, 22, ',')
  // 올리브 숲은 작게 두 줄 (남은 땅은 편지 나르는 이웃 집에)
  for (const y of [13, 15]) for (const x of [41, 43, 45]) set(x + (y % 4 === 1 ? 0 : 1), y, 'o')

  // ── 남쪽: 양 우리, 보리밭, 베 짜는 집, 대장간, 기름틀, 벌 치는 집 ──
  rect(2, 25, 8, 30, 'x')
  rect(3, 26, 7, 29, '.')
  set(5, 25, ',')
  set(5, 24, ',')
  rect(10, 25, 14, 26, 'y') // 보리밭 (작게, 어부 집 위로 한 줄 띄움)
  roofed('weaver', 26, 24, 30, 28, 28) // 베 짜는 이웃
  bed(29, [26, 27, 29, 30])
  rect(28, 29, 28, 31, ',')
  // 모루와 기름틀은 큰길에서 이어지는 흙마당 위에 (풀밭 한가운데 흙 한 칸만 뜨지 않게)
  rect(32, 24, 34, 26, ',')
  rect(36, 24, 39, 26, ',')
  set(33, 25, 'A') // 모루
  set(38, 25, 'P') // 기름틀
  for (let x = 34; x <= 38; x += 2) set(x, 28, 'o')
  roofed('beekeeper', 39, 27, 45, 31, 42) // 벌 치는 이웃

  // ── 새 이웃 (계획 2) ──
  // 집 사이가 빽빽하지 않게: 편지 나르는 이웃은 올리브 숲을 줄인 동쪽, 목수는 빵집과 떨어진 가운데
  // 두 집 다 문이 큰길(23줄)에 바로 닿는다
  roofed('postman', 41, 18, 45, 22, 43) // 편지 나르는 이웃 (아이네 집과 한 칸 띄워 40열로 지나간다)
  roofed('carpenter', 11, 18, 17, 22, 14) // 제본 골목의 목수
  roofed('apothecary', 17, 24, 23, 28, 20) // 약방 (예전 주막 자리)
  rect(20, 29, 20, 31, ',')
  roofed('fisher', 10, 28, 14, 31, 12) // 어부 (호숫가 길 위, 약방과 두 칸 띄움)

  // ── 모이는 곳과 둘이 가는 곳 (계획 10) — 집을 옮기지 않고 큰길·호숫가 길 바로 위 빈 풀밭에 ──
  // 마을 사랑방: 내 집 오른쪽 텃밭 아래, 문이 큰길에 바로 닿는다 (저녁에 이웃이 모여 논다)
  roofed('hall', HALL_RECT.x0, HALL_RECT.y0, HALL_RECT.x1, HALL_RECT.y1, HALL_DOOR.x)
  // 정원 찻집: 서고 길과 할아버지 집 사이 작은 집 (차 한 잔 쉬기, 둘이 가는 곳)
  roofed('teahouse', TEA_RECT.x0, TEA_RECT.y0, TEA_RECT.x1, TEA_RECT.y1, TEA_DOOR.x)
  // 호숫가 정자: 호숫가 길 위 풀밭, 지붕만 있는 정자 안 벤치 (노을 보기) — 지붕·기둥은 decor 그림
  set(PAVILION_SEAT.x, PAVILION_SEAT.y, 'B')
  // 들 약초 (약방이 사 준다): 마을 가장자리 풀밭 네 군데
  for (const t of WILD_HERBS) set(t.x, t.y, 'j')

  // ── 호숫가: 모래길, 갈대, 나루와 고깃배 ──
  rect(1, 32, 46, 32, ',')
  rect(1, 33, 46, VILLAGE_H - 2, '~')
  for (let x = 3; x <= 9; x++) set(x, 33, 'r')
  for (let x = 36; x <= 40; x++) set(x, 33, 'r')
  rect(24, 33, 24, 35, '=')
  set(25, 35, 'u')

  // 나무는 벤치 곁 그늘에만 (길 가운데 흩어 두면 걷는 데 걸린다)
  for (const [x, y] of [
    [11, 13], [16, 16], // 언덕 벤치
    [31, 13], [32, 20], // 장터 벤치
  ])
    set(x, y, 'T')

  // ── 이웃집 안, 내 집 안, 그리고 내 집 다락 (다락은 사다리로만 오르므로 늘 지어 둔다) ──
  for (const room of [...ROOMS, ATTIC, HOME_ROOM]) {
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

// 'l'(텃밭)은 'y'(보리밭)처럼 걸을 수 있다 — 두둑 가운데 안쪽 칸은 사방이 막히면 다가갈 수 없어서 (task-3 적응)
// 'H'(사다리)는 누르는 곳이라 길찾기가 지나가지 않는다 — 지나가다 다락으로 올라가 버리지 않게. 'I'는 다락 창
// 'Q' 한 권 선반(사도행전·요한계시록), 'M' 벽의 여정 판, 'C' 벽의 일곱 교회 카드 판. 'Y' 편지 선반, 'V' 벽의 편지꽂이, 'N' 방 벽의 창, 'F' 사랑방 벽의 의뢰 게시판. 'J'(열린 서고 방 문)는 걷는 칸
const BLOCKED = new Set(['F', 'j', 'C', 'Y', 'V', 'N', 'H', 'I', '_','Z', 'n', 'g', 'p', 'W', 'G', 'K', 'Q', 'M', 'T', '#', 'R', 'S', 'u', 'b', 'd', 'h', 's', 'k', 'w', 'B', '~', 'r', 'v', 'o', 'P', 'A', 'O', 'm', 'x', 'q'])

export function tileAt(x: number, y: number): string {
  if (homeLevel > 0) {
    const o = HOME_OVERLAY[homeLevel].get(`${x},${y}`)
    if (o) return o
  }
  if (openDoorSet.size > 0 && (x === LIBRARY_X0 || x === LIBRARY_X0 + LIBRARY_W - 1)) {
    const i = LOCKED_DOORS.findIndex((d) => d.x === x && d.y === y)
    if (i >= 0 && openDoorSet.has(i)) return 'J'
  }
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
  return c === 'f' || c === 'D' || c === 'e' || c === 'E' || c === 'z' || c === 'J'
}

// ── 서고에 책이 꽂힐수록 열리는 구역 (설계 §2.7) ──
export type ZoneId = 'vineyard' | 'dock' | 'hives'
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
]
// 대장간은 처음부터 열려 있다 — 첫날부터 대장장이를 도와 그을음(→ 잉크)을 얻어야 첫 장을 엮을 수 있다

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
  const r = roomAt(t) ?? (inAttic(t) ? ATTIC : null)
  if (r) return r
  const { x0, y0, x1, y1 } = homeRect()
  return isHome(t) ? { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } : null
}

/** 다락 안 (벽 포함) */
export function inAttic(t: Tile): boolean {
  return t.x >= ATTIC.x0 && t.x < ATTIC.x0 + ATTIC.w && t.y >= ATTIC.y0 && t.y < ATTIC.y0 + ATTIC.h
}

/** 문을 밟으면 옮겨 가는 곳: 바깥 문 → 방 안, 방의 문깔개 → 바깥 문 앞 */
export const WARPS: ReadonlyMap<string, Tile> = new Map(
  ROOMS.flatMap((r) => [
    [key(r.door), r.entry] as const,
    [key(r.exit), r.out ?? { x: r.door.x, y: r.door.y + 1 }] as const,
  ]),
)
  .set(key(ATTIC.exit), { x: LADDER.x, y: LADDER.y + 1 }) // 다락 문깔개 → 사다리 앞
  .set(key(HOME_DOOR), HOME_ENTRY) // 내 집 문 → 집 안
  .set(key(HOME_ROOM.exit), HOME_FRONT) // 집 안 문깔개 → 문 앞

/** 기록자의 집 안인가 */
export function isHome(t: Tile): boolean {
  const { x0, x1, y0, y1 } = homeRect()
  return ((t.x > x0 && t.x < x1 && t.y > y0 && t.y <= y1) || (homeLevel >= 2 && inAttic(t))) && isIndoor(t)
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

export const BED_STAND: Tile = home(2, 1)
export const HEARTH_STAND: Tile = home(4, 2)

export const PLACES: Record<PlaceId, Place> = {
  // 집 안 (HOME_ROOM의 붙박이와 같은 자리)
  bed: { tiles: [home(1, 1)], stand: BED_STAND },
  desk: { tiles: [home(1, 3)], stand: home(2, 3) },
  hearth: { tiles: [home(4, 1)], stand: HEARTH_STAND },
  shelf: { tiles: [home(7, 1)], stand: home(7, 2) },
  workbench: { tiles: [home(7, 3)], stand: home(6, 3) },
  well: { tiles: [{ x: 17, y: 12 }], stand: { x: 17, y: 13 } },
  hill: { tiles: [{ x: 14, y: 13 }], stand: { x: 14, y: 14 } },
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
  basket: { tiles: [{ x: HOME_FRONT.x + 1, y: HOME_FRONT.y }], stand: HOME_FRONT },
  // 집 앞 편지함: 문 앞 길 왼쪽 풀밭 (편지 바구니 반대편). 그림일 뿐 길을 막지 않는다
  mailbox: { tiles: [{ x: HOME_FRONT.x - 1, y: HOME_FRONT.y }], stand: HOME_FRONT },
  garden: { tiles: tilesOf('l') },
  // 다락 서재 (2단계): 선반 옆 사다리, 다락 창가
  ladder: { tiles: [LADDER], stand: { x: LADDER.x, y: LADDER.y + 1 } },
  atticWindow: { tiles: [ATTIC_WINDOW, { x: ATTIC_WINDOW.x + 1, y: ATTIC_WINDOW.y }], stand: { x: ATTIC_WINDOW.x, y: ATTIC_WINDOW.y + 1 } },
  // 사도행전 방: 선반(서고 복음서 선반처럼), 벽의 여정 판, 읽는 탁자
  actsShelf: { tiles: [1, 2, 3].map((dx) => ({ x: ACTS_X0 + dx, y: ACTS_Y0 + 1 })), stand: { x: ACTS_X0 + 2, y: ACTS_Y0 + 2 } },
  journeyBoard: { tiles: [4, 5, 6].map((dx) => ({ x: ACTS_X0 + dx, y: ACTS_Y0 })), stand: { x: ACTS_X0 + 5, y: ACTS_Y0 + 1 } },
  actsTable: { tiles: [{ x: ACTS_X0 + 5, y: ACTS_Y0 + 4 }], stand: { x: ACTS_X0 + 5, y: ACTS_Y0 + 5 } },
  // 로마서–빌레몬서 방: 편지 선반, 읽는 탁자 (편지꽂이는 장식)
  lettersShelf: { tiles: [1, 2, 3].map((dx) => ({ x: LETTERS_X0 + dx, y: LETTERS_Y0 + 1 })), stand: { x: LETTERS_X0 + 2, y: LETTERS_Y0 + 2 } },
  lettersTable: { tiles: [{ x: LETTERS_X0 + 5, y: LETTERS_Y0 + 4 }], stand: { x: LETTERS_X0 + 5, y: LETTERS_Y0 + 5 } },
  // 히브리서–유다서 방: 편지 선반, 읽는 탁자 (로마서–빌레몬서 방과 같은 자리)
  hebJudShelf: { tiles: [1, 2, 3].map((dx) => ({ x: HEB_JUD_X0 + dx, y: HEB_JUD_Y0 + 1 })), stand: { x: HEB_JUD_X0 + 2, y: HEB_JUD_Y0 + 2 } },
  hebJudTable: { tiles: [{ x: HEB_JUD_X0 + 5, y: HEB_JUD_Y0 + 4 }], stand: { x: HEB_JUD_X0 + 5, y: HEB_JUD_Y0 + 5 } },
  // 요한계시록 방: 한 권 선반, 벽의 일곱 교회 카드 판, 읽는 탁자 (사도행전 방과 같은 자리)
  revShelf: { tiles: [1, 2, 3].map((dx) => ({ x: REV_X0 + dx, y: REV_Y0 + 1 })), stand: { x: REV_X0 + 2, y: REV_Y0 + 2 } },
  churchBoard: { tiles: [4, 5, 6].map((dx) => ({ x: REV_X0 + dx, y: REV_Y0 })), stand: { x: REV_X0 + 5, y: REV_Y0 + 1 } },
  revTable: { tiles: [{ x: REV_X0 + 5, y: REV_Y0 + 4 }], stand: { x: REV_X0 + 5, y: REV_Y0 + 5 } },
  // 모이는 곳과 둘이 가는 곳 (계획 10): 사랑방 긴 탁자, 찻집 탁자, 호숫가 정자 벤치
  // 의뢰 게시판 (계획 13 작업 5): 사랑방 벽
  hallBoard: { tiles: [5, 6].map((dx) => ({ x: HALL_ROOM_X0 + dx, y: HALL_ROOM_Y0 })), stand: { x: HALL_ROOM_X0 + 5, y: HALL_ROOM_Y0 + 1 } },
  hallTable: { tiles: [4, 5, 6, 7].map((dx) => ({ x: HALL_ROOM_X0 + dx, y: HALL_ROOM_Y0 + 3 })), stand: { x: HALL_ROOM_X0 + 5, y: HALL_ROOM_Y0 + 4 } },
  teaTable: { tiles: [{ x: TEA_ROOM_X0 + 2, y: TEA_ROOM_Y0 + 3 }, { x: TEA_ROOM_X0 + 4, y: TEA_ROOM_Y0 + 3 }], stand: { x: TEA_ROOM_X0 + 2, y: TEA_ROOM_Y0 + 4 } },
  pavilion: { tiles: [PAVILION_SEAT], stand: { x: PAVILION_SEAT.x, y: PAVILION_SEAT.y + 1 } },
  // 들 약초 (약방)
  wildHerb: { tiles: [...WILD_HERBS] },
}

let mailboxOn = false
/** 집 앞 편지함이 섰는가 — 게임 상태(flags)와 맞추는 것은 엔진 입구(game.ts의 syncHome)가 한다 */
export function setMailbox(on: boolean): void {
  mailboxOn = on
}

/** 이 장소가 지금 있는가 (다락 서재는 2단계부터, 집 앞 편지함은 선 뒤부터) */
export function placeActive(id: PlaceId): boolean {
  if (id === 'mailbox') return mailboxOn
  return (id !== 'ladder' && id !== 'atticWindow') || homeLevel >= 2
}

export function placeAt(t: Tile): PlaceId | null {
  for (const [id, p] of Object.entries(PLACES) as [PlaceId, Place][]) if (placeActive(id) && p.tiles.some((pt) => sameTile(pt, t))) return id
  return null
}

/** 새 게임은 집 안 (예전 지도 위 집의 같은 자리) */
export const START: Tile = home(3, 2)

/** 카메라 왼쪽 위 (칸 단위, 소수 가능). 기록자를 가운데 두되 지도 밖은 보이지 않게 */
export function cameraFor(x: number, y: number, zoom = 1): { x: number; y: number } {
  // 집 안(이웃집·서고·내 집): 방을 화면 가운데에 둔다 (둘레는 그리는 쪽에서 가린다)
  const room = viewRoomAt({ x: Math.round(x), y: Math.round(y) })
  if (room) return { x: room.x0 + room.w / 2 - VIEW_W / zoom / 2, y: room.y0 + room.h / 2 - VIEW_H / zoom / 2 }
  const cx = Math.min(Math.max(x + 0.5 - VIEW_W / zoom / 2, 0), WIDTH - VIEW_W / zoom)
  const cy = Math.min(Math.max(y + 0.5 - VIEW_H / zoom / 2, 0), VILLAGE_H - VIEW_H / zoom)
  return { x: cx, y: cy }
}

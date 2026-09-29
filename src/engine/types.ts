export interface Tile {
  x: number
  y: number
}
export type Facing = 'up' | 'down' | 'left' | 'right'
export type Phase = 'night' | 'morning' | 'day' | 'evening'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type Weather = 'sunny' | 'rain' | 'wind' | 'fog' | 'hot' | 'snow'
export type PlaceId =
  | 'bed'
  | 'desk'
  | 'hearth'
  | 'shelf'
  | 'workbench'
  | 'well'
  | 'hill'
  | 'bench'
  | 'house'
  | 'reeds'
  | 'vine'
  | 'olive'
  | 'press'
  | 'anvil'
  | 'field'
  | 'library'
  | 'basket'
  | 'garden'
  | 'ladder'
  | 'atticWindow'
export type Target =
  | { kind: 'place'; id: PlaceId; tile: Tile }
  | { kind: 'neighbor'; id: string; tries: number }
  | { kind: 'companion' }
  | { kind: 'stray'; animal: 'cat' | 'dog' }
  | { kind: 'ground' }
/** 네 복음서 — 도장·복음서 탐정·"어느 복음서"·복음서 방은 이 네 권만 */
export type Gospel = 'mt' | 'mk' | 'lk' | 'jn'
/** 조각을 엮고 서고에 꽂는 책 (계획 5: 사도행전 'ac'을 더했다) */
export type Book = Gospel | 'ac'
/** 오늘 우리가 보는 신약성경의 순서 */
export const BOOKS: readonly Book[] = ['mt', 'mk', 'lk', 'jn', 'ac']
export const GOSPELS: readonly Gospel[] = ['mt', 'mk', 'lk', 'jn']
export function isGospel(b: Book): b is Gospel {
  return (GOSPELS as readonly Book[]).includes(b)
}
/** 도장은 네 복음서끼리만 (사도행전에는 도장이 없다 — verify가 막는다) */
export interface Stamp {
  kind: 'same' | 'similar'
  book: Gospel
  ref: string
}
export interface Piece {
  id: string
  book: Book
  ref: string
  chapter: number
  title: string
  stamps: Stamp[]
}

export type ItemId =
  | 'water'
  | 'reed'
  | 'papyrus'
  | 'soot'
  | 'ink'
  | 'olive'
  | 'oil'
  | 'barley'
  | 'bread'
  | 'grapes'
  | 'wool'
  | 'fig'
  | 'blanket'
  | 'pot'
  | 'rug'
  | 'stool'
  | 'basket'
  | 'vase'
  | 'cushion'
  | 'goodPen'
  | 'brightLamp'
  | 'wideDesk'
  | 'table'
  | 'nightstand'
  | 'jar'
  | 'candle'
  | 'bowl'
  | 'bird'
  | 'goldLeaf'
  | 'honey'
  | 'chair'
  | 'bookcase'
  | 'chest'
  | 'barrel'
  | 'wheel'
  | 'lectern'
  | 'lampStand'
  | 'bigPlant'
  | 'longBench'
  | 'daybed'
  | 'cupboard'
  | 'roundRug'
  | 'mat'
  | 'pillows'
  | 'teapot'
  | 'fruitBowl'
  | 'scrolls'
  | 'inkpot'
  | 'dryFlowers'
  | 'hourglass'
  | 'seedHerb'
  | 'seedBean'
  | 'herb'
  | 'bean'
  | 'cover'

export type Minigame = 'mash' | 'timing' | 'pick'

/** 이웃 하루 시간표의 한 칸. tile이 없으면 집 안(보이지 않음) */
export interface ScheduleEntry {
  from: number
  tile?: Tile
  /** 비·눈 오는 날 대신 머무는 곳 (없으면 집 안) */
  wet?: Tile
}

export interface NeighborDef {
  id: string
  role: string
  sprite: string
  door: Tile
  schedule: ScheduleEntry[]
  /** 장날에만 오는 이웃 */
  marketOnly?: boolean
  /** 마을이 이 단계까지 자라면 이사 온다 */
  joinsAt?: number
  /** 서고에 꽂힌 책이 이만큼이면 이사 온다 */
  joinsAtBooks?: number
  likes: ItemId[]
  help: {
    minigame: Minigame
    needs?: Partial<Record<ItemId, number>>
    gives: Partial<Record<ItemId, number>>
  }
}

export interface GameContent {
  pieces: Piece[]
  neighbors: NeighborDef[]
}
/** 0 이상 1 미만의 난수를 돌려준다. 테스트에서는 고정값을 주입한다 */
export type Rng = () => number

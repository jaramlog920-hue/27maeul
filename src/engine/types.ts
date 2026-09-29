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
export type Target =
  | { kind: 'place'; id: PlaceId; tile: Tile }
  | { kind: 'neighbor'; id: string; tries: number }
  | { kind: 'companion' }
  | { kind: 'stray'; animal: 'cat' | 'dog' }
  | { kind: 'ground' }
export type Book = 'mt' | 'mk' | 'lk' | 'jn'
/** 오늘 우리가 보는 신약성경의 순서 */
export const BOOKS: readonly Book[] = ['mt', 'mk', 'lk', 'jn']
export interface Stamp {
  kind: 'same' | 'similar'
  book: Book
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

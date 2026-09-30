import type { JourneyCard } from './journey'
import type { CopySource } from './copy'

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
  // 사도행전 방 (계획 5 작업 5): 사도행전 선반, 벽의 여정 판, 읽는 탁자
  | 'actsShelf'
  | 'journeyBoard'
  | 'actsTable'
  // 로마서–빌레몬서 방 (계획 7 작업 7): 편지 선반, 읽는 탁자
  | 'lettersShelf'
  | 'lettersTable'
  // 히브리서–유다서 방 (계획 8 작업 5): 편지 선반, 읽는 탁자
  | 'hebJudShelf'
  | 'hebJudTable'
  // 요한계시록 방 (계획 9 작업 4): 한 권 선반, 벽의 일곱 교회 카드 판, 읽는 탁자
  | 'revShelf'
  | 'churchBoard'
  | 'revTable'
export type Target =
  | { kind: 'place'; id: PlaceId; tile: Tile }
  | { kind: 'neighbor'; id: string; tries: number }
  | { kind: 'companion' }
  | { kind: 'stray'; animal: 'cat' | 'dog' }
  | { kind: 'ground' }
/** 네 복음서 — 도장·복음서 탐정·"어느 복음서"·복음서 방은 이 네 권만 */
export type Gospel = 'mt' | 'mk' | 'lk' | 'jn'
/**
 * 편지로 엮는 책 전부 — 로마서–빌레몬서 열세 권(계획 7) + 히브리서–유다서 여덟 권(계획 8). books.json의 id 그대로.
 * 편지는 조각으로 자르지 않는다(편지 한 통 = 한 장). 어느 방의 책인지는 shelf-rooms의 roomOf로 가린다.
 * 방 이름은 책 범위로만 부른다 (분류 이름을 쓰지 않는다, 설계 §7-2)
 */
export type Letter =
  | 'rom' | '1co' | '2co' | 'gal' | 'eph' | 'php' | 'col' | '1th' | '2th' | '1ti' | '2ti' | 'tit' | 'phm'
  | 'heb' | 'jas' | '1pe' | '2pe' | '1jn' | '2jn' | '3jn' | 'jud'
/**
 * 엮고 서고에 꽂는 책 (계획 5: 사도행전 'ac', 계획 7·8: 편지 스물한 권, 계획 9: 요한계시록 'rev').
 * 요한계시록은 편지처럼 장째로 옮겨 적지만 Letter(LETTERS)에는 넣지 않는다 — 편지 테스트·첫머리 검증을 흔들지 않게
 */
export type Book = Gospel | 'ac' | Letter | 'rev'
export const GOSPELS: readonly Gospel[] = ['mt', 'mk', 'lk', 'jn']
export const LETTERS: readonly Letter[] = [
  'rom', '1co', '2co', 'gal', 'eph', 'php', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm',
  'heb', 'jas', '1pe', '2pe', '1jn', '2jn', '3jn', 'jud',
]
/** 오늘 우리가 보는 신약성경의 순서 (= shelf-rooms의 방 표 순서 — 테스트가 맞춘다) */
export const BOOKS: readonly Book[] = [...GOSPELS, 'ac', ...LETTERS, 'rev']
export function isGospel(b: Book): b is Gospel {
  return (GOSPELS as readonly Book[]).includes(b)
}
export function isLetter(b: Book): b is Letter {
  return (LETTERS as readonly Book[]).includes(b)
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
  /** 사도행전 여정 카드 (본문 순서). 없으면 여정 판이 비어 있다 */
  journey?: JourneyCard[]
  /** 요한계시록 일곱 교회 카드 (본문 순서, 계획 9 작업 3). 없으면 일곱 교회 판이 비어 있다 */
  churches?: JourneyCard[]
  /** 편지 옮겨 적기의 본문 (책마다, 계획 7). 없으면 편지를 기록할 수 없다 */
  copy?: (book: Book) => CopySource
}
/** 0 이상 1 미만의 난수를 돌려준다. 테스트에서는 고정값을 주입한다 */
export type Rng = () => number

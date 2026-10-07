import type { MapId } from './maps'
import type { JourneyCard } from './journey'
import type { CopySource } from './copy'
import type { CopyBook } from './ot-books'

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
  // 새 터 서고 안 (계획 20 작업 5): 구약 필사 책상, 작은 책장 — 새 터에서만 있다
  | 'otDesk'
  | 'otShelf'
  | 'hearth'
  | 'shelf'
  | 'workbench'
  | 'well'
  | 'hill'
  | 'bench'
  // 내 집 앞 벤치 (2026-09-30 사용자): 광장 벤치와 같은 메뉴
  | 'homeBench'
  | 'house'
  | 'reeds'
  | 'vine'
  | 'olive'
  | 'press'
  | 'anvil'
  | 'field'
  | 'library'
  | 'basket'
  // 집 앞 편지함 (계획 11 작업 3): 편지 나르는 이웃과 마음 4가 된 뒤부터
  | 'mailbox'
  | 'garden'
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
  // 모이는 곳과 둘이 가는 곳 (계획 10): 사랑방 탁자, 찻집 탁자, 호숫가 정자
  | 'hallTable'
  | 'hallBoard'
  | 'boat'
  | 'learnTable'
  | 'teaTable'
  | 'pavilion'
  // 들 약초 (약방이 사 준다)
  | 'wildHerb'
  // 주민이 함께 바꾸는 마을 (계획 16 작업 20): 진행 중이거나 완성된 공동 시설
  | 'commonBench'
  | 'flowerBed'
  | 'shadeSpot'
  | 'signPost'
export type Target =
  | { kind: 'place'; id: PlaceId; tile: Tile }
  /** talk: 곁에서 누른 것 (닿으면 바로 대화) — 멀리서 누르면 걸어가 곁에 서고, 대화는 '대화하기' 단추로 */
  | { kind: 'neighbor'; id: string; tries: number; talk?: boolean }
  | { kind: 'companion' }
  /** 우리 아이 (계획 12) */
  | { kind: 'child' }
  | { kind: 'stray'; animal: 'cat' | 'dog' }
  /** 집에 놓은 책장 (계획 14 작업 8): 다 쓴 책을 몇 권 둔다 */
  | { kind: 'bookcase'; tile: Tile }
  /** 집 안에서 정해 둔 자리의 의자·탁자 (계획 16 작업 23): 곁에 서면 쓰임 메뉴 */
  | { kind: 'space'; id: string; tile: Tile }
  /** 왕래 표식 (계획 20 작업 3): 곁에 서면 건너가는 창 */
  | { kind: 'portal'; to: MapId }
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
  | 'homeCradle' | 'homeBed' | 'homeDesk' | 'homeHearth' | 'homeShelf' | 'homeWorkbench'
  | `spouse:${string}`
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
  | 'handyKit'
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
  // 편해지는 살림 (계획 11 작업 1): 집 안에 놓는 설치물
  | 'inkJar'
  | 'supplyChest'
  // 서늘한 찬장 (2026-10-08): 음식만 넣어 두는 찬장
  | 'homeCoolCupboard'
  // 가방과 신 (계획 11 작업 2): 한 번 얻으면 계속 쓰는 도구
  | 'leatherBag'
  | 'sturdyShoes'
  | 'lightShoes'
  // 연애와 결혼 (계획 6): 고백에 건네는 들꽃 다발, 청혼에 건네는 약속의 끈
  | 'bouquet'
  | 'promiseCord'
  // 살림과 서고 (계획 13): 희귀품 — 장날 희귀 좌판·이웃 이벤트·여행에서만
  | 'finePapyrus'
  | 'sealWax'
  | 'purpleCloth'
  | 'perfumeOil'
  | 'bronzeOrnament'
  // 판매용 (계획 13 작업 4): 기름과 양털로 만드는 향초
  | 'scentCandle'
  // 꾸미기 (계획 13 작업 7): 여행지 가게의 장식, 장날의 자주색 깔개
  | 'shell'
  | 'lantern'
  | 'purpleRug'
  // 꾸미기 재료 (계획 14 — 재료 없는 필사): 특별 제본의 표지 종이·물감·엮는 실
  | 'creamPaper'
  | 'blueDye'
  | 'fineThread'
  // 아이와 함께 보내는 시간 (계획 12): 같이 만든 작은 장난감 — 방에 놓는 꾸미기
  | 'woodToy'
  | 'clothDoll'
  // 손님집 손님이 남기는 고유 선물 (계획 18 B18-9) — 손님마다 한 번
  | 'willowBasket'
  | 'starChart'
  | 'seedPouch'
  // 직접 요리 (계획 16 작업 25, 기획 13): 화덕에서 만든 완성 음식 — 먹기·식탁·행사·좌판에 쓴다
  | 'beanDish'
  | 'herbBeanDish'
  | 'honeyBread'
  | 'figPlate'
  | 'herbTea'

/** 손일 놀이: 찧기·맞추기·줍기·길게 누르기·번갈아 누르기·순서 기억하기 */
export type Minigame = 'mash' | 'timing' | 'pick' | 'hold' | 'weave' | 'order'

/** 이웃 하루 시간표의 한 칸. tile이 없으면 집 안(보이지 않음) */
export interface ScheduleEntry {
  from: number
  tile?: Tile
  /** 비·눈 오는 날 대신 머무는 곳 (없으면 집 안) */
  wet?: Tile
}

export interface NeighborDef {
  id: string
  /** 부르는 이름 (화면에 보이는 이름) */
  role: string
  /** 하는 일 (이름이 따로 없던 이웃에게 2026-10-07 이름을 붙이며 옛 역할 이름을 여기로) */
  job?: string
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
  /** 싫어하는 것 (선물하면 마음이 오르지 않는다 — people.json의 dislikes와 합친다) */
  dislikes?: ItemId[]
  help: {
    minigame: Minigame
    needs?: Partial<Record<ItemId, number>>
    gives: Partial<Record<ItemId, number>>
  }
  /** 연애 후보 (계획 6): 주인공과 다른 모습의 후보만 연애할 수 있다. 같은 모습이면 친구 */
  romanceable?: boolean
  /** 후보의 모습 (여자/남자) */
  look?: 'f' | 'm'
  /** 성별 (연애 후보는 look과 같다 — 이웃 수첩에 보인다) */
  gender?: 'f' | 'm'
  /** 후보의 집안 이웃 id */
  family?: string
  /** 서고 권수로 이사 오는 집안(약방·어부·목수)의 후보: 그 집안이 이사 온 아침부터 보인다 (따로 소개 장면 없음) */
  joinsWithFamily?: boolean
  /** 후보가 잘하는 능력치 (아이에게 물려준다 — 계획 12) */
  stat?: 'wit' | 'hand' | 'charm' | 'strength' | 'luck'
  /** 후보의 모습 (주인공 모양 고르기와 같은 값 — 머리·옷·색) */
  avatar?: {
    skin?: number
    hairFront?: number
    hairBack?: number
    top?: number
    bottom?: number
    acc?: number
    hairColor?: [number, number, number]
    eyeColor?: [number, number, number]
    bottomColor?: [number, number, number]
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
  /** 한 장의 본문 (필사, 계획 14): 절 번호와 본문. 본문이 없는 절은 이미 빠져 있다 (catalog.versesOf). 없으면 필사할 절이 없다 */
  chapterText?: (book: CopyBook, chapter: number) => readonly { verse: number; text: string }[]
  /** 하나님 기록 줄 (계획 14, god-records.json): 키워드 id·근거 구절·책·장. 없으면 장을 마쳐도 발견이 없다 */
  godRecords?: readonly { keyword: string; ref: string; book: Book; chapter: number }[]
}
/** 0 이상 1 미만의 난수를 돌려준다. 테스트에서는 고정값을 주입한다 */
export type Rng = () => number

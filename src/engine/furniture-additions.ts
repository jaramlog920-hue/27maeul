// 생활 가구 68종 (2026-10-12 도트: assets/furniture/cozy-additions·household-additions·room-additions·addition-motion)
// 그림 원본은 render/cozy·household·room-furniture-art, 네 방향은 addition-furniture-directions, 쓰는 동작은 addition-furniture-motion.
// 엔진은 그림을 부르지 않으므로 크기·층·쓰는 방법·값만 여기 둔다 (그림 쪽 테스트가 크기를 맞춰 본다).
// 장날 상인의 '생활 가구' 줄에서 닢으로 산다 — 장날마다 여덟 가지씩 돌아가며 나온다.

/** 그 가구에서 하는 일: 그린 사용 동작(흔들기·재봉…), 여닫기(open), 또는 원래 있던 가구 동작 */
import { COPY_FURNITURE_DEFS } from './copy-furniture-defs'
import { isCopyFurniture } from './copy-furniture'
export type AdditionUse =
  | 'rock' | 'sew' | 'knead' | 'washFace' | 'harp' | 'paint' | 'washDishes' | 'mill' | 'waterPlant' | 'tuckDoll' | 'pushCart'
  | 'open' | 'sit' | 'drink' | 'read' | 'reach' | 'copyFurniture'

export interface AdditionDef {
  name: string
  w: 1 | 2
  /** small = 탁자 위에도 올리는 소품, solid = 바닥에 놓는 가구, wall = 벽에 거는 것 */
  layer: 'solid' | 'small' | 'wall' | 'floor'
  /** 위에 작은 물건을 올릴 수 있다 */
  surface?: boolean
  use: AdditionUse
  coins: number
  desc?: string
}

const d = (name: string, w: 1 | 2, use: AdditionUse, coins: number, extra: Partial<AdditionDef> = {}): AdditionDef => ({ name, w, layer: 'solid', use, coins, ...extra })

export const ADDITION_FURNITURE = {
  ...COPY_FURNITURE_DEFS,
  // 생활 가구 8종 (cozy-additions)
  rockingChair: d('흔들의자', 1, 'rock', 180),
  washstand: d('세면대', 1, 'washFace', 180),
  teaTrolley: d('찻잔 수레', 1, 'drink', 200),
  floralScreen: d('꽃무늬 병풍', 2, 'reach', 600),
  herbRack: d('약초 건조대', 2, 'reach', 150),
  breadCupboard: d('빵 보관장', 1, 'open', 240),
  standingMirror: d('전신거울', 1, 'reach', 180),
  dollhouse: d('작은 인형집', 1, 'reach', 120),
  // 살림 가구 10종 (household-additions)
  sewingTable: d('재봉 탁자', 2, 'sew', 350, { surface: true }),
  spoolStand: d('실패 꽂이', 1, 'reach', 30),
  waterJarStand: d('물동이 받침', 1, 'reach', 50),
  kneadingTable: d('반죽 작업대', 2, 'knead', 300, { surface: true }),
  vegetableCrate: d('채소 보관함', 1, 'reach', 60),
  lowTeaTable: d('낮은 찻상', 2, 'drink', 180, { surface: true }),
  linenCupboard: d('이불장', 2, 'open', 650),
  towelRack: d('수건 걸이', 1, 'reach', 25),
  plantSteps: d('화분 진열대', 2, 'waterPlant', 160),
  bootStand: d('장화 받침', 1, 'reach', 35),
  // 방 가구 30종 (room-additions)
  windowBench: d('창가 벤치', 2, 'sit', 280),
  armchair: d('둥근 안락의자', 1, 'sit', 240),
  footstool: d('발 받침', 1, 'sit', 60),
  cornerShelf: d('모서리 선반', 1, 'reach', 150),
  blanketLadder: d('담요 사다리', 1, 'reach', 80),
  longDresser: d('긴 서랍장', 2, 'open', 700),
  wardrobe: d('옷장', 2, 'open', 650),
  coatTree: d('옷걸이 기둥', 1, 'reach', 70),
  vanity: d('화장대', 2, 'open', 650, { surface: true }),
  jewelryBox: d('보석함', 1, 'open', 60, { layer: 'small' }),
  spiceShelf: d('향신료 선반', 2, 'reach', 60, { layer: 'wall' }),
  plateRack: d('그릇꽂이', 1, 'reach', 50),
  potHanger: d('냄비 걸이', 2, 'reach', 60, { layer: 'wall' }),
  millstoneStand: d('맷돌 받침', 1, 'mill', 220),
  pickleStand: d('절임 항아리대', 2, 'reach', 180),
  breadCoolingRack: d('빵 식힘 선반', 2, 'reach', 180),
  fruitDisplay: d('과일 진열대', 2, 'reach', 180),
  dishwashingTable: d('설거지 작업대', 2, 'washDishes', 300, { surface: true }),
  sewingBox: d('작은 바느질함', 1, 'open', 40, { layer: 'small' }),
  fabricShelf: d('천 보관 선반', 2, 'reach', 220),
  drawingDesk: d('그림 작업대', 2, 'paint', 300, { surface: true }),
  paperDryingRack: d('종이 건조대', 2, 'reach', 150),
  mapTable: d('지도 탁자', 2, 'read', 350, { surface: true }),
  letterSorter: d('편지 분류장', 2, 'read', 220),
  musicStand: d('악보 받침', 1, 'read', 100),
  smallHarp: d('작은 하프', 1, 'harp', 900),
  dollBed: d('인형 침대', 1, 'tuckDoll', 60),
  toyCart: d('장난감 수레', 1, 'pushCart', 60),
  umbrellaStand: d('우산꽂이', 1, 'reach', 40),
  seedCabinet: d('씨앗 정리장', 2, 'open', 240),
  // 벽 장식 10종 · 반려동물 5종 · 유아/어린이 5종 (2026-10-15)
  wallCuckooClock: d('새집 벽시계', 1, 'reach', 80, { layer: 'wall' }),
  wallMoonMobile: d('달과 별 모빌', 1, 'reach', 40, { layer: 'wall' }),
  wallFernBasket: d('고사리 벽바구니', 1, 'reach', 35, { layer: 'wall' }),
  wallSeaPainting: d('돛단배 액자', 1, 'reach', 60, { layer: 'wall' }),
  wallPatchwork: d('조각보 벽걸이', 1, 'reach', 60, { layer: 'wall' }),
  wallKeyHooks: d('열쇠 걸이판', 1, 'reach', 25, { layer: 'wall' }),
  wallFlowerWreath: d('들꽃 화환', 1, 'reach', 30, { layer: 'wall' }),
  wallLetterPocket: d('편지 주머니', 1, 'reach', 25, { layer: 'wall' }),
  wallBirdShelf: d('새 장식 벽선반', 1, 'reach', 45, { layer: 'wall' }),
  wallBrassSconce: d('황동 벽등', 1, 'reach', 80, { layer: 'wall' }),
  wovenPetBed: d('반려동물 바구니 침대', 1, 'reach', 60, { layer: 'floor', desc: '집에 둔 동물이 잠잘 때 찾아와 몸을 둥글게 만다.' }),
  coolingPetMat: d('반려동물 대나무 깔개', 1, 'reach', 30, { layer: 'floor', desc: '동물이 누워 쉬는 시원한 깔개.' }),
  petBowlStation: d('반려동물 물그릇 받침', 1, 'reach', 25, { layer: 'floor', desc: '집에 둔 동물이 매시 처음 잠깐 찾아와 물을 핥는다.' }),
  petTugMat: d('매듭줄 놀이 깔개', 1, 'reach', 35, { layer: 'floor', desc: '동물이 앞발로 줄을 누르고 잡아당기며 논다.' }),
  petPuzzleTray: d('반려동물 탐색판', 1, 'reach', 50, { layer: 'floor', desc: '동물이 코와 앞발로 홈을 살피는 놀이판.' }),
  toddlerRockingHorse: d('유아 목마', 1, 'reach', 100, { layer: 'floor', desc: '집에 둔 유아가 앉아 짧은 팔다리로 균형을 잡으며 탄다.' }),
  childBlockMat: d('어린이 쌓기 놀이 매트', 1, 'reach', 50, { layer: 'floor', desc: '유아와 어린이가 앉아 작은 나무 블록을 쌓는다.' }),
  childDrawingTable: d('어린이 낮은 그림상', 1, 'reach', 100, { layer: 'floor', desc: '집에 둔 어린이가 그림상 곁에 앉아 색연필로 그린다.' }),
  childBookSeat: d('어린이 그림책 자리', 1, 'reach', 80, { layer: 'floor', desc: '유아와 어린이가 앉아 그림책을 한 장씩 넘긴다.' }),
  toddlerDrumMat: d('유아 작은 북 자리', 1, 'reach', 60, { layer: 'floor', desc: '유아와 어린이가 앉아 두 손으로 작은 북을 번갈아 두드린다.' }),

} satisfies Record<string, AdditionDef>

export type AdditionItemId = keyof typeof ADDITION_FURNITURE
export const ADDITION_IDS = Object.keys(ADDITION_FURNITURE) as AdditionItemId[]
/** 기존 68종 장날 순서를 유지한다. 필사 전용은 상점/기존 무작위 선물에 섞지 않는다. */
export const MARKET_ADDITION_IDS = ADDITION_IDS.filter(id => !isCopyFurniture(id))

export function isAddition(id: string): id is AdditionItemId {
  return Object.prototype.hasOwnProperty.call(ADDITION_FURNITURE, id)
}

/** 장날마다 생활 가구 줄에 나오는 수 */
export const ADDITIONS_PER_MARKET = 8

/** 이 장날 생활 가구 줄에 나오는 것 (아홉 장날이면 68종을 모두 본다) */
export function additionsOnMarket(day: number): AdditionItemId[] {
  const week = Math.floor(day / 7)
  const start = (week * ADDITIONS_PER_MARKET) % MARKET_ADDITION_IDS.length
  return Array.from({ length: ADDITIONS_PER_MARKET }, (_, i) => MARKET_ADDITION_IDS[(start + i) % MARKET_ADDITION_IDS.length])
}

// 생활 가구 48종 (2026-10-12 도트: assets/furniture/cozy-additions·household-additions·room-additions·addition-motion)
// 그림 원본은 render/cozy·household·room-furniture-art, 네 방향은 addition-furniture-directions, 쓰는 동작은 addition-furniture-motion.
// 엔진은 그림을 부르지 않으므로 크기·층·쓰는 방법·값만 여기 둔다 (그림 쪽 테스트가 크기를 맞춰 본다).
// 장날 상인의 '생활 가구' 줄에서 닢으로 산다 — 장날마다 여덟 가지씩 돌아가며 나온다.

/** 그 가구에서 하는 일: 그린 사용 동작(흔들기·재봉…), 여닫기(open), 또는 원래 있던 가구 동작 */
export type AdditionUse =
  | 'rock' | 'sew' | 'knead' | 'washFace' | 'harp' | 'paint' | 'washDishes' | 'mill' | 'waterPlant' | 'tuckDoll' | 'pushCart'
  | 'open' | 'sit' | 'drink' | 'read' | 'reach'

export interface AdditionDef {
  name: string
  w: 1 | 2
  /** small = 탁자 위에도 올리는 소품, solid = 바닥에 놓는 가구, wall = 벽에 거는 것 */
  layer: 'solid' | 'small' | 'wall'
  /** 위에 작은 물건을 올릴 수 있다 */
  surface?: boolean
  use: AdditionUse
  coins: number
}

const d = (name: string, w: 1 | 2, use: AdditionUse, coins: number, extra: Partial<AdditionDef> = {}): AdditionDef => ({ name, w, layer: 'solid', use, coins, ...extra })

export const ADDITION_FURNITURE = {
  // 생활 가구 8종 (cozy-additions)
  rockingChair: d('흔들의자', 1, 'rock', 36),
  washstand: d('세면대', 1, 'washFace', 30),
  teaTrolley: d('찻잔 수레', 1, 'drink', 28),
  floralScreen: d('꽃무늬 병풍', 2, 'reach', 40),
  herbRack: d('약초 건조대', 2, 'reach', 34),
  breadCupboard: d('빵 보관장', 1, 'open', 30),
  standingMirror: d('전신거울', 1, 'reach', 32),
  dollhouse: d('작은 인형집', 1, 'reach', 26),
  // 살림 가구 10종 (household-additions)
  sewingTable: d('재봉 탁자', 2, 'sew', 44, { surface: true }),
  spoolStand: d('실패 꽂이', 1, 'reach', 14),
  waterJarStand: d('물동이 받침', 1, 'reach', 16),
  kneadingTable: d('반죽 작업대', 2, 'knead', 42, { surface: true }),
  vegetableCrate: d('채소 보관함', 1, 'reach', 16),
  lowTeaTable: d('낮은 찻상', 2, 'drink', 34, { surface: true }),
  linenCupboard: d('이불장', 2, 'open', 46),
  towelRack: d('수건 걸이', 1, 'reach', 12),
  plantSteps: d('화분 진열대', 2, 'waterPlant', 30),
  bootStand: d('장화 받침', 1, 'reach', 12),
  // 방 가구 30종 (room-additions)
  windowBench: d('창가 벤치', 2, 'sit', 38),
  armchair: d('둥근 안락의자', 1, 'sit', 32),
  footstool: d('발 받침', 1, 'sit', 12),
  cornerShelf: d('모서리 선반', 1, 'reach', 18),
  blanketLadder: d('담요 사다리', 1, 'reach', 16),
  longDresser: d('긴 서랍장', 2, 'open', 46),
  wardrobe: d('옷장', 2, 'open', 52),
  coatTree: d('옷걸이 기둥', 1, 'reach', 14),
  vanity: d('화장대', 2, 'open', 44, { surface: true }),
  jewelryBox: d('보석함', 1, 'open', 20, { layer: 'small' }),
  spiceShelf: d('향신료 선반', 2, 'reach', 22, { layer: 'wall' }),
  plateRack: d('그릇꽂이', 1, 'reach', 14),
  potHanger: d('냄비 걸이', 2, 'reach', 22, { layer: 'wall' }),
  millstoneStand: d('맷돌 받침', 1, 'mill', 28),
  pickleStand: d('절임 항아리대', 2, 'reach', 26),
  breadCoolingRack: d('빵 식힘 선반', 2, 'reach', 26),
  fruitDisplay: d('과일 진열대', 2, 'reach', 24),
  dishwashingTable: d('설거지 작업대', 2, 'washDishes', 38, { surface: true }),
  sewingBox: d('작은 바느질함', 1, 'open', 16, { layer: 'small' }),
  fabricShelf: d('천 보관 선반', 2, 'reach', 30),
  drawingDesk: d('그림 작업대', 2, 'paint', 42, { surface: true }),
  paperDryingRack: d('종이 건조대', 2, 'reach', 26),
  mapTable: d('지도 탁자', 2, 'read', 40, { surface: true }),
  letterSorter: d('편지 분류장', 2, 'read', 30),
  musicStand: d('악보 받침', 1, 'read', 18),
  smallHarp: d('작은 하프', 1, 'harp', 48),
  dollBed: d('인형 침대', 1, 'tuckDoll', 18),
  toyCart: d('장난감 수레', 1, 'pushCart', 16),
  umbrellaStand: d('우산꽂이', 1, 'reach', 12),
  seedCabinet: d('씨앗 정리장', 2, 'open', 40),
} satisfies Record<string, AdditionDef>

export type AdditionItemId = keyof typeof ADDITION_FURNITURE
export const ADDITION_IDS = Object.keys(ADDITION_FURNITURE) as AdditionItemId[]

export function isAddition(id: string): id is AdditionItemId {
  return Object.prototype.hasOwnProperty.call(ADDITION_FURNITURE, id)
}

/** 장날마다 생활 가구 줄에 나오는 수 */
export const ADDITIONS_PER_MARKET = 8

/** 이 장날 생활 가구 줄에 나오는 것 (여섯 장날이면 48종을 한 번씩 다 본다) */
export function additionsOnMarket(day: number): AdditionItemId[] {
  const week = Math.floor(day / 7)
  const start = (week * ADDITIONS_PER_MARKET) % ADDITION_IDS.length
  return Array.from({ length: ADDITIONS_PER_MARKET }, (_, i) => ADDITION_IDS[(start + i) % ADDITION_IDS.length])
}

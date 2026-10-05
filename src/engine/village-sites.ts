// 주민이 함께 바꾸는 마을 (계획 16 작업 20, 기획 07): 공동 시설 자리 표.
// 이 파일은 데이터만 — 다른 엔진 파일을 부르지 않는다 (world.ts가 자리를 읽고, projects.ts가 진행을 맡는다).
// 모든 시설은 지도(MAP)를 바꾸지 않는 그림이다. 길·문·기존 장소·서고 권수로 잠긴 구역과 겹치지 않는 풀밭 칸에만 놓는다(테스트가 확인).
// 기존 이웃 부탁 해금(bakeryBench 1,13 · grandpaBench 31,8 · stallAwning 19,13 · loomAwning 37,24 · lanterns · childGarden 32,13~15)과도 겹치지 않는다.
import type { ItemId, Minigame, PlaceId, Tile } from './types'

export const FACILITY_IDS = ['longBench', 'flowerBed', 'shade', 'signPost'] as const
export type FacilityId = (typeof FACILITY_IDS)[number]

/** 시설을 누르면 열리는 자리 (PlaceId의 일부) */
export type FacilityPlace = Extract<PlaceId, 'commonBench' | 'flowerBed' | 'shadeSpot' | 'signPost'>

export interface Site {
  id: FacilityId
  place: FacilityPlace
  /** 시설이 차지하는 칸 (그림 자리) — 맨 첫 칸이 대표 칸 */
  tiles: readonly Tile[]
  /** 기록자가 시설을 보며 서는 칸 */
  stand: Tile
  /** 현장에서 일하는 이웃이 서는 칸 (셋) */
  crew: readonly Tile[]
  /** 이 시설에 관심 있는 이웃 (의견·기여·사용) */
  interested: readonly string[]
  /** 거들 때 하는 손일 (기존 여섯 손일 중 하나) */
  hand: Minigame
  /** 선택 장식에 보태는 물건 (플레이어가 혼자 다 부담하지 않는 선택 참여) */
  decor: { item: ItemId; n: number }
  /** 선택 장식 도트 (assets/furniture/expansion/props) */
  decorArt: string
  /** 이웃이 시설을 쓸 때 보이는 자리 (시설 칸 위, 이웃마다 하나씩) */
  seats: readonly Tile[]
}

const row = (x: number, y: number, n: number): Tile[] => Array.from({ length: n }, (_, i) => ({ x: x + i, y }))

export const SITES: Readonly<Record<FacilityId, Site>> = {
  // 긴 벤치: 큰길 북쪽 줄 풀밭, 베 짜는 집 지붕 위 (목수·대장장이·기름 짜는 이웃)
  longBench: {
    id: 'longBench', place: 'commonBench', tiles: row(37, 19, 2), stand: { x: 37, y: 18 },
    crew: [{ x: 36, y: 19 }, { x: 39, y: 19 }, { x: 38, y: 18 }],
    interested: ['carpenter', 'smith', 'presser'], hand: 'hold', decor: { item: 'cushion', n: 1 }, decorArt: 'cushionPattern',
    seats: [{ x: 37, y: 19 }, { x: 38, y: 19 }, { x: 36, y: 19 }],
  },
  // 꽃밭: 집들 뒤 풀밭 줄 (베 짜는 이웃의 작업 앞 소품 칸을 비켜서, 길·문이 아닌 풀밭) (벌 치는 이웃·주니퍼·물 긷는 아이)
  flowerBed: {
    id: 'flowerBed', place: 'flowerBed', tiles: row(34, 27, 3), stand: { x: 35, y: 26 },
    crew: [{ x: 33, y: 27 }, { x: 37, y: 27 }, { x: 34, y: 26 }],
    interested: ['beekeeper', 'juniper', 'child'], hand: 'pick', decor: { item: 'seedHerb', n: 1 }, decorArt: 'wateringCan',
    seats: [{ x: 34, y: 27 }, { x: 35, y: 27 }, { x: 36, y: 27 }],
  },
  // 그늘막: 서고와 포도원 집 사이 북쪽 풀밭 (목수·베 짜는 이웃·할아버지)
  shade: {
    id: 'shade', place: 'shadeSpot', tiles: [...row(28, 6, 3), ...row(28, 7, 3)], stand: { x: 29, y: 8 },
    crew: [{ x: 28, y: 8 }, { x: 30, y: 8 }, { x: 31, y: 7 }],
    interested: ['carpenter', 'weaver', 'grandpa'], hand: 'weave', decor: { item: 'wool', n: 2 }, decorArt: 'clothRose',
    seats: [{ x: 28, y: 7 }, { x: 29, y: 7 }, { x: 30, y: 7 }],
  },
  // 안내판: 서쪽 골목 갈림길 곁 풀밭, 낮은 표지 하나 (목수·편지 나르는 이웃)
  signPost: {
    id: 'signPost', place: 'signPost', tiles: [{ x: 12, y: 11 }], stand: { x: 12, y: 10 },
    crew: [{ x: 11, y: 11 }, { x: 13, y: 11 }, { x: 12, y: 12 }],
    interested: ['carpenter', 'postman'], hand: 'order', decor: { item: 'reed', n: 2 }, decorArt: 'seasonalLeaves',
    seats: [{ x: 11, y: 11 }, { x: 13, y: 11 }, { x: 12, y: 12 }],
  },
}

export const FACILITY_PLACES: readonly FacilityPlace[] = FACILITY_IDS.map((id) => SITES[id].place)

export const isFacilityPlace = (p: PlaceId): p is FacilityPlace => (FACILITY_PLACES as readonly PlaceId[]).includes(p)

export const facilityOfPlace = (p: PlaceId): FacilityId | null => FACILITY_IDS.find((id) => SITES[id].place === p) ?? null

/** 날씨를 타는 바깥 자리 — 비·눈·더위에는 실내 대체 자리로(약속 엔진) */
export const OUTDOOR_PLACES: readonly PlaceId[] = ['pavilion', 'hill', 'garden', ...FACILITY_PLACES]

/** 취향표의 장소 종류 (place.shade·place.lake·place.hill·place.indoor) */
export function tastePlaceOf(place: PlaceId): 'indoor' | 'hill' | 'shade' | 'lake' {
  if (place === 'pavilion') return 'lake'
  if (place === 'hill') return 'hill'
  if (place === 'garden' || isFacilityPlace(place)) return 'shade'
  return 'indoor'
}

/** 시설마다 어떤 모임·행사 자리가 되는가 (01 모임 활동 · 05 차 모임) — 완성된 시설만 목록에 오른다 */
export const FACILITY_CLUBS: Readonly<Record<FacilityPlace, readonly ('tea' | 'sew' | 'observe')[]>> = {
  commonBench: ['tea'],
  shadeSpot: ['tea', 'sew'],
  flowerBed: ['observe'],
  signPost: [],
}

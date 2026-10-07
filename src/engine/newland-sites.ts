// 새 터에 놓을 수 있는 것의 표 (계획 20 작업 6, 결정 D3). 첫 제작은 길·정원 칸·공동 마당·입주 주택 네 가지.
// 이 파일은 아무 엔진 파일도 부르지 않는 값 모음이다 (newland-build.ts·화면이 읽는다).
// 건물 그림은 old-village-art의 OLD_BUILDINGS/OLD_CONSTRUCTION/OLD_TERRAIN을 쓰고, 이름은 BUILDING_LABELS를 화면 쪽에서 읽는다.
// 방향별 entry 화소는 assets/old-testament-generations/manifest.json에서 옮긴 값이다 — newland-sites.test가 manifest와 같은지 비교한다.
import type { Facing, ItemId } from './types'

/**
 * 꾸미기 소재 (사용자 결정 ⑧, assets/background-materials-simple.png): 바닥 셋·작은 것 셋·나무와 덤불 넷.
 * 유저가 놓는 꾸미기일 뿐 — 기본 길·지형은 바꾸지 않는다. 공짜가 아니다(닢), 걷어 내면 반만 돌아온다
 */
export type DecorKind = 'sand' | 'stone' | 'soil' | 'grassTuft' | 'flower' | 'rocks' | 'bush' | 'treeSmall' | 'treeTall' | 'treeBig'
export const DECOR_KINDS: readonly DecorKind[] = ['sand', 'stone', 'soil', 'grassTuft', 'flower', 'rocks', 'bush', 'treeSmall', 'treeTall', 'treeBig']
/** 바닥 (걸을 수 있고 1·3칸으로 깐다) */
export const DECOR_FLOORS: readonly DecorKind[] = ['sand', 'stone', 'soil']
/** 길을 막는 꾸미기 (나무·덤불) */
export const DECOR_BLOCKING: readonly DecorKind[] = ['bush', 'treeSmall', 'treeTall', 'treeBig']

/**
 * 계획 18 남은 건물 (사용자 결정 ⑥, 컨트롤러): 손님집(guest)·기억 정원(memorial, 자산 garden)·주민의 꿈터(weaver).
 * 손님집·꿈터는 집처럼 막히고 문이 있다(안 방 없음 — 문 앞에 서면 창). 기억 정원은 마당처럼 열린 4×4
 */
/** kidWork: 자란 우리 아이의 집 겸 일터 (계획 18 B18-7, 2026-10-08) — 그림은 그 아이 직업의 '○○의 집 겸 일터' */
export type ExtraBuildKind = 'guest' | 'memorial' | 'weaver' | 'kidWork' | 'gallery'
export type SiteKind = 'path' | 'garden' | 'courtyard' | 'home' | ExtraBuildKind | DecorKind
/** 건물(기록이 따로 있고 공사 기간이 있다) */
export type BuildKind = 'courtyard' | 'home' | ExtraBuildKind
/** 칸 하나씩 깔리는 것(길·정원·꾸미기) — 바로 깔린다 */
export type TileKind = 'path' | 'garden' | DecorKind

export const BUILD_KINDS: readonly BuildKind[] = ['courtyard', 'home', 'guest', 'memorial', 'weaver', 'kidWork', 'gallery']
export const TILE_KINDS: readonly TileKind[] = ['path', 'garden', ...DECOR_KINDS]
/** 놓기 목록의 위 칸 (건물·길) — 꾸미기는 DECOR_KINDS로, 계획 18 건물은 EXTRA_BUILDS로 따로 */
export const SITE_KINDS: readonly SiteKind[] = ['path', 'garden', 'courtyard', 'home']
export const EXTRA_BUILDS: readonly ExtraBuildKind[] = ['guest', 'memorial', 'weaver', 'gallery', 'kidWork']
export const isBuildKind = (v: unknown): v is BuildKind => (BUILD_KINDS as readonly unknown[]).includes(v)
/** 마당처럼 열린 건물 (걸을 수 있다, 공사 중에는 울타리) */
export const isOpenYard = (k: SiteKind): boolean => k === 'courtyard' || k === 'memorial'
/** 문이 있어 막히는 건물 */
export const isWalled = (k: SiteKind): boolean => k === 'home' || k === 'guest' || k === 'weaver' || k === 'kidWork' || k === 'gallery'
export const isTileKind = (v: unknown): v is TileKind => (TILE_KINDS as readonly unknown[]).includes(v)
export const isDecorKind = (v: unknown): v is DecorKind => (DECOR_KINDS as readonly unknown[]).includes(v)
export const blocksWay = (k: TileKind): boolean => (DECOR_BLOCKING as readonly string[]).includes(k)

export type Items = Partial<Record<ItemId, number>>
export interface Cost {
  coins: number
  items: Items
}

/** 문: entryPx는 manifest의 entry 화소(64×64 그림 안), door·front는 엔진 좌표(그림 왼쪽 위 칸 기준 가감) */
export interface DoorSpec {
  entryPx: { x: number; y: number }
  door: { dx: number; dy: number }
  front: { dx: number; dy: number }
}

export interface SiteDef {
  id: SiteKind
  /** 자산 id (BUILDING_LABELS·OLD_BUILDINGS의 키). 길·정원 칸은 땅 그림(OLD_TERRAIN)이라 없다 */
  assetId?: 'home' | 'courtyard' | 'guest' | 'garden' | 'weaver' | 'gallery'
  /** 땅 그림 id (OLD_TERRAIN의 키) */
  terrainId?: 'path' | 'plantingBed'
  /** 한 번에 놓는 칸 수 (가로·세로). 길·정원 칸은 1 또는 3 중에서 고른다 */
  sizes: readonly number[]
  /** 막히는 영역: 그림 왼쪽 위 칸에서 시작하는 가로 w·세로 h, 시작 줄 dy (집은 그림 맨 윗줄을 빼고 3줄) */
  area: { w: number; h: number; dy: number }
  /** 놓을 수 있는 방향 (뒤를 보는 건물은 문이 없어 놓지 않는다) */
  facings: readonly Facing[]
  /** 비용 — 칸 하나(길·정원) 또는 건물 하나 */
  cost: Cost
  /** 방향별 문 (문이 없는 땅·마당은 없다) */
  doors?: Partial<Record<Facing, DoorSpec>>
}

const HOME_DOORS: Partial<Record<Facing, DoorSpec>> = {
  // 그림 4×4칸. 문은 footprint 맨 아랫줄(그림 3번째 줄 = dy 3), 문 앞은 그 밖 한 칸
  down: { entryPx: { x: 32, y: 60 }, door: { dx: 2, dy: 3 }, front: { dx: 2, dy: 4 } },
  left: { entryPx: { x: 15, y: 60 }, door: { dx: 0, dy: 3 }, front: { dx: -1, dy: 3 } },
  right: { entryPx: { x: 47, y: 60 }, door: { dx: 3, dy: 3 }, front: { dx: 4, dy: 3 } },
}

export const SITES: Record<SiteKind, SiteDef> = {
  path: { id: 'path', terrainId: 'path', sizes: [1, 3], area: { w: 1, h: 1, dy: 0 }, facings: ['down'], cost: { coins: 1, items: {} } },
  garden: { id: 'garden', terrainId: 'plantingBed', sizes: [1, 3], area: { w: 1, h: 1, dy: 0 }, facings: ['down'], cost: { coins: 3, items: {} } },
  // 마당: 열린 4×4 — 건물처럼 막지 않고 걸을 수 있다. 문이 없다
  courtyard: { id: 'courtyard', assetId: 'courtyard', sizes: [4], area: { w: 4, h: 4, dy: 0 }, facings: ['down'], cost: { coins: 40, items: { reed: 4 } } },
  home: { id: 'home', assetId: 'home', sizes: [4], area: { w: 4, h: 3, dy: 1 }, facings: ['down', 'left', 'right'], cost: { coins: 150, items: { olive: 4, papyrus: 3 } }, doors: HOME_DOORS },
  guest: { id: 'guest', assetId: 'guest', sizes: [4], area: { w: 4, h: 3, dy: 1 }, facings: ['down', 'left', 'right'], cost: { coins: 80, items: { reed: 3 } }, doors: HOME_DOORS },
  memorial: { id: 'memorial', assetId: 'garden', sizes: [4], area: { w: 4, h: 4, dy: 0 }, facings: ['down'], cost: { coins: 60, items: { olive: 2 } } },
  weaver: { id: 'weaver', assetId: 'weaver', sizes: [4], area: { w: 4, h: 3, dy: 1 }, facings: ['down', 'left', 'right'], cost: { coins: 120, items: { reed: 4, papyrus: 2 } }, doors: HOME_DOORS },
  // 틸리의 꿈 (2026-10-08): 그림방 = 주민의 꿈 미술관 그림
  gallery: { id: 'gallery', assetId: 'gallery', sizes: [4], area: { w: 4, h: 3, dy: 1 }, facings: ['down', 'left', 'right'], cost: { coins: 120, items: { papyrus: 2, olive: 2 } }, doors: HOME_DOORS },
  // 그림 id는 아이 직업이라 그릴 때 정한다 (assetId 없음)
  kidWork: { id: 'kidWork', sizes: [4], area: { w: 4, h: 3, dy: 1 }, facings: ['down', 'left', 'right'], cost: { coins: 100, items: { reed: 3, olive: 2 } }, doors: HOME_DOORS },
  sand: decor('sand', 2, [1, 3]),
  stone: decor('stone', 3, [1, 3]),
  soil: decor('soil', 2, [1, 3]),
  grassTuft: decor('grassTuft', 1),
  flower: decor('flower', 2),
  rocks: decor('rocks', 2),
  bush: decor('bush', 5),
  treeSmall: decor('treeSmall', 6),
  treeTall: decor('treeTall', 10),
  treeBig: decor('treeBig', 12),
}
function decor(id: DecorKind, coins: number, sizes: readonly number[] = [1]): SiteDef {
  return { id, sizes, area: { w: 1, h: 1, dy: 0 }, facings: ['down'], cost: { coins, items: {} } }
}
/** 꾸미기를 걷어 내면 돌아오는 몫 (길·정원 칸은 다 돌아온다) */
export const DECOR_REFUND = 0.5

/** 건물 그림의 칸 수 (가로·세로) */
export const ART_TILES = 4

/** 공사 기간 (D3): 주문한 다음 날 아침 공사 시작, 그다음 날 아침 완공 */
export const BUILD_DAYS_TO_START = 1
export const BUILD_DAYS_TO_DONE = 2
/** 환불 몫 (D3): 공사 시작 전 100%, 공사 중 50%, 완공 뒤 철거는 닢 50%·재료 없음 (소수 버림) */
export const REFUND_BEFORE = 1
export const REFUND_DURING = 0.5
export const REFUND_DEMOLISH_COINS = 0.5

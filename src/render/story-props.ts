// 이야기 뒤 소품 그리기 (계획 16 작업 4). 그림은 먼저 생활 확장 도트(assets/furniture/expansion — 원본 TS는 expansion-prop-art.ts),
// 등록되지 않았으면 기존 가구 그림(FURNITURE_ART). 어디에 무엇이 놓이는지는 엔진(storyPropsNow)이 정한다.
//
// 연결 (renderer.ts — 다른 작업자 파일이라 이 파일에서 고치지 않았다):
//   import { EXPANSION_PROPS, EXPANSION_VIEWS } from './expansion-prop-art'
//   import { drawStoryProps, registerStoryPropArt } from './story-props'
//   registerStoryPropArt(EXPANSION_PROPS, EXPANSION_VIEWS)   // 모듈 위에서 한 번
//   drawStoryProps(g, game)   // 마을 그리기에서 방의 가구(drawFurniture) 바로 뒤, 이웃 그리기 전에
import { storyPropsNow, type GameState } from '../engine/game'
import { STALL_SPOT, stallSceneNow } from '../engine/stall'
import type { StoryProp } from '../engine/people'
import { TILE } from '../engine/world'
import { FURNI_PALETTE, FURNITURE_ART, type FurnitureArt } from './furniture-art'

type Facing = 'down' | 'up' | 'left' | 'right'
let PROPS: Record<string, FurnitureArt> = {}
let VIEWS: Record<string, Record<Facing, FurnitureArt>> = {}

/** 생활 확장 도트를 등록한다 (props/: 방향 없는 작은 물건, structures/: 네 방향 시설) */
export function registerStoryPropArt(props: Record<string, FurnitureArt>, views: Record<string, Record<Facing, FurnitureArt>> = {}): void {
  PROPS = props
  VIEWS = views
  cache.clear()
}

/** 이 소품을 그릴 그림 (확장 도트 → 기존 가구 → 없음) */
export function storyPropArt(p: Pick<StoryProp, 'art' | 'item' | 'facing'>): FurnitureArt | null {
  if (p.art) {
    const v = VIEWS[p.art]
    if (v) return v[p.facing ?? 'down'] ?? null
    if (PROPS[p.art]) return PROPS[p.art]
  }
  return (p.item && FURNITURE_ART[p.item]) || null
}

const cache = new Map<FurnitureArt, HTMLCanvasElement>()
function painted(a: FurnitureArt): HTMLCanvasElement {
  let c = cache.get(a)
  if (c) return c
  c = document.createElement('canvas')
  c.width = Math.max(...a.rows.map((r) => r.length))
  c.height = a.rows.length
  const g = c.getContext('2d')!
  a.rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const col = FURNI_PALETTE[ch]
      if (ch === '.' || !col) return
      g.fillStyle = col
      g.fillRect(x, y, 1, 1)
    }),
  )
  cache.set(a, c)
  return c
}

/** 지금 보이는 이야기 뒤 소품을 마을 좌표(칸 × TILE)에 그린다 — 바닥 것부터, 위쪽 줄부터 */
export function drawStoryProps(g: CanvasRenderingContext2D, game: GameState): void {
  const list = storyPropsNow(game).sort((a, b) => a.at.y - b.at.y || a.at.x - b.at.x)
  for (const p of list) {
    const a = storyPropArt(p)
    if (a) g.drawImage(painted(a), p.at.x * TILE, p.at.y * TILE)
  }
}

/** 상품마다 좌판 위에 놓일 도트 (assets 소품 — 없는 것은 포장한 물건) */
const GOOD_ART: Record<string, string> = {
  scentCandle: 'displayCandle', cushion: 'displayTextile', blanket: 'displayTextile', oil: 'oilFull', grapes: 'basketGrapes', basket: 'basketEmpty', fruitBowl: 'snackPlate',
}
const DECO_ART = { candle: 'candleDecor', plant: 'potGrowing', basket: 'basketEmpty' } as const
const CLOTH_COLOR = { blue: ['#5b7fb0', '#7d9cc8'], rose: ['#c46d83', '#da8fa2'] } as const

/**
 * 내 작은 장날 좌판 (계획 16 작업 19): 영업 중일 때만, 광장 위쪽 자리에 열린 좌판 도트(marketOpen) → 고른 천 → 상품 → 간판 → 작은 장식.
 * 길을 막지 않는 그림이다. 이웃·주인공은 이 뒤에 그려진다
 */
export function drawStall(g: CanvasRenderingContext2D, game: GameState): void {
  const scene = stallSceneNow(game)
  const base = VIEWS.marketOpen?.down
  if (!scene || !base) return
  const x0 = STALL_SPOT.x * TILE
  const y0 = STALL_SPOT.y * TILE
  g.drawImage(painted(base), x0, y0)
  if (scene.look.cloth !== 'plain') {
    const [c, hi] = CLOTH_COLOR[scene.look.cloth]
    g.fillStyle = c
    g.fillRect(x0 + 2, y0 + 11, 44, 5)
    g.fillStyle = hi
    g.fillRect(x0 + 2, y0 + 11, 44, 1)
  }
  scene.goods.slice(0, 3).forEach((item, i) => {
    const a = PROPS[GOOD_ART[item] ?? 'wrappedGoods']
    if (a) g.drawImage(painted(a), x0 + 1 + i * 14, y0 - 6)
  })
  const tag = PROPS.marketNameTag
  if (tag) g.drawImage(painted(tag), x0 + 16, y0 - 14)
  if (scene.look.deco !== 'none') {
    const a = PROPS[DECO_ART[scene.look.deco]]
    if (a) g.drawImage(painted(a), x0, y0 + 2 * TILE - 2)
  }
}

// 새 터 집 그림 (2026-10-13 사용자): 신약 마을 집(renderer.ts drawRoof·houseWallTile)과 같은 생김새 — 기와지붕·굴뚝, 크림 벽, 꽃 상자 단 창, 둥근 나무 문.
// 1단계 본채는 예전 새 터 집 그림과 같은 64×64(문 화소 아래 32·왼쪽 15·오른쪽 47)라 엔진의 막힘·문 칸은 그대로다.
// 2·3단계는 신약 내 집 넓히기처럼 본채보다 낮은 지붕의 날개가 붙는다 — 2단계 오른쪽, 3단계 양쪽 (newland-sites HOUSE_SIZES).
// 지붕·벽 색, 창 모양, 장식(나무 기둥·차양)은 지을 때 고른 HouseLook. 선은 모두 2픽셀 이상 (화면이 정수배가 아닐 때 일렁이지 않게).
import { mainOffset, type BuildKind } from '../engine/newland-sites'
import { DEFAULT_LOOK, HOUSE_ROOFS, HOUSE_TRIMS, HOUSE_WALLS, HOUSE_WINDOWS, type HouseLook } from '../engine/newland-house-look'
import type { Facing } from '../engine/types'

export const HOUSE_ART = 64
const T = 16
const ROOF_TOP = 8
/** 날개 지붕은 본채보다 한 칸 낮게 시작한다 */
const WING_ROOF_TOP = 16
const WALL_TOP = 32
const LOW = WALL_TOP + 16
const SNOW = '#f6f8fa'
const FRAME = '#c59a61'
const GLASS = '#ffca70'
const GLOW = '#ffeaba'
const TIMBER = '#ac7444'

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

/** 문 가운데 화소 (1단계는 예전 그림의 entry와 같다) */
export function doorCenter(facing: Facing, width: number): number {
  const W = width * T
  if (facing === 'left') return 15
  if (facing === 'right') return W - 17
  return mainOffset(width) * T + 32
}

/** 집 한 채를 그린다 (g의 원점이 그림 왼쪽 위, 가로 width칸 × 세로 4칸) */
export function drawNewlandHouse(g: CanvasRenderingContext2D, kind: BuildKind, facing: Facing, look: HouseLook = DEFAULT_LOOK, winter = false, width = 4): void {
  const roof = (HOUSE_ROOFS[look.roof] ?? HOUSE_ROOFS[0]).colors
  const walls = HOUSE_WALLS[look.wall] ?? HOUSE_WALLS[0]
  const windowShape = HOUSE_WINDOWS[look.window ?? 0]?.id ?? 'square'
  const trim = HOUSE_TRIMS[look.trim ?? 0]?.id ?? 'none'
  const r = (color: string, x: number, y: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(x, y, w, h)
  }
  const W = width * T
  const mx = mainOffset(width) * T
  const dc = doorCenter(facing, width)
  // 벽: 위 줄은 처마 그림자, 아래 줄 밑동, 양끝 기둥 (날개까지 한 벽으로)
  r(walls.wall, 0, WALL_TOP, W, 64 - WALL_TOP)
  r('rgba(90,60,70,0.22)', 0, WALL_TOP, W, 3)
  r(walls.base, 0, 60, W, 4)
  r(walls.base, 0, WALL_TOP, 2, 64 - WALL_TOP)
  r(walls.base, W - 2, WALL_TOP, 2, 64 - WALL_TOP)
  // 날개와 본채 사이 이음 기둥
  if (width > 4) {
    r(walls.base, mx + 62, WALL_TOP, 4, 64 - WALL_TOP)
    if (mx > 0) r(walls.base, mx - 2, WALL_TOP, 4, 64 - WALL_TOP)
  }
  /** 기와지붕 하나 (drawRoof와 같은 짜임: 용마루·양옆 테두리·처마·기와 띠) */
  const roofAt = (x: number, top: number, w: number, [c1, c2, c3]: readonly [string, string, string]) => {
    const H = WALL_TOP - top
    r(c1, x, top, w, H)
    for (let y = 8; y < H - 4; y += 8) r(mix(c1, c2, 0.25), x, top + y, w, 2)
    r(c2, x, top, w, 4)
    r(c3, x, top, w, 2)
    r(c2, x, top, 2, H)
    r(c2, x + w - 2, top, 2, H)
    r(c2, x, WALL_TOP - 4, w, 4)
    r(mix(c2, '#000000', 0.15), x, WALL_TOP - 2, w, 2)
    if (winter) r(SNOW, x, top, w, 4)
  }
  // 날개 지붕 먼저 (본채 지붕보다 한 톤 그늘 — 신약 내 집 증축 지붕과 같은 섞음)
  const shade = roof.map((c) => mix(c, '#5a3c46', 0.06)) as [string, string, string]
  if (width >= 6) roofAt(mx + 64, WING_ROOF_TOP, 32, shade)
  if (width >= 8) roofAt(0, WING_ROOF_TOP, 32, shade)
  roofAt(mx, ROOF_TOP, 64, roof)
  const cx = mx + Math.floor(64 * 0.72)
  r('#e0a974', cx, ROOF_TOP - 6, 8, 12)
  r('#9a6e45', cx - 2, ROOF_TOP - 8, 12, 2)
  r(mix('#e0a974', '#9a6e45', 0.4), cx + 6, ROOF_TOP - 6, 2, 12)
  if (winter) r(SNOW, cx - 2, ROOF_TOP - 8, 12, 2)
  // 나무 기둥: 위 가로대, 집 양끝, 문 양옆 (신약 집 timber)
  if (trim === 'timber') {
    r(TIMBER, 0, WALL_TOP + 3, W, 2)
    r(TIMBER, 0, WALL_TOP, 2, 32)
    r(TIMBER, W - 2, WALL_TOP, 2, 32)
    r(TIMBER, dc - 10, WALL_TOP, 2, 32)
    r(TIMBER, dc + 8, WALL_TOP, 2, 32)
  }
  // 창: 문을 피해 본채 양옆·날개 가운데
  const spots = [mx + 12, mx + 32, mx + 52, ...(width >= 6 ? [mx + 80] : []), ...(width >= 8 ? [16] : [])]
  const centers = spots.filter((c) => Math.abs(c - dc) >= 14).filter((c, _i, a) => !(c === mx + 32 && a.includes(mx + 12) && a.includes(mx + 52)))
  for (const wc of centers) {
    const ox = wc - 8
    const dy = LOW + 1
    if (windowShape === 'round') {
      r(FRAME, ox + 4, dy + 1, 8, 6)
      r(FRAME, ox + 5, dy, 6, 8)
      r(GLASS, ox + 5, dy + 1, 6, 6)
      r(GLOW, ox + 5, dy + 1, 2, 2)
      r(FRAME, ox + 7, dy + 1, 2, 6)
      r(FRAME, ox + 5, dy + 3, 6, 2)
    } else if (windowShape === 'arch') {
      r(FRAME, ox + 4, dy + 1, 8, 8)
      r(FRAME, ox + 5, dy, 6, 1)
      r(GLASS, ox + 5, dy + 1, 6, 7)
      r(GLOW, ox + 5, dy + 1, 2, 3)
      r(FRAME, ox + 7, dy + 1, 2, 7)
    } else {
      r(FRAME, ox + 3, dy, 10, 9)
      r(GLASS, ox + 4, dy + 1, 8, 7)
      r(GLOW, ox + 4, dy + 1, 3, 3)
      r(FRAME, ox + 7, dy + 1, 2, 7)
      r(FRAME, ox + 4, dy + 4, 8, 1)
    }
    r('#c68b54', ox + 3, LOW + 10, 10, 2) // 꽃 상자
    for (let i = 0; i < 4; i++) r(['#ffc2a0', '#fefdf8', '#feae88', '#a2cb78'][(wc + i) % 4], ox + 4 + i * 2, LOW + 9, 2, 1)
  }
  // 둥근 나무 문과 놋쇠 손잡이
  const dx = dc - 6
  const door = '#906040'
  r(FRAME, dx, LOW + 1, 12, 15)
  r(door, dx + 1, LOW + 2, 10, 14)
  r(door, dx + 2, LOW + 1, 8, 1)
  r(mix(door, '#000000', 0.18), dx + 4, LOW + 3, 1, 13)
  r(mix(door, '#000000', 0.18), dx + 7, LOW + 3, 1, 13)
  r('#ffca70', dx + 8, LOW + 9, 2, 2)
  // 줄무늬 차양: 문 위 (신약 집 awning — 지붕 색과 크림 줄)
  if (trim === 'awning') {
    for (let i = 0; i < 7; i++) r(i % 2 ? '#f8e8cc' : roof[0], dc - 14 + i * 4, LOW - 6, 4, 5)
    for (let i = 0; i < 7; i++) r(roof[0], dc - 13 + i * 4, LOW - 1, 2, 1)
  }
  if (kind === 'guest') {
    // 손님집 간판 (2026-10-13 사용자 확인안): 벽에 바로 붙인 네모 판(바깥 모래색·안쪽 연한 줄), 안에 연한 다홍 하트. 걸이·사슬 없음.
    // 문 옆 위 줄 빈 벽에 — 창은 아래 줄이라 겹치지 않고, 차양(문 위)과도 떨어진다
    const bx = dc + 14 + 13 <= W - 2 ? dc + 14 : dc - 27
    const top = WALL_TOP + 3
    r('#dcbf94', bx, top, 13, 12) // 바깥 테두리 모래색
    r('#ead6b2', bx + 1, top + 1, 11, 10) // 안쪽 한 줄은 연하게 (사용자 고른 '나')
    r('#f6e6c4', bx + 2, top + 2, 9, 8)
    r('#fbf1da', bx + 2, top + 2, 9, 1)
    const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']
    HEART.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') r('#d9707e', bx + 3 + x, top + 3 + y, 1, 1) }))
    r('#ffffff', bx + 4, top + 4, 1, 1)
  }
}

const cache = new Map<string, HTMLCanvasElement>()
/** 집 그림 한 장 (같은 모습은 다시 그리지 않는다) */
export function newlandHouseCanvas(kind: BuildKind, facing: Facing, look: HouseLook = DEFAULT_LOOK, winter = false, width = 4): HTMLCanvasElement {
  const key = `${kind}/${facing}/${look.roof}/${look.wall}/${look.window ?? 0}/${look.trim ?? 0}/${width}/${winter ? 'w' : ''}`
  let c = cache.get(key)
  if (c) return c
  c = document.createElement('canvas')
  c.width = width * T
  c.height = HOUSE_ART
  const g = c.getContext('2d')
  if (g) drawNewlandHouse(g, kind, facing, look, winter, width)
  cache.set(key, c)
  return c
}

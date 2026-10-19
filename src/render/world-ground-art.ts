// Native world pixels shared by the map and detached story snapshots.
import type {Season} from '../engine/types'
import type {TreeKind} from '../engine/world'
const TILE=16
type Ctx=Pick<CanvasRenderingContext2D,'fillStyle'|'fillRect'> & Partial<Pick<CanvasRenderingContext2D,'globalAlpha'>>
export const C = {
  // 참고 그림(2026-09-30 사용자)에 맞춘 밝고 선명한 색: 연두 풀밭, 모래빛 흙길, 맑은 하늘빛 호수, 또렷한 지붕
  // 풀은 부드러운 세이지·연두 (2026-10-04 사용자)
  grass: '#b0cc94',
  grass2: '#a6c48a',
  grass3: '#b8d29e',
  worn: '#c9c27a',
  worn2: '#d8bd84',
  path: '#ecd0a0',
  path2: '#e0c898',
  floor: '#e9c48f',
  floor2: '#d6ad76',
  wall: '#f4e0c0',
  wallTop: '#f8e8cc',
  wallDark: '#e8d0a8',
  leaf: '#509048',
  leaf2: '#408040',
  leaf3: '#74ac5c',
  trunk: '#906038',
  stone: '#bdb7ab',
  stoneDark: '#8f887c',
  water: '#60b8c4',
  water2: '#98d8e0',
  wood: '#a87850',
  woodDark: '#845038',
  blanket: '#e27d86',
  blanketDark: '#c25e6a',
  pillow: '#fff5e4',
  paper: '#fbeecb',
  lamp: '#ffd24a',
  door: '#906040',
  shadow: 'rgba(60,40,10,0.2)',
  fire: '#ff8c32',
  fire2: '#ffd873',
  reed: '#74ac5c',
  reed2: '#509048',
  olive: '#74ac5c',
  olive2: '#509048',
  vine: '#549044',
  grapes: '#7b3f96',
  fence: '#845038',
  awning: '#e2574c',
  awning2: '#fffdf6',
  flower: ['#ff9aa8', '#ffe070', '#ffffff', '#f7b5d8'],
}

export const SEASON_GRASS: Record<Season, [string, string, string]> = {
  // 봄 풀빛은 참고 그림(2026-09-30 사용자)에서 뽑은 그대로
  // 봄·여름 풀은 부드러운 세이지·연두 (2026-10-04 사용자 — 참고 그림보다 한 톤 차분하게)
  spring: ['#b0cc94', '#a6c48a', '#b8d29e'],
  summer: ['#a8c48c', '#9ebc82', '#b0cc94'],
  autumn: ['#c8c88c', '#bcbc80', '#d4d49c'],
  winter: ['#dfe8dc', '#cfdacb', '#eef3ec'],
}

/** 칸마다 같은 무늬가 나오도록 좌표로 만든 난수 */
export function hash(x: number, y: number, i: number): number {
  let h = (x * 374761393 + y * 668265263 + i * 2147483647) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  // ^ 는 부호 있는 32비트를 돌려준다 — >>> 0 으로 0 이상으로 만들어야 점이 옆 칸으로 새지 않는다
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** 풀밭·흙길의 점은 바탕보다 20% 옅게 (2026-10-19 사용자) */
const DOT_ALPHA = 0.8

/** 들꽃 점은 기존 불투명도 80%보다 20% 진하게. 지도·이벤트컷에 같은 색을 쓴다. */
export function wildflowerColor(index: number): string {
  const hex = C.flower[index]
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  return `rgba(${rgb.join(',')},0.96)`
}

function speckle(g: Ctx, px: number, py: number, x: number, y: number, color: string, n: number) {
  const alpha = g.globalAlpha ?? 1
  g.globalAlpha = alpha * DOT_ALPHA
  g.fillStyle = color
  for (let i = 0; i < n; i++) g.fillRect(px + Math.floor(hash(x, y, i) * 15), py + Math.floor(hash(x, y, i + 50) * 15), 1, 1)
  g.globalAlpha = alpha
}

export function drawNativeGround(g: Ctx, ch: string, x: number, y: number, season: Season, at: (x: number, y: number) => string, visibleHeight: number) {
  const px = x * TILE
  const py = y * TILE
  const [g1, g2, g3] = SEASON_GRASS[season]
  // 길 한가운데 놓인 벤치·우물은 풀 한 칸을 깔지 않고 길 바닥 그대로 (사용자, 2026-09-30)
  if ((ch === 'B' || ch === 'w') && [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].filter((c) => c === ',').length >= 3) ch = ','
  if (ch === '_') {
    g.fillStyle = '#15100c'
    g.fillRect(px, py, TILE, TILE)
    return
  }
  if ('fbdhskDH'.includes(ch) || (y >= visibleHeight && ch !== '#')) {
    g.fillStyle = C.floor
    g.fillRect(px, py, TILE, TILE)
    g.fillStyle = C.floor2
    g.fillRect(px, py + 7, TILE, 1)
    g.fillRect(px, py + 15, TILE, 1)
    g.fillRect(px + ((x + y) % 2 ? 4 : 11), py, 1, 7)
    g.fillRect(px + ((x + y) % 2 ? 10 : 2), py + 8, 1, 7)
  } else if (ch === ',' || ch === 'm' || ch === 'A' || ch === 'P' || ch === '>' || ch === 'X') {
    g.fillStyle = C.path
    g.fillRect(px, py, TILE, TILE)
    speckle(g, px, py, x, y, C.path2, 6)
  } else if (ch === '~' || ch === '=' || ch === 'u' || (ch === 'r' && y >= 33)) {
    g.fillStyle = C.water
    g.fillRect(px, py, TILE, TILE)
    g.fillStyle = C.water2
    g.fillRect(px + Math.floor(hash(x, y, 1) * 10), py + 4 + Math.floor(hash(x, y, 2) * 8), 5, 1)
  } else if (ch !== '#') {
    g.fillStyle = g1
    g.fillRect(px, py, TILE, TILE)
    speckle(g, px, py, x, y, g2, 7)
    speckle(g, px, py, x + 99, y, g3, 3)
    // 풀밭이 흙길과 만나는 가장자리는 한 톤 짙게 (참고 그림처럼 풀밭 조각이 또렷하게)
    if (y < visibleHeight) {
      g.fillStyle = g2
      const isPath = (c: string) => c === ',' || c === 'm' || c === 'A' || c === 'P' || c === '>' || c === 'X'
      if (isPath(at(x, y - 1))) g.fillRect(px, py, TILE, 2)
      if (isPath(at(x, y + 1))) g.fillRect(px, py + TILE - 2, TILE, 2)
      if (isPath(at(x - 1, y))) g.fillRect(px, py, 2, TILE)
      if (isPath(at(x + 1, y))) g.fillRect(px + TILE - 2, py, 2, TILE)
      // 계절 풀밭 (빈 풀 칸에만): 봄엔 들꽃이 늘고, 여름엔 키 큰 풀포기
      if (ch === '.' && season === 'spring' && hash(x, y, 71) < 0.12) {
        const fx = 3 + Math.floor(hash(x, y, 72) * 8)
        const fy = 3 + Math.floor(hash(x, y, 73) * 8)
        g.fillStyle = wildflowerColor(Math.floor(hash(x, y, 74) * 4))
        g.fillRect(px + fx, py + fy, 2, 2)
        g.fillStyle = wildflowerColor(Math.floor(hash(x, y, 75) * 4))
        g.fillRect(px + fx + 3, py + fy + 2, 2, 2)
      }
      if (ch === '.' && season === 'summer' && hash(x, y, 76) < 0.1) {
        const fx = 3 + Math.floor(hash(x, y, 77) * 8)
        const fy = 4 + Math.floor(hash(x, y, 78) * 5)
        g.fillStyle = '#86a868'
        g.fillRect(px + fx, py + fy + 1, 2, 6)
        g.fillRect(px + fx + 2, py + fy + 3, 2, 4)
        g.fillStyle = '#98b878'
        g.fillRect(px + fx - 2, py + fy + 3, 2, 4)
      }
    }
  }
}

/** 활엽수 잎빛: 봄은 바탕 그대로, 여름은 한 톤 짙게 [아랫잎, 바탕, 윗잎] */
const LEAVES: Record<'spring' | 'summer', [string, string, string]> = {
  spring: [C.leaf2, C.leaf, C.leaf3],
  summer: ['#3a7440', '#488444', '#669e56'],
}
/** 가을에 물든 잎 (노랑·붉은 두 가지 — 차분한 파스텔) */
const AUTUMN_LEAVES: [string, string, string][] = [
  ['#cf983a', '#e5ad55', '#f4c977'],
  ['#b8664c', '#cf8262', '#e6a283'],
]
/** 가을에 아직 물들지 않은 활엽수 — 여름보다 조금 바랜 초록 */
const AUTUMN_GREEN: [string, string, string] = ['#4c7e40', '#5e8c48', '#7da462']
/** 겨울 늘푸른나무 — 잎은 그대로, 빛만 조금 가라앉게 */
const EVERGREEN_WINTER: [string, string, string] = ['#3e7246', '#4e8050', '#6c9a66']

/**
 * 지도의 둥근 나무 한 그루 (계획 15): 나무 종류(world.treeKind)와 계절에 따라 —
 * 늘푸른나무는 한 해 내내 그대로, 활엽수·과일나무는 여름에 한 톤 짙고, 가을엔 일부만 노랑·붉게 물들어 밑에 낙엽 몇 장,
 * 겨울엔 잎 진 빈 가지. 과일나무는 봄에 흰·분홍 꽃. 선은 모두 2픽셀
 */
export function drawTree(g: Ctx, x: number, y: number, season: Season, kind: TreeKind) {
  const px = x * TILE
  const py = y * TILE
  const r = (color: string, dx: number, dy: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(px + dx, py + dy, w, h)
  }
  r('rgba(90,80,50,0.18)', 3, 13, 10, 2)
  if (kind !== 'evergreen' && season === 'winter') {
    // 잎 진 가지: 줄기에서 양옆으로 갈라진 2픽셀 가지
    const bark = '#8a6040'
    const twig = '#a27a58'
    r(bark, 7, 4, 2, 11)
    r(bark, 5, 8, 2, 2)
    r(bark, 3, 6, 2, 2)
    r(twig, 3, 4, 2, 2)
    r(bark, 9, 7, 2, 2)
    r(bark, 11, 5, 2, 2)
    r(twig, 11, 3, 2, 2)
    r(twig, 6, 2, 2, 2)
    r(twig, 9, 3, 2, 2)
    return
  }
  let [d, m, l] = kind === 'evergreen' ? (season === 'winter' ? EVERGREEN_WINTER : LEAVES.spring) : season === 'spring' ? LEAVES.spring : LEAVES.summer
  // 가을: 활엽수 절반쯤만 물든다 (자리마다 정해진 대로)
  const turned = season === 'autumn' && kind !== 'evergreen' && hash(x, y, 61) < 0.55
  if (season === 'autumn' && kind !== 'evergreen') [d, m, l] = turned ? AUTUMN_LEAVES[hash(x, y, 62) < 0.6 ? 0 : 1] : AUTUMN_GREEN
  r(C.trunk, 7, 10, 2, 5)
  r(d, 3, 3, 10, 8)
  r(d, 2, 5, 12, 5)
  r(d, 5, 1, 6, 11)
  r(m, 3, 2, 10, 7)
  r(m, 2, 4, 12, 4)
  r(m, 5, 1, 6, 9)
  r(l, 4, 2, 4, 3)
  r(l, 5, 1, 2, 1)
  if (turned) {
    // 나무 밑 낙엽 몇 장
    r(m, 2, 13, 2, 2)
    r(l, 11, 12, 2, 2)
    if (hash(x, y, 63) < 0.6) r(d, 5, 14, 2, 2)
  }
  if (kind === 'fruit' && season === 'spring') {
    // 흰·분홍 꽃 (짝지은 두 그루는 같은 색 — 광장 쌍은 분홍, 풀밭 쌍은 흰 꽃. 다른 색이 조금 섞인다)
    const pink = y % 2 === 0
    const main = pink ? '#f6c3d2' : '#fbf6ee'
    const other = pink ? '#fbf6ee' : '#f6c3d2'
    for (const [bx, by] of [[4, 3], [9, 2], [6, 6], [11, 6], [3, 7], [8, 9]]) r(main, bx, by, 2, 2)
    for (const [bx, by] of [[7, 1], [10, 9]]) r(other, bx, by, 2, 2)
  }
}


/** Original interior wall edges, driven only by the supplied neighbour snapshot. */
export function drawNativeRoomWall(g:Ctx,x:number,y:number,at:(x:number,y:number)=>string){
 const px=x*16,py=y*16
 const r=(color:string,dx:number,dy:number,w:number,h:number)=>{g.fillStyle=color;g.fillRect(px+dx,py+dy,w,h)}
      // 집 안 벽: 크림 회벽과 나무 들보.
      // 옆벽(위아래가 벽으로 이어진 칸)은 세로로 한 장처럼 — 칸마다 가로줄을 긋지 않고, 방 쪽 가장자리에만 밝은 선
      const wallAt = (xx: number, yy: number) => '#SNVFJKMCQY'.includes(at(xx, yy))
      const vertical = wallAt(x, y - 1) && wallAt(x, y + 1) && !(wallAt(x - 1, y) && wallAt(x + 1, y))
      r(C.wall, 0, 0, 16, 16)
      if (vertical) {
        const inRight = !wallAt(x + 1, y) && at(x + 1, y) !== '_'
        const inLeft = !wallAt(x - 1, y) && at(x - 1, y) !== '_'
        if (inRight) r(C.wallTop, 14, 0, 2, 16)
        if (inLeft) r(C.wallTop, 0, 0, 2, 16)
        if (!inLeft) r(C.wallDark, 0, 0, 1, 16)
        if (!inRight) r(C.wallDark, 15, 0, 1, 16)
      } else {
        r(C.wallTop, 0, 0, 16, 2)
        r(C.wallDark, 0, 15, 16, 1)
      }
}

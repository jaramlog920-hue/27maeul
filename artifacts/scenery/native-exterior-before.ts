import {HOUSE_RECT,TILE} from '../../src/engine/world'
type Ctx=Pick<CanvasRenderingContext2D,'fillStyle'|'fillRect'>
/** 집마다 다른 모양 — 지붕 무늬·벽·창·문 (아기자기한 파스텔) */
interface HouseStyle {
  /** 지붕 [바탕, 줄·테두리, 빛] */
  roof: [string, string, string]
  pattern: 'scallop' | 'stripe' | 'tile' | 'honey'
  wall: string
  base: string
  window: 'square' | 'round' | 'arch'
  shutter: string
  door: string
  timber?: string
  awning?: [string, string]
}
const HOUSE_STYLES: Record<string, HouseStyle> = {
  // 지붕·벽·문·창틀 색은 참고 그림(2026-09-30 사용자)에서 뽑은 그대로 — 새 색 조합을 만들지 않는다
  home: { roof: ['#c07058', '#a86048', '#cc8468'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'square', shutter: '#ac7444', door: '#906040' },
  library: { roof: ['#58984c', '#488040', '#6cac5c'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'arch', shutter: '#ac7444', door: '#906040' },
  baker: { roof: ['#a06450', '#885444', '#b07864'], pattern: 'tile', wall: '#f8c094', base: '#eeb080', window: 'square', shutter: '#ac7444', door: '#906040', awning: ['#c07058', '#f8e8cc'] },
  child: { roof: ['#58984c', '#488040', '#6cac5c'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'round', shutter: '#ac7444', door: '#906040' },
  grandpa: { roof: ['#a06450', '#885444', '#b07864'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'square', shutter: '#ac7444', door: '#906040', timber: '#ac7444' },
  weaver: { roof: ['#bc6c54', '#a45a44', '#cc8068'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'arch', shutter: '#ac7444', door: '#906040' },
  beekeeper: { roof: ['#c8a04c', '#ac883c', '#d4b060'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'round', shutter: '#ac7444', door: '#906040' },
  postman: { roof: ['#4898a4', '#3c808c', '#5cacb8'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'square', shutter: '#ac7444', door: '#906040' },
  apothecary: { roof: ['#b05860', '#944850', '#c06c74'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'arch', shutter: '#ac7444', door: '#906040', awning: ['#58984c', '#f8e8cc'] },
  fisher: { roof: ['#4898a4', '#3c808c', '#5cacb8'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'round', shutter: '#ac7444', door: '#906040' },
  carpenter: { roof: ['#c8a04c', '#ac883c', '#d4b060'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'square', shutter: '#ac7444', door: '#906040', timber: '#ac7444' },
  // 사랑방과 찻집은 외관을 맞바꿨다 (2026-10-13 사용자)
  hall: { roof: ['#cc70a0', '#b05c88', '#d888b4'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'round', shutter: '#ac7444', door: '#906040', awning: ['#cc70a0', '#f8e8cc'] },
  tripA: { roof: ['#4880b4', '#3c6c9c', '#5c94c4'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'square', shutter: '#ac7444', door: '#906040' },
  tripB: { roof: ['#c07058', '#a86048', '#cc8468'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'round', shutter: '#ac7444', door: '#906040', awning: ['#c07058', '#f8e8cc'] },
  tripC: { roof: ['#4898a4', '#3c808c', '#5cacb8'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'arch', shutter: '#ac7444', door: '#906040' },
  tripD: { roof: ['#a06450', '#885444', '#b07864'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'square', shutter: '#ac7444', door: '#906040', timber: '#ac7444' },
  tripE: { roof: ['#c8a04c', '#ac883c', '#d4b060'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'round', shutter: '#ac7444', door: '#906040' },
  tripF: { roof: ['#58984c', '#488040', '#6cac5c'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'arch', shutter: '#ac7444', door: '#906040' },
  teahouse: { roof: ['#4880b4', '#3c6c9c', '#5c94c4'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'arch', shutter: '#ac7444', door: '#906040', timber: '#ac7444' },
}
const PLAIN_STYLE = HOUSE_STYLES.child
/** 앞벽 한 칸: 위 줄은 처마 그림자뿐, 아래 줄에 꽃 상자 달린 창과 문 */
export function houseWallTile(g: Ctx, x: number, y: number, ch: string, id: string, h: { x0: number; x1: number; y1: number; doorX: number }) {
  const st = HOUSE_STYLES[id] ?? PLAIN_STYLE
  const px = x * TILE
  const py = y * TILE
  const r = (color: string, dx: number, dy: number, w: number, hh: number) => {
    g.fillStyle = color
    g.fillRect(px + dx, py + dy, w, hh)
  }
  const upper = y === h.y1 - 1
  r(st.wall, 0, 0, 16, 16)
  if (upper) r('rgba(90,60,70,0.22)', 0, 0, 16, 3)
  if (!upper) r(st.base, 0, 12, 16, 4)
  if (st.timber) {
    // 나무 들보: 위 가로대(위 줄에만), 집 양끝, 문 양옆 — 문을 가운데 두고 대칭. 선은 2픽셀 (1픽셀은 걸을 때 일렁인다)
    if (upper) r(st.timber, 0, 3, 16, 2)
    if (x === h.x0 || x === h.doorX + 1) r(st.timber, 0, 0, 2, 16)
    if (x === h.x1 || x === h.doorX - 1) r(st.timber, 14, 0, 2, 16)
  }
  if (x === h.x0 || id==='home'&&x===HOUSE_RECT.x0) r(st.base, 0, 0, 2, 16)
  if (x === h.x1 || id==='home'&&x===HOUSE_RECT.x1) r(st.base, 14, 0, 2, 16)

  const door = x === h.doorX
  // 창은 아래 줄에만, 문을 가운데 두고 양옆 같은 거리에
  // 넓은 집(7칸 이상)은 문에서 두 칸, 작은 집은 문 바로 옆 — 모서리에 붙지 않게
  // 넓힌 내 집은 본채(5칸) 창을 그대로 두고, 오른쪽 증축부에 창을 따로 단다.
  const main = id === 'home' ? { ...h, x0: HOUSE_RECT.x0, x1: HOUSE_RECT.x1 } : h
  const k = main.x1 - main.x0 + 1 >= 7 ? 2 : 1
  const winCol = x >= main.x0 && Math.abs(x - main.doorX) === k
  const glass = '#ffca70'
  const glow = '#ffeaba'
  const frame = '#c59a61'
  const tileRect = r
  /** 창 하나 (ox: 칸 안에서 옆으로 옮기기 — 두 칸 사이에 걸친 창) */
  const window = (dy: number, ox = 0) => {
    const r = (color: string, dx: number, yy: number, w: number, hh: number) => tileRect(color, dx + ox, yy, w, hh)
    if (st.window === 'round') {
      r(frame, 4, dy + 1, 8, 6)
      r(frame, 5, dy, 6, 8)
      r(glass, 5, dy + 1, 6, 6)
      r(glow, 5, dy + 1, 2, 2)
      r(frame, 7, dy + 1, 2, 6)
      r(frame, 5, dy + 3, 6, 2)
    } else if (st.window === 'arch') {
      r(frame, 4, dy + 1, 8, 8)
      r(frame, 5, dy, 6, 1)
      r(glass, 5, dy + 1, 6, 7)
      r(glow, 5, dy + 1, 2, 3)
      r(frame, 7, dy + 1, 2, 7)
    } else {
      r(frame, 3, dy, 10, 9)
      r(glass, 4, dy + 1, 8, 7)
      r(glow, 4, dy + 1, 3, 3)
      r(frame, 7, dy + 1, 2, 7)
      r(frame, 4, dy + 4, 8, 1)
    }
  }
  if (id === 'library') {
    // 서고: 문 위에 동그란 창, 양옆에 큰 아치 창 (두 줄에 걸쳐)
    const archCols = [h.doorX - 3, h.doorX - 2, h.doorX + 2, h.doorX + 3]
    if (archCols.includes(x)) {
      const left = x === h.doorX - 3 || x === h.doorX + 2
      const wx = left ? 8 : 0
      if (upper) {
        r('#c59a61', left ? 6 : 0, 4, 10, 12)
        r('#c59a61', left ? 7 : 0, 3, left ? 9 : 9, 1)
        r('#ffca70', wx, 6, 8, 10)
        r('#c59a61', left ? 14 : 0, 6, 2, 10)
      } else {
        r('#c59a61', left ? 6 : 0, 0, 10, 10)
        r('#ffca70', wx, 0, 8, 8)
        r('#c59a61', left ? 14 : 0, 0, 2, 8)
        r('#c59a61', wx, 4, 8, 1)
        r('#f5e0af', left ? 6 : 0, 9, 10, 2)
      }
    }
    // 위 줄(2층 높이)에는 아무것도 달지 않는다 — 창은 아래 줄에만
  } else if (!upper && winCol) {
    window(1)
    r('#c68b54', 3, 10, 10, 2) // 꽃 상자
    for (let i = 0; i < 4; i++) r(['#ffc2a0', '#fefdf8', '#feae88', '#a2cb78'][(x + i) % 4], 4 + i * 2, 9, 2, 1)
  }
  if (door && !upper) {
    // 둥근 나무 문과 놋쇠 손잡이
    const dc = ch === 'L' ? '#a96f3f' : st.door
    r(frame, 2, 1, 12, 15)
    r(dc, 3, 2, 10, 14)
    r(dc, 4, 1, 8, 1)
    r(mix(dc, '#000000', 0.18), 6, 3, 1, 13)
    r(mix(dc, '#000000', 0.18), 9, 3, 1, 13)
    r('#ffca70', 10, 9, 2, 2)
  }
  if (id === 'home' && h.x1 > HOUSE_RECT.x1) {
    // 오른쪽 두 칸은 본채와 같은 벽·창 디자인으로 잇는다 (본채 모서리 기둥이 이음매가 된다).
    if (!upper && x === HOUSE_RECT.x1+2) {
      // 오른쪽 칸을 그릴 때 왼쪽 칸에 반쯤 걸쳐 그린다 (왼쪽 칸은 이미 그려져 있다)
      window(1, -8)
      r('#c68b54', -5, 10, 10, 2) // 꽃 상자
      for (let i = 0; i < 4; i++) r(['#ffc2a0', '#fefdf8', '#feae88', '#a2cb78'][(x + i) % 4], -4 + i * 2, 9, 2, 1)
    }
  }
  if(id==='home'&&h.x0<HOUSE_RECT.x0&&!upper&&x===HOUSE_RECT.x0-1){
    window(1,-8)
    r('#c68b54',-5,10,10,2)
    for(let i=0;i<4;i++)r(['#ffc2a0','#fefdf8','#feae88','#a2cb78'][(x+i)%4],-4+i*2,9,2,1)
  }
  if (st.awning && !st.timber && !upper && Math.abs(x - h.doorX) <= 1) {
    // 문 위 줄무늬 차양 — 나무 줄(timber)이 있는 집에는 달지 않는다
    for (let i = 0; i < 4; i++) r(i % 2 ? st.awning[1] : st.awning[0], i * 4, 0, 4, 4)
    for (let i = 0; i < 4; i++) r(st.awning[0], i * 4 + 1, 4, 2, 1)
  }
}

/** 두 색을 섞는다 (t = 0 → a, 1 → b) */
function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

/** 굴뚝의 왼쪽 끝 (지붕 왼쪽에서 몇 픽셀) — 지붕 폭의 72% 자리 */
function chimneyX(tx0: number, tx1: number): number {
  return Math.floor((tx1 - tx0 + 1) * TILE * 0.72)
}

/**
 * 네모난 기와지붕 하나 (칸 tx0..tx1, ty0..ty1): 용마루, 양옆 테두리, 처마, 옅은 기와 띠.
 * 화면이 정수배가 아닌 크기로 늘어나도 일렁이지 않게 선은 모두 2픽셀 이상.
 */
export function drawRoof(g: Ctx, tx0: number, ty0: number, tx1: number, ty1: number, [c1, c2, c3]: [string, string, string], chimney = true) {
  const ox = tx0 * TILE
  const oy = ty0 * TILE
  const W = (tx1 - tx0 + 1) * TILE
  const H = (ty1 - ty0 + 1) * TILE
  const r = (color: string, x: number, y: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(ox + x, oy + y, w, h)
  }
  r(c1, 0, 0, W, H)
  const band = mix(c1, c2, 0.25)
  for (let y = 8; y < H - 4; y += 8) r(band, 0, y, W, 2) // 기와 띠
  r(c2, 0, 0, W, 4) // 용마루
  r(c3, 0, 0, W, 2)
  r(c2, 0, 0, 2, H) // 양옆 테두리
  r(c2, W - 2, 0, 2, H)
  r(c2, 0, H - 4, W, 4) // 처마
  r(mix(c2, '#000000', 0.15), 0, H - 2, W, 2)
  if (chimney) {
    const cx = chimneyX(tx0, tx1)
    r('#e0a974', cx, -6, 8, 12)
    r('#9a6e45', cx - 2, -8, 12, 2)
    r(mix('#e0a974', '#9a6e45', 0.4), cx + 6, -6, 2, 12)
  }
}

/** 두 마을 서고가 같은 벽·창·문·지붕 그림을 공유한다. 지붕 색만 다르다. */
export function drawLibraryExterior(g: Ctx, h: {x0:number;y0:number;x1:number;y1:number;doorX:number}, roof: readonly [string,string,string] = HOUSE_STYLES.library.roof) {
  for(let y=h.y1-1;y<=h.y1;y++)for(let x=h.x0;x<=h.x1;x++)
    houseWallTile(g,x,y,x===h.doorX&&y===h.y1?'D':'S','library',h)
  drawRoof(g,h.x0,h.y0,h.x1,h.y1-2,[...roof])
}


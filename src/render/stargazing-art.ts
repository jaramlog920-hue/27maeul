import { withLookDefaults, type Avatar } from '../engine/avatar'
import { spriteRows, writerPalette } from './sprites'

/** 마을과 같은 주인공을 사용하는 낮은 해상도의 밤 풍경. 모든 윤곽은 정수 화소다. */
export function drawStargazing(g: CanvasRenderingContext2D, w: number, h: number, seconds: number, avatar: Avatar | null, day = 1) {
  const px = (x: number, y: number, c: string, a = 1, b = 1) => {
    g.fillStyle = c
    g.fillRect(Math.round(x), Math.round(y), Math.ceil(a), Math.ceil(b))
  }
  g.imageSmoothingEnabled = false
  const horizon = Math.round(h * .70)
  const colors = ['#10182d', '#151d35', '#1c2640', '#28334c', '#37445b', '#505b6b']
  for (let y = 0; y < horizon; y++) {
    const band = Math.min(5, Math.floor(y / horizon * 6))
    px(0, y, colors[band], w)
    if (band > 0 && y % Math.ceil(horizon / 6) < 3)
      for (let x = y % 2; x < w; x += 2) px(x, y, colors[band - 1])
  }
  let seed = 2017 + day * 31
  const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)
  // 은하수는 작은 청회색 점을 겹친다.
  for (let i = 0; i < 280; i++) {
    const x = rand() * w, y = horizon * .12 + x / w * horizon * .45 + (rand() - .5) * horizon * .22
    if (y > 4 && y < horizon - 18) px(x, y, rand() > .5 ? '#344058' : '#28334b')
  }
  for (let i = 0; i < 100; i++) {
    const x = 6 + rand() * (w - 12), y = 5 + rand() * (horizon - 20), phase = rand() * 6
    const bright = Math.sin(seconds * .65 + phase) > .55
    px(x, y, bright ? '#ede5c7' : '#8998b5')
    if (i % 19 === 0 && bright) {
      px(x - 1, y, '#b9c3d0', 3)
      px(x, y - 1, '#b9c3d0', 1, 3)
      px(x, y, '#f6e9cd')
    }
  }
  // 초승달 윤곽은 계단 모양의 화소로 그린다.
  const mx = Math.round(w * .78), my = Math.round(horizon * .20)
  for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++)
    if (x * x + y * y <= 64 && (x - 4) ** 2 + (y + 2) ** 2 > 58) px(mx + x, my + y, '#d5d6bf')
  // 가끔 지나가는 유성은 보상과 무관한 풍경이다.
  const meteor = seconds % 24
  if (meteor > 9 && meteor < 9.6) {
    const t = (meteor - 9) / .6, x = w * .22 + t * 36, y = horizon * .24 + t * 17
    for (let i = 0; i < 7; i++) px(x - i * 2, y - i, i < 2 ? '#ede5cb' : '#7487a6')
  }
  const ridge = (base: number, amp: number, color: string, phase: number) => {
    for (let x = 0; x < w; x++) {
      const y = Math.round(base + Math.sin(x / w * 8 + phase) * amp + Math.sin(x / w * 17 + phase) * amp * .3)
      px(x, y, color, 1, h - y)
    }
  }
  ridge(horizon - 5, 9, '#293b49', 1)
  ridge(horizon + 8, 8, '#20383c', 3)
  // 먼 마을 창에 기존 마을의 따뜻한 색을 남긴다.
  for (let i = 0; i < 8; i++) {
    const x = w * .12 + i * w * .075, y = horizon + 10 + Math.sin(i * 2) * 4
    px(x, y - 3, '#263538', 9, 7)
    px(x - 1, y - 5, '#192b32', 11, 3)
    px(x + 2, y, i % 3 ? '#bd9b62' : '#e0be79', 2, 2)
  }
  ridge(h * .82, 7, '#162e2d', 2)
  ridge(h * .89, 10, '#102421', 4)
  const ground = Math.round(h * .84), bx = Math.round(w * .5)
  drawScenicBench(g, bx, ground, avatar)
  // 인물과 자막 주변에는 여백을 둔다.
  for (let i = 0; i < 45; i++) {
    const x = rand() * w, y = ground + 6 + rand() * (h - ground - 8)
    if (Math.abs(x - bx) < 28) continue
    px(x, y, '#2b4133', 1, 3)
    if (i % 4 === 0) px(x + 1, y - 1, '#53664b')
  }
}

/** 뒷모습: 상체를 좌판 위에 두고 손·골반은 등받이 뒤에, 발은 지면에 둔다. */
export function drawScenicBench(g: CanvasRenderingContext2D, bx: number, ground: number, avatar: Avatar | null) {
  const px = (x: number, y: number, c: string, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h) }
  px(bx - 22, ground, '#0b1d1e', 45, 3)
  px(bx - 17, ground - 5, '#594c40', 3, 6)
  px(bx + 14, ground - 5, '#594c40', 3, 6)
  px(bx - 22, ground - 7, '#a28662', 44, 2)
  const full = avatar ? withLookDefaults(avatar) : undefined
  const pal = writerPalette('summer', full)
  const rows = spriteRows('writer', 'up', { frame: 0, blink: false, avatar: full, look: avatar?.look })
  rows.slice(0, 11).forEach((row, y) => [...row].forEach((ch, x) => {
    if (y >= 10 && (x <= 1 || x >= 8)) return
    if (ch !== '.' && pal[ch]) px(bx - 10 + x * 2, ground - 28 + y * 2, pal[ch], 2, 2)
  }))
  for (const x of [bx - 6, bx + 2]) {
    px(x, ground - 6, pal.d ?? pal.R, 4, 4)
    px(x - 1, ground - 2, pal.k, 6, 2)
  }
  if (full && [0, 1, 4, 5].includes(full.bottom)) px(bx - 7, ground - 6, pal.d, 14, 4)
  // 등받이 위로 어깨를 보이고, 골반은 좌판 위 등받이 뒤에 둔다.
  px(bx - 22, ground - 12, '#695844', 44, 5)
  px(bx - 22, ground - 12, '#a08762', 44, 1)
  px(bx - 22, ground - 9, '#80694f', 44, 1)
}

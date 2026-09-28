// 시작 화면 그림: 밝은 낮, 하늘에 떠 있는 작은 섬 마을 (사용자 참고 그림의 색감).
// 가운데 초록 지붕 서고, 양옆 오두막, 개울과 나무다리, 둥근 나무, 길 위의 주인공과 이웃.
// 코드로 그린 도트 (160×170). 구름이 흐르고, 굴뚝 연기가 오르고, 물이 반짝인다.
import { useEffect, useRef } from 'react'
import { withLookDefaults, type Avatar } from '../../engine/avatar'
import { PALETTE, spriteRows, writerPalette } from '../../render/sprites'

export const SCENE_W = 160
export const SCENE_H = 170

const K = {
  sky: '#edf0df',
  cloud: '#fefdf8',
  cloud2: '#e2e5d9',
  sun: '#f1bf6b',
  sun2: '#fce2a7',
  grass: '#bfcfa4',
  grass2: '#abc292',
  grass3: '#cfdcb6',
  cliff: '#97af83',
  cliff2: '#7f9a6c',
  path: '#e5d3aa',
  path2: '#d6c194',
  water: '#98c5bb',
  water2: '#bddbcc',
  wood: '#ad845d',
  wood2: '#8e6a4d',
  line: '#6b5040',
  wall: '#f8e6c0',
  wall2: '#f3dbb0',
  peach: '#eec59c',
  roofT: '#ac7759',
  roofT2: '#8e6a4d',
  roofT3: '#c98f6a',
  roofO: '#b9805c',
  roofG: '#7b9a60',
  roofG2: '#5f7a48',
  roofG3: '#99b67b',
  win: '#f1bf6b',
  win2: '#fce2a7',
  leaf: '#7b9a60',
  leaf2: '#708754',
  leaf3: '#99b67b',
  trunk: '#82684f',
  flower: '#f1b999',
}

function seeded(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

type Px = (x: number, y: number, c: string, w?: number, h?: number) => void

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

/**
 * 게임 안 집과 같은 모양: 네모난 기와지붕(용마루·옆 테두리·처마·기와 띠) + 앞벽(노란 창·나무 문).
 * x, y = 지붕 왼쪽 위, w = 폭, roofH·wallH = 지붕·벽 높이
 */
function house(px: Px, x: number, y: number, w: number, roofH: number, wallH: number, [c1, c2, c3]: [string, string, string], wall: string, windows = 2) {
  // 지붕
  px(x, y, c1, w, roofH)
  for (let yy = 6; yy < roofH - 3; yy += 6) px(x, y + yy, mix(c1, c2, 0.25), w, 2)
  px(x, y, c2, w, 3)
  px(x, y, c3, w, 1)
  px(x, y, c2, 2, roofH)
  px(x + w - 2, y, c2, 2, roofH)
  px(x, y + roofH - 3, c2, w, 3)
  // 굴뚝
  const cx0 = x + Math.floor(w * 0.72)
  px(cx0, y - 5, '#c9a079', 5, 7)
  px(cx0 - 1, y - 6, K.roofT2, 7, 2)
  // 앞벽
  const wy = y + roofH
  px(x, wy, wall, w, wallH)
  px(x, wy, 'rgba(90,60,50,0.22)', w, 2)
  px(x, wy + wallH - 3, K.wall2, w, 3)
  px(x, wy, K.path2, 1, wallH)
  px(x + w - 1, wy, K.path2, 1, wallH)
  // 문 (가운데)
  const cx = x + Math.floor(w / 2)
  const dh = Math.min(wallH - 2, 12)
  px(cx - 4, wy + wallH - dh, '#ae9068', 9, dh)
  px(cx - 3, wy + wallH - dh + 1, '#987654', 7, dh - 1)
  px(cx + 1, wy + wallH - dh / 2, K.win, 1, 1)
  // 창: 문을 가운데 두고 대칭
  // 문과 벽 끝 사이 가운데 (문을 가운데 두고 대칭)
  const mid = Math.round((cx - 4 - x) / 2)
  const spots = windows === 2 ? [x + mid - 3, x + w - mid - 4] : []
  for (const wx of spots) {
    const wy2 = wy + wallH - dh + 1
    px(wx, wy2, '#ae9068', 7, 7)
    px(wx + 1, wy2 + 1, K.win, 5, 5)
    px(wx + 1, wy2 + 1, K.win2, 2, 2)
    px(wx + 3, wy2 + 1, '#ae9068', 1, 5)
    px(wx, wy2 + 7, '#ad845d', 7, 1)
    px(wx + 1, wy2 + 6, K.flower, 2, 1)
    px(wx + 4, wy2 + 6, K.cloud, 2, 1)
  }
}

function tree(px: Px, x: number, y: number, r: number) {
  px(x - r + 1, y + r - 1, 'rgba(90,80,50,0.18)', r * 2 - 2, 2)
  px(x - 1, y + r - 5, K.trunk, 3, 6)
  for (let dy = -r; dy <= r - 3; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const d = (dx * dx) / (r * r) + ((dy + 1) * (dy + 1)) / ((r - 1) * (r - 1))
      if (d > 1) continue
      const c = dy > r / 3 || dx > r / 2 ? K.leaf2 : dx < -r / 3 && dy < 0 ? K.leaf3 : K.leaf
      px(x + dx, y + dy, c)
    }
}

function drawStatic(g: CanvasRenderingContext2D) {
  const px: Px = (x, y, c, w = 1, h = 1) => {
    g.fillStyle = c
    g.fillRect(Math.round(x), Math.round(y), w, h)
  }
  const rand = seeded(27)

  // 해
  for (let dy = -9; dy <= 9; dy++)
    for (let dx = -9; dx <= 9; dx++) if (dx * dx + dy * dy <= 81) px(134 + dx, 24 + dy, dx * dx + dy * dy <= 30 ? K.sun2 : K.sun)

  // 섬: 풀밭 윗면, 층진 절벽
  const island = (y: number) => {
    // 줄마다 섬의 좌우 끝 (둥근 모서리)
    const top = 74
    const bottom = 150
    if (y < top || y > bottom) return null
    const t = (y - top) / (bottom - top)
    const inset = t < 0.12 ? (0.12 - t) * 90 : t > 0.8 ? (t - 0.8) * 110 : 0
    return [6 + inset, 154 - inset]
  }
  for (let y = 70; y <= 162; y++) {
    const e = island(Math.min(y, 150))
    if (!e) continue
    const [l, r] = e
    if (y <= 150) px(l, y, y > 144 ? K.grass2 : K.grass, r - l, 1)
    else {
      // 절벽: 두 층
      const s = y < 156 ? 0 : 6
      px(l + 4 + s, y, y < 156 ? K.cliff : K.cliff2, r - l - 8 - s * 2, 1)
    }
  }
  for (let i = 0; i < 90; i++) {
    const y = 78 + Math.floor(rand() * 68)
    const e = island(y)
    if (e) px(e[0] + 2 + rand() * (e[1] - e[0] - 4), y, rand() < 0.5 ? K.grass2 : K.grass3)
  }

  // 개울과 나무다리, 모래길
  for (let y = 118; y < 126; y++) {
    const e = island(y)!
    px(e[0] + 1, y, K.water, e[1] - e[0] - 2, 1)
  }
  for (let i = 0; i < 10; i++) px(12 + rand() * 136, 119 + Math.floor(rand() * 6), K.water2, 4, 1)
  px(74, 96, K.path, 13, 22)
  px(74, 126, K.path, 13, 26)
  px(73, 96, K.path2, 1, 56)
  px(87, 96, K.path2, 1, 56)
  px(70, 116, K.wood2, 21, 12) // 다리
  for (let x = 71; x < 90; x += 3) px(x, 117, K.wood, 2, 10)
  px(70, 116, K.line, 21, 1)
  px(70, 127, K.line, 21, 1)

  // 꽃 (집·나무보다 먼저 — 집 위에 찍히지 않게)
  for (let i = 0; i < 14; i++) {
    const x = 20 + rand() * 120
    const y = 100 + rand() * 44
    if (y > 115 && y < 128) continue
    if (x > 68 && x < 92) continue
    px(x, y, rand() < 0.5 ? K.flower : K.cloud, 2, 2)
  }

  // 서고: 가운데, 초록 지붕 (게임 안 서고와 같은 색)
  house(px, 48, 50, 64, 22, 26, [K.roofG, K.roofG2, K.roofG3], K.wall)

  // 왼쪽 오두막, 오른쪽 앞 오두막
  house(px, 12, 66, 32, 16, 20, [K.roofT, K.roofT2, K.roofT3], K.wall2)
  house(px, 116, 80, 32, 16, 20, [K.roofO, K.roofT2, K.roofT3], K.peach)

  // 나무와 꽃, 이정표
  tree(px, 10, 102, 7)
  tree(px, 150, 84, 7)
  tree(px, 46, 136, 7)
  tree(px, 112, 138, 6)
  tree(px, 128, 74, 5)
  px(60, 100, K.wood2, 2, 12)
  px(54, 99, K.wood, 14, 6)
  px(54, 99, K.wood2, 14, 1)
  px(56, 101, K.wood2, 8, 1)
}

export function TitleScene({ avatar }: { avatar?: Avatar | null }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const g = canvas?.getContext('2d')
    if (!canvas || !g) return
    const base = document.createElement('canvas')
    base.width = SCENE_W
    base.height = SCENE_H
    const bg = base.getContext('2d')
    if (!bg) return
    drawStatic(bg)

    const who = withLookDefaults(avatar ?? { look: 'f', name: '' })
    const hero = spriteRows('writer', 'down', { frame: 0, blink: false, avatar: who })
    const heroPal = writerPalette('spring', who)
    const friend = spriteRows('baker', 'down', { frame: 0, blink: false })
    const sprite = (rows: string[], pal: Record<string, string>, x: number, y: number) =>
      rows.forEach((row, yy) =>
        [...row].forEach((ch, xx) => {
          const c = pal[ch]
          if (ch === '.' || !c) return
          g.fillStyle = c
          g.fillRect(x + xx, y + yy, 1, 1)
        }),
      )
    const clouds = [
      { x: 10, y: 18, w: 22 },
      { x: 70, y: 10, w: 16 },
      { x: 100, y: 40, w: 12 },
    ]

    let raf = 0
    const t0 = performance.now()
    const loop = (now: number) => {
      const t = (now - t0) / 1000
      g.clearRect(0, 0, SCENE_W, SCENE_H)
      // 구름 (섬 뒤로 천천히)
      for (const c of clouds) {
        const x = Math.round(((c.x + t * 2) % (SCENE_W + 40)) - 20)
        g.fillStyle = K.cloud2
        g.fillRect(x, c.y + 3, c.w, 3)
        g.fillStyle = K.cloud
        g.fillRect(x + 2, c.y, c.w - 4, 4)
        g.fillRect(x + 5, c.y - 2, c.w / 2, 2)
      }
      g.drawImage(base, 0, 0)
      // 굴뚝 연기
      for (const [cx, cy] of [
        [36, 60],
        [140, 74],
      ]) {
        for (let i = 0; i < 3; i++) {
          const k = (t * 0.5 + i / 3) % 1
          g.fillStyle = `rgba(254,253,248,${0.8 * (1 - k)})`
          const s = 2 + Math.round(k * 2)
          g.fillRect(Math.round(cx + Math.sin(k * 4 + i) * 2), Math.round(cy - k * 14), s, s)
        }
      }
      // 물 반짝임
      g.fillStyle = K.water2
      for (let i = 0; i < 4; i++) {
        const x = Math.round((20 + i * 37 + t * 6) % 140) + 10
        if (x > 68 && x < 92) continue
        g.fillRect(x, 120 + (i % 3) * 2, 3, 1)
      }
      // 주인공과 이웃 (숨 쉬듯 한 칸)
      const bob = Math.sin(t * 2) > 0.6 ? 1 : 0
      sprite(hero, heroPal, 76, 132 - bob)
      sprite(friend, PALETTE, 96, 104 + (Math.sin(t * 2 + 1) > 0.6 ? 1 : 0))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [avatar])
  return <canvas ref={ref} className="title-scene" width={SCENE_W} height={SCENE_H} aria-hidden="true" />
}

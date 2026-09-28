// 시작 화면: 해질녘 언덕 위 마을 서고 문 앞. 창 안의 책장, 흔들리는 등불, 반짝이는 별.
// 코드로 그린 도트 (160×240). 제목은 문 위 돌간판 자리에 HTML로 얹는다 (Intro.tsx).
import { useEffect, useRef } from 'react'
import { withLookDefaults, type Avatar } from '../../engine/avatar'
import { spriteRows, writerPalette } from '../../render/sprites'

export const SCENE_W = 160
export const SCENE_H = 240

/** 돌간판 자리 (Intro에서 제목을 얹는 곳, 그림 좌표) */
export const PLAQUE = { x: 20, y: 74, w: 120, h: 34 }

/** 같은 그림이 매번 나오게 하는 작은 난수 */
function seeded(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

const SKY = ['#2b2748', '#3a3058', '#533a66', '#74456d', '#9c516c', '#c4636a', '#e07f62', '#eea164', '#f5c27a']
const SPINES = ['#8e3f30', '#3f5a7a', '#5a7a3f', '#c9a15a', '#7a4a6b', '#b4533f', '#4f7896', '#e0c878']

function drawStatic(g: CanvasRenderingContext2D) {
  const rand = seeded(27)
  const px = (x: number, y: number, c: string, w = 1, h = 1) => {
    g.fillStyle = c
    g.fillRect(x, y, w, h)
  }

  // 하늘: 띠마다 경계를 도트로 섞는다
  const band = 17
  SKY.forEach((c, i) => px(0, i * band, c, SCENE_W, band))
  for (let i = 1; i < SKY.length; i++)
    for (let x = 0; x < SCENE_W; x++) if ((x + i) % 2 === 0) px(x, i * band - 1, SKY[i - 1])

  // 먼 언덕 두 겹
  for (let x = 0; x < SCENE_W; x++) {
    const far = 138 + Math.round(6 * Math.sin(x / 19) + 3 * Math.sin(x / 7))
    px(x, far, '#7a4f6e', 1, SCENE_H - far)
    const near = 154 + Math.round(5 * Math.sin(x / 23 + 2) + 2 * Math.sin(x / 9))
    px(x, near, '#5a3f5c', 1, SCENE_H - near)
  }

  // 서고가 선 언덕 꼭대기 (풀밭)
  for (let x = 0; x < SCENE_W; x++) {
    const top = 170 + Math.round(3 * Math.sin(x / 15))
    px(x, top, '#6f7a3f', 1, SCENE_H - top)
    px(x, top, '#8d9a52')
  }
  for (let i = 0; i < 160; i++) px(Math.floor(rand() * SCENE_W), 174 + Math.floor(rand() * 66), rand() < 0.5 ? '#5f6a35' : '#7f8a4a')
  // 문 앞 모래길
  for (let y = 186; y < SCENE_H; y++) {
    const half = 10 + Math.floor((y - 186) * 0.45)
    px(80 - half, y, '#d8b98a', half * 2, 1)
    px(80 - half, y, '#bf9f6f')
    px(80 + half - 1, y, '#bf9f6f')
  }
  for (let i = 0; i < 40; i++) {
    const y = 188 + Math.floor(rand() * 50)
    const half = 8 + Math.floor((y - 186) * 0.45)
    px(80 - half + Math.floor(rand() * half * 2), y, '#c9a878')
  }

  // 서고: 사암 벽과 돌 줄눈
  const L = 12
  const R = 148
  px(L, 76, '#d8c29a', R - L, 108)
  for (let y = 80; y < 184; y += 6) {
    px(L, y, '#c2aa80', R - L, 1)
    const off = (y / 6) % 2 ? 0 : 7
    for (let x = L + off; x < R; x += 14) px(x, y - 5, '#c2aa80', 1, 5)
  }
  px(R - 6, 76, '#bfa67c', 6, 108) // 그늘진 모서리
  // 평평한 지붕과 처마 돌림띠, 성가퀴
  px(L - 4, 70, '#eadbb6', R - L + 8, 6)
  px(L - 4, 76, '#9c845e', R - L + 8, 2)
  for (let x = L - 4; x < R + 4; x += 10) px(x, 63, '#e2d1aa', 6, 7)
  px(L - 4, 63, '#f4e8c8', R - L + 8, 1)

  // 돌간판 (제목은 HTML로 얹는다)
  const P = PLAQUE
  px(P.x - 2, P.y - 2, '#8f7652', P.w + 4, P.h + 4)
  px(P.x, P.y, '#cdb489', P.w, P.h)
  px(P.x, P.y, '#e3cfa6', P.w, 1)
  px(P.x, P.y + P.h - 1, '#a88f67', P.w, 1)

  // 창 두 개: 둥근 윗부분, 안에 불 켜진 책장
  const windowAt = (x0: number) => {
    const w = 28
    const y0 = 120
    const y1 = 162
    const cx = x0 + w / 2
    const inside = (x: number, y: number) => y >= y0 + 10 || (x - cx) ** 2 + (y - (y0 + 10)) ** 2 <= 14 * 14
    for (let y = y0 - 5; y <= y1 + 2; y++)
      for (let x = x0 - 3; x <= x0 + w + 2; x++) {
        const inWide = y >= y0 + 10 ? x >= x0 - 3 && x <= x0 + w + 2 : (x - cx) ** 2 + (y - (y0 + 10)) ** 2 <= 17 * 17
        if (inWide && !inside(x, y) && y <= y1 + 2) px(x, y, '#a88f67')
      }
    for (let y = y0 - 4; y <= y1; y++)
      for (let x = x0; x < x0 + w; x++) if (inside(x, y)) px(x, y, '#f5c56a')
    // 선반과 책등
    for (let sy = y0 + 4; sy < y1; sy += 10) {
      for (let x = x0; x < x0 + w; x++) if (inside(x, sy + 8)) px(x, sy + 8, '#6e4329')
      let x = x0 + 1
      while (x < x0 + w - 1) {
        const bw = 2 + Math.floor(rand() * 2)
        const bh = 5 + Math.floor(rand() * 3)
        const c = SPINES[Math.floor(rand() * SPINES.length)]
        for (let bx = x; bx < Math.min(x + bw, x0 + w - 1); bx++)
          for (let by = sy + 8 - bh; by < sy + 8; by++) if (inside(bx, by)) px(bx, by, c)
        x += bw + (rand() < 0.2 ? 1 : 0)
      }
    }
    // 창살
    px(cx, y0 - 4, '#5e3e2a', 1, y1 - y0 + 5)
    px(x0, y0 + 20, '#5e3e2a', w, 1)
    px(x0 - 3, y1 + 1, '#e3cfa6', w + 6, 2) // 창턱
  }
  windowAt(24)
  windowAt(108)

  // 문: 둥근 윗부분의 두 짝 나무문, 가운데 틈으로 불빛
  const dx0 = 66
  const dw = 28
  const dy0 = 124
  const dcx = dx0 + dw / 2
  for (let y = dy0 - 18; y < 184; y++)
    for (let x = dx0 - 4; x < dx0 + dw + 4; x++) {
      const inFrame = y >= dy0 || (x - dcx) ** 2 + (y - dy0) ** 2 <= 18 * 18
      const inDoor = y >= dy0 || (x - dcx) ** 2 + (y - dy0) ** 2 <= 14 * 14
      if (inFrame && !(inDoor && x >= dx0 && x < dx0 + dw)) px(x, y, '#b09670')
      else if (inDoor) px(x, y, (x - dx0) % 5 === 0 ? '#4e3322' : '#6b4a30')
    }
  px(dcx - 1, dy0 - 14, '#f5c56a', 2, 184 - dy0 + 14) // 문틈 불빛
  for (const [x, y] of [[dcx - 5, 156], [dcx + 4, 156]]) px(x, y, '#c9a15a', 2, 2) // 문고리
  for (let y = dy0 + 2; y < 182; y += 12) for (const x of [dx0 + 2, dx0 + dw - 3]) px(x, y, '#3b2a20') // 쇠못

  // 돌계단
  px(58, 184, '#cdb489', 44, 3)
  px(54, 187, '#bfa67c', 52, 3)
  px(58, 184, '#e3cfa6', 44, 1)

  // 양옆 올리브나무
  const olive = (cx: number, base: number) => {
    px(cx - 1, base - 18, '#5a4a3a', 3, 18)
    px(cx + 2, base - 12, '#5a4a3a', 3, 2)
    // 잎 덩어리: 어두운 바탕 → 중간 → 햇빛 받은 윗잎 순서로 겹친다
    const blob = (n: number, spread: number, dy: number, colors: string[]) => {
      for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2
        const r = Math.sqrt(rand()) * spread
        const x = Math.round(cx + Math.cos(a) * r * 1.3)
        const y = Math.round(base - 28 + dy + Math.sin(a) * r * 0.75)
        px(x, y, colors[Math.floor(rand() * colors.length)], 2, 2)
      }
    }
    blob(160, 15, 2, ['#4a552c', '#566234'])
    blob(120, 13, 0, ['#6f7d48', '#7d8a55'])
    blob(50, 10, -3, ['#95a26a', '#aab47a'])
  }
  olive(6, 184)
  olive(154, 186)
}

type Star = { x: number; y: number; phase: number }

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

    const rand = seeded(9)
    const stars: Star[] = Array.from({ length: 26 }, () => ({ x: Math.floor(rand() * SCENE_W), y: Math.floor(rand() * 58), phase: rand() * 6 }))
    const motes = Array.from({ length: 7 }, () => ({ x: 20 + rand() * 120, y: 170 + rand() * 50, phase: rand() * 6 }))

    // 문 앞에 선 주인공의 뒷모습 (저장이 없으면 기본 모습)
    const who = withLookDefaults(avatar ?? { look: 'f', name: '' })
    const rows = spriteRows('writer', 'up', { frame: 0, blink: false, avatar: who })
    const pal = writerPalette('spring', who)

    let raf = 0
    const t0 = performance.now()
    const loop = (now: number) => {
      const t = (now - t0) / 1000
      g.drawImage(base, 0, 0)
      for (const s of stars) {
        const b = Math.sin(t * 1.7 + s.phase)
        if (b > -0.3) {
          g.fillStyle = b > 0.6 ? '#fff6d8' : '#c9bfe0'
          g.fillRect(s.x, s.y, 1, 1)
        }
      }
      // 등불: 문 양옆에서 흔들리는 빛
      for (const lx of [59, 100]) {
        const f = 0.5 + 0.5 * Math.sin(t * 9 + lx) * Math.sin(t * 4.3)
        g.fillStyle = `rgba(255, 200, 110, ${0.12 + f * 0.1})`
        g.fillRect(lx - 5, 126, 11, 12)
        g.fillStyle = '#3b2a20'
        g.fillRect(lx - 1, 128, 3, 1)
        g.fillStyle = f > 0.5 ? '#ffe3a0' : '#f5b85a'
        g.fillRect(lx - 1, 129, 3, 4)
        g.fillStyle = '#3b2a20'
        g.fillRect(lx - 1, 133, 3, 1)
      }
      // 창빛이 아주 조금 일렁인다
      g.fillStyle = `rgba(255, 170, 80, ${0.05 + 0.04 * Math.sin(t * 2.3)})`
      g.fillRect(24, 116, 28, 46)
      g.fillRect(108, 116, 28, 46)
      // 풀밭 위로 떠다니는 반딧불
      for (const m of motes) {
        const x = Math.round(m.x + Math.sin(t * 0.6 + m.phase) * 6)
        const y = Math.round(m.y + Math.cos(t * 0.8 + m.phase) * 3)
        if (Math.sin(t * 2 + m.phase * 3) > -0.2) {
          g.fillStyle = '#f7e27a'
          g.fillRect(x, y, 1, 1)
        }
      }
      // 주인공 (숨 쉬듯 한 칸 오르내림)
      const bob = Math.sin(t * 2) > 0.7 ? 1 : 0
      rows.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          const col = pal[ch]
          if (ch === '.' || !col) return
          g.fillStyle = col
          g.fillRect(75 + x, 196 + y + bob, 1, 1)
        }),
      )
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [avatar])
  return <canvas ref={ref} className="title-scene" width={SCENE_W} height={SCENE_H} aria-hidden="true" />
}

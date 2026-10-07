// 새 터 꾸미기 소재 (assets/background-materials-simple.png, 2026-10-07 사용자 확정)를 도트 줄로 옮긴다.
// 시트는 확대된 도트(타일 한 칸 ≈ 195px = 16화소)라 칸 가운데 3×3을 평균해 한 화소로, 비슷한 색은 하나로 묶는다.
// 실행: node scripts/export-bg-materials.mjs → src/render/bg-materials-art.ts
import { writeFileSync } from 'node:fs'
import { readPng } from './png-read.mjs'

const img = readPng(new URL('../assets/background-materials-simple.png', import.meta.url))
const S = 195 / 16

/** 대강의 자리 (시트 화소) — 안에서 흰 바탕을 잘라 낸다. 타일은 정확한 사각형이라 그대로 16×16 */
const ITEMS = {
  treeBig: { box: [190, 95, 440, 375] },
  treeTall: { box: [565, 90, 740, 375] },
  treeSmall: { box: [900, 210, 1035, 380] },
  bush: { box: [150, 425, 325, 565] },
  grassTuft: { box: [440, 450, 550, 560] },
  flower: { box: [705, 440, 795, 560] },
  rocks: { box: [955, 470, 1080, 565] },
  grass: { tile: [118, 628] },
  sand: { tile: [393, 628] },
  stone: { tile: [666, 628] },
  soil: { tile: [941, 628] },
}

const isWhite = (c) => c[0] > 232 && c[1] > 232 && c[2] > 232
function avg(x, y) {
  let r = 0, g = 0, b = 0, n = 0
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) {
      const c = img.px(Math.min(img.w - 1, Math.max(0, Math.round(x) + i)), Math.min(img.h - 1, Math.max(0, Math.round(y) + j)))
      r += c[0]; g += c[1]; b += c[2]; n++
    }
  return [r / n, g / n, b / n]
}
function trim([x0, y0, x1, y1]) {
  let a = x1, b = y1, c = x0, d = y0
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (!isWhite(img.px(x, y))) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y) }
  return [a, b, c, d]
}

// 1) 화소 뽑기
const raw = {}
for (const [id, it] of Object.entries(ITEMS)) {
  let x0, y0, w, h
  if (it.tile) { [x0, y0] = it.tile; w = 16; h = 16 }
  else {
    const [a, b, c, d] = trim(it.box)
    x0 = a; y0 = b
    w = Math.max(1, Math.round((c - a + 1) / S)); h = Math.max(1, Math.round((d - b + 1) / S))
  }
  const sx = it.tile ? S : (ITEMS[id].box ? (trim(it.box)[2] - x0 + 1) / w : S)
  const sy = it.tile ? S : (trim(it.box)[3] - y0 + 1) / h
  const rows = []
  for (let j = 0; j < h; j++) {
    const row = []
    for (let i = 0; i < w; i++) {
      const c = avg(x0 + (i + 0.5) * sx, y0 + (j + 0.5) * sy)
      // 흰 바탕과 그 언저리(밝고 색이 거의 없는 점)는 비운다 — 꽃 가운데 크림색은 남는다
      const pale = Math.min(...c) > 205 && Math.max(...c) - Math.min(...c) < 16
      row.push(!it.tile && (isWhite(c) || pale) ? null : c)
    }
    rows.push(row)
  }
  raw[id] = rows
}

// 2) 비슷한 색 묶기 (모든 소재가 한 팔레트)
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const clusters = []
for (const rows of Object.values(raw))
  for (const row of rows)
    for (const c of row) {
      if (!c) continue
      const k = clusters.find((q) => dist(q.sum.map((v) => v / q.n), c) < 22)
      if (k) { k.sum = k.sum.map((v, i) => v + c[i]); k.n++ }
      else clusters.push({ sum: [...c], n: 1 })
    }
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const pal = clusters.map((q) => q.sum.map((v) => Math.round(v / q.n)))
if (pal.length > CHARS.length) throw new Error(`색이 너무 많다 ${pal.length}`)
const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
const charOf = (c) => {
  let best = 0
  pal.forEach((p, i) => { if (dist(p, c) < dist(pal[best], c)) best = i })
  return CHARS[best]
}

const art = {}
for (const [id, rows] of Object.entries(raw)) art[id] = rows.map((row) => row.map((c) => (c ? charOf(c) : '.')).join(''))

const out = `// 자동 생성 (scripts/export-bg-materials.mjs) — 손으로 고치지 않는다.
// 새 터 꾸미기 소재: assets/background-materials-simple.png (2026-10-07 사용자 확정). 기본 길·지형 교체용이 아니라 유저가 놓는 꾸미기만.
export const BG_PALETTE: Record<string, string> = ${JSON.stringify(Object.fromEntries(pal.map((p, i) => [CHARS[i], hex(p)])), null, 2)}

export const BG_ART: Record<string, string[]> = ${JSON.stringify(art, null, 2)}
`
writeFileSync(new URL('../src/render/bg-materials-art.ts', import.meta.url), out)
console.log('colors', pal.length, Object.entries(art).map(([k, r]) => `${k} ${r[0].length}x${r.length}`).join(', '))

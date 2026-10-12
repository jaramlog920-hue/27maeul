import './pixel-ts-loader.mjs'
import fs from 'node:fs'
import assert from 'node:assert/strict'
import { png, draw } from './pixel-png.mjs'
const { COZY_FURNITURE_ART, COZY_FURNITURE_NAMES } = await import('../src/render/cozy-furniture-art.ts')
const { HOME_SPACE_ART } = await import('../src/render/home-space-art.ts')
const { FURNI_PALETTE } = await import('../src/render/furniture-art.ts')
const root = 'assets/furniture/cozy-additions'
fs.mkdirSync(root, { recursive: true })
const palette = { ...FURNI_PALETTE, z: '#d1c4ae' }
const entries = Object.entries(COZY_FURNITURE_ART)
assert.equal(entries.length, 8)
const cellW = 40, cellH = 24, columns = 4, scale = 8
const width = cellW * columns, height = cellH * 2
const atlas = new Uint8Array(width * height * 4)
const preview = new Uint8Array(width * height * scale * scale * 4)
for (let i = 0; i < preview.length; i += 4) preview.set([245, 240, 222, 255], i)
function paint(target, width, art, x = 0, y = 0, scale = 1, alpha = false) {
  draw(target, width, art.rows, palette, x, y, scale)
  if (alpha) art.rows.forEach((row, ry) => [...row].forEach((c, rx) => {
    if (c === 'z') target.set([90, 70, 50, 56], ((y + ry) * width + x + rx) * 4)
  }))
}
const items = entries.map(([id, art], index) => {
  assert.equal(art.rows.length, art.h * 16)
  for (const row of art.rows) {
    assert.equal(row.length, art.w * 16)
    for (const c of row) assert.ok(c === '.' || Object.hasOwn(FURNI_PALETTE, c), `${id}: ${c}`)
  }
  const w = art.w * 16, h = art.h * 16
  const rgba = new Uint8Array(w * h * 4)
  paint(rgba, w, art, 0, 0, 1, true)
  png(`${root}/${id}.png`, w, h, rgba)
  const x = index % columns * cellW + Math.floor((cellW - w) / 2)
  const y = Math.floor(index / columns) * cellH + cellH - h - 4
  paint(atlas, width, art, x, y, 1, true)
  paint(preview, width * scale, art, x * scale, y * scale, scale)
  return { id, name: COZY_FURNITURE_NAMES[id], file: `${id}.png`, width: w, height: h, x, y, footprint: { w: art.w, h: art.h } }
})
png(`${root}/atlas.png`, width, height, atlas)
png(`${root}/preview-8x.png`, width * scale, height * scale, preview)
const comparison = new Uint8Array(width * scale * cellH * 3 * scale * 4)
for (let i = 0; i < comparison.length; i += 4) comparison.set([245, 240, 222, 255], i)
;['chair', 'nightstand', 'cupboard', 'bookcase'].forEach((id, i) => {
  const art = HOME_SPACE_ART[id]
  paint(comparison, width * scale, art, (i * cellW + (cellW - art.w * 16) / 2) * scale, 4 * scale, scale)
})
entries.forEach(([id, art], i) => {
  paint(comparison, width * scale, art, (i % columns * cellW + (cellW - art.w * 16) / 2) * scale, (cellH + Math.floor(i / columns) * cellH + 4) * scale, scale)
})
png(`${root}/comparison-8x.png`, width * scale, cellH * 3 * scale, comparison)
fs.writeFileSync(`${root}/manifest.json`, JSON.stringify({ tileSize: 16, source: 'src/render/cozy-furniture-art.ts', status: 'native pixel assets; item acquisition and placement not yet connected', columns, cellWidth: cellW, cellHeight: cellH, items }, null, 2))
fs.writeFileSync(`${root}/README.md`, '# 생활 가구 도트 8종\n\n기존 HOME_SPACE_ART와 같은 16픽셀 단위, FURNI_PALETTE, 정수 좌표로 직접 제작. 생성 이미지 사용 없음.\n\n미리보기 순서: 흔들의자 / 세면대 / 찻잔 수레 / 꽃무늬 병풍 / 약초 건조대 / 빵 보관장 / 전신거울 / 작은 인형집. comparison-8x.png의 첫 줄은 기존 가구, 나머지 두 줄은 새 가구.\n\n개별 PNG와 atlas는 투명 배경 원본. 확대 미리보기는 nearest-neighbor 8배. 병풍과 건조대는 32×16px, 나머지는 16×16px. 현재 앞모습 자산이며 게임 아이템 지급·구매·배치에는 연결하지 않음.\n\n재생성: node scripts/export-cozy-furniture.mjs\n')
console.log(`Validated and exported ${items.length} native pixel furniture assets to ${root}`)

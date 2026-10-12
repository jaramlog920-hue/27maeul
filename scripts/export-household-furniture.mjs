import './pixel-ts-loader.mjs'
import fs from 'node:fs'
import assert from 'node:assert/strict'
import { png, draw } from './pixel-png.mjs'
import { readPng } from './png-read.mjs'
const { HOUSEHOLD_FURNITURE_ART, HOUSEHOLD_FURNITURE_NAMES } = await import('../src/render/household-furniture-art.ts')
const { HOME_SPACE_ART } = await import('../src/render/home-space-art.ts')
const { FURNI_PALETTE } = await import('../src/render/furniture-art.ts')
const root = 'assets/furniture/household-additions'
fs.mkdirSync(root, { recursive: true })
const palette = { ...FURNI_PALETTE, z: '#d1c4ae' }
const entries = Object.entries(HOUSEHOLD_FURNITURE_ART)
assert.equal(entries.length, 10)
const columns = 5, cellWidth = 40, cellHeight = 24, scale = 8
const width = columns * cellWidth, height = 2 * cellHeight
function buffer(w, h, background = false) {
  const data = new Uint8Array(w * h * 4)
  if (background) for (let i = 0; i < data.length; i += 4) data.set([245, 240, 222, 255], i)
  return data
}
function paint(data, width, art, x = 0, y = 0, scale = 1, transparent = false) {
  draw(data, width, art.rows, palette, x, y, scale)
  if (transparent) art.rows.forEach((row, ry) => [...row].forEach((c, rx) => {
    if (c === 'z') data.set([90, 70, 50, 56], ((y + ry) * width + x + rx) * 4)
  }))
}
const atlas = buffer(width, height)
const preview = buffer(width * scale, height * scale, true)
const comparison = buffer(width * scale, cellHeight * 3 * scale, true)
const items = entries.map(([id, art], i) => {
  const w = art.w * 16, h = art.h * 16
  assert.equal(art.rows.length, h)
  for (const row of art.rows) {
    assert.equal(row.length, w)
    for (const c of row) assert.ok(c === '.' || Object.hasOwn(FURNI_PALETTE, c), `${id}: ${c}`)
  }
  const rgba = buffer(w, h)
  paint(rgba, w, art, 0, 0, 1, true)
  const file = `${id}.png`
  png(`${root}/${file}`, w, h, rgba)
  const decoded = readPng(`${root}/${file}`)
  assert.equal(decoded.w, w)
  assert.equal(decoded.h, h)
  art.rows.forEach((row, y) => [...row].forEach((c, x) => {
    assert.equal(decoded.px(x, y)[3], c === '.' ? 0 : c === 'z' ? 56 : 255, `${id}: alpha at ${x},${y}`)
  }))
  const x = i % columns * cellWidth + (cellWidth - w) / 2
  const y = Math.floor(i / columns) * cellHeight + cellHeight - h - 4
  paint(atlas, width, art, x, y, 1, true)
  paint(preview, width * scale, art, x * scale, y * scale, scale)
  paint(comparison, width * scale, art, x * scale, (y + cellHeight) * scale, scale)
  return { id, name: HOUSEHOLD_FURNITURE_NAMES[id], file, width: w, height: h, x, y, footprint: { w: art.w, h: art.h } }
})
;['table', 'basket', 'cupboard', 'bookcase', 'nightstand'].forEach((id, i) => {
  const art = HOME_SPACE_ART[id]
  paint(comparison, width * scale, art, (i * cellWidth + (cellWidth - art.w * 16) / 2) * scale, 4 * scale, scale)
})
png(`${root}/atlas.png`, width, height, atlas)
png(`${root}/preview-8x.png`, width * scale, height * scale, preview)
png(`${root}/comparison-8x.png`, width * scale, cellHeight * 3 * scale, comparison)
fs.writeFileSync(`${root}/manifest.json`, JSON.stringify({ tileSize: 16, source: 'src/render/household-furniture-art.ts', status: 'native pixel assets; acquisition and placement not connected', columns, cellWidth, cellHeight, items }, null, 2))
fs.writeFileSync(`${root}/README.md`, `# 생활 가구 도트 10종\n\n기존 HOME_SPACE_ART의 16픽셀 단위·FURNI_PALETTE·바닥 정렬에 맞춰 정수 좌표로 직접 제작.\n\n미리보기는 왼쪽에서 오른쪽, 위에서 아래 순서:\n\n${items.map((item, i) => `${i + 1}. ${item.name} — ${item.file} (${item.width}×${item.height}px)`).join('\n')}\n\n개별 PNG와 atlas는 투명 원본. preview-8x.png는 최근접 이웃 확대. comparison-8x.png는 첫 줄에 기존 가구 5종, 아래 두 줄에 새 가구 10종.\n\n현재 앞모습 도트 자산이며 게임 아이템 지급·구매·배치에는 연결하지 않음.\n\n원본: src/render/household-furniture-art.ts\n\n재생성: node scripts/export-household-furniture.mjs\n`)
console.log(`Validated palette, dimensions and PNG decoding; exported ${items.length} furniture assets to ${root}`)

import './pixel-ts-loader.mjs'
import fs from 'node:fs'
import assert from 'node:assert/strict'
import { png, draw } from './pixel-png.mjs'
import { readPng } from './png-read.mjs'
const { ROOM_FURNITURE_ART, ROOM_FURNITURE_NAMES, ROOM_FURNITURE_SMALL, ROOM_FURNITURE_WALL } = await import('../src/render/room-furniture-art.ts')
const { COZY_FURNITURE_ART, COZY_FURNITURE_NAMES } = await import('../src/render/cozy-furniture-art.ts')
const { HOUSEHOLD_FURNITURE_ART, HOUSEHOLD_FURNITURE_NAMES } = await import('../src/render/household-furniture-art.ts')
const { HOME_SPACE_ART } = await import('../src/render/home-space-art.ts')
const { REMAINING_FURNITURE_ART } = await import('../src/render/remaining-furniture-art.ts')
const { FURNI_PALETTE } = await import('../src/render/furniture-art.ts')
const { spriteRows, writerPalette } = await import('../src/render/sprites.ts')
const root = 'assets/furniture/room-additions'
fs.mkdirSync(root, { recursive: true })
const palette = { ...FURNI_PALETTE, z: '#d1c4ae' }
const character = spriteRows('writer', 'down', { frame: 0, blink: false, season: 'spring' })
const small = new Set(['spoolStand', ...ROOM_FURNITURE_SMALL])
const all = [
  ...Object.entries(COZY_FURNITURE_ART).map(([id, art]) => ({ id, art, name: COZY_FURNITURE_NAMES[id], group: 'cozy-additions' })),
  ...Object.entries(HOUSEHOLD_FURNITURE_ART).map(([id, art]) => ({ id, art, name: HOUSEHOLD_FURNITURE_NAMES[id], group: 'household-additions' })),
  ...Object.entries(ROOM_FURNITURE_ART).map(([id, art]) => ({ id, art, name: ROOM_FURNITURE_NAMES[id], group: 'room-additions' })),
]
assert.equal(all.length, 48)
assert.equal(new Set(all.map(a => a.id)).size, 48)
function make(w, h, bg = false) {
  const data = new Uint8Array(w * h * 4)
  if (bg) for (let i = 0; i < data.length; i += 4) data.set([245,240,222,255], i)
  return data
}
function paint(data, width, art, x = 0, y = 0, scale = 1, alpha = false) {
  draw(data, width, art.rows, palette, x, y, scale)
  if (alpha) art.rows.forEach((row, ry) => [...row].forEach((c, rx) => {
    if (c === 'z') data.set([90,70,50,56], ((y + ry) * width + x + rx) * 4)
  }))
}
function bounds(art) {
  const points = art.rows.flatMap((row,y) => [...row].flatMap((c,x) => c !== '.' && c !== 'z' ? [[x,y]] : []))
  assert.ok(points.length)
  const xs = points.map(p => p[0]), ys = points.map(p => p[1])
  const left = Math.min(...xs), top = Math.min(...ys), right = Math.max(...xs), bottom = Math.max(...ys)
  return { left, top, right, bottom, width: right-left+1, height: bottom-top+1 }
}
function validate(id, art) {
  assert.equal(art.rows.length, art.h * 16, id)
  art.rows.forEach(row => {
    assert.equal(row.length, art.w * 16, id)
    for (const c of row) assert.ok(c === '.' || Object.hasOwn(FURNI_PALETTE,c), `${id}: ${c}`)
  })
  const b = bounds(art)
  assert.ok(b.left >= 0 && b.right < art.w * 16 && b.top >= 0 && b.bottom < art.h * 16)
  if (small.has(id)) assert.ok(b.width <= 12 && b.height <= 10, `${id}: surface prop too large`)
  return b
}
// 기존 게임에 실제로 쓰이는 도트도 캔버스·팔레트·윤곽 범위를 함께 검사한다.
const baseline = Object.entries({ ...HOME_SPACE_ART, ...REMAINING_FURNITURE_ART }).map(([id,art]) => ({ id, width:art.w*16, height:art.h*16, visible:validate(id,art) }))
const columns = 6, cellWidth = 40, cellHeight = 24, scale = 6
const width = columns * cellWidth, height = 5 * cellHeight
const atlas = make(width, height), preview = make(width*scale, height*scale, true)
const newItems = all.filter(a => a.group === 'room-additions')
assert.equal(newItems.length, 30)
const audit = all.map(item => {
  const { id, art, name, group } = item, visible = validate(id,art)
  const w = art.w*16, h = art.h*16
  if (group === 'room-additions') {
    const data = make(w,h)
    paint(data,w,art,0,0,1,true)
    png(`${root}/${id}.png`,w,h,data)
    const i = newItems.findIndex(a => a.id === id)
    const x = i%columns*cellWidth+(cellWidth-w)/2
    const y = Math.floor(i/columns)*cellHeight+cellHeight-h-4
    paint(atlas,width,art,x,y,1,true)
    paint(preview,width*scale,art,x*scale,y*scale,scale)
  }
  const image = readPng(`assets/furniture/${group}/${id}.png`)
  assert.equal(image.w,w,id); assert.equal(image.h,h,id)
  art.rows.forEach((row,y) => [...row].forEach((c,x) => {
    assert.equal(image.px(x,y)[3], c === '.' ? 0 : c === 'z' ? 56 : 255, `${id} alpha ${x},${y}`)
  }))
  return { id, name, group, file:`${id}.png`, width:w, height:h, footprint:{w:art.w,h:art.h}, visible,
    role: small.has(id) ? 'surface-prop' : ROOM_FURNITURE_WALL.has(id) ? 'wall' : 'floor-furniture',
    sizeCheck:'pass' }
})
png(`${root}/atlas.png`,width,height,atlas)
png(`${root}/preview-6x.png`,width*scale,height*scale,preview)
fs.writeFileSync(`${root}/manifest.json`,JSON.stringify({ tileSize:16,source:'src/render/room-furniture-art.ts',status:'native assets; not connected to game acquisition or placement',columns,cellWidth,cellHeight,items:audit.filter(a=>a.group==='room-additions') },null,2))
// 기존 가구 12종과 새 48종, 각 칸에 실제 캐릭터를 같은 배율로 표시한다.
const refs = ['chair','stool','table','nightstand','bookcase','cupboard','daybed','longBench','teapot','basket','pot','hourglass']
const combined = [...refs.map(id=>({id,art:HOME_SPACE_ART[id]??REMAINING_FURNITURE_ART[id]})), ...all]
const reviewCellW=56,reviewCellH=24,reviewScale=4,reviewW=reviewCellW*6,reviewH=Math.ceil(combined.length/6)*reviewCellH
const review = make(reviewW*reviewScale,reviewH*reviewScale,true)
combined.forEach(({art},i)=>{
  const x=i%6*reviewCellW,y=Math.floor(i/6)*reviewCellH
  paint(review,reviewW*reviewScale,art,(x+3)*reviewScale,(y+20-art.h*16)*reviewScale,reviewScale)
  draw(review,reviewW*reviewScale,character,writerPalette('spring'),(x+42)*reviewScale,(y+6)*reviewScale,reviewScale)
})
png(`${root}/size-review-4x.png`,reviewW*reviewScale,reviewH*reviewScale,review)
fs.writeFileSync(`${root}/size-audit.json`,JSON.stringify({ tileSize:16,character:{width:character[0].length,height:character.length},checkedNew:48,checkedBaseline:baseline.length,checks:['unique IDs','palette','integer canvas bounds','decoded PNG dimensions','pixel alpha','surface prop size'],adjustments:[{id:'spoolStand',before:{width:14,height:12},after:audit.find(a=>a.id==='spoolStand').visible,reason:'탁자 위 소품이 의자만큼 크게 보이지 않도록 축소'}],rules:{single:'16×16px canvas; visible furniture normally 10–14px wide',wide:'32×16px canvas; visible furniture normally 24–28px wide',small:'16×16px canvas; visible surface props up to 12×10px',scaling:'nearest-neighbor; sprite and character use the same display scale',future:'Keep tile size at 16; do not stretch individual sprites. Taller furniture needs explicit separate render height and placement footprint.'},baseline,items:audit },null,2))
const esc = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')
fs.writeFileSync(`${root}/preview.html`, `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>가구 도트 48종과 크기 점검</title><style>body{background:#f5f0de;color:#65472f;font-family:system-ui;margin:24px}h1{font-size:22px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.card{background:#fff8e7;border:1px solid #dbc49f;border-radius:8px;padding:16px;text-align:center}.image{height:128px;display:flex;align-items:end;justify-content:center}.card img{image-rendering:pixelated;max-width:none}.meta{font-size:12px;color:#7d6349}a{color:inherit} .review{width:100%;max-width:1344px;image-rendering:pixelated}</style><h1>생활 가구 도트 48종</h1><p>새 30종과 이전 18종. 모두 같은 16px 기준. 작은 소품은 캔버스 안에서 작게 그립니다.</p><p>크기 비교 첫 두 줄은 기존 가구 12종, 아래는 이전 18종과 새 30종입니다. 옆의 인물은 실제 게임 캐릭터(10×14px)입니다.</p><img class="review" src="size-review-4x.png" alt="기존 가구와 새 가구를 캐릭터와 비교"><h2>새로 추가한 30종</h2><div class="grid">${audit.filter(a=>a.group==='room-additions').map(a=>`<div class="card"><div class="image"><img src="${a.file}" width="${a.width*6}" height="${a.height*6}" alt="${esc(a.name)}"></div><p>${a.name}</p><p class="meta">원본 ${a.width}×${a.height}px · 실제 도트 ${a.visible.width}×${a.visible.height}px</p></div>`).join('')}</div><h2>이전에 만든 18종</h2><div class="grid">${audit.filter(a=>a.group!=='room-additions').map(a=>`<div class="card"><div class="image"><img src="../${a.group}/${a.file}" width="${a.width*6}" height="${a.height*6}" alt="${esc(a.name)}"></div><p>${a.name}</p><p class="meta">원본 ${a.width}×${a.height}px · 실제 도트 ${a.visible.width}×${a.visible.height}px</p></div>`).join('')}</div><p>게임의 지급·구매·배치 연결은 아직 적용하지 않은 도트 자산입니다.</p></html>`)
fs.writeFileSync(`${root}/README.md`, `# 생활 가구 30종과 크기 점검\n\n직접 찍은 정수 픽셀 도트. 기존 FURNI_PALETTE와 16px 기준을 유지합니다.\n\n${newItems.map((a,i)=>`${i+1}. ${a.name} — ${a.id}.png (${a.art.w*16}×${a.art.h*16}px)`).join('\n')}\n\n## 크기 점검\n\n기존 게임 원본 ${baseline.length}종, 앞서 만든 18종, 새 30종을 확인했습니다. 이전 실패 꽂이는 실루엣 14×12px에서 10×9px로 축소했습니다. 다른 이전 도트는 기존 가구 비율과 맞아 유지했습니다.\n\n의자·1칸 장은 16×16px, 넓은 탁자·선반은 32×16px. 보석함·바느질함 같은 소품은 16px 캔버스 내부에서 작은 실루엣으로 그립니다. 모든 도트와 인물을 같은 최근접 이웃 배율로 표시합니다. 앞으로 키 큰 가구를 추가하면 그림 높이와 실제 배치 칸을 별도로 정의해야 합니다.\n\npreview.html: 이름·크기와 48종 전체 보기. size-review-4x.png: 첫 두 줄 기존 가구 12종, 이후 이전 18종과 새 30종; 각 가구 옆 실제 캐릭터. preview-6x.png: 새 30종. atlas.png 및 개별 PNG: 투명 원본. size-audit.json: 전체 실루엣·크기·검사 결과.\n\n이전 고해상도 home-space-furniture-v1.png는 참고용 이미지이며 16px 게임 자산과 구분합니다. 이 파일을 게임에 그대로 표시하면 크기가 맞지 않습니다.\n\n상태: 앞모습 도트 자산, 게임 지급·구매·배치 연결 전. 검증 범위는 원본 도트·PNG와 같은 배율의 미리보기이며 실제 배치 동선과 화면 배율은 게임 연결 후 확인합니다.\n\n재생성 순서: node scripts/export-cozy-furniture.mjs, node scripts/export-household-furniture.mjs, node scripts/export-room-furniture.mjs\n`)
console.log(JSON.stringify({newAssets:30,previousAssets:18,baselineAssets:baseline.length,sizeChecks:'passed',output:root}))

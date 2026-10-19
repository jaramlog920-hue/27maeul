import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { draw, png } from './pixel-png.mjs'

registerHooks({
  resolve(specifier, context, next) {
    return next(specifier.startsWith('.') && !path.extname(specifier) ? `${specifier}.ts` : specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith('.json')) return { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')}`, shortCircuit: true }
    return next(url, context)
  },
})

const { withLookDefaults, HAIR_FRONTS, HAIR_BACKS } = await import('../src/engine/avatar.ts')
const { spriteRows, writerPalette } = await import('../src/render/sprites.ts')
const out = 'assets/hair-additions'
const facings = ['down', 'right', 'up', 'left']
const stages = ['adult', 'child', 'elder']
const stageLabels = { adult: '성인', child: '아이', elder: '노년' }
const categoryLabels = { front: '앞머리', back: '뒷머리' }
const samples = []

if (HAIR_FRONTS.length !== 22 || HAIR_BACKS.length !== 21) throw Error('앞머리 22종·뒷머리 21종 목록을 확인하세요')
fs.mkdirSync(out, { recursive: true })

for (const [category, catalog, start] of [['front', HAIR_FRONTS, 12], ['back', HAIR_BACKS, 11]]) {
  for (const kind of [0, ...Array.from({ length: 10 }, (_, i) => start + i)]) {
    const avatar = withLookDefaults({
      look: 'f', name: '머리 미리보기', hairFront: category === 'front' ? kind : 0,
      hairBack: category === 'back' ? kind : 0, skin: 1, hairColor: [25, 58, 38],
      top: 3, bottom: 2, bottomColor: [30, 35, 35], acc: 0,
    })
    for (const stage of stages) samples.push({
      id: `${category}-${kind}-${stage}`, category, kind, label: catalog[kind], stage,
      baseline: kind === 0, avatar,
    })
  }
}

const make = (sample, facing, frame = 0) => spriteRows('writer', facing, {
  frame, blink: false, avatar: sample.avatar,
  short: sample.stage === 'child' ? 0 : undefined, elder: sample.stage === 'elder',
})
const palette = sample => writerPalette('spring', sample.avatar)
function save(file, rows, pal) {
  if (rows.some(row => row.length !== 10)) throw Error(`10px 인물 폭 불일치: ${file}`)
  const pixels = new Uint8Array(10 * rows.length * 4)
  draw(pixels, 10, rows, pal)
  png(`${out}/${file}`, 10, rows.length, pixels)
  return file
}

// Contact labels use a tiny bitmap font so the exported PNG stays dependency-free.
const glyphs = {
  '0': ['111','101','101','101','111'], '1': ['010','110','010','010','111'],
  '2': ['111','001','111','100','111'], '3': ['111','001','111','001','111'],
  '4': ['101','101','111','001','001'], '5': ['111','100','111','001','111'],
  '6': ['111','100','111','101','111'], '7': ['111','001','010','010','010'],
  '8': ['111','101','111','101','111'], '9': ['111','101','111','001','111'],
  B: ['110','101','110','101','110'], D: ['110','101','101','101','110'],
  F: ['111','100','110','100','100'], L: ['100','100','100','100','111'],
  R: ['110','101','110','101','101'], U: ['101','101','101','101','111'],
}
function label(pixels, width, value, x, y) {
  for (const [i, char] of [...value].entries()) {
    if (!glyphs[char]) continue
    draw(pixels, width, glyphs[char].map(line => line.replaceAll('0', '.').replaceAll('1', 't')), { t: '#493729' }, x + i * 8, y, 2)
  }
}
function fill(pixels, width, x, y, w, h, color) {
  for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) pixels.set(color, (row * width + col) * 4)
}

const sequences = samples.map(sample => {
  const views = Object.fromEntries(facings.map(facing => [facing, [0, 1, 2].map(frame => {
    const rows = make(sample, facing, frame)
    return { file: save(`${sample.id}-${facing}-${frame}.png`, rows, palette(sample)), width: 10, height: rows.length, duration: 200 }
  })]))
  const { avatar: _avatar, ...metadata } = sample
  return { ...metadata, views }
})

const contacts = []
for (const category of ['front', 'back']) for (const stage of stages) {
  const selected = samples.filter(sample => sample.category === category && sample.stage === stage)
  const cardWidth = 268, cardHeight = 120, columns = 4
  const width = cardWidth * columns, height = cardHeight * Math.ceil(selected.length / columns)
  const pixels = new Uint8Array(width * height * 4)
  fill(pixels, width, 0, 0, width, height, [246, 237, 218, 255])
  for (const [i, sample] of selected.entries()) {
    const x = (i % columns) * cardWidth, y = Math.floor(i / columns) * cardHeight
    fill(pixels, width, x + 3, y + 3, cardWidth - 6, cardHeight - 6, sample.baseline ? [219, 225, 210, 255] : [232, 221, 200, 255])
    label(pixels, width, `${category === 'front' ? 'F' : 'B'}${String(sample.kind).padStart(2, '0')}`, x + 12, y + 10)
    for (const [j, facing] of facings.entries()) {
      const rows = make(sample, facing)
      const left = x + 12 + j * 64
      draw(pixels, width, rows, palette(sample), left, y + 104 - rows.length * 5, 5)
      label(pixels, width, facing[0].toUpperCase(), left + 22, y + 108)
    }
  }
  const file = `${category}-${stage}-contact.png`
  png(`${out}/${file}`, width, height, pixels)
  contacts.push({ category, stage, file })
}

const manifest = {
  version: 1, sources: ['src/engine/avatar.ts', 'src/render/front-hair-additions.ts', 'src/render/back-hair-additions.ts', 'src/render/sprites.ts'],
  note: '새 앞머리 12~21번과 뒷머리 11~20번. 각 분류의 0번은 기존 스타일 비교 기준. 동일 머리색·옷·피부로 서기와 걷기 0,1,0,2를 비교한다. 아이는 발 기준을 맞추고 노년에는 실제 은회색 머리 처리를 사용한다.',
  contacts, sequences,
}
fs.writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 2))
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const cards = sequences.map((sample, i) => `<article data-category="${sample.category}" data-stage="${sample.stage}"${sample.baseline ? ' class="baseline"' : ''}>
<h2>${sample.baseline ? '기존 비교 · ' : ''}${escapeHtml(sample.label)} <small>${categoryLabels[sample.category]} ${sample.kind}번</small></h2>
<div class="views">${facings.map(facing => `<figure><div class="sprite"><img data-sample="${i}" data-facing="${facing}" src="${sample.views[facing][0].file}" width="60" height="${sample.views[facing][0].height * 6}" alt="${escapeHtml(sample.label)} ${facing}"></div><figcaption>${{ down: '앞', right: '오른쪽', up: '뒤', left: '왼쪽' }[facing]}</figcaption></figure>`).join('')}</div></article>`).join('')
fs.writeFileSync(`${out}/preview.html`, `<!doctype html>
<html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>27마을 · 앞머리와 뒷머리 각 10종 추가</title>
<style>
*{box-sizing:border-box}body{font:15px system-ui,sans-serif;background:#f6edda;color:#493729;margin:24px}h1{font-size:24px}p{max-width:850px;line-height:1.65}nav{position:sticky;top:0;background:#f6edda;padding:10px 0;z-index:1;display:flex;flex-wrap:wrap;gap:8px}.controls{display:flex;gap:4px;flex-wrap:wrap}button{font:inherit;padding:8px 12px;background:#fff9ec;border:1px solid #ac9978;border-radius:6px;color:inherit;cursor:pointer}button[aria-pressed=true]{background:#5b705b;color:#fff}main{display:flex;gap:12px;flex-wrap:wrap}article{background:#e8ddc8;padding:16px;border-radius:8px}article.baseline{background:#dbe1d2}article[hidden]{display:none}h2{font-size:16px;margin:0 0 18px}small{font-weight:400;display:block;font-size:12px;margin-top:5px}.views{display:flex;gap:18px;align-items:end}figure{margin:0;text-align:center}.sprite{height:84px;display:flex;align-items:end;justify-content:center}img{image-rendering:pixelated;display:block}figcaption{font-size:12px;margin-top:8px}footer{margin-top:24px;line-height:1.7}a{color:#48664d}@media(max-width:430px){body{margin:12px}.views{gap:12px}article{padding:14px}}
</style><h1>27마을 · 머리스타일 20종 추가</h1>
<p>앞머리 10종과 뒷머리 10종을 같은 색으로 비교합니다. 녹색 카드는 기존 0번 스타일입니다. 앞머리를 볼 때는 뒷머리 0번, 뒷머리를 볼 때는 앞머리 0번을 사용합니다. 아이와 노년에도 게임의 같은 도트 원본을 사용하며, 모든 방향은 발 높이를 맞췄습니다.</p>
<nav><div class="controls">${Object.entries(categoryLabels).map(([id, name]) => `<button data-category-button="${id}">${name} +10</button>`).join('')}</div><div class="controls">${Object.entries(stageLabels).map(([id, name]) => `<button data-stage-button="${id}">${name}</button>`).join('')}</div><button id="play" aria-pressed="false">걷기 재생</button></nav>
<main>${cards}</main><footer>원본: <code>spriteRows</code> · PNG 폭 10px · 프레임 0(서기), 1·2(걸음)<br>${contacts.map(contact => `<a href="${contact.file}">${categoryLabels[contact.category]} ${stageLabels[contact.stage]} 한 장 보기</a>`).join(' · ')}</footer>
<script>
const sequences=${JSON.stringify(sequences)};let category='front',stage='adult',running=false,frame=0;
function filter(){document.querySelectorAll('article').forEach(a=>a.hidden=a.dataset.category!==category||a.dataset.stage!==stage);document.querySelectorAll('[data-category-button]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.categoryButton===category)));document.querySelectorAll('[data-stage-button]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stageButton===stage)))}
function update(){document.querySelectorAll('article:not([hidden]) img').forEach(img=>img.src=sequences[+img.dataset.sample].views[img.dataset.facing][running?[0,1,0,2][frame]:0].file);document.getElementById('play').textContent=running?'걷기 멈추기':'걷기 재생';document.getElementById('play').setAttribute('aria-pressed',String(running))}
document.querySelectorAll('[data-category-button]').forEach(b=>b.onclick=()=>{category=b.dataset.categoryButton;filter();update()});document.querySelectorAll('[data-stage-button]').forEach(b=>b.onclick=()=>{stage=b.dataset.stageButton;filter();update()});document.getElementById('play').onclick=()=>{running=!running;frame=0;update()};setInterval(()=>{if(running){frame=(frame+1)%4;update()}},200);filter();
</script></html>`)
console.log(`앞머리 +10·뒷머리 +10 및 기존 기준: ${sequences.length}외형 × 4방향 × 3프레임, contact 6장 → ${out}`)

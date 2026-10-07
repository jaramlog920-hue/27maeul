import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { png, draw } from './pixel-png.mjs'
registerHooks({ resolve(s, c, n) { return n(s.startsWith('.') && !path.extname(s) ? `${s}.ts` : s, c) }, load(url, c, n) { if (url.endsWith('.json')) return { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')}`, shortCircuit: true }; return n(url, c) } })
const { QUIET_ACTIONS, QUIET_LABELS, quietLifeRows, sheepLifeRows } = await import('../src/render/quiet-life-motion.ts')
const { writerPalette, SMALL_PALETTE } = await import('../src/render/sprites.ts')
const { withLookDefaults } = await import('../src/engine/avatar.ts')
const out = 'assets/quiet-life'
fs.mkdirSync(out, { recursive: true })
const avatar = withLookDefaults({ look: 'f', name: '미리보기', top: 12, bottom: 2 })
const opts = { frame: 0, blink: false, avatar }
const sequences = QUIET_ACTIONS.map(id => ({ id, label: QUIET_LABELS[id], palette: writerPalette('spring', avatar), frames: Array.from({ length: 4 }, (_, f) => quietLifeRows('writer', id, f, opts)) }))
for (const side of ['left', 'right']) for (const action of ['walk', 'graze']) sequences.push({ id: `sheep-${action}-${side}`, label: `양 ${action === 'walk' ? '걷기' : '풀 먹기'} · ${side}`, palette: SMALL_PALETTE, frames: Array.from({ length: 4 }, (_, f) => sheepLifeRows(side, action, f)) })
const sheet = new Uint8Array(384 * sequences.length * 80 * 4)
for (const [i, s] of sequences.entries()) {
  s.files = s.frames.map((rows, f) => {
    const w = rows[0].length, h = rows.length, p = new Uint8Array(w * h * 4), file = `${s.id}-${f}.png`
    draw(p, w, rows, s.palette); png(`${out}/${file}`, w, h, p)
    draw(sheet, 384, rows, s.palette, f * 96 + 24, i * 80 + 8, 4)
    return file
  })
}
png(`${out}/contact-sheet.png`, 384, sequences.length * 80, sheet)
fs.writeFileSync(`${out}/manifest.json`, JSON.stringify(sequences.map(({ id, label, files }) => ({ id, label, files, frameMs: 250, loop: true })), null, 2))
fs.writeFileSync(`${out}/preview.html`, `<!doctype html><html lang="ko"><meta charset="utf-8"><title>27마을 · 작은 생활 도트</title><style>body{font:16px system-ui;background:#f6edda;color:#493729;margin:32px}main{display:flex;flex-wrap:wrap;gap:18px}article{background:#e0d6bd;border-radius:12px;padding:20px;text-align:center;min-width:160px}img{image-rendering:pixelated;height:112px;width:auto;object-fit:contain}button{font:inherit;margin-bottom:20px;padding:8px 16px}small{display:block;margin:12px}</style><h1>27마을 · 작은 생활 도트</h1><p>게임에 연결한 5가지 몸짓과 양의 걸음·풀 먹기. 각 4프레임, 투명 PNG.</p><button id="toggle">모션 멈추기</button><main>${sequences.map((s, i) => `<article><h3>${s.label}</h3><img data-i="${i}" src="${s.files[0]}" alt="${s.label}"><small>4프레임 · 250ms</small></article>`).join('')}</main><script>const seq=${JSON.stringify(sequences.map(s => s.files))};let f=0,playing=true;document.getElementById('toggle').onclick=function(){playing=!playing;this.textContent=playing?'모션 멈추기':'모션 재생'};setInterval(()=>{if(!playing)return;f=(f+1)%4;document.querySelectorAll('img').forEach(img=>img.src=seq[Number(img.dataset.i)][f])},250)</script></html>`)
console.log(`생활 모션 ${sequences.length}종 / PNG ${sequences.length * 4}장 → ${out}`)

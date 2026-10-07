import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { draw, png } from './pixel-png.mjs'
registerHooks({ resolve(s, c, n) { return n(s.startsWith('.') && !path.extname(s) ? `${s}.ts` : s, c) } })
const { libraryBookRows, libraryPalette, libraryWorkRows, LIBRARY_ACTIONS, LIBRARY_LABELS } = await import('../src/render/library-art.ts')
const { COVER_COLORS, COVER_PATTERNS, SPINE_DECOS } = await import('../src/engine/binding.ts')
const out = 'assets/library', items = [], sequences = []
fs.mkdirSync(out, { recursive: true })
const save = (id, rows, pal) => { const w = rows[0].length, h = rows.length, p = new Uint8Array(w * h * 4); draw(p, w, rows, pal); png(`${out}/${id}.png`, w, h, p); return `${id}.png` }
const bg = (w, h) => { const p = new Uint8Array(w * h * 4); for (let i = 0; i < p.length; i += 4) p.set([246, 237, 218, 255], i); return p }
const sheet = bg(1280, 6 * 80)
let i = 0
for (const color of COVER_COLORS) for (const pattern of COVER_PATTERNS) for (const deco of SPINE_DECOS) {
  const id = `${color}-${pattern}-${deco}`, binding = { day: 0, special: { color, pattern, deco } }, pal = libraryPalette('mt', binding, 2)
  const spine = libraryBookRows('mt', binding, 2), cover = libraryBookRows('mt', binding, undefined, false, true)
  items.push({ id, color, pattern, deco, spine: save(`${id}-spine`, spine, pal), cover: save(`${id}-cover`, cover, pal) })
  draw(sheet, 1280, cover, pal, (i % 16) * 80 + 2, Math.floor(i / 16) * 80 + 4, 2)
  draw(sheet, 1280, spine, pal, (i % 16) * 80 + 54, Math.floor(i / 16) * 80 + 12, 2)
  i++
}
png(`${out}/designs.png`, 1280, 480, sheet)
const sample = { day: 0, special: { color: 'sage', pattern: 'diamonds', deco: 'bronze' } }, pal = libraryPalette('mt', sample, 2)
const motionSheet = bg(512, 6 * 128)
for (const [a, action] of LIBRARY_ACTIONS.entries()) {
  const files = [0, 1, 2, 3].map(f => { const rows = libraryWorkRows('mt', action, f, sample, 2); draw(motionSheet, 512, rows, pal, f * 128, a * 128, 4); return save(`${action}-${f}`, rows, pal) })
  sequences.push({ id: action, label: LIBRARY_LABELS[action], files, frameMs: 300, loop: false })
}
png(`${out}/motions.png`, 512, 768, motionSheet)
fs.writeFileSync(`${out}/manifest.json`, JSON.stringify({ items, sequences }, null, 2))
fs.writeFileSync(`${out}/preview.html`, `<!doctype html><html lang="ko"><meta charset="utf-8"><title>27마을 서고 도트</title><style>body{background:#f6edda;color:#493729;font:16px system-ui;margin:24px}section{display:flex;flex-wrap:wrap;gap:12px}article{background:#e7dac0;padding:12px;text-align:center;border-radius:8px}img{image-rendering:pixelated;vertical-align:middle}button{font:inherit;padding:8px}p{font-size:12px}select{font:inherit;margin:8px}</style><h1>27마을 · 서고와 책등 꾸미기</h1><p>기존 꾸미기 96조합 · 작업 모션 6종 · 투명 PNG</p><button id="play">모션 다시 보기</button><section>${sequences.map((s, n) => `<article><h3>${s.label}</h3><img data-motion="${n}" src="${s.files[0]}" width="128" height="128" alt="${s.label}"></article>`).join('')}</section><h2>표지와 책등 96조합</h2><label>표지 색 <select id="color"><option value="all">전체</option>${COVER_COLORS.map(c => `<option>${c}</option>`).join('')}</select></label><section>${items.map(a => `<article data-color="${a.color}"><img src="${a.cover}" width="72" height="96" alt="${a.id} 표지"><img src="${a.spine}" width="24" height="60" alt="${a.id} 금박 책등"><p>${a.color} · ${a.pattern}<br>${a.deco}</p></article>`).join('')}</section><script>const seq=${JSON.stringify(sequences)};let timer;function play(){clearInterval(timer);let f=matchMedia('(prefers-reduced-motion: reduce)').matches?3:0;const draw=()=>document.querySelectorAll('[data-motion]').forEach(el=>el.src=seq[Number(el.dataset.motion)].files[f]);draw();if(f===3)return;timer=setInterval(()=>{f++;draw();if(f===3)clearInterval(timer)},300)}document.getElementById('play').onclick=play;document.getElementById('color').onchange=e=>document.querySelectorAll('[data-color]').forEach(el=>el.hidden=e.target.value!=='all'&&el.dataset.color!==e.target.value);play()</script></html>`)
console.log(`책 꾸미기 ${items.length}조합 / 서고 모션 ${sequences.length}종 → ${out}`)

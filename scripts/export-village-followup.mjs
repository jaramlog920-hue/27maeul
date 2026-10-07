import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { draw, png } from './pixel-png.mjs'
registerHooks({ resolve(s, c, n) { return n(s.startsWith('.') && !path.extname(s) ? `${s}.ts` : s, c) }, load(url, c, n) { if (url.endsWith('.json')) return { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')}`, shortCircuit: true }; return n(url, c) } })
const { MEETING_EMOTES, MEETING_PALETTE, meetingEmoteRows, householdCradleFrame, VISITOR_KINDS, VISITOR_LABELS, visitorFrame } = await import('../src/render/village-followup-art.ts')
const out = 'assets/village-followup', sequences = [], emotes = []
fs.mkdirSync(out, { recursive: true })
const labels = { heart: '하트', laugh: '웃음', talk: '대화', sweat: '머쓱', angry: '화남' }, actions = { stand: '서 있기', read: '책 읽기', write: '방명록 쓰기' }
const sheet = new Uint8Array(512 * 512 * 4)
for (let i = 0; i < sheet.length; i += 4) sheet.set([246, 237, 218, 255], i)
function save(id, width, height, layers) {
  const p = new Uint8Array(width * height * 4)
  for (const [rows, palette] of layers) draw(p, width, rows, palette)
  const file = `${id}.png`; png(`${out}/${file}`, width, height, p)
  return file
}
let n = 0
function contact(layers, width, height) {
  for (const [rows, pal] of layers) draw(sheet, 512, rows, pal, (n % 8) * 64 + Math.floor((64 - width * 2) / 2), Math.floor(n / 8) * 64 + Math.floor((64 - height * 2) / 2), 2)
  n++
}
for (const id of MEETING_EMOTES) {
  const layers = [[meetingEmoteRows(id), MEETING_PALETTE]], file = save(`emote-${id}`, 13, 13, layers)
  emotes.push({ id, label: labels[id], file }); contact(layers, 13, 13)
}
for (const sleeping of [false, true]) {
  const files = [0, 1, 2, 3].map(f => {
    const a = householdCradleFrame({ look: 'f', name: '루시', avatar: { skin: 2 } }, f, sleeping), layers = [[a.back, a.propPalette], [a.actor, a.actorPalette], [a.front, a.propPalette]]
    contact(layers, 16, 16); return save(`cradle-${sleeping ? 'sleep' : 'awake'}-${f}`, 16, 16, layers)
  })
  sequences.push({ label: sleeping ? '요람에서 잠든 아기' : '요람에서 눈 깜빡이는 아기', files, frameMs: 600 })
}
for (const kind of VISITOR_KINDS) for (const action of ['stand', 'read', 'write']) {
  const files = [0, 1, 2, 3].map(f => {
    const a = visitorFrame(kind, action, f), layers = [[a.propBack, a.propPalette], [a.actor, a.actorPalette], [a.propFront, a.propPalette]]
    contact(layers, 24, 24); return save(`visitor-${kind}-${action}-${f}`, 24, 24, layers)
  })
  sequences.push({ label: `${VISITOR_LABELS[kind]} · ${actions[action]}`, files, frameMs: 350 })
}
png(`${out}/contact-sheet.png`, 512, 512, sheet)
fs.writeFileSync(`${out}/manifest.json`, JSON.stringify({ emotes, sequences, connected: true, visitorHours: '09:00–17:00', source: 'src/render/village-followup-art.ts' }, null, 2))
fs.writeFileSync(`${out}/preview.html`, `<!doctype html><html lang="ko"><meta charset="utf-8"><title>27마을 가족·만남·방문객 도트</title><style>body{font:16px system-ui;color:#493729;background:#f6edda;margin:24px}section{display:flex;flex-wrap:wrap;gap:12px}article{padding:16px;min-width:144px;background:#e2d5ba;border-radius:8px;text-align:center}img{image-rendering:pixelated;object-fit:contain}h3{font-size:14px}button{font:inherit;padding:8px 14px;margin:16px 0}</style><h1>27마을 · 가족과 서고 방문객</h1><p>부모 집 요람 · 만남 표정 5종 · 방문객 4종. 게임에 연결한 도트 원본입니다.</p><h2>만남 표정</h2><section>${emotes.map(e => `<article><img src="${e.file}" width="78" height="78" alt="${e.label}"><h3>${e.label}</h3></article>`).join('')}</section><button id="toggle">모션 멈추기</button><h2>요람과 방문객</h2><section>${sequences.map((s, i) => `<article><img data-seq="${i}" src="${s.files[0]}" width="144" height="144" alt="${s.label}"><h3>${s.label}</h3></article>`).join('')}</section><script>const seq=${JSON.stringify(sequences)};let playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,start=performance.now();const button=document.getElementById('toggle');button.textContent=playing?'모션 멈추기':'모션 재생';button.onclick=()=>{playing=!playing;start=performance.now();button.textContent=playing?'모션 멈추기':'모션 재생'};setInterval(()=>{if(!playing)return;document.querySelectorAll('[data-seq]').forEach(el=>{const s=seq[Number(el.dataset.seq)];el.src=s.files[Math.floor((performance.now()-start)/s.frameMs)%4]})},100)</script></html>`)
console.log(`표정 ${emotes.length}종 / 요람·방문객 ${sequences.length}시퀀스 → ${out}`)

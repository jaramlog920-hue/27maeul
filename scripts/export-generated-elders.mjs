import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { draw, png } from './pixel-png.mjs'
registerHooks({ resolve(s, c, n) { return n(s.startsWith('.') && !path.extname(s) ? `${s}.ts` : s, c) }, load(url, c, n) { if (url.endsWith('.json')) return { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')}`, shortCircuit: true }; return n(url, c) } })
const { genAvatar } = await import('../src/engine/gen-looks.ts')
const { generationRows } = await import('../src/render/generation-art.ts')
const { writerPalette } = await import('../src/render/sprites.ts')
const out = 'assets/generated-elders', samples = [], sheet = new Uint8Array(320 * 12 * 72 * 4)
fs.mkdirSync(out, { recursive: true })
for (let i = 0; i < sheet.length; i += 4) sheet.set([246, 237, 218, 255], i)
function save(file, rows, pal) { const p = new Uint8Array(10 * 14 * 4); draw(p, 10, rows, pal); png(`${out}/${file}`, 10, 14, p); return file }
for (let i = 0; i < 12; i++) {
  const p = { id: `sample-${i}`, name: `생성 주민 예시 ${i + 1}`, look: i % 2 ? 'f' : 'm', avatar: { skin: i % 8, hairFront: i, hairBack: i % 8, top: (i * 3) % 14, bottom: i % 4 } }
  const avatar = genAvatar(p), palette = writerPalette('spring', avatar), opts = { frame: 0, blink: false, avatar }
  const adult = generationRows('adult', 'down', 0, opts), before = save(`${p.id}-adult.png`, adult, palette)
  draw(sheet, 320, adult, palette, 20, i * 72 + 8, 4)
  const directions = {}
  for (const [d, facing] of ['down', 'up', 'left', 'right'].entries()) directions[facing] = [0, 1, 2].map(f => {
    const rows = generationRows('elder', facing, f, opts)
    if (f === 0) draw(sheet, 320, rows, palette, 84 + d * 58, i * 72 + 8, 4)
    return save(`${p.id}-elder-${facing}-${f}.png`, rows, palette)
  })
  samples.push({ label: p.name, avatar, before, directions })
}
png(`${out}/before-after.png`, 320, 864, sheet)
fs.writeFileSync(`${out}/manifest.json`, JSON.stringify({ elderAgeDays: 244, samples, note: '대표 외형 예시. 실제 생성 주민은 저장된 아바타로 같은 함수를 사용해 노년을 그린다.' }, null, 2))
fs.writeFileSync(`${out}/preview.html`, `<!doctype html><html lang="ko"><meta charset="utf-8"><title>27마을 생성 주민 노년</title><style>body{font:16px system-ui;background:#f6edda;color:#493729;margin:24px}article{background:#e3d8c2;padding:16px;margin:12px 0;border-radius:8px}section{display:flex;gap:24px;flex-wrap:wrap}figure{margin:0;text-align:center}img{image-rendering:pixelated}figcaption{font-size:12px}button{font:inherit;padding:8px}</style><h1>태어난 주민도 노년으로</h1><p>출생 → 어린이 → 청소년 → 성인 → 노년. 성인 이후 4계절, 출생 후 244일부터 노년입니다.<br>실제 이름·피부·머리 모양·옷을 유지합니다. 아래는 생성 외형 12가지 예시입니다.</p><button id="toggle">모션 멈추기</button>${samples.map((s, i) => `<article><h2>${s.label}</h2><section><figure><img src="${s.before}" width="60" height="84" alt="성인"><figcaption>성인</figcaption></figure>${Object.entries(s.directions).map(([d, files]) => `<figure><img data-sample="${i}" data-direction="${d}" src="${files[0]}" width="60" height="84" alt="노년"><figcaption>${{ down: '앞', up: '뒤', left: '왼쪽', right: '오른쪽' }[d]} · 노년</figcaption></figure>`).join('')}</section></article>`).join('')}<script>const samples=${JSON.stringify(samples)};let f=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches;const b=document.getElementById('toggle');b.textContent=playing?'모션 멈추기':'모션 재생';b.onclick=()=>{playing=!playing;b.textContent=playing?'모션 멈추기':'모션 재생'};setInterval(()=>{if(!playing)return;f=(f+1)%4;document.querySelectorAll('[data-sample]').forEach(el=>el.src=samples[Number(el.dataset.sample)].directions[el.dataset.direction][[0,1,0,2][f]])},300)</script></html>`)
console.log(`생성 주민 노년 예시 ${samples.length}종 → ${out}`)

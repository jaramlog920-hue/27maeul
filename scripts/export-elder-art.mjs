import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { draw, png } from './pixel-png.mjs'
registerHooks({ resolve(s, c, n) { return n(s.startsWith('.') && !path.extname(s) ? `${s}.ts` : s, c) }, load(url, c, n) { if (url.endsWith('.json')) return { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')}`, shortCircuit: true }; return n(url, c) } })
const neighbors = JSON.parse(fs.readFileSync('src/content/neighbors.json', 'utf8'))
const { withLookDefaults } = await import('../src/engine/avatar.ts')
const { spriteRows, PALETTE, writerPalette } = await import('../src/render/sprites.ts')
const { furnitureUseFrame, USE_PROP_PALETTE } = await import('../src/render/furniture-use-motion.ts')
const out = 'assets/elder-residents', residents = [], sheet = new Uint8Array(320 * neighbors.length * 72 * 4)
fs.mkdirSync(out, { recursive: true })
for (let i = 0; i < sheet.length; i += 4) sheet.set([246, 237, 218, 255], i)
function save(file, w, h, layers) { const p = new Uint8Array(w * h * 4); for (const [rows, pal] of layers) draw(p, w, rows, pal); png(`${out}/${file}`, w, h, p); return file }
for (const [i, def] of neighbors.entries()) {
  const avatar = def.avatar && def.look ? withLookDefaults({ look: def.look, name: def.role, ...def.avatar }) : undefined
  const who = avatar ? 'writer' : def.sprite, pal = avatar ? writerPalette('spring', avatar) : PALETTE, opts = { frame: 0, blink: false, avatar, growth: 3 }
  const adult = spriteRows(who, 'down', opts), before = save(`${def.id}-before.png`, 10, adult.length, [[adult, pal]])
  draw(sheet, 320, adult, pal, 20, i * 72 + 8, 4)
  const directions = {}
  for (const [d, facing] of ['down', 'up', 'left', 'right'].entries()) {
    directions[facing] = [0, 1, 2].map(frame => {
      const rows = spriteRows(who, facing, { ...opts, frame, elder: true })
      if (frame === 0) draw(sheet, 320, rows, pal, 84 + d * 58, i * 72 + 8, 4)
      return save(`${def.id}-elder-${facing}-${frame}.png`, 10, rows.length, [[rows, pal]])
    })
  }
  const motions = {}
  for (const action of ['sit', 'read']) motions[action] = [0, 1, 2, 3].map(f => {
    const a = furnitureUseFrame(who, 'down', action, f, { ...opts, elder: true })
    return save(`${def.id}-elder-${action}-${f}.png`, 24, 24, [[a.propBack, USE_PROP_PALETTE], [a.actor, pal], [a.propFront, USE_PROP_PALETTE]])
  })
  residents.push({ id: def.id, label: def.name ?? def.role, before, directions, motions })
}
png(`${out}/before-after.png`, 320, neighbors.length * 72, sheet)
fs.writeFileSync(`${out}/manifest.json`, JSON.stringify({ residents, connected: true, source: 'src/render/elder-details.ts', note: '계보 elder 또는 은퇴 기록에 적용. 노년 시기를 새로 정하지 않는다.' }, null, 2))
fs.writeFileSync(`${out}/preview.html`, `<!doctype html><html lang="ko"><meta charset="utf-8"><title>27마을 주민 노년 도트</title><style>body{font:16px system-ui;color:#493729;background:#f6edda;margin:24px}article{background:#e3d8c2;border-radius:8px;padding:16px;margin:12px 0}section{display:flex;flex-wrap:wrap;align-items:end;gap:20px}figure{margin:0;text-align:center}img{image-rendering:pixelated;object-fit:contain}figcaption{font-size:12px;margin-top:6px}button{font:inherit;padding:8px 14px}</style><h1>27마을 · 기존 주민의 노년 모습</h1><p>원래 머리 모양·옷·모자를 유지한 은회색 머리와 눈가 주름, 살짝 숙인 자세.</p><button id="toggle">모션 멈추기</button>${residents.map((r, i) => `<article><h2>${r.label}</h2><section><figure><img src="${r.before}" width="60" height="84" alt="${r.label} 원래 모습"><figcaption>원래 모습</figcaption></figure>${Object.entries(r.directions).map(([f, files]) => `<figure><img data-res="${i}" data-facing="${f}" src="${files[0]}" width="60" height="84" alt="${r.label} 노년"><figcaption>${{ down: '앞', up: '뒤', left: '왼쪽', right: '오른쪽' }[f]} · 노년</figcaption></figure>`).join('')}${Object.entries(r.motions).map(([action, files]) => `<figure><img data-res="${i}" data-action="${action}" src="${files[0]}" width="120" height="120" alt="${r.label} ${action === 'sit' ? '앉기' : '독서'}"><figcaption>${action === 'sit' ? '앉아서 쉬기' : '책 읽기'}</figcaption></figure>`).join('')}</section></article>`).join('')}<script>const residents=${JSON.stringify(residents)};let playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,f=0;const button=document.getElementById('toggle');button.textContent=playing?'모션 멈추기':'모션 재생';button.onclick=()=>{playing=!playing;button.textContent=playing?'모션 멈추기':'모션 재생'};setInterval(()=>{if(!playing)return;f=(f+1)%4;document.querySelectorAll('[data-res]').forEach(el=>{const r=residents[Number(el.dataset.res)];el.src=el.dataset.action?r.motions[el.dataset.action][f]:r.directions[el.dataset.facing][[0,1,0,2][f]]})},300)</script></html>`)
console.log(`주민 ${residents.length}명 / 노년 4방향·걷기·앉기·독서 → ${out}`)

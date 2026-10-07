import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { draw,png } from './pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return n(url,c)}})
const art=await import('../src/render/craft-followup-art.ts')
const out='assets/craft-followup',directions=['down','up','left','right'],sequences=[]
for(const folder of [...Object.keys(art.CRAFT_GROUPS),'curtains','windows'])fs.mkdirSync(`${out}/${folder}`,{recursive:true})
function save(file,w,h,layers){const p=new Uint8Array(w*h*4);for(const [rows,pal]of layers)draw(p,w,rows,pal);png(`${out}/${file}`,w,h,p);return file}
const sheet=new Uint8Array(768*820*4)
for(let i=0;i<sheet.length;i+=4)sheet.set([246,237,218,255],i)
let index=0
for(const [group,actions]of Object.entries(art.CRAFT_GROUPS))for(const action of actions){
 const views={}
 for(const direction of directions)views[direction]=[0,1,2,3].map(f=>{
  const a=art.craftFollowupFrame(action,direction,f),stem=`${group}/${action}-${direction}-${f}`
  const layers=[[a.propBack,art.CRAFT_PALETTE],[a.actor,a.palette],[a.propFront,art.CRAFT_PALETTE]],split={}
  for(const [i,key]of ['back','actor','front'].entries())split[key]=save(`${stem}-${key}.png`,32,32,[layers[i]])
  if(direction==='down'&&f===2)for(const [rows,pal]of layers)draw(sheet,768,rows,pal,(index%4)*192+24,Math.floor(index/4)*128,4)
  return {file:save(`${stem}.png`,32,32,layers),width:32,height:32,anchor:a.anchor,duration:a.duration,loop:a.loop,layers:split}
 })
 sequences.push({group,id:action,label:art.CRAFT_LABELS[action],views});index++
}
let fixture=0
for(const color of art.CURTAIN_COLORS)for(const action of ['open','close']){
 const frames=[0,1,2,3].map(f=>({file:save(`curtains/${color}-${action}-${f}.png`,32,16,[[art.curtainRows(color,action,f),art.WINDOW_PALETTE]]),width:32,height:16,anchor:{x:16,y:16},duration:260,loop:false}))
 sequences.push({group:'curtains',id:`${color}-${action}`,label:`${art.CURTAIN_COLOR_LABELS[color]} 커튼 · ${action==='open'?'열기':'닫기'}`,views:{down:frames}})
 draw(sheet,768,art.curtainRows(color,action,3),art.WINDOW_PALETTE,fixture*128+16,560,3);fixture++
}
for(const [i,action]of ['open','close'].entries()){
 const frames=[0,1,2,3].map(f=>({file:save(`windows/${action}-${f}.png`,32,32,[[art.windowRows(action,f),art.WINDOW_PALETTE]]),width:32,height:32,anchor:{x:16,y:32},duration:240,loop:false}))
 sequences.push({group:'windows',id:action,label:`창문 · ${action==='open'?'빗장 풀고 열기':'닫고 빗장 걸기'}`,views:{down:frames}})
 draw(sheet,768,art.windowRows(action,3),art.WINDOW_PALETTE,150+i*240,670,3)
}
png(`${out}/contact-sheet.png`,768,820,sheet)
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify({version:1,connected:false,sequences,source:'src/render/craft-followup-art.ts',palettes:{props:art.CRAFT_PALETTE,fixtures:art.WINDOW_PALETTE},note:'자산 전용. 제작 기능·직업 일과·서고 행동·커튼/창문 상호작용·저장 상태는 변경하지 않았다.'},null,2))
const labels={all:'전체',materials:'종이·실·잉크',pottery:'도예',instrument:'악기 제작',herbal:'약초',scroll:'두루마리',curtains:'커튼',windows:'창문'}
const cards=sequences.map((s,i)=>{const first=s.views.down[0];return `<article data-group="${s.group}"><h3>${s.label}</h3><img data-seq="${i}" src="${first.file}" width="${first.width*4}" height="${first.height*4}" alt="${s.label}"><p>${first.loop?'반복 동작':'한 번 동작 · 끝 자세 유지'}</p><button data-replay="${i}">다시 보기</button></article>`})
fs.writeFileSync(`${out}/preview.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>제작·두루마리·창가 도트</title><style>body{font:15px system-ui;background:#f6edda;color:#493729;margin:24px}nav{position:sticky;top:0;background:#f6edda;padding:10px 0;z-index:1}main{display:flex;gap:14px;flex-wrap:wrap}article{background:#e3d8c2;padding:16px;border-radius:8px;min-width:140px}article[hidden]{display:none}img{image-rendering:pixelated;object-fit:contain}h3{font-size:15px}button,select{font:inherit;margin:4px;padding:6px}p{font-size:13px}</style><h1>종이·실·잉크·도예·악기·약초·두루마리·창가</h1><p>도트 자산만 준비했습니다. 게임 연결은 별도입니다. 작업 모션은 네 방향, 벽에 거는 커튼과 창문은 정면 원본입니다.</p><nav>${Object.entries(labels).map(([id,label])=>`<button data-filter="${id}">${label}</button>`).join('')}<button id="play">멈추기</button><select id="direction">${directions.map(d=>`<option value="${d}">${{down:'앞',up:'뒤',left:'왼쪽',right:'오른쪽'}[d]}</option>`).join('')}</select></nav><main>${cards.join('')}</main><script>const sequences=${JSON.stringify(sequences)},elapsed=sequences.map(()=>0);let running=!matchMedia('(prefers-reduced-motion: reduce)').matches;const sel=document.getElementById('direction'),play=document.getElementById('play');function update(){document.querySelectorAll('[data-seq]').forEach(el=>{const i=+el.dataset.seq,s=sequences[i],frames=s.views[sel.value]||s.views.down,phase=frames[0].loop?Math.floor(elapsed[i]/frames[0].duration)%4:Math.min(3,Math.floor(elapsed[i]/frames[0].duration));el.src=frames[phase].file});play.textContent=running?'멈추기':'재생'}document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>document.querySelectorAll('article').forEach(a=>a.hidden=b.dataset.filter!=='all'&&a.dataset.group!==b.dataset.filter));document.querySelectorAll('[data-replay]').forEach(b=>b.onclick=()=>{elapsed[+b.dataset.replay]=0;update()});sel.onchange=()=>{elapsed.fill(0);update()};play.onclick=()=>{running=!running;update()};setInterval(()=>{if(running){elapsed.forEach((_,i)=>elapsed[i]+=60);update()}},60);update()</script></html>`)
console.log(`인물 제작 동작 ${index}종 × 4방향, 커튼 3색 × 열기/닫기, 창문 열기/닫기 → ${out}`)

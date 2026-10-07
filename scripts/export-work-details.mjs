import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { draw,png } from './pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return n(url,c)}})
const work=await import('../src/render/work-details-motion-art.ts'),env=await import('../src/render/door-ambient-art.ts')
const {BUILDING_LABELS}=await import('../src/render/old-village-art.ts')
const out='assets/work-details',directions=['down','up','left','right'],sequences=[]
for(const dir of ['garden','copy','job','letter','doors','ambient'])fs.mkdirSync(`${out}/${dir}`,{recursive:true})
function save(file,w,h,layers){const p=new Uint8Array(w*h*4);for(const [rows,pal]of layers)draw(p,w,rows,pal);png(`${out}/${file}`,w,h,p);return file}
const sheet=new Uint8Array(768*800*4)
for(let i=0;i<sheet.length;i+=4)sheet.set([246,237,218,255],i)
let index=0
for(const [group,actions]of Object.entries(work.WORK_DETAIL_GROUPS))for(const action of actions){
 const views={}
 for(const direction of directions)views[direction]=[0,1,2,3].map(f=>{
  const a=work.workDetailFrame(action,direction,f),stem=`${group}/${action}-${direction}-${f}`
  const layers=[[a.propBack,work.WORK_DETAIL_PALETTE],[a.actor,a.palette],[a.propFront,work.WORK_DETAIL_PALETTE]],split={}
  for(const [i,key]of ['back','actor','front'].entries())split[key]=save(`${stem}-${key}.png`,32,32,[layers[i]])
  if(f===1&&direction==='down')for(const [rows,pal]of layers)draw(sheet,768,rows,pal,(index%6)*128,Math.floor(index/6)*128,4)
  return {file:save(`${stem}.png`,32,32,layers),width:32,height:32,anchor:a.anchor,duration:a.duration,loop:a.loop,layers:split}
 })
 sequences.push({group,id:action,label:work.WORK_DETAIL_LABELS[action],views});index++
}
for(const [i,id]of env.DOOR_BUILDINGS.entries())for(const action of env.DOOR_ACTIONS){
 const views={}
 for(const direction of env.DOOR_FACINGS)views[direction]=[0,1,2,3].map(f=>{
  const a=env.buildingDoorFrame(id,direction,action,f),stem=`doors/${id}-${action}-${direction}-${f}`
  const layers={back:save(`${stem}-back.png`,64,64,[[a.back,env.DOOR_PALETTE]]),front:save(`${stem}-front.png`,64,64,[[a.front,env.DOOR_PALETTE]])}
  if(action==='open'&&direction==='down'&&f===3)draw(sheet,768,a.rows,env.DOOR_PALETTE,i*144,432,2)
  return {file:save(`${stem}.png`,64,64,[[a.rows,env.DOOR_PALETTE]]),width:64,height:64,anchor:a.anchor,entry:a.entry,duration:a.duration,loop:false,layers}
 })
 sequences.push({group:'doors',id:`${id}-${action}`,label:`${BUILDING_LABELS[id]} · ${action==='open'?'문 열기':'문 닫기'}`,views})
}
for(const [i,action]of env.AMBIENT_ACTIONS.entries()){
 const frames=[0,1,2,3].map(f=>({file:save(`ambient/${action}-${f}.png`,16,16,[[env.ambientDetailRows(action,f),env.AMBIENT_PALETTE]]),width:16,height:16,anchor:{x:8,y:16},duration:action==='lampFlame'?180:500,loop:true}))
 sequences.push({group:'ambient',id:action,label:env.AMBIENT_LABELS[action],views:{down:frames}})
 draw(sheet,768,env.ambientDetailRows(action,1),env.AMBIENT_PALETTE,80+i*160,608,6)
}
png(`${out}/contact-sheet.png`,768,800,sheet)
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify({version:1,connected:false,sequences,sources:['src/render/work-details-motion-art.ts','src/render/door-ambient-art.ts'],palettes:{work:work.WORK_DETAIL_PALETTE,doors:env.DOOR_PALETTE,ambient:env.AMBIENT_PALETTE},note:'자산 전용. 게임 동작·일과·문 충돌·지도·상태 저장은 변경하지 않음. 인물의 실제 외형은 원본 함수 마지막 avatar 인수로 전달.'},null,2))
const groups={all:'전체',garden:'텃밭',copy:'필사',job:'직업 손일',letter:'편지',doors:'문 여닫기',ambient:'불꽃·갈대'}
const cards=sequences.map((s,i)=>{const first=Object.values(s.views)[0][0];return `<article data-group="${s.group}"><h3>${s.label}</h3><img data-sequence="${i}" src="${first.file}" width="${first.width*3}" height="${first.height*3}" alt="${s.label}"><p>${first.loop?'반복 동작':'한 번 동작 · 끝 자세 유지'}</p><button data-replay="${i}">다시 보기</button></article>`})
fs.writeFileSync(`${out}/preview.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>텃밭·필사·손일·문·편지 도트</title><style>body{font:15px system-ui;background:#f6edda;color:#493729;margin:24px}nav{position:sticky;top:0;background:#f6edda;padding:10px 0;z-index:1}main{display:flex;gap:14px;flex-wrap:wrap}article{background:#e3d8c2;padding:16px;border-radius:8px;min-width:140px}article[hidden]{display:none}img{image-rendering:pixelated;object-fit:contain}h3{font-size:15px}button,select{font:inherit;margin:4px;padding:6px}p{font-size:13px}</style><h1>텃밭·필사·손일·문·편지·불꽃과 갈대</h1><p>도트와 모션 자산만 준비했습니다. 게임 연결은 별도입니다. 뒷면에는 문이 없어 문 동작은 앞·왼쪽·오른쪽만 제공합니다.</p><nav>${Object.entries(groups).map(([id,label])=>`<button data-filter="${id}">${label}</button>`).join('')}<button id="play">멈추기</button><select id="direction">${directions.map(d=>`<option value="${d}">${{down:'앞',up:'뒤',left:'왼쪽',right:'오른쪽'}[d]}</option>`).join('')}</select></nav><main>${cards.join('')}</main><script>const sequences=${JSON.stringify(sequences)},elapsed=sequences.map(()=>0);let running=!matchMedia('(prefers-reduced-motion: reduce)').matches;const sel=document.getElementById('direction'),play=document.getElementById('play');function update(){document.querySelectorAll('[data-sequence]').forEach(el=>{const i=+el.dataset.sequence,s=sequences[i],frames=s.views[sel.value]||s.views.down,phase=frames[0].loop?Math.floor(elapsed[i]/frames[0].duration)%4:Math.min(3,Math.floor(elapsed[i]/frames[0].duration));el.src=frames[phase].file});play.textContent=running?'멈추기':'재생'}document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>document.querySelectorAll('article').forEach(a=>a.hidden=b.dataset.filter!=='all'&&a.dataset.group!==b.dataset.filter));document.querySelectorAll('[data-replay]').forEach(b=>b.onclick=()=>{elapsed[+b.dataset.replay]=0;update()});sel.onchange=()=>{elapsed.fill(0);update()};play.onclick=()=>{running=!running;update()};setInterval(()=>{if(running){elapsed.forEach((_,i)=>elapsed[i]+=60);update()}},60);update()</script></html>`)
console.log(`인물 동작 ${index}종 × 4방향, 건물 문 5종 × 3방향 × 열기/닫기, 불꽃·갈대 → ${out}`)

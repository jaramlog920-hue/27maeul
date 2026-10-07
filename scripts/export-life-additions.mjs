import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { draw,png } from './pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return n(url,c)}})
const motion=await import('../src/render/life-additions-motion-art.ts'),props=await import('../src/render/life-additions-prop-art.ts')
const {SETTLEMENT_GUESTS}=await import('../src/render/settlement-guests-art.ts')
const out='assets/life-additions',facings=['down','up','left','right'],sequences=[],staticAssets=[],colors=props.DETAIL_COLORS
for(const folder of ['toddler','child','elder','arrival','memories','books','book-work'])fs.mkdirSync(`${out}/${folder}`,{recursive:true})
function save(file,w,h,layers){const p=new Uint8Array(w*h*4);for(const [rows,pal]of layers)draw(p,w,rows,pal);png(`${out}/${file}`,w,h,p);return file}
const sheet=new Uint8Array(768*1100*4)
for(let i=0;i<sheet.length;i+=4)sheet.set([246,237,218,255],i)
let motionIndex=0
function sequence(group,id,label,get){const views={};for(const facing of facings){views[facing]=[0,1,2,3].map(f=>{
 const a=get(facing,f),layers=[[a.propBack,motion.ADDITION_PROP_PALETTE],[a.actor,a.palette],[a.propFront,motion.ADDITION_PROP_PALETTE]],file=`${group}/${id}-${facing}-${f}`
 const split={};for(const [i,key]of ['back','actor','front'].entries())split[key]=save(`${file}-${key}.png`,24,24,[layers[i]])
 if(f===1&&facing==='down'){for(const [rows,pal]of layers)draw(sheet,768,rows,pal,(motionIndex%8)*96,Math.floor(motionIndex/8)*96,4)}
 return {file:save(`${file}.png`,24,24,layers),width:24,height:24,anchor:a.anchor,duration:a.duration,loop:a.loop,layers:split}
 })}sequences.push({group,id,label,views});motionIndex++}
for(const [group,actions,get]of [['toddler',motion.TODDLER_ACTIONS,motion.toddlerMotionFrame],['child',motion.CHILD_ACTIONS,motion.childMotionFrame],['elder',motion.ELDER_ACTIONS,motion.elderMotionFrame]])for(const action of actions)sequence(group,action,motion.ADDITION_MOTION_LABELS[action],(d,f)=>get(action,d,f))
for(const [id,def]of Object.entries(SETTLEMENT_GUESTS))for(const action of motion.ARRIVAL_ACTIONS)sequence('arrival',`${id}-${action}`,`${def.label} · ${motion.ADDITION_MOTION_LABELS[action]}`,(d,f)=>motion.guestArrivalFrame(id,action,d,f))
for(const [i,kind]of props.MEMORY_KINDS.entries()){
 const frames=[0,1,2,3].map(f=>({file:save(`memories/${kind}-${f}.png`,16,16,[[props.memoryMarkerRows(kind,f),props.MEMORY_PALETTE]]),width:16,height:16,anchor:{x:8,y:16},duration:500,loop:true}))
 draw(sheet,768,props.memoryMarkerRows(kind),props.MEMORY_PALETTE,i*112+24,310,4)
 sequences.push({group:'memories',id:kind,label:props.MEMORY_LABELS[kind],views:{down:frames}})
}
for(const [i,detail]of props.BOOK_DETAILS.entries())for(const [j,color]of colors.entries()){
 const palette=props.bookDetailPalette(color),spine=props.decoratedBookRows(detail,color),cover=props.decoratedBookRows(detail,color,true)
 const item={group:'books',id:`${detail}-${color}`,label:props.BOOK_DETAIL_LABELS[detail],color,spine:save(`books/${detail}-${color}-spine.png`,8,20,[[spine,palette]]),cover:save(`books/${detail}-${color}-cover.png`,24,32,[[cover,palette]])}
 staticAssets.push(item)
 draw(sheet,768,cover,palette,j*128+12,400+i*170,4);draw(sheet,768,spine,palette,j*128+104,410+i*170,2)
 const frames=[0,1,2,3].map(f=>({file:save(`book-work/${detail}-${color}-${f}.png`,40,40,[[props.bookDetailWorkRows(detail,color,f),palette]]),width:40,height:40,duration:280,loop:false,anchor:{x:20,y:40}}))
 sequences.push({group:'book-work',id:`${detail}-${color}`,label:`${props.BOOK_DETAIL_LABELS[detail]} · ${color}`,views:{down:frames}})
}
png(`${out}/contact-sheet.png`,768,1100,sheet)
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify({version:1,connected:false,note:'자산 전용. 입주·일과·성장·가구·제본 선택지는 변경하지 않음.',tileSize:16,sequences,staticAssets,sources:['src/render/life-additions-motion-art.ts','src/render/life-additions-prop-art.ts']},null,2))
const groups={all:'전체',toddler:'유아',child:'아이 공부·심부름',elder:'노인',arrival:'손님 입주 장면',memories:'기억 정원',books:'책 장식', 'book-work':'책 꾸미는 손'}
const colorLabels={cream:'크림',sky:'하늘',sage:'풀빛',lavender:'연보라',sand:'모래',slate:'회청'}
const motionCards=sequences.map((s,i)=>`<article data-group="${s.group}"><h3>${s.label.split(' · ')[0]}${s.group==='arrival'?' · '+s.label.split(' · ')[1]:s.group==='book-work'?' · '+colorLabels[s.label.split(' · ')[1]]:''}</h3><img data-seq="${i}" src="${s.views.down[0].file}" width="${s.views.down[0].width*4}" height="${s.views.down[0].height*4}" alt="${s.label}"><p>${s.views.down[0].loop?'반복 동작':'한 번 동작 · 끝 자세 유지'}</p><button data-replay="${i}">다시 보기</button></article>`)
const books=staticAssets.map(a=>`<article data-group="books"><h3>${a.label} · ${colorLabels[a.color]}</h3><img src="${a.cover}" width="96" height="128" alt="${a.label} 표지"> <img src="${a.spine}" width="32" height="80" alt="${a.label} 책등"></article>`)
fs.writeFileSync(`${out}/preview.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>생활 도트 후속 6종</title><style>body{font:15px system-ui;background:#f6edda;color:#493729;margin:24px}nav{position:sticky;top:0;background:#f6edda;padding:10px 0;z-index:1}main{display:flex;gap:14px;flex-wrap:wrap}article{background:#e3d8c2;padding:16px;border-radius:8px;min-width:160px}article[hidden]{display:none}img{image-rendering:pixelated;object-fit:contain}h3{font-size:15px}button,select{font:inherit;margin:4px;padding:6px}p{font-size:13px}</style><h1>유아·아이·노인·입주·기억 정원·책 장식</h1><p>도트 자산만 준비했습니다. 실제 게임 연결은 별도입니다. 한 번 동작은 마지막 자세에서 멈춥니다.</p><nav>${Object.entries(groups).map(([id,label])=>`<button data-filter="${id}">${label}</button>`).join('')}<button id="play">멈추기</button><select id="direction">${facings.map(d=>`<option value="${d}">${{down:'앞',up:'뒤',left:'왼쪽',right:'오른쪽'}[d]}</option>`).join('')}</select></nav><main>${motionCards.join('')}${books.join('')}</main><script>const sequences=${JSON.stringify(sequences)},elapsed=sequences.map(()=>0);let running=!matchMedia('(prefers-reduced-motion: reduce)').matches;const sel=document.getElementById('direction'),play=document.getElementById('play');function update(){document.querySelectorAll('[data-seq]').forEach(el=>{const i=+el.dataset.seq,s=sequences[i],frames=s.views[sel.value]||s.views.down,d=frames[0].duration,phase=frames[0].loop?Math.floor(elapsed[i]/d)%4:Math.min(3,Math.floor(elapsed[i]/d));el.src=frames[phase].file});play.textContent=running?'멈추기':'재생'}document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>document.querySelectorAll('article').forEach(a=>a.hidden=b.dataset.filter!=='all'&&a.dataset.group!==b.dataset.filter));document.querySelectorAll('[data-replay]').forEach(b=>b.onclick=()=>{elapsed[+b.dataset.replay]=0;update()});sel.onchange=()=>{elapsed.fill(0);update()};play.onclick=()=>{running=!running;update()};setInterval(()=>{if(running){elapsed.forEach((_,i)=>elapsed[i]+=100);update()}},100);update()</script></html>`)
console.log(`생활 동작 ${motionIndex}종 × 4방향, 기념물 6종, 책 장식 4종 × 6색 → ${out}`)

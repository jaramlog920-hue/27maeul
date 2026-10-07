import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { draw,png } from './pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return n(url,c)}})
const pair=await import('../src/render/paired-event-art.ts'),completion=await import('../src/render/completion-celebration-art.ts'),archive=await import('../src/render/archive-followup-art.ts')
const out='assets/paired-events',sequences=[]
for(const folder of ['gifts','memorials','completion'])fs.mkdirSync(`${out}/${folder}`,{recursive:true})
function save(file,w,h,layers){const p=new Uint8Array(w*h*4);for(const [rows,pal]of layers)draw(p,w,rows,pal);png(`${out}/${file}`,w,h,p);return file}
function canvas(w,h){const p=new Uint8Array(w*h*4);for(let i=0;i<p.length;i+=4)p.set([246,237,218,255],i);return p}
const pairSheet=canvas(768,864),completionSheet=canvas(1024,224),examples=[0,3,5,7]
let index=0
function exportPair(group,id,label,make){
 const views={}
 for(const direction of pair.PAIRED_DIRECTIONS)views[direction]=Array.from({length:8},(_,f)=>{
  const a=make(f,direction),stem=`${group}/${id}-${direction}-${f}`
  const layers=[[a.propBack,pair.PAIRED_EVENT_PALETTE],...a.actors.map(actor=>[actor.rows,actor.palette]),[a.propFront,pair.PAIRED_EVENT_PALETTE]],split={}
  for(const [i,key]of ['back','first','second','front'].entries())split[key]=save(`${stem}-${key}.png`,a.width,a.height,[layers[i]])
  if(direction==='right'&&examples.includes(f))for(const [rows,pal]of layers)draw(pairSheet,768,rows,pal,examples.indexOf(f)*192,index*96,3)
  return {file:save(`${stem}.png`,a.width,a.height,layers),width:a.width,height:a.height,duration:a.duration,loop:a.loop,beat:a.beat,actors:a.actors.map(({id,anchor})=>({id,anchor})),hands:a.hands,object:a.object,layers:split}
 })
 sequences.push({group,id,label,views});index++
}
for(const gift of pair.PAIRED_GIFTS)exportPair('gifts',gift,pair.PAIRED_GIFT_LABELS[gift],(f,d)=>pair.pairedGiftFrame(gift,f,undefined,undefined,d))
for(const kind of archive.EVENT_MEMORIES)exportPair('memorials',kind,`${archive.EVENT_MEMORY_LABELS[kind]} 함께 놓기`,(f,d)=>pair.pairedMemorialFrame(kind,f,undefined,undefined,d))
const frames=Array.from({length:8},(_,f)=>{
 const a=completion.completionSceneFrame(f),stem=`completion/all-books-${f}`,layers=[[a.propBack,completion.COMPLETION_PALETTE],...a.actors.map(actor=>[actor.rows,actor.palette]),[a.propFront,completion.COMPLETION_PALETTE]],split={}
 for(const [i,key]of ['back','writer','guest1','guest2','front'].entries())split[key]=save(`${stem}-${key}.png`,a.width,a.height,[layers[i]])
 for(const [rows,pal]of layers)draw(completionSheet,1024,rows,pal,(f%4)*256,Math.floor(f/4)*112,2)
 return {file:save(`${stem}.png`,a.width,a.height,layers),width:a.width,height:a.height,duration:a.duration,loop:a.loop,beat:a.beat,actors:a.actors.map(({id,anchor})=>({id,anchor})),shelfBookCount:a.shelfBookCount,lastBook:a.lastBook,completed:a.completed,layers:split}
})
sequences.push({group:'completion',id:'all-books',label:'27권 완필 축하',views:{right:frames}})
png(`${out}/paired-contact-sheet.png`,768,864,pairSheet);png(`${out}/completion-contact-sheet.png`,1024,224,completionSheet)
const actorPalettes=Object.fromEntries([...pair.pairedGiftFrame('book',0).actors,...completion.completionSceneFrame(0).actors].map(a=>[a.id,a.palette]))
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify({version:1,connected:false,frameCount:8,sequences,sources:['src/render/paired-event-art.ts','src/render/completion-celebration-art.ts'],palettes:{pairedProps:pair.PAIRED_EVENT_PALETTE,completionProps:completion.COMPLETION_PALETTE,actors:actorPalettes},note:'인물 레이어별 팔레트를 사용한다. 좌우 반전에서도 first가 주는 사람, second가 받는 사람이다. 소품은 장면 전체에 한 번만 그리며 마지막 자세에서 멈춘다. 이벤트 판정·보상·일과·저장은 연결하지 않았다.'},null,2))
const cards=sequences.map((s,i)=>{const a=s.views.right[0];return `<article data-group="${s.group}"><h3>${s.label}</h3><img data-seq="${i}" src="${a.file}" width="${a.width*4}" height="${a.height*4}" alt="${s.label}"><p data-beat="${i}">${a.beat}</p><button data-replay="${i}">다시 보기</button></article>`})
fs.writeFileSync(`${out}/preview.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>함께하는 이벤트·27권 완필 축하</title><style>body{font:15px system-ui;background:#f6edda;color:#493729;margin:24px}nav{position:sticky;top:0;background:#f6edda;padding:10px 0;z-index:1}main{display:flex;gap:14px;flex-wrap:wrap}article{background:#e3d8c2;padding:16px;border-radius:8px}article[hidden]{display:none}img{image-rendering:pixelated;object-fit:contain;max-width:100%;height:auto}h3{font-size:15px}button,select{font:inherit;margin:4px;padding:6px}p{font-size:13px}</style><h1>함께하는 이벤트·27권 완필 축하</h1><p>선물 3종·기념물 6종·완필 축하. 각 8프레임, 끝 자세 유지. 인물 두 명과 공유 물건은 분리 레이어입니다.</p><nav><button data-filter="all">전체</button><button data-filter="gifts">선물 주고받기</button><button data-filter="memorials">기념물 함께 놓기</button><button data-filter="completion">27권 축하</button><button id="play">멈추기</button><button id="replay">전체 다시 보기</button><select id="direction"><option value="right">주는 사람 왼쪽</option><option value="left">주는 사람 오른쪽</option></select></nav><main>${cards.join('')}</main><script>const sequences=${JSON.stringify(sequences)},elapsed=sequences.map(()=>0);let running=!matchMedia('(prefers-reduced-motion: reduce)').matches;const sel=document.getElementById('direction'),play=document.getElementById('play');function update(){document.querySelectorAll('[data-seq]').forEach(el=>{const i=+el.dataset.seq,s=sequences[i],frames=s.views[sel.value]||s.views.right,phase=Math.min(7,Math.floor(elapsed[i]/frames[0].duration));el.src=frames[phase].file;document.querySelector('[data-beat="'+i+'"]').textContent=frames[phase].beat});play.textContent=running?'멈추기':'재생'}document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>document.querySelectorAll('article').forEach(a=>a.hidden=b.dataset.filter!=='all'&&a.dataset.group!==b.dataset.filter));document.querySelectorAll('[data-replay]').forEach(b=>b.onclick=()=>{elapsed[+b.dataset.replay]=0;running=true;update()});sel.onchange=()=>{elapsed.fill(0);update()};play.onclick=()=>{running=!running;update()};document.getElementById('replay').onclick=()=>{elapsed.fill(0);running=true;update()};setInterval(()=>{if(running){elapsed.forEach((_,i)=>elapsed[i]+=60);update()}},60);update()</script></html>`)
console.log(`짝 동작 ${index}종 × 좌우 2배치 × 8프레임, 완필 축하 8프레임 → ${out}`)

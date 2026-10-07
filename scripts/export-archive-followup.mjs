import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { draw,png } from './pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return n(url,c)}})
const art=await import('../src/render/archive-followup-art.ts')
const {VISITOR_KINDS,VISITOR_LABELS}=await import('../src/render/village-followup-art.ts')
const {OT_ROOMS}=await import('../src/engine/ot-books.ts')
const {BG_ART,BG_PALETTE}=await import('../src/render/bg-materials-art.ts')
const out='assets/archive-followup',facings=['down','up','left','right'],visitors=[],paths=[],memories=[],shelves=[],gifts=[]
for(const group of ['visitors','paths','memories','shelves','gifts'])fs.mkdirSync(`${out}/${group}`,{recursive:true})
function save(file,w,h,rows,palette){const p=new Uint8Array(w*h*4);draw(p,w,rows,palette);png(`${out}/${file}`,w,h,p);return file}
const sheet=new Uint8Array(768*1000*4)
for(let i=0;i<sheet.length;i+=4)sheet.set([246,237,218,255],i)
for(const [i,kind]of VISITOR_KINDS.entries()){
 const views={}
 for(const [j,facing]of facings.entries())views[facing]=[0,1,2,3].map(f=>{
  const a=art.visitorWalkFrame(kind,facing,f)
  if(f===1)draw(sheet,768,a.actor,a.palette,j*120,i*96,4)
  return {file:save(`visitors/${kind}-${facing}-${f}.png`,24,24,a.actor,a.palette),width:24,height:24,anchor:a.anchor,duration:a.duration,loop:a.loop}
 })
 visitors.push({id:kind,label:VISITOR_LABELS[kind],views})
}
for(const [i,material]of ['sand','stone'].entries())for(let mask=0;mask<16;mask++){
 const rows=art.joinedPathRows(material,mask),file=save(`paths/${material}-${mask}.png`,16,16,rows,art.JOIN_PATH_PALETTE)
 paths.push({id:`${material}-${mask}`,material,mask,label:art.pathShapeLabel(mask),file,width:16,height:16,edges:{north:!!(mask&1),east:!!(mask&2),south:!!(mask&4),west:!!(mask&8)}})
 draw(sheet,768,rows,art.JOIN_PATH_PALETTE,(mask%8)*80,400+i*150+Math.floor(mask/8)*64,4)
}
const road=new Set(['0,0','1,0','2,0','0,1','2,1','0,2','1,2','2,2','3,2','4,2','2,3','4,3','2,4','4,4'])
for(const material of ['sand','stone']){
 const demo=new Uint8Array(80*80*4)
 for(let y=0;y<5;y++)for(let x=0;x<5;x++){
  draw(demo,80,BG_ART.grass,BG_PALETTE,x*16,y*16)
  if(road.has(`${x},${y}`)){
   let mask=0;for(const [dx,dy,bit]of [[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]])if(road.has(`${x+dx},${y+dy}`))mask|=bit
   draw(demo,80,art.joinedPathRows(material,mask),art.JOIN_PATH_PALETTE,x*16,y*16)
  }
 }
 png(`${out}/paths/${material}-joined-example.png`,80,80,demo)
}
for(const [i,kind]of art.EVENT_MEMORIES.entries()){
 const frames=[0,1,2,3].map(f=>({file:save(`memories/${kind}-${f}.png`,16,16,art.eventMemoryRows(kind,f),art.ARCHIVE_PROP_PALETTE),width:16,height:16,anchor:{x:8,y:16},duration:500,loop:true}))
 memories.push({id:kind,label:art.EVENT_MEMORY_LABELS[kind],frames})
 draw(sheet,768,art.eventMemoryRows(kind),art.ARCHIVE_PROP_PALETTE,i*112+20,720,4)
}
for(const [i,kind]of art.RANGE_SHELVES.entries()){
 const fills=Array.from({length:13},(_,fill)=>({fill,file:save(`shelves/${kind}-${fill}.png`,16,16,art.rangeShelfRows(kind,fill),art.ARCHIVE_PROP_PALETTE),width:16,height:16,anchor:{x:8,y:16}}))
 shelves.push({id:kind,label:OT_ROOMS.find(r=>r.id===kind).label,capacity:12,fills})
 draw(sheet,768,art.rangeShelfRows(kind,12),art.ARCHIVE_PROP_PALETTE,i*112+20,824,5)
}
for(const [i,id]of art.GUEST_GIFT_IDS.entries()){
 const sizes={};for(const size of [8,16])sizes[size]=save(`gifts/${id}-${size}.png`,size,size,art.guestGiftIconRows(id,size),art.ARCHIVE_PROP_PALETTE)
 gifts.push({id,label:art.GIFT_LABELS[id],sizes})
 draw(sheet,768,art.guestGiftIconRows(id,16),art.ARCHIVE_PROP_PALETTE,480+i*88,824,5)
}
png(`${out}/contact-sheet.png`,768,1000,sheet)
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify({version:1,connected:false,tileSize:16,visitors,paths,memories,shelves,gifts,pathMask:art.PATH_BITS,palettes:{paths:art.JOIN_PATH_PALETTE,props:art.ARCHIVE_PROP_PALETTE},source:'src/render/archive-followup-art.ts',completedGuestAssets:'../settlement-guests/manifest.json',note:'자산 전용. 방문객 이동·꾸미기 길·기념물 배치·범위 방 책장·아이콘 연결·입주 일과는 별도.'},null,2))
const groups={all:'전체',visitors:'서고 방문객 걸음',paths:'길 이음',memories:'사건별 기념물',shelves:'범위 방 책장',gifts:'손님 선물'}
const cards=visitors.map((v,i)=>`<article data-group="visitors"><h3>${v.label}</h3><img data-visitor="${i}" src="${v.views.down[0].file}" width="144" height="144" alt="${v.label} 걷기"></article>`)
 .concat(['sand','stone'].map(m=>`<article data-group="paths"><h3>${m==='sand'?'모래 길':'돌바닥 길'} 연결 예</h3><img src="paths/${m}-joined-example.png" width="320" height="320" alt="${m==='sand'?'모래':'돌'} 길 연결 예"></article>`))
 .concat(paths.map(p=>`<article data-group="paths"><h3>${p.material==='sand'?'모래':'돌'} · ${p.label}</h3><img src="${p.file}" width="96" height="96" alt="${p.label}"><p>${Object.entries(p.edges).filter(([,v])=>v).map(([d])=>({north:'위',east:'오른쪽',south:'아래',west:'왼쪽'}[d])).join(' · ')||'연결 없음'}</p></article>`))
 .concat(memories.map((m,i)=>`<article data-group="memories"><h3>${m.label}</h3><img data-memory="${i}" src="${m.frames[0].file}" width="96" height="96" alt="${m.label} 기념물"></article>`))
 .concat(shelves.map(s=>`<article data-group="shelves"><h3>${s.label}</h3>${[0,4,8,12].map(fill=>`<figure><img src="${s.fills[fill].file}" width="80" height="80" alt="${s.label} ${fill}칸"><figcaption>${fill}/12</figcaption></figure>`).join('')}</article>`))
 .concat(gifts.map(g=>`<article data-group="gifts"><h3>${g.label}</h3><figure><img src="${g.sizes[8]}" width="80" height="80" alt="${g.label} 작은 아이콘"><figcaption>8×8</figcaption></figure><figure><img src="${g.sizes[16]}" width="96" height="96" alt="${g.label} 상세 아이콘"><figcaption>16×16</figcaption></figure></article>`))
fs.writeFileSync(`${out}/preview.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>서고·길·기억 정원 후속 도트</title><style>body{font:15px system-ui;background:#f6edda;color:#493729;margin:24px}nav{position:sticky;top:0;background:#f6edda;padding:12px 0}main{display:flex;gap:14px;flex-wrap:wrap}article{background:#e3d8c2;padding:16px;border-radius:8px}article[hidden]{display:none}img{image-rendering:pixelated;object-fit:contain}figure{display:inline-block;margin:8px;text-align:center}figcaption,p{font-size:12px}button,select{font:inherit;padding:8px;margin:4px}</style><h1>서고 방문객·길 이음·기념물·범위 책장·선물</h1><p>게임 연결 없이 자산만 준비했습니다. 기존 <a href="../settlement-guests/preview.html">넬리·모리스·아이비 도트</a>와 <a href="../life-additions/preview.html">입주 장면 모션</a>도 준비되어 있습니다.</p><nav>${Object.entries(groups).map(([id,label])=>`<button data-filter="${id}">${label}</button>`).join('')}<button id="play">멈추기</button><select id="facing">${facings.map(f=>`<option value="${f}">${{down:'앞',up:'뒤',left:'왼쪽',right:'오른쪽'}[f]}</option>`).join('')}</select></nav><main>${cards.join('')}</main><script>const visitors=${JSON.stringify(visitors)},memories=${JSON.stringify(memories)};let playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,t=0;const play=document.getElementById('play'),facing=document.getElementById('facing');function update(){document.querySelectorAll('[data-visitor]').forEach(el=>el.src=visitors[+el.dataset.visitor].views[facing.value][Math.floor(t/180)%4].file);document.querySelectorAll('[data-memory]').forEach(el=>el.src=memories[+el.dataset.memory].frames[Math.floor(t/500)%4].file);play.textContent=playing?'멈추기':'재생'}document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>document.querySelectorAll('article').forEach(a=>a.hidden=b.dataset.filter!=='all'&&a.dataset.group!==b.dataset.filter));play.onclick=()=>{playing=!playing;update()};facing.onchange=update;setInterval(()=>{if(playing){t+=60;update()}},60);update()</script></html>`)
console.log(`방문객 4종 걸음 / 길 이음 32개 / 기념물 6종 / 책장 4종 13단계 / 선물 3종 2크기 → ${out}`)

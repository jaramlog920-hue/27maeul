import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { draw,png } from './pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return n(url,c)}})
const {withLookDefaults,HAIR_BACKS}=await import('../src/engine/avatar.ts'),{spriteRows,writerPalette,PALETTE}=await import('../src/render/sprites.ts'),{VISITOR_LOOKS,VISITOR_LABELS}=await import('../src/render/village-followup-art.ts'),{SETTLEMENT_GUESTS}=await import('../src/render/settlement-guests-art.ts')
const out='assets/side-hair',neighbors=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8')),samples=[]
fs.mkdirSync(out,{recursive:true})
for(const [hairBack,label]of HAIR_BACKS.entries())for(const stage of ['adult','child','elder'])samples.push({id:`style-${hairBack}-${stage}`,group:'styles',label,stage,who:'writer',avatar:withLookDefaults({look:'f',name:'옆머리 예시',hairFront:0,hairBack,top:13,bottom:2,acc:0}),short:stage==='child'?0:undefined,elder:stage==='elder'})
for(const def of neighbors)for(const stage of ['adult','elder']){
 const avatar=def.avatar&&def.look?withLookDefaults({look:def.look,name:def.role,...def.avatar}):undefined
 samples.push({id:`resident-${def.id}-${stage}`,group:'residents',label:def.role,stage,who:avatar?'writer':def.sprite,avatar,growth:3,elder:stage==='elder'})
}
for(const [id,avatar]of Object.entries(VISITOR_LOOKS))samples.push({id:`visitor-${id}`,group:'visitors',label:VISITOR_LABELS[id],stage:'adult',who:'writer',avatar,short:id==='kid'?0:undefined})
for(const [id,def]of Object.entries(SETTLEMENT_GUESTS))samples.push({id:`guest-${id}`,group:'guests',label:def.label,stage:def.elder?'elder':'adult',who:'writer',avatar:def.avatar,elder:def.elder})
const make=(s,d,frame=0)=>spriteRows(s.who,d,{frame,blink:false,avatar:s.avatar,short:s.short,elder:s.elder,growth:s.growth}),palette=s=>s.avatar?writerPalette('spring',s.avatar):PALETTE
if(process.argv.includes('--before')){
 if(fs.existsSync(`${out}/before.json`))throw Error('기존 비교 원본은 덮어쓰지 않습니다')
 fs.writeFileSync(`${out}/before.json`,JSON.stringify(samples.map(s=>({id:s.id,palette:palette(s),rows:Object.fromEntries(['down','up','left','right'].map(d=>[d,make(s,d)]))})),null,2))
 console.log(`옆머리 수정 전 ${samples.length}외형 저장`)
}else{
 const before=JSON.parse(fs.readFileSync(`${out}/before.json`,'utf8')),byId=new Map(before.map(s=>[s.id,s])),sequences=[]
 function save(file,rows,pal){const w=rows[0].length,h=rows.length,p=new Uint8Array(w*h*4);draw(p,w,rows,pal);png(`${out}/${file}`,w,h,p);return file}
 function sheet(w,h){const p=new Uint8Array(w*h*4);for(let i=0;i<p.length;i+=4)p.set([246,237,218,255],i);return p}
 for(const s of samples){
  const views={};for(const d of ['left','right'])views[d]=[0,1,2].map(f=>({file:save(`${s.id}-${d}-${f}.png`,make(s,d,f),palette(s)),width:10,height:make(s,d,f).length,duration:200}))
  const old=byId.get(s.id);if(!old)throw Error(`비교 원본 없음: ${s.id}`)
  sequences.push({...s,views,before:save(`${s.id}-before.png`,old.rows.right,old.palette),palette:palette(s)})
 }
 const styles=sheet(550,HAIR_BACKS.length*92)
 for(let i=0;i<HAIR_BACKS.length;i++){
  const adult=samples.find(s=>s.id===`style-${i}-adult`),old=byId.get(adult.id),y=i*92+14
  draw(styles,550,old.rows.right,old.palette,20,y,5);draw(styles,550,make(adult,'right'),palette(adult),130,y,5);draw(styles,550,make(adult,'left'),palette(adult),240,y,5)
  for(const [j,stage]of ['child','elder'].entries()){const s=samples.find(s=>s.id===`style-${i}-${stage}`),rows=make(s,'right');draw(styles,550,rows,palette(s),350+j*110,y+(14-rows.length)*5,5)}
 }
 png(`${out}/styles-before-after.png`,550,HAIR_BACKS.length*92,styles)
 const actual=samples.filter(s=>s.group!=='styles'&&(s.group!=='residents'||s.stage==='adult')),people=sheet(768,Math.ceil(actual.length/4)*92)
 for(const [i,s]of actual.entries()){const old=byId.get(s.id),x=(i%4)*192,y=Math.floor(i/4)*92+14,rows=make(s,'right');draw(people,768,old.rows.right,old.palette,x+20,y+(14-old.rows.right.length)*5,5);draw(people,768,rows,palette(s),x+110,y+(14-rows.length)*5,5)}
 png(`${out}/residents-before-after.png`,768,Math.ceil(actual.length/4)*92,people)
 fs.writeFileSync(`${out}/manifest.json`,JSON.stringify({version:1,sources:['src/render/side-hair-details.ts','src/render/character-details.ts','src/render/sprites.ts'],sequences,note:'도트 원본 수정과 좌우 서기·걷기 PNG. 앞·뒤 모습과 외형 선택 번호는 유지. 각 프레임의 원본 높이가 다르므로 바닥을 맞춰 그린다.'},null,2))
 const cards=sequences.map((s,i)=>`<article data-group="${s.group}"><h3>${s.label} · ${{adult:'성인',child:'아이',elder:'노인'}[s.stage]}</h3><section><figure><img src="${s.before}" alt="수정 전"><figcaption>수정 전</figcaption></figure><figure><img data-sample="${i}" data-facing="right" src="${s.views.right[0].file}" alt="보강한 오른쪽"><figcaption>보강한 오른쪽</figcaption></figure><figure><img data-sample="${i}" data-facing="left" src="${s.views.left[0].file}" alt="보강한 왼쪽"><figcaption>보강한 왼쪽</figcaption></figure></section></article>`)
 fs.writeFileSync(`${out}/preview.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>옆모습 뒷머리 보강</title><style>body{font:15px system-ui;background:#f6edda;color:#493729;margin:24px}nav{position:sticky;top:0;background:#f6edda;padding:10px;z-index:1}main{display:flex;gap:12px;flex-wrap:wrap}article{background:#e3d8c2;padding:14px;border-radius:8px}article[hidden]{display:none}section{display:flex;gap:20px;align-items:end}figure{margin:0;text-align:center}img{image-rendering:pixelated;width:60px;height:auto}h3{font-size:15px}figcaption{font-size:12px;margin-top:8px}button{font:inherit;padding:7px;margin:4px}</style><h1>옆모습 뒷머리 보강</h1><p>11가지 뒷머리의 끝선·결·그늘, 실제 주민과 방문객·손님 외형. 원본 10px 폭을 유지했습니다.</p><nav><button data-filter="styles">머리 11종·아이·노년</button><button data-filter="residents">주민 23명·노년</button><button data-filter="visitors">서고 방문객</button><button data-filter="guests">입주 손님</button><button id="play">걷기 재생</button></nav><main>${cards.join('')}</main><script>const sequences=${JSON.stringify(sequences)};let running=false,f=0;function update(){document.querySelectorAll('[data-sample]').forEach(img=>img.src=sequences[+img.dataset.sample].views[img.dataset.facing][running?[0,1,0,2][f]:0].file);document.getElementById('play').textContent=running?'걷기 멈추기':'걷기 재생'}document.getElementById('play').onclick=()=>{running=!running;f=0;update()};document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>document.querySelectorAll('article').forEach(a=>a.hidden=a.dataset.group!==b.dataset.filter));setInterval(()=>{if(running){f=(f+1)%4;update()}},200);document.querySelector('[data-filter="styles"]').click()</script></html>`)
 console.log(`옆머리 ${sequences.length}외형 × 좌우 × 3프레임 → ${out}`)
}

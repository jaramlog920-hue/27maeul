import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {registerHooks} from 'node:module'
import {png} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {COPY_FURNITURE}=await import('../../src/engine/copy-furniture.ts')
const {COPY_FURNITURE_ACTION}=await import('../../src/render/copy-furniture-art.ts')
const {copyFurnitureUseFrame}=await import('../../src/render/copy-furniture-motion.ts')
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
const {copyFurnitureFacings,copyFurnitureChildStage}=await import('../../src/engine/copy-furniture-views.ts')
const out='public/assets/furniture/copy-collection'
fs.mkdirSync(out,{recursive:true})
const sources=['src/render/copy-furniture-art.ts','src/render/copy-furniture-motion.ts','src/render/pet-art.ts','src/render/newborn-art.ts','src/render/sprites.ts','src/engine/copy-furniture.ts','src/engine/copy-furniture-views.ts','src/engine/copy-furniture-defs.ts']
const sourceHashes=Object.fromEntries(sources.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]))
const version=crypto.createHash('sha256').update(JSON.stringify(sourceHashes)).digest('hex').slice(0,12)
const manifest=[],sheets=[]
function pixel(dst,W,x,y,c){if(x<0||y<0||x>=W||y>=dst.length/W/4)return;let rgba;if(c.startsWith('#'))rgba=c.slice(1).match(/../g).map(s=>parseInt(s,16)).concat(255);else if(c.startsWith('rgba')){const a=c.match(/[\d.]+/g).map(Number);rgba=[...a.slice(0,3),Math.round(a[3]*255)]}else throw Error(c);const i=(y*W+x)*4,alpha=rgba[3]/255;for(let k=0;k<3;k++)dst[i+k]=Math.round(rgba[k]*alpha+dst[i+k]*(1-alpha));dst[i+3]=255}
function draw(dst,W,scene,x,y){for(const layer of scene.layers)layer.rows.forEach((r,yy)=>[...r].forEach((ch,xx)=>{if(ch!=='.'){if(!layer.palette[ch])throw Error(`Missing palette ${ch}`);pixel(dst,W,x+xx,y+yy,layer.palette[ch])}}))}
for(const item of COPY_FURNITURE){
 const variants=[],facings=copyFurnitureFacings(item.id)
 for(const variant of (item.category==='pet'?['example','empty','alternate','catadult','dogbaby']:['example','empty','alternate'])){
  const avatar=withLookDefaults({name:'미리보기 기록자',look:variant==='alternate'?'m':'f',skin:variant==='alternate'?3:1,top:variant==='alternate'?8:2,hairBack:variant==='alternate'?0:3})
  const opts={actor:{avatar,frame:0},season:variant==='alternate'?'winter':'spring',...(variant==='empty'?{}:{child:{avatar:withLookDefaults({name:'미리보기 아이',look:variant==='alternate'?'m':'f',skin:avatar.skin,top:4,hairBack:1}),stage:copyFurnitureChildStage(item.id),dressed:variant==='alternate'},pet:{kind:variant==='alternate'||variant==='dogbaby'?'dog':'cat',baby:variant==='example'||variant==='dogbaby'}})}
  const W=384,H=96*facings.length,dst=new Uint8Array(W*H*4)
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)pixel(dst,W,x,y,y%96<64?'#f3eadb':'#dcc6a6')
  facings.forEach((f,d)=>{for(let phase=0;phase<4;phase++)draw(dst,W,copyFurnitureUseFrame(item.id,f,phase,opts),phase*96,d*96)})
  const file=`${out}/${item.id}-${variant}.png`
  png(file,W,H,dst)
  variants.push({variant,file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')})
  sheets.push({item,dst,variant,facings})
 }
 manifest.push({...item,facings,action:COPY_FURNITURE_ACTION[item.id],variants})
}
for(const variant of ['example','empty','alternate'])for(let batch=0;batch<8;batch++){
 const chosen=sheets.filter(s=>s.variant===variant).slice(batch*5,batch*5+5)
 const W=960,H=chosen.reduce((n,s)=>n+s.facings.length,0)*56*3,dst=new Uint8Array(W*H*4)
 let row=0
 for(const sheet of chosen){for(let dir=0;dir<sheet.facings.length;dir++){
  for(let phase=0;phase<4;phase++)for(let y=0;y<56;y++)for(let x=0;x<80;x++){const at=((dir*96+24+y)*384+phase*96+8+x)*4,c=sheet.dst.slice(at,at+4);for(let sy=0;sy<3;sy++)for(let sx=0;sx<3;sx++)dst.set(c,(((row*56+y)*3+sy)*W+(phase*80+x)*3+sx)*4)}row++
 }}
 png(`artifacts/scenery/copy-furniture-review-${variant==='example'?'':variant+'-'}${batch+1}.png`,W,H,dst)
}
for(const variant of ['catadult','dogbaby']){
 const chosen=sheets.filter(s=>s.variant===variant),W=960,H=chosen.length*56*3,dst=new Uint8Array(W*H*4)
 chosen.forEach((sheet,row)=>{for(let phase=0;phase<4;phase++)for(let y=0;y<56;y++)for(let x=0;x<80;x++){
  const at=((24+y)*384+phase*96+8+x)*4,c=sheet.dst.slice(at,at+4)
  for(let sy=0;sy<3;sy++)for(let sx=0;sx<3;sx++)dst.set(c,(((row*56+y)*3+sy)*W+(phase*80+x)*3+sx)*4)
 }})
 png(`artifacts/scenery/copy-furniture-review-${variant}.png`,W,H,dst)
}
fs.writeFileSync('artifacts/scenery/copy-furniture-manifest.json',JSON.stringify({generatedAt:new Date().toISOString(),version,note:'Only supported furniture views. Generated, not automatically visually reviewed. Examples are not user saves.',sourceHashes,items:manifest},null,2))
const data=manifest.map(({id,name,category,action,facings,variants})=>({id,name,category,action,facings,variants:variants.map(v=>v.variant)}))
const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>필사 수집 가구 40종 · 수정 모음</title><style>body{font:16px/1.6 system-ui;background:#eee4d4;color:#3b3028;margin:20px}header{position:sticky;top:0;background:#eee4d4ef;padding:10px;z-index:1}h1{font-size:23px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px}article{padding:14px;background:#fff8ec;border-radius:12px}h2{font-size:17px}canvas{width:100%;image-rendering:pixelated;display:block}button,select,input{font:inherit;margin:4px}small{display:block}a{color:#70503d}</style><header><h1>필사 수집 가구 40종 · 비율/배치 수정 모음</h1><p>유아 5종 → 어린이 5종 → 나머지 30종 · 최초 장 완성 시 25%<br>38종은 정면 고정, 긴 낮잠자리·칸막이만 가로/세로 배치. 이유식상은 신생아가 아닌 걷는 유아 예시입니다.<br>가족·외형은 비교용 예시이며 저장·보상·앨범을 변경하지 않습니다.</p><label>보기 <select id="direction"><option value="cycle">가능한 방향만 자동</option><option value="front">정면</option><option value="side">옆면이 필요한 가구만</option></select></label><label>외형/가족 <select id="variant"><option value="example">기본 외형 · 단계에 맞는 아이/고양이</option><option value="alternate">다른 외형 · 옷장 아이/강아지</option><option value="empty">가족 없음 · 준비/정리</option></select></label><label>반려동물 <select id="petVariant"><option value="auto">외형 구성에 맞춤</option><option value="example">아기 고양이</option><option value="catadult">성체 고양이</option><option value="dogbaby">아기 강아지</option><option value="alternate">성체 강아지</option></select></label><button id="pause">일시정지</button><label>단계 <input id="phase" type="range" min="0" max="3" value="0"></label><span id="status"></span></header><main></main><script>
const items=${JSON.stringify(data)},version=${JSON.stringify(version)};let paused=false,phase=0,direction=0,last=0,variant='example';const cards=items.map((item,i)=>{const article=document.createElement('article'),h=document.createElement('h2'),c=document.createElement('canvas'),p=document.createElement('p'),small=document.createElement('small');h.textContent=(i+1)+'. '+item.name;p.textContent=item.action;small.textContent=(item.category==='infant'?'1순위 · 유아':item.category==='child'?'2순위 · 어린이':'3순위 · 생활/전시')+' · '+(item.facings.length===1?'정면 고정 · 회전 없음':'가로/세로 배치');c.width=80;c.height=56;article.append(h,c,p,small);document.querySelector('main').append(article);const images={};for(const v of item.variants){const im=new Image;im.onload=()=>paint();im.src='copy-collection/'+item.id+'-'+v+'.png?v='+version;images[v]=im}return{c,images,item}});function paint(){for(const {c,images,item}of cards){const g=c.getContext('2d'),d=item.facings.length>1?direction:0;g.imageSmoothingEnabled=false;g.clearRect(0,0,80,56);const selected=item.category==='pet'&&document.querySelector('#petVariant').value!=='auto'?document.querySelector('#petVariant').value:variant;if(images[selected].complete)g.drawImage(images[selected],phase*96+8,d*96+24,80,56,0,0,80,56)}document.querySelector('#status').textContent=(direction?'가능한 옆면':'정면')+' · '+(phase+1)+'/4';document.querySelector('#phase').value=phase}document.querySelector('#pause').onclick=()=>{paused=!paused;document.querySelector('#pause').textContent=paused?'재생':'일시정지'};document.querySelector('#phase').oninput=e=>{paused=true;document.querySelector('#pause').textContent='재생';phase=+e.target.value;paint()};document.querySelector('#petVariant').onchange=()=>paint();document.querySelector('#variant').onchange=e=>{variant=e.target.value;paint()};document.querySelector('#direction').onchange=e=>{direction=e.target.value==='side'?1:0;paint()};function tick(ms){if(!paused&&ms-last>=650){phase=(phase+1)%4;if(phase===0&&document.querySelector('#direction').value==='cycle')direction=(direction+1)%2;last=ms;paint()}requestAnimationFrame(tick)}requestAnimationFrame(tick);
</script></html>`
fs.writeFileSync('public/assets/furniture/copy-collection.html',html)
console.log(`Rendered ${manifest.length} designs; ${manifest.reduce((n,i)=>n+i.facings.length,0)} real views; 3 casts x 4 phases. Gallery version ${version}`)

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};const r=n(url,c);if(/\/(nt-loader|ot-catalog)\.ts$/.test(url))return {...r,source:String(r.source).replaceAll('import.meta.glob','(() => ({}))')};return r}})
const {png}=await import('../../scripts/pixel-png.mjs')
const {SCENES}=await import('../../src/content/text.ts')
const {CONTENT}=await import('../../src/content/catalog.ts')
const {newGenState}=await import('../../src/engine/gen.ts')
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
const {weatherOf}=await import('../../src/engine/calendar.ts')
const {SHARED_RETURN_WALK_IDS}=await import('../../src/render/shared-return-walk-art.ts')
const {sharedBackgroundSceneSnapshot,drawSharedBackgroundScene}=await import('../../src/render/shared-background-scene.ts')
const {sharedBackgroundKey}=await import('../../src/render/shared-story-background.ts')
const out='artifacts/scenery/shared-return-locations'
fs.mkdirSync(out,{recursive:true})
const day=Array.from({length:120},(_,i)=>i+1).find(d=>weatherOf(d)==='sunny')
const avatar=withLookDefaults({name:'실제 기록자',look:'f',skin:2,top:6}),gen=newGenState(CONTENT,7,day)
const fixtures=[
 {key:'tea',minute:1080,expected:'tea-front'},
 {key:'sunset',minute:1110,expected:'sunset'},
 {key:'walk',minute:940,expected:'pasture'},
 {key:'restored-home',minute:900,expected:'home'},
]
function render(file,scene,height){
 const frames=[null,avatar].flatMap(av=>SCENES[scene.id].lines.flatMap((_,beat)=>[0,.6,8].map(t=>({av,beat,t}))))
 const w=960,h=height*Math.ceil(frames.length/3),pixels=new Uint8Array(w*h*4)
 let ox=0,oy=0
 const g={fillStyle:'#000000',fillRect(x,y,a,b){
  const match=this.fillStyle.match(/^rgba?\(([^)]+)\)/),rgba=match?match[1].split(',').map(Number):this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16)),alpha=match&&rgba.length===4?rgba[3]:1
  for(let yy=Math.max(oy,y+oy);yy<Math.min(oy+height,y+oy+b);yy++)for(let xx=Math.max(ox,x+ox);xx<Math.min(ox+320,x+ox+a);xx++){
   const j=(yy*w+xx)*4;for(let k=0;k<3;k++)pixels[j+k]=Math.round(rgba[k]*alpha+pixels[j+k]*(1-alpha));pixels[j+3]=255
  }
 }}
 frames.forEach((v,i)=>{ox=i%3*320;oy=Math.floor(i/3)*height;drawSharedBackgroundScene(g,{...scene,avatar:v.av},320,height,v.t,v.beat)})
 png(file,w,h,pixels)
 if(file.endsWith('loverTrust-wendell-restored-home-phases.png')){
  const preview=new Uint8Array(w*height*2*4)
  preview.set(pixels.subarray(0,w*height*4))
  preview.set(pixels.subarray(w*height*4*4,w*height*5*4),w*height*4)
  png('artifacts/scenery/event-room-furniture-corrected.png',w,height*2,preview)
 }
 if(file.endsWith('loverTrust-wendell-sunset-phases.png')){
  const preview=new Uint8Array(w*height*2*4)
  preview.set(pixels.subarray(0,w*height*4))
  preview.set(pixels.subarray(w*height*4*4,w*height*5*4),w*height*4)
  png('artifacts/scenery/event-sunset-lawn-corrected.png',w,height*2,preview)
 }
 if(height===693){
  // A lossless crop of each rendered phone frame keeps the original scale
  // readable during local PNG review; the complete phone sheet stays available.
  const rows=Math.ceil(frames.length/3),band=96,focus=new Uint8Array(w*band*rows*4),top=Math.round(height*.54)-64
  for(let row=0;row<rows;row++)for(let y=0;y<band;y++)focus.set(pixels.subarray(((row*height+top+y)*w)*4,((row*height+top+y+1)*w)*4),((row*band+y)*w)*4)
  png(file.replace('-phone.png','-phone-focus.png'),w,band*rows,focus)
 }
 return {path:file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}
}
const entries=[]
for(const id of SHARED_RETURN_WALK_IDS)for(const f of fixtures){
 // The engine permits outings from any current tile. These are explicit review
 // examples, not a new teleport rule or proof that the event trigger fired.
 const s={avatar,gen,looks:{},player:{x:20,y:112,facing:'down',path:[],walkTime:0},clock:{day,minute:f.minute},homeLevel:0,scenes:['dateSunset',id]}
 const origin=f.key==='restored-home'?null:{place:f.key,day,partner:id.split(':')[1],map:'village',at:{x:24,y:18},minute:f.minute}
 const before=JSON.stringify(s),scene=sharedBackgroundSceneSnapshot(s,id,{dateOrigin:origin}),key=`${id.replaceAll(':','-')}-${f.key}`
 assert.ok(scene)
 assert.equal(sharedBackgroundKey(scene.location,true),f.expected)
 if(!origin){assert.equal(scene.location.datePlace,null);assert.equal(scene.location.dateSource,'unavailable');assert.deepEqual(scene.location.at,{x:20,y:112})}
 const images=[['phases',180],['phone',693],['thumb',120]].map(([kind,height])=>({kind,...render(`${out}/${key}-${kind}.png`,scene,height)}))
 const focusPath=`${out}/${key}-phone-focus.png`
 images.push({kind:'phone-focus',path:focusPath,sha256:crypto.createHash('sha256').update(fs.readFileSync(focusPath)).digest('hex')})
 assert.equal(JSON.stringify(s),before)
 entries.push({id,key,fixture:f.key,origin,at:scene.location.at,day,minute:f.minute,background:f.expected,sourceLines:SCENES[id].lines,images,visuallyReviewed:false})
}
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify({batch:'shared-background-remainder',completed:false,scope:'Explicit captured-origin and restored-queue examples. No event routing, save or browser approval.',entries},null,2)+'\n')
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
fs.writeFileSync(`${out}/index.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>같은118개 묶음 귀갓길 장소 검토</title><style>body{font:16px system-ui;max-width:1000px;margin:24px auto;background:#f6f0e2}img{max-width:100%;image-rendering:pixelated}summary{padding:12px}</style><h1>귀갓길의 실제 출처와 출처 없는 로드</h1><p>전체118개 묶음 안의 검토용 예시입니다. 같은 날·같은 상대의 명시적 출처만 사용하며 로드한 대기열로 장소를 추측하지 않습니다. 모든 원문 단계 · 기본/실제 기록자 · 0/0.6/8초. 생성은 시각 검토나 완료가 아닙니다.</p>${entries.map(e=>`<details><summary>${esc(e.id)} · ${e.fixture}</summary><ol>${e.sourceLines.map(l=>`<li>${esc(l.speaker)}: ${esc(l.text)}</li>`).join('')}</ol>${e.images.map(i=>`<p>${i.kind}</p><img loading="lazy" src="${path.basename(i.path)}">`).join('')}</details>`).join('')}</html>`)
console.log(JSON.stringify({fixtures:entries.length,images:entries.length*4,stateUnchanged:true,visuallyReviewed:false,completed:false}))

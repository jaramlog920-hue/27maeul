import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};const r=n(url,c);if(/\/(nt-loader|ot-catalog)\.ts$/.test(url))return {...r,source:String(r.source).replaceAll('import.meta.glob','(() => ({}))')};return r}})
const {png}=await import('../../scripts/pixel-png.mjs')
const {SCENES}=await import('../../src/content/text.ts')
const {REQUESTS}=await import('../../src/engine/bonds.ts')
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
const {newGenState}=await import('../../src/engine/gen.ts')
const {CONTENT}=await import('../../src/content/catalog.ts')
const {weatherOf}=await import('../../src/engine/calendar.ts')
const {PLACES}=await import('../../src/engine/world.ts')
const {BABY_DAY}=await import('../../src/engine/stories.ts')
const {sharedBackgroundSceneSnapshot,drawSharedBackgroundScene}=await import('../../src/render/shared-background-scene.ts')
const {sharedBackgroundKey}=await import('../../src/render/shared-story-background.ts')

// Explicit review fixtures at the native facility coordinates, never event routing rules.
// Completing a request may occur elsewhere; the second fixture deliberately stays away.
const sites={
 'baker:1':[1,13], 'baker:2':[5,17], 'child:1':[15,12], 'child:2':[32,14],
 'grandpa:1':[42,9], 'grandpa:2':[31,8], 'merchant:1':[21,14], 'merchant:2':[20,13],
 'smith:1':[42,20], 'smith:2':[23,11], 'shepherd:1':[9,28], 'shepherd:2':[9,28],
 'presser:1':[45,21], 'presser:2':[41,11], 'weaver:1':[38,24], 'beekeeper:1':[44,27],
}
const out='artifacts/scenery/shared-background-sites'
fs.mkdirSync(out,{recursive:true})
const avatar=withLookDefaults({name:'실제 기록자',look:'f',skin:2,top:6})
const day=Array.from({length:120},(_,i)=>i+1).find(d=>weatherOf(d)==='sunny')
assert.ok(day,'A real clear day is required for the kite/bee review fixtures.')
const gen=newGenState(CONTENT,7,day),manifest=[]
assert.deepEqual(Object.keys(sites).sort(),REQUESTS.map(r=>r.id).sort())
function render(file,scene,height){
 const frames=[null,avatar].flatMap(av=>SCENES[scene.id].lines.flatMap((_,beat)=>[0,.6,8].map(t=>({av,beat,t}))))
 const cw=320,cols=3,w=cw*cols,h=height*Math.ceil(frames.length/cols),pixels=new Uint8Array(w*h*4)
 let ox=0,oy=0
 const g={fillStyle:'#000000',fillRect(x,y,a,b){
  const match=this.fillStyle.match(/^rgba?\(([^)]+)\)/),rgba=match?match[1].split(',').map(Number):this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16))
  const alpha=match&&rgba.length===4?rgba[3]:1
  for(let yy=Math.max(oy,y+oy);yy<Math.min(oy+height,y+oy+b);yy++)for(let xx=Math.max(ox,x+ox);xx<Math.min(ox+cw,x+ox+a);xx++){
   const j=(yy*w+xx)*4;for(let k=0;k<3;k++)pixels[j+k]=Math.round(rgba[k]*alpha+pixels[j+k]*(1-alpha));pixels[j+3]=255
  }
 }}
 frames.forEach((v,i)=>{ox=i%cols*cw;oy=Math.floor(i/cols)*height;drawSharedBackgroundScene(g,{...scene,avatar:v.av},cw,height,v.t,v.beat)})
 png(file,w,h,pixels)
 return {path:file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}
}
for(const request of REQUESTS){
 const id=`done:${request.id}`,at=sites[request.id]
 const fixtures=[{suffix:'site',fixture:'native-facility-coordinate',at},{suffix:'away',fixture:'explicit-away-meeting',at:[24,18]}]
 if(request.id==='baker:2')for(const [suffix,point] of [['site',at],['away',[24,18]]])fixtures.push({suffix:`baby-present-${suffix}`,fixture:`birth-day-${suffix}`,at:point,day:BABY_DAY})
 const work=request.id==='presser:1'?PLACES.press.stand:request.id==='smith:1'?PLACES.anvil.stand:null
 if(work)fixtures.push({suffix:'workplace',fixture:'actual-relocated-workstation',at:[work.x,work.y]})
 for(const fixture of fixtures){
  const [x,y]=fixture.at,flags={[`unlock:${request.unlock}`]:1,[`req:${request.id}`]:2,villageLevel:4}
  // Lanterns receive a real night clock; all other fixtures use a clear daytime example.
  const state={avatar,gen,looks:{},homeLevel:0,flags,map:'village',player:{x,y,facing:'down',path:[],walkTime:0},clock:{day:fixture.day??day,minute:request.unlock==='lanterns'?1300:900}}
  const before=JSON.stringify(state),scene=sharedBackgroundSceneSnapshot(state,id)
  assert.ok(scene,id)
  if(fixture.day===BABY_DAY)assert.ok(scene.baby,'The real birth-day fixture must use the shared user-baby body.')
  assert.deepEqual(scene.location.at,{x,y})
  assert.equal(scene.location.layout.unlocks[`unlock:${request.unlock}`],1)
  if(work&&fixture.suffix==='workplace')assert.equal(scene.location.room.owner,'lodging')
  const key=`${id.replaceAll(':','-')}-${fixture.suffix}`
  const images=[['phases',180],['phone',693],['thumb',120]].map(([kind,height])=>({kind,...render(`${out}/${key}-${kind}.png`,scene,height)}))
  assert.equal(JSON.stringify(state),before,`${id}: source state mutated`)
  manifest.push({id,key,fixture:fixture.fixture,at:{x,y},day:state.clock.day,babyPresent:!!scene.baby,minute:state.clock.minute,weather:scene.location.weather,room:scene.location.room,unlock:request.unlock,background:sharedBackgroundKey(scene.location),sourceLines:SCENES[id].lines,images,visuallyReviewed:false})
 }
}
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify({batch:'shared-background-remainder',completed:false,scope:'Explicit native-site and away fixtures only; no forced game location and no browser approval.',entries:manifest},null,2)+'\n')
fs.writeFileSync(`${out}/index.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>공유 배경 실제 시설 문맥 검토</title><style>body{font:16px system-ui;max-width:1000px;margin:24px auto;background:#f6f0e2}img{max-width:100%;image-rendering:pixelated}summary{padding:12px}</style><h1>같은118개 묶음의 시설·현재 위치 검토</h1><p>원본 시설 좌표와 떨어진 만남을 명시한 읽기 전용 예시입니다. 직업으로 게임 위치를 강제하지 않습니다. 생성은 시각 검토나 완료 등록이 아닙니다. 기본/실제 기록자 · 원문 전체 단계 · 0/0.6/8초.</p>${manifest.map(e=>`<details><summary>${escape(e.id)} · ${e.fixture} (${e.at.x},${e.at.y})</summary><ol>${e.sourceLines.map(l=>`<li>${escape(l.speaker)}: ${escape(l.text)}</li>`).join('')}</ol>${e.images.map(i=>`<p>${i.kind}</p><img loading="lazy" src="${path.basename(i.path)}">`).join('')}</details>`).join('')}</html>`)
console.log(JSON.stringify({batch:'shared-background-remainder',fixtures:manifest.length,images:manifest.length*3,stateUnchanged:true,visuallyReviewed:false,preview:`${out}/index.html`}))

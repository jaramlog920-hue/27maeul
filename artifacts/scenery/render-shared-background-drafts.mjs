import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};const r=n(url,c);if(/\/(nt-loader|ot-catalog)\.ts$/.test(url))return {...r,source:String(r.source).replaceAll('import.meta.glob','(() => ({}))')};return r}})
const {png}=await import('../../scripts/pixel-png.mjs')
const {SHARED_BACKGROUND_DRAFT_IDS:ids,sharedBackgroundDraftPeople,drawSharedBackgroundDraft}=await import('../../src/render/shared-background-draft-art.ts')
const {SCENES}=await import('../../src/content/text.ts'),{withLookDefaults}=await import('../../src/engine/avatar.ts'),{storyLocationContext}=await import('../../src/render/story-location-context.ts')
const neighbors=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8')),actual=withLookDefaults({name:'실제 기록자',look:'f',skin:2,top:6})
const {ROOMS}=await import('../../src/engine/world.ts'),{INTERIOR_ENTRY,ROOM_SLOTS}=await import('../../src/engine/newland-config.ts')
const {sharedBackgroundSceneSnapshot,drawSharedBackgroundScene}=await import('../../src/render/shared-background-scene.ts'),{newGenState}=await import('../../src/engine/gen.ts'),{CONTENT}=await import('../../src/content/catalog.ts')
const {newChild}=await import('../../src/engine/child.ts'),{freshStats}=await import('../../src/engine/stats.ts')
const actor=id=>{const n=neighbors.find(n=>n.id===id);return n?{avatar:n.avatar?withLookDefaults({name:n.role,look:n.look??'m',...n.avatar}):null,who:n.avatar?'writer':n.sprite}:{avatar:null,who:'writer'}}
const out='artifacts/scenery/shared-background-drafts';fs.mkdirSync(out,{recursive:true})
const manifest=[]
// Exact sheet names allow changed fixtures to be refreshed without re-rendering
// the already reviewed, unchanged batch. HTML manifests still describe all IDs.
const requestedSheets=new Set(process.argv.slice(2))
const reviewTimes=id=>id==='gift:carpenter:3'?[0,.6,1.49,1.5,1.85,8]:[0,.6,8]
function render(file,ch,variants,cols=3,cw=320){
 if(requestedSheets.size&&!requestedSheets.has(file)&&!(requestedSheets.has('--live-thumbnails')&&file.endsWith('-live-thumb')))return
 cols=Math.min(cols,variants.length)
 const w=cw*cols,h=ch*Math.ceil(variants.length/cols),pixels=new Uint8Array(w*h*4);let ox=0,oy=0
 const g={fillStyle:'#000000',fillRect(x,y,a,b){
  const match=this.fillStyle.match(/^rgba?\(([^)]+)\)/),rgba=match?match[1].split(',').map(Number):this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16))
  const alpha=match&&rgba.length===4?rgba[3]:1,c=rgba.slice(0,3)
  for(let yy=Math.max(oy,y+oy);yy<Math.min(oy+ch,y+oy+b);yy++)for(let xx=Math.max(ox,x+ox);xx<Math.min(ox+cw,x+ox+a);xx++){
   const j=(yy*w+xx)*4;for(let k=0;k<3;k++)pixels[j+k]=Math.round(c[k]*alpha+pixels[j+k]*(1-alpha));pixels[j+3]=255
  }
 }}
 variants.forEach((v,i)=>{ox=i%cols*cw;oy=Math.floor(i/cols)*ch;if(v.scene){drawSharedBackgroundScene(g,{...v.scene,avatar:v.av},cw,ch,v.t,v.beat);return}drawSharedBackgroundDraft(g,v.id,cw,ch,v.t,v.av,v.npc??actor(sharedBackgroundDraftPeople(v.id)[0]),v.beat,v.location??(v.id==='firstChapter'?storyLocationContext({player:{x:20,y:112,facing:'down',path:[],walkTime:0},clock:{day:1,minute:900},homeLevel:0}):storyLocationContext()),v.baby!==undefined?v.baby:v.id==='done:baker:2'?{avatar:withLookDefaults({name:'검토용 아기',look:'f',skin:2}),who:'writer'}:null)})
 png(`${out}/${file}.png`,w,h,pixels)
}
for(const id of ids){
 const scene=SCENES[id],key=id.replaceAll(':','-'),variants=[]
 for(const av of [null,actual])for(let beat=0;beat<scene.lines.length;beat++)for(const t of reviewTimes(id))variants.push({id,beat,t,av})
 render(key,180,variants)
 // Same native scale, every phase, current avatar, phone and thumbnail canvases.
 render(`${key}-phone`,693,scene.lines.map((_,beat)=>({id,beat,t:.6,av:actual})))
 render(`${key}-thumb`,120,scene.lines.map((_,beat)=>({id,beat,t:8,av:actual})))
 manifest.push({id,title:scene.title,key,people:sharedBackgroundDraftPeople(id),lines:scene.lines,times:reviewTimes(id)})
}
for(let page=0;page<Math.ceil(ids.length/12);page++)render(`overview-${page}`,180,ids.slice(page*12,page*12+12).map(id=>({id,beat:SCENES[id].lines.length-1,t:.6,av:actual})))
const locationState=(x,y,extra={})=>({player:{x,y,facing:'down',path:[],walkTime:0},clock:{day:3,minute:900},...extra})
const locations=ROOMS.filter(r=>['child','apothecary','fisher','beekeeper','acts','letters','rev','hebJud'].includes(r.owner)).map(r=>({label:r.owner,location:storyLocationContext(locationState(r.sit.x,r.sit.y))}))
locations.push({label:'집 가구를 모두 치운 상태',location:storyLocationContext(locationState(20,112,{room:[]}))},{label:'실제 옮긴 책상과 장미색 방석',location:storyLocationContext(locationState(20,112,{room:[{item:'homeDesk',x:21,y:113,facing:'left'},{item:'cushion',x:19,y:112,finish:'rose'}]}))})
locations.push({label:'새 터 서고 실제 가구',location:storyLocationContext(locationState(INTERIOR_ENTRY.x,INTERIOR_ENTRY.y,{map:'newland',rooms:{'newland:archive':[{item:'jar',x:18,y:33}]}}))})
const b={id:'b3',kind:'home',x:5,y:10,facing:'left',state:'done',orderedDay:1,paid:{coins:0,items:{}},slot:0,refunded:false,owner:'g-0042'}
for(const phase of ['ordered','building','done'])locations.push({label:`새 터 건물 ${phase}`,location:storyLocationContext(locationState(7,14,{map:'newland',newland:{builds:[{...b,state:phase}],tiles:{},nextId:4,settledDay:2}}))})
const slot=ROOM_SLOTS[0]
locations.push({label:'새 터 주택 저장된 가구',location:storyLocationContext(locationState(slot.entry.x,slot.entry.y,{map:'newland',newland:{builds:[b],tiles:{},nextId:4,settledDay:2},rooms:{'newland:b3':[{item:'jar',x:slot.x0+2,y:slot.y0+3}]}}))})
locations.push({label:'집에 세운 벽과 허문 벽',location:storyLocationContext(locationState(20,112,{homeLevel:1,room:[],homeWalls:{built:['20,112'],removed:['21,110']}}))})
locations.push({label:'배우자 방 창 · 치운 가구 유지',location:storyLocationContext(locationState(21,107,{homeLevel:1,room:[],romance:{partner:'wendell',stage:'married',since:1,weddingDay:1,marriedDay:1}}))})
locations.push({label:'자녀의 실제 약초 연구 일터',location:storyLocationContext(locationState(7,14,{map:'newland',child:{...newChild(1,freshStats(),undefined),job:'herbalist'},newland:{builds:[{...b,kind:'kidWork',owner:'me:1'}],tiles:{},nextId:4,settledDay:2}}))})
locations.push({label:'실제 놓은 연결 돌길 · 정원 · 덤불',location:storyLocationContext(locationState(7,14,{map:'newland',newland:{builds:[],tiles:{'6,14':'stone','7,14':'stone','8,14':'stone','6,15':'garden','8,15':'flower','9,14':'bush'},nextId:1,settledDay:2}}))})
for(const [label,x,y,flags,weather,minute] of [
 ['원래 빵집 벤치 해금',1,13,{'unlock:bakeryBench':1},'sunny',900],
 ['원래 포도 시렁 해금',42,9,{'unlock:grapeTrellis':1},'sunny',900],
 ['베틀 차양 · 원래 마을2단계',38,24,{'unlock:loomAwning':1,villageLevel:2},'sunny',900],
 ['늘어난 벌통 · 원래 마을4단계',44,27,{'unlock:moreHives':1,villageLevel:4},'sunny',900],
 ['실제 밤 등불',23,11,{'unlock:lanterns':1},'sunny',1300],
 ['맑은 낮 언덕 연',15,12,{'unlock:kite':1},'sunny',900],
 ['빗속 언덕 연 없음',15,12,{'unlock:kite':1},'rain',900],
 ['실제 기름틀 손잡이 해금',45,21,{'unlock:pressHandle':1},'sunny',900],
 ['실제 대장간 지붕 해금',42,20,{'unlock:bigBellows':1},'sunny',900],
])locations.push({label,location:{...storyLocationContext(locationState(x,y,{flags,clock:{day:3,minute}})),weather}})
for(const [label,day,x,y,tiles,revealed] of [
 ['원본 흙길과 이어지는 잔디',1,7,14,{'6,14':'road','7,14':'road','8,14':'lawn','7,15':'lawn'},true],
 ['겨울 원본 잎 진 생울타리',121,7,14,{'7,14':'lawn','8,14':'hedge','9,14':'hedge'},true],
 ['겨울 새 터 가장자리 늘푸른나무',121,3,14,{'0,14':'hedge','1,14':'hedge','2,14':'road'},true],
 ['땅 해금 전 배치한 그림 숨김',1,7,14,{'6,14':'road','8,14':'hedge'},false],
])locations.push({label,location:{...storyLocationContext(locationState(x,y,{map:'newland',clock:{day,minute:900},flags:{newlandRevealed:revealed?1:0},newland:{builds:[],tiles,nextId:1,settledDay:2}})),weather:'sunny'}})
const wallLocations=[
 {label:'실제 칸막이 문맥 · 지도 테두리는 바닥에 중복 표시하지 않음',location:storyLocationContext(locationState(21,112,{homeLevel:1,room:[],homeWalls:{built:['20,111','20,112','20,113'],removed:[]}}))},
 {label:'허문 방 사이 벽 · 바닥 연결',location:storyLocationContext(locationState(21,112,{homeLevel:1,room:[],homeWalls:{built:[],removed:['20,110','22,110']}}))},
 {label:'생활방의 뒤쪽 벽면과 실제 옮긴 가구',location:storyLocationContext(locationState(10,112,{homeLevel:3,room:[{item:'jar',x:11,y:111},{item:'table',x:12,y:113}],homeWalls:{built:[],removed:[]}}))},
 {label:'창문 앞에 가까이 서도 창은 바닥 뒤쪽 벽면에 유지',location:storyLocationContext(locationState(21,105,{homeLevel:1,room:[]}))},
]
locations.push(...wallLocations)
for(const [suffix,height] of [['phone',693],['thumb',120]])render(`room-walls-${suffix}`,height,wallLocations.flatMap(v=>[null,actual].map(av=>({...v,id:'romance2:postman',beat:1,t:.6,av}))),2)
for(const [label,x,y,flags] of [
 ['실제 양 우리 · 원래 세 마리',9,28,{}],['실제 양 우리 · 해금 뒤 다섯 마리',9,28,{'unlock:penBig':1}],
 ['원본 일곱 칸 새 터 서고 외관',20,8,{newlandRevealed:1}],['해금 전에도 서 있는 원본 새 터 서고',20,8,{newlandRevealed:0}],
 ['원본 새 터 왕래 표식',1,8,{newlandRevealed:1}],
])locations.push({label,location:{...storyLocationContext(locationState(x,y,{...(y===8?{map:'newland'}:{}),flags})),weather:'sunny'}})
const chapterLocations=[
 {label:'첫 장 · 실제 기본 필사 책상과 선반',location:storyLocationContext(locationState(20,112,{homeLevel:0}))},
 {label:'첫 장 · 반대편으로 옮긴 실제 책상과 선반',location:storyLocationContext(locationState(20,112,{homeLevel:0,room:[{item:'homeDesk',x:22,y:114,facing:'left'},{item:'homeShelf',x:18,y:111}]}))},
 {label:'첫 장 · 치운 가구를 생성하지 않고 낱장을 유지',location:storyLocationContext(locationState(20,112,{homeLevel:0,room:[]}))},
 {label:'첫 장 · 화면 밖 실제 가구를 고정 카메라 이동으로 함께 표시',location:storyLocationContext(locationState(20,110,{homeLevel:0,room:[{item:'homeDesk',x:17,y:114,facing:'right'},{item:'homeShelf',x:23,y:111}]}))},
 ...['down','up','left','right'].map(facing=>({label:`첫 장 · 실제 책상/책장 ${facing} 방향의 받침면`,location:storyLocationContext(locationState(20,112,{homeLevel:0,room:[{item:'homeDesk',x:17,y:114,facing},{item:'bookcase',x:23,y:111,facing}]}))})),
]
for(let i=0;i<chapterLocations.length;i++){
 const v=chapterLocations[i]
 if(i===7)render('first-chapter-wall-attached',180,[{...v,id:'firstChapter',beat:0,t:8,av:actual}],1)
 for(const [suffix,height] of [['phases',180],['phone',693],['thumb',120]])render(`chapter-layout-${i}-${suffix}`,height,[null,actual].flatMap(av=>[0,1.6,3.6,4.5,8].map(t=>({...v,id:'firstChapter',beat:0,t,av}))))
}
fs.writeFileSync(`${out}/chapter-layout.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{max-width:1000px;margin:24px auto;background:#f6f0e2;font:16px system-ui}img{max-width:100%;image-rendering:pixelated}</style><h1>실제 가구 첫 장 동작 검토</h1><p>기본/실제 외형, 모으기·이동·놓기·물러서기. 실제 선반이 없으면 사용자 승인 문구 “첫 장을 차례대로 이어 정리해 두었다.”에 맞춰 손에 든 낱장을 모읍니다. 선반을 만들거나 놓기 완료로 세지 않습니다. 선반이 있으면 저장 방향을 보존한 고정 카메라에서 벽에 세운 책장에 놓습니다. 게임 연결은 활성화했으며 최종 UI 검증은 별도 보류입니다.</p>${chapterLocations.map((v,i)=>`<h2>${v.label}</h2>${['phases','phone','thumb'].map(s=>`<details><summary>${s}</summary><img src="chapter-layout-${i}-${s}.png"></details>`).join('')}`).join('')}</html>`)
const castState={gen:newGenState(CONTENT,7,121),clock:{day:121,minute:900},looks:{rudy:withLookDefaults({name:'옷장에서 고른 모습',look:'m',skin:3,top:6})}}
castState.gen.persons['g-review-baker']={id:'g-review-baker',origin:'born',born:30,stage:'adult',look:'f',name:'현재 빵집 이웃',avatar:{skin:3,top:6,bottom:4,hairFront:8},hair:[30,40,25],parents:['baker'],household:'h-review',spouse:null}
castState.gen.retired={baker:{heir:'g-review-baker',day:90}}
castState.gen.persons['g-review-baby']={id:'g-review-baby',origin:'born',born:120,stage:'baby',look:'m',name:'현재 빵집 아기',avatar:{skin:3,hairFront:5},hair:[30,40,25],parents:['g-review-baker'],household:'h-review',spouse:null}
castState.gen.households['h-review']={id:'h-review',home:'baker',members:['g-review-baker'],children:['g-review-baby'],since:90,lastBirth:120}
const actualVariant=id=>{const scene=sharedBackgroundSceneSnapshot({...castState,avatar:actual,player:{x:id==='firstChapter'?20:24,y:id==='firstChapter'?112:18,facing:'down',path:[],walkTime:0},homeLevel:0},id);return {id,beat:SCENES[id].lines.length-1,t:.6,av:actual,scene}}
for(let page=0;page<Math.ceil(ids.length/12);page++)render(`actual-cast-${page}`,180,ids.slice(page*12,page*12+12).map(actualVariant))
for(const id of ids){
 const v=actualVariant(id),key=id.replaceAll(':','-')
 for(const [suffix,height] of [['phases',180],['phone',693],['thumb',120]])render(`actual-${key}-${suffix}`,height,[null,actual].flatMap(av=>SCENES[id].lines.flatMap((_,beat)=>reviewTimes(id).map(t=>({...v,av,beat,t})))))
 render(`actual-${key}-live-thumb`,170,[null,actual].flatMap(av=>SCENES[id].lines.flatMap((_,beat)=>reviewTimes(id).map(t=>({...v,av,beat,t})))),3,300)
}
fs.writeFileSync(`${out}/actual-cast.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{max-width:1000px;margin:24px auto;background:#f6f0e2;font:16px system-ui}img{max-width:100%;image-rendering:pixelated}</style><h1>118개 실제 인물 문맥 검토</h1><p>겨울·성장한 아이·노년·옷장 모습·빵집 세대교체와 실제 가구 유아를 지정한 예시입니다. 원문 인물만 표시하며 저장·완료 등록은 바꾸지 않습니다.</p>${Array.from({length:Math.ceil(ids.length/12)},(_,i)=>`<img src="actual-cast-${i}.png" alt="실제 인물 문맥 ${i+1}">`).join('')}</html>`)
for(let page=0;page<Math.ceil(locations.length/9);page++)render(`locations-${page}`,180,locations.slice(page*9,page*9+9).map(v=>({...v,id:'romance2:postman',beat:1,t:.6,av:actual})))
fs.writeFileSync(`${out}/locations.json`,JSON.stringify(locations,null,2)+'\n')
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify(manifest,null,2)+'\n')
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
fs.writeFileSync(`${out}/locations.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>실제 장소 문맥 검토</title><style>body{font:16px system-ui;max-width:1000px;margin:24px auto;padding:0 16px;background:#f6f0e2;color:#423b32}img{max-width:100%;image-rendering:pixelated}li{margin:6px}</style><h1>실제 장소 문맥 검토</h1><p>집 벽 기본/실제 외형 · 휴대폰과 썸네일 검토</p><img src="room-walls-phone.png" alt="집 벽 휴대폰"><img src="room-walls-thumb.png" alt="집 벽 썸네일"><p>같은 대화를 실제 방·가구·새 터 건물 상태에 대입한 검토용 예시입니다. 게임 저장이나 완료 등록을 변경하지 않습니다.</p><p><a href="index.html">118개 전체 모음</a></p>${Array.from({length:Math.ceil(locations.length/9)},(_,page)=>`<ol start="${page*9+1}">${locations.slice(page*9,page*9+9).map(v=>`<li>${escape(v.label)}</li>`).join('')}</ol><img src="locations-${page}.png" alt="실제 장소 문맥 ${page+1}">`).join('')}</html>`)
fs.writeFileSync(`${out}/index.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>공유 배경118개 초안 검토</title><style>body{font:16px system-ui;background:#f6f0e2;color:#423b32;margin:24px auto;padding:0 20px;max-width:1100px}img{display:block;max-width:100%;height:auto;image-rendering:pixelated;background:#e7dfc9}summary{cursor:pointer;padding:12px 0}details{border-bottom:1px solid #cabc9f;padding:8px}a{color:#5b6149}li{margin:8px 0}label{display:block;margin:12px 0}select{font:inherit;padding:6px}</style><h1>공유 배경118개 초안 검토</h1><p>제작 묶음 전체의 초안입니다. 게임 완료 등록 전이며 배경 시설·실제 가구·가족 컷과 모든 비율의 검토가 남아 있습니다. 저장·앨범·보상은 변경하지 않습니다.</p><p>가로 각 행: 시작 / 중간 / 끝. 앞쪽은 기본 기록자, 뒤쪽은 실제 외형 예시입니다. 휴대폰·썸네일은 각 대사 단계입니다. 기본 장소는 광장이며 실제 게임의 발생 장소를 지정한 최종 검토를 대체하지 않습니다.</p><h2>전체 모음</h2>${Array.from({length:Math.ceil(ids.length/12)},(_,i)=>`<img loading="lazy" src="overview-${i}.png" alt="전체 모음 ${i+1}">`).join('')}<h2>원문과 단계별 확인</h2>${manifest.map(e=>`<details><summary>${escape(e.title)} · ${e.id}</summary><ol>${e.lines.map(l=>`<li>${escape(l.speaker)}: ${escape(l.text)}</li>`).join('')}</ol><p>가로 · 기본/실제 외형 · 대사별 시작/중간/끝</p><img loading="lazy" src="${e.key}.png" alt="${escape(e.title)} 가로 단계"><p>휴대폰</p><img loading="lazy" src="${e.key}-phone.png" alt="${escape(e.title)} 휴대폰 단계"><p>썸네일</p><img loading="lazy" src="${e.key}-thumb.png" alt="${escape(e.title)} 썸네일 단계"></details>`).join('')}</html>`)
fs.writeFileSync(`${out}/actual-stages.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>실제 겨울 인물 전체 단계</title><style>body{font:16px system-ui;background:#f6f0e2;color:#423b32;max-width:1000px;margin:24px auto;padding:0 16px}img{max-width:100%;image-rendering:pixelated}summary{padding:12px;cursor:pointer}</style><h1>118개 실제 겨울 인물 전체 단계</h1><p>기본/실제 기록자, 실제 세대/옷장/노년/성장/가구 유아 예시. 각 대사 시작·중간·끝을 가로·휴대폰·썸네일로 검토합니다. 완료 등록 전이며 저장·앨범은 바꾸지 않습니다.</p>${manifest.map(e=>`<details><summary>${escape(e.title)} · ${e.id}</summary><ol>${e.lines.map(l=>`<li>${escape(l.speaker)}: ${escape(l.text)}</li>`).join('')}</ol>${['phases','phone','thumb'].map(s=>`<p>${s}</p><img loading="lazy" src="actual-${e.key}-${s}.png" alt="${escape(e.title)} ${s}">`).join('')}</details>`).join('')}</html>`)
process.stdout.write(JSON.stringify({draftIds:ids.length,registeredAsComplete:false,preview:`${out}/index.html`,actualStages:`${out}/actual-stages.html`})+'\n')

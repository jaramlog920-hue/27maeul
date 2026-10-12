import './pixel-ts-loader.mjs'
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {png,draw} from './pixel-png.mjs'
import {readPng} from './png-read.mjs'
const {ADDITION_FURNITURE_DIRECTIONS,ADDITION_FACINGS}=await import('../src/render/addition-furniture-directions.ts')
const {ADDITION_USE_ACTIONS,ADDITION_USE_INFO,ANIMATED_ADDITION_FURNITURE,additionUseFrame,additionObjectFrame,ADDITION_MOTION_SIZE}=await import('../src/render/addition-furniture-motion.ts')
const {FURNI_PALETTE}=await import('../src/render/furniture-art.ts')
const {writerPalette}=await import('../src/render/sprites.ts')
const {COZY_FURNITURE_NAMES}=await import('../src/render/cozy-furniture-art.ts')
const {HOUSEHOLD_FURNITURE_NAMES}=await import('../src/render/household-furniture-art.ts')
const {ROOM_FURNITURE_NAMES}=await import('../src/render/room-furniture-art.ts')
const names={...COZY_FURNITURE_NAMES,...HOUSEHOLD_FURNITURE_NAMES,...ROOM_FURNITURE_NAMES}
const root='assets/furniture/addition-motion'
for(const dir of ['directions','use','objects'])fs.mkdirSync(`${root}/${dir}`,{recursive:true})
const fp={...FURNI_PALETTE,z:'#d1c4ae'},ap=writerPalette('spring')
const size=ADDITION_MOTION_SIZE,items=[],directions=[]
function buffer(w,h,bg=false){const p=new Uint8Array(w*h*4);if(bg)for(let i=0;i<p.length;i+=4)p.set([245,240,222,255],i);return p}
function paint(data,w,rows,palette,x=0,y=0,scale=1,alpha=false){
  rows.forEach(row=>{for(const c of row)assert.ok(c==='.'||palette[c],`Unknown color ${c}`)})
  draw(data,w,rows,palette,x,y,scale)
  if(alpha)rows.forEach((row,ry)=>[...row].forEach((c,rx)=>{if(c==='z')data.set([90,70,50,56],((y+ry)*w+x+rx)*4)}))
}
function save(file,w,h,data){png(`${root}/${file}`,w,h,data);const img=readPng(`${root}/${file}`);assert.equal(img.w,w);assert.equal(img.h,h)}
for(const [id,views]of Object.entries(ADDITION_FURNITURE_DIRECTIONS))for(const facing of ADDITION_FACINGS){
  const a=views[facing],w=a.w*16,h=a.h*16,data=buffer(w,h)
  assert.equal(a.rows.length,h);a.rows.forEach(r=>assert.equal(r.length,w))
  paint(data,w,a.rows,fp,0,0,1,true)
  const file=`directions/${id}-${facing}.png`;save(file,w,h,data)
  directions.push({id,name:names[id],facing,file,width:w,height:h,footprint:{w:a.w,h:a.h},anchor:{x:w/2,y:h}})
}
const staticIds=Object.keys(ADDITION_FURNITURE_DIRECTIONS)
for(let page=0;page<4;page++){
  const width=160,height=480,scale=3,data=buffer(width*scale,height*scale,true)
  staticIds.slice(page*12,page*12+12).forEach((id,i)=>ADDITION_FACINGS.forEach((f,j)=>{
    const a=ADDITION_FURNITURE_DIRECTIONS[id][f]
    paint(data,width*scale,a.rows,fp,(j*40+(40-a.w*16)/2)*scale,(i*40+36-a.h*16)*scale,scale)
  }))
  save(`directions/preview-${page+1}.png`,width*scale,height*scale,data)
}
const frontPreview=buffer(size*4*3,size*ADDITION_USE_ACTIONS.length*3,true)
for(const [ai,action]of ADDITION_USE_ACTIONS.entries())for(const facing of ADDITION_FACINGS){
  const layers={actor:buffer(size*4,size),furnitureBack:buffer(size*4,size),furnitureFront:buffer(size*4,size),propBack:buffer(size*4,size),propFront:buffer(size*4,size)}
  const sheet=buffer(size*4,size),frames=[],unique=new Set()
  const order=['furnitureBack','propBack','actor','furnitureFront','propFront']
  for(let phase=0;phase<4;phase++){
    const pose=additionUseFrame('writer',facing,action,phase,{frame:0,blink:false,season:'spring'})
    unique.add(JSON.stringify(order.map(key=>pose[key])))
    const data=buffer(size,size)
    for(const key of order){
      const pal=key==='actor'?ap:fp
      paint(data,size,pose[key],pal,0,0,1,true)
      paint(sheet,size*4,pose[key],pal,phase*size,0,1,true)
      paint(layers[key],size*4,pose[key],pal,phase*size,0,1,true)
      if(facing==='down')paint(frontPreview,size*4*3,pose[key],pal,phase*size*3,ai*size*3,3)
    }
    const file=`use/${action}-${facing}-${phase}.png`;save(file,size,size,data)
    frames.push({phase,duration:pose.duration,file,posture:pose.posture,actorAnchor:pose.actorAnchor,furnitureAnchor:pose.furnitureAnchor,interaction:pose.interaction})
  }
  assert.ok(unique.size>=3,`${action}-${facing} insufficient motion`)
  const file=`use/${action}-${facing}-sheet.png`;save(file,size*4,size,sheet)
  const layerFiles={}
  for(const [key,data]of Object.entries(layers)){layerFiles[key]=`use/${action}-${facing}-${key}.png`;save(layerFiles[key],size*4,size,data)}
  items.push({kind:'use',id:action,label:ADDITION_USE_INFO[action].label,furniture:ADDITION_USE_INFO[action].furniture,facing,sheet:file,width:size,height:size,layers:layerFiles,frames})
}
save('use/preview-front-3x.png',size*4*3,size*ADDITION_USE_ACTIONS.length*3,frontPreview)
for(const action of ADDITION_USE_ACTIONS){
  const contact=buffer(size*4*3,size*4*3,true)
  ADDITION_FACINGS.forEach((facing,di)=>{for(let phase=0;phase<4;phase++){
    const pose=additionUseFrame('writer',facing,action,phase,{frame:0,blink:false,season:'spring'})
    for(const key of ['furnitureBack','propBack','actor','furnitureFront','propFront'])paint(contact,size*4*3,pose[key],key==='actor'?ap:fp,phase*size*3,di*size*3,3)
  }})
  save(`use/${action}-review.png`,size*4*3,size*4*3,contact)
}
for(const id of ANIMATED_ADDITION_FURNITURE)for(const facing of ADDITION_FACINGS){
  const a=additionObjectFrame(id,facing,0),w=a.w*16,h=a.h*16,sheet=buffer(w*4,h),frames=[],unique=new Set()
  for(let phase=0;phase<4;phase++){
    const image=additionObjectFrame(id,facing,phase),data=buffer(w,h)
    assert.equal(image.w,a.w);assert.equal(image.h,a.h)
    unique.add(image.rows.join('\n'));paint(data,w,image.rows,fp,0,0,1,true);paint(sheet,w*4,image.rows,fp,phase*w,0,1,true)
    const file=`objects/${id}-${facing}-${phase}.png`;save(file,w,h,data)
    frames.push({phase,duration:id==='rockingChair'?380:id==='smallHarp'?240:[280,180,600,180][phase],file,anchor:{x:w/2,y:h}})
  }
  assert.ok(unique.size>=3,`${id}-${facing} insufficient object motion`)
  const file=`objects/${id}-${facing}-sheet.png`;save(file,w*4,h,sheet)
  items.push({kind:'object',id,label:`${names[id]} ${id==='rockingChair'?'흔들기':id==='smallHarp'?'현 떨림':'여닫기'}`,furniture:id,facing,sheet:file,width:w,height:h,frames})
}
for(const id of ANIMATED_ADDITION_FURNITURE){
  const cell=40,scale=3,w=cell*4*scale,h=cell*4*scale,data=buffer(w,h,true)
  ADDITION_FACINGS.forEach((facing,di)=>{for(let phase=0;phase<4;phase++){
    const a=additionObjectFrame(id,facing,phase)
    paint(data,w,a.rows,fp,(phase*cell+(cell-a.w*16)/2)*scale,(di*cell+38-a.h*16)*scale,scale)
  }})
  save(`objects/${id}-review.png`,w,h,data)
}
// One contact sheet includes every motion and direction for a visual audit.
for(const kind of ['use','object']){
  const ids=kind==='use'?ADDITION_USE_ACTIONS:ANIMATED_ADDITION_FURNITURE
  const cell=48,scale=3,w=cell*4*scale,h=cell*ids.length*scale,data=buffer(w,h,true)
  ids.forEach((id,ai)=>ADDITION_FACINGS.forEach((facing,di)=>{
    if(kind==='use'){
      const pose=additionUseFrame('writer',facing,id,2,{frame:0,blink:false,season:'spring'})
      for(const key of ['furnitureBack','propBack','actor','furnitureFront','propFront'])paint(data,w,pose[key],key==='actor'?ap:fp,di*cell*scale,ai*cell*scale,scale)
    }else{
      const a=additionObjectFrame(id,facing,2)
      paint(data,w,a.rows,fp,(di*cell+(cell-a.w*16)/2)*scale,(ai*cell+40-a.h*16)*scale,scale)
    }
  }))
  save(`${kind==='use'?'use':'objects'}/all-directions-review.png`,w,h,data)
}
fs.writeFileSync(`${root}/manifest.json`,JSON.stringify({tileSize:16,facings:ADDITION_FACINGS,frameCount:4,useCanvas:48,character:'Default spring writer in PNG samples; render with additionUseFrame(who, facing, action, frame, opts) for selected avatar',layerOrder:['furnitureBack','propBack','actor','furnitureFront','propFront'],staticFurnitureCount:48,staticDirectionCount:directions.length,useActionCount:11,objectAnimationCount:10,directions,items,status:'native pixel assets; game interaction and save integration pending'},null,2))
const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>가구 48종 · 4방향과 사용 모션</title><style>body{background:#f5f0de;color:#65472f;font:15px system-ui;margin:24px}h1{font-size:24px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.card{background:#fff8e7;border:1px solid #dac59f;padding:12px;border-radius:8px;text-align:center}canvas{image-rendering:pixelated;max-width:100%}.static{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}figure{margin:0;text-align:center}.static img{image-rendering:pixelated;max-width:none}small{display:block;color:#80664a}button,select{font:inherit;padding:8px;margin-right:8px}header{position:sticky;top:0;background:#f5f0de;padding:10px 0;z-index:2}</style><h1>가구 도트 48종 · 사용 모션 11종 · 가구 움직임 10종</h1><p>모두 앞·뒤·왼쪽·오른쪽 4방향, 모션은 각 4프레임. 가구와 인물 픽셀은 같은 크기이며 사용 장면 캔버스 48px에는 여백이 포함됩니다.</p><header><select id="kind"><option value="use">캐릭터 사용 모션</option><option value="object">가구 자체 모션</option></select><select id="facing"><option value="all">모든 방향</option><option value="down">앞</option><option value="up">뒤</option><option value="left">왼쪽</option><option value="right">오른쪽</option></select><button id="pause">일시정지</button></header><main class="grid" id="motions"></main><h2>정지 가구 48종 · 앞 / 뒤 / 왼쪽 / 오른쪽</h2><main class="grid" id="static"></main><p>PNG는 기본 외형 예시이며 소스 함수는 선택한 외모·옷·계절을 받습니다. 게임 내 상호작용·구매·저장 연결은 아직 적용하지 않았습니다.</p><script>const items=${JSON.stringify(items)},directions=${JSON.stringify(directions)},cards=[];const labels={down:'앞',up:'뒤',left:'왼쪽',right:'오른쪽'};for(const i of items){const card=document.createElement('section');card.className='card';card.innerHTML='<b>'+i.label+'</b><small>'+labels[i.facing]+' · 4프레임</small><canvas width="'+i.width+'" height="'+i.height+'"></canvas><small>'+i.width+'×'+i.height+'px 캔버스</small>';document.querySelector('#motions').append(card);const canvas=card.querySelector('canvas');canvas.style.width=i.width*4+'px';canvas.style.height=i.height*4+'px';const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;const im=new Image();im.src=i.sheet;cards.push({i,card,ctx,im,phase:0,time:0})}for(const id of [...new Set(directions.map(i=>i.id))]){const views=directions.filter(i=>i.id===id),s=document.createElement('section');s.className='card';s.innerHTML='<b>'+views[0].name+'</b><div class="static">'+views.map(v=>'<figure><img src="'+v.file+'" width="'+v.width*2+'" height="'+v.height*2+'" alt="'+labels[v.facing]+'"><small>'+labels[v.facing]+'</small></figure>').join('')+'</div>';document.querySelector('#static').append(s)}let paused=false,last=performance.now();function filter(){for(const c of cards)c.card.hidden=c.i.kind!==document.querySelector('#kind').value||(document.querySelector('#facing').value!=='all'&&c.i.facing!==document.querySelector('#facing').value)}document.querySelector('#kind').onchange=filter;document.querySelector('#facing').onchange=filter;document.querySelector('#pause').onclick=()=>{paused=!paused;document.querySelector('#pause').textContent=paused?'재생':'일시정지'};filter();function tick(now){const dt=Math.min(now-last,80);last=now;for(const c of cards){if(c.card.hidden||!c.im.complete||!c.im.naturalWidth)continue;if(!paused){c.time+=dt;if(c.time>=c.i.frames[c.phase].duration){c.time=0;c.phase=(c.phase+1)%4}}c.ctx.clearRect(0,0,c.i.width,c.i.height);c.ctx.drawImage(c.im,c.phase*c.i.width,0,c.i.width,c.i.height,0,0,c.i.width,c.i.height)}requestAnimationFrame(tick)}requestAnimationFrame(tick)</script></html>`
const reviewHtml=html
  .replace('im.src=i.sheet;',"im.src=i.sheet+'?v=right-hand-6';")
  .replace('<style>','<style>:root{--card-width:310px}.grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,var(--card-width)),1fr))!important}#static{grid-template-columns:repeat(auto-fit,minmax(330px,1fr))!important}')
  .replace('<button id="pause">','<label>확대 <select id="zoom"><option value="4">4배</option><option value="6" selected>6배</option><option value="8">8배</option></select></label><label>프레임 <select id="frame"><option value="auto">자동 재생</option><option value="0">1 / 4</option><option value="1">2 / 4</option><option value="2">3 / 4</option><option value="3">4 / 4</option></select></label><button id="pause">')
  .replace("canvas.style.width=i.width*4+'px';canvas.style.height=i.height*4+'px'","canvas.style.width=i.width*6+'px';canvas.style.height='auto'")
  .replace("filter();function tick(now)","document.querySelector('#zoom').onchange=()=>{const z=Number(document.querySelector('#zoom').value);document.documentElement.style.setProperty('--card-width',Math.max(220,48*z+26)+'px');for(const c of cards){const cv=c.card.querySelector('canvas');cv.style.width=c.i.width*z+'px';cv.style.height='auto'}};document.querySelector('#frame').onchange=()=>{const value=document.querySelector('#frame').value;paused=value!=='auto';if(paused)for(const c of cards){c.phase=Number(value);c.time=0}document.querySelector('#pause').textContent=paused?'재생':'일시정지'};filter();function tick(now)")
fs.writeFileSync(`${root}/preview.html`,reviewHtml)
const focusedActions=['washFace','harp','paint','mill','tuckDoll']
const focusedItems=items.filter(item=>item.kind==='use'&&focusedActions.includes(item.id))
const focusedHtml=reviewHtml
  .replace(`const items=${JSON.stringify(items)},directions=${JSON.stringify(directions)},cards=[]`,`const items=${JSON.stringify(focusedItems)},directions=[],cards=[]`)
  .replace('<title>가구 48종 · 4방향과 사용 모션</title>','<title>세면·하프·그림·맷돌·인형 · 수정 모션</title>')
  .replace('<h1>가구 도트 48종 · 사용 모션 11종 · 가구 움직임 10종</h1>','<h1>세면 · 하프 · 그림 · 맷돌 · 인형</h1>')
  .replace('<h2>정지 가구 48종 · 앞 / 뒤 / 왼쪽 / 오른쪽</h2><main class="grid" id="static"></main>','<main id="static" hidden></main>')
  .replace('im.src=i.sheet;',"im.src=i.sheet+'?v=poses-5';")
fs.writeFileSync(`${root}/focused-preview.html`,focusedHtml)
const paintingDollItems=focusedItems.filter(item=>item.id==='paint'||item.id==='tuckDoll')
fs.writeFileSync(`${root}/painting-doll-preview.html`,focusedHtml
  .replace(`const items=${JSON.stringify(focusedItems)},directions=[],cards=[]`,`const items=${JSON.stringify(paintingDollItems)},directions=[],cards=[]`)
  .replace('<h1>세면 · 하프 · 그림 · 맷돌 · 인형</h1>','<h1>오른손으로 꽃 그리기 · 인형 눕히고 이불 덮기</h1>'))
fs.writeFileSync(`${root}/README.md`, '# 가구 48종과 생활 모션 · 4방향\n\n정지 가구: 48종 × 4방향 = 192개. 캐릭터 사용: 11종 × 4방향 × 4프레임 = 176장면. 가구 움직임: 여닫기 8종 + 흔들의자 + 하프, 총 10종 × 4방향 × 4프레임 = 160프레임.\n\n사용 모션: 흔들의자, 재봉, 반죽, 세면, 하프 연주, 그림, 설거지, 맷돌, 물 주기, 인형 눕히기, 수레 밀기.\n\n여닫기: 긴 서랍장, 옷장, 보석함, 씨앗 정리장, 빵 보관장, 이불장, 화장대, 바느질함. 프레임 0 닫힘 → 1 열기 → 2 열림 → 3 닫기 → 0.\n\n## 픽셀과 배치\n\n16픽셀 타일 유지. 넓은 2×1칸 가구의 옆면은 1×2칸이며 세워진 그림을 90도 돌리지 않고 따로 그렸습니다. 앞모습은 이전 원본 그대로. 왼쪽은 별도로 그린 오른쪽 모습의 반전. 대칭 가구는 일부 방향이 같을 수 있습니다.\n\n가구 움직임 PNG는 방향별 원래 캔버스 유지. 사용 장면은 48×48px 캔버스에 실제 크기 가구·10×14px 캐릭터와 손동작을 담았습니다. 캔버스는 여백이며 인물이나 가구를 확대하지 않습니다.\n\n## 재사용과 레이어\n\nuse/의 PNG는 기본 외형 예시. 실제 캐릭터는 additionUseFrame(who,facing,action,frame,opts)로 생성하며 외모·머리·옷·계절을 유지합니다. 레이어 순서는 furnitureBack → propBack → actor → furnitureFront → propFront. 각 레이어 시트와 합성 시트, 개별 합성 프레임, 앵커·접촉점·프레임 시간이 manifest.json에 있습니다.\n\npreview.html에서 방향 필터와 일시정지로 확인. use/*-review.png는 방향별 4행, 프레임별 4열. directions/preview-1~4.png는 가구 12종씩 방향 4열.\n\n원본: src/render/addition-furniture-directions.ts, src/render/addition-furniture-motion.ts. 재생성: node scripts/export-addition-furniture-motion.mjs.\n\n상태: 도트와 모션 자산 완성. 게임 내 상호작용·구매·저장·NPC 행동에는 아직 연결하지 않았습니다.\n')
console.log(JSON.stringify({staticViews:directions.length,useSequences:items.filter(i=>i.kind==='use').length,objectSequences:items.filter(i=>i.kind==='object').length,useFrames:176,objectFrames:160,output:root}))
const readme=fs.readFileSync(`${root}/README.md`,'utf8').replace('앞모습은 이전 원본 그대로.','앞모습은 대부분 원본 유지. 흔들의자는 정면 좌석·팔걸이를, 수레는 양손으로 잡는 손잡이를 다시 그렸습니다.')
fs.writeFileSync(`${root}/README.md`,readme+'\n## 2026-10-12 전체 모션 보정\n\n의자에서는 좌석에 골반을 맞추고 무릎을 접으며 발은 자연스럽게 매달립니다. 작업대 앞·뒤의 인물은 원근에 맞는 서로 다른 바닥 위치를 쓰고, 옆모습 작업대는 캔버스 깊이가 높이처럼 늘어나지 않게 다시 그렸습니다. 손은 기존 craft-followup/work-details의 2픽셀 손바닥·아래 윤곽을 참고하고, 짧은 옷소매로 몸에 연결합니다. 뒷모습에서는 머리와 등이 팔·손·도구를 가립니다. 수레 손잡이와 인물은 같이 이동하고 발걸음을 번갈아 딛습니다. 상자 뚜껑은 경첩에 붙어 회전하며, 서랍·문은 가구 본체와 연결된 채 열립니다.\n\nactorAnchor는 서 있을 때 발, 앉을 때 골반을 뜻합니다. manifest 프레임의 posture는 standing/seated/crouching을 구분합니다. 모든 방향 확인용 이미지: use/all-directions-review.png, objects/all-directions-review.png. 미리보기에서는 4·6·8배 확대와 프레임별 정지를 지원합니다.\n')

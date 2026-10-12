import './pixel-ts-loader.mjs'
import fs from 'node:fs'
import {png,draw} from './pixel-png.mjs'
const {BABY_BEDS,BABY_BED_NAMES,BABY_CARE_ACTIONS,BABY_CARE_NAMES,babyCareFrame,babyBedLayers}=await import('../src/render/baby-care-motion.ts')
const {FURNI_PALETTE}=await import('../src/render/furniture-art.ts')
const root='assets/furniture/baby-care'
fs.mkdirSync(root,{recursive:true})
const facings=['down','up','left','right'],order=['furnitureBack','babyBack','actor','furnitureFront','babyFront','blanket'],items=[],beds=[]
const palette={...FURNI_PALETTE,z:'#d1c4ae'}
function buffer(w,h,bg=false){const a=new Uint8Array(w*h*4);if(bg)for(let i=0;i<a.length;i+=4)a.set([245,240,222,255],i);return a}
function render(data,width,pose,ox=0,oy=0,scale=1){for(const layer of order)draw(data,width,pose[layer],layer==='actor'?pose.actorPalette:layer.startsWith('baby')?pose.babyPalette:pose.furniturePalette,ox,oy,scale)}
for(const bed of BABY_BEDS)for(const facing of facings){
  const p=babyBedLayers(bed,facing),data=buffer(48,48)
  draw(data,48,p.back,palette);draw(data,48,p.front,palette)
  const file=`bed-${bed}-${facing}.png`;png(`${root}/${file}`,48,48,data);beds.push({bed,facing,file,label:BABY_BED_NAMES[bed]})
}
for(const action of BABY_CARE_ACTIONS)for(const bed of (action==='hold'||action==='soothe'?['wood']:BABY_BEDS)){
  const review=buffer(48*4*4,48*4*4,true)
  for(const [di,facing] of facings.entries()){
    const data=buffer(192,48),durations=[]
    for(let phase=0;phase<4;phase++){
      const pose=babyCareFrame('writer',facing,action,bed,phase,{frame:0,blink:false,season:'spring'})
      render(data,192,pose,48*phase);render(review,768,pose,192*phase,192*di,4)
      durations.push(pose.duration)
      for(const key of order){const layer=buffer(48,48);draw(layer,48,pose[key],key==='actor'?pose.actorPalette:key.startsWith('baby')?pose.babyPalette:pose.furniturePalette);png(`${root}/${action}-${bed}-${facing}-${phase}-${key}.png`,48,48,layer)}
    }
    const file=`${action}-${bed}-${facing}-sheet.png`;png(`${root}/${file}`,192,48,data)
    items.push({action,bed,facing,file,label:BABY_CARE_NAMES[action],bedLabel:BABY_BED_NAMES[bed],durations})
  }
  png(`${root}/${action}-${bed}-review.png`,768,768,review)
}
const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>아기 돌보기 · 아기침대 3종</title><style>body{background:#f5f0de;color:#65472f;font:15px system-ui;margin:24px}h1{font-size:24px}header{position:sticky;top:0;background:#f5f0de;padding:12px 0;z-index:2}select,button{font:inherit;padding:8px;margin:4px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:12px}.card{text-align:center;background:#fff8e7;border:1px solid #dac59f;border-radius:8px;padding:12px}canvas,img{image-rendering:pixelated;width:288px;max-width:100%}small{display:block;color:#80664a}</style><h1>아기 돌보기 · 아기침대 3종</h1><p>안고 눈 맞추기 · 살살 달래기 · 머리 받쳐 눕히기 · 이불 올리고 토닥이기</p><header><select id="facing"><option value="down">앞</option><option value="up">뒤</option><option value="left">왼쪽</option><option value="right">오른쪽</option><option value="all">모든 방향</option></select><select id="bed"><option value="all">침대 모두</option><option value="wood">나무 아기침대</option><option value="basket">흔들 요람</option><option value="canopy">천 지붕 아기침대</option></select><select id="phase"><option value="auto">자동 재생</option><option value="0">1프레임</option><option value="1">2프레임</option><option value="2">3프레임</option><option value="3">4프레임</option></select><button id="pause">일시정지</button></header><main class="grid" id="motions"></main><h2>아기침대</h2><main class="grid" id="beds"></main><script>const items=${JSON.stringify(items)},beds=${JSON.stringify(beds)},cards=[],bedCards=[],labels={down:'앞',up:'뒤',left:'왼쪽',right:'오른쪽'};for(const i of items){const box=document.createElement('section');box.className='card';box.innerHTML='<b>'+i.label+'</b><small>'+((i.action==='hold'||i.action==='soothe')?'':i.bedLabel+' · ')+labels[i.facing]+'</small><canvas width="48" height="48"></canvas>';document.querySelector('#motions').append(box);const im=new Image;im.src=i.file+'?v=crib-size-3';const ctx=box.querySelector('canvas').getContext('2d');ctx.imageSmoothingEnabled=false;cards.push({i,box,im,ctx,p:0,t:0})}for(const i of beds){const box=document.createElement('section');box.className='card';box.innerHTML='<b>'+i.label+'</b><small>'+labels[i.facing]+'</small><img src="'+i.file+'?v=crib-size-3">';document.querySelector('#beds').append(box);bedCards.push({i,box})}function filter(){const f=document.querySelector('#facing').value,b=document.querySelector('#bed').value;for(const c of cards)c.box.hidden=(f!=='all'&&c.i.facing!==f)||(b!=='all'&&c.i.action!=='hold'&&c.i.action!=='soothe'&&c.i.bed!==b);for(const c of bedCards)c.box.hidden=(f!=='all'&&c.i.facing!==f)||(b!=='all'&&c.i.bed!==b)}document.querySelector('#facing').onchange=filter;document.querySelector('#bed').onchange=filter;let paused=false,last=performance.now();document.querySelector('#pause').onclick=()=>{paused=!paused;document.querySelector('#pause').textContent=paused?'재생':'일시정지'};function tick(now){const dt=Math.min(now-last,80);last=now;const selected=document.querySelector('#phase').value;for(const c of cards){if(c.box.hidden||!c.im.complete||!c.im.naturalWidth)continue;if(selected!=='auto')c.p=Number(selected);else if(!paused){c.t+=dt;if(c.t>=c.i.durations[c.p]){c.t=0;c.p=(c.p+1)%4}}c.ctx.clearRect(0,0,48,48);c.ctx.drawImage(c.im,c.p*48,0,48,48,0,0,48,48)}requestAnimationFrame(tick)}filter();requestAnimationFrame(tick)</script></html>`
fs.writeFileSync(`${root}/preview.html`,html)
fs.writeFileSync(`${root}/manifest.json`,JSON.stringify({size:48,frameCount:4,layerOrder:order,beds,items,status:'motion assets; game integration pending'},null,2))
fs.writeFileSync(`${root}/README.md`,'# 아기 돌보기 도트\n\n안기·달래기·눕히기·이불 덮기, 네 방향 각 4프레임. 나무 아기침대·흔들 요람·천 지붕 침대 3종. 기존 householdCradleFrame의 8×5 아기 비율 참고. 인물 외모는 babyCareFrame(who,facing,action,bed,frame,opts)에서 선택한 외모 유지. 아기는 별도 팔레트와 레이어이며 난간 뒤에 눕습니다.\n\n재생성: node scripts/export-baby-care-motion.mjs. 미리보기: preview.html. 게임 내 출산·가구 구매·상호작용에는 아직 연결하지 않은 자산입니다.\n')
console.log(JSON.stringify({sequences:items.length,frames:items.length*4,beds:beds.length,output:root}))



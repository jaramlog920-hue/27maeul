import fs from 'node:fs'
import path from 'node:path'
import {registerHooks}from'node:module'
import{png,draw}from'./pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)}})
const{WEDDING_PROPS,WEDDING_ARCH,WEDDING_ACTIONS,WEDDING_LABELS,weddingActorFrame}=await import('../src/render/wedding-art.ts')
const{EVENT_PROPS,EVENT_LABELS}=await import('../src/render/event-art.ts')
const{FURNI_PALETTE}=await import('../src/render/furniture-art.ts')
const{writerPalette}=await import('../src/render/sprites.ts')
const out='assets/events';fs.mkdirSync(out,{recursive:true});for(const d of ['wedding','wedding/motions','other'])fs.mkdirSync(`${out}/${d}`,{recursive:true})
const fp={...FURNI_PALETTE,z:'#5a4632'},ap=writerPalette('spring'),items=[],motions=[]
function paint(p,w,rows,pal,x=0,y=0,scale=1){draw(p,w,rows,pal,x,y,scale)}
for(const [group,source]of [['wedding',WEDDING_PROPS],['other',EVENT_PROPS]])for(const[id,a]of Object.entries(source)){const p=new Uint8Array(a.w*16*a.h*16*4);paint(p,a.w*16,a.rows,fp);const file=`${group}/${id}.png`;png(`${out}/${file}`,a.w*16,a.h*16,p);items.push({id,group,label:EVENT_LABELS[id]??id,file,width:a.w*16,height:a.h*16})}
for(const[f,a]of Object.entries(WEDDING_ARCH)){const p=new Uint8Array(a.w*16*a.h*16*4);paint(p,a.w*16,a.rows,fp);const file=`wedding/arch-${f}.png`;png(`${out}/${file}`,a.w*16,a.h*16,p);items.push({id:'arch',group:'wedding',facing:f,label:'꽃 아치',file,width:a.w*16,height:a.h*16})}
for(const action of WEDDING_ACTIONS)for(const facing of ['down','up','left','right']){const sheet=new Uint8Array(96*24*4),actor=new Uint8Array(96*24*4),back=new Uint8Array(96*24*4),front=new Uint8Array(96*24*4),frames=[];for(let f=0;f<4;f++){const a=weddingActorFrame('writer',facing,action,f,{frame:0,blink:false}),p=new Uint8Array(24*24*4);for(const[r,pal,t]of [[a.propBack,fp,back],[a.actor,ap,actor],[a.propFront,fp,front]]){paint(p,24,r,pal);paint(sheet,96,r,pal,f*24);paint(t,96,r,pal,f*24)}png(`${out}/wedding/motions/${action}-${facing}-${f}.png`,24,24,p);frames.push({frame:f,duration:a.duration,anchor:a.anchor,loop:a.loop})}for(const[id,p]of [['sheet',sheet],['actor',actor],['back',back],['front',front]])png(`${out}/wedding/motions/${action}-${facing}-${id}.png`,96,24,p);motions.push({action,facing,label:WEDDING_LABELS[action],file:`wedding/motions/${action}-${facing}-sheet.png`,width:24,height:24,frames})}
// Small complete arrangement, composed from the native sprites rather than a concept image.
const scene=new Uint8Array(128*96*4);for(let i=0;i<scene.length;i+=4)scene.set([245,240,222,255],i)
paint(scene,128,WEDDING_ARCH.down.rows,fp,32,4)
paint(scene,128,WEDDING_PROPS.aisle.rows,fp,56,48)
paint(scene,128,WEDDING_PROPS.flowerPot.rows,fp,25,38);paint(scene,128,WEDDING_PROPS.flowerPot.rows,fp,88,38)
for(const[x,facing]of [[39,'right'],[64,'left']]){const a=weddingActorFrame('writer',facing,'offerFlowers',1,{frame:0,blink:false});paint(scene,128,a.actor,x===39?ap:{...ap,r:'#87a8b3',R:'#587b87'},x,33);paint(scene,128,a.propFront,fp,x,33)}
paint(scene,128,WEDDING_PROPS.feastTable.rows,fp,2,64);paint(scene,128,WEDDING_PROPS.giftBundle.rows,fp,103,67)
png(`${out}/wedding/scene.png`,128,96,scene)
const scaled=new Uint8Array(512*384*4);for(let y=0;y<96;y++)for(let x=0;x<128;x++)for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++)scaled.set(scene.slice((y*128+x)*4,(y*128+x)*4+4),((y*4+dy)*512+x*4+dx)*4)
png(`${out}/wedding/scene-preview-4x.png`,512,384,scaled)
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify({tileSize:16,items,motions},null,2))
fs.writeFileSync(`${out}/미리보기.html`,`<!doctype html><meta charset="utf-8"><title>27마을 이벤트 도트</title><style>body{background:#f5f0de;color:#553c29;font:16px sans-serif;padding:20px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}section{background:#fff8e9;padding:12px;border-radius:8px}img,canvas{display:block;image-rendering:pixelated;margin:12px auto;max-width:100%}small{display:block}button{margin:5px;padding:8px}</style><h1>결혼식과 마을 이벤트</h1><img src="wedding/scene-preview-4x.png" width="512"><p>장면 배치 예시. 실제 게임에서는 현재 부부의 외형을 사용합니다.</p><nav><a href="additional/미리보기.html">추가 이벤트·가족 모션</a><button onclick="show('wedding')">결혼식 소품</button><button onclick="show('motions')">결혼식 동작</button><button onclick="show('other')">다른 이벤트</button></nav><main></main><script>const items=${JSON.stringify(items)},motions=${JSON.stringify(motions)};let gen=0;function show(group){const g=++gen,m=document.querySelector('main');m.innerHTML='';for(const i of group==='motions'?motions:items.filter(i=>i.group===group)){const s=document.createElement('section');s.innerHTML='<b>'+i.label+'</b><small>'+(i.facing||i.id)+'</small>';m.append(s);const im=new Image;im.src=i.file;if(i.frames){const cv=document.createElement('canvas');cv.width=24;cv.height=24;cv.style.width='144px';cv.style.height='144px';s.append(cv);const c=cv.getContext('2d');let f=0;function tick(){if(g!==gen)return;c.clearRect(0,0,24,24);c.drawImage(im,f*24,0,24,24,0,0,24,24);const delay=f===3&&!i.frames[0].loop?900:i.frames[f].duration;f=(f+1)%4;setTimeout(tick,delay)}im.onload=tick}else{im.style.width=i.width*3+'px';s.append(im)}}}show('wedding')</script>`)
console.log(JSON.stringify({weddingProps:Object.keys(WEDDING_PROPS).length,archViews:4,weddingFrames:96,eventProps:Object.keys(EVENT_PROPS).length}))


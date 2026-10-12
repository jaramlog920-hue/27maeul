import './pixel-ts-loader.mjs'
import fs from 'node:fs'
import {png,draw} from './pixel-png.mjs'
const {COUPLE_BED_DIRECTIONS}=await import('../src/render/couple-bed-art.ts')
const {coupleBedRestFrame}=await import('../src/render/couple-bed-motion.ts')
const {FURNI_PALETTE}=await import('../src/render/furniture-art.ts')
const {spriteRows,writerPalette}=await import('../src/render/sprites.ts')
const {withLookDefaults}=await import('../src/engine/avatar.ts')
const root='assets/furniture/couple-bed';fs.mkdirSync(root,{recursive:true})
const fp={...FURNI_PALETTE,z:'#d1c4ae'},first={frame:0,blink:false,avatar:withLookDefaults({name:'',look:'m',skin:1,top:2})},second={frame:0,blink:false,avatar:withLookDefaults({name:'',look:'f',skin:2,top:4,hairFront:3})}
const buffer=(w,h)=>{const a=new Uint8Array(w*h*4);for(let i=0;i<a.length;i+=4)a.set([245,240,222,255],i);return a}
const review=buffer(448,384),items=[]
for(const [di,facing] of ['down','up','left','right'].entries()){
  const art=COUPLE_BED_DIRECTIONS[facing],data=new Uint8Array(32*32*4)
  draw(data,32,art.rows,fp);png(`${root}/${facing}.png`,32,32,data)
  const x=di%2*224,y=Math.floor(di/2)*192
  draw(review,448,art.rows,fp,x+16,y+24,3)
  draw(review,448,spriteRows('writer','down',first),writerPalette('spring',first.avatar),x+124,y+70,3)
  const sleeping=buffer(128,32)
  for(let phase=0;phase<4;phase++){
    const pose=coupleBedRestFrame('writer','writer',facing,phase,first,second)
    for(const [key,palette]of [['bed',fp],['first',writerPalette('spring',first.avatar)],['second',writerPalette('spring',second.avatar)],['cover',fp]])draw(sleeping,128,pose[key],palette,phase*32)
  }
  png(`${root}/${facing}-rest-sheet.png`,128,32,sleeping)
  items.push({facing,label:{down:'앞',up:'뒤',left:'왼쪽',right:'오른쪽'}[facing],file:`${facing}-rest-sheet.png`})
}
png(`${root}/review.png`,448,384,review)
const pose=coupleBedRestFrame('writer','writer','down',0,first,second),together=buffer(160,160)
for(const [key,pal]of [['bed',fp],['first',writerPalette('spring',first.avatar)],['second',writerPalette('spring',second.avatar)],['cover',fp]])draw(together,160,pose[key],pal,16,16,4)
png(`${root}/together-review.png`,160,160,together)
fs.writeFileSync(`${root}/preview.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><title>부부 침대</title><style>body{background:#f5f0de;color:#65472f;font:16px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}section{background:#fff8e7;padding:16px;text-align:center;border:1px solid #dac59f}canvas,img{image-rendering:pixelated;width:192px}h1{font-size:24px}</style><h1>부부 침대 · 2×2칸</h1><p>기존 나무틀과 청록색 이불 · 베개 두 개 · 두 사람이 나란히 누울 공간</p><main>${items.map(i=>`<section><b>${i.label}</b><br><img src="${i.facing}.png?v=couple-1"><br><canvas width="32" height="32" data-sheet="${i.file}"></canvas></section>`).join('')}</main><script>for(const cv of document.querySelectorAll('canvas')){const im=new Image;im.src=cv.dataset.sheet+'?v=couple-1';const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;let p=0;im.onload=()=>{setInterval(()=>{ctx.clearRect(0,0,32,32);ctx.drawImage(im,p*32,0,32,32,0,0,32,32);p=(p+1)%4},650)}}</script></html>`)
console.log(`${root}/preview.html`)

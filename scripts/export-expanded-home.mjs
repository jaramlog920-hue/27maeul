import './pixel-ts-loader.mjs'
import fs from 'node:fs'
import {png,draw} from './pixel-png.mjs'
const {homeHouse,TILE,HOUSE_RECT}=await import('../src/engine/world.ts')
const {homeRoofParts,homeAdditionArt,homeRoofJoinRows,homeChimneyPosition,homeChimneyRows,homeChimneyOptions,livingRoomFacadeRows,HOME_ADDITION_PALETTE}=await import('../src/render/expanded-home-art.ts')
const root='assets/home-expanded',width=160,height=128,scale=3
fs.mkdirSync(root,{recursive:true})
const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('')
const labels=['원래 본채','1단계 · 뒤쪽 배우자방','2단계 · 오른쪽 아이방','3단계 · 왼쪽 큰 생활방']
function buffer(w,h){const a=new Uint8Array(w*h*4);for(let i=0;i<a.length;i+=4)a.set([204,205,155,255],i);return a}
const review=buffer(width*scale*2,height*scale*2)
for(let level=0;level<=3;level++){
  const image=buffer(width*scale,height*scale),g=Array.from({length:height},()=>Array(width).fill('.')),h=homeHouse(level)
  const px=x=>(x-1)*TILE+8,py=y=>(y-1)*TILE+8
  const rect=(color,x,y,w,hh)=>{for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+w;xx++)g[yy][xx]=color}
  const window=(x,offset=0)=>{
    x=px(x)+offset;const y=py(7)
    rect('#c59a61',x+3,y+1,10,9);rect('#ffca70',x+4,y+2,8,7);rect('#ffeaba',x+4,y+2,3,3)
    rect('#c59a61',x+7,y+2,2,7);rect('#c59a61',x+4,y+5,8,1);rect('#c68b54',x+3,y+10,10,2)
    for(let i=0;i<4;i++)rect(['#ffc2a0','#fefdf8','#feae88','#a2cb78'][i],x+4+i*2,y+9,2,1)
  }
  const x=px(h.x0),y=py(6),w=(h.x1-h.x0+1)*16
  rect('#f4e0c0',x,y,w,32);rect(mix('#f4e0c0','#5a3c46',.22),x,y,w,3);rect('#f0d8b0',x,y+28,w,4)
  for(const corner of [h.x0,HOUSE_RECT.x0])rect('#f0d8b0',px(corner),y,2,32)
  for(const corner of [h.x1,HOUSE_RECT.x1])rect('#f0d8b0',px(corner)+14,y,2,32)
  if(level>=2)rect('#f0d8b0',px(8),y,2,32)
  window(4);window(6);if(level>=2)window(9,-8);if(level>=3)window(2,-8)
  const dx=px(5),dy=py(7)
  rect('#c59a61',dx+2,dy+1,12,15);rect('#906040',dx+3,dy+2,10,14);rect('#906040',dx+4,dy+1,8,1)
  rect(mix('#906040','#000000',.18),dx+6,dy+3,1,13);rect(mix('#906040','#000000',.18),dx+9,dy+3,1,13);rect('#ffca70',dx+10,dy+9,2,2)
  for(const p of homeRoofParts(h)){
    const x=px(p.x0),y=py(p.y0),w=(p.x1-p.x0+1)*TILE,hh=(p.y1-p.y0+1)*TILE,c1='#c07058',c2='#a86048',c3='#cc8468'
    if(!p.chimney){const a=homeAdditionArt(p);a.rows.forEach((row,yy)=>[...row].forEach((c,xx)=>{if(c!=='.')rect(a.palette[c],x+xx,y+yy,1,1)}));continue}
    rect(c1,x,y,w,hh);for(let dy=8;dy<hh-4;dy+=8)rect(mix(c1,c2,.25),x,y+dy,w,2)
    rect(c2,x,y,w,4);rect(c3,x,y,w,2);rect(c2,x,y,2,hh);rect(c2,x+w-2,y,2,hh);rect(c2,x,y+hh-4,w,4);rect(mix(c2,'#000000',.15),x,y+hh-2,w,2)
    if(p.chimney&&level===0){const cx=x+Math.floor(w*.72);rect('#e0a974',cx,y-6,8,12);rect('#9a6e45',cx-2,y-8,12,2);rect(mix('#e0a974','#9a6e45',.4),cx+6,y-6,2,12)}
  }
  homeRoofJoinRows(h).forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.')rect(HOME_ADDITION_PALETTE[c],px(h.x0)+x,py(h.y0)+y,1,1)}))
  const chimneyBase=level===3?g.map(row=>[...row]):null
  if(level>0){const chimney=homeChimneyPosition();homeChimneyRows().forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.')rect(HOME_ADDITION_PALETTE[c],chimney.x-16+8+x,chimney.y-16+8+y,1,1)}))}
  if(level>=3)livingRoomFacadeRows().forEach((row,y)=>[...row].forEach((c,x)=>rect(HOME_ADDITION_PALETTE[c],px(h.x0)+x,py(6)+y,1,1)))
  if(chimneyBase){
    livingRoomFacadeRows().forEach((row,y)=>[...row].forEach((c,x)=>chimneyBase[py(6)+y][px(h.x0)+x]=HOME_ADDITION_PALETTE[c]))
    const comparison=buffer(width*scale*3,height*scale)
    for(const option of homeChimneyOptions()){
      const a=chimneyBase.map(row=>[...row]),ox=option.position.x-8,oy=option.position.y-8
      option.rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.')a[oy+y][ox+x]=HOME_ADDITION_PALETTE[c]}))
      const picture=buffer(width*scale,height*scale),focus=buffer(192,192)
      for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(a[y][x]!=='.'){
        draw(picture,width*scale,['p'],{p:a[y][x]},x*scale,y*scale,scale)
        draw(comparison,width*scale*3,['p'],{p:a[y][x]},((option.id-1)*width+x)*scale,y*scale,scale)
      }
      for(let y=0;y<32;y++)for(let x=0;x<32;x++){
        const c=a[oy-6+y]?.[ox-10+x]
        if(c&&c!=='.')draw(focus,192,['p'],{p:c},x*6,y*6,6)
      }
      png(`${root}/chimney-option-${option.id}.png`,width*scale,height*scale,picture)
      png(`${root}/chimney-option-${option.id}-detail.png`,192,192,focus)
    }
    png(`${root}/chimney-options.png`,width*scale*3,height*scale,comparison)
  }
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(g[y][x]!=='.'){
    draw(image,width*scale,['p'],{p:g[y][x]},x*scale,y*scale,scale)
    draw(review,width*scale*2,['p'],{p:g[y][x]},(level%2*width+x)*scale,(Math.floor(level/2)*height+y)*scale,scale)
  }
  png(`${root}/stage-${level}.png`,width*scale,height*scale,image)
  if(level===3){png(`${root}/review.png`,width*scale,height*scale,image);const raw=new Uint8Array(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(g[y][x]!=='.')draw(raw,width,['p'],{p:g[y][x]},x,y);png(`${root}/exterior.png`,width,height,raw)}
}
png(`${root}/stages-review.png`,width*scale*2,height*scale*2,review)
fs.writeFileSync(`${root}/preview.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><title>집 증축 · 단계별 외관</title><style>body{background:#f5f0de;color:#65472f;font:16px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}section{background:#fff8e7;padding:16px;border:1px solid #dac59f;border-radius:8px}img{image-rendering:pixelated;width:100%;max-width:480px}h1{font-size:24px}</style><h1>원래 본채를 유지하는 집 증축</h1><p>뒤쪽 배우자방 → 오른쪽 아이방 → 왼쪽의 크고 깊은 생활방</p><main>${labels.map((label,i)=>`<section><b>${label}</b><br><img src="stage-${i}.png?v=chimney-5" alt="${label}"></section>`).join('')}</main></html>`)
console.log(`${root}/stages-review.png`)
fs.writeFileSync(`${root}/chimney-options.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>굴뚝 3안 비교</title><style>body{background:#f5f0de;color:#65472f;font:16px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}section{background:#fff8e7;border:1px solid #dac59f;padding:16px;border-radius:8px;text-align:center}img{image-rendering:pixelated;width:100%;max-width:480px}.detail{width:192px}h1{font-size:24px}p{color:#80664a}</style><h1>같은 집 · 굴뚝 3안</h1><main>${homeChimneyOptions().map(o=>`<section><h2>${o.id}안 · ${o.label}</h2><p>${o.description}</p><img src="chimney-option-${o.id}.png?v=options-1" alt="${o.id}안 집 전체"><br><img class="detail" src="chimney-option-${o.id}-detail.png?v=options-1" alt="${o.id}안 굴뚝 확대"></section>`).join('')}</main></html>`)





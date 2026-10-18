import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {WEDDING_OUTFITS,weddingOutfitFrame}=await import('../../src/render/wedding-outfits.ts')
const width=640,height=160,pixels=new Uint8Array(width*height*4)
for(let i=0;i<width*height;i++)pixels.set([237,231,216,255],i*4)
function rect(x,y,w,h,color){const rgb=color.slice(1).match(/../g).map(v=>parseInt(v,16));for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(xx>=0&&xx<width&&yy>=0&&yy<height)pixels.set([...rgb,255],(yy*width+xx)*4)}
for(let i=0;i<4;i++){
 const outfit=WEDDING_OUTFITS[i],avatar={name:'기록자',look:outfit.look,hairFront:outfit.look==='f'?5:2,hairBack:outfit.look==='f'?3:0}
 for(const [j,facing] of ['down','right','up'].entries()){
  const art=weddingOutfitFrame(avatar,outfit.id,facing),scale=j===0?6:3,x=i*160+(j===0?8:j===1?82:120),y=j===0?28:64
  art.rows.forEach((row,yy)=>[...row].forEach((c,xx)=>{if(c!=='.'&&art.palette[c])rect(x+xx*scale,y+yy*scale,scale,scale,art.palette[c])}))
 }
 // Transparent, unscaled native sprite sheet: down/right/up/left, stand + wave.
 const sw=40,sh=28,sprite=new Uint8Array(sw*sh*4)
 for(const [row,pose] of ['stand','wave'].entries())for(const [col,facing] of ['down','right','up','left'].entries()){
  const frame=weddingOutfitFrame(avatar,outfit.id,facing,0,pose)
  frame.rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&frame.palette[c])sprite.set([...frame.palette[c].slice(1).match(/../g).map(v=>parseInt(v,16)),255],((row*14+y)*sw+col*10+x)*4)}))
 }
 png(`artifacts/scenery/wedding-outfit-${outfit.id}.png`,sw,sh,sprite)
}
png('artifacts/scenery/wedding-formal-outfits-four.png',width,height,pixels)
const {spriteRows,writerPalette}=await import('../../src/render/sprites.ts'),{withLookDefaults,TOPS}=await import('../../src/engine/avatar.ts')
for(let i=0;i<width*height;i++)pixels.set([237,231,216,255],i*4)
for(let i=0;i<4;i++)for(const [j,facing] of ['down','right','up'].entries()){
 const avatar=withLookDefaults({name:'기록자',look:i<2?'m':'f',top:TOPS.length-4+i,hairFront:i<2?2:5,hairBack:i<2?0:3}),rows=spriteRows('writer',facing,{avatar,frame:0,blink:false}),palette=writerPalette('spring',avatar)
 const scale=j===0?6:3,x=i*160+(j===0?8:j===1?82:120),y=j===0?28:64
 rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&palette[c])rect(x+xx*scale,y+yy*scale,scale,scale,palette[c])}))
}
png('artifacts/scenery/everyday-outfits-four.png',width,height,pixels)

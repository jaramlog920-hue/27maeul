import {withLookDefaults,type Avatar} from '../engine/avatar'
import {spriteRows} from './sprites'

/** Locate the existing short hand; the motion never adds or stretches an arm. */
export function firstChapterFrame(w:number,ground:number,t:number,avatar:Avatar|null){
 const cx=Math.round(w/2),time=Math.max(0,t),av=avatar?withLookDefaults(avatar):undefined
 const rows=spriteRows('writer','right',{avatar:av,pose:'stand',frame:0,blink:false})
 const skin=rows.flatMap((row,y)=>[...row].flatMap((ch,x)=>ch==='s'&&y>=Math.floor(rows.length/2)?[{x:x*2+1,y:y*2+1}]:[]))
 const hand=skin.sort((a,b)=>b.x-a.x||b.y-a.y)[0]??{x:13,y:(rows.length-5)*2+1}
 const handY=ground-rows.length*2+hand.y
 // Keep the whole loose-sheet stack just outside the native body's opaque pixels.
 let right=hand.x
 for(let y=0;y<rows.length;y++)if(ground-rows.length*2+y*2<=handY+1&&ground-rows.length*2+y*2+1>=handY-3)
  for(let x=0;x<rows[y].length;x++)if(rows[y][x]!=='.')right=Math.max(right,x*2+1)
 const sheetOffset=right+1,sourceX=cx-55+sheetOffset,shelfX=cx+40
 const step=Math.min(2,Math.floor(time)),fraction=time-Math.floor(time)
 let x=cx-55,walk=false
 if(time<3){
  const movement=Math.min(1,fraction/.4)
  x=cx-55+14*(step===0?0:step-1+movement)
  walk=step>0&&fraction<.4
 }else if(time<4.5){
  const u=(time-3)/1.5
  x=(cx-27)*(1-u)+(shelfX-sheetOffset)*u;walk=true
 }else if(time<5){x=shelfX-sheetOffset-8*(time-4.5)/.5;walk=true}
 else x=shelfX-sheetOffset-8
 x=Math.round(x)
 const placed=time>=4.5
 const papers=Array.from({length:3},(_,i)=>{
  const held=time>=3||i<step||i===step&&fraction>=.45
  return {index:i,x:placed?shelfX:held?x+sheetOffset:sourceX+i*14,y:handY-1-i,w:13,h:3,held:held&&!placed}
 })
 return {x,walk,placed,papers,hand:{x:x+hand.x,y:handY},source:{x:sourceX-2,y:handY+2,w:46},shelf:{x:shelfX-2,y:handY+2,w:26}}
}

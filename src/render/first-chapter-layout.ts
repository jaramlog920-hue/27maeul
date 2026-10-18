import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {StoryLocationContext} from './story-location-context'
import {storyLayoutObjects} from './story-layout-art'
import {spriteRows} from './sprites'
import {seasonOf} from '../engine/clock'

/** An exposed shelf board, not a brace on the closed back or side of a cabinet. */
export function firstChapterShelfSurface(shelf:Pick<ReturnType<typeof storyLayoutObjects>[number],'x'|'y'|'rows'>&Partial<Pick<ReturnType<typeof storyLayoutObjects>[number],'facing'|'viewFacing'>>,paperWidth=10,edge:'left'|'right'='left'){
 const visible=shelf.viewFacing??shelf.facing
 if(visible&&visible!=='down')return null
 for(const wood of ['l','k']){
  const ys=Array.from({length:shelf.rows.length},(_,y)=>y)
  if(wood==='l')ys.reverse()
  for(const y of ys){
   const row=shelf.rows[y]
   const xs=Array.from({length:Math.max(0,row.length-paperWidth+1)},(_,x)=>x)
   if(edge==='right')xs.reverse()
   for(const x of xs)if(row.slice(x,x+paperWidth)===(wood.repeat(paperWidth)))return {x:shelf.x+x,y:shelf.y+y}
  }
 }
 return null
}

/** Native short-hand contact; furniture stays at its actual snapshot position. */
export function firstChapterLayoutFrame(c:StoryLocationContext,w:number,ground:number,t:number,avatar:Avatar|null,h=Infinity){
 const objects=storyLayoutObjects(c,w,ground),desk=objects.find(o=>o.id==='homeDesk'),shelf=objects.find(o=>o.id==='homeShelf'||o.id==='bookcase')
 const paperWidth=10,firstTarget=shelf?firstChapterShelfSurface(shelf,paperWidth):null
 const facing=firstTarget&&desk&&firstTarget.x<desk.x?'left' as const:'right' as const
 // Approach the outer edge nearest the walk, rather than standing inside the
 // newly full-width frontal desk or bookcase to reach its leftmost pixel.
 const source=desk?{x:desk.x+(facing==='left'?desk.rows[0].length-paperWidth-3:3),y:desk.y+5}:null
 const target=shelf?firstChapterShelfSurface(shelf,paperWidth,facing==='left'?'right':'left'):null
 const av=avatar?withLookDefaults(avatar):undefined,rows=spriteRows('writer',facing,{avatar:av,pose:'stand',frame:0,blink:false,season:seasonOf(c.day)})
 const skin=rows.flatMap((row,y)=>[...row].flatMap((ch,x)=>ch==='s'&&y>=Math.floor(rows.length/2)?[{x:x*2+1,y:y*2+1}]:[]))
 const hand=skin.sort((a,b)=>(facing==='right'?b.x-a.x:a.x-b.x)||b.y-a.y)[0]??{x:13,y:(rows.length-5)*2+1}
 const handRelY=-rows.length*2+hand.y
 const occupied=rows.flatMap((r,y)=>[...r].flatMap((ch,x)=>ch!=='.'&&y*2<=hand.y+1&&y*2+1>=hand.y-3?[x*2,x*2+1]:[]))
 const offset=facing==='right'?Math.max(hand.x,...occupied)+1:Math.min(hand.x,...occupied)-paperWidth
 const time=Math.max(0,t)
 const standingX=Math.round(w/2-rows[0].length)
 let sourceX=source?.x??standingX+offset,sourceHandY=source?source.y-2:ground+handRelY
 const targetX=target?.x??sourceX,targetHandY=target?target.y-2:sourceHandY
 // Missing or offscreen furniture is not recreated; keep the original loose sheets in hand.
 const feet=[sourceHandY-handRelY,targetHandY-handRelY]
 const available=!!target&&targetX>=14&&targetX+paperWidth<w-14&&sourceX>=14&&sourceX+paperWidth<w-14&&feet.every(y=>y>=rows.length*2&&y<h-1)
 if(!available){sourceX=standingX+offset;sourceHandY=ground+handRelY}
 const u=available?Math.max(0,Math.min(1,(time-3)/1.5)):0,placed=available&&time>=4.5
 const direction=facing==='right'?1:-1,retreat=placed?Math.min(1,(time-4.5)/.5)*8*direction:0
 const x=Math.round((sourceX-offset)*(1-u)+(targetX-offset)*u-retreat)
 const handY=Math.round(sourceHandY*(1-u)+targetHandY*u),foot=Math.round(handY-handRelY)
 const step=Math.min(2,Math.floor(time)),fraction=time-Math.floor(time)
 // Without an actual shelf, collate the loose sheets in the existing short
 // hand. This approved organizing action never reports a shelf placement.
 const organizing=!shelf?Math.min(1,time/3):null
 const papers=Array.from({length:3},(_,i)=>{
  const held=!source||!available||time>=3||i<step||i===step&&fraction>=.45
  const gather=organizing===null?0:direction*Math.round(i*(1-organizing))
  return {index:i,x:placed?targetX:held?x+offset+gather:sourceX+i*direction,y:(placed?targetHandY:held?handY:sourceHandY)-1-i,w:paperWidth,h:3,held:held&&!placed}
 })
 return {x,ground:foot,facing,walk:available&&time>=3&&time<5,placed,organized:organizing===1,available,papers,hand:{x:x+hand.x,y:handY},source,target}
}

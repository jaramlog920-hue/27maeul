import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {Season} from '../engine/types'
import {spriteRows,writerPalette} from './sprites'
import {furnitureUseFrame} from './furniture-use-motion'

/** Native standing/walking body, or the existing seated body for the explicit stool invitation. */
export function sharedGiftPlayerArt(id:string,cx:number,ground:number,t:number,avatar:Avatar|null,season:Season='spring'){
 const av=avatar?withLookDefaults(avatar):undefined,palette=writerPalette(season,av),trying=id==='gift:carpenter:3'
 const walk=trying&&t>0&&t<1.5,seated=trying&&t>=1.5
 if(seated){
  const frame=furnitureUseFrame('writer','right','sit',0,{avatar:av,season,frame:0,blink:false})
  const source=spriteRows('writer','right',{avatar:av,season,pose:'stand',frame:0,blink:false}),body=frame.actor.map(row=>[...row])
  // The native bent lap can overlap resting palms. Preserve those exact original
  // skin pixels instead of adding hands or stretching either arm to clear it.
  source.forEach((row,y)=>[...row].forEach((ch,x)=>{if('s5'.includes(ch))body[4+y][7+x]=ch}))
  const seat={x:cx,y:ground-14},settle=Math.min(1,Math.max(0,(t-1.5)/.35))
  return {rows:body.map(row=>row.join('')),palette,x:cx-frame.anchor.x*2,y:Math.round(seat.y-frame.anchor.y*2+6*(1-settle)),walk:false,seated:true,seat}
 }
 const rows=spriteRows('writer','right',{avatar:av,season,pose:'stand',frame:walk?(Math.floor(t*3)%2?1:2):0,blink:false})
 const destination=cx-rows[0].length
 return {rows,palette,x:trying?Math.round((cx-71)+(destination-(cx-71))*Math.min(1,Math.max(0,t/1.5))):cx-71,y:ground-rows.length*2,walk,seated:false,seat:null}
}

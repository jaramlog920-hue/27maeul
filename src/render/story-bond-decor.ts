import {drawBondDecor,type DecorCanvas} from './bond-decor-art'
import type {StoryLocationContext} from './story-location-context'
import {phaseOf} from '../engine/clock'

export interface StoryDecorPixel {x:number;y:number;w:number;h:number;color:string}

/** Project the same native facility drawing, without calling the mutable world renderer. */
export function storyBondDecor(c:StoryLocationContext,w:number,ground:number,t:number,returning=false):StoryDecorPixel[]{
 if(c.indoors||c.map!=='village'||(returning&&c.datePlace))return []
 const out:StoryDecorPixel[]=[],dx=Math.round(w/2-c.at.x*16),dy=Math.round(ground-(c.at.y+1)*16)
 let cursor={x:0,y:0}
 const push=(x:number,y:number,a:number,b:number,color:string)=>{
  x=Math.round(x+dx);y=Math.round(y+dy)
  if(x+a>0&&x<w&&y+b>0)out.push({x,y,w:a,h:b,color})
 }
 const canvas:DecorCanvas={
  fillStyle:'',strokeStyle:'',lineWidth:1,
  // A tall phone canvas adds sky/floor, not additional north/south map tiles.
  // Cull by each native object's ground anchor, so distant flowers never float
  // in the sky and the nearby kite keeps its complete elevated string/cloth.
  visibleTile:at=>Math.abs(at.x-c.at.x)<=Math.ceil(w/32)&&Math.abs(at.y-c.at.y)<=2,
  fillRect(x,y,a,b){push(x,y,a,b,String(this.fillStyle))},
  beginPath(){cursor={x:0,y:0}},
  moveTo(x,y){cursor={x:Math.round(x),y:Math.round(y)}},
  lineTo(x,y){
   const end={x:Math.round(x),y:Math.round(y)},sx=cursor.x<end.x?1:-1,sy=cursor.y<end.y?1:-1
   const ax=Math.abs(end.x-cursor.x),ay=-Math.abs(end.y-cursor.y)
   let error=ax+ay
   for(;;){
    push(cursor.x,cursor.y,1,1,String(this.strokeStyle))
    if(cursor.x===end.x&&cursor.y===end.y)break
    const twice=2*error
    if(twice>=ay){error+=ay;cursor.x+=sx}
    if(twice<=ax){error+=ax;cursor.y+=sy}
   }
  },
  stroke(){},
 }
 // The shared bee-field backdrop already contains its two original hives.
 const beeBackdrop=c.at.x>=40&&c.at.y>=26&&c.at.y<=32
 const phase=phaseOf(c.minute)
 const flags={...c.layout?.unlocks}
 // The overhead map's roof strip cannot be projected onto event-cut grass.
 // Its dialogue's bellows is shown beside the actual indoor forge hearth.
 delete flags['unlock:bigBellows']
 // The press has moved into the lodging workshop; do not leave its grip outdoors.
 delete flags['unlock:pressHandle']
 drawBondDecor(canvas,flags,c.weather,t,phase==='morning'||phase==='day',c.layout?.villageLevel??0,beeBackdrop)
 return out
}

export function drawStoryBondDecor(p:(x:number,y:number,color:string,w?:number,h?:number)=>void,w:number,ground:number,t:number,c:StoryLocationContext,returning=false){
 for(const a of storyBondDecor(c,w,ground,t,returning))p(a.x,a.y,a.color,a.w,a.h)
}

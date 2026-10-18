import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {StoryLocationContext} from './story-location-context'
import {firstChapterLayoutFrame} from './first-chapter-layout'
import {spriteRows} from './sprites'
import {seasonOf} from '../engine/clock'
import {storyLayoutObjects} from './story-layout-art'

/** A fixed camera translation fits real furniture into the cut without moving it in the save. */
export function firstChapterViewContext(c:StoryLocationContext,w:number,h:number,ground:number,avatar:Avatar|null):StoryLocationContext {
 if(!c.layout)return c
 const shelf=storyLayoutObjects(c,w,ground).find(o=>o.id==='homeShelf'||o.id==='bookcase')
 if(shelf&&shelf.viewFacing!=='down')c={...c,layout:{...c.layout,viewCamera:shelf.facing,viewOffset:undefined}}
 const f=firstChapterLayoutFrame(c,w,ground,0,avatar)
 if(!f.target)return c
 const rows=spriteRows('writer',f.facing,{avatar:avatar?withLookDefaults(avatar):undefined,season:seasonOf(c.day),pose:'stand',frame:0,blink:false})
 const bodyWidth=rows[0].length*2,bodyHeight=rows.length*2,handY=f.hand.y-f.ground,paperOffset=f.papers[0].x-f.x
 const source=f.source??{x:f.papers[0].x,y:f.hand.y+2},points=[source,f.target]
 const minX=Math.min(...points.map(p=>p.x-paperOffset-8)),maxX=Math.max(...points.map(p=>Math.max(p.x+10,p.x-paperOffset+bodyWidth+8)))
 const feet=points.map(p=>p.y-2-handY),minY=Math.min(...feet)-bodyHeight,maxY=Math.max(...feet)
 const fit=(min:number,max:number,size:number,pad:number)=>{
  const low=pad-min,high=size-pad-max
  return low<=high?Math.round(Math.max(low,Math.min(high,0))):null
 }
 const x=fit(minX,maxX,w,14),y=fit(minY,maxY,h,2)
 if(x===null||y===null||x===0&&y===0)return c
 const previous=c.layout!.viewOffset??{x:0,y:0}
 return {...c,layout:{...c.layout!,viewOffset:{x:previous.x+x,y:previous.y+y}}}
}

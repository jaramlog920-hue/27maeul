import type {StoryLocationContext} from './story-location-context'
import {villageSheepFrames} from './village-sheep-frame'
import {sheepLifeRows} from './quiet-life-motion'
import {SMALL_PALETTE} from './sprites'
import {C} from './world-ground-art'

export function storySheepFrames(c:StoryLocationContext,w:number,ground:number,t:number){
 if(c.map!=='village'||c.indoors)return []
 return villageSheepFrames({...c.layout?.unlocks},t).map(a=>{
  const rows=sheepLifeRows(a.side,a.action,a.frame)
  return {...a,rows,px:Math.round(w/2+(a.x-c.at.x)*16+(16-rows[0].length)/2),py:Math.round(ground+(a.y-c.at.y)*16-1-rows.length),shadowY:Math.round(ground+(a.y-c.at.y)*16-3)}
 }).filter(a=>a.px+a.rows[0].length>0&&a.px<w)
}
export function drawStorySheep(p:(x:number,y:number,color:string,w?:number,h?:number)=>void,w:number,ground:number,t:number,c:StoryLocationContext){
 for(const a of storySheepFrames(c,w,ground,t)){
  p(a.px+1,a.shadowY,C.shadow,a.rows[0].length-2,2)
  a.rows.forEach((r,y)=>[...r].forEach((ch,x)=>{const color=(SMALL_PALETTE as Record<string,string>)[ch];if(ch!=='.'&&color)p(a.px+x,a.py+y,color)}))
 }
}

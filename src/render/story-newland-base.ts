import type {StoryLocationContext} from './story-location-context'
import {NEWLAND_MAP,newlandBounds} from '../engine/newland'
import {ARCHIVE,NEWLAND_VISIBLE_H,NEWLAND_W} from '../engine/newland-config'
import {seasonOf} from '../engine/clock'
import {SEASON_GRASS,hash,drawNativeGround,drawTree,wildflowerColor} from './world-ground-art'
import {OLD_TERRAIN,OLD_VILLAGE_PALETTE} from './old-village-art'

export const storyNewlandBaseAt=(c:StoryLocationContext,x:number,y:number)=>newlandBounds(c.layout?.newlandRevealed!==false,y,NEWLAND_MAP[y]?.[x]??'T')

/** Original fixed terrain below the shared horizon, before placed tiles and buildings. */
export function storyNewlandBaseTiles(c:StoryLocationContext,w:number,h:number,ground:number){
 if(c.map!=='newland'||c.indoors)return []
 const horizon=ground-48,out=[] as {worldX:number;worldY:number;x:number;y:number;ch:string;tree:'evergreen'|'deciduous'}[]
 const minX=Math.max(0,Math.floor(c.at.x-w/32)-1),maxX=Math.min(NEWLAND_W-1,Math.ceil(c.at.x+w/32))
 const minY=Math.max(0,Math.floor(c.at.y-2)),maxY=Math.min(NEWLAND_VISIBLE_H-1,Math.ceil(c.at.y+(h-ground)/16)+1)
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
  const px=Math.round(w/2+(x-c.at.x)*16),py=Math.round(ground+(y-c.at.y)*16-16)
  if(px+16<=0||px>=w||py+16<=horizon||py>=h)continue
  let ch=storyNewlandBaseAt(c,x,y)
  // The existing native archive bitmap covers these original stone-wall cells.
  if(x>=ARCHIVE.x0&&x<ARCHIVE.x0+ARCHIVE.w&&y>ARCHIVE.y0&&y<=ARCHIVE.y0+ARCHIVE.h)ch='.'
  const edge=x===0||x===NEWLAND_W-1||y===0||y===NEWLAND_VISIBLE_H-1
  out.push({worldX:x,worldY:y,x:px,y:py,ch,tree:edge&&(x+y)%3!==0?'evergreen':'deciduous'})
 }
 return out
}

export function drawStoryNewlandBase(p:(x:number,y:number,color:string,w?:number,h?:number)=>void,w:number,h:number,ground:number,c:StoryLocationContext){
 if(c.map!=='newland'||c.indoors)return
 const season=seasonOf(c.day),horizon=ground-48,at=(x:number,y:number)=>storyNewlandBaseAt(c,x,y)
 p(0,horizon,SEASON_GRASS[season][0],w,h-horizon)
 for(const a of storyNewlandBaseTiles(c,w,h,ground)){
  const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,width:number,height:number){
   const px=a.x+x-a.worldX*16,py=a.y+y-a.worldY*16,top=Math.max(py,horizon),bottom=Math.min(py+height,h)
   if(bottom>top)p(px,top,this.fillStyle,width,bottom-top)
  }}
  drawNativeGround(g,a.ch,a.worldX,a.worldY,season,at,NEWLAND_VISIBLE_H)
  if(a.ch==='T')drawTree(g,a.worldX,a.worldY,season,a.tree)
  if(a.ch==='>')OLD_TERRAIN.mapWaySign.rows.forEach((r,y)=>[...r].forEach((ch,x)=>{const color=(OLD_VILLAGE_PALETTE as Record<string,string>)[ch];if(ch!=='.'&&color)p(a.x+x,a.y+y,color)}))
  if(a.ch==='*'&&season!=='winter')for(let i=0;i<3;i++){
   g.fillStyle=wildflowerColor((a.worldX+a.worldY+i)%4)
   g.fillRect(a.worldX*16+2+Math.floor(hash(a.worldX,a.worldY,i+7)*11),a.worldY*16+3+Math.floor(hash(a.worldX,a.worldY,i+9)*10),2,2)
  }
 }
}

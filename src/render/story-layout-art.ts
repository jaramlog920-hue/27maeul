import type {StoryLocationContext} from './story-location-context'
import type {Facing} from '../engine/types'
import {FURNITURE_ART,FURNI_PALETTE,STYLE_PALETTES} from './furniture-art'
import {facingArt} from './furniture-facing'
import {HOME_FIXTURE_ART} from './home-space-art'
import {REMAINING_FIXTURE_ART} from './remaining-furniture-art'
import {OLD_BUILDINGS,OLD_CONSTRUCTION,OLD_VILLAGE_PALETTE} from './old-village-art'
import {ARCHIVE} from '../engine/newland-config'
import {LEGACY_FACING,FURNITURE_DEFS,SPOUSE_FURNITURE} from '../engine/furniture-defs'
import {hasHouseLook} from '../engine/newland-house-look'
import {SITES,mainOffset,type BuildKind} from '../engine/newland-sites'
import {widthOf} from '../engine/newland-build'
import {drawNewlandHouse} from './newland-house-art'
import {seasonOf} from '../engine/clock'
import {STORY_ROOM_WINDOW,STORY_ROOM_PALETTE} from './story-room-fixtures'
import {drawNativeRoomWall,C} from './world-ground-art'
import {drawLibraryExterior} from './house-exterior-art'
import {OT_LIBRARY_ROOF} from './library-roof-palette'
import {storyRoomFurnitureArt,enlargeStoryOrnament} from './story-room-furniture'

type Pixel=(x:number,y:number,color:string,w?:number,h?:number)=>void
const stamp=(p:Pixel,rows:readonly string[],palette:Record<string,string>,x:number,y:number)=>rows.forEach((r,yy)=>[...r].forEach((ch,xx)=>{if(ch!=='.'&&ch!=='z'&&palette[ch])p(x+xx,y+yy,palette[ch])}))
const FIXED_ITEM:Record<string,string>={b:'homeBed',d:'homeDesk',k:'homeWorkbench',h:'homeHearth',s:'homeShelf',n:'table',g:'jar',p:'pot'}
// Retained for map-wall diagnostics only; these perimeter sprites are not painted
// in event cuts. Furniture uses the event-camera elevation below instead.
const mapRoomPoint=(c:StoryLocationContext,w:number,ground:number,x:number,y:number)=>{
 const b=c.layout!.bounds!,offset=c.layout?.viewOffset??{x:0,y:0}
 return c.layout?.roomTiles?{x:Math.round(w/2+(x-c.at.x)*16)+offset.x,y:Math.round(ground-16+(y-c.at.y)*16)+offset.y}:{x:Math.round(w/2+(x-(b.x0+b.w/2))*16)+offset.x,y:Math.round(ground-48+(y-(b.y0+b.h/2))*16)+offset.y}
}
const viewFacing=(facing:Facing,camera:Facing='down'):Facing=>{
 const order:Facing[]=['down','left','up','right']
 return order[(order.indexOf(facing)-order.indexOf(camera)+4)%4]
}
const roomCoordinates=(c:StoryLocationContext,x:number,y:number)=>{
 const b=c.layout!.bounds!,camera=c.layout?.viewCamera??'down'
 const px=c.layout?.roomTiles?c.at.x:b.x0+b.w/2,py=c.layout?.roomTiles?c.at.y:b.y0+b.h/2
 if(camera==='up')return {side:px-x,depth:b.y0+b.h-2-y}
 if(camera==='left')return {side:y-py,depth:b.x0+b.w-2-x}
 if(camera==='right')return {side:py-y,depth:x-b.x0-1}
 return {side:x-px,depth:y-b.y0-1}
}
const roomPoint=(c:StoryLocationContext,w:number,ground:number,x:number,y:number)=>{
 const offset=c.layout?.viewOffset??{x:0,y:0}
 // The back row meets the wall/floor seam, rather than following the actor's
 // foreground baseline. Interior rows project forward from that same wall.
 const v=roomCoordinates(c,x,y)
 const contact=c.layout?.viewCamera&&c.layout.viewCamera!=='down'?14:6
 const depth=c.layout?.viewCamera?Math.max(0,v.depth):v.depth
 return {x:Math.round(w/2+v.side*32)+offset.x,y:Math.round(ground-42+contact+depth*8)+offset.y}
}

/** Same native directional assets and finish palettes as the live furniture renderer. */
export function storyLayoutObjects(c:StoryLocationContext,w:number,ground:number){
 const layout=c.layout,bounds=layout?.bounds
 if(!layout||!bounds)return []
 const objects=[] as {id:string;x:number;y:number;rows:readonly string[];palette:Record<string,string>;source:'fixed'|'saved';floor:boolean;facing:Facing;viewFacing:Facing}[]
 const point=(x:number,y:number)=>roomPoint(c,w,ground,x,y)
 for(const f of layout.fixed){
  if(f.ch==='N'&&layout.viewCamera&&layout.viewCamera!=='down')continue
  const id=FIXED_ITEM[f.ch],native=f.ch==='N'?STORY_ROOM_WINDOW:id?FURNITURE_ART[id]:REMAINING_FIXTURE_ART[f.ch]??HOME_FIXTURE_ART[f.ch]
  const projected=viewFacing('down',layout.viewCamera)
  const art=id?storyRoomFurnitureArt(id,projected)??(native?{rows:enlargeStoryOrnament(native.rows)}:null):native
  if(art){
   const position=point(f.x,f.y)
   // Windows belong to the event-camera back wall, not to the map's floor depth.
   if(f.ch==='N')position.y=ground-42+(layout.viewOffset?.y??0)-art.rows.length-2
   else position.y-=art.rows.length
   objects.push({id:id??f.ch,...position,rows:art.rows,palette:f.ch==='N'?STORY_ROOM_PALETTE:FURNI_PALETTE,source:'fixed',floor:false,facing:'down',viewFacing:projected})
  }
 }
 for(const f of layout.furniture){
  const facing=f.facing??LEGACY_FACING[f.item]??'down',native=facingArt(f.item,facing)??FURNITURE_ART[f.item]
  if(!native)continue
  const floor=FURNITURE_DEFS[f.item]?.layer==='floor'
  const projected=viewFacing(facing,layout.viewCamera)
  const art=floor?(facingArt(f.item,projected)??native):storyRoomFurnitureArt(f.item,projected)??{rows:enlargeStoryOrnament(native.rows)}
  const pointAt=point(f.x,f.y),style=f.finish?STYLE_PALETTES[f.item]?.[f.finish]:undefined
  const offset=SPOUSE_FURNITURE[f.item]?.pixelOffset
  const wallShelf=!!layout.viewCamera&&['homeShelf','bookcase','shelf','bookshelf'].includes(f.item)
  const y=wallShelf?ground-42+(layout.viewOffset?.y??0)+4-art.rows.length:floor?ground-6+Math.max(0,Math.round((roomCoordinates(c,f.x,f.y).depth-1)*5))+(layout.viewOffset?.y??0):pointAt.y-art.rows.length+(offset?.y??(f.on?-6:0))
  objects.push({id:f.item,x:pointAt.x+(offset?.x??0),y,rows:f.mirrorX?art.rows.map(r=>[...r].reverse().join('')):art.rows,palette:style?{...FURNI_PALETTE,...style}:FURNI_PALETTE,source:'saved',floor,facing,viewFacing:projected})
 }
 return objects.sort((a,b)=>Number(b.floor)-Number(a.floor)||a.y+a.rows.length-b.y-b.rows.length)
}

export function storyHomeWallObjects(c:StoryLocationContext,w:number,ground:number){
 const b=c.layout?.bounds,walls=c.layout?.homeWalls
 if(!b||!walls)return []
 return [...walls.removed.map(key=>({key,removed:true})),...walls.built.map(key=>({key,removed:false}))].flatMap(v=>{
  const [x,y]=v.key.split(',').map(Number)
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<b.x0||x>=b.x0+b.w||y<b.y0||y>=b.y0+b.h)return []
  return [{...v,x:Math.round(w/2+(x-(b.x0+b.w/2))*18),y:Math.round(ground-48+(y-(b.y0+b.h/2))*12)}]
 })
}

/** Full native perimeter and edited partitions, with continuous sixteen-pixel joins. */
export function storyRoomWallObjects(c:StoryLocationContext,w:number,ground:number){
 const b=c.layout?.bounds,tiles=c.layout?.roomTiles
 if(!b||!tiles)return []
 return Object.entries(tiles).flatMap(([key,ch])=>{
  const [x,y]=key.split(',').map(Number)
  if(ch!=='#'&&ch!=='S'||x<b.x0||x>=b.x0+b.w||y<b.y0||y>=b.y0+b.h)return []
  const colors={a:C.wall,b:C.wallTop,c:C.wallDark},grid=Array.from({length:16},()=>Array<string>(16).fill('.'))
  const g={fillStyle:'',fillRect(this:{fillStyle:string},px:number,py:number,width:number,height:number){
   const symbol=Object.entries(colors).find(([,color])=>color===this.fillStyle)![0]
   for(let yy=py-y*16;yy<py-y*16+height;yy++)for(let xx=px-x*16;xx<px-x*16+width;xx++)grid[yy][xx]=symbol
  }}
  drawNativeRoomWall(g,x,y,(xx,yy)=>tiles[`${xx},${yy}`]??'_')
  return [{key,...mapRoomPoint(c,w,ground,x,y),rows:grid.map(r=>r.join('')),palette:colors}]
 })
}

/** Event-camera wall behind the floor, plus actual contents. Map perimeters are not floor props. */
export function drawStoryRoomLayout(p:Pixel,w:number,h:number,ground:number,c:StoryLocationContext){
 const floor=ground-42+(c.layout?.viewOffset?.y??0)
 p(0,0,'#dfd2b9',w,h);p(0,floor,'#c5a17d',w,h-floor);p(0,floor-3,'#947754',w,3)
 for(let y=floor+9;y<h;y+=12)p(0,y,'#b18a64',w,1)
 const objects=storyLayoutObjects(c,w,ground)
 for(const a of objects.filter(a=>a.floor))stamp(p,a.rows,a.palette,a.x,a.y)
 for(const a of objects.filter(a=>!a.floor)){
  // Small contact shadows show solid furniture projecting out onto the floor.
  // Neither the furniture snapshot nor the actor baseline is moved.
  if(['homeBed','bed','homeShelf','bookcase','homeHearth','hearth'].includes(a.id)){
   const foot=a.y+a.rows.length
   if(foot>=floor)p(a.x+2,foot,'#a48665',a.rows[0].length+2,2)
  }
  stamp(p,a.rows,a.palette,a.x,a.y)
 }
}

export function storyNewlandBuildings(c:StoryLocationContext,w:number,ground:number){
 if(c.map!=='newland'||c.indoors)return []
 const builds=c.layout?.newlandRevealed===false?[]:c.layout?.builds??[]
 return builds.filter(b=>Math.abs(b.x-c.at.x)<=12&&Math.abs(b.y-c.at.y)<=10).map(b=>{
  const kind=b.kind as BuildKind,asset=b.kind==='kidWork'?(b.job&&OLD_BUILDINGS[b.job]?b.job:'cook'):SITES[kind]?.assetId??b.kind
  const art=(b.state==='done'?OLD_BUILDINGS:OLD_CONSTRUCTION)[asset]?.[b.facing]
  const nativeHouse=hasHouseLook(kind)&&b.state==='done',width=widthOf(kind,b.size)
  const offset=!nativeHouse&&hasHouseLook(kind)?mainOffset(width):0
  return art?{id:b.id,state:b.state,x:Math.round(w/2+(b.x+offset-c.at.x)*16),y:Math.round(ground-art.rows.length+(b.y+4-c.at.y)*16),rows:art.rows,width:nativeHouse?width*16:art.rows[0].length,house:nativeHouse?{kind,facing:b.facing,look:b.look,width}:null}:null
 }).filter((b):b is NonNullable<typeof b>=>b!==null&&b.x<w&&b.x+b.width>0).sort((a,b)=>a.y+a.rows.length-b.y-b.rows.length)
}
export function drawStoryNewlandBuildings(p:Pixel,w:number,ground:number,c:StoryLocationContext){
 if(c.map!=='newland'||c.indoors)return
 const dx=Math.round(w/2-c.at.x*16),dy=Math.round(ground-(c.at.y+1)*16)
 const archiveCanvas={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,width:number,height:number){p(x+dx,y+dy,this.fillStyle,width,height)}}
 drawLibraryExterior(archiveCanvas,{x0:ARCHIVE.x0,y0:ARCHIVE.y0,x1:ARCHIVE.x0+ARCHIVE.w-1,y1:ARCHIVE.door.y,doorX:ARCHIVE.door.x},OT_LIBRARY_ROOF)
 for(const a of storyNewlandBuildings(c,w,ground)){
  if(a.house){
   const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,width:number,height:number){p(a.x+x,a.y+y,this.fillStyle,width,height)}} as CanvasRenderingContext2D
   drawNewlandHouse(g,a.house.kind,a.house.facing,a.house.look,seasonOf(c.day)==='winter',a.house.width)
  }else stamp(p,a.rows,OLD_VILLAGE_PALETTE,a.x,a.y)
 }
}

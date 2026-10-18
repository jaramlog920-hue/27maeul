import type {GameState} from '../engine/game'
import type {MapId} from '../engine/maps'
import type {DatePlace} from '../engine/romance'
import type {Tile,Weather} from '../engine/types'
import {ROOMS,MAP,homeLayoutOverrideAt} from '../engine/world'
import {WORKSHOP,PARTNER_ROOM,BABY_ROOM,LIVING_ROOM} from '../engine/home-layout'
import {INTERIOR,ROOM_SLOTS} from '../engine/newland-config'
import {weatherOf} from '../engine/calendar'
import {FIXTURES} from '../engine/home-layout'
import {INTERIOR_DESK,INTERIOR_SHELF} from '../engine/newland-config'
import type {Furniture} from '../engine/room'
import type {Build} from '../engine/newland-build'
import type {TileKind} from '../engine/newland-sites'
import {ownerJob} from '../engine/kid-work'
import spouseRooms from '../content/spouse-rooms.json'

export type StoryLocationState=Pick<GameState,'player'|'clock'>&Partial<Pick<GameState,'map'|'homeLevel'|'newland'|'scenes'|'room'|'rooms'|'flags'|'homeWalls'|'romance'|'child'|'siblings'|'gen'>>
export interface StoryLocationLayout {
 /** Read-only event camera direction; furniture keeps its saved world facing. */
 viewCamera?:import('../engine/types').Facing
 /** Event-camera translation only; never written to room furniture or the player's tile. */
 viewOffset?:{x:number;y:number}
 bounds:{x0:number;y0:number;w:number;h:number}|null
 furniture:readonly (Furniture&{mirrorX?:boolean})[]
 fixed:readonly {x:number;y:number;ch:string}[]
 builds:readonly (Pick<Build,'id'|'kind'|'x'|'y'|'facing'|'state'|'look'|'size'|'owner'>&{job?:string|null})[]
 tiles?:Readonly<Record<string,TileKind>>
 homeWalls?:{built:readonly string[];removed:readonly string[]}
 unlocks:Readonly<Record<string,number>>
 villageLevel?:number
 newlandRevealed?:boolean
 roomTiles?:Readonly<Record<string,string>>
}
export interface StoryRoomContext {
 kind:'home'|'neighbor'|'newland-archive'|'newland-home'
 owner:string|null
 buildingId?:string
 slot?:number
}
/** UI-only provenance, kept outside GameState and its save format. */
export interface DateArtOrigin {place:DatePlace;day:number;partner:string;map:MapId;at:Tile;minute:number}
export interface StoryLocationContext {
 mode:'game'|'preview'
 map:MapId
 at:Tile
 day:number
 minute:number
 weather:Weather
 indoors:boolean
 room:StoryRoomContext|null
 datePlace:DatePlace|null
 dateSource:'explicit'|'queue'|'unavailable'
 layout?:StoryLocationLayout
}
type Rect={x0:number;y0:number;w:number;h:number}
const within=(at:Tile,r:Rect)=>at.x>=r.x0&&at.x<r.x0+r.w&&at.y>=r.y0&&at.y<r.y0+r.h
const inHomePart=(at:Tile,r:{x0:number;y0:number;x1:number;y1:number})=>within(at,{...r,w:r.x1-r.x0+1,h:r.y1-r.y0+1})

function queuedDate(scenes:readonly string[]):DatePlace|null {
 for(let i=scenes.length-1;i>=0;i--){
  const id=scenes[i]
  if(id==='dateTea'||id.startsWith('date:tea:'))return 'tea'
  if(id==='dateSunset'||id.startsWith('date:sunset:'))return 'sunset'
  if(id==='dateWalk'||id.startsWith('date:walk:'))return 'walk'
 }
 return null
}

/** Pure snapshot: never calls syncHome, setActiveMap, tileAt, roomAt, or a save/album writer. */
export function storyLocationContext(state?:StoryLocationState,options:{datePlace?:DatePlace;preview?:Partial<Pick<StoryLocationContext,'map'|'at'|'day'|'minute'|'weather'>>}={}):StoryLocationContext {
 const map=state?.map??options.preview?.map??'village',at={x:state?.player.x??options.preview?.at?.x??24,y:state?.player.y??options.preview?.at?.y??18}
 const day=state?.clock.day??options.preview?.day??1,minute=state?.clock.minute??options.preview?.minute??900
 let room:StoryRoomContext|null=null
 if(map==='newland'){
  if(within(at,INTERIOR))room={kind:'newland-archive',owner:'library'}
  else {
   const slot=ROOM_SLOTS.findIndex(r=>within(at,r))
   const build=slot>=0?state?.newland?.builds.find(b=>b.slot===slot&&b.state==='done'):undefined
   if(build)room={kind:'newland-home',owner:build.owner??null,buildingId:build.id,slot}
  }
 }else{
  const parts=[WORKSHOP,...[PARTNER_ROOM,BABY_ROOM,LIVING_ROOM].slice(0,Math.max(0,Math.min(3,state?.homeLevel??0)))]
  if(parts.some(part=>inHomePart(at,part)))room={kind:'home',owner:'player'}
  else {const r=ROOMS.find(r=>within(at,r));if(r)room={kind:'neighbor',owner:r.owner}}
 }
 const family={child:state?.child??null,siblings:state?.siblings,gen:state?.gen}
 const layout:StoryLocationLayout={bounds:null,furniture:[],fixed:[],builds:map==='newland'?(state?.newland?.builds??[]).map(({id,kind,x,y,facing,state,look,size,owner})=>({id,kind,x,y,facing,state,...(look?{look:{...look}}:{}),...(size?{size}:{}),...(owner?{owner}:{}),...(kind==='kidWork'?{job:ownerJob(family,owner)}:{})})):[],villageLevel:state?.flags?.villageLevel??0,unlocks:Object.fromEntries(Object.entries(state?.flags??{}).filter(([key])=>key.startsWith('unlock:'))),...(map==='newland'?{tiles:{...state?.newland?.tiles},newlandRevealed:state?.flags?!!state.flags.newlandRevealed:true}:{})}
 if(room?.kind==='home'){
  const parts=[WORKSHOP,...[PARTNER_ROOM,BABY_ROOM,LIVING_ROOM].slice(0,Math.max(0,Math.min(3,state?.homeLevel??0)))],part=parts.find(p=>inHomePart(at,p))??WORKSHOP
  layout.bounds={x0:part.x0,y0:part.y0,w:part.x1-part.x0+1,h:part.y1-part.y0+1}
  const furniture=state?.room??Object.entries(FIXTURES).map(([item,f])=>({item:item as Furniture['item'],x:f.x,y:f.y}))
  layout.furniture=furniture.filter(f=>within(f,layout.bounds!)).map(f=>({...f}))
  // Fixed home objects are movable inventory furniture too; do not resurrect a removed desk.
  layout.fixed=[]
  const design=state?.romance?.stage==='married'?spouseRooms.find(d=>d.id===state.romance?.partner):undefined
  const level=Math.max(0,Math.min(3,state?.homeLevel??0)),tiles:Record<string,string>={}
  for(let y=part.y0-1;y<=part.y1+1;y++)for(let x=part.x0-1;x<=part.x1+1;x++){
   const key=`${x},${y}`
   tiles[key]=level>0&&state?.homeWalls?.built.includes(key)?'#':level>0&&state?.homeWalls?.removed.includes(key)?'f':homeLayoutOverrideAt(x,y,level,design?.window.x??5)??MAP[y]?.[x]??'_'
  }
  layout.roomTiles=tiles
  if(part===PARTNER_ROOM)layout.fixed=[{x:PARTNER_ROOM.x0+(design?.window.x??5),y:PARTNER_ROOM.y0,ch:'N'}]
  layout.homeWalls={built:[...(state?.homeWalls?.built??[])],removed:[...(state?.homeWalls?.removed??[])]}
 }else if(room?.kind==='neighbor'){
  const actual=ROOMS.find(r=>r.owner===room.owner)!
  layout.bounds={x0:actual.x0,y0:actual.y0,w:actual.w,h:actual.h}
  layout.furniture=actual.decor.map(([x,y,item,style])=>({item,x:actual.x0+x+(style==='half'?.5:0),y:actual.y0+y,...(style==='flip'?{mirrorX:true}:{})}))
  layout.fixed=actual.things.map(([x,y,ch])=>({x:actual.x0+x,y:actual.y0+y,ch}))
 }else if(room?.kind==='newland-archive'){
  layout.bounds={...INTERIOR};layout.furniture=(state?.rooms?.['newland:archive']??[]).map(f=>({...f}))
  layout.fixed=[{...INTERIOR_DESK.tile,ch:'d'},{...INTERIOR_SHELF.tile,ch:'s'}]
 }else if(room?.kind==='newland-home'&&room.slot!==undefined){
  const {x0,y0,w,h}=ROOM_SLOTS[room.slot];layout.bounds={x0,y0,w,h}
  layout.furniture=(state?.rooms?.[`newland:${room.buildingId}`]??[]).map(f=>({...f}))
 }
 const queuePlace=queuedDate(state?.scenes??[]),datePlace=options.datePlace??queuePlace
 return {mode:state?'game':'preview',map,at,day,minute,weather:state?weatherOf(day):options.preview?.weather??weatherOf(day),indoors:room!==null,room,datePlace,dateSource:options.datePlace?'explicit':queuePlace?'queue':'unavailable',layout}
}

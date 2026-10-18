import {drawEventPrecipitation} from './event-precipitation'
import type {StoryLocationContext} from './story-location-context'
import {MAP,PLACES} from '../engine/world'
import {bench} from './bond-decor-art'
import {isMarketDay} from '../engine/calendar'
import {drawFamilyRoomBackground} from './family-room-background'
import {drawBakeryRoomBackground} from './bakery-room-background'
import {drawCarpenterRoomBackground} from './carpenter-room-background'
import {drawWeaverRoomBackground} from './weaver-room-background'
import {drawLibraryRoomBackground} from './library-room-background'
import {drawHallRoomBackground} from './hall-room-background'
import {drawTeaRoomBackground} from './tea-room-background'
import {drawTeaFrontBackground} from './tea-front-background'
import {drawGrandpaRoomBackground} from './grandpa-room-background'
import {drawPostmanBackground} from './postman-background'
import {drawForgeRoomBackground,drawForgeBellows} from './forge-room-background'
import {drawOilRoomBackground,drawOilPressHandle} from './oil-room-background'
import {drawHomeYardBackground} from './home-yard-background'
import {drawMarketSquareBackground} from './market-square-background'
import {drawRiverRestBackground} from './river-rest-background'
import {drawPastureGround} from './pasture-ground'
import {drawBeeFieldBackground} from './bee-field-background'
import {drawSunsetBackground} from './sunset-background'
import {OLD_VILLAGE_PALETTE,OLD_PROPS} from './old-village-art'
import {drawStoryRoomLayout,drawStoryNewlandBuildings} from './story-layout-art'
import {drawStoryNewlandTerrain} from './story-terrain-art'
import {drawStoryBondDecor} from './story-bond-decor'
import {drawStoryNewlandBase} from './story-newland-base'
import {drawSheepPastureBackground} from './sheep-pasture-background'
import {drawStorySheep} from './story-sheep-art'

export type SharedBackgroundKey='home'|'family-room'|'bakery'|'carpenter'|'weaver'|'library'|'hall'|'tea-room'|'tea-front'|'grandpa'|'postman'|'forge'|'oil'|'home-yard'|'hill'|'square'|'river'|'bees'|'path'|'pasture'|'sheep-pasture'|'sunset'|'newland-ground'|'newland-room'

/** The speaker's job is deliberately not an input. Unknown outdoors remain outdoors. */
export function sharedBackgroundKey(c:StoryLocationContext,returning=false):SharedBackgroundKey {
 if(returning&&c.datePlace)return c.datePlace==='tea'?'tea-front':c.datePlace==='sunset'?'sunset':'pasture'
 if(c.map==='newland')return c.indoors?(c.room?.kind==='newland-archive'?'library':'newland-room'):'newland-ground'
 if(c.indoors){
  if(c.room?.kind==='home')return 'home'
  const owner=c.room?.owner
  if(owner==='baker')return 'bakery'
  if(owner==='carpenter')return 'carpenter'
  if(owner==='weaver')return 'weaver'
  if(['library','acts','letters','rev','hebJud'].includes(owner??''))return 'library'
  if(owner==='hall')return 'hall'
  if(owner==='teahouse')return 'tea-room'
  if(owner==='grandpa')return 'grandpa'
  if(owner==='postman')return 'postman'
  // Shared lodging: use the actual station at the player's side of the room.
  if(owner==='lodging')return c.at.x<=11?'forge':c.at.x>=21?'oil':'hall'
  return 'family-room'
 }
 const {x,y}=c.at
 if(x<=11&&y<=12)return 'home-yard'
 // The native hill bench and its approach overlap the broad square rectangle.
 // Resolve that actual map landmark before the square, independently of the speaker.
 const hill=PLACES.hill.tiles![0]
 if(Math.abs(x-hill.x)<=2&&y>=hill.y&&y<=hill.y+1)return 'hill'
 if(y>=32)return 'river'
 if(x>=40&&y>=26&&y<=32)return 'bees'
 if(x>=14&&x<=29&&y>=12&&y<=21)return 'square'
 if(x>=0&&x<=11&&y>=25&&y<=31)return 'sheep-pasture'
 return MAP[Math.round(y)]?.[Math.round(x)]===','?'path':'pasture'
}

/** Shared backdrop layer only. Every event adds its own cast, props and original action stages. */
export function drawSharedStoryBackground(g:CanvasRenderingContext2D,w:number,h:number,t:number,c:StoryLocationContext,returning=false){
 const ground=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),night=c.minute>=1260||c.minute<300,evening=!night&&c.minute>=1020,wet=c.weather==='rain'||c.weather==='snow'
 const key=sharedBackgroundKey(c,returning),f=ground-22,cx=Math.round(w/2)
 const alreadyNight=['hall','grandpa','postman','forge'].includes(key)||(['home','family-room'].includes(key)&&!c.layout?.bounds)
 const p=(x:number,y:number,color:string,a=1,b=1)=>{
  const tone=night&&!alreadyNight?[.59,.65,.78]:!c.indoors&&wet?[.88,.91,.94]:null
  g.fillStyle=tone&&/^#[\da-f]{6}$/i.test(color)?'#'+[0,1,2].map(i=>Math.round(parseInt(color.slice(1+i*2,3+i*2),16)*tone[i]).toString(16).padStart(2,'0')).join(''):color
  g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))
 }
 const stamp=(rows:readonly string[],palette:Record<string,string>,x:number,y:number,scale=1)=>rows.forEach((r,yy)=>[...r].forEach((ch,xx)=>{if(ch!=='.'&&palette[ch])p(x+xx*scale,y+yy*scale,palette[ch],scale,scale)}))
 g.imageSmoothingEnabled=false
 switch(key){
  case 'home':case 'family-room':if(c.layout?.bounds)drawStoryRoomLayout(p,w,h,ground,c);else drawFamilyRoomBackground(p,w,h,ground,night);break
  case 'bakery':drawBakeryRoomBackground(p,w,h,f);break
  case 'carpenter':drawCarpenterRoomBackground(p,w,h,f);break
  case 'weaver':drawWeaverRoomBackground(p,w,h,f);break
  case 'library':
   if(c.layout?.bounds&&(c.map==='newland'||c.room?.owner!=='library'))drawStoryRoomLayout(p,w,h,ground,c)
   else {drawLibraryRoomBackground(p,w,h,ground-29,c.map==='newland');if(c.map==='newland')stamp(OLD_PROPS.scrollCabinet.rows,OLD_VILLAGE_PALETTE,cx+83,ground-63,2)}
   break
  case 'hall':drawHallRoomBackground(p,w,h,f,wet,night,t);break
  case 'tea-room':drawTeaRoomBackground(p,w,h,f);break
  case 'tea-front':drawTeaFrontBackground(p,w,h,ground-17);break
  case 'grandpa':drawGrandpaRoomBackground(p,w,h,f,night);break
  case 'postman':drawPostmanBackground(p,w,h,f,{minute:c.minute,indoors:true,wet,snow:c.weather==='snow',at:c.at},t);break
  case 'forge':
   drawForgeRoomBackground(p,w,h,f,night)
   if((c.layout?.unlocks['unlock:bigBellows']??0)>0)drawForgeBellows(p,w,ground)
   break
  case 'oil':
   drawOilRoomBackground(p,w,h,ground-44)
   if((c.layout?.unlocks['unlock:pressHandle']??0)>0)drawOilPressHandle(p,w,ground-44)
   break
  case 'home-yard':drawHomeYardBackground(p,w,h,ground-35);break
  case 'hill':{
   drawPastureGround(p,w,h,ground-8)
   const hill=PLACES.hill.tiles![0],dx=Math.round(cx-c.at.x*16),dy=Math.round(ground-(c.at.y+1)*16)
   if(MAP[hill.y]?.[hill.x]==='B')bench({fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){p(x+dx,y+dy,this.fillStyle,a,b)}} as Parameters<typeof bench>[0],hill)
   break
  }
  case 'square':drawMarketSquareBackground(p,w,h,ground-13,isMarketDay(c.day),evening,wet,t,false);break
  case 'river':drawRiverRestBackground(p,w,h,t,ground-66,ground-12,evening||night);break
  case 'bees':drawBeeFieldBackground(p,w,h,ground-15);break
  case 'sheep-pasture':drawSheepPastureBackground(p,w,h,ground-8,false);drawStorySheep(p,w,ground,t,c);break
  case 'sunset':drawSunsetBackground(g,w,h,t,ground-64,ground-10,ground+10);break
  case 'newland-room':
   if(c.layout?.bounds){drawStoryRoomLayout(p,w,h,ground,c);break}
   drawStoryRoomLayout(p,w,h,ground,c)
   break
  case 'newland-ground':
   // Empty ground stays empty. Do not invent village houses or unbuilt newland homes.
   drawPastureGround(p,w,h,ground-8)
   drawStoryNewlandBase(p,w,h,ground,c)
   drawStoryNewlandTerrain(p,w,ground,c)
   drawStoryNewlandBuildings(p,w,ground,c)
   break
  default:
   drawPastureGround(p,w,h,ground-8)
   if(key==='path')p(0,ground-14,'#c6b28a',w,h-ground+14)
 }
 drawStoryBondDecor(p,w,ground,t,c,returning)
 if(!c.indoors&&c.weather==='snow')for(let i=0;i<24;i++)p((i*43+13)%w,ground+8+i%5*9,'#e4e3cf',6,2)
 if(!c.indoors&&wet)drawEventPrecipitation(p,w,h,t,c.weather==='snow',night)
 return {ground,key}
}

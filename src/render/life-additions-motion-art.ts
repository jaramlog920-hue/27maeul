// 자산 전용. 게임 렌더러·일과·저장 상태에는 연결하지 않는다.
import type { Facing } from '../engine/types'
import { withLookDefaults, type FullAvatar } from '../engine/avatar'
import { spriteRows, writerPalette } from './sprites'
import { furnitureUseFrame, USE_PROP_PALETTE } from './furniture-use-motion'
import { extraUseFrame } from './expansion-life-motion'
import { quietLifeRows } from './quiet-life-motion'
import { FURNI_PALETTE } from './furniture-art'
import { SETTLEMENT_GUESTS } from './settlement-guests-art'

export const ADDITION_PROP_PALETTE={...FURNI_PALETTE,...USE_PROP_PALETTE,Q:'#dfc77f',q:'#977951'}
export const ADDITION_AVATAR=withLookDefaults({look:'f',name:'동작 예시',skin:2,hairFront:8,hairBack:4,top:13,bottom:4})
export const TODDLER_ACTIONS=['walk','crawl','plop','reach'] as const
export const CHILD_ACTIONS=['write','read','carryBasket','give'] as const
export const ELDER_ACTIONS=['sitDown','standUp','straighten','wave'] as const
export const ARRIVAL_ACTIONS=['arrive','putLuggage','receiveKey','doorGreet'] as const
export const ADDITION_MOTION_LABELS:Record<string,string>={walk:'아장아장 걷기',crawl:'기어가기',plop:'주저앉기',reach:'손 내밀기',write:'앉아 글쓰기',read:'책 넘기기',carryBasket:'바구니 심부름',give:'물건 건네기',sitDown:'천천히 앉기',standUp:'천천히 일어나기',straighten:'허리 펴기',wave:'손 흔들기',arrive:'짐 들고 도착',putLuggage:'짐 내려놓기',receiveKey:'입주 열쇠 받기',doorGreet:'문 앞 인사'}
const empty=()=>Array<string>(24).fill('.'.repeat(24))
function board(){const p=Array.from({length:24},()=>Array<string>(24).fill('.'));return {p,put(x:number,y:number,c:string){if(p[y]?.[x]!==undefined)p[y][x]=c},rows:()=>p.map(r=>r.join(''))}}
function actorCanvas(rows:string[],oy=4){const b=board();rows.forEach((r,y)=>[...r].forEach((c,x)=>b.put(7+x,oy+y,c)));return b.rows()}
function result(actor:string[],avatar:FullAvatar,prop=empty(),facing:Facing='down',duration=300,loop=true,anchor={x:12,y:18}){return {actor,propBack:facing==='up'?prop:empty(),propFront:facing==='up'?empty():prop,palette:writerPalette('spring',avatar),anchor,duration,loop}}
function opts(avatar:FullAvatar,short?:number,elder=false){return {frame:0 as const,blink:false,avatar,short,elder}}

export function toddlerMotionFrame(action:typeof TODDLER_ACTIONS[number],facing:Facing,frame:number,avatar=ADDITION_AVATAR){
 const f=((frame%4)+4)%4,o=opts(avatar,0),source=spriteRows('writer',facing,{...o,frame:action==='walk'?([0,1,0,2] as const)[f]:0})
 if(action==='walk')return result(actorCanvas(source,f%2?5:4),avatar,empty(),facing,220,true,{x:12,y:4+source.length})
 if(action==='plop'){
  const b=board(),drop=[0,1,2,2][f]
  source.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.')b.put(7+x,4+y+drop-(y>=source.length-3?drop+1:0),c)}))
  if(f>=2){for(let x=8;x<16;x++)b.put(x,4+source.length-1,source[source.length-3][x-7]??'.');b.put(8,4+source.length,'k');b.put(15,4+source.length,'k')}
  return result(b.rows(),avatar,empty(),facing,260,false,{x:12,y:4+source.length})
 }
 if(action==='reach'){
  const a=actorCanvas(source).map(r=>[...r]),y=10+[2,1,0,1][f],x=facing==='left'?5:facing==='right'?17:14
  for(let yy=11;yy<18;yy++)for(const xx of [7,8,15,16])if(['s','5'].includes(a[yy][xx]))a[yy][xx]='.'
  a[y][x]='s';a[y+1][x]='5';a[y+2][x]=source[8]?.[8]??'r'
  return result(a.map(r=>r.join('')),avatar,empty(),facing,260,false,{x:12,y:4+source.length})
 }
 // 기어가는 몸은 머리·상의·하의를 별도로 재배치한다. 얼굴을 회전하지 않는다.
 const b=board(),side=facing==='left'||facing==='right',headX=facing==='left'?3:facing==='right'?11:7,headY=side?7:6
 source.slice(0,7).forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.')b.put(headX+x,headY+y+(f%2),c)}))
 const shirt='r',pants='d'
 for(let y=13;y<17;y++)for(let x=side?(facing==='left'?10:5):9;x<(side?(facing==='left'?18:13):15);x++)b.put(x,y,y<15?shirt:pants)
 const hx=facing==='left'?5:facing==='right'?19:8,kx=facing==='left'?17:facing==='right'?5:15
 b.put(hx,17+(f%2),'s');b.put(hx+1,17+(f%2),'5');b.put(kx,17+(1-f%2),pants);b.put(kx+1,18,'k')
 return result(b.rows(),avatar,empty(),facing,240,true,{x:12,y:19})
}

function basketProp(facing:Facing,frame:number){const b=board(),x=facing==='left'?2:facing==='right'?15:8,y=12+frame%2
 for(let yy=0;yy<6;yy++)for(let xx=0;xx<7;xx++)if(yy>=2||xx===1||xx===5)b.put(x+xx,y+yy,yy===2||yy===5?'W':(xx+yy)%2?'l':'w')
 return b.rows()}
export function childMotionFrame(action:typeof CHILD_ACTIONS[number],facing:Facing,frame:number,avatar=ADDITION_AVATAR){
 const f=((frame%4)+4)%4,o=opts(avatar,1),base=action==='read'?furnitureUseFrame('writer',facing,'read',f,o):action==='write'?extraUseFrame('writer',facing,'draw',f,o):extraUseFrame('writer',facing,action==='give'?'give':'carry',f,o)
 if(action==='carryBasket'||action==='give'){
  let actor=base.actor
  if(action==='carryBasket'){
   const walking=actorCanvas(spriteRows('writer',facing,{...o,frame:([0,1,0,2] as const)[f]})).map(r=>[...r])
   // 손을 지운 뒤 기존 물건 들기 자세의 손만 옮긴다.
   for(let y=11;y<18;y++)for(let x=0;x<24;x++)if(['s','5'].includes(walking[y][x]))walking[y][x]='.'
   for(let y=11;y<17;y++)for(let x=0;x<24;x++)if(['s','5'].includes(base.actor[y][x]))walking[y][x]=base.actor[y][x]
   actor=walking.map(r=>r.join(''))
  }
  return result(actor,avatar,basketProp(facing,f),facing,240,action!=='give',base.anchor)
 }
 return {...base,palette:writerPalette('spring',avatar),duration:action==='read'?350:260,loop:true}
}
export function elderMotionFrame(action:typeof ELDER_ACTIONS[number],facing:Facing,frame:number,avatar=ADDITION_AVATAR){
 const f=((frame%4)+4)%4,o=opts(avatar,undefined,true)
 if(action==='sitDown'||action==='standUp'){
  const base=extraUseFrame('writer',facing,action,f,o)
  return {...base,palette:writerPalette('spring',avatar),duration:450,loop:false}
 }
 if(facing==='down')return result(actorCanvas(quietLifeRows('writer',action==='wave'?'wave':'stretch',f,o)),avatar,empty(),facing,420,action==='wave')
 const a=actorCanvas(spriteRows('writer',facing,o)).map(r=>[...r]),side=facing==='left'||facing==='right',hx=facing==='left'?6:17
 if(action==='wave'&&f<3){a[9-f%2][hx]='s';a[10-f%2][hx]='5'}
 if(action==='straighten'&&(f===1||f===2)){
  // 머리만 한 화소 올리고 옷과 발 위치는 유지한다.
  for(let y=5;y<11;y++)for(let x=7;x<17;x++){a[y-1][x]=a[y][x];a[y][x]='.'}
  a[13][side?hx:8]='s';a[14][side?hx:8]='5'
 }
 return result(a.map(r=>r.join('')),avatar,empty(),facing,420,action==='wave')
}

export function guestArrivalFrame(id:keyof typeof SETTLEMENT_GUESTS,action:typeof ARRIVAL_ACTIONS[number],facing:Facing,frame:number){
 const f=((frame%4)+4)%4,def=SETTLEMENT_GUESTS[id],o=opts(def.avatar,undefined,def.elder)
 if(action==='doorGreet'){
  if(facing==='down')return result(actorCanvas(quietLifeRows('writer','wave',f,o)),def.avatar,empty(),facing,300,false)
  const base=extraUseFrame('writer',facing,'give',f,o);return {...base,propBack:empty(),propFront:empty(),palette:writerPalette('spring',def.avatar),duration:300,loop:false}
 }
 const base=extraUseFrame('writer',facing,action==='receiveKey'?'take':'carry',f,o),p=board(),x=facing==='left'?2:facing==='right'?15:8
 const y=action==='putLuggage'?[11,13,15,16][f]:12+f%2
 if(action==='receiveKey'){
  const ky=12-[0,1,2,2][f];for(const [dx,dy]of [[0,0],[1,0],[0,1],[1,1],[2,2],[3,2],[4,2],[3,3]])p.put(x+dx,ky+dy,'Q')
 } else {
  for(let dy=0;dy<7;dy++)for(let dx=0;dx<7;dx++)p.put(x+dx,y+dy,dy===0||dy===6||dx===0||dx===6?'W':dx===2||dx===4?'l':'w')
  p.put(x+2,y-2,'W');p.put(x+3,y-2,'W');p.put(x+4,y-2,'W');p.put(x+2,y-1,'W');p.put(x+4,y-1,'W')
 }
 if(action==='arrive'){
  const walking=actorCanvas(spriteRows('writer',facing,{...o,frame:([0,1,0,2] as const)[f]}))
  return result(walking,def.avatar,p.rows(),facing,240,true,base.anchor)
 }
 return result(base.actor,def.avatar,p.rows(),facing,320,false,base.anchor)
}

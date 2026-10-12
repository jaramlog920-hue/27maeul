// 자산 전용. 게임 렌더러·일과·저장 상태에는 연결하지 않는다.
import type { Facing } from '../engine/types'
import { withLookDefaults, type FullAvatar } from '../engine/avatar'
import { spriteRows, writerPalette } from './sprites'
import { motionBodyRows } from './motion-body'
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
/** 아이 몸통 옆에 붙는 짧은 소매와 손. 길게 뻗은 기본 손을 작업물 앞에서 덮어쓴다. */
function compactChildHands(rows:string[],facing:Facing){
 const a=rows.map(r=>[...r])
 const points=facing==='left'?[7]:facing==='right'?[16]:[9,14]
 for(const x of points){
  if(a[11]?.[x]!==undefined)a[11][x]='r'
  if(a[12]?.[x]!==undefined)a[12][x]='s'
  if(a[13]?.[x]!==undefined)a[13][x]='5'
 }
 return a.map(r=>r.join(''))
}

function hand(a:string[][],x:number,y:number){
 if(a[y]?.[x]!==undefined){a[y][x]='s';if(a[y][x+1]!==undefined)a[y][x+1]='s'}
 if(a[y+1]?.[x]!==undefined){a[y+1][x]='5';if(a[y+1][x+1]!==undefined)a[y+1][x+1]='5'}
}
function childWritingProp(facing:Facing,frame:number){
 const b=board(),side=facing==='left'||facing==='right',x=side?(facing==='left'?7:9):7,y=14
 // 작은 책상과 종이만 둔다. 큰 상자형 소품은 아이 몸을 가려 공놀이처럼 보였기 때문에 제거한다.
 for(let dx=0;dx<10;dx++)b.put(x+dx,y,'W')
 b.put(x+1,y-1,'l');b.put(x+2,y-1,'c');b.put(x+3,y-1,'c');b.put(x+4,y-1,'c');b.put(x+5,y-1,'l')
 b.put(x+2,y-2,'c');b.put(x+3,y-2,'c');b.put(x+4,y-2,'c')
 for(const lx of [x+1,x+8])for(let dy=1;dy<5;dy++)b.put(lx,y+dy,'w')
 b.put(x+3+(frame%2),y-2,'S');b.put(x+4+(frame%2),y-1,'S')
 return b.rows()
}

function toddlerCrawlRows(source:string[],facing:Facing,frame:number){
 const b=board(),side=facing==='left'||facing==='right',bob=frame%2,lead=frame%2
 const headX=facing==='left'?3:facing==='right'?11:7,headY=(side?7:6)+bob
 source.slice(0,7).forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.')b.put(headX+x,headY+y,c)}))
 // 몸통은 둥근 낮은 타원, 팔꿈치·무릎·손을 따로 찍어 네 발로 보이게 한다.
 const by=13+bob
 if(side){
  const bx=6
  for(const [dy,row]of ['..rrrr..','.rRrrRr.','.RRrrRR.'].entries())for(const [dx,c]of [...row].entries())if(c!=='.')b.put(bx+dx,by+dy,c)
  for(const [dx,c]of [[facing==='left'?5:14,'s'],[facing==='left'?4:15,'5'],[facing==='left'?7:12,'d'],[facing==='left'?12:7,'D']] as const)b.put(dx,by+3,c)
  const front=facing==='left'?4:15,back=facing==='left'?15:4
  b.put(front,by+4,'s');b.put(front+(facing==='left'?-1:1),by+4,'5')
  b.put(back,by+4,'s');b.put(back+(facing==='left'?1:-1),by+4,'5')
  b.put(facing==='left'?9:10,by+5,'k');b.put(facing==='left'?13:6,by+5,'k')
 }else{
  const bx=8
  for(const [dy,row]of ['.rrrrrr.','rRrrrrRr','.RRrrRR.'].entries())for(const [dx,c]of [...row].entries())if(c!=='.')b.put(bx+dx,by+dy,c)
  const left=bx+1+lead,right=bx+6-lead
  // 정면 기어가기는 하체를 그리지 않고 상체와 손끝만 남긴다.
  b.put(left,by+3,'s');b.put(right,by+3,'s')
  // 정면에서는 발을 앞으로 내밀지 않고 손과 무릎만 보여 기어가는 자세를 단순하게 읽힌다.
 }
 return b.rows()
}

function toddlerPlopRows(source:string[],facing:Facing,frame:number){
 const b=board(),side=facing==='left'||facing==='right',drop=[0,1,2,2][frame],headX=facing==='left'?3:facing==='right'?11:7
 source.slice(0,7).forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.')b.put(headX+x,5+y+drop,c)}))
 const by=12+drop,bx=side?7:8
 // 상체는 짧고 둥글게, 엉덩이와 무릎을 아래로 펼쳐 앉는 중심을 만든다.
 const torso=side?['.rrrrr.','rRrrrRr','.RRrrRR.']:['.rrrrr.','rRrrrRr','.RRrrRR.']
 for(const [dy,row]of torso.entries())for(const [dx,c]of [...row].entries())if(c!=='.')b.put(bx+dx,by+dy,c)
 if(side){
  const hx=facing==='left'?bx+6:bx-1;b.put(hx,by+2,'s');b.put(hx,by+3,'5')
  const knee=facing==='left'?bx+1:bx+4;b.put(knee,by+3,'d');b.put(knee+(facing==='left'?1:-1),by+4,'D')
  b.put(facing==='left'?bx:bx+6,by+5,'k');b.put(facing==='left'?bx+1:bx+5,by+5,'k')
 }else{
  b.put(bx-1,by+2,'s');b.put(bx-1,by+3,'5');b.put(bx+6,by+2,'s');b.put(bx+6,by+3,'5')
  b.put(bx-2,by+3,'d');b.put(bx-1,by+4,'D');b.put(bx+6,by+4,'D');b.put(bx+7,by+3,'d')
  // 정면으로 앉은 모습은 발을 감춰 무릎과 엉덩이 중심으로 보이게 한다.
 }
 return b.rows()
}

export function toddlerMotionFrame(action:typeof TODDLER_ACTIONS[number],facing:Facing,frame:number,avatar=ADDITION_AVATAR){
 const f=((frame%4)+4)%4,o=opts(avatar,0),source=spriteRows('writer',facing,{...o,frame:action==='walk'?([0,1,0,2] as const)[f]:0})
 if(action==='walk')return result(actorCanvas(source,f%2?5:4),avatar,empty(),facing,220,true,{x:12,y:4+source.length})
 if(action==='plop'){
  return result(toddlerPlopRows(source,facing,f),avatar,empty(),facing,300,false,{x:12,y:20})
 }
 if(action==='reach'){
  const a=actorCanvas(source).map(r=>[...r]),y=10+[2,1,0,1][f],x=facing==='left'?5:facing==='right'?17:14
  for(let yy=11;yy<18;yy++)for(const xx of [7,8,15,16])if(['s','5'].includes(a[yy][xx]))a[yy][xx]='.'
  a[y][x]='s';a[y+1][x]='5';a[y+2][x]=source[8]?.[8]??'r'
  return result(a.map(r=>r.join('')),avatar,empty(),facing,260,false,{x:12,y:4+source.length})
 }
 // 기어가는 몸은 머리·상의·하의를 낮고 길게 재배치한다. 얼굴을 회전하지 않는다.
 return result(toddlerCrawlRows(source,facing,f),avatar,empty(),facing,240,true,{x:12,y:20})
}

function basketProp(facing:Facing,frame:number){const b=board(),x=facing==='left'?2:facing==='right'?15:8,y=12+frame%2
 for(let yy=0;yy<6;yy++)for(let xx=0;xx<7;xx++)if(yy>=2||xx===1||xx===5)b.put(x+xx,y+yy,yy===2||yy===5?'W':(xx+yy)%2?'l':'w')
 return b.rows()}
export function childMotionFrame(action:typeof CHILD_ACTIONS[number],facing:Facing,frame:number,avatar=ADDITION_AVATAR){
 const f=((frame%4)+4)%4,o=opts(avatar,1),base=action==='read'?furnitureUseFrame('writer',facing,'read',f,o):action==='write'?extraUseFrame('writer',facing,'draw',f,o):extraUseFrame('writer',facing,action==='give'?'give':'carry',f,o)
 if(action==='write'){
  const source=motionBodyRows('writer',facing,{...o,frame:0,pose:'crouch'}),a=actorCanvas(source)
  const hands=a.map(r=>[...r]),side=facing==='left'||facing==='right'
  if(side)hand(hands,facing==='left'?8:13,12)
  else {hand(hands,9,12);hand(hands,13,12)}
  return result(hands.map(r=>r.join('')),avatar,childWritingProp(facing,f),facing,360,true,{x:12,y:19})
 }
 if(action==='carryBasket'||action==='give'){
  let actor=actorCanvas(motionBodyRows('writer',facing,o))
  if(action==='carryBasket'){
   actor=actorCanvas(motionBodyRows('writer',facing,{...o,frame:([0,1,0,2] as const)[f]}))
  }
  return result(compactChildHands(actor,facing),avatar,basketProp(facing,f),facing,240,action!=='give',base.anchor)
 }
 return {...base,actor:compactChildHands(furnitureUseFrame('writer',facing,'read',f,o,false).actor,facing),palette:writerPalette('spring',avatar),duration:action==='read'?350:260,loop:true}
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
 const base=extraUseFrame('writer',facing,action==='receiveKey'?'take':'carry',f,o),p=board()
 // 열쇠 받기는 기본 받기 포즈가 팔을 길게 뻗어 옷을 긁어내므로, 원래 옷을 보존한 서 있는 몸에 손만 얹는다.
 let actor=actorCanvas(motionBodyRows('writer',facing,{...o,frame:0})),x=facing==='left'?4:facing==='right'?14:9
 if(action==='receiveKey'){
  const ky=12-[0,1,2,2][f],keyX=facing==='left'?8:facing==='right'?14:12
  // 옷과 구별되는 황동색 열쇠: 가운데가 빈 고리, 긴 자루, 끝의 두 톱니.
  for(const [dx,dy]of [[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2]] as const)p.put(keyX+dx,ky+dy,'t')
  p.put(keyX+1,ky+1,'y');p.put(keyX+3,ky+1,'y');p.put(keyX+4,ky+1,'y');p.put(keyX+5,ky+1,'t');p.put(keyX+5,ky+2,'t');p.put(keyX+6,ky+2,'t')
  const hands=actor.map(r=>[...r]);hand(hands,facing==='left'?7:facing==='right'?13:11,ky+1);actor=hands.map(r=>r.join(''))
 } else {
  const y=[13,15,17,18][f]
  for(let dy=0;dy<5;dy++)for(let dx=0;dx<6;dx++)p.put(x+dx,y+dy,dy===0||dy===4||dx===0||dx===5?'W':dy===1?'l':'w')
  p.put(x+1,y-2,'W');p.put(x+2,y-2,'W');p.put(x+3,y-2,'W');p.put(x+4,y-2,'W');p.put(x+1,y-1,'l');p.put(x+4,y-1,'l')
  const hands=actor.map(r=>[...r]);hand(hands,facing==='left'?9:facing==='right'?13:10,Math.max(11,y-1));actor=hands.map(r=>r.join(''))
 }
 if(action==='arrive'){
  const walking=actorCanvas(motionBodyRows('writer',facing,{...o,frame:([0,1,0,2] as const)[f]})).map(r=>[...r])
  hand(walking,facing==='left'?9:facing==='right'?13:10,Math.max(11,[13,15,17,18][f]-1))
  return result(walking.map(r=>r.join('')),def.avatar,p.rows(),facing,240,true,base.anchor)
 }
 return result(actor,def.avatar,p.rows(),facing,320,false,base.anchor)
}

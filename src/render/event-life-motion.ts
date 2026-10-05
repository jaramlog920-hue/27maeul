import { spriteRows, type Who, type SpriteOpts } from './sprites'
import { pixels } from './home-space-art'
import { EVENT_PROPS } from './event-art'
import { WEDDING_PROPS } from './wedding-art'
import { EXPANSION_PROPS } from './expansion-prop-art'
import type { FurnitureArt } from './furniture-art'
import type { Facing } from '../engine/types'
export const EVENT_ACTIONS=['clap','blowCandle','shareFood','carryParcel','hangDecor','dance','smile','nod','taste','holdBaby','walkHand','spreadCloth','placePlate','clearDecor','unwrapGift','unveil','useGift'] as const
export type EventAction=typeof EVENT_ACTIONS[number]
export const EVENT_MOTION_LABELS:Record<EventAction,string>={clap:'박수',blowCandle:'촛불 불기',shareFood:'음식 나누기',carryParcel:'꾸러미 들고 걷기',hangDecor:'장식 걸기',dance:'잔치 춤',smile:'웃기',nod:'고개 끄덕이기',taste:'음식 맛보기',holdBaby:'아기 안기',walkHand:'아이와 손잡고 걷기',spreadCloth:'천 펼치기',placePlate:'접시 놓기',clearDecor:'장식 걷기',unwrapGift:'선물 풀기',unveil:'작품 공개하기',useGift:'받은 물건 살펴보기'}
export const EVENT_STATES={
 candleOut:pixels(1,1,[['k',2,10,12,4],['w',3,9,10,4],['l',4,8,8,3],['C',5,9,2,1],['C',9,9,2,1],['c',7,4,2,4],['W',7,3,1,1]]),
 giftOpen:pixels(1,1,[['k',2,8,12,6],['C',3,9,10,4],['W',4,9,8,2],['b',5,5,6,5],['l',6,5,4,1],['p',1,13,4,1],['p',12,4,3,2]]),
 artworkCovered:pixels(1,1,[['W',3,3,2,12],['W',11,3,2,12],['C',2,2,12,10],['c',3,3,10,7],['b',7,3,1,8]]),
 clothFolded:pixels(1,1,[['k',2,8,12,6],['c',3,9,10,4],['b',3,10,10,1],['B',5,9,1,4]]),
 plateEmpty:pixels(1,1,[['B',2,9,12,4],['c',3,9,10,3],['C',5,10,6,1]]),
}
export function eventMotionFrame(who:Who,facing:Facing,action:EventAction,frame:number,opts:SpriteOpts){
 const phase=((Math.trunc(frame)%4)+4)%4, side=facing==='left'||facing==='right', left=facing==='left'
 const a=Array.from({length:24},()=>Array<string>(24).fill('.')),p=Array.from({length:24},()=>Array<string>(24).fill('.'))
 const walking=action==='carryParcel'||action==='walkHand'||action==='dance'
 const source=spriteRows(who,facing,{...opts,frame:walking?(phase%2?1:2):0,pose:'stand',blink:opts.blink||(action==='smile'&&phase===2)})
 const bob=action==='dance'&&phase%2?1:0
 source.forEach((r,y)=>[...r].forEach((c,x)=>{a[4+y+bob][7+x]=c}))
 if(action==='nod'||action==='blowCandle'){
  const lower=phase===1||phase===2
  if(lower){for(let y=10;y>=4;y--)for(let x=7;x<17;x++){a[y+1][x]=a[y][x];a[y][x]='.'}}
 }
 const put=(x:number,y:number,c:string)=>{if(x>=0&&x<24&&y>=0&&y<24)a[y][x]=c}
 const hand=(x:number,y:number)=>{put(x,y,'s');put(x+1,y,'s');put(x,y+1,'5');put(x+1,y+1,'5')}
 if(!['smile','nod','blowCandle'].includes(action)){
  for(let y=11;y<19;y++)for(let x=7;x<17;x++)if(['s','5','!','K'].includes(a[y][x]))a[y][x]='.'
  const cx=left?5:side?16:11,hy=['hangDecor','clearDecor'].includes(action)?7+phase%2:action==='taste'?10+phase%2:13+phase%2
  if(action==='clap'){hand(side?cx:phase%2?11:8,hy);if(!side)hand(phase%2?13:15,hy)}
  else if(action==='dance'){hand(left?5:17,8+phase%2);hand(left?17:5,12-phase%2)}
  else{hand(cx,hy);if(!side)hand(15,hy)}
 }
 const propMap:Partial<Record<EventAction,string>>={shareFood:'snackPlate',carryParcel:'errandParcel',hangDecor:'ribbonSign',taste:'breadPlain',spreadCloth:'picnicCloth',placePlate:'snackPlate',clearDecor:'clothFolded',unwrapGift:phase<2?'giftBundle':'giftOpen',unveil:phase<2?'artworkCovered':'artworkComplete',useGift:'toyBoat'}
 const id=propMap[action];const assets:Record<string,FurnitureArt>={...EXPANSION_PROPS,...WEDDING_PROPS,...EVENT_PROPS,...EVENT_STATES}
 const attach=(rows:readonly string[],ox:number,oy:number)=>rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&ox+x>=0&&ox+x<24&&oy+y>=0&&oy+y<24)p[oy+y][ox+x]=c}))
 if(id){const art=assets[id],small=art.rows.filter((_,y)=>y%2===0).map(r=>[...r].filter((_,x)=>x%2===0).join(''));attach(small,left?1:side?15:8,['hangDecor'].includes(action)?4:action==='taste'?9:13+phase%2)}
 if(action==='blowCandle'){
  const art=phase<2?EVENT_PROPS.birthdayBread:EVENT_STATES.candleOut;attach(art.rows.filter((_,y)=>y%2===0).map(r=>[...r].filter((_,x)=>x%2===0).join('')),left?0:side?16:8,14)
  if(phase===1){const x=left?5:side?18:12;p[11][x]='c';p[12][x]='C'}
 }
 // Baby is a separate layer, not an adult recolor. Palette is the furniture skin/blanket palette.
 if(action==='holdBaby'){attach(['.kkkk.','kppppk','kpSkpk','.CppC.','..CC..'],side?(left?3:14):9,11+phase%2);hand(left?5:side?16:9,15+phase%2)}
 const empty=Array<string>(24).fill('.'.repeat(24)),rows=p.map(r=>r.join(''))
 return {actor:a.map(r=>r.join('')),propBack:facing==='up'?rows:empty,propFront:facing==='up'?empty:rows,anchor:{x:12,y:4+source.length+bob},handAnchor:{x:left?5:side?17:16,y:14+phase%2},duration:action==='blowCandle'?350:260,loop:['clap','carryParcel','dance','smile','nod','taste','holdBaby','walkHand'].includes(action)}
}


import { pixels } from './home-space-art'
import { spriteRows, type SpriteOpts, type Who } from './sprites'
import type { Facing } from '../engine/types'
import type { FurnitureArt } from './furniture-art'
type R=readonly [string,number,number,number,number]
const art=(r:R[],w=1,h=1)=>pixels(w,h,r)
export const WEDDING_PROPS:Record<string,FurnitureArt>={
  bouquet:art([['W',7,9,2,5],['g',4,7,8,3],['G',6,5,5,4],['p',3,4,4,4],['c',7,2,4,4],['r',10,5,3,3],['y',5,5,1,1],['y',8,3,1,1],['b',6,11,4,1]]),
  floralCrown:art([['g',2,5,12,2],['p',2,4,3,3],['c',6,3,3,3],['p',10,4,3,3],['y',3,5,1,1],['y',7,4,1,1],['y',11,5,1,1]]),
  boutonniere:art([['g',7,7,2,6],['G',9,10,3,2],['c',6,4,5,4],['y',8,5,1,2],['p',7,7,3,2]]),
  ringBoxClosed:art([['k',3,5,10,8],['b',4,6,8,6],['B',4,10,8,2],['c',7,9,2,1]]),
  ringBoxOpen:art([['k',3,2,10,5],['b',4,3,8,3],['k',3,8,10,6],['B',4,9,8,4],['y',6,9,4,3],['B',7,10,2,1]]),
  flowerPot:art([['k',3,10,10,4],['w',4,11,8,2],['G',4,6,8,4],['p',2,4,4,4],['c',7,2,4,4],['p',10,5,4,4],['y',3,5,1,1],['y',8,3,1,1]]),
  ribbonSign:art([['W',7,6,2,9],['k',2,2,12,7],['c',3,3,10,5],['p',3,5,3,1],['p',9,5,3,1],['y',7,5,1,1]]),
  feastTray:art([['k',1,9,14,5],['l',2,10,12,3],['w',3,7,4,4],['c',4,7,2,1],['p',9,8,4,3],['y',10,8,2,1]]),
  teaPair:art([['B',2,7,5,5],['c',3,7,3,1],['b',9,7,5,5],['c',10,7,3,1],['C',1,12,14,1]]),
  giftBundle:art([['k',2,5,12,9],['c',3,6,10,7],['p',7,5,2,9],['p',2,9,12,1],['p',5,3,2,2],['p',9,3,2,2]]),
  petalPatch:art([['p',2,4,2,1],['c',10,2,2,1],['p',7,8,2,1],['c',3,12,2,1],['p',12,11,2,1]]),
  candlePair:art([['W',2,13,12,1],['c',3,7,3,6],['C',10,5,3,8],['y',4,4,1,3],['y',11,2,1,3]]),
  aisle:art([['p',3,0,10,32],['c',4,0,8,32],['C',5,0,1,32],['C',10,0,1,32],['p',7,3,2,1],['p',7,27,2,1]],1,2),
  feastTable:art([['W',3,12,3,17],['W',42,12,3,17],['k',1,7,46,11],['c',2,8,44,8],['p',2,15,44,2],['b',5,9,7,4],['l',7,8,3,3],['B',17,10,4,4],['b',26,10,4,4],['C',34,9,8,4]],3,2),
}
function arch(back=false):FurnitureArt {
 const r:R[]=[['W',5,8,3,37],['W',56,8,3,37],['w',5,6,54,4],['l',6,6,52,1],['G',3,5,58,3],['g',3,10,6,30],['g',55,10,6,30],['z',3,45,10,2],['z',53,45,10,2]]
 for(const x of [4,14,25,36,47,56]){r.push([back?'C':'p',x,4,4,4],['c',x+1,5,2,2])}
 for(const y of [14,24,35])r.push(['p',4,y,4,4],['c',56,y,4,4])
 if(!back)r.push(['c',9,10,46,2],['C',9,12,3,7],['C',52,12,3,7])
 return art(r,4,3)
}
const side=art([['W',8,8,3,37],['w',7,6,18,4],['W',23,8,3,37],['G',6,5,20,3],['g',7,10,5,30],['g',22,10,5,30],['p',6,5,4,4],['c',22,5,4,4],['c',12,10,10,2]],2,3)
export const WEDDING_ARCH:Record<Facing,FurnitureArt>={down:arch(),up:arch(true),right:side,left:{...side,rows:side.rows.map(r=>[...r].reverse().join(''))}}
export const WEDDING_ACTIONS=['arrive','bow','offerFlowers','exchange','holdHands','celebrate'] as const
export type WeddingAction=typeof WEDDING_ACTIONS[number]
export const WEDDING_LABELS:Record<WeddingAction,string>={arrive:'식장에 들어오기',bow:'인사하기',offerFlowers:'꽃다발 건네기',exchange:'기념 반지 교환',holdHands:'손잡고 함께 서기',celebrate:'축하 인사'}
export function weddingActorFrame(who:Who,facing:Facing,action:WeddingAction,frame:number,opts:SpriteOpts){
 const f=((frame%4)+4)%4,rows=Array.from({length:24},()=>Array<string>(24).fill('.'))
 const pose=action==='celebrate'?(f%2?'wave':'handUp'):action==='offerFlowers'||action==='exchange'||action==='holdHands'?'handUp':action==='bow'&&f>0&&f<3?'crouch':'stand'
 const source=spriteRows(who,facing,{...opts,pose,frame:action==='arrive'?(f%2?1:2):0,blink:opts.blink||(action==='bow'&&f===2)})
 const oy=action==='bow'&&f>0&&f<3?6:4
 source.forEach((r,y)=>[...r].forEach((c,x)=>{rows[oy+y][7+x]=c}))
 const props=Array.from({length:24},()=>Array<string>(24).fill('.'))
 if(action==='offerFlowers'||action==='exchange'){
  const a=WEDDING_PROPS[action==='offerFlowers'?'bouquet':f>0&&f<3?'ringBoxOpen':'ringBoxClosed']
  const ox=facing==='left'?0:facing==='right'?15:8,py=action==='offerFlowers'?10+(f%2):12
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){const c=a.rows[y*2][x*2];if(c!=='.')props[py+y][ox+x]=c}
 }
 if(action==='holdHands'){
  const hx=facing==='left'?5:facing==='right'?17:16,hy=13+f%2
  rows[hy][hx]='s';rows[hy+1][hx]='5'
 }
 const empty=Array<string>(24).fill('.'.repeat(24)),pr=props.map(r=>r.join(''))
 return {actor:rows.map(r=>r.join('')),propBack:facing==='up'?pr:empty,propFront:facing==='up'?empty:pr,anchor:{x:12,y:18},duration:action==='bow'?280:240,loop:action==='arrive'||action==='holdHands'||action==='celebrate'}
}

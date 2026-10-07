// 도트 자산만 준비. 지도·일과·꾸미기·방 책장·아이템 아이콘 연결은 별도.
import type { Facing } from '../engine/types'
import type { GuestKind } from '../engine/game'
import { VISITOR_LOOKS } from './village-followup-art'
import { spriteRows,writerPalette } from './sprites'
import { BG_ART,BG_PALETTE } from './bg-materials-art'
import { FURNI_PALETTE } from './furniture-art'
import { memoryMarkerRows,MEMORY_PALETTE } from './life-additions-prop-art'

export function visitorWalkFrame(kind:GuestKind,facing:Facing,frame:number){
 const f=((frame%4)+4)%4,avatar=VISITOR_LOOKS[kind]
 const rows=spriteRows('writer',facing,{avatar,short:kind==='kid'?1:undefined,blink:false,frame:([0,1,0,2] as const)[f]})
 return {actor:Array.from({length:24},(_,y)=>y>=4&&y<4+rows.length?'.'.repeat(7)+rows[y-4]+'.'.repeat(7):'.'.repeat(24)),palette:writerPalette('spring',avatar),anchor:{x:12,y:4+rows.length},duration:180,loop:true}
}

export const PATH_BITS={north:1,east:2,south:4,west:8} as const
export const JOIN_PATH_PALETTE={...BG_PALETTE,S:'#d4bd98',s:'#c7ae87',C:'#c9c2b4',c:'#a99e90'}
export function joinedPathRows(material:'sand'|'stone',mask:number){
 const bits=mask&15,source=BG_ART[material],p=Array.from({length:16},()=>Array<string>(16).fill('.'))
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  const core=x>=4&&x<12&&y>=4&&y<12
  const branch=((bits&1)!==0&&x>=4&&x<12&&y<8)||((bits&2)!==0&&y>=4&&y<12&&x>=8)||((bits&4)!==0&&x>=4&&x<12&&y>=8)||((bits&8)!==0&&y>=4&&y<12&&x<8)
  if(core||branch)p[y][x]=source[y][x]
 }
 // 전체 길 안에서 반복되는 흙 결과 돌 줄눈. 타일 경계에서 끊기는 테두리는 없다.
 if(material==='sand')for(const [x,y]of [[5,6],[10,9],[6,11]])if(p[y][x]!=='.')p[y][x]='S'
 if(material==='stone')for(let y=0;y<16;y++)for(let x=0;x<16;x++)if(p[y][x]!=='.'){
  if(y===3||y===8||y===13||((y<8?x===7:x===3||x===11)))p[y][x]='c'
  else if((x+y)%7===0)p[y][x]='C'
 }
 return p.map(r=>r.join(''))
}
export function pathShapeLabel(mask:number){const count=[1,2,4,8].filter(bit=>mask&bit).length;return count===0?'독립 칸':count===1?'끝 조각':count===2?(mask===5||mask===10?'일자':'모서리'):count===3?'T자':'교차'}

export const EVENT_MEMORIES=['wedding','birth','feast','farewellLetter','moving','allBooks'] as const
export type EventMemory=typeof EVENT_MEMORIES[number]
export const EVENT_MEMORY_LABELS:Record<EventMemory,string>={wedding:'결혼',birth:'아이 출생',feast:'마을 잔치',farewellLetter:'이사 편지',moving:'새집·독립',allBooks:'스물일곱 권 완필'}
export const ARCHIVE_PROP_PALETTE={...FURNI_PALETTE,...MEMORY_PALETTE,N:'#657f86',n:'#a3bdba',Q:'#dbc07a',q:'#a78b54',V:'#d2c5ad',v:'#a99a81'}
function grid(w=16,h=16){const p=Array.from({length:h},()=>Array<string>(w).fill('.'));return {p,rect(x:number,y:number,ww:number,hh:number,c:string){for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+ww;xx++)if(p[yy]?.[xx]!==undefined)p[yy][xx]=c},rows:()=>p.map(r=>r.join(''))}}
export function eventMemoryRows(kind:EventMemory,frame=0){
 if(kind==='wedding'||kind==='birth')return memoryMarkerRows(kind,frame)
 const b=grid(),r=b.rect,f=((frame%4)+4)%4
 r(2,13,12,2,'v');r(3,13,10,1,'V')
 if(kind==='feast'){
  r(3,9,10,4,'w');r(4,8,8,2,'l');r(5,7,6,2,'C');r(7,4,2,3,'c');r(7,3,2,1,f%2?'Y':'y');r(2,2,12,1,'W');r(3,3,3,2,'p');r(10,3,3,2,'b')
 }else if(kind==='farewellLetter'){
  r(3,3,10,9,'W');r(4,4,8,7,'V');r(4,5,8,5,'c');r(5,5,2,1,'C');r(9,5,2,1,'C');r(6,6,4,1,'C');r(7,7,2,2,'R');r(7,7,1,1,'r');r(6,11,4,1,'l')
 }else if(kind==='moving'){
  r(3,7,10,6,'W');r(4,8,8,4,'w');r(5,8,1,4,'l');r(10,8,1,4,'l');r(6,4,4,1,'W');r(6,5,1,2,'W');r(9,5,1,2,'W');r(7,9,2,2,'Q')
 }else{
  r(3,4,10,9,'W');r(4,5,4,7,'c');r(8,5,4,7,'C');r(7,5,1,8,'w');r(5,7,2,1,'q');r(9,7,2,1,'q');r(5,9,2,1,'q');r(9,9,2,1,'q');r(5,2,6,2,'Q');r(6,2,1,1,'c')
 }
 r(1,11,2,2,'g');r(13,11,2,2,'g');r(1+f%2,10,1,1,'p');r(13-f%2,10,1,1,'p')
 return b.rows()
}

export const RANGE_SHELVES=['law','history','poetry','prophets'] as const
export function rangeShelfRows(kind:typeof RANGE_SHELVES[number],fill=12){
 const b=grid(),r=b.rect,count=Math.max(0,Math.min(12,Math.trunc(fill)))
 r(1,1,14,15,'W');r(2,2,12,13,'w');r(2,2,12,1,'l');r(2,14,12,1,'l')
 if(kind==='law'){
  r(6,3,1,11,'W');r(10,3,1,11,'W');r(2,8,12,1,'l')
  for(let i=0;i<count;i++){const col=Math.floor(i/4),row=i%4,x=3+col*4,y=4+row*2;r(x,y,2,1,i%2?'C':'c');r(x,y,1,1,'Q')}
 }else if(kind==='history'){
  for(const y of [6,10])r(2,y,12,1,'l');r(7,3,1,11,'W')
  for(let i=0;i<count;i++){const x=3+(i%4)*3,y=4+Math.floor(i/4)*4;r(x,y,1,2,'C');r(x+1,y,1,2,'c');r(x,y+1,2,1,'n')}
 }else if(kind==='poetry'){
  r(2,7,12,1,'l');r(2,12,12,1,'l');r(4,0,8,1,'l')
  for(let i=0;i<count;i++){const x=2+(i%6)*2,y=i<6?4:9;r(x,y,1,3,i%3===0?'g':i%3===1?'C':'p');r(x,y,1,1,'c')}
 }else{
  r(2,4,12,1,'N');r(2,9,12,1,'N');r(2,13,12,1,'l')
  for(let i=0;i<count;i++){const x=3+(i%6)*2,y=i<6?5:10;r(x,y,1,3,'c');r(x,y+1,1,1,'N')}
 }
 return b.rows()
}

export const GUEST_GIFT_IDS=['willowBasket','starChart','seedPouch'] as const
export const GIFT_LABELS={willowBasket:'버들 바구니',starChart:'별자리 그림판',seedPouch:'씨앗 주머니'}
export function guestGiftIconRows(id:typeof GUEST_GIFT_IDS[number],size:8|16=16){
 const b=grid(size,size),r=b.rect
 if(size===8){
  if(id==='willowBasket'){r(2,0,4,1,'W');r(1,1,1,3,'W');r(6,1,1,3,'W');r(0,3,8,1,'W');r(1,4,6,3,'w');r(1,7,6,1,'W');for(let x=2;x<7;x+=2)r(x,4,1,3,'l')}
  else if(id==='starChart'){r(0,0,8,8,'W');r(1,1,6,6,'N');r(2,3,4,1,'n');r(4,2,1,4,'n');for(const [x,y]of [[2,2],[4,3],[5,5],[2,6]])r(x,y,1,1,'Q')}
  else{r(2,0,4,1,'g');r(3,1,2,2,'W');r(1,3,6,4,'w');r(2,7,4,1,'W');r(2,3,4,1,'l');r(3,5,2,1,'g')}
 }else{
  if(id==='willowBasket'){
   r(5,1,6,1,'W');r(3,2,2,4,'W');r(11,2,2,4,'W');r(4,2,1,3,'l');r(11,2,1,3,'l');r(1,6,14,2,'W');r(2,8,12,6,'w');r(3,14,10,1,'W')
   for(let y=8;y<14;y++)for(let x=3;x<14;x++)if((x+y)%3===0)r(x,y,1,1,'l')
  }else if(id==='starChart'){
   r(1,1,14,14,'W');r(2,2,12,12,'N');r(2,2,12,1,'l');for(const [x,y,w,h]of [[4,5,5,1],[8,5,1,5],[8,9,4,1],[4,10,5,1]])r(x,y,w,h,'n')
   for(const [x,y]of [[4,4],[8,5],[11,9],[4,11]]){r(x,y,2,2,'Q');r(x,y,1,1,'c')}r(11,3,1,1,'c');r(3,8,1,1,'c')
  }else{
   r(5,1,6,2,'g');r(6,3,4,2,'W');r(4,5,8,1,'l');r(3,6,10,7,'w');r(4,13,8,2,'W');r(4,6,2,6,'l');r(7,8,2,4,'g');r(5,8,3,2,'G');r(8,7,3,2,'g');r(10,12,1,1,'Q')
  }
 }
 return b.rows()
}

// 2026-10-08 자산 전용. 제작·직업·서고·창문 기능은 연결 담당자가 별도로 구현한다.
import type { Facing } from '../engine/types'
import type { FullAvatar } from '../engine/avatar'
import { ADDITION_AVATAR } from './life-additions-motion-art'
import { WORK_DETAIL_PALETTE } from './work-details-motion-art'
import { spriteRows,writerPalette } from './sprites'

export const CRAFT_GROUPS={materials:['spreadPapyrus','pressPaper','spinThread','mixInk'],pottery:['kneadClay','shapePot','placePot'],instrument:['carveBody','tieStrings','pluckStrings'],herbal:['sortLeaves','grindHerbs','bottleHerbs'],scroll:['unroll','roll','tieScroll']} as const
export const CRAFT_ACTIONS=[...CRAFT_GROUPS.materials,...CRAFT_GROUPS.pottery,...CRAFT_GROUPS.instrument,...CRAFT_GROUPS.herbal,...CRAFT_GROUPS.scroll] as const
export type CraftAction=typeof CRAFT_ACTIONS[number]
export const CRAFT_LABELS:Record<CraftAction,string>={spreadPapyrus:'파피루스 펴기',pressPaper:'종이 누르기',spinThread:'실 자아내기',mixInk:'잉크 섞기',kneadClay:'진흙 주무르기',shapePot:'그릇 모양 잡기',placePot:'완성 그릇 내려놓기',carveBody:'악기 몸통 손질',tieStrings:'악기 줄 매기',pluckStrings:'줄 튕겨 확인하기',sortLeaves:'약초 잎 고르기',grindHerbs:'절구로 빻기',bottleHerbs:'약초 병에 담기',unroll:'두루마리 펼치기',roll:'두루마리 말기',tieScroll:'두루마리 끈 묶기'}
export const CRAFT_PALETTE={...WORK_DETAIL_PALETTE,E:'#b99176',e:'#d7b196',A:'#d8c8a7',a:'#b5a17a',F:'#b5c5b1',f:'#839882'}
function grid(w=32,h=32){const p=Array.from({length:h},()=>Array<string>(w).fill('.'));return {p,rect(x:number,y:number,ww:number,hh:number,c:string){for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+ww;xx++)if(p[yy]?.[xx]!==undefined)p[yy][xx]=c},rows:()=>p.map(r=>r.join(''))}}

export function craftFollowupFrame(action:CraftAction,facing:Facing,frame:number,avatar:FullAvatar=ADDITION_AVATAR){
 const f=((Math.trunc(frame)%4)+4)%4,side=facing==='left'||facing==='right',canonical=facing==='left'?'right':facing
 const person=grid(),source=spriteRows('writer',canonical,{frame:0,blink:false,avatar})
 source.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.')person.p[6+y][11+x]=c}))
 const a=person.p,b=grid(),r=(x:number,y:number,w:number,h:number,c:string)=>b.rect(x,y-5,w,h,c),x=side?18:10
 for(let y=13;y<25;y++)for(let xx=0;xx<32;xx++)if(['s','5','!','K'].includes(a[y][xx]))a[y][xx]='.'
 const hx=side?23:14,hy=action==='grindHerbs'?[20,18,22,20][f]:20+f%2,handY=hy-5
 const arm=(sx:number,tx:number)=>{
  person.rect(Math.min(sx,tx),13,Math.abs(sx-tx)+1,2,'r')
  person.rect(tx,14,2,Math.max(1,handY-13),'r');person.rect(tx,handY,2,1,'s');person.rect(tx,handY+1,2,1,'5')
 }
 arm(side?19:13,hx);if(!side)arm(18,20)
 r(x-2,24,15,2,'w');r(x-1,26,2,4,'W');r(x+9,26,2,4,'W')
 if(action==='spreadPapyrus'){
  const width=[3,6,9,11][f];r(x,19,width,4,'A');r(x+width-1,18,2,6,'a')
  for(let xx=1;xx<width-1;xx+=2)r(x+xx,20,1,2,'P')
 }else if(action==='pressPaper'){
  r(x,20,11,4,'P');r(x,23,11,1,'p');r(x+1,17+f%2,9,2,'W');r(x+2,17+f%2,7,1,'l');if(f===3)r(x+1,18,9,1,'.')
 }else if(action==='spinThread'){
  r(x,21,4,3,'C');r(x+1,20,2,2,'c');const sx=x+6+f%2
  r(sx,14,1,9,'W');r(sx-2,20,5,2,'w');r(sx-1,17,3,3,'P');r(sx-1,17,1,3,'p');r(x+3,19,3+f%2,1,'c');r(x+5,17,1,3,'c')
 }else if(action==='mixInk'){
  r(x+1,20,9,4,'r');r(x+2,19,7,2,'R');r(x+3,20,5,1,'j');r(x+4+[0,1,2,1][f],15,1,6,'W');r(x+10,19,2,4,'J')
 }else if(action==='kneadClay'){
  r(x+2-f%2,20,7+f%2,4,'E');r(x+3,19+f%2,5,2,'e');r(x+3+f,22,1,1,'r')
 }else if(action==='shapePot'){
  const height=[3,5,6,7][f];r(x+2,24-height,7,height,'E');r(x+3,24-height,5,1,'R');r(x+3,25-height,2,height-2,'e');r(x+3,23,5,1,'R')
 }else if(action==='placePot'){
  const y=[15,17,19,20][f];r(x+3,y,6,1,'R');r(x+2,y+1,8,3,'E');r(x+3,y+4,6,1,'R');r(x+3,y+1,2,2,'e')
 }else if((CRAFT_GROUPS.instrument as readonly string[]).includes(action)){
  r(x+2,18,9,6,'W');r(x+3,18,7,5,'l');r(x+5,19,3,2,'J');r(x+4,12,2,6,'w');r(x+3,11,4,2,'W')
  if(action==='carveBody'){r(x+7-f,16+f%2,3,1,'Q');r(x+8-f,14+f%2,1,3,'W');r(x+9,23,1,1,'a')}
  else{const count=action==='tieStrings'?f+1:4;for(let i=0;i<count;i++){const xx=x+4+i;r(xx,13,1,9,'P');if(action==='pluckStrings'&&(f===1||f===2)&&i===f){r(xx,17,1,3,'l');r(xx+1,17,1,3,'P')}}if(action==='tieStrings')r(x+4+f,12,1,1,'p')}
 }else if(action==='sortLeaves'){
  r(x+7,21,5,3,'w');r(x,20,4,3,'g');r(x+1,19,3,2,'G');r(x+2+f*2,19,2,2,'G');if(f>1)r(x+8,20,3,2,'g')
 }else if(action==='grindHerbs'){
  r(x+1,20,10,3,'q');r(x+2,23,8,1,'Q');r(x+2,19,8,2,'Q');r(x+3,20,6,1,'g');r(x+5+f%2,hy-3,2,6,'w');r(x+5+f%2,hy-3,1,5,'l')
 }else if(action==='bottleHerbs'){
  r(x+2,21,5,3,'g');r(x+2,20,3,1,'G');r(x+8,18,3,1,'W');r(x+7,19,5,5,'F');r(x+8,20,1,3,'c');if(f>1)r(x+9,21,2,2,'g');r(x+4+f,17+f%2,2,1,'G')
 }else{
  const phase=action==='roll'?3-f:action==='tieScroll'?0:f,width=[2,5,8,10][phase],cx=x+6
  r(cx-width/2|0,18,width,6,'P');r(cx-width/2|0,19,1,4,'p');r((cx+width/2|0)-1,17,2,8,'A');r((cx+width/2|0)-1,18,1,6,'a')
  if(width>5){r(cx-2,20,4,1,'a');r(cx-2,22,3,1,'a')}
  if(action==='tieScroll'){
   r(cx-1,17,3,8,'A');r(cx-1,20,3,1,'b');if(f>0)r(cx-2,20,5,1,'b');if(f>1){r(cx-1,19,1,2,'B');r(cx+2,21,1,2,'B')}if(f===3)r(cx,20,1,1,'c')
  }
 }
 // 망치·칼의 위치가 같은 줄에 겹치는 프레임도 손끝에 작은 반짝임을 남긴다.
 if(action==='carveBody') b.p[10+f][x+4+f]=f%2?'Q':'q'
 const back=grid(),front=grid()
 // 높이 솟은 도구가 얼굴을 덮지 않도록 얼굴 뒤와 몸 앞을 나눈다.
 b.p.forEach((row,y)=>row.forEach((c,xx)=>{if(c!=='.')(facing==='up'||(y>=6&&y<13&&xx>=11&&xx<21)?back:front).p[y][xx]=c}))
 const mirror=(rows:string[])=>facing==='left'?rows.map(r=>[...r].reverse().join('')):rows
 return {actor:mirror(person.rows()),propBack:mirror(back.rows()),propFront:mirror(front.rows()),palette:writerPalette('spring',avatar),anchor:{x:16,y:20},interaction:{x:facing==='left'?31-hx:hx,y:handY},duration:action==='spinThread'?260:320,loop:['spinThread','mixInk','kneadClay','carveBody','pluckStrings','grindHerbs'].includes(action)}
}

export const CURTAIN_COLORS=['sky','sage','rose'] as const
export const CURTAIN_COLOR_LABELS={sky:'하늘빛',sage:'풀빛',rose:'장밋빛'}
export const WINDOW_PALETTE={...CRAFT_PALETTE,B:'#728e9f',b:'#a3bfcd',G:'#859f70',g:'#b2c49c',V:'#a97e83',v:'#d3a5a7',Z:'#667c7e',z:'#a6bdb5'}
export function curtainRows(color:typeof CURTAIN_COLORS[number],action:'open'|'close',frame:number){
 const b=grid(32,16),r=b.rect,f=((frame%4)+4)%4,phase=action==='open'?f:3-f,width=[14,11,8,6][phase]
 const dark=color==='sky'?'B':color==='sage'?'G':'V',light=color==='sky'?'b':color==='sage'?'g':'v'
 r(1,1,30,2,'W');r(2,3,width,12,dark);r(30-width,3,width,12,dark)
 for(const x of [3,30-width+1]){r(x,3,2,12,light);r(x+3,3,1,12,'c')}
 r(2,10,width,1,light);r(30-width,10,width,1,light)
 if(phase===3){r(2,10,width,1,'C');r(30-width,10,width,1,'C')}
 return b.rows()
}
export function windowRows(action:'open'|'close',frame:number){
 const b=grid(),r=b.rect,f=((frame%4)+4)%4,phase=action==='open'?f:3-f,width=[10,8,4,1][phase]
 r(3,3,26,25,'W');r(5,5,22,21,'Z');r(5,5,22,1,'l');r(2,28,28,2,'w');r(3,28,26,1,'l')
 if(phase>0){r(8,7,16,18,'z');r(9,8,14,6,'b');r(9,20,14,4,'g')}
 for(const x of [5,27-width]){
  r(x,6,width,20,'w');if(width>2){r(x+1,7,width-2,17,'z');r(x+1,15,width-2,1,'l');r(x+1,7,1,17,'c')}
 }
 if(phase<2){r(14,phase===0?18:16,4,1,'q');r(phase===0?15:16,17,1,3,'Q')}
 return b.rows()
}

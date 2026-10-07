// 2026-10-08 자산 전용. 텃밭·필사·직업·편지의 게임 기능은 변경하지 않는다.
import type { Facing } from '../engine/types'
import type { FullAvatar } from '../engine/avatar'
import { ADDITION_AVATAR } from './life-additions-motion-art'
import { furnitureUseFrame } from './furniture-use-motion'
import { spriteRows,writerPalette } from './sprites'
import { FURNI_PALETTE } from './furniture-art'

export const WORK_DETAIL_GROUPS={garden:['sow','coverSoil','pickHerb','pickBean'],copy:['dipInk','write','wipePen','movePaper'],job:['hammer','mendNet','sortWool'],letter:['foldLetter','insertLetter','openLetter']} as const
export const WORK_DETAIL_ACTIONS=[...WORK_DETAIL_GROUPS.garden,...WORK_DETAIL_GROUPS.copy,...WORK_DETAIL_GROUPS.job,...WORK_DETAIL_GROUPS.letter] as const
export type WorkDetailAction=typeof WORK_DETAIL_ACTIONS[number]
export const WORK_DETAIL_LABELS:Record<WorkDetailAction,string>={sow:'씨앗 넣기',coverSoil:'흙 덮기',pickHerb:'허브 수확',pickBean:'콩 수확',dipInk:'펜에 잉크 묻히기',write:'필사하기',wipePen:'펜촉 닦기',movePaper:'쓴 종이 옮기기',hammer:'망치질',mendNet:'그물 꿰매기',sortWool:'양털 분류',foldLetter:'편지 접기',insertLetter:'봉투에 넣기',openLetter:'봉투 열어 펼치기'}
export const WORK_DETAIL_PALETTE={...FURNI_PALETTE,i:'#b89871',I:'#dfc4a0',J:'#665043',j:'#312b28',P:'#f5e7c9',p:'#cbbb9b',N:'#7d979b',n:'#acc4bd',Q:'#b1b2a8',q:'#737c77',T:'#9ea69a'}
function grid(){const p=Array.from({length:32},()=>Array<string>(32).fill('.'));return {p,rect(x:number,y:number,w:number,h:number,c:string){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(p[yy]?.[xx]!==undefined)p[yy][xx]=c},put(x:number,y:number,c:string){if(p[y]?.[x]!==undefined)p[y][x]=c},rows:()=>p.map(r=>r.join(''))}}
function paste(target:ReturnType<typeof grid>,rows:string[],ox:number,oy:number){rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.')target.put(x+ox,y+oy,c)}))}

/** 32px의 몸/손/작업물 세 레이어. 피부와 옷은 실제 Avatar로 바꿀 수 있다. */
export function workDetailFrame(action:WorkDetailAction,facing:Facing,frame:number,avatar:FullAvatar=ADDITION_AVATAR){
 const f=((frame%4)+4)%4,actor=grid(),prop=grid(),r=prop.rect,hand=actor.rect
 const garden=(WORK_DETAIL_GROUPS.garden as readonly string[]).includes(action),side=facing==='left'||facing==='right'
 const canonical=facing==='left'?'right':facing
 const base=furnitureUseFrame('writer',canonical,garden?'reach':'craft',f,{frame:0,blink:false,avatar})
 paste(actor,base.actor,4,2)
 if(garden){
  // 심기와 수확은 무릎을 굽힌 몸을 쓰고 손은 작업물 위에 따로 그린다.
  actor.p.forEach(row=>row.fill('.'))
  const source=spriteRows('writer',canonical,{frame:0,blink:false,avatar,pose:'crouch'})
  paste(actor,source,11,7)
 }
 for(let y=14;y<24;y++)for(let x=0;x<32;x++)if(['s','5','!','K'].includes(actor.p[y][x]))actor.p[y][x]='.'
 const cx=side?24:16,hy=action==='hammer'?[12,9,17,14][f]:garden?21+[0,1,0,-1][f]:17+[0,1,0,1][f]
 hand(cx-3,hy,2,1,'s');hand(cx-3,hy+1,2,1,'5')
 if(!side){hand(cx+2,hy,2,1,'s');hand(cx+2,hy+1,2,1,'5')}
 const x=side?20:11
 if(garden){
  r(x-1,23,12,5,'i');r(x,23,10,1,'I')
  if(action==='sow'){
   r(x+7,17,4,4,'w');r(x+8,16,2,1,'g');r(x+8,18,2,1,'l')
   if(f<3)r(x+3+f,19+f,1,1,'I');if(f===3)r(x+5,24,2,1,'J')
  }else if(action==='coverSoil'){
   r(x+5,24,2,1,f<2?'J':'I');r(x+2+f,23,3,1,'I');if(f===1||f===2)r(x+4,22,2,1,'i')
  }else{
   const harvested=f>=2
   r(x+7,21,4,5,'w');r(x+8,20,2,1,'W');r(x+7,23,4,1,'l')
   if(!harvested){r(x+3,18,1,6,'g');r(x+1,19,3,2,'G');r(x+4,17,3,2,'g');if(action==='pickBean'){r(x+5,19,2,3,'G');r(x+1,21,2,2,'g')}}
   if(f===1){r(x+3,16,1,5,'g');r(x+2,17,3,2,'G')}
   if(harvested){r(x+8,21,2,2,'g');r(x+7,20,2,1,'G')}
  }
 }else{
  r(x-2,24,15,2,'w');r(x-1,26,2,4,'W');r(x+9,26,2,4,'W')
  if((WORK_DETAIL_GROUPS.copy as readonly string[]).includes(action)){
   const py=action==='movePaper'?20-[0,1,3,5][f]:20
   r(x,py,8,4,'P');r(x,py+3,8,1,'p')
   if(action==='write'||action==='movePaper')for(let yy=0;yy<(action==='write'?f+1:3);yy++)r(x+1,py+yy,Math.min(6,2+yy),1,'J')
   r(x+9,20,3,4,'J');r(x+9,20,3,1,'j')
   if(action==='dipInk'){const px=x+7+[0,2,2,0][f],y=14+[0,2,4,1][f];r(px,y,1,5,'w');r(px,y+4,1,1,'j')}
   if(action==='write'){r(x+2+f,16+f%2,1,6,'w');r(x+2+f,21+f%2,1,1,'j')}
   if(action==='wipePen'){r(x+1,19,5,3,'c');r(x+2+f%2,16,1,6,'w');r(x+2+f%2,21,1,1,'j');if(f>1)r(x+2,20,1,1,'J')}
  }else if(action==='hammer'){
   r(x,21,10,2,'q');r(x+3,23,4,1,'q');r(x+2,19,5,2,'Q');r(x+3,hy-3,1,6,'W');r(x+1,hy-4,5,2,'q');r(x+1,hy-4,5,1,'Q')
  }else if(action==='mendNet'){
   for(let yy=18;yy<24;yy+=2)r(x,yy,11,1,'N');for(let xx=0;xx<11;xx+=2)r(x+xx,18,1,6,'n')
   r(x+4,20,3,2,'.');if(f>=2){r(x+4,20,3,1,'P');r(x+5,21,1,1,'P')}
   r(x+3+f,16+f%2,1,4,'Q');r(x+4+f,19+f%2,2,1,'P')
  }else if(action==='sortWool'){
   r(x,20,5-(f>1?1:0),4,'C');r(x+1,19,3,2,'c');r(x+8,22,4,2,'w');r(x+9,21,2,1,'c')
   r(x+3+f*2,18+(f===3?3:f%2),3,2,'c')
  }else{
   const fold=action==='foldLetter'?f:action==='insertLetter'?3:0
   r(x,18+Math.min(fold,2),fold<2?10:8,fold<2?6:3,'P');r(x+1,19+Math.min(fold,2),5,1,'J')
   if(action==='foldLetter'&&f>0){r(x,18+f,8,2,'p');if(f===3)r(x+1,21,6,1,'P')}
   if(action==='insertLetter'){
    r(x+6,20,6,4,'p');r(x+7,21,4,2,'P');if(f>=2){r(x,20,6,3,'.');r(x+7,20,4,1,'P')}if(f===3){r(x+8,22,2,1,'R')}
   }
   if(action==='openLetter'){
    r(x,18,12,7,'.');r(x+5,21,7,3,'p');r(x+6,22,5,1,'P')
    if(f<2){r(x+6,20-f,5,2,'P');if(f===0)r(x+8,22,1,1,'R')}
    else{r(x,18-(f-2),9,5,'P');r(x+1,19-(f-2),6,1,'J');r(x+1,21-(f-2),4,1,'J')}
   }
  }
 }
 let actorRows=actor.rows(),propRows=prop.rows()
 if(facing==='left'){actorRows=actorRows.map(r=>[...r].reverse().join(''));propRows=propRows.map(r=>[...r].reverse().join(''))}
 const empty=Array<string>(32).fill('.'.repeat(32))
 return {actor:actorRows,propBack:facing==='up'?propRows:empty,propFront:facing==='up'?empty:propRows,palette:writerPalette('spring',avatar),anchor:{x:16,y:garden?7+12:base.anchor.y+2},duration:action==='hammer'?180:action==='write'?280:320,loop:['write','hammer','mendNet','sortWool'].includes(action)}
}

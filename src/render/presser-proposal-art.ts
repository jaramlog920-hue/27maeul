import {drawEventPrecipitation} from './event-precipitation'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {ProposalArtContext} from './dexter-proposal-art'
import {person} from './milestone-moments-art'
import {ICONS,ICON_PALETTE} from './sprites'
import {OIL_PRESS_ART} from './oil-press-art'
import {FURNI_PALETTE} from './furniture-art'
import {lodgingBuildingRows,LODGING_PALETTE} from './lodging-art'

/** 매듭을 짓지 못한 끈을 든 채 함께 쓸 자리를 상의하는 올리버. */
export function drawPresserProposal(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,context:ProposalArtContext={minute:900,indoors:true,wet:false}){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h*(h>w?.62:.52)),foot=f+14,night=context.minute>=1260||context.minute<300,evening=!night&&context.minute>=1020
 g.imageSmoothingEnabled=false
 if(context.indoors){
  p(0,0,night?'#827666':'#d0bda0',w,h);p(0,f-24,night?'#89765d':'#b3936e',w,h-f+24)
  p(0,f-27,'#927553',w,3)
  for(let y=f-17;y<h;y+=9)p(0,y,'#a48762',w,1)
  // 공동주택 아래층 작업장에 원래 있는 창과 출입구.
  p(cx-116,f-77,'#967957',45,34);p(cx-113,f-74,night?'#536476':'#dbe0b0',39,28)
  p(cx-95,f-74,'#ac8b61',2,28);p(cx-113,f-59,'#ac8b61',39,2)
  p(cx+73,f-66,'#947453',36,57);p(cx+76,f-63,'#705e4b',30,51)
  p(cx+77,f-62,night?'#536476':'#a8af89',28,25);p(cx+77,f-37,'#c2ae87',28,25)
 }else{
  // 공동주택 앞. 작업장의 기름틀은 실내에만 둔다.
  p(0,0,night?'#435268':evening?'#cfb5a0':context.wet?'#b8c3b7':'#d7d9b8',w,h)
  p(0,f-25,night?'#67745b':'#9eaf7c',w,h-f+25);p(0,f+3,night?'#9b9077':'#c6b28a',w,h-f-3)
  lodgingBuildingRows().slice(31).forEach((r,y)=>[...r].forEach((c,x)=>{const color=LODGING_PALETTE[c as keyof typeof LODGING_PALETTE];if(c!=='.'&&color)p(cx-132+x,f-95+y,color)}))
  if(context.snow)p(0,f+3,'#d9dccb',w,3)
  if(context.wet)drawEventPrecipitation(p,w,h,t,!!context.snow,night)
 }
 if(context.indoors){
  OIL_PRESS_ART.rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&FURNI_PALETTE[c])p(cx-115+x*2,f-12+y*2,FURNI_PALETTE[c],2,2)}))
  p(cx-137,f+9,'#94714d',18,12);p(cx-135,f+10,'#b19360',14,9)
  for(let i=0;i<5;i++)p(cx-134+i*3,f+7+i%2,'#7d8857',3,3)
  for(const x of [cx+72,cx+89]){p(x+3,f-8,'#8d6e4c',6,3);p(x+2,f-5,'#b49369',8,3);p(x,f-2,'#a58259',12,14);p(x+2,f-1,'#c5a979',2,9)}
 }
 person(p,cx-20,foot,avatar,'right')
 person(p,cx+9,foot,npc.avatar,beat>=1?'left':'down',npc.who)
 // 둘째 대사에도 매듭을 완성하지 않는다. 같은 끈을 기록자에게 보이며 상의한다.
 ICONS.promiseCord.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&ICON_PALETTE[c])p(cx+(beat>=1?14:16)+x,foot-13+y,ICON_PALETTE[c])}))
}

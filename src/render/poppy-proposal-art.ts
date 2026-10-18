import {drawEventPrecipitation} from './event-precipitation'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {ProposalArtContext} from './dexter-proposal-art'
import {person} from './milestone-moments-art'
import {ICONS,ICON_PALETTE} from './sprites'

/** 찻집의 웬델은 끈을 가슴 곁에 두고 평생 함께 마실 저녁 차를 약속한다. */
export function drawPoppyProposal(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,context:ProposalArtContext={minute:900,indoors:true,wet:false}){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h*(h>w?.62:.52)),foot=f+14,night=context.minute>=1260||context.minute<300,evening=!night&&context.minute>=1020
 g.imageSmoothingEnabled=false
 const plant=(x:number,y:number)=>{p(x,y,'#a58259',14,10);p(x-2,y-2,'#c5a979',18,3);for(let i=0;i<3;i++){p(x+3+i*4,y-15,'#728a59',1,14);p(x-2+i*5,y-17+i%2*3,'#90a971',9,4)}}
 if(context.indoors){
  p(0,0,night?'#7e7c69':'#d9c8a5',w,h);p(0,f-24,night?'#887b60':'#bda17a',w,h-f+24)
  for(let y=f-16;y<h;y+=9)p(0,y,'#a68b64',w,1)
  p(cx-124,f-78,'#ac8b61',54,35);p(cx-121,f-75,night?'#536476':evening?'#d7bba2':'#dbe0b0',48,29)
  p(cx-99,f-75,'#ac8b61',2,29);p(cx-121,f-60,'#ac8b61',48,2)
  p(cx+70,f-71,'#896f4d',51,3);p(cx+70,f-44,'#896f4d',51,3)
  for(let i=0;i<3;i++){const x=cx+75+i*15;p(x+2,f-62,'#9a7a51',6,3);p(x,f-59,'#b49c72',10,15);p(x+3,f-56,'#d6c39a',3,8)}
  // 기존 작은 탁자와 내려 둔 찻주전자. 미래의 차를 지금 우리지 않는다.
  p(cx-120,f-6,'#b4946b',50,5);p(cx-116,f-1,'#816a4d',3,21);p(cx-78,f-1,'#816a4d',3,21)
  p(cx-106,f-19,'#8da89b',14,13);p(cx-103,f-22,'#aebca4',8,3);p(cx-110,f-17,'#8da89b',4,3)
  p(cx-92,f-18,'#8da89b',5,9);p(cx-91,f-16,'#d9c8a5',3,5)
  p(cx+77,f-6,'#b4946b',44,5);p(cx+80,f-1,'#816a4d',3,21);p(cx+114,f-1,'#816a4d',3,21)
  p(cx+93,f-15,'#aa8865',12,9)
  for(let i=0;i<3;i++){p(cx+96+i*3,f-29,'#8d9365',1,14);p(cx+93+i*3,f-30+i%2*3,'#c7b49b',5,3)}
 }else{
  p(0,0,night?'#435268':evening?'#cfb5a0':context.wet?'#b8c3b7':'#d7d9b8',w,h)
  p(0,f-25,night?'#67745b':'#9eaf7c',w,h-f+25);p(0,f+3,night?'#9b9077':'#c6b28a',w,h-f-3)
  const x=cx-136
  p(x,f-72,'#f4e0c0',99,75);p(x-5,f-86,'#3c6c9c',109,15);p(x-2,f-84,'#4880b4',103,10)
  for(let y=f-81;y<f-72;y+=4)p(x-1,y,'#5c94c4',101,1)
  p(x+59,f-42,'#906040',25,45);p(x+76,f-18,'#ddbd82',2,3)
  p(x+15,f-58,'#ac7444',27,24);p(x+19,f-62,'#ac7444',19,7);p(x+18,f-55,night?'#536476':'#d7dbaf',21,18)
  plant(x+5,f-5)
  if(context.snow)p(0,f+3,'#d9dccb',w,3)
  if(context.wet)drawEventPrecipitation(p,w,h,t,!!context.snow,night)
 }
 plant(cx+125,f+2)
 person(p,cx-20,foot,avatar,'right')
 person(p,cx+9,foot,npc.avatar,beat>=1?'left':'down',npc.who)
 ICONS.promiseCord.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&ICON_PALETTE[c])p(cx+(beat>=1?14:16)+x,foot-15+y,ICON_PALETTE[c])}))
}

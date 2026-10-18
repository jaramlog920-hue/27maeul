import {drawEventPrecipitation} from './event-precipitation'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {ProposalArtContext} from './dexter-proposal-art'
import {person} from './milestone-moments-art'
import {ICONS,ICON_PALETTE} from './sprites'

/** 끈을 살펴보고 기록자를 바라보며 곁에서 차를 우리겠다고 약속하는 바질. */
export function drawBasilProposal(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,context:ProposalArtContext={minute:900,indoors:false,wet:false}){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h*(h>w?.62:.52)),night=context.minute>=1260||context.minute<300,evening=!night&&context.minute>=1020
 const woods=!context.indoors&&!!context.at&&context.at.x<=8
 g.imageSmoothingEnabled=false
 p(0,0,night?'#435268':evening?'#c4b3a5':context.wet?'#b6c3b7':'#d6debf',w,h)
 const herbPot=(x:number,y:number)=>{p(x,y,'#a98760',15,11);p(x-2,y-2,'#c3a275',19,3);for(let i=0;i<3;i++){p(x+3+i*4,y-12,'#728a59',1,11);p(x+i*4,y-14-i%2*3,'#90a971',7,3)}}
 if(context.indoors){
  p(0,0,night?'#817c69':'#c9bd9b',w,h);p(0,f-22,night?'#89785e':'#ac906a',w,h-f+22)
  for(let y=f-14;y<h;y+=9)p(0,y,night?'#796951':'#9e825e',w,1)
  p(cx-125,f-69,'#896f4d',54,3);p(cx-125,f-42,'#896f4d',54,3)
  for(let i=0;i<3;i++){const x=cx-119+i*16;p(x+2,f-59,'#9a7a51',4,3);p(x,f-56,'#8da89b',9,13);p(x+2,f-54,'#d5d5b6',5,4)}
  herbPot(cx-116,f-13)
  p(cx+64,f-10,'#b4946b',44,5);p(cx+67,f-5,'#816a4d',3,21);p(cx+101,f-5,'#816a4d',3,21)
  // 기존 찻주전자는 내려 둔 채 유지한다. 미래 약속을 현재의 차 우리기로 바꾸지 않는다.
  p(cx+76,f-21,'#84978b',13,11);p(cx+79,f-24,'#a2ad95',7,3)
  p(cx+73,f-19,'#84978b',4,3);p(cx+89,f-20,'#84978b',4,7);p(cx+90,f-19,'#c9bd9b',2,4)
 }else{
  p(0,f-25,night?'#66765a':'#99aa7b',w,h-f+25);p(0,f+3,night?'#9b9279':'#c4b18e',w,h-f-3)
  if(woods){
   for(const x of [cx-121,cx+98]){
    p(x,f-53,'#8b7452',5,63);p(x-15,f-84,night?'#668363':'#8faa7a',37,13)
    p(x-23,f-72,night?'#526e57':'#719367',51,17);p(x-17,f-55,night?'#5b785d':'#7f9e6b',39,12)
   }
   for(let i=0;i<5;i++){const x=cx-106+i*7;p(x,f+1,'#778d5f',1,9);p(x-3,f-2,'#99ad77',7,3)}
  }else{
   const left=cx-136
   p(left,f-72,'#f4e0c0',99,75);p(left-5,f-86,'#944850',109,15);p(left-2,f-84,'#b05860',103,10)
   for(let y=f-81;y<f-72;y+=4)p(left-1,y,'#c06c74',101,1)
   p(left+60,f-43,'#906040',25,46);p(left+77,f-19,'#ddbd82',2,3)
   p(left+13,f-61,'#ac7444',31,27);p(left+16,f-58,night?'#536476':'#d7dbaf',25,21)
   p(left+27,f-58,'#ac7444',2,21)
   for(let i=0;i<6;i++)p(left+8+i*7,f-67,i%2?'#f8e8cc':'#58984c',7,7)
   herbPot(left+11,f-8);herbPot(cx+83,f-2)
  }
  if(context.snow)p(0,f+3,'#d9dccb',w,3)
  if(context.wet)drawEventPrecipitation(p,w,h,t,!!context.snow,night)
 }
 const foot=f+14
 person(p,cx-20,foot,avatar,'right')
 person(p,cx+9,foot,npc.avatar,beat>=1?'left':'down',npc.who)
 // 같은 끈을 살피는 손 곁에서 기록자에게 보이는 손 곁으로 옮긴다.
 ICONS.promiseCord.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&ICON_PALETTE[c])p(cx+(beat>=1?5:16)+x,foot-13+y,ICON_PALETTE[c])}))
}

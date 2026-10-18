import {drawEventPrecipitation} from './event-precipitation'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {ProposalArtContext} from './dexter-proposal-art'
import {person} from './milestone-moments-art'
import {ICONS,ICON_PALETTE} from './sprites'

/** 놀라서 끈을 바라본 주니퍼가 받아 두며 함께 살 날들을 약속한다. */
export function drawJuniperProposal(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,context:ProposalArtContext={minute:900,indoors:false,wet:false}){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h*(h>w?.62:.52)),foot=f+14,night=context.minute>=1260||context.minute<300,evening=!night&&context.minute>=1020
 const libraryPath=!context.indoors&&!!context.at&&context.at.y<=15
 g.imageSmoothingEnabled=false
 p(0,0,context.indoors?night?'#827b69':'#d0bda0':night?'#435268':evening?'#cfb5a0':context.wet?'#b8c3b7':'#dbe1c0',w,h)
 p(0,f-25,context.indoors?'#b3936e':night?'#67745b':'#b4c395',w,h-f+25)
 p(0,f+3,context.indoors?'#b3936e':night?'#9b9077':'#c4c795',w,h-f-3)
 if(context.indoors){
  for(let y=f-17;y<h;y+=9)p(0,y,'#a48762',w,1)
  p(cx-120,f-75,'#967957',45,34);p(cx-117,f-72,night?'#536476':'#dbe0b0',39,28)
  p(cx-99,f-72,'#ac8b61',2,28);p(cx-117,f-57,'#ac8b61',39,2)
  p(cx+70,f-64,'#896f4d',54,3);p(cx+70,f-39,'#896f4d',54,3)
  for(let i=0;i<3;i++){const x=cx+77+i*15;p(x+2,f-56,'#9a7a51',6,3);p(x,f-53,'#b49c72',10,14);p(x+2,f-51,'#dbbf7c',6,7)}
  // 관찰 공책은 닫아 내려 두고 벌통은 실외에만 그린다.
  p(cx-119,f-8,'#b4946b',48,5);p(cx-115,f-3,'#816a4d',3,20);p(cx-78,f-3,'#816a4d',3,20)
  p(cx-106,f-13,'#a48a66',24,5);p(cx-104,f-13,'#d1bd96',20,1)
 }else{
  if(libraryPath){
   p(cx-132,f-41,'#9da28b',74,43)
   for(let y=f-37;y<f;y+=10){p(cx-131,y,'#b9bba2',72,1);for(let x=cx-120;x<cx-63;x+=23)p(x,y,'#8c927f',1,10)}
   p(cx+73,f+3,'#a98c63',47,4);p(cx+78,f+7,'#816a4d',3,13);p(cx+113,f+7,'#816a4d',3,13)
  }else{
   for(let i=0;i<3;i++){const x=cx-126+i*29,y=f-22+i%2*5;p(x-3,y+27,'#a5b47f',29,4);p(x,y,'#d4ab60',23,27);p(x,y+6,'#ae7e32',23,3);p(x,y+15,'#ae7e32',23,3);p(x+9,y+21,'#492c1b',6,6);p(x+2,y+1,'#e7c982',19,2)}
   if(!night&&!context.wet)for(let i=0;i<2;i++){const x=cx-110+i*28+Math.round(Math.sin(t*.7+i)*8),y=f-37+i*7;p(x,y,'#d5b365',4,2);p(x+1,y,'#665a3b',1,2);p(x,y-1,'#ecebd7',2,1);p(x+3,y-1,'#ecebd7',2,1)}
  }
  if(!context.snow&&!libraryPath)for(let i=0;i<6;i++){const x=cx+79+i%3*12,y=f-2+Math.floor(i/3)*13;p(x,y,'#829763',1,7);p(x-2,y-2,i%2?'#f0e5c4':'#d2b2b7',5,3);p(x,y-1,'#d8c982')}
  if(context.snow)p(0,f+3,'#d9dccb',w,3)
  if(context.wet)drawEventPrecipitation(p,w,h,t,!!context.snow,night)
 }
 person(p,cx-20,foot,avatar,'right')
 person(p,cx+(beat>=1?9:17),foot,npc.avatar,'left',npc.who)
 // 꿀을 수확하거나 선물하지 않고 건넨 끈 하나만 받아 둔다.
 ICONS.promiseCord.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&ICON_PALETTE[c])p(cx+(beat>=1?14:-4)+x,foot-13+y,ICON_PALETTE[c])}))
}

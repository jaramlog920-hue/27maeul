import {drawEventPrecipitation} from './event-precipitation'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {ProposalArtContext} from './dexter-proposal-art'
import {person} from './milestone-moments-art'
import {ICONS,ICON_PALETTE} from './sprites'

/** 놀라서 끈을 바라본 메리골드가 가까이 다가와 오래 함께할 약속을 받는다. */
export function drawMarigoldProposal(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,context:ProposalArtContext={minute:900,indoors:false,wet:false}){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h*(h>w?.62:.52)),night=context.minute>=1260||context.minute<300,evening=!night&&context.minute>=1020
 const lake=!context.indoors&&!!context.at&&context.at.y>=25
 g.imageSmoothingEnabled=false
 p(0,0,night?'#455269':evening?'#c9b5ad':context.wet?'#b7c1b9':'#d7dfc8',w,h)
 if(context.indoors){
  p(0,0,night?'#877c69':'#c8b899',w,h);p(0,f-21,night?'#8b795f':'#ae926e',w,h-f+21)
  for(let y=f-14;y<h;y+=9)p(0,y,night?'#7b6a54':'#9e825d',w,1)
  p(cx-126,f-75,'#937450',43,35);p(cx-123,f-72,night?'#4c5d6b':'#c7d3bd',37,29)
  p(cx-106,f-72,'#aa8c66',2,29);p(cx-123,f-58,'#aa8c66',37,2)
  p(cx+65,f-11,'#a1825b',40,5);p(cx+68,f-6,'#866b4a',3,22);p(cx+99,f-6,'#866b4a',3,22)
  // 원래 가족 집의 접힌 천과 물병. 결혼 후 가구를 미리 넣지 않는다.
  p(cx+74,f-17,'#d2c6a8',18,6);p(cx+76,f-15,'#afa78c',14,1)
  p(cx+95,f-20,'#93a095',7,9);p(cx+97,f-23,'#c2c5ad',3,3)
 }else{
  if(lake){
   p(0,f-47,night?'#678580':'#8eafa5',w,34)
   for(let row=0;row<7;row++)for(let x=(row*17+Math.floor(t*2))%47;x<w;x+=47)p(x,f-44+row*4,night?'#8d9d90':'#bed0b9',10,1)
   p(0,f-13,night?'#748060':'#9aaa7b',w,h-f+13)
   for(let i=0;i<5;i++){const x=cx-117+i*5;p(x,f-15,'#738b60',1,12);p(x-1,f-19,'#a8ad79',3,6)}
  }else{
   p(0,f-40,night?'#667358':'#9eaf7e',w,h-f+40)
   // 포도원의 가는 지주와 오래 자란 줄기를 실제 흙길 옆에 둔다.
   for(const x of [cx-126,cx-91,cx+81,cx+118]){
    p(x,f-61,'#a48c61',3,68);p(x-8,f-53,'#ad966e',24,2)
    p(x+5,f-45,'#79684b',3,52);p(x+1,f-47,'#79684b',8,2);p(x+7,f-34,'#79684b',9,2)
    if(!context.snow)for(const [dx,dy] of [[-3,-49],[9,-43],[14,-31],[-2,-26]]){p(x+dx,f+dy,night?'#66835c':'#749564',8,4);p(x+dx+2,f+dy-2,night?'#718c65':'#89a874',4,2)}
   }
  }
  p(0,f+3,night?'#9a9077':'#c2b18b',w,h-f-3)
  if(context.snow)p(0,f+3,'#d9dccb',w,3)
  if(context.wet)drawEventPrecipitation(p,w,h,t,!!context.snow,night)
 }
 const foot=f+14
 person(p,cx-20,foot,avatar,'right')
 person(p,cx+(beat>=1?5:17),foot,npc.avatar,'left',npc.who)
 // 받기 전후에 같은 끈 하나만 둔다. 얼굴 아래, 원래 손이 닿는 높이에 놓는다.
 ICONS.promiseCord.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&ICON_PALETTE[c])p(cx+(beat>=1?1:-4)+x,foot-13+y,ICON_PALETTE[c])}))
}

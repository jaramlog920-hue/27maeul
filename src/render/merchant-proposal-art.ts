import {drawEventPrecipitation} from './event-precipitation'
import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {ProposalArtContext} from './dexter-proposal-art'
import {person} from './milestone-moments-art'
import {ICONS,ICON_PALETTE,spriteRows} from './sprites'

/** 장날 좌판에서 받은 끈을 매고 돌아올 날을 함께 약속하는 오스카. */
export function drawMerchantProposal(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,context:ProposalArtContext={minute:900,indoors:false,wet:false}){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h*(h>w?.62:.52)),foot=f+14,night=context.minute>=1260||context.minute<300,evening=!night&&context.minute>=1020
 g.imageSmoothingEnabled=false
 p(0,0,context.indoors?'#c9b99a':night?'#435268':evening?'#cfb5a0':context.wet?'#b8c3b7':'#d7d9b8',w,h)
 p(0,f-25,context.indoors?'#ac906a':night?'#67745b':'#9eaf7c',w,h-f+25)
 p(0,f+3,context.indoors?'#ac906a':night?'#9b9077':'#c6b28a',w,h-f-3)
 if(context.indoors){for(let y=f-14;y<h;y+=9)p(0,y,'#9a805d',w,1)}else{
  // 기존 장날 좌판의 갈색 줄무늬 가리개. 출발 준비나 새 집은 추가하지 않는다.
  p(cx-122,f-67,'#816344',4,86);p(cx+115,f-67,'#816344',4,86)
  p(cx-128,f-72,'#aa8865',252,7)
  for(let i=0;i<12;i++)p(cx-128+i*21,f-65,i%2?'#d0b187':'#b88d6c',21,12)
  p(cx-128,f-53,'#9b7654',252,3)
 }
 // 두 사람 사이를 비워 두고 판매 물건과 접힌 운송 자루는 옆에 둔다.
 p(cx-113,f-4,'#9c7850',59,5);p(cx-109,f+1,'#77583e',3,22);p(cx-60,f+1,'#77583e',3,22)
 p(cx-111,f-5,'#cfb798',55,2)
 for(let i=0;i<2;i++){const x=cx-104+i*23;p(x+2,f-17,'#9d7251',12,12);p(x,f-14,'#b99768',16,8);p(x+4,f-19,'#725844',8,3);p(x+5,f-18,'#493c30',6,1)}
 p(cx+76,f-12,'#ad9870',21,29);p(cx+79,f-17,'#d2c09b',15,6);p(cx+80,f-7,'#8d785b',11,2)
 if(!context.indoors){
  if(context.snow)p(0,f+3,'#d9dccb',w,3)
  if(context.wet)drawEventPrecipitation(p,w,h,t,!!context.snow,night)
 }
 person(p,cx-20,foot,avatar,'right')
 person(p,cx+9,foot,npc.avatar,beat>=1?'left':'down',npc.who)
 if(beat<1){
  ICONS.promiseCord.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&ICON_PALETTE[c])p(cx+16+x,foot-13+y,ICON_PALETTE[c])}))
 }else{
  // 옆모습의 원래 손 곁에 작은 이중 매듭. 팔이나 피부색 선을 늘리지 않는다.
  const rows=spriteRows(npc.who,'left',{frame:0,blink:false,avatar:npc.avatar?withLookDefaults(npc.avatar):undefined})
  const row=rows.findIndex((r,i)=>i>=9&&r.includes('s')),col=row<0?3:rows[row].indexOf('s')
  const x=cx+9+col*2,y=foot-rows.length*2+(row<0?10:row)*2
  p(x,y,ICON_PALETTE.r,2,1);p(x,y+1,ICON_PALETTE.N,2,1)
  p(x-1,y+1,ICON_PALETTE.r);p(x+2,y+1,ICON_PALETTE.r);p(x,y+2,ICON_PALETTE.r,1,2)
 }
}

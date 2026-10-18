import {drawEventPrecipitation} from './event-precipitation'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {ProposalArtContext} from './dexter-proposal-art'
import {person} from './milestone-moments-art'
import {ICONS,ICON_PALETTE,PALETTE,writerPalette} from './sprites'

/** 루디가 끈을 간직하고 미래의 집을 약속한다. 완성된 집이나 건축 동작을 넣지 않는다. */
export function drawRudyProposal(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,rudy:FinalePerson,beat:number,context:ProposalArtContext={minute:900,indoors:false,wet:false,at:{x:7,y:24}}){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const stamp=(rows:readonly string[],pal:Record<string,string>,x:number,y:number)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx,y+yy,pal[c])}))
 const cx=Math.round(w/2),f=Math.round(h*(h>w?.62:.52)),night=context.minute>=1260||context.minute<300,evening=!night&&context.minute>=1020
 const square=!context.indoors&&!!context.at&&context.at.x>=15&&context.at.y<=19
 g.imageSmoothingEnabled=false
 p(0,0,night?'#434c5e':evening?'#bbb0a2':context.wet?'#b9c3b8':'#d8dfc8',w,h)
 if(context.indoors){
  p(0,0,night?'#837a67':'#c1b393',w,h);p(0,f-20,night?'#8c785e':'#ad9067',w,h-f+20)
  for(let y=f-12;y<h;y+=9)p(0,y,night?'#7d6b53':'#9e825d',w,1)
  p(cx-117,f-77,'#896b4c',39,32);p(cx-114,f-74,night?'#4b5d6a':'#c5d4bd',33,26)
  p(cx-99,f-74,'#a4865d',2,26);p(cx-114,f-61,'#a4865d',33,2)
 }else{
  p(0,f-25,night?'#66765c':'#91a17d',w,h-f+25);p(0,f+3,night?'#9b9074':'#c0ad87',w,h-f-3)
  if(square){
   // 낮의 광장에서는 좌판과 돌 우물을 서로 떨어뜨려 배치한다.
   p(cx-135,f-45,'#997e5e',66,45);p(cx-138,f-49,'#bba17c',72,5)
   p(cx-129,f-26,'#c6b18b',54,3);p(cx-126,f-17,'#8f795d',48,17)
   p(cx+75,f-8,'#929587',35,12);p(cx+73,f-12,'#c1c2ac',39,5);p(cx+79,f-12,'#77877e',27,3)
  }else{
   // 기존 루디 공방의 벽·붉은 기와·문과 창 색을 유지한다.
   p(cx-137,f-79,'#bfad8b',95,82);p(cx-141,f-89,'#8d7058',103,11);p(cx-137,f-87,'#a47e64',95,5)
   p(cx-122,f-65,'#806547',37,30);p(cx-119,f-62,night?'#536577':'#d9b68a',31,24)
   p(cx-105,f-62,'#ad895f',2,24);p(cx-119,f-51,'#ad895f',31,2)
   p(cx-75,f-46,'#957450',27,49);p(cx-72,f-43,'#765a40',21,46);p(cx-58,f-23,'#d6b685',2,3)
  }
  if(context.snow)p(0,f+3,'#d6d9cc',w,3)
  if(context.wet)drawEventPrecipitation(p,w,h,t,!!context.snow,night)
 }
 if(!square){
  // 정리된 목재와 이미 쓰던 작업대. 아직 약속한 집의 기둥은 세우지 않는다.
  for(let i=0;i<4;i++){p(cx-132+i*9,f-15-i*3,'#9d7c54',6,29+i*3);p(cx-131+i*9,f-14-i*3,'#c4a275',2,26+i*3)}
  p(cx+62,f-9,'#a98a62',47,5);p(cx+65,f-4,'#7c6044',3,21);p(cx+102,f-4,'#7c6044',3,21)
  p(cx+72,f-13,'#c8aa7c',27,4);p(cx+95,f-19,'#826347',3,6);p(cx+91,f-20,'#a0a799',10,3)
 }
 const foot=f+14
 person(p,cx-20,foot,avatar,'right')
 person(p,cx+9,foot,rudy.avatar,beat>=1?'down':'left',rudy.who)
 stamp(ICONS.promiseCord,ICON_PALETTE,cx+(beat>=1?15:-4),foot-(beat>=1?17:13))
 if(beat>=1){const pal=rudy.who==='writer'?writerPalette('spring',rudy.avatar?withLookDefaults(rudy.avatar):undefined):PALETTE;p(cx+17,foot-11,pal.s,2,2)}
}

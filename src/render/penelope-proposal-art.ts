import {drawWeaverFacade} from './weaver-front-background'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {ProposalArtContext} from './dexter-proposal-art'
import {person} from './milestone-moments-art'
import {proposalDrawing} from './proposal-drawing'

/** 페넬로피가 끈의 결을 살펴본 뒤 같이 살자는 마음을 전한다. */
export function drawPenelopeProposal(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,context:ProposalArtContext={minute:900,indoors:false,wet:false,at:{x:39,y:24}}){
 const {p,cx,f,foot,night,evening,cord,weather}=proposalDrawing(g,w,h,t,context)
 const square=!context.indoors&&!!context.at&&context.at.y<=19
 p(0,0,night?'#435268':evening?'#cfb5a0':'#d6debf',w,h)
 if(context.indoors){
  p(0,0,night?'#817969':'#d6c7a4',w,h);p(0,f-24,'#bda17a',w,h-f+24);for(let y=f-17;y<h;y+=9)p(0,y,'#a68b64',w,1)
  // 베틀은 손대지 않고 멈춘 채. 함께 엮는다는 비유를 실제 새 천 제작으로 바꾸지 않는다.
  p(cx-123,f-60,'#9a7953',4,75);p(cx-78,f-60,'#9a7953',4,75);p(cx-124,f-62,'#c0a274',51,5);p(cx-120,f-30,'#c0a274',43,4)
  for(let x=cx-116;x<cx-79;x+=4)p(x,f-55,'#dfd5b4',1,33)
  p(cx-117,f-20,'#b8c1a0',35,23);for(let y=f-15;y<f;y+=5)p(cx-117,y,'#9da88b',35,1)
 }else{
  p(0,f-25,'#9bab7e',w,h-f+25);p(0,f+3,'#c6b28a',w,h-f-3)
  if(square){p(cx-128,f-36,'#969e89',57,38);for(let y=f-32;y<f;y+=10)p(cx-127,y,'#b6bba3',55,1)}else{
   drawWeaverFacade(p,cx,f,night)
  }
 }
 // 정리된 실패와 접힌 기존 천은 인물 옆 낮은 받침에 둔다.
 p(cx+73,f-5,'#a77d53',48,5);p(cx+77,f,'#77583d',3,20);p(cx+113,f,'#77583d',3,20)
 for(let i=0;i<3;i++){const x=cx+79+i*12;p(x,f-20,'#c0a274',8,2);p(x+1,f-18,['#b8c1a0','#c6b39b','#98aeba'][i],6,11);p(x,f-7,'#c0a274',8,2)}
 p(cx+81,f+12,'#d5ccb0',30,6);p(cx+81,f+14,'#a6b294',30,1)
 weather();person(p,cx-20,foot,avatar,'right');person(p,cx+9,foot,npc.avatar,beat>=1?'left':'down',npc.who)
 cord(cx+(beat>=1?14:16),foot-13)
}

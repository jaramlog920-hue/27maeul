import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {ProposalArtContext} from './dexter-proposal-art'
import {person} from './milestone-moments-art'
import {proposalDrawing} from './proposal-drawing'

/** 그물의 매듭처럼 끈을 단단히 매어 두는 코스모. 배는 출항하지 않는다. */
export function drawCosmoProposal(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,context:ProposalArtContext={minute:900,indoors:false,wet:false,at:{x:30,y:32}}){
 const {p,cx,f,foot,night,evening,cord,knot,weather}=proposalDrawing(g,w,h,t,context)
 const inland=!!context.at&&context.at.y<28
 p(0,0,night?'#435268':evening?'#cbb4a1':'#d3dfcf',w,h)
 if(context.indoors){
  p(0,0,night?'#827b69':'#c9b99a',w,h);p(0,f-24,'#ac906a',w,h-f+24)
  for(let y=f-17;y<h;y+=9)p(0,y,'#9a805d',w,1)
  p(cx-122,f-73,'#967957',44,31);p(cx-119,f-70,night?'#536476':'#b5cbd0',38,25);p(cx-102,f-70,'#ac8b61',2,25)
  p(cx+80,f-23,'#896e4e',29,36);p(cx+82,f-26,'#b99b71',25,5)
 }else if(inland){
  p(0,f-24,'#9bab7e',w,h-f+24);p(0,f+3,'#c6b28a',w,h-f-3)
  p(cx-125,f-35,'#969e89',66,37);for(let y=f-31;y<f;y+=9)p(cx-124,y,'#b6bba3',64,1)
 }else{
  p(0,f-47,night?'#607c85':'#a3c1bc',w,48);p(0,f+1,night?'#9b9077':'#c6b28a',w,h-f-1)
  for(let i=0;i<8;i++)p((i*47+Math.round(t*2))%w,f-37+i%3*10,'#c6d6c9',14,1)
  p(cx-132,f-1,'#b09166',77,9);for(let x=cx-125;x<cx-54;x+=14)p(x,f,'#876f50',1,8)
  for(const x of [cx-125,cx-67]){p(x,f-11,'#806448',4,29);p(x-1,f-12,'#c2a577',6,3)}
 }
 // 실제 어업 소품은 옆에 정리해 둔다. 받은 끈과 그물 작업을 혼동하지 않는다.
 p(cx+72,f-30,'#8b7452',3,43);p(cx+116,f-30,'#8b7452',3,43);p(cx+70,f-31,'#b09468',50,3)
 for(let x=cx+76;x<cx+116;x+=6)p(x,f-27,'#8a9273',1,25)
 for(let y=f-25;y<f;y+=5)p(cx+75,y,'#a1aa87',40,1)
 p(cx+91,f+8,'#97754e',27,12);p(cx+94,f+9,'#b99b71',21,8)
 weather();person(p,cx-20,foot,avatar,'right');person(p,cx+9,foot,npc.avatar,beat>=1?'left':'down',npc.who)
 if(beat>=1)knot(npc,cx+9,'left');else cord(cx+16,foot-13)
}

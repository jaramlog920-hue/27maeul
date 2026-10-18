import {drawForgeRoomBackground} from './forge-room-background'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {ProposalArtContext} from './dexter-proposal-art'
import {person} from './milestone-moments-art'
import {proposalDrawing} from './proposal-drawing'

/** 일손을 멈춘 틸리가 끈을 매고 기록자의 편이 되겠다고 약속한다. */
export function drawTillyProposal(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,context:ProposalArtContext={minute:900,indoors:true,wet:false}){
 const {p,cx,f,foot,night,evening,cord,knot,weather}=proposalDrawing(g,w,h,t,context)
 p(0,0,context.indoors?night?'#81796a':'#c8b899':night?'#435268':evening?'#cbb4a1':'#d6debf',w,h)
 p(0,f-25,context.indoors?'#b4946f':'#9bab7e',w,h-f+25)
 if(context.indoors){
  drawForgeRoomBackground(p,w,h,f,night)
 }else{
  p(0,f+3,'#c6b28a',w,h-f-3)
  // 낮 일정의 광장 돌 우물과 길가 그늘.
  p(cx-127,f-22,'#969e89',53,25);p(cx-130,f-26,'#b6bba3',59,5);p(cx-122,f-24,'#647568',43,2)
  p(cx+98,f-51,'#8b7452',4,55);p(cx+80,f-73,'#8faa7a',39,13);p(cx+72,f-61,'#719367',55,16)
 }
 weather();person(p,cx-20,foot,avatar,'right');person(p,cx+9,foot,npc.avatar,beat>=1?'left':'down',npc.who)
 if(beat>=1)knot(npc,cx+9,'left');else cord(cx+16,foot-13)
}

import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {ProposalArtContext} from './dexter-proposal-art'
import {person} from './milestone-moments-art'
import {proposalDrawing} from './proposal-drawing'

/** 파피는 끈을 받아 두고 앞으로 둘의 식탁에 올릴 첫 빵을 약속한다. */
export function drawWendellProposal(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,context:ProposalArtContext={minute:900,indoors:false,wet:false,at:{x:1,y:17}}){
 const {p,cx,f,foot,night,evening,cord,weather}=proposalDrawing(g,w,h,t,context)
 const square=!context.indoors&&!!context.at&&context.at.x>=15
 p(0,0,night?'#435268':evening?'#cfb5a0':'#dfd9bd',w,h)
 if(context.indoors){
  p(0,0,night?'#817969':'#e4c7a4',w,h);p(0,f-24,'#c6a67c',w,h-f+24);for(let y=f-17;y<h;y+=9)p(0,y,'#b7946c',w,1)
  const x=cx-130;p(x+5,f-76,'#b57d59',57,79);p(x,f-63,'#b57d59',67,66)
  p(x+17,f-48,'#704e3a',34,49);p(x+23,f-56,'#704e3a',22,9);p(x+20,f-44,'#947458',28,44)
  p(x+20,f-28,'#b69872',28,1);p(x+7,f+2,'#c39a70',53,4)
 }else{
  p(0,f-25,'#9bab7e',w,h-f+25);p(0,f+3,'#c6b28a',w,h-f-3)
  const x=cx-132
  if(square){
   p(x,f-43,'#816344',3,56);p(x+66,f-43,'#816344',3,56);p(x-4,f-49,'#aa8865',77,6)
   for(let i=0;i<7;i++)p(x-4+i*11,f-43,i%2?'#f8e8cc':'#c07058',11,9)
  }else{
   p(x,f-70,'#f8c094',95,73);p(x-4,f-84,'#885444',103,15);p(x-1,f-82,'#a06450',97,10)
   for(let y=f-79;y<f-69;y+=4)p(x,y,'#b07864',95,1)
   p(x+60,f-41,'#906040',24,44);p(x+76,f-18,'#ddbd82',2,3)
   p(x+12,f-56,'#ac7444',29,24);p(x+15,f-53,night?'#536476':'#d7dbaf',23,18)
   for(let i=0;i<6;i++)p(x+7+i*7,f-64,i%2?'#f8e8cc':'#c07058',7,6)
  }
 }
 // 빈 판매 바구니와 덮어 둔 반죽대. 미래의 아침 첫 빵을 미리 구워 건네지 않는다.
 p(cx+74,f-7,'#a77d53',47,5);p(cx+78,f-2,'#77583d',3,21);p(cx+114,f-2,'#77583d',3,21)
 p(cx+82,f-13,'#ded0aa',30,6);p(cx+86,f-15,'#eadbb9',22,2)
 p(cx+86,f+13,'#97754e',27,11);p(cx+89,f+14,'#b99b71',21,7)
 weather();person(p,cx-20,foot,avatar,'right');person(p,cx+(beat>=1?9:15),foot,npc.avatar,'left',npc.who)
 cord(cx+(beat>=1?14:-4),foot-13)
}

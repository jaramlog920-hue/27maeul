import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {shoreFrame,shoreActor,letter,bench} from './shore-kit'
export const SHORE_LETTER_IDS=['ev:poppy:letterTalk','ev:poppy:small:sisterNews','ev:wendell:trip','saw:wendell:letter','saw:poppy:letter'] as const
export function letterPeople(id:string){return [id.includes('wendell')?'wendell':'poppy']}
export function drawShoreLetter(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,beat:number,choice?:number|null){
 const {p,cx,foot:f,ground}=shoreFrame(g,w,h,t,'dawn'),travel=id==='ev:wendell:trip',saw=id.startsWith('saw:'),sit=id==='saw:poppy:letter'&&beat<2,leave=travel&&choice===1&&beat>=4||id==='saw:wendell:letter'&&beat>=3||id==='saw:poppy:letter'&&beat>=2
 const nx=leave?cx+77:cx+55
 if(sit)bench(p,nx,f)
 shoreActor(p,cx-85,ground,null,av,'right');shoreActor(p,nx,ground,npc,av,leave?'right':'left',sit,leave,t)
 if(travel){
  // Bundle beside the shoulder/body, below the head; a departure, not a return with new bread.
  p(nx+18,f-4,'#99877b',10,14);p(nx+20,f-6,'#b6a18d',6,3);p(nx+19,f-4,'#d0bc9d',8,1)
 }else{
  let open=true,visible=true,extra=false
  if(id==='saw:wendell:letter'){open=beat===0;visible=beat<2}
  if(id==='saw:poppy:letter'){visible=beat<2}
  if(id==='ev:poppy:letterTalk'){open=choice===1;extra=choice===1}
  const x=sit?nx-19:nx-18,y=sit?f+1:f-8
  if(visible)letter(p,x,y,open,extra)
  if(open&&visible){p(x-8,y+8,'#927052',8,1);p(x-1,y+7,'#3e4340',2,1)}
  if(id==='ev:poppy:small:sisterNews'&&choice===0){p(x-8,y+13,'#927052',8,1)}
  if(saw&&!visible){p(nx+1,f-4,'#d9c9a6',4,2)}
 }
}

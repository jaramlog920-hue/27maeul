import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {shoreFrame,shoreActor,net} from './shore-kit'
import {drawFisherHouse} from './fisher-house-background'

export const SHORE_REMAINDER_IDS=['saw:boat:argue','movedIn:fisher'] as const
export const isShoreRemainder=(id:string)=>(SHORE_REMAINDER_IDS as readonly string[]).includes(id)
export const shoreRemainderPeople=(id:string)=>id==='saw:boat:argue'?['cosmo','rudy']:['fisher']

export function drawShoreRemainder(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number){
 const {p,cx,foot:f,ground}=shoreFrame(g,w,h,t)
 if(id==='movedIn:fisher'){
  drawFisherHouse(p,cx-131,ground)
  // The arriving fisher's own net, fish jar and small luggage stay beside the greeting.
  p(cx+100,f-23,'#866548',3,34);p(cx+135,f-23,'#866548',3,34);p(cx+98,f-23,'#ac8961',42,3)
  net(p,cx+105,f-19,28,24)
  p(cx+91,ground-8,'#a28763',11,8);p(cx+93,ground-10,'#c6ae83',7,3);p(cx+93,ground-5,'#768e87',7,2)
  p(cx+25,ground-7,'#997348',18,7);p(cx+26,ground-6,'#bc9967',16,1);p(cx+33,ground-10,'#775a3e',4,3)
  shoreActor(p,cx-85,ground,null,av,'right');shoreActor(p,cx+55,ground,npc,av,'left')
  return
 }
 // Witness at the left; the brothers face each other across the low drawing board.
 const rudy=others[0],rx=cx+(beat>=3?-24:-48)
 p(cx-10,ground-5,'#b69871',48,4);p(cx-7,ground-1,'#866548',3,9);p(cx+31,ground-1,'#866548',3,9)
 p(cx-7,ground-12,'#eee0bd',39,8)
 // Rounded bow retaining a small pointed tip: the compromise appears only in the last line.
 if(beat>=3){
  p(cx-3,ground-10,'#886c4b',22,1);p(cx+19,ground-9,'#886c4b',6,1);p(cx+25,ground-8,'#886c4b',3,1)
  p(cx+19,ground-7,'#886c4b',6,1);p(cx-3,ground-6,'#886c4b',22,1);p(cx-3,ground-10,'#886c4b',1,5)
 }
 shoreActor(p,cx-116,ground,null,av,'right')
 if(rudy)shoreActor(p,rx,ground,rudy,av,'right')
 shoreActor(p,cx+58,ground,npc,av,'left')
 // The plane is held beside Rudy's waist, then set down on the near edge, clear of his body.
 const tx=beat>=3?cx+4:rx+15,ty=beat>=3?ground-3:ground-13
 p(tx,ty,'#996f42',9,3);p(tx+1,ty-1,'#c2a374',6,1);p(tx+4,ty-3,'#76634c',2,2)
}

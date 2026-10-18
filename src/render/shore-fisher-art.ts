import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {shoreFrame,shoreActor,workBoard,net,rack,bench} from './shore-kit'
import {drawFisherHouse} from './fisher-house-background'
export const SHORE_FISHER_IDS=['ev:fisher:story:1','ev:fisher:story:2','ev:fisher:story:3','ev:fisher:story:4','ev:fisher:small:netRack','ev:fisher:small:duskTea'] as const
export function fisherPeople(id:string){return ['fisher',...(id.endsWith(':2')?['carpenter']:id.endsWith(':3')?['cosmo']:[])]}
export function drawShoreFisher(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const morning=id.endsWith(':3')||id.endsWith(':4')||id.endsWith('netRack'),{p,cx,foot:f,ground}=shoreFrame(g,w,h,t,morning?'day':'evening'),selected=choice!=null,story=id.includes(':story:'),pair=others.length>0
 if(id.endsWith(':1')||id.endsWith(':4'))drawFisherHouse(p,15,ground)
 const px=selected&&choice===0&&id.endsWith(':2')?cx-32:pair?cx-115:cx-85,nx=id.endsWith(':2')&&beat>=2?cx-10:pair?cx-82:cx+55
 if(story)workBoard(p,id.endsWith(':2')?cx+16:cx,f)
 if(id.endsWith('duskTea')){bench(p,nx,f);if(selected&&choice===0)bench(p,px,f)}
 shoreActor(p,px,ground,null,av,'right',id.endsWith('duskTea')&&selected&&choice===0)
 shoreActor(p,nx,ground,npc,av,pair?'right':'left',id.endsWith('duskTea'))
 if(others[0])shoreActor(p,id.endsWith(':2')?cx+44:cx+75,ground,others[0],av,'left')
 if(story){
  const workX=id.endsWith(':2')?cx+16:cx
  const toy=(x:number,y:number,sail=false)=>{p(x,y,'#a67e50',24,3);p(x+3,y+3,'#805c3f',18,3);p(x+2,y+1,'#d0ad77',20,1);if(sail){p(x+13,y-12,'#97754f',1,16);p(x+14,y-11,'#a8c9d4',8,10);p(x+14,y-9,'#8cb3c4',6,1)}}
  if(id.endsWith(':1')){
   const x=selected&&choice===1?cx-70:cx+29
   p(x,f-7,'#a67e50',16,7);p(x+2,f-9,'#c5a071',10,3);p(x+12,f-6,'#805c3f',5,4);p(x-8,f-5,'#87958a',7,2);p(x-13,f-4,'#805c3f',6,2)
  }else if(id.endsWith(':2')){
   toy(workX-12,f-5);p(workX+15,f-5,'#8d6d47',12,4);p(workX+19,f-8,'#d2b286',4,4)
   if(beat>=2){for(let i=0;i<4;i++)p(cx+3+i*5,f+11+i%2,'#d6b786',3,1)}
   if(selected&&choice===2)p(cx+1,f-5,'#66533e',2,2)
  }else if(id.endsWith(':3')){
   toy(cx-22,f-5);p(cx+8,f-6,'#b7baa0',15,7);p(cx+25,f-6,'#a8c9d4',12,7)
   if(selected&&choice===1)p(cx+25,f+2,'#e5d6b4',12,1)
   // Assignment only: the sail is not attached before the later rest-day event.
  }else{
   p(cx-29,f-9,'#9b7953',31,13);p(cx-27,f-8,'#cfba96',27,10);p(cx-20,f-8,'#9b7953',1,10);p(cx-9,f-8,'#9b7953',1,10)
   p(cx-26,f-5,'#a67e50',5,4);p(cx-17,f-5,'#a8c9d4',6,5);p(cx-5,f-5,'#d5c7a3',4,4);toy(cx+7,f-3,true)
   if(selected&&choice===0){p(cx-71,f-5,'#a67e50',14,5);p(cx-66,f-3,'#87958a',7,1)}
  }
 }else if(id.endsWith('netRack')){
  rack(p,cx-13,f,true,false);net(p,cx+4,f-4,19,12)
  if(selected){net(p,cx+4,f-34,19,9);net(p,cx+4,f-15,19,9)}
 }else{
  p(cx+37,f-5,'#e5d4b3',8,6);p(cx+38,f-5,'#896a4e',6,1);p(cx+44,f-3,'#e5d4b3',3,3)
 }
}

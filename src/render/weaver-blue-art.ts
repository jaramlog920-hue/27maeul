import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawWeaverFacade} from './weaver-front-background'
import {drawWeaverRoomBackground} from './weaver-room-background'
export const WEAVER_BLUE_IDS=['ev:penelope:blue','ev:penelope:love:1','ev:penelope:weaveTogether'] as const
export const isWeaverBlue=(id:string)=>(WEAVER_BLUE_IDS as readonly string[]).includes(id)
export function drawWeaverBlue(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*.56:h<=170?h*.69:h*.6),f=foot-28,chosen=choice!=null,weave=id==='ev:penelope:weaveTogether'
 g.imageSmoothingEnabled=false
 const spool=(x:number,y:number,c:string)=>{p(x,y,'#997551',9,2);p(x+1,y+2,c,7,7);p(x+3,y+2,'#d7d8bc',1,6);p(x,y+9,'#997551',9,2)}
 if(!weave){
  p(0,0,'#d6debf',w,h);p(0,f-25,'#9bab7e',w,h-f+25);p(0,f+3,'#c6b28a',w,h-f-3);drawWeaverFacade(p,cx,f)
  person(p,cx-65,foot+8,avatar,'right');person(p,cx+32,foot+8,npc.avatar,'left',npc.who)
  p(cx-15,foot+4,'#a9845f',35,4);p(cx-12,foot+8,'#795b41',3,12);p(cx+13,foot+8,'#795b41',3,12)
  const love=id==='ev:penelope:love:1',left=love?'#84a6b7':'#8eacba',right=love?'#899ab8':'#93aebb'
  // The first encounter offers two almost identical blues; dating names lake and evening sky.
  const offered=!love&&beat>=1&&!chosen
  const touch=!love&&choice===0&&beat>=3,lx=offered?cx+6:cx-10,rx=touch?cx+25:offered?cx+18:cx+4
  spool(lx,foot-8,left);spool(rx,foot-8,right)
  if(chosen){
   if(!love&&choice===0){p(cx-10,foot+4,'#e3d2ae',9,1);if(touch)p(rx,foot+3,'#d7d8bc',9,1)}
   if(love){
    // A small paper plan rather than an already knitted scarf.
    p(cx-11,foot+12,'#efe0ba',28,8)
    if(choice===0){for(let i=0;i<6;i++)p(cx-8+i*4,foot+14,i%2?right:left,3,4)}
    else p(cx-8,foot+14,right,21,4)
   }
  }
  return
 }
 drawWeaverRoomBackground(p,w,h,f)
 // Rain stays outside the window; drops never cross faces or indoor bodies.
 p(cx+78,f-75,'#9daeb6',42,35);p(cx+78,f-57,'#839a92',42,17)
 for(let i=0;i<6;i++){const x=cx+80+i*6,y=f-71+Math.floor(t*3+i*5)%24;p(x,y,'#c4d3d0',1,4)}
 p(cx+97,f-75,'#ad8d63',3,35);p(cx+78,f-59,'#ad8d63',42,2)
 // A second, active small loom between the two seated people. Furniture is outside bodies.
 const lx=cx-29,rx=cx+18
 p(lx,foot-48,'#8f6d4c',3,54);p(rx,foot-48,'#8f6d4c',3,54);p(lx-2,foot-50,'#af8b61',54,4)
 for(let x=lx+6;x<rx-2;x+=3)p(x,foot-44,'#e8d8b6',1,37)
 const complete=chosen&&choice===1,clothH=complete?23:beat>=1?15:8
 p(lx+5,foot-5-clothH,'#a9bba7',36,clothH)
 for(let i=0;i<Math.floor(clothH/3);i++)p(lx+5,foot-7-i*3,i%2?'#8fa8b2':'#bec6a4',36,1)
 if(chosen&&choice===0){p(lx+22,foot-16,'#899ab8',1,9);p(lx+23,foot-12,'#899ab8',2,2)}
 p(lx-2,foot-5,'#a17a53',54,4);p(lx-2,foot+6,'#76583e',8,3);p(rx-2,foot+6,'#76583e',8,3)
 person(p,cx-55,foot+8,avatar,'right','writer',true);person(p,cx+33,foot+8,npc.avatar,'left',npc.who,true)
 // Shuttle travels between the existing short hands at a constant size.
 const shuttleX=beat===0?cx+24:chosen?cx-32:Math.floor(t*2)%2?cx-32:cx+24
 p(shuttleX,foot-5,'#9b7752',10,3);p(shuttleX+2,foot-4,'#e0c697',6,1)
 spool(cx-45,foot+14,'#8fa8b2');spool(cx+24,foot+14,'#bec6a4')
}

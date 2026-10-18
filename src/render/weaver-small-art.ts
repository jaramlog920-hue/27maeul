import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawWeaverFacade} from './weaver-front-background'
import {drawWeaverRoomBackground} from './weaver-room-background'
export const WEAVER_SMALL_IDS=['ev:penelope:love:2','ev:penelope:small:colorNames','ev:penelope:short:spouseHabit'] as const
export const isWeaverSmall=(id:string)=>(WEAVER_SMALL_IDS as readonly string[]).includes(id)
export function drawWeaverSmall(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*.56:h<=170?h*.69:h*.6),f=foot-28,chosen=choice!=null,labels=id==='ev:penelope:small:colorNames',lunch=id==='ev:penelope:love:2',eat=lunch&&chosen&&choice===1
 g.imageSmoothingEnabled=false
 if(labels){
  drawWeaverRoomBackground(p,w,h,f);p(cx+78,f-75,'#9daeb6',42,35);p(cx+78,f-57,'#839a92',42,17)
  for(let i=0;i<6;i++)p(cx+80+i*6,f-71+Math.floor(t*3+i*5)%24,'#c4d3d0',1,4)
  p(cx+97,f-75,'#ad8d63',3,35);p(cx+78,f-59,'#ad8d63',42,2)
 }else{p(0,0,'#d6debf',w,h);p(0,f-25,'#9bab7e',w,h-f+25);p(0,f+3,'#c6b28a',w,h-f-3);drawWeaverFacade(p,cx,f)}
 if(lunch){
  // She has moved her lunch to the path by the weaving house, not the lake.
  for(const x of (eat?[cx-8,cx+20]:[cx+20])){p(x-2,foot+6,'#ae8b68',24,3);p(x,foot+9,'#76583e',3,6)}
  person(p,eat?cx-8:cx-65,foot+8,avatar,'right','writer',eat)
  person(p,cx+20,foot+8,npc.avatar,'left',npc.who,true)
  // Bread pieces between the two short hands; never in front of their heads.
  const bx=eat?cx+11:cx+1,by=foot-4
  p(bx,by+1,'#c89459',9,5);p(bx+1,by,'#e6bc7c',7,2);p(bx+2,by+2,'#f1d5a3',5,2)
  if(eat&&beat>=2){p(bx+5,by,'#c6b28a',1,6);p(bx+6,by+1,'#e6bc7c',3,4)}
  return
 }
 person(p,cx-85,foot+8,avatar,'right');person(p,cx+55,foot+8,npc.avatar,'left',npc.who)
 p(cx-35,foot+5,'#a9845f',76,4);p(cx-31,foot+9,'#795b41',3,14);p(cx+34,foot+9,'#795b41',3,14)
 if(labels){
  const colors=['#8eacba','#93aebb','#879eae',...(chosen&&choice===0?['#9dab88']:[])]
  for(let i=0;i<colors.length;i++){
   const x=cx-28+i*17,y=foot-9
   p(x,y,'#997551',9,2);p(x+1,y+2,colors[i],7,9);p(x,y+11,'#997551',9,2)
   p(x+4,y+6,'#e0d1ad',1,9);p(x+2,y+13,'#efe0ba',10,5)
   for(let j=0;j<(i===3?1:i+1);j++)p(x+4+j*2,y+15,'#9a825f',1,1)
   if(chosen&&choice===1)p(x+3,y+6,'#a8835e',3,1)
  }
 }else{
  // Future tablecloth: only a paper pattern with a stripe, flower or blank square.
  p(cx-25,foot-11,'#efe0ba',52,16);p(cx-23,foot-9,'#a88c64',48,1)
  for(let i=0;i<4;i++)p(cx-20+i*7,foot-7,'#a88c64',1,11)
  if(chosen&&choice===0){p(cx-18,foot-6,'#8fa8b2',2,8);p(cx-15,foot-6,'#8fa8b2',2,8);p(cx-9,foot-4,'#b98b92',2,5);p(cx-11,foot-2,'#b98b92',6,1)}
  else if(chosen&&choice===1){p(cx-18,foot-6,'#d0c1a2',9,1);p(cx-18,foot-6,'#d0c1a2',1,8);p(cx-18,foot+1,'#d0c1a2',9,1);p(cx-10,foot-6,'#d0c1a2',1,8)}
  p(cx+28,foot+2,'#927052',8,1)
 }
}

import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawWeaverFacade} from './weaver-front-background'
import {drawSunsetBackground} from './sunset-background'
export const WEAVER_CHOICE_IDS=['ev:penelope:silentDay','ev:penelope:story:2','ev:penelope:story:1','saw:penelope:unpick'] as const
export const isWeaverChoice=(id:string)=>(WEAVER_CHOICE_IDS as readonly string[]).includes(id)
export function drawWeaverChoice(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*.56:h<=170?h*.69:h*.6),f=foot-28,chosen=choice!=null,unpick=id==='saw:penelope:unpick',lap=unpick||id==='ev:penelope:story:2'
 g.imageSmoothingEnabled=false
 if(id==='ev:penelope:silentDay'&&choice===0&&beat>=3){
  drawSunsetBackground(g,w,h,t,foot-58,foot-15,Math.round((foot+8)/.88))
  // Bench behind the native crouched bodies; no extra arms or enlarged sprites.
  p(cx-47,foot-9,'#94715a',91,3);p(cx-45,foot-6,'#69594a',3,16);p(cx+38,foot-6,'#69594a',3,16);p(cx-47,foot+3,'#94715a',91,3)
  person(p,cx-35,foot+8,avatar,'up','writer',true);person(p,cx+12,foot+8,npc.avatar,'up',npc.who,true)
  return
 }
 p(0,0,unpick?'#b89689':'#d6debf',w,h);p(0,f-25,'#9bab7e',w,h-f+25);p(0,f+3,'#c6b28a',w,h-f-3);drawWeaverFacade(p,cx,f)
 person(p,cx-85,foot+8,avatar,'right')
 if(lap){p(cx+22,foot+6,'#a8835e',27,3);p(cx+24,foot+9,'#76583e',3,8);p(cx+42,foot+9,'#76583e',3,8)}
 person(p,cx+25,foot+8,npc.avatar,'left',npc.who,lap)
 const spool=(x:number,y:number,c:string)=>{p(x,y,'#997551',9,2);p(x+1,y+2,c,7,7);p(x,y+9,'#997551',9,2)}
 const flower=(x:number,y:number)=>{p(x+2,y,'#b98b92',2,5);p(x,y+2,'#b98b92',6,1);p(x+2,y+2,'#e1c690',2,1)}
 if(id==='ev:penelope:story:1'){
  p(cx-41,foot+5,'#a9845f',56,4);p(cx-37,foot+9,'#795b41',3,12);p(cx+8,foot+9,'#795b41',3,12)
  const x=cx-36,y=foot-9
  p(x,y,'#efe0ba',22,14);p(x+26,y,'#efe0ba',22,14)
  for(let i=0;i<(chosen&&choice===0?5:3);i++)p(x+3+i*3,y+3,'#91a6b2',1,8)
  flower(x+31,y+4);flower(x+39,y+5)
  if(chosen&&choice===1){p(x+20,y+5,'#91a6b2',3,1);p(x+23,y+6,'#b98b92',3,1)}
  p(cx+8,foot+1,'#927052',7,1)
 }else if(id==='ev:penelope:silentDay'){
  p(cx-23,foot+6,'#a9845f',37,4);p(cx-20,foot+10,'#795b41',3,11);p(cx+8,foot+10,'#795b41',3,11)
  spool(cx-17,foot-5,'#89a6b7');spool(cx-2,foot-5,'#9aabb8')
  // Both skeins remain undecided; the other choice is conversation, not a trip.
 }else{
  const x=cx-8,y=foot+2,length=unpick?Math.max(9,38-beat*9):35
  p(x,y,'#c0bca0',length,5);for(let xx=x+2;xx<x+length;xx+=5)p(xx,y,'#8d9eab',1,5)
  if(!unpick){flower(x+16,y-1);p(x+23,y+1,'#8d9eab',2,2);p(x+25,y+3,'#8d9eab',2,1);if(chosen)p(x+32,y,'#d9c9ad',2,5)}
  else if(beat>=1){
   // Scissors touch the loose strand beside her short hand, below the face.
   p(cx+19,foot-4,'#89918a',5,1);p(cx+20,foot-3,'#89918a',3,1);p(cx+23,foot-6,'#89918a',2,5)
   p(x+length-1,y+5,'#e1d3b2',1,11)
   for(let i=0;i<beat+1;i++){p(cx-6-i*2,foot+19+i*2,'#e1d3b2',18+i*3,1);p(cx-8-i*2,foot+20+i*2,'#e1d3b2',2,1);p(cx+12+i,foot+20+i*2,'#e1d3b2',2,1)}
  }
  if(!unpick&&chosen&&choice===1){spool(cx-63,foot+7,'#b5b79b');p(cx-67,foot+7,'#d7c8a6',14,1)}
 }
}

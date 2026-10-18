import {drawWeaverHome,WEAVER_HOME_IDS,isWeaverHome} from './weaver-home-art'
import {drawWeaverSmall,WEAVER_SMALL_IDS,isWeaverSmall} from './weaver-small-art'
import {drawWeaverBlue,WEAVER_BLUE_IDS,isWeaverBlue} from './weaver-blue-art'
import {drawWeaverChoice,WEAVER_CHOICE_IDS,isWeaverChoice} from './weaver-choice-art'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawWeaverRoomBackground} from './weaver-room-background'
import {drawWeaverFacade} from './weaver-front-background'
export const WEAVER_EVENT_IDS=[...WEAVER_HOME_IDS,...WEAVER_SMALL_IDS,...WEAVER_BLUE_IDS,...WEAVER_CHOICE_IDS,'ev:weaver:story:1','ev:weaver:story:2','ev:weaver:story:3','ev:weaver:story:4'] as const
export const isWeaverEvent=(id:string)=>(WEAVER_EVENT_IDS as readonly string[]).includes(id)
export function weaverEventPeople(id:string){if(isWeaverHome(id))return ['penelope'];if(isWeaverSmall(id))return ['penelope'];if(isWeaverBlue(id))return ['penelope'];if(isWeaverChoice(id))return ['penelope'];return ['weaver',...(id.endsWith(':3')||id.endsWith(':4')?['penelope']:[])]}
/** 손님에게 보내던 천 대신 어머니가 자기 색을 고르고, 딸의 무늬와 함께 남긴다. */
export function drawWeaverEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 if(isWeaverHome(id)){drawWeaverHome(g,id,w,h,t,avatar,npc,beat,choice);return}
 if(isWeaverSmall(id)){drawWeaverSmall(g,id,w,h,t,avatar,npc,beat,choice);return}
 if(isWeaverBlue(id)){drawWeaverBlue(g,id,w,h,t,avatar,npc,beat,choice);return}
 if(isWeaverChoice(id)){drawWeaverChoice(g,id,w,h,t,avatar,npc,beat,choice);return}
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*(id.endsWith(':4')?.56:.6):h<=170?h*.69:h*.6),f=foot-28,chosen=choice!=null,third=id.endsWith(':3'),tea=id.endsWith(':4')
 g.imageSmoothingEnabled=false
 if(third){p(0,0,'#cfb5a0',w,h);p(0,f-25,'#9bab7e',w,h-f+25);p(0,f+3,'#c6b28a',w,h-f-3);drawWeaverFacade(p,cx,f)}
 else drawWeaverRoomBackground(p,w,h,f)
 const colors=['#b08c6c','#99ae83','#89a9b9','#c89394']
 const spool=(x:number,y:number,c:string)=>{p(x,y,'#997551',10,2);p(x+1,y+2,c,8,9);p(x,y+11,'#997551',10,2);p(x+3,y+3,'#ded1b0',1,7)}
 const rug=(x:number,y:number,a:number,b:number,stripe=false)=>{p(x,y,'#c89394',a,b);for(let yy=y+2;yy<y+b;yy+=3)p(x+1,yy,'#d8aaa3',a-2,1);if(stripe){p(x+2,y+2,'#8d9eab',3,b-4);p(x+6,y+2,'#ded1b0',1,b-4)}for(let xx=x+2;xx<x+a-1;xx+=4)p(xx,y+b,'#b97e83',1,2)}
 const actor=(a:FinalePerson|null,x:number,seat=false)=>person(p,x,foot+8,a?a.avatar:avatar,a?(third&&a===npc?'right':'left'):'right',a?a.who:'writer',seat,false,t)
 if(tea){
  // The original third-day evening is already the gathering, with all three present.
  rug(cx-70,foot-8,146,37,true)
  const seat=beat>=2||chosen
  actor(null,cx-67,seat);actor(npc,cx+5,seat);if(others[0])actor(others[0],cx+50,seat)
  const cup=(x:number,y:number)=>{p(x,y,'#e8d6b2',8,6);p(x+1,y,'#8a6550',6,1);p(x+7,y+1,'#e8d6b2',3,3);p(x+8,y+2,'#b99a75',1,1)}
  // Cups sit beside the native hands, below all faces, leaving the bodies visible.
  cup(cx-43,foot-5);cup(cx-8,foot-5);cup(cx+36,foot-5)
  p(cx-28,foot+11,'#997551',16,8);p(cx-25,foot+8,'#997551',10,4);p(cx-30,foot+11,'#997551',3,3);p(cx-22,foot+6,'#d9b990',5,2)
  if(chosen&&choice===2)p(cx-52,foot+20,'#ded1b0',5,1)
  return
 }
 actor(null,cx-65);actor(npc,cx+18)
 if(third&&others[0])actor(others[0],cx+60)
 if(id.endsWith(':1')){
  // Bare floor below the window: a measuring cord appears only for that answer.
  const x=cx+76,y=f+27
  if(chosen&&choice===1){p(x-6,y+1,'#e7d7af',47,1);for(let i=0;i<6;i++)p(x-6+i*8,y-1,'#a58359',1,4);p(x-7,y,'#a58359',2,3);p(x+39,y,'#a58359',2,3)}
 }else if(id.endsWith(':2')){
  // Four real skeins on the floor; only the rose skein is selected, no rug yet.
  for(let i=0;i<4;i++)spool(cx-20+i*17,foot+17,colors[i])
  if(chosen)p(cx+30,foot+32,'#ede1bf',11,2)
 }else{
  // Shared work at the house front. The unfinished cloth and shuttle stay between bodies.
  p(cx-26,foot+3,'#a9845f',35,4);p(cx-23,foot+7,'#795b41',3,13);p(cx+2,foot+7,'#795b41',3,13)
  p(cx-27,foot-29,'#8f6d4c',3,32);p(cx+7,foot-29,'#8f6d4c',3,32);p(cx-28,foot-30,'#af8b61',39,3)
  for(let x=cx-22;x<cx+6;x+=3)p(x,foot-26,'#e8d8b6',1,18)
  rug(cx-24,foot-10,31,12,beat>=1)
  const shuttleX=beat>=2?cx+52:cx+36
  p(shuttleX,foot-5,'#9b7752',8,3);p(shuttleX+1,foot-4,'#e0c697',6,1)
  spool(cx-35,foot+14,colors[3]);spool(cx+4,foot+14,'#8d9eab')
  if(chosen&&choice===1){p(cx-20,foot-9,'#8d9eab',1,9);p(cx-19,foot-4,'#8d9eab',2,2)}
 }
}

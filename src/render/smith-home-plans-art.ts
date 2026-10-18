import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawForgeRoomBackground} from './forge-room-background'
export const SMITH_HOME_PLAN_IDS=['ev:tilly:home:1','ev:tilly:short:spouseHabit','ev:tilly:home:2'] as const
export const isSmithHomePlan=(id:string)=>(SMITH_HOME_PLAN_IDS as readonly string[]).includes(id)
/** 배우자의 미래 계획을 지금 설치·줄질·수면·나들이로 실행하지 않는다. */
export function drawSmithHomePlan(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*.66:h<=170?h*.69:h*.6),chosen=choice!=null
 g.imageSmoothingEnabled=false;drawForgeRoomBackground(p,w,h,foot-28)
 person(p,cx-85,foot+8,avatar,'right','writer',false,false,t);person(p,cx+55,foot+8,npc.avatar,'left',npc.who,false,false,t)
 p(cx-30,foot+2,'#b69871',73,4);p(cx-26,foot+6,'#866548',3,14);p(cx+35,foot+6,'#866548',3,14)
 const leaf=(x:number,y:number)=>{p(x+2,y,'#919a8b',7,2);p(x,y+2,'#919a8b',11,3);p(x+2,y+5,'#919a8b',7,2);p(x+2,y+3,'#607368',7,1)}
 if(id==='ev:tilly:home:1'){
  p(cx-20,foot-13,'#e2d0ab',47,14);p(cx-17,foot-11,'#879185',15,1);p(cx-17,foot-10,'#879185',1,9);p(cx-3,foot-10,'#879185',1,9);p(cx-17,foot-2,'#879185',15,1);leaf(cx-18,foot-8)
  p(cx+7,foot-10,'#79817a',10,1);p(cx+5,foot-9,'#79817a',2,7);p(cx+17,foot-9,'#79817a',2,7);p(cx+7,foot-2,'#79817a',10,1)
  if(chosen)p(cx+(choice===0?-13:10),foot,'#9e7b53',7,1)
 }else if(id==='ev:tilly:short:spouseHabit'){
  p(cx-21,foot-7,'#856c51',49,9);p(cx-20,foot-6,'#c8b599',47,7)
  leaf(cx-15,foot-12);p(cx+2,foot-11,'#79847a',10,6);p(cx+4,foot-13,'#79847a',5,2);p(cx+18,foot-10,'#9b9d8a',6,5)
  if(chosen)p(cx+(choice===0?-12:choice===1?4:19),foot+4,'#e2d0ab',4,1)
 }else{
  // 내일의 휴식 계획. 지금은 빈 작업판과 내려놓은 망치 곁에서 이야기한다.
  p(cx-18,foot-5,'#926f4c',16,2);p(cx-3,foot-7,'#7f8981',4,6)
  p(cx+26,foot-7,'#efe0bb',10,8);p(cx+28,foot-5,'#ad9369',6,1);p(cx+28,foot-2,'#ad9369',4,1)
  if(beat>=1)p(cx+28,foot,'#ad9369',5,1)
 }
}

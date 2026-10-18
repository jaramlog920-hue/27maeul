import {drawEventPrecipitation} from './event-precipitation'
import {newbornArt} from './newborn-art'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawBakeryRoomBackground} from './bakery-room-background'
import {drawBakeryFrontBackground} from './bakery-front-background'
import {spriteRows,writerPalette,PALETTE,type Who} from './sprites'
export const BAKERY_EVENT_IDS=['ev:wendell:story:1','ev:wendell:myBread','ev:baker:story:1','ev:wendell:small:lateBreakfast','ev:wendell:letterTalk','ev:wendell:story:2b','ev:baker:story:2','ev:wendell:first','ev:wendell:baby','ev:wendell:story:2','ev:wendell:short:spouseHabit','ev:wendell:short:lunchSwap','ev:wendell:home:1','babyBorn'] as const
export const isBakeryEvent=(id:string)=>(BAKERY_EVENT_IDS as readonly string[]).includes(id)
export function bakeryEventPeople(id:string){return id==='babyBorn'||id.startsWith('ev:baker:')?['baker']:id==='ev:wendell:short:lunchSwap'?['wendell','tilly']:id==='ev:wendell:story:2'?['wendell','baker']:['wendell']}
/** 원래 사건의 빵·편지·반죽·동생을 기존 빵집 배경 위에 그린다. */
export function drawBakeryEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*.66:h<=170?h*.69:h*.6),f=foot-25,selected=choice!=null
 const outside=!['ev:baker:story:1','ev:baker:story:2','ev:wendell:small:lateBreakfast','babyBorn'].includes(id)
 g.imageSmoothingEnabled=false
 if(outside)drawBakeryFrontBackground((x,y,c,a,b)=>p(x,y,(id==='ev:wendell:first'||id==='ev:wendell:myBread'||id==='ev:wendell:home:1')&&c==='#d9dcc0'?'#a3afb1':c,a,b),w,h,foot-23,true);else drawBakeryRoomBackground(p,w,h,f)
 if(id==='ev:wendell:letterTalk')drawEventPrecipitation((x,y,c,a,b)=>{if(x<cx-109||x>cx+43||y>foot+2)p(x,y,c,a,b)},w,h,t)
 const stamp=(rows:readonly string[],pal:Record<string,string>,x:number,y:number)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*2,y+yy*2,pal[c],2,2)}))
 const actor=(who:FinalePerson|null,x:number,facing:'left'|'right'|'down'='left',crouch=false,pose?:'wave'|'handUp')=>{
  const av=who?who.avatar:avatar,kind=who?who.who:'writer' as Who
  if(pose){const full=av?withLookDefaults(av):undefined,rows=spriteRows(kind,facing,{frame:0,blink:false,avatar:full,pose}),pal=kind==='writer'?writerPalette('spring',full):PALETTE;stamp(rows,pal,x,foot-rows.length*2)}
  else person(p,x,foot,av,facing,kind,crouch,false,t)
 }
 const table=(x=cx-30,width=68)=>{p(x,foot-10,'#b88e60',width,5);p(x+2,foot-10,'#d0ac77',width-4,2);p(x+4,foot-5,'#806043',3,12);p(x+width-7,foot-5,'#806043',3,12)}
 const bread=(x:number,y:number,shape=0,half=false)=>{
  const bw=half?6:shape===1?11:15;p(x,y,'#a57045',bw,4);p(x+1,y-3,'#cc9b60',bw-2,5);p(x+3,y-2,'#e0bc80',2,2)
  if(shape===1)p(x+6,y-2,'#6f7650',2,2)
  if(shape===2){p(x+3,y-2,'#775844',2,2);p(x+8,y-1,'#80694d',2,2)}
  if(shape===3){p(x+3,y-2,'#827285',2,2);p(x+8,y-1,'#827285',2,2)}
 }
 const plate=(x:number,y=foot-14)=>{p(x-2,y+4,'#e2d6b5',20,3);p(x,y+4,'#c2b599',16,1)}
 const paper=(x:number,y:number,lines=2,wet=false)=>{p(x,y,wet?'#c8d0be':'#efe0bf',16,12);for(let i=0;i<lines;i++)p(x+3,y+3+i*3,'#a99572',10,1)}
 const cup=(x:number,y:number,milk=false)=>{p(x,y,'#d9d4b3',8,8);p(x+8,y+2,'#d9d4b3',3,4);p(x+9,y+3,'#b88e60',1,2);p(x+1,y,milk?'#f0e4c5':'#967853',6,2)}
 const oven=()=>{
  const ox=cx-137,base=foot-7;p(ox+10,base-75,'#b57d59',58,76);p(ox+3,base-66,'#b57d59',72,67);p(ox+16,base-81,'#c3936c',46,7)
  p(ox+18,base-54,'#704e3a',42,52);p(ox+25,base-62,'#704e3a',28,10);p(ox+21,base-51,'#3f3530',36,45);p(ox+28,base-58,'#3f3530',22,8)
  for(let y=base-68;y<base-4;y+=10){p(ox+4,y,'#996548',12,1);p(ox+62,y,'#996548',12,1)}
  p(ox+29,base-27,'#ba6b44',22,12);p(ox+33,base-31,'#e3a058',6,16);p(ox+43,base-28,'#f0c17a',4,12);p(ox+14,base-5,'#c39a70',50,6)
 }
 if(id==='ev:wendell:letterTalk'||id==='ev:wendell:story:1'){
  const rain=id.endsWith('letterTalk');actor(npc,cx-18,'right');actor(null,cx+16,'left')
  const pocket=selected&&rain&&choice===1
  if(!pocket)paper(cx-6,foot-17, rain?3:2,rain)
  if(!rain)paper(cx-26,foot-17,3)
  if(rain){p(cx-94,foot+8,'#93a6a0',21,2);p(cx+43,foot+5,'#a2b0a2',23,2)}
  if(selected&&!rain&&choice===0){p(cx-52,foot-11,'#b88e60',27,5);p(cx-49,foot-14,'#e4d2aa',14,3)}
  // 답장은 아직 계획이다. 출발·보상·도시 장면을 앞당기지 않는다.
  return
 }
 if(id==='ev:wendell:story:2b'){
  const leaving=selected&&choice===0
  actor(npc,leaving?cx+82:cx-9,leaving?'right':'left',false,selected&&choice===2?'wave':undefined)
  actor(null,leaving?cx+47:cx+26,'left',false,selected&&choice===2?'wave':undefined)
  p(leaving?cx+88:cx-3,foot-19,'#b69a70',13,13);p(leaving?cx+91:cx,foot-21,'#dcc398',7,3)
  if(selected&&choice===1){p(cx-35,foot-12,'#dbc49a',25,8);paper(cx-34,foot-19,2);p(cx-16,foot-16,'#82694d',9,2);p(cx-11,foot-15,'#aeb6a2',4,2)}
  if(leaving){p(cx+67,foot+1,'#c9b58b',74,7);p(cx+126,foot-25,'#896d4c',3,29);p(cx+112,foot-46,'#829a6c',31,19)}
  return
 }
 if(id==='ev:wendell:baby'){
  const handover=selected&&choice===0,nx=cx-25,px=cx+9
  actor(npc,nx,'right');actor(null,px,'left')
  const bx=handover?px-14:nx+14,by=foot-17
  const newborn=newbornArt(others[0]?.avatar??npc.avatar,0,selected&&choice!==1)
  stamp(newborn.rows,newborn.palette,bx,by)
  if(!selected){p(bx+18,by-2,'#869da1',1,6);p(bx+20,by-1,'#869da1',2,2)}
  else if(choice===1){p(cx-6,foot-51,'#869da1',1,6);p(cx-4,foot-51,'#869da1',3,2);p(cx+28,foot-51,'#869da1',1,6);p(cx+30,foot-51,'#869da1',3,2)}
  return
 }
 if(id==='babyBorn'){actor(npc,cx-15,'right',false,beat>=1?'handUp':undefined);actor(null,cx+22,'left');return}
 if(id==='ev:wendell:first'||id==='ev:wendell:myBread'||id==='ev:wendell:home:1'){
  oven();actor(npc,cx-23,'right');actor(null,cx+30,'left');table(cx-35,80)
  const dough=beat===0&&id!=='ev:wendell:home:1',cat=selected&&choice===0&&id==='ev:wendell:myBread'
  if(dough){p(cx-14,foot-16,'#e4d2aa',25,6);p(cx-10,foot-18,'#efdfba',17,4)}
  else if(id==='ev:wendell:home:1'){
   bread(cx-20,foot-15);bread(cx+2,foot-15,1);p(cx+3,foot-19,'#cc9b60',4,3)
   if(selected)p(choice===0?cx-21:cx+1,foot-10,'#7c9986',18,1)
  }else if(id==='ev:wendell:myBread'){
   if(cat&&beat<4){p(cx-4,foot-19,'#e4d2aa',15,7);p(cx-3,foot-21,'#cc9b60',3,5);p(cx+6,foot-21,'#cc9b60',3,5);for(let i=0;i<5;i++)p(cx-4+i*3,foot-12,'#a57045',2,3)}
   else if(!cat){p(cx-4,foot-19,'#e4d2aa',15,7);p(cx+1,foot-22,'#cc9b60',5,7);p(cx-6,foot-14,'#a57045',3,3)}
   if(cat&&beat>=4){bread(cx-106,foot-27);p(cx-103,foot-32,'#cc9b60',3,5);p(cx-96,foot-32,'#cc9b60',3,5);for(let i=0;i<5;i++)p(cx-106+i*3,foot-23,'#a57045',2,3)}
  }else{bread(cx-4,foot-16);if(selected&&choice===1)paper(cx+11,foot-20,3);if(selected&&choice===2){p(cx-14,foot-16,'#e4d2aa',25,6);p(cx-10,foot-18,'#efdfba',17,4)}}
  return
 }
 if(id==='ev:wendell:story:2'||id==='ev:wendell:short:lunchSwap'){
  const lunch=id.endsWith('lunchSwap');actor(npc,cx-24,'right');if(others[0])actor(others[0],cx+19,'left');actor(null,cx+61,'left');table(cx-39,91)
  if(lunch){plate(cx-6);if(selected&&choice===0){bread(cx-5,foot-14,1,true);bread(cx+4,foot-14,1,true)}else bread(cx-4,foot-14,1);if(selected&&choice===1){plate(cx+30);bread(cx+31,foot-14,0)}}
  else{for(let i=0;i<3;i++){bread(cx-29+i*20,foot-16);p(cx-25+i*20,foot-17,'#96734f',1,4)}if(selected&&choice===0){p(cx+59,foot-19,'#cc9b60',5,4);p(cx-29,foot-16,'#b88e60',5,5)}}
  return
 }
 if(id==='ev:wendell:short:spouseHabit'){
  actor(npc,cx-19,'right');actor(null,cx+24,'left');table();plate(cx-3);bread(cx-2,foot-14)
  // 가져갈 계획을 이야기하는 컷. 집 식탁으로 순간 이동하거나 이미 먹지 않는다.
  return
 }
 const seated=id==='ev:wendell:small:lateBreakfast'
 actor(npc,cx+7,'left',seated);actor(null,cx-32,'right',selected&&choice===0&&seated);table(cx-42,100)
 if(seated){plate(cx-4);bread(cx-2,foot-14,0,true);cup(selected&&choice===0?cx+9:cx+16,selected&&choice===0?foot-23:foot-19,true);return}
 if(id==='ev:baker:story:1'){
  plate(cx-4);bread(cx-3,foot-14);p(cx+27,foot-17,'#d1ba93',20,5);p(cx+28,foot-17,'#efe0bf',18,3)
  if(!(selected&&choice===1)){plate(cx-28);p(cx-12,foot-18,'#d9d4b3',8,8)}
 }else{
  for(let i=0;i<3;i++){plate(cx-27+i*24);bread(cx-25+i*24,foot-14,i===0?2:i===1?3:0)}
  paper(cx+40,foot-22,beat>=1?3:0);if(selected){const n=Math.max(0,Math.min(2,choice));p(cx+43,foot-19+n*3,'#7c9986',4,1)}
 }
}

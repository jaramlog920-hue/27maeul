import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawForgeYardBackground} from './forge-yard-background'
import {drawForgeRoomBackground} from './forge-room-background'
import {spriteRows} from './sprites'
export const SMITH_FAMILY_IDS=['saw:forge:quarrel','ev:basil:smith','ev:tilly:story:3','ev:tilly:story:4','ev:tilly:small:hookColor'] as const
export const isSmithFamily=(id:string)=>(SMITH_FAMILY_IDS as readonly string[]).includes(id)
export function smithFamilyPeople(id:string){return id==='saw:forge:quarrel'?['smith','tilly']:id==='ev:basil:smith'?['basil','smith']:id==='ev:tilly:story:4'?['tilly','smith']:id==='ev:tilly:small:hookColor'?['tilly','penelope']:['tilly']}
export function drawSmithFamily(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*.66:h<=170?h*.69:h*.6),ground=foot+8,chosen=choice!=null
 const evening=id==='ev:basil:smith'||id==='ev:tilly:story:4'
 g.imageSmoothingEnabled=false
 drawForgeYardBackground((x,y,c,a,b)=>p(x,y,evening&&c==='#cfdbbc'?'#c6b4a0':c,a,b),w,h,foot)
 const actor=(who:FinalePerson|null,x:number,face:'left'|'right'='left',crouch=false)=>person(p,x,ground,who?who.avatar:avatar,face,who?who.who:'writer',crouch,false,t)
 const anvil=(x:number,y:number)=>{p(x+7,y+7,'#886747',22,14);p(x,y,'#8b9388',36,4);p(x+4,y+4,'#657169',26,5)}
 const hammer=(x:number,y:number,flat=false)=>{p(x,y,'#926f4c',flat?9:2,flat?2:9);p(x+(flat?8:-3),y-2,'#7f8981',flat?4:8,flat?6:3)}
 const leafRing=(x:number,y:number,etched=false,finish=0,thread=false)=>{
  p(x+3,y,'#879185',11,2);p(x,y+2,'#879185',3,9);p(x+14,y+2,'#879185',3,9);p(x+3,y+11,'#879185',11,2)
  p(x-3,y+4,'#9ba18c',5,3);p(x+16,y+3,'#9ba18c',5,3);p(x+8,y-3,'#9ba18c',5,4)
  p(x-2,y+5,'#616e64',2,1);p(x+17,y+4,'#616e64',2,1);if(finish===2)p(x+20,y+3,'#b4b9a5',1,3)
  if(etched){p(x+3,y+3,'#59695c',2,1);p(x+5,y+4,'#59695c',1,2)}
  if(thread){p(x+17,y+3,'#4f805d',2,3);p(x+16,y+4,'#a5b78b',4,1)}
 }
 const post=()=>{p(cx+16,foot-80,'#9d7c56',4,87);p(cx+17,foot-78,'#b4946f',1,82);p(cx+15,foot-12,'#6c756b',6,2)}
 if(id==='saw:forge:quarrel'){
  const gone=beat>=3
  actor(null,cx-85,'right');actor(npc,gone?cx+1:cx-10,'right');if(others[0])actor(others[0],gone?cx+120:cx+54,gone?'right':'left')
  anvil(cx+15,foot)
  if(gone)hammer(cx+24,foot+8,true);else hammer(cx+45,foot-2)
  return
 }
 if(id==='ev:basil:smith'){
  const nextDay=chosen&&choice===1&&beat>=4
  if(nextDay){
   drawForgeRoomBackground(p,w,h,foot-28)
   if(others[0])actor(others[0],cx+65)
   p(cx-2,foot+3,'#b69871',53,4);p(cx+2,foot+7,'#866548',3,13);p(cx+43,foot+7,'#866548',3,13)
   p(cx+16,foot-6,'#c9d1b4',8,8);p(cx+24,foot-4,'#c9d1b4',3,4);p(cx+17,foot-6,'#9f835e',6,1);p(cx+17,foot-12,'#e4ddc1',1,3)
   p(cx+31,foot-3,'#789363',5,2);p(cx+32,foot-5,'#789363',3,2)
  }else{
   actor(null,cx-85,'right');actor(npc,cx+50)
   const av=npc.avatar?withLookDefaults(npc.avatar):undefined,rows=spriteRows(npc.who,'left',{frame:0,blink:false,avatar:av}),row=rows.findIndex((r,i)=>i>=9&&r.includes('s')),hy=ground-rows.length*2+(row<0?10:row)*2
   p(cx+42,hy-5,'#91a5a0',6,8);p(cx+43,hy-7,'#9a7c52',4,2);p(cx+43,hy-3,'#d0d9ba',4,3)
  }
  return
 }
 post()
 if(id==='ev:tilly:story:4'){
  const helping=chosen&&choice===0,inspect=chosen&&choice===2
  actor(null,helping?cx-2:inspect?cx-9:cx-85,'right',inspect)
  actor(npc,helping?cx+35:cx+41)
  if(others[0])actor(others[0],!chosen&&beat===1?cx-17:cx+95,'right')
  leafRing(cx+18,foot-10,true)
  if(!chosen&&beat===1){for(let i=0;i<8;i++)p(cx+1+i*2,foot+3-i*2,'#926f4c',2,2);p(cx+14,foot-12,'#7f8981',6,4)}else hammer(cx+82,foot+3,true)
  return
 }
 actor(null,cx-85,'right');actor(npc,cx+50);if(others[0])actor(others[0],cx+82)
 anvil(cx-34,foot+2)
 p(cx-25,foot-6,'#b89a70',67,5)
 const rx=cx-4,ry=foot-18
 leafRing(rx,ry,false,chosen&&choice===2?2:1,id==='ev:tilly:small:hookColor'&&chosen&&choice===2)
 if(id==='ev:tilly:story:3'){
  p(cx-21,foot-13,'#859186',2,11);p(cx-22,foot-3,'#9e7b53',4,3);hammer(cx+28,foot-7,true)
  if(chosen&&choice===2){p(rx+20,ry+3,'#b4b9a5',1,3)}
 }else{
  for(let i=0;i<2;i++){const x=cx+24+i*15;p(x,foot-20,'#b7986a',10,2);p(x+2,foot-18,i?'#789469':'#4f805d',6,7);p(x,foot-11,'#b7986a',10,2)}
  if(chosen&&choice!==2&&!(choice===1&&beat===3)){p(cx+28,foot-23,'#d7d5b3',2,2)}
 }
 // 선택한 줄질/실 감기는 고리의 끝에만 나타난다. 얼굴·몸통·팔은 기본 도트 그대로 둔다.
}

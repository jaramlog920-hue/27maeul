import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {spriteRows,writerPalette,PALETTE} from './sprites'
import {drawTeaRoomBackground} from './tea-room-background'
import {drawTeaFrontBackground} from './tea-front-background'
export const TEA_EVENT_IDS=['ev:poppy:small:newTea','ev:poppy:story:1','ev:poppy:window','ev:romance:merchant:savedSeat','ev:poppy:order','ev:poppy:small:regularNotes','ev:penelope:hesitate2','ev:poppy:cup','ev:poppy:closing','ev:poppy:home:2','ev:poppy:teaName','ev:poppy:home:1','ev:poppy:short:spouseHabit','ev:poppy:tired','ev:basil:story:3','ev:poppy:story:3','ev:poppy:small:coaster','ev:apothecary:story:4','dateTea','ev:penelope:story:3','ev:baker:story:4','ev:wendell:research','ev:wendell:love:2','ev:wendell:love:1','ev:wendell:dateTea','ev:baker:small:wendellAfternoon'] as const
export const isTeaEvent=(id:string)=>(TEA_EVENT_IDS as readonly string[]).includes(id)
export function teaEventPeople(id:string){
 if(id==='dateTea')return ['wendell']
 if(id.includes('merchant:'))return ['merchant']
 if(id.startsWith('ev:penelope:'))return ['penelope','poppy']
 if(id.startsWith('ev:basil:'))return ['basil','poppy']
 if(id.startsWith('ev:apothecary:'))return ['apothecary','poppy']
 if(id.startsWith('ev:baker:'))return ['baker','poppy']
 if(id==='ev:poppy:small:coaster')return ['poppy','penelope']
 if(id.startsWith('ev:wendell:'))return ['wendell',...(id==='ev:wendell:research'||id==='ev:wendell:dateTea'?['poppy']:[])]
 return ['poppy']
}
/** 기존 찻집의 창·차통·마루 위에 원래 사건의 물건과 선택별 상태를 놓는다. */
export function drawTeaEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*.66:h<=170?h*.69:h*.6),f=foot-28,chosen=choice!=null
 const research=id==='ev:wendell:research',walk=id==='ev:romance:merchant:savedSeat'&&chosen&&choice===1
 g.imageSmoothingEnabled=false
 if(research&&!(chosen&&choice===1)||walk)drawTeaFrontBackground((x,y,c,a,b)=>p(x,y,research&&c==='#817f91'?'#d7d9b8':c,a,b),w,h,foot-12)
 else drawTeaRoomBackground(p,w,h,f)
 const actor=(who:FinalePerson|null,x:number,y=foot,facing:'left'|'right'|'down'='left',seated=false,pose?:'handUp',sleep=false)=>{
  const av=who?who.avatar:avatar,kind=who?who.who:'writer' as const
  if(pose||sleep){const full=av?withLookDefaults(av):undefined,rows=spriteRows(kind,facing,{frame:0,blink:sleep,avatar:full,pose:pose??(seated?'crouch':'stand')}),pal=kind==='writer'?writerPalette('spring',full):PALETTE;rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*2,y-rows.length*2+yy*2,pal[c],2,2)}))}
  else person(p,x,y,av,facing,kind,seated,false,t)
 }
 const table=(x=cx-43,y=foot-8,width=90)=>{p(x,y,'#bd9e75',width,5);p(x+1,y,'#ece0be',width-2,2);p(x+5,y+5,'#8d6b4d',3,13);p(x+width-8,y+5,'#8d6b4d',3,13)}
 const cup=(x:number,y:number,style=0,hot=false,pattern=false)=>{
  p(x-2,y+6,'#d5cbb0',13,2);p(x,y,'#748d83',7,7);p(x-1,y-1,style===1?'#f6edce':style===2?'#c5ac80':'#91a19c',9,2);p(x+1,y,'#8e6649',5,1)
  p(x+7,y+2,'#748d83',3,3);p(x+8,y+3,'#ece0be',1,1);if(pattern)p(x+1,y+3,'#ece0be',4,1)
  if(hot){p(x+2,y-6,'#e5ddc5',1,3);p(x+4,y-8,'#e5ddc5',1,3)}
 }
 const kettle=(x:number,y:number)=>{p(x,y,'#7c9187',11,9);p(x+2,y-2,'#9caf9b',7,3);p(x+4,y-4,'#677e74',2,2);p(x-3,y+2,'#7c9187',4,3);p(x+11,y+1,'#657e74',3,6)}
 const paper=(x:number,y:number,lines=2)=>{p(x,y,'#efe0bf',19,11);for(let i=0;i<lines;i++)p(x+3,y+3+i*3,'#a99572',12,1)}
 const leaf=(x:number,y:number)=>{p(x,y,'#7c9b65',5,3);p(x+2,y+2,'#537653',4,1)}
 const snack=(x:number,y:number,halved=false)=>{p(x-2,y+5,'#d4c6a5',18,2);p(x,y,'#c19a63',halved?6:13,5);p(x+1,y-2,'#e4b467',halved?4:11,3);if(halved){p(x+8,y,'#c19a63',5,5);p(x+9,y-2,'#e4b467',3,3)}}
 const chairUp=(x:number,y:number)=>{p(x,y,'#9b805a',14,3);p(x+1,y-13,'#9b805a',2,13);p(x+11,y-13,'#9b805a',2,13);p(x+2,y+3,'#9b805a',2,6);p(x+10,y+3,'#9b805a',2,6)}
 if(id==='ev:poppy:window'){
  // 같은 창 안에만 김과 손가락 자국을 남긴다. 몸과 손은 기본 도트를 쓴다.
  p(cx-102,f-63,'#d7ddcb',56,43);p(cx-77,f-63,'#a18a64',3,43);p(cx-102,f-44,'#a18a64',56,3)
  const x=cx-94,y=f-54;p(x,y,'#a2b9ac',9,8);p(x+9,y+2,'#a2b9ac',3,4);p(x+1,y+1,'#d7ddcb',7,5)
  if(chosen&&choice===0){p(x+18,y+10,'#a2b9ac',20,1);p(x+20,y+8,'#a2b9ac',16,1);p(x+32,y-2,'#a2b9ac',7,8);p(x+30,y-4,'#a2b9ac',11,2)}
  if(chosen&&choice===1){p(x+17,y,'#a2b9ac',8,7);p(x+24,y+2,'#a2b9ac',4,2);p(x+33,y,'#a2b9ac',5,8);p(x+30,y+1,'#a2b9ac',3,4);p(x+38,y+1,'#a2b9ac',3,4)}
  actor(npc,cx-108,foot-16,'right',false,'handUp');actor(null,cx-62,foot-16,'left',false,chosen?'handUp':undefined)
  return
 }
 if(research){
  if(chosen&&choice===1){actor(npc,cx-28,foot,'right');if(others[0])actor(others[0],cx+22);actor(null,cx+67);table();snack(cx-4,foot-16)
   const av=npc.avatar?withLookDefaults(npc.avatar):undefined,rows=spriteRows(npc.who,'right',{avatar:av,frame:0,blink:false}),top=foot-rows.length*2;p(cx-26,top+1,'#8b8069',16,3);p(cx-24,top-2,'#8b8069',12,4)
  }else{actor(npc,cx-23,foot,'right');actor(null,cx+19);p(cx-91,foot-47,'#c19a63',9,5);p(cx-77,foot-47,'#c19a63',9,5);if(chosen&&choice===0){table();snack(cx-8,foot-16,true)}}
  return
 }
 if(walk){p(0,foot+8,'#8fa9a2',w,h-foot-8);p(0,foot+8,'#c7d1b8',w,3);actor(npc,cx+9,foot,'right');actor(null,cx-24,foot,'right');return}
 if(id==='ev:poppy:cup'){
  const holding=!(chosen&&choice===0);actor(npc,holding?cx+70:cx+18,foot,'left',false,holding?'handUp':undefined);actor(null,cx-36,foot,'right');table()
  if(holding)cup(cx+60,foot-27,2,false,true);else cup(cx-10,foot-16,2,false,true)
  return
 }
 const corner=['ev:poppy:story:1','ev:poppy:story:3','ev:poppy:small:coaster'].includes(id)
 const px=corner?cx-72:cx-40,nx=corner?cx-19:cx+20
 const tired=id==='ev:poppy:tired'&&chosen&&choice===0,sleep=id==='ev:wendell:love:2'&&(beat===1||chosen&&choice===1)
 const standing=['ev:poppy:order','ev:poppy:small:regularNotes','ev:poppy:teaName','ev:poppy:closing','ev:poppy:short:spouseHabit','ev:poppy:home:1','ev:poppy:home:2','ev:apothecary:story:4'].includes(id)
 actor(npc,nx,foot,'left',!standing||tired,undefined,sleep);actor(null,px,foot,'right',!standing||tired)
 if(others[0])actor(others[0],cx+79,foot-10,'left')
 table(corner?cx-81:id==='ev:wendell:dateTea'?cx-69:cx-47,foot-8,corner?92:id==='ev:wendell:dateTea'?129:104)
 const lx=corner?cx-53:cx-14,rx=corner?cx-28:cx+10,cy=foot-16
 if(id==='ev:poppy:closing'||id==='ev:poppy:story:1'){
  chairUp(cx+84,f-28);chairUp(cx-119,f+2)
  if(id==='ev:poppy:closing'){cup(rx,cy,1);p(rx+10,cy+3,'#dfd3b4',8,4);if(chosen&&choice===0)actor(npc,nx,foot,'left',false);return}
  p(lx+3,cy-7,'#aa8b63',22,13);p(lx+4,cy-6,'#d8c29c',20,11)
  if(chosen){if(choice===0){for(let i=0;i<5;i++)p(lx+6+i*3,cy-3,'#8b7657',2,2)}else if(choice===1)p(lx+2,cy-8,'#8b7657',24,1)}
  return
 }
 if(id==='ev:poppy:small:coaster'){
  for(let i=0;i<4;i++){const x=cx-73+i*19;p(x,cy+8,['#a8b8a0','#c7b6a0','#a4b4bf','#c1a2a8'][i],16,7);p(x+2,cy+9,'#e5ddbd',12,1)}
  cup(chosen?(choice===0?cx-52:cx-33):cx-52,cy-2,1);return
 }
 if(id==='ev:penelope:story:3'){
  cup(lx,cy,1);cup(rx,cy,0)
  const open=chosen,width=open?43:21,x=cx-14
  p(x,foot-5,'#a5b5aa',width,12);for(let yy=foot-3;yy<foot+6;yy+=3)p(x+1,yy,'#d4c9ad',width-2,1)
  if(open){p(x+23,foot-1,'#cb9a9e',5,5);p(x+22,foot+1,'#cb9a9e',7,2);p(x+36,foot,'#8a9e92',1,7)}
  return
 }
 if(id==='ev:apothecary:story:4'){
  const placed=chosen,ax=placed?cx-95:cx+10,ay=placed?f-19:foot-16
  p(ax,ay,'#a58259',11,9);p(ax-1,ay-2,'#c5a979',13,3);p(ax+5,ay-15,'#728a59',1,13);p(ax+1,ay-16,'#90a971',9,4);p(ax+2,ay-12,'#90a971',6,3)
  if(chosen&&choice===2){cup(lx,cy,1,true);cup(rx,cy,0,true)}return
 }
 if(id==='ev:poppy:small:regularNotes'){
  paper(cx-5,foot-21,0);for(let i=0;i<2;i++){p(cx-3+i*8,foot-18,'#8da89b',5,4);p(cx+2+i*8,foot-17,'#8da89b',2,2)}
  if(chosen&&choice===1)leaf(cx+7,foot-12);p(cx+15,foot-18,'#79583e',1,8);return
 }
 if(id==='ev:poppy:teaName'||id==='ev:poppy:small:newTea'){
  cup(lx,cy,1,id.endsWith('newTea')&&(!chosen||choice===0));cup(rx,cy,0)
  kettle(cx-6,foot-21);leaf(cx+40,foot-17)
  if(id.endsWith('teaName')){for(let i=0;i<3;i++)p(cx+43+i*3,foot-21,'#d2a3ac',2,2);p(cx+46,foot-16,'#bca071',7,7)}
  else{p(cx+42,foot-21,'#c2a078',7,2);p(cx+47,foot-21,'#795b44',2,8)}
  p(cx+65,f-37,'#82694d',29,26);p(cx+67,f-35,'#e0d4b0',25,22)
  if(chosen)for(let i=0;i<(id.endsWith('teaName')?5:3);i++)p(cx+70+i*3,f-22,'#8b7657',2,2)
  return
 }
 if(id==='ev:poppy:order'){
  if(chosen){cup(lx,cy,choice===0?2:1,true);if(choice===0){for(let i=0;i<3;i++)p(cx+39+i*3,cy,'#d2a3ac',2,2)}else{leaf(cx+40,cy);p(cx+35,cy+3,'#bca071',7,7)}}
  else{cup(lx,cy,0);cup(rx,cy,1)}return
 }
 if(id==='ev:poppy:short:spouseHabit'){
  cup(lx,cy,0);cup(rx,cy,1);return // 두 선택 모두 미래의 무늬 계획이다. 지금 칠하거나 집으로 옮기지 않는다.
 }
 if(id==='ev:poppy:home:1'||id==='ev:poppy:home:2'){cup(lx,cy,0);cup(rx,cy,1);kettle(cx-1,foot-26);return}
 if(id==='ev:romance:merchant:savedSeat'){
  paper(chosen&&choice===2?px+20:cx-2,chosen&&choice===2?foot-19:foot-19,2)
  if(chosen&&choice===0){cup(lx,cy,0);cup(rx,cy,0)}return
 }
 if(id==='ev:wendell:love:1'){
  cup(lx,cy,0);cup(rx,cy,1)
  if(chosen&&choice===0){snack(lx+14,cy);snack(cx+40,cy)}
  else{p(cx-5,cy+3,'#c19a63',22,5);p(cx-4,cy+1,'#e4b467',10,4);p(cx+6,cy+1,'#e4b467',10,4);if(chosen&&choice===1)p(cx-3,cy+1,'#c19a63',3,3)}return
 }
 if(id==='ev:wendell:love:2'){
  cup(lx,cy,0);cup(chosen&&choice===1?rx:nx-11,chosen&&choice===1?cy:foot-24,1);return
 }
 if(id==='ev:wendell:dateTea'){
  cup(lx,cy,0);cup(rx,cy,1);snack(lx+13,cy);if(!(chosen&&choice===0))snack(cx+40,cy)
  if(beat>=2&&!chosen)snack(cx-67,cy)
  return
 }
 if(id==='ev:baker:story:4'||id==='ev:baker:small:wendellAfternoon'){
  cup(lx,cy,0,chosen&&choice===1);cup(rx,cy,1)
  if(id==='ev:baker:story:4'){snack(cx+40,cy);if(beat>=2)snack(lx+13,cy)}return
 }
 const sip=id==='dateTea'&&beat>=1||id==='ev:basil:story:3'&&chosen&&choice===0
 cup(sip?px+22:lx,sip?foot-23:cy,id==='ev:poppy:story:3'?1:0,id==='dateTea'&&beat===0)
 cup(rx,cy,1,id==='ev:basil:story:3'&&(!chosen||choice!==1))
 if(id==='ev:basil:story:3')leaf(cx-3,cy+2)
 if(id==='ev:penelope:hesitate2')paper(cx+42,cy+1,3)
 if(id==='ev:poppy:story:3'){leaf(cx+43,cy+1);p(cx+46,cy+3,'#bca071',6,7);p(cx-43,cy-9,'#aa8b63',22,10);p(cx-41,cy-7,'#d8c29c',18,6)}
}

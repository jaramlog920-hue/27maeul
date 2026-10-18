import {newbornArt} from './newborn-art'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {ProposalArtContext} from './dexter-proposal-art'
import {person} from './milestone-moments-art'
import {drawFamilyRoomBackground} from './family-room-background'
import {ICONS,ICON_PALETTE,spriteRows,writerPalette,PALETTE} from './sprites'

export const HOME_ROOM_ACTIVITY_IDS=['fam:with:juniper','fam:with:cosmo','fam:with:rudy','fam:with:marigold','fam:with:wendell','fam:with:penelope','fam:with:poppy','fam:with:postman','fam:with:dexter','fam:with:basil','fam:with:merchant','fam:with:presser','fam:with:tilly'] as const
export const HOME_ROOM_KID_IDS=['fam:make','fam:burnt','fam:story','fam:deskNap','fam:play','fam:cook','childHelps'] as const
export const HOME_ROOM_MEAL_IDS=['fam:supperFirst','fam:supperAll','fam:bdaySpouse','fam:bdayChild','fam:supper','fam:meal'] as const
export const HOME_ROOM_IDS=[...HOME_ROOM_ACTIVITY_IDS,...HOME_ROOM_KID_IDS,...HOME_ROOM_MEAL_IDS,'fam:bdayChildFar','growth:decorate','growth:decorate:full'] as const
export const isHomeRoom=(id:string)=>(HOME_ROOM_IDS as readonly string[]).includes(id)
export const isHomeRoomKid=(id:string)=>(HOME_ROOM_KID_IDS as readonly string[]).includes(id)
export const isHomeRoomActivity=(id:string)=>(HOME_ROOM_ACTIVITY_IDS as readonly string[]).includes(id)
type Kid=FinalePerson&{baby?:boolean}

/** 같은 가족 방에서 실제 가족과 대사별 물건 상태만 바꾼다. 게임 진행은 건드리지 않는다. */
export function drawHomeFamily(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:Kid,others:Kid[],beat:number,choice=0,context?:ProposalArtContext){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 let cx=Math.round(w/2)
 const foot=Math.round(h>w?h*.66:Math.min(h*.57,h-84)),last=beat>=1
 const night=id==='fam:story'||!!context&&(context.minute>=1260||context.minute<300)
 g.imageSmoothingEnabled=false;drawFamilyRoomBackground(p,w,h,foot,night)
 if(['fam:with:juniper','fam:with:dexter','fam:with:basil'].includes(id))cx-=60
 const stamp=(rows:readonly string[],pal:Record<string,string>,x:number,y:number,scale=1)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*scale,y+yy*scale,pal[c],scale,scale)}))
 const icon=(item:string,x:number,y:number)=>{const rows=ICONS[item];if(rows)stamp(rows,ICON_PALETTE,x,y)}
 const child=(kid:Kid,x:number,facing:'left'|'right'|'down'='left',seated=true)=>{
  if(kid.baby){const newborn=newbornArt(kid.avatar);stamp(newborn.rows,newborn.palette,x,foot-14,2)}
  else person(p,x,foot,kid.avatar,facing,kid.who,seated,false,t,1,kid.short)
 }
 const table=(x=cx-42,y=foot-4,width=84)=>{p(x,y,'#a38158',width,5);p(x+2,y,'#d8bc8e',width-4,2);p(x+6,y+5,'#8e6e4b',3,14);p(x+width-9,y+5,'#8e6e4b',3,14)}
 const sheet=(x:number,y:number,marked=false)=>{p(x,y,'#e7ddbf',22,11);p(x+2,y+3,'#c2b493',17,1);if(marked){p(x+4,y+5,'#8ba6a1',11,1);p(x+8,y+6,'#8ba6a1',1,3);p(x+14,y+7,'#b59573',4,1)}}
 const pot=(x:number,y:number,tag=false)=>{p(x,y,'#b38662',10,9);p(x-1,y-2,'#c6a77c',12,3);p(x+4,y-13,'#89956b',1,11);p(x,y-12,'#a1ad7b',8,3);if(tag)p(x+6,y+2,'#efe2bd',3,3)}
 const plate=(x:number,y:number,filled=true,honey=false)=>{p(x,y,'#dcd7b3',13,3);if(filled){p(x+2,y-4,honey?'#c99650':'#c6a06a',9,4);p(x+3,y-4,'#e1bf85',7,1)}}
 const mark=(x:number,y:number)=>{p(x,y,'#7a9b8d',10,1);p(x+3,y-2,'#7a9b8d',1,3)}

 if(id==='growth:decorate'||id==='growth:decorate:full'){
  person(p,cx-26,foot,avatar,'right')
  // 원래 가방에 들어온 의자를 보여 주되 장식 해금을 새 보상으로 바꾸지 않는다.
  p(cx+14,foot-26,'#ad8d62',17,3);p(cx+14,foot-23,'#ad8d62',3,17);p(cx+28,foot-23,'#ad8d62',3,17)
  p(cx+13,foot-8,'#c7a67b',19,3);p(cx+15,foot-5,'#967452',3,9);p(cx+27,foot-5,'#967452',3,9)
  if(id.endsWith(':full')){p(cx+43,foot-3,'#c7a67b',25,4);p(cx+45,foot+1,'#967452',3,8);p(cx+62,foot+1,'#967452',3,8)}
  return
 }
 if(id==='fam:bdayChildFar'){
  person(p,cx-27,foot,avatar,'right','writer',true);table(cx-39,foot-4,65);sheet(cx-16,foot-14,true)
  p(cx-19,foot-14,'#79583e',1,9);p(cx+9,foot-8,'#a4845b',7,4)
  if(last){p(cx-14,foot-14,'#cdb891',19,1);p(cx-5,foot-11,'#b59573',6,1)}
  // 멀리 사는 아이를 이 방의 등장 인물로 넣지 않는다.
  return
 }
 if((HOME_ROOM_MEAL_IDS as readonly string[]).includes(id)){
  const kid=others[0]
  person(p,cx-38,foot,avatar,'right','writer',true);person(p,cx+(id==='fam:bdayChild'&&last?-5:13),foot,npc.avatar,'left',npc.who,true)
  if(kid&&(id==='fam:supperAll'||id==='fam:meal'||id==='fam:bdayChild'&&!last))child(kid,cx-8,'down')
  if(id==='fam:bdayChild'&&last&&kid&&!kid.baby){
   // 실제 아이 도트 높이에 맞춘 문설주 표시. 키나 나이를 바꾸지 않는다.
   p(cx+42,foot-44,'#967452',3,48);child(kid,cx+20,'right',false)
   const rows=spriteRows(kid.who,'right',{frame:0,blink:false,avatar:kid.avatar?withLookDefaults(kid.avatar):undefined,short:kid.short})
   p(cx+39,foot-rows.length*2,'#d8bc8e',8,1)
  }
  table();const birthday=id==='fam:bdayChild'||id==='fam:bdaySpouse'
  for(const x of [cx-30,cx+17])plate(x,foot-8,!last||birthday,birthday)
  if(kid&&(id==='fam:supperAll'||id==='fam:meal'||id==='fam:bdayChild'))plate(cx-5,foot-7,!last||birthday,birthday)
  if(!birthday){p(cx-12,foot-12,'#a78d66',20,7);p(cx-10,foot-13,'#ded4b1',16,2);if(!last)p(cx-8,foot-12,'#b7bd8d',12,2)}
  if(id==='fam:supperAll'){const y=foot-9;for(const x of [cx-13,cx+9,cx+32]){p(x,y,'#a99371',1,6);p(x-1,y,'#dcd7b3',3,2)}}
  return
 }
 if(isHomeRoomActivity(id)){
  const kid=others[0];person(p,cx-35,foot,npc.avatar,'right',npc.who,true);if(kid)child(kid,cx+9,last||['fam:with:juniper','fam:with:dexter','fam:with:basil'].includes(id)?'left':'down')
  if(id!=='fam:with:cosmo')table(cx-43,foot-3,84);const x=cx-13,y=id==='fam:with:cosmo'?foot-2:foot-13,n=Math.max(0,choice)%3
  switch(id.split(':')[2]){
   case 'juniper':{
    pot(cx-40,foot-47);sheet(x-4,y,true)
    if(last){p(x+8,y+5,'#89956b',1,4);p(x+5,y+3,'#d2a3ac',7,3);p(x+7,y+2,'#ecd1bc',3,4);p(x+1,y+8,'#b59573',2,1)}break
   }
   case 'cosmo':{
    p(x-3,y+4,'#a4845b',25,5);p(x,y+2,'#c2a577',19,2);p(x+2,y+5,'#dbc49a',15,1)
    if(last)mark(x+1,y+9);else{p(cx-28,y-4,'#79583e',8,2);p(cx-20,y-4,'#9a9e8c',5,1)}break
   }
   case 'merchant':{
    for(let i=0;i<3;i++){sheet(x-20+i*20,y,false);p(x-16+i*20,y+5,'#a4845b',7,3);p(x-14+i*20,y+2,'#a4845b',3,3)}
    if(last){sheet(cx+22,y,true);p(cx+27,y+4,'#a4845b',5+n,4)}break
   }
   case 'presser':{
    for(let i=0;i<3;i++){sheet(x-20+i*20,y);const bx=x-14+i*20;p(bx,y+3,'#8ba6a1',4+i,6);p(bx+1,y+1,'#8ba6a1',2,3);if(last&&i===n)p(bx+1,y+4,'#c6a06a',2+i,4)}break
   }
   case 'tilly':{
    for(let i=0;i<3;i++){p(x-14+i*14,y+3,'#8b958c',8,6);p(x-12+i*14,y+2,'#c8ccb1',4,2)}
    if(last){sheet(cx+23,y,true);p(cx+28,y+5,'#8b958c',5+n,3)}break
   }
   case 'rudy':{
    for(let i=0;i<3;i++){p(x-9+i*13,y+3,'#c2a577',9,5);p(x-8+i*13,y+2,'#a4845b',7,1)}
    sheet(x-10+n*13,y+9,last);break
   }
   case 'marigold':{
    p(x-4,y+3,'#a4845b',24,10);p(x-2,y+4,'#d1bb8c',20,7);p(x+2,y-3,'#a4845b',12,2);p(x,y-1,'#a4845b',2,5);p(x+14,y-1,'#a4845b',2,5)
    if(last)p(x+1,y-2,['#9eaf99','#b99ea2','#9eafba'][n],4,6)
    sheet(cx+26,y+2,last);break
   }
   case 'wendell':{
    const d=last?[-1,3,6][n]:0;p(x-1-d,y+4,'#dfcf9e',17+d*2,5);p(x+2-d,y+3,'#efe0b4',11+d*2,2)
    if(last)p(x+4,y+5,'#c0aa79',5,1);break
   }
   case 'penelope':{
    for(let i=0;i<3;i++){p(x-9+i*12,y+3,['#b8c1a0','#c6b39b','#98aeba'][i],10,6);p(x-8+i*12,y+4,'#e5ddbd',8,1)}
    if(last){const sx=x-9+n*12;p(sx+3,y+6,'#d2b2b7',4,1);p(sx+5,y+7,'#d2b2b7',3,1)}break
   }
   case 'poppy':{
    for(let i=0;i<3;i++){const sx=x-8+i*11;p(sx,y+4,'#dcd7b3',7,5);p(sx+7,y+5,'#dcd7b3',2,3);if(last&&i===n)p(sx,y+1,'#9eaf99',7,2)}
    // 뜨거운 차는 어른 쪽 끝에 고정한다.
    p(cx-35,y+2,'#8da89b',10,9);plate(cx+26,y+8,true);break
   }
   case 'postman':sheet(x,y,last);if(last){p(x+6,y+5,'#8ba6a1',10,1);p(x+8,y+4,'#8ba6a1',1,5);p(x+14,y+6,'#b59573',4,2)}break
   case 'dexter':{
    sheet(x,y,last);if(last){p(x+4,y+4,'#c3d0c4',13,3);p(x+7,y+2,'#c3d0c4',7,2);p(x+2,y+9,'#b59573',12,1)}
    p(Math.round(w/2)-103,foot-59,'#e3dfba',20,3);p(Math.round(w/2)-98,foot-62,'#e3dfba',10,3);break
   }
   case 'basil':for(let i=0;i<3;i++)pot(cx-46+i*14,foot-47,last&&i===n);if(last){p(cx+27,foot+2,'#b48f8b',19,6);p(cx+28,foot+3,'#d3b3a0',17,2)}break
  }
  return
 }
 // 아이와 기록자의 방 안 활동.
 person(p,cx-31,foot,avatar,'right','writer',true)
 if(id==='fam:story'||id==='fam:deskNap'){
  const sleeping=last||id==='fam:story',x=cx+3,y=foot-14
  p(cx-1,foot-5,'#b48f8b',49,10);p(cx+1,foot-4,'#d3b3a0',45,7)
  if(sleeping&&!npc.baby){
   const rows=spriteRows(npc.who,'down',{frame:0,blink:last,avatar:npc.avatar?withLookDefaults(npc.avatar):undefined,short:npc.short}),pal=npc.who==='writer'?writerPalette('spring',npc.avatar?withLookDefaults(npc.avatar):undefined):PALETTE
   rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+rows.length*2-yy*2,y+xx*2,pal[c],2,2)}))
   p(x-1,y+4,'#a8bdb3',15,11);p(x,y+5,'#dce4c8',13,2)
  }else child(npc,cx+6,'left')
  p(cx-15,foot-5,'#8ba6a1',16,5);p(cx-14,foot-4,'#e5ddbd',14,2)
  return
 }
 if(id!=='childHelps')child(npc,cx+6,last?'left':'down')
 if(id==='childHelps'){
  p(cx+40,foot-55,'#967452',36,58);p(cx+43,foot-52,'#705e4b',30,52);p(cx+46,foot-50,'#b5c7a0',24,23)
  const dx=cx+(last?37:6),rows=spriteRows(npc.who,last?'right':'down',{frame:0,blink:false,pose:last?'stand':'wave',avatar:npc.avatar?withLookDefaults(npc.avatar):undefined,short:npc.short}),pal=npc.who==='writer'?writerPalette('spring',npc.avatar?withLookDefaults(npc.avatar):undefined):PALETTE
  stamp(rows,pal,dx,foot-rows.length*2,2);p(dx+3,foot-12,'#b19360',8,9);return
 }
 table();const x=cx-13,y=foot-13
 if(id==='fam:make'){
  if(last)icon('woodToy',cx+12,foot-11)
  else{p(x-8,y+6,'#c2a577',16,5);p(x+15,y+4,'#d5ccb0',17,6);p(x+17,y+5,'#b59573',1,5);p(x+7,y+3,'#79583e',6,2)}
 }else if(id==='fam:burnt'){
  if(last)p(cx+13,foot-10,'#5b4d3c',11,5);else{p(x+2,y+4,'#5b4d3c',17,6);p(x+5,y+2,'#706049',11,3)}
 }else if(id==='fam:play'){
  if(choice===1){p(x+5,y+1,'#b99ea2',10,10);p(x+7,y+3,'#e5ddbd',2,6)}
  else for(let i=0;i<4;i++){p(x-2+i%2*10,y+2+Math.floor(i/2)*6,['#b8c1a0','#c6b39b','#98aeba','#b99ea2'][i],8,5);if(last)p(x+i%2*10,y+4+Math.floor(i/2)*6,'#e5ddbd',3,1)}
 }else if(id==='fam:cook'){
  // 뜨거운 냄비는 어른 쪽, 아이 쪽에는 고른 접시만 둔다.
  p(cx-35,y-3,'#6e7a72',15,12);p(cx-38,y,'#6e7a72',3,3);p(cx-20,y,'#6e7a72',3,3);p(cx-33,y-5,'#a8b7a0',11,2)
  for(let i=0;i<3;i++)plate(x+3+i*13,y+8,last&&i===choice%3)
 }
}

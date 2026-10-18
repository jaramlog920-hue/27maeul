import {drawSmithWork,SMITH_WORK_IDS,isSmithWork,smithWorkPeople} from './smith-work-art'
import {drawSmithHomePlan,SMITH_HOME_PLAN_IDS,isSmithHomePlan} from './smith-home-plans-art'
import {drawSmithFamily,SMITH_FAMILY_IDS,isSmithFamily,smithFamilyPeople} from './smith-family-art'
import {withLookDefaults} from '../engine/avatar'
import {ICONS,ICON_PALETTE,spriteRows,writerPalette} from './sprites'
import {drawForgeYardBackground} from './forge-yard-background'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawForgeRoomBackground} from './forge-room-background'
import {drawSmithHandle,SMITH_HANDLE_IDS} from './smith-handle-art'
export const SMITH_BIRD_IDS=['saw:tilly:bird','ev:tilly:birdSeen','ev:tilly:birdNew','ev:tilly:cough'] as const
export const SMITH_EVENT_IDS=[...SMITH_WORK_IDS,...SMITH_HOME_PLAN_IDS,...SMITH_FAMILY_IDS,...SMITH_BIRD_IDS,...SMITH_HANDLE_IDS,'ev:smith:story:1','ev:smith:story:2','ev:smith:story:3','ev:smith:small:carpenterHandle','ev:smith:small:newHandle'] as const
export const isSmithEvent=(id:string)=>(SMITH_EVENT_IDS as readonly string[]).includes(id)
export function smithEventPeople(id:string){if(isSmithWork(id))return smithWorkPeople(id);if(isSmithHomePlan(id))return ['tilly'];if(isSmithFamily(id))return smithFamilyPeople(id);if((SMITH_BIRD_IDS as readonly string[]).includes(id))return ['tilly'];return ['smith',...(id==='ev:smith:story:1'?['tilly']:id==='ev:smith:story:2'?['carpenter','tilly']:id==='ev:smith:small:carpenterHandle'?['carpenter']:[])]}
/** 식은 쇠·도안·목재는 허리 아래 작업판에 놓는다. 사람의 손이나 팔을 늘리지 않는다. */
export function drawSmithEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 if(id==='saw:forge:handle'){drawSmithHandle(g,w,h,t,avatar,npc,beat);return}
 if(isSmithWork(id)){drawSmithWork(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isSmithHomePlan(id)){drawSmithHomePlan(g,id,w,h,t,avatar,npc,beat,choice);return}
 if(isSmithFamily(id)){drawSmithFamily(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*.66:h<=170?h*.69:h*.6),f=foot-28,chosen=choice!=null
 if((SMITH_BIRD_IDS as readonly string[]).includes(id)){
  g.imageSmoothingEnabled=false
  const night=id==='saw:tilly:bird'||id==='ev:tilly:cough',crouch=id==='saw:tilly:bird',ground=foot+8
  if(id==='ev:tilly:cough'){
   drawForgeRoomBackground((x,y,c,a,b)=>p(x,y,c==='#bd9560'?'#625847':c,a,b),w,h,f,true)
   person(p,cx-64,ground,avatar,'right');person(p,cx-94,ground,npc.avatar,'left',npc.who)
   if(chosen&&choice===2){p(cx-108,f-22,'#bd9560',13,4);p(cx-104,f-25,'#e4bb78',3,6);p(cx-99,f-27,'#d5a060',2,8)}
   return
  }
  drawForgeYardBackground(p,w,h,foot,night)
  const nx=cx+25,px=cx-27,leave=crouch&&beat>=3
  // 쪼그림과 손은 원래 인물 도트. 지켜보는 기록자는 마지막 대사에서 돌아선다.
  person(p,leave?cx-70:px,ground,avatar,leave?'left':'right')
  person(p,nx,ground,npc.avatar,'left',npc.who,crouch)
  const av=npc.avatar?withLookDefaults(npc.avatar):undefined,rows=spriteRows(npc.who,'left',{frame:0,blink:false,avatar:av,pose:crouch?'crouch':'stand'})
  const handRow=rows.findIndex((r,i)=>i>=9&&r.includes('s')),row=handRow>=0?handRow:Math.max(0,rows.length-5),col=handRow>=0?rows[row].indexOf('s'):0
  const hx=nx+col*2,hy=ground-rows.length*2+row*2
  const open=crouch||beat>=2,birdX=hx-8,birdY=hy-5
  // 손을 모으는 모습은 기존 피부색 손 두 점만 겹친다. 팔은 늘리지 않는다.
  const skin=writerPalette('spring',av).s;p(hx-2,hy,skin,2,2)
  const release=chosen&&(id==='ev:tilly:birdNew'?choice===0||beat>=5:beat>=4)
  const roof=release&&choice===0,air=release&&!roof
  const bx=roof?cx-72:air?cx-10:birdX,by=roof?foot-103:air?Math.max(1,foot-116):birdY
  if(open||release){
   ICONS.bird.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&ICON_PALETTE[c])p(bx+xx,by+yy,ICON_PALETTE[c])}))
   if(crouch){p(birdX+3,birdY+4,'#9aa399',4,1);p(birdX+5,birdY+3,'#707a74',1,3)}
   else if(id==='ev:tilly:birdNew'&&!release)p(birdX+3,birdY+4,'#bdb59b',3,1)
   if(air){p(bx+3,by+2,'#8f744f',3,1);p(bx+5,by,'#8f744f',2,3)}
  }
  return
 }
 g.imageSmoothingEnabled=false;drawForgeRoomBackground(p,w,h,f,id==='ev:smith:story:3')
 const actor=(who:FinalePerson|null,x:number,face:'left'|'right'|'down'='left')=>person(p,x,foot+14,who?who.avatar:avatar,face,who?who.who:'writer',false,false,t)
 actor(null,cx-100,'right');actor(npc,cx-75,'right');others.forEach((who,i)=>actor(who,cx+75+i*26))
 const y=foot+2
 p(cx-49,y,'#b69871',115,5);p(cx-45,y+5,'#866548',3,15);p(cx+59,y+5,'#866548',3,15)
 const ring=(x:number,yy:number,leaves=false,hot=false)=>{
  const c=hot?'#d29c68':'#79817a';p(x+3,yy,c,10,2);p(x,yy+2,c,3,8);p(x+13,yy+2,c,3,8);p(x+3,yy+10,c,10,2)
  if(leaves){p(x-3,yy+4,'#96a08a',5,3);p(x+15,yy+3,'#96a08a',5,3);p(x+8,yy-3,'#96a08a',5,4)}
 }
 const board=(x:number,yy:number,parallel=false)=>{
  p(x,yy,'#9f8059',25,22);p(x+2,yy+2,'#e2d0ab',21,18)
  p(x+8,yy+5,'#7b7864',9,2);p(x+6,yy+7,'#7b7864',2,8);p(x+17,yy+7,'#7b7864',2,8);p(x+8,yy+15,'#7b7864',9,2)
  p(x+3,yy+9,'#89946b',4,2);p(x+19,yy+8,'#89946b',4,2)
  p(x+11,yy+3,'#6f6654',parallel?1:3,16);if(parallel)p(x+15,yy+3,'#89946b',1,16)
 }
 if(id==='ev:smith:story:1'){
  // 마지막 원문에 맞춰 도안 판만 틸리 쪽으로 한 칸 민다.
  board(cx+(beat>=3?10:8),y-22,chosen&&choice===1);return
 }
 if(id==='ev:smith:story:2'){
  p(cx-43,y-7,'#aa865a',67,5);p(cx-36,y-7,'#795f44',1,5);p(cx-14,y-7,'#795f44',1,5)
  ring(cx+12,y-14,false,beat>=1&&!chosen)
  // 뜨거운 부분은 대장장이 쪽, 식은 받침은 기록자 쪽에 둔다.
  p(cx-50,y-2,'#84928b',14,3)
  if(chosen&&choice===0){p(cx-86,y+3,'#84928b',47,1)}
  if(chosen&&choice!==0){p(cx+7,y-6,'#676b64',1,16);p(cx+3,y+9,'#676b64',9,5);if(choice===1){p(cx+18,y+8,'#8a8e80',7,6);p(cx+28,y+7,'#9da292',6,7)}}
  return
 }
 if(id==='ev:smith:story:3'){
  if(beat>=2){board(cx+35,f-51);p(cx+31,f-47,'#795f44',2,6);ring(cx+14,f-44,true)}
  else {ring(cx+7,y-14);ring(cx+32,y-14,true)}
  return
 }
 if(id==='ev:smith:small:carpenterHandle'){
  p(cx-33,y-4,'#9b744e',35,5);p(cx-24,y-9,'#b99463',17,5);p(cx-22,y-12,'#b99463',3,4);p(cx-11,y-12,'#b99463',3,4)
  p(cx+(chosen?-16:5),y-8,'#818c86',3,9);p(cx+(chosen?-16:5),y-8,'#a5afa0',6,2)
  return
 }
 // 세 목재는 미가공 상태를 유지한다. 선택만으로 자루가 완성되지 않는다.
 const selected=chosen?(choice===0?0:choice===1?1:2):-1
 for(let i=0;i<3;i++){const x=selected===i?cx-60:cx-48+i*30,yy=selected===i?y+2:y-6;p(x,yy,['#c3a77c','#aa865e','#d0b48b'][i],23,4+i);p(x+3,yy+1,'#86694a',16,1);if(i===0)p(x+3,yy+3,'#86694a',16,1)}
 p(cx+45,y-13,'#727d77',2,14);p(cx+52,y-13,'#727d77',2,14);p(cx+45,y-13,'#727d77',9,2);p(cx+44,y-3,'#a78358',3,8);p(cx+51,y-3,'#a78358',3,8);p(cx+44,y-1,'#574a3d',3,1)
}

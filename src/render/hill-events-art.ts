import {drawHillRemainder,HILL_REMAINDER_IDS} from './hill-remainder-art'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawPastureGround} from './pasture-ground'
import {drawFamilyRoomBackground} from './family-room-background'
import {spriteRows,writerPalette,PALETTE,SHEEP,SMALL_PALETTE} from './sprites'
import {newbornArt} from './newborn-art'
export const HILL_EVENT_IDS=[...HILL_REMAINDER_IDS,'ev:dexter:clouds','ev:dexter:story:2','ev:dexter:story:2b','ev:dexter:small:shadowStick','ev:wendell:notebook','ev:dexter:story:1','ev:basil:tree','ev:dexter:poemFound','ev:dexter:poemNew','date:walk:2','ev:juniper:story:1','fam:picnic','saw:basil:treeFall','date:walk:0','saw:dexter:poem','ev:dexter:story:3b','ev:dexter:story:3','ev:juniper:story:4','dateWalk','ev:juniper:avoid'] as const
export const isHillEvent=(id:string)=>(HILL_EVENT_IDS as readonly string[]).includes(id)
export const isHillDate=(id:string)=>id==='dateWalk'||id.startsWith('date:walk:')
export const isHillFamilyKid=(id:string)=>id==='fam:picnic'
export type HillChild=FinalePerson&{baby?:boolean}
export function hillEventPeople(id:string):string[]{
 if(id==='saw:tilly:flower')return ['tilly']
 if(isHillFamilyKid(id))return ['child']
 if(isHillDate(id))return ['wendell']
 if(id==='ev:dexter:story:2'||id==='ev:dexter:story:3')return ['dexter','juniper']
 if(id==='ev:dexter:story:3b')return ['dexter','grandpa','baker']
 return [id.includes('basil')?'basil':id.includes('juniper')?'juniper':id.includes('wendell')?'wendell':'dexter']
}
/** Transpose the existing face-up native sprite onto the ground, as in starNight. */
export function drawHillSupine(p:(x:number,y:number,c:string,w?:number,h?:number)=>void,a:FinalePerson,x:number,y:number){
 const av=a.avatar?withLookDefaults(a.avatar):undefined,pal=a.who==='writer'?writerPalette('spring',av):PALETTE
 const rows=spriteRows(a.who,'down',{frame:0,blink:false,avatar:av,short:a.short})
 rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+yy*2,y-17+xx*2,pal[c],2,2)}))
}
export function drawHillEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:HillChild,others:FinalePerson[],beat:number,choice?:number|null){
 if((HILL_REMAINDER_IDS as readonly string[]).includes(id)){drawHillRemainder(g,id,w,h,t,av,npc,beat);return}
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=f+8,px=cx-55,nx=cx+25,home=id==='ev:juniper:story:4',tree=id.includes('basil'),clouds=id==='ev:dexter:clouds',date=isHillDate(id),family=isHillFamilyKid(id),group=id==='ev:dexter:story:2'||id==='ev:dexter:story:3',passers=id==='ev:dexter:story:3b',poem=id.includes('poem'),evening=poem||group||passers||id==='ev:juniper:story:1'||id==='ev:juniper:avoid'||id==='ev:wendell:notebook'
 const walking=date&&!(id==='date:walk:2'&&beat>=1)&&!(id==='dateWalk'&&beat>=1)
 const sit=family||poem||group||passers||id==='ev:dexter:story:1'||id==='ev:dexter:story:2b'||id==='ev:juniper:story:1'||id==='date:walk:2'&&beat>=1||id==='ev:dexter:small:shadowStick'&&!(choice===1&&beat>=2)
 g.imageSmoothingEnabled=false
 if(home)drawFamilyRoomBackground(p,w,h,f-12)
 else drawPastureGround((x,y,c,a,b)=>p(x,y,evening&&c==='#d7dfc8'?'#d6c4ac':c,a,b),w,h,date?f-18:f+12,tree)
 const stamp=(rows:readonly string[],pal:Record<string,string>,x:number,y:number,scale=2)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*scale,y+yy*scale,pal[c],scale,scale)}))
 const skin=(a:FinalePerson|null)=>{const v=a?a.avatar:av;return a&&a.who!=='writer'?PALETTE.s:writerPalette('spring',v?withLookDefaults(v):undefined).s}
 const hand=(x:number,y:number,a:FinalePerson|null)=>p(x,y,skin(a),2,2)
 const paper=(x:number,y:number,a=24,b=17,fold=false)=>{p(x,y,'#eee2c5',a,b);p(x+2,y+2,'#c1ab87',a-4,1);if(fold)p(x+Math.floor(a/2),y+2,'#c1ab87',1,b-3)}
 const cloud=(x:number,y:number,small=false)=>{const a=small?10:18;p(x+2,y,'#f2ecdb',a-4,2);p(x,y+2,'#f2ecdb',a,5);p(x+3,y+7,'#f2ecdb',a-6,2)}
 const flower=(x:number,y:number,white=false)=>{p(x+1,y+2,'#79966b',1,4);p(x,y,white?'#eee7cf':'#dcc278',3,3)}
 const flowers=(x:number,y:number,white=true)=>{for(let i=0;i<(white?15:12);i++)flower(x+i%5*4,y+Math.floor(i/5)*5,i>=12)}
 const bee=(x:number,y:number)=>{p(x,y,'#d7ba73',6,3);p(x+2,y,'#756a51',1,3);p(x+1,y-2,'#c2d4c8',4,2)}
 const note=(x:number,y:number,kind='cloud',fold=false)=>{paper(x,y,24,22,fold);if(fold)return;if(kind==='cloud')cloud(x+3,y+5,true);else if(kind==='flowers')flowers(x+2,y+5);else if(kind==='grass'){for(let i=0;i<4;i++)flower(x+3+i*5,y+6);for(let i=0;i<6;i++)p(x+3+i*3,y+18,'#756c53',1,1)}else if(kind==='bread'){for(let i=0;i<3;i++)p(x+3+i*6,y+6,'#c09662',5,4);p(x+3,y+16,'#9f8a68',17,1)}else if(kind!=='blank')for(let i=0;i<3;i++)p(x+3,y+6+i*4,'#9f8a68',16-i*2,1)}
 const rock=(x:number,y:number,a=29)=>{p(x+3,y,'#a09e88',a-6,2);p(x,y+2,'#898c7b',a,7);p(x+3,y+3,'#b9b69e',a-6,2)}
 const bench=(x:number,y:number)=>{p(x,y-20,'#a58b64',65,5);p(x,y-10,'#ba9b6c',65,4);p(x+4,y-16,'#80694a',3,20);p(x+58,y-16,'#80694a',3,20)}
 if(!home&&!tree){cloud(cx-107,12);cloud(cx+51,21)}
 if(date||id==='ev:wendell:notebook'){
  bench(cx+64,ground+2)
  if(date&&beat>=2){for(let i=0;i<6;i++){p(cx-127+i*20,f-23,'#b5ac8e',15,10);p(cx-129+i*20,f-27,'#ac856c',19,4)}}
 }
 let playerFloor=ground,npcFloor=ground,playerX=px,npcX=nx,playerFace:'left'|'right'|'up'='right',npcFace:'left'|'right'|'up'='left'
 if(id==='date:walk:2'&&beat>=1){playerX=cx+68;npcX=cx+99}
 if(id==='dateWalk'&&beat>=2){playerX=cx+36;npcX=cx+72}
 const climbing=tree&&(id==='saw:basil:treeFall'?beat===0:choice===1?beat>=4:choice===0&&beat===3),bothClimb=climbing&&choice===1
 if(tree){
  p(cx+63,f-92,'#79664d',13,102);p(cx+65,f-90,'#947a57',4,99);p(cx+16,f-39,'#79664d',id==='saw:basil:treeFall'&&beat>=1?7:60,4);if(bothClimb)p(cx+4,f-23,'#79664d',44,4);p(cx+35,f-78,'#79664d',40,5)
  p(cx+13,f-108,'#788b67',96,22);p(cx+3,f-96,'#87996f',115,22)
  p(cx+19,f-63,'#8b9c70',20,3);p(cx+38,f-79,'#8b9c70',18,3)
  if(climbing){npcX=cx+31;npcFloor=ground-47;npcFace='up';if(bothClimb){playerX=cx+5;playerFloor=ground-31;playerFace='up'}}
  if(id==='saw:basil:treeFall'&&beat>=1){p(cx+10,f+3,'#947a57',31,4);p(cx+10,f+1,'#b29971',9,2)}
 }
 if(clouds){stamp(SHEEP,SMALL_PALETTE,cx-119,f+6,2);stamp(SHEEP,SMALL_PALETTE,cx+83,f+4,2)}
 if(family){p(cx-65,f+3,'#c6a28a',122,23);for(let i=0;i<15;i++)p(cx-63+i*8,f+3,'#dec6a1',1,23);for(let i=0;i<5;i++)flower(cx-96+i*38,f+24);p(cx-12,f+9,'#cca36c',16,6);p(cx-10,f+8,'#e1bf87',12,2)}
 // Props stay beside the native actors; tree branches and bench are drawn behind them.
 if(clouds&&choice===2)drawHillSupine(p,{avatar:av,who:'writer'},px,ground)
 else person(p,playerX,playerFloor,av,playerFace,'writer',sit,walking,t)
 if(clouds)drawHillSupine(p,npc,nx,ground)
 else if(family&&npc.baby){const a=newbornArt(npc.avatar);stamp(a.rows,a.palette,nx,ground-19)}
 else person(p,npcX,npcFloor,npc.avatar,npcFace,npc.who,(sit||id==='saw:basil:treeFall'&&beat>=1)&&!climbing,walking,t,1,npc.short)
 others.forEach((a,i)=>{if(passers&&beat!==2)return;person(p,cx+70+i*29,ground,a.avatar,'left',a.who,group&&!(id==='ev:dexter:story:3'&&beat===2)||passers)})
 const x=nx-26,y=ground-12
 if(clouds){
  if(choice===0||choice===2)cloud(cx+26,9)
  if(choice===1&&beat>=3){hand(nx+6,ground-19,npc)}
  if(choice===2){SHEEP.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&SMALL_PALETTE[c])p(nx+11+yy*2,ground+2+(7-xx)*2,SMALL_PALETTE[c],2,2)}))}
 }else if(tree){
  const mx=climbing?npcX+22:nx-12,my=climbing?npcFloor-9:ground-9
  p(mx,my,'#b49c74',9,9);p(mx+2,my-2,'#82976a',6,4);hand(climbing?npcX+20:npcX-2,npcFloor-10,npc)
  if(id==='saw:basil:treeFall'&&beat>=3)p(nx+1,ground-11,'#a6755d',2,1)
  if(bothClimb){for(let i=0;i<4;i++){p(cx-131+i*22,f-16,'#8e9a88',16,9);p(cx-133+i*22,f-20,'#9c7d6c',20,4)}}
 }else if(date){if(id==='dateWalk'&&beat===1){flower(cx+2,f+1,true);flower(cx+8,f+4);hand(nx-2,ground-10,npc)}
 }else if(family){if(beat===0){p(px+22,ground-10,'#cca36c',7,4);hand(px+20,ground-9,null);p(nx-10,ground-10,'#cca36c',7,4);hand(nx-2,ground-9,npc)}if(beat>=1){flower(nx-7,ground-10);hand(nx-2,ground-8,npc)}}
 else if(id==='ev:wendell:notebook'){
  const returned=choice===1&&beat>=4||choice===2,xx=returned?nx-26:cx-12,yy=returned?ground-15:f+6
  note(xx,yy,'bread',choice===2||returned);if(returned)hand(nx-2,ground-12,npc)
 }else if(poem){
  const saw=id==='saw:dexter:poem',newPoem=id==='ev:dexter:poemNew',reading=choice===0&&(newPoem||beat>=3),open=saw?beat===0:newPoem||reading
  if(open){for(let i=0;i<3;i++)paper(cx-19+i*4,f+9+i*2,18,9,true);rock(cx-19,f-3)}else rock(cx-19,f+5)
  if(reading){note(x,y,'poem');p(x+4,y+5,'#e1c784',2,2);hand(nx-2,y+3,npc)}
  if(saw&&beat>=1){rock(cx-19,f+5);if(beat===1){paper(x,y,18,9,true);hand(nx-2,y+3,npc)}}
 }else if(id==='ev:dexter:small:shadowStick'){
  p(cx-10,f-18,'#8e7752',2,27);const end=choice===0?cx+10:cx+21+(choice===1?Math.min(3,Math.floor(t)):0);p(cx-9,f+8,'#82906c',Math.max(2,end-cx+9),2);rock(choice===0?cx+10:cx+21,f+7,8)
 }else if(id==='ev:dexter:story:1'){
  note(x-24,f+8,'poem');note(x+4,f+8,'cloud');paper(x-10,f+29,22,10,true);rock(x-33,f+29,12)
  if(choice!=null){note(x,y,'cloud');p(x+3,y+17,'#9f8a68',18,1);hand(nx-2,y+3,npc);if(choice===2)hand(px+20,ground-10,null)}
 }else if(id==='ev:dexter:story:2b'||group||passers){
  const pair=choice===1||id==='ev:dexter:story:2b'&&beat>=3||passers
  if(group&&id.endsWith(':2')&&choice===1){note(cx-11,f+14,'cloud');note(cx+15,f+14,'flowers')}
  else if(pair&&!group){note(cx-18,f+2,'cloud');note(cx-18,f+26,beat>=3||passers?'grass':'blank');rock(cx-24,f+19,10)}
  else if(id==='ev:dexter:story:3'){note(cx-17,f+14,'cloud');if(beat<4)note(cx+9,f+14,'flowers');rock(cx-23,f+30,10);rock(cx+30,f+30,10)}
  else{note(x,y,'cloud');if(group)note(cx+43,y,'flowers');else note(px+22,y,beat>=3?'grass':'blank')}
  if(id==='ev:dexter:story:2b'){for(let i=0;i<4;i++)flower(cx-83+i*7,f+26);for(let i=0;i<7;i++)p(cx-14+i*3,f+28,'#6e7056',1,1)}
  if(group&&id.endsWith(':2')&&choice===0){bee(x+15,y+13)}
  if(group&&id.endsWith(':3')&&beat>=4){note(cx+43,y,'flowers');if(choice===1)cloud(cx+55,y+3,true)}
  if(choice===1)hand(px+20,ground-10,null)
 }else if(id==='ev:juniper:story:1'){
  for(let i=0;i<3;i++){paper(x+i*3,f+9+i*2,24,9,true);p(x+i*3,f+9+i*2,'#829c8b',2,9)}
  note(x,y,'flowers',choice===1);if(choice!==1)hand(nx-2,y+3,npc)
 }else if(home){
  p(cx+64,f-20,'#a17c56',52,3)
  if(choice==null){note(x,y,'flowers');hand(nx-2,y+3,npc)}
  else {note(cx+74,f-7,'flowers');paper(cx+103,f+9,21,8,true);p(cx+103,f+9,'#829c8b',21,2)}
 }else if(id==='ev:juniper:avoid'){
  paper(x,f+6,24,14,true);p(x,f+6,'#829c8b',24,2)
 }
}

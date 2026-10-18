import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {writerPalette,PALETTE} from './sprites'
import {drawPostmanBackground} from './postman-background'
import {drawMarketSquareBackground} from './market-square-background'
import {drawWeaverFacade} from './weaver-front-background'
import {drawPastureGround} from './pasture-ground'
export const POSTMAN_EVENT_IDS=['ev:postman:story:2','ev:postman:small:ownAppt','ev:postman:small:newStrap','ev:postman:love:2','ev:postman:story:1','ev:postman:story:4','ev:postman:short:spouseHabit','ev:postman:love:1','ev:postman:small:rainCover','ev:romance:postman:blankLine','ev:postman:home:2','ev:postman:home:1'] as const
export const isPostmanEvent=(id:string)=>(POSTMAN_EVENT_IDS as readonly string[]).includes(id)
export function postmanEventPeople(id:string):string[]{return id.endsWith('newStrap')?['postman','weaver']:['postman']}
/** Existing bag flap and length stay intact. Later repairs, walks and installations remain plans. */
export function drawPostmanEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=f+8,px=cx-55,nx=cx+25,x=nx-26,y=ground-12
 const room=id==='ev:postman:story:2',loom=id.endsWith('newStrap'),rain=id.endsWith('rainCover'),walk=id==='ev:postman:love:1',steps=id==='ev:postman:story:4'||id.endsWith('ownAppt')||id.endsWith('blankLine')||id==='ev:postman:love:2',sit=id==='ev:postman:story:4',psit=sit&&choice===0,walking=walk&&!(choice===0&&beat>=2)
 g.imageSmoothingEnabled=false
 if(loom){p(0,0,'#cfb5a0',w,h);p(0,f-43,'#9bab7e',w,h-f+43);p(0,f-15,'#c6b28a',w,h-f+15);drawWeaverFacade(p,cx,f-18)}
 else if(walk){drawPastureGround(p,w,h,f-18);for(const dx of [-126,76]){p(cx+dx,f-57,'#6f8b68',27,59);p(cx+dx-8,f-43,'#90a17b',43,29)}if(choice===0&&beat>=2){p(cx-34,f-49,'#93b6b0',64,17);for(let i=0;i<4;i++)p(cx-30+i*14,f-40,'#bfd1c4',9,1)}}
 else if(steps){drawMarketSquareBackground(p,w,h,f-18,false,true);p(cx-70,ground-2,'#b6b4a0',150,6);p(cx-78,ground+4,'#9d9f8f',166,6);p(cx-86,ground+10,'#c2beaa',182,5)}
 else drawPostmanBackground(p,w,h,f-18,{minute:room?1100:900,indoors:room,wet:rain,at:rain?{x:15,y:24}:{x:22,y:8}},t)
 const skin=(a:FinalePerson|null)=>{const v=a?a.avatar:av;return a&&a.who!=='writer'?PALETTE.s:writerPalette('spring',v?withLookDefaults(v):undefined).s}
 const hand=(xx:number,yy:number,a:FinalePerson|null)=>p(xx,yy,skin(a),2,2)
 const paper=(xx:number,yy:number,a=23,b=15)=>{p(xx,yy,'#eee0bd',a,b);p(xx+2,yy+2,'#baa382',a-4,1)}
 const letter=(xx:number,yy:number)=>{paper(xx,yy,11,7);p(xx+2,yy+2,'#b29b78',7,1);p(xx+4,yy+3,'#b29b78',3,1)}
 const notebook=(xx:number,yy:number,lines=3)=>{paper(xx,yy,24,17);p(xx,yy,'#879d90',2,17);for(let i=0;i<lines;i++)p(xx+4,yy+5+i*3,'#a18d6b',i===lines-1&&choice!=null?15:10+i%2*5,1)}
 const strap=(xx:number,yy:number,knots=3)=>{p(xx,yy,'#98714c',23,2);p(xx,yy+1,'#c09a70',23,1);for(let i=0;i<knots;i++)p(xx+2+i*5,yy-1,'#75583f',3,4)}
 const flap=(xx:number,yy:number,a=21,b=9)=>{p(xx,yy,'#b18e63',a,b);p(xx+1,yy+1,'#c4a278',a-2,2);p(xx+3,yy+5,'#927d60',6,1);p(xx+8,yy+4,'#927d60',5,1);p(xx+12,yy+3,'#927d60',4,1)}
 const bag=(xx:number,yy:number,newLock=false,open=false)=>{p(xx,yy,'#957652',24,15);p(xx+2,yy+3,'#ac8b61',20,11);if(open)flap(xx,yy-8);else flap(xx,yy);if(newLock){p(xx+9,yy+7,'#d4b98b',6,4);p(xx+10,yy+8,'#927654',4,2)}else p(xx+10,yy+7,'#81654b',4,3)}
 if(room){p(cx-29,ground+4,'#bb9b70',60,4);p(cx-26,ground+8,'#806446',3,12);p(cx+25,ground+8,'#806446',3,12)}
 person(p,px,ground,av,'right','writer',psit,walking,t);person(p,nx,ground,npc.avatar,'left',npc.who,sit,walking,t)
 others.forEach((a,i)=>person(p,cx+70+i*30,ground,a.avatar,'left',a.who))
 if(room){
  flap(cx-28,ground-15,19,11);strap(cx-6,ground-11,0);p(cx+13,ground-7,'#9d7c55',9,10);p(cx+14,ground-5,'#c5a477',7,1)
  if(beat>=2)p(cx-26,ground-6,'#d7bc8d',4,1)
  if(choice===1)p(cx-27,ground-4,'#dac29a',5,1)
  if(choice===2){p(px+22,ground-10,'#b18e63',5,2);hand(px+20,ground-10,null)}
 }else if(loom){
  bag(x,ground-7);strap(cx+43,ground-10,0);p(cx+43,ground-11,'#b18b61',14,4)
  for(let i=0;i<3;i++)p(cx+70+i*8,ground+8,['#856446','#ae8b63','#c4a67b'][i],6,6)
  if(choice===0){p(cx+43,ground-11,'#856446',14,4);hand(cx+68,ground-10,others[0])}
  if(choice===1){p(px+22,ground-12,'#ad8e66',9,11);p(px+21,ground-9,'#d2bc90',12,1);p(px+23,ground-6,'#d2bc90',8,1);hand(px+20,ground-10,null)}
 }else if(id==='ev:postman:story:1'||id==='ev:postman:love:2'){
  bag(x,ground-6);strap(x-5,ground-10,id.endsWith('love:2')&&choice===0?4:3)
  if(choice===1&&id.endsWith('story:1')||choice===0&&id.endsWith('love:2')){p(px+22,ground-10,'#d4bf96',33,1);hand(px+20,ground-10,null);hand(nx-2,ground-10,npc)}
  if(id.endsWith('love:2')&&choice===1)strap(cx-14,ground+15,4)
 }else if(sit){
  bag(cx+49,ground-5,true,choice===2);if(choice===1){notebook(x,y,4);hand(nx-2,ground-10,npc)}if(choice===2)hand(nx+20,ground-9,npc)
 }else if(id.endsWith('ownAppt')||id.endsWith('blankLine')){
  notebook(x,y,id.endsWith('ownAppt')?(choice==null?3:4):4)
  if(id.endsWith('blankLine')){p(x+4,y+14,choice==null?'#eee0bd':'#8a987f',16,1)}
  if(choice!=null)hand(nx-2,ground-10,npc)
 }else if(walk){if(choice===1){notebook(x,y,3);p(x+4,y+14,'#9d8868',16,1);hand(nx-2,ground-10,npc)}}
 else if(rain){
  bag(x,ground-5);const folded=choice===1
  p(x-2,ground-(folded?10:13),'#a6ad8d',folded?24:28,folded?6:10);p(x,ground-11,'#c0c4a3',22,1)
  if(folded)for(let i=0;i<3;i++)p(x+2+i*7,ground-10,'#7d8b73',1,5)
  if(choice===0){p(x+24,ground-12,'#9f8058',2,12);p(x+22,ground-11,'#9f8058',4,2)}
  if(choice!=null)hand(nx-2,ground-10,npc)
 }else if(id.endsWith('spouseHabit')){
  // The house holder is already installed elsewhere. This outdoor conversation shows the chosen note.
  paper(x,y);p(x+2,y+13,'#af8d62',20,2)
  if(choice!=null){p(x+4,y+5,'#947b58',15,1);if(choice===0){p(x+8,y+8,'#bda678',8,3)}else if(choice===1){p(x+10,y+8,'#b2867d',4,3)}else{notebook(cx+49,ground+8,2)}}
 }else if(id==='ev:postman:home:1'){
  // These are two possible locations on a plan, not an installed mailbox.
  paper(x,y,24,20);p(x+4,y+5,'#a48c68',5,11);p(x+14,y+11,'#a48c68',7,5)
  if(choice!=null)p(x+(choice===0?4:14),y+(choice===0?6:10),'#859c91',5,4)
 }else if(id==='ev:postman:home:2'){
  notebook(x,y,3);p(x+4,y+14,'#8a987f',12,1);letter(cx+48,ground+8)
  if(choice!=null){paper(cx+46,ground+19,17,8);p(cx+48,ground+22,'#a18d6b',choice===0?11:7,1)}
 }
}

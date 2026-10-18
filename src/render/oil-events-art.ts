import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {writerPalette,PALETTE} from './sprites'
import {drawOilRoomBackground} from './oil-room-background'
import {drawPastureGround} from './pasture-ground'
import {lodgingBuildingRows,LODGING_PALETTE} from './lodging-art'
export const OIL_EVENT_IDS=["ev:romance:presser:askFirst","ev:romance:presser:invitation","ev:romance:presser:untimedTea","ev:romance:presser:imperfectHouse","ev:presser:love:2", "ev:presser:story:3", "ev:presser:small:lateTea", "ev:romance:presser:extraMinutes", "ev:presser:story:1", "ev:presser:story:2", "ev:presser:home:1", "ev:presser:story:4", "ev:presser:home:2", "ev:presser:short:spouseHabit", "ev:presser:small:jarLabels"] as const
export const isOilEvent=(id:string)=>(OIL_EVENT_IDS as readonly string[]).includes(id)
export function oilEventPeople(id:string){return ['presser',...(id==='ev:presser:story:2'?['carpenter']:id==='ev:presser:story:4'||id.endsWith('lateTea')?['grandpa']:[])]}
export function drawOilEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,_t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=f+8,px=cx+(id==='ev:presser:story:4'&&choice===0?12:-28),nx=cx+35,ox=cx+(id==='ev:presser:story:4'&&choice===1?12:100)
 const tea=id.endsWith('lateTea'),shade=id==='ev:presser:story:4'||id.includes('extraMinutes'),sit=tea||id.includes('extraMinutes')||id==='ev:presser:love:2'&&beat>=1&&choice!==0,psit=tea&&choice===0||shade&&choice===0||id.includes('extraMinutes')||id==='ev:presser:love:2'&&beat>=1&&choice!==0
 g.imageSmoothingEnabled=false
 if(tea){drawPastureGround(p,w,h,f-18);for(let i=0;i<4;i++){const x=cx-140+i*35,y=f-75;p(x+2,y,'#b17640',2,31);p(x+22,y,'#b17640',2,31);p(x,y,'#b17640',27,2);p(x+1,y+3,'#76ae45',24,3);p(x+7,y+7,'#8741a3',3,5)}}
 else if(shade){
  p(0,0,'#d7d9b8',w,h);p(0,f-25,'#9eaf7c',w,h-f+25);p(0,f+3,'#c6b28a',w,h-f-3)
  lodgingBuildingRows().slice(31).forEach((r,y)=>[...r].forEach((c,x)=>{const color=LODGING_PALETTE[c as keyof typeof LODGING_PALETTE];if(c!=='.'&&color)p(cx-132+x,f-95+y,color)}))
  p(cx+105,f-87,'#927553',5,90);p(cx+78,f-105,'#9cad83',58,22);p(cx+86,f-120,'#adba96',39,17);p(cx+84,f-101,'#748e69',43,9)
  for(let i=0;i<5;i++)p(cx-15+i*29,f+8+i%2*3,'#b1a57f',22,2)
 }else drawOilRoomBackground(p,w,h,f-31)
 if(['ev:romance:presser:askFirst','ev:romance:presser:invitation','ev:romance:presser:untimedTea','ev:romance:presser:imperfectHouse'].includes(id)){
  const calm=id.endsWith('untimedTea'),plan=id.endsWith('imperfectHouse'),seated=calm||plan,reply=choice!=null&&beat>=(plan?3:2)
  const chair=(x:number)=>{p(x,ground+1,'#ad8c63',21,3);p(x+2,ground+4,'#76583e',3,10);p(x+16,ground+4,'#76583e',3,10)}
  if(calm){chair(px);chair(nx)}
  if(id.endsWith('invitation'))chair(cx+80)
  if(calm){
   // The existing wall timetable has one deliberately empty rest cell.
   p(cx-28,f-89,'#806447',39,27);p(cx-26,f-87,'#eee0bd',35,23)
   for(let i=0;i<3;i++){p(cx-23,f-83+i*6,'#b59b77',29,1);if(i!==1)p(cx-21,f-81+i*6,'#8c795d',17,1)}
   p(cx-2,ground+3,'#96724e',31,15);p(cx,ground+4,'#c4a277',27,2)
   // Olive leaves visible through the existing doorway, with restrained fixed-size motion.
   for(let i=0;i<4;i++)p(cx+77+i*6,f-75+i%2*4,Math.floor(_t+i)%2?'#80986d':'#b4bd91',4,2)
  }
  if(!calm&&!plan&&id.endsWith('askFirst')){p(cx-14,ground+5,'#ae8d65',43,3);p(cx-11,ground+8,'#76583e',3,12);p(cx+23,ground+8,'#76583e',3,12)}
  person(p,px,ground,av,'right','writer',seated)
  person(p,nx,ground,npc.avatar,'left',npc.who,seated)
  if(id.endsWith('askFirst')){
   const x=cx-14,y=ground-6
   p(x,y,'#eee0bd',39,10);p(x+18,y+1,'#b19a77',1,8)
   for(let i=0;i<3;i++){p(x+2,y+2+i*3,'#947b57',13,1);if(!(reply&&choice===0)&&!(reply&&choice===1&&i===1))p(x+21,y+2+i*3,'#947b57',14,1)}
   if(reply&&choice===0)p(px+13,ground-7,'#846344',1,6)
   if(reply&&choice===1)p(x+21,y+5,'#a77d60',7,1)
  }else if(calm){
   const drink=reply&&choice===0
   const cup=(x:number,y:number)=>{p(x,y,'#748d83',7,6);p(x+1,y,'#9a7450',5,1);p(x+7,y+1,'#748d83',2,3)}
   cup(drink?px+14:cx+1,drink?ground-8:ground-3)
   cup(drink?nx-3:cx+17,drink?ground-8:ground-3)
   if(!reply)for(let i=0;i<2;i++)p(cx+3+i*16,ground-9-Math.round(Math.sin(_t*2+i)),'#e6dfc5',1,4)
  }else if(plan){
   const x=cx-7,y=ground+5
   p(x,y,'#eee0bd',40,24);p(x+3,y+3,'#ae9875',33,18);p(x+5,y+5,'#eee0bd',29,14);p(x+19,y+4,'#ae9875',1,16)
   p(x+4,y+6,'#9ba68b',2,7)
   const stones=[[10,8],[12,15],[26,8],[reply&&choice===2?8:28,reply&&choice===2?17:16]]
   for(const [sx,sy] of stones){p(x+sx,y+sy,'#8c9184',3,2);p(x+sx,y+sy,'#b6b8a8',2,1)}
   if(reply&&choice===0){p(x+3,y+14,'#ba9570',5,1);p(x+3,y+15,'#ba9570',1,5)}
   if(reply&&choice===1){p(x+9,y+5,'#8c785c',5,1);p(x+13,y+5,'#8c785c',1,3)}
  }
  // Invitation choices describe this evening; no trip or extra promised chair appears yet.
  return
 }
 const skin=(a:FinalePerson|null)=>{const v=a?a.avatar:av;return !a||a.who==='writer'?writerPalette('spring',v?withLookDefaults(v):undefined).s:PALETTE.s}
 const table=(x:number,width=42,height=0)=>{p(x,f+4-height,'#b49469',width,4);p(x+3,f+8-height,'#745638',3,12+height);p(x+width-6,f+8-height,'#745638',3,12+height)}
 const seat=(x:number,box=false)=>{p(x-2,f+6,'#a8835e',24,3);if(box)p(x-2,f+9,'#b69871',24,10);else{p(x,f+9,'#76583e',3,10);p(x+17,f+9,'#76583e',3,10)}}
 const jar=(x:number,y:number,empty=true,marks=0)=>{p(x+3,y-3,'#8d6e4c',6,3);p(x+2,y,'#b49369',8,3);p(x,y+3,'#a58259',12,12);p(x+2,y+4,'#c5a979',2,8);p(x+3,y,'#685e48',6,1);if(!empty)p(x+3,y,'#cbaa59',6,1);if(marks){p(x+3,y+6,'#eee0bd',7,5);for(let i=0;i<marks;i++)p(x+4+i*3,y+7,'#7d8857',2,2)}}
 const cup=(x:number,y:number,big=false)=>{p(x,y,'#748d83',7,6);p(x+1,y,'#9a7450',5,1);p(x+7,y+1,'#748d83',big?4:2,4);if(big)p(x+8,y+2,'#c6b28a',2,2)}
 const paper=(x:number,y:number)=>{p(x,y,'#eee0bd',25,15);for(let i=0;i<3;i++)p(x+3,y+3+i*4,'#a08964',19,1)}
 const support=(x:number,height:number)=>{p(x,f+16-height,'#ad916b',7,height);p(x+1,f+17-height,'#c6ab80',5,1)}
 const work=id.includes('story:1')||id.includes('story:2')||id.includes('story:3')
 if(!shade&&!tea)table(cx-10,work?44:42,id==='ev:presser:story:3'&&beat>=1?2:0)
 if(id==='ev:presser:story:4')seat(cx+12);else{if(psit)seat(px);if(sit)seat(nx,shade&&id.includes('extraMinutes'));if(tea)seat(ox)}
 person(p,px,ground,av,'right','writer',psit)
 person(p,nx,ground,npc.avatar,'left',npc.who,sit||id==='ev:presser:story:4'&&beat===0)
 if(others[0])person(p,ox,ground,others[0].avatar,'left',others[0].who,tea||shade&&choice===1)
 const x=nx-26,y=f-6
 if(id==='ev:presser:love:2'){
  jar(cx+72,f-4);jar(cx+91,f-4)
  if(beat>=1&&choice!==0){cup(nx-14,f);if(choice===1)cup(px+18,f)}
  // The two remaining jars stay pending when choosing tea. No production reward is invented.
 }else if(id==='ev:presser:story:3'){
  for(let i=0;i<3;i++)support(cx-7+i*13,3+i*3)
  if(beat>=1){support(cx-7,6);support(cx+25,6);p(cx+6,f+1,'#cbaa59',8,2)}
  if(choice===1){p(px+18,ground-10,skin(null),2,3);p(px+20,ground-9,skin(null),2,2)}else if(beat>=1)p(nx-2,ground-10,skin(npc),2,3)
 }else if(tea){
  cup(nx-14,f);if(choice!==1)cup(ox-14,f,true);if(choice===0)cup(px+18,f);if(choice===1){cup(px+18,f,true);p(px+18,ground-8,skin(null),2,2)}
 }else if(id.includes('extraMinutes')){
  jar(cx+73,f+8);p(cx+71,f+24,'#eee0bd',16,3)
  if(beat>=2)for(let i=0;i<3;i++)p(cx-13+i*24,f+13+i*2,'#a89e7c',29,2)
 }else if(id==='ev:presser:story:1'){
  for(let row=0;row<2;row++)for(let i=0;i<3;i++)if(!(choice===1&&row===0&&i===0))jar(cx+70+i*17,f-12+row*25,row===0)
  p(cx-6,f+4,'#c6ab80',23,2);p(cx+14,f+2,'#c6ab80',12,2)
  if(choice===1){jar(px+20,f-6);p(px+18,ground-9,skin(null),2,3)}
  if(choice===2){paper(x,y);for(let i=0;i<5;i++)p(x+3+i*4,y+6,'#7d8857',2,2)}
 }else if(id==='ev:presser:story:2'){
  if(beat>=2){support(cx+25,5);p(cx+25,f+11,'#cbaa59',7,2);jar(nx-13,f-3);p(nx-2,ground-9,skin(npc),2,2)}
  if(choice===0){p(px+18,ground-9,skin(null),2,3);p(cx-10,f+5,skin(null),2,2)}
  if(choice===1||choice===2){paper(x,y);for(let i=0;i<(choice===1?4:3);i++)p(x+3+i*4,y+6,'#7d8857',2,2)}
 }else if(id==='ev:presser:story:4'){
  // One guest chair only. The elder sits when offered; no duplicated chair or extra guest.
  if(beat===0){p(nx-2,ground-8,skin(npc),2,2);p(nx-11,f+11,'#a8835e',7,2)}
 }else if(id==='ev:presser:home:1'){
  paper(x,y);for(let i=0;i<3;i++)p(x+3+i*6,y+8,'#7d8857',2,2);p(x+2,y+2,'#b69871',5,3);p(x+17,y+10,'#b69871',5,3)
 }else if(id==='ev:presser:home:2'){
  paper(x,y);p(x+2,y+1,'#eee0bd',21,12)
 }else if(id==='ev:presser:short:spouseHabit'){
  paper(x,y);p(x+3,y+6,'#eee0bd',19,4);if(choice===0){cup(x+2,f+2);cup(x+14,f+2)}
 }else if(id.endsWith('jarLabels')){
  jar(cx+71,f-3,false,1);jar(cx+87,f-3,false,2)
  paper(x,y);p(x+4,y+7,'#7d8857',2,2);if(choice===0){p(nx-2,ground-9,skin(npc),2,3);jar(x+7,f,false,1)}
 }
}

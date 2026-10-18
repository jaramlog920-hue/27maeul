import {drawWindowPrecipitation} from './event-precipitation'
import {drawBakeryFrontBackground} from './bakery-front-background'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {writerPalette,PALETTE,spriteRows} from './sprites'
import {drawGrandpaRoomBackground} from './grandpa-room-background'
export const VINE_EVENT_IDS=["ev:grandpa:story:3", "ev:grandpa:story:1", "ev:marigold:story:2", "ev:grandpa:story:4", "ev:marigold:grandpaIll", "ev:marigold:prune", "ev:marigold:small:costSheet", "ev:grandpa:story:2", "ev:marigold:tooMuch", "ev:marigold:ledgerTalk", "ev:grandpa:small:harvestBasket", "saw:marigold:ledger", "ev:marigold:story:3", "ev:marigold:run", "ev:marigold:home:2", "ev:marigold:love:1", "ev:grandpa:small:oldTools", "ev:marigold:short:spouseHabit", "ev:marigold:home:1", "dinner:grandpa", "ev:marigold:juice", "ev:marigold:ledgerNew", "ev:marigold:rainTea", "ev:marigold:love:2"] as const
export const isVineEvent=(id:string)=>(VINE_EVENT_IDS as readonly string[]).includes(id)
export function vineEventPeople(id:string){
 if(id.startsWith('ev:grandpa:'))return ['grandpa',...(id==='ev:grandpa:story:2'||id==='ev:grandpa:story:4'?['marigold']:id==='ev:grandpa:story:3'?['carpenter']:[])]
 if(id==='dinner:grandpa')return ['grandpa']
 return ['marigold',...(['ev:marigold:story:2','ev:marigold:story:3','ev:marigold:grandpaIll','ev:marigold:prune','ev:marigold:juice','ev:marigold:rainTea'].includes(id)?['grandpa']:[])]
}
export function drawVineEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=f+8,px=cx-55,nx=cx+25
 const rain=id==='ev:marigold:rainTea'||id.endsWith('costSheet'),room=rain||id.endsWith('oldTools')||id==='dinner:grandpa',night=id==='saw:marigold:ledger',square=['ev:marigold:tooMuch','ev:marigold:love:1','ev:marigold:love:2','ev:marigold:run'].includes(id),stairs=night||id==='ev:marigold:ledgerTalk'||id==='ev:marigold:ledgerNew'||id==='ev:marigold:grandpaIll'&&choice===1,prune=id==='ev:marigold:prune',rest=id==='ev:marigold:story:3'&&choice===1&&beat>=4
 const grandpaMain=id.startsWith('ev:grandpa:')||id==='dinner:grandpa',sit=grandpaMain&&!id.endsWith('oldTools')||night||id==='ev:marigold:ledgerTalk'&&choice===1||id==='ev:marigold:tooMuch'&&choice===0&&beat>=3||id==='ev:marigold:story:3'||rain||stairs&&id==='ev:marigold:grandpaIll'
 const psit=room||id==='ev:marigold:ledgerTalk'&&choice===1||id==='ev:grandpa:story:4'&&choice===0||rest,illGone=id==='ev:marigold:grandpaIll'&&choice===1,close=id==='ev:marigold:grandpaIll'||id==='ev:marigold:juice'&&choice===0&&beat>=2||id==='ev:marigold:rainTea'&&choice===1
 const ox=cx+(close?47:85),showOther=!!others[0]&&!illGone&&(!prune||choice===0&&beat>=2),os=(id!=='ev:grandpa:story:3'&&id!=='ev:marigold:grandpaIll'&&id!=='ev:marigold:prune'&&id!=='ev:marigold:juice'),sleep=id==='ev:marigold:tooMuch'&&choice===0&&beat>=3
 g.imageSmoothingEnabled=false
 if(room)drawGrandpaRoomBackground(p,w,h,f-15)
 else if(id==='ev:marigold:run')drawBakeryFrontBackground(p,w,h,f-10,true)
 else if(square){
  // Existing market stall and stone well from Rudy's square proposal variant.
  p(0,0,'#d8dfc8',w,h);p(0,f-25,'#91a17d',w,h-f+25);p(0,f+3,'#c0ad87',w,h-f-3)
  p(cx-135,f-45,'#997e5e',66,45);p(cx-138,f-49,'#bba17c',72,5);p(cx-129,f-26,'#c6b18b',54,3);p(cx-126,f-17,'#8f795d',48,17)
  p(cx+75,f-8,'#929587',35,12);p(cx+73,f-12,'#c1c2ac',39,5);p(cx+79,f-12,'#77877e',27,3)
 }else{
  p(0,0,night?'#455269':prune&&choice===0&&beat>=2?'#c9b5ad':'#d7dfc8',w,h);p(0,f-40,night?'#667358':'#9eaf7e',w,h-f+40)
  // Existing vineyard support poles and old vines from Marigold's proposal.
  for(const x of [cx-126,cx-91,cx+81,cx+118]){
   p(x,f-61,'#a48c61',3,68);p(x-8,f-53,'#ad966e',24,2);p(x+5,f-45,'#79684b',3,52);p(x+1,f-47,'#79684b',8,2);p(x+7,f-34,'#79684b',9,2)
   if(!prune||choice!==0||beat<2)for(const [dx,dy] of [[-3,-49],[9,-43],[14,-31],[-2,-26]]){p(x+dx,f+dy,night?'#66835c':'#749564',8,4);p(x+dx+2,f+dy-2,night?'#718c65':'#89a874',4,2)}
  }
  p(0,f+3,night?'#9a9077':'#c2b18b',w,h-f-3)
  if(stairs){
   // Same village wall/roof/window/door motif; the steps are the grandfather's entrance.
   p(cx-137,f-79,'#bfad8b',95,82);p(cx-141,f-89,'#8d7058',103,11);p(cx-137,f-87,'#a47e64',95,5)
   p(cx-122,f-65,'#806547',37,30);p(cx-119,f-62,night?'#536577':'#d9b68a',31,24);p(cx-105,f-62,'#ad895f',2,24);p(cx-119,f-51,'#ad895f',31,2)
   p(cx-75,f-46,'#957450',27,49);p(cx-72,f-43,'#765a40',21,46);p(cx-58,f-23,'#d6b685',2,3)
   for(let i=0;i<3;i++)p(cx-84-i*4,f+3+i*4,'#a79c83',40+i*8,4)
  }
 }
 if(rain)drawWindowPrecipitation(p,cx-123,f-87,37,29,t,(x,y)=>!(x>=cx-106&&x<cx-104)&&!(y>=f-73&&y<f-71))
 const skin=(a:FinalePerson|null)=>{const v=a?a.avatar:av;return !a||a.who==='writer'?writerPalette('spring',v?withLookDefaults(v):undefined).s:PALETTE.s}
 const paper=(x:number,y:number,rows=3,width=24)=>{p(x,y,'#eee0bd',width,Math.max(12,rows*2+4));for(let i=0;i<rows;i++)p(x+3,y+3+i*2,'#a08964',width-7,1)}
 const seat=(x:number)=>{p(x-2,f+6,'#a8835e',24,3);p(x,f+9,'#76583e',3,10);p(x+17,f+9,'#76583e',3,10)}
 const table=()=>{p(cx-13,f+4,'#b49469',42,4);p(cx-10,f+8,'#745638',3,12);p(cx+23,f+8,'#745638',3,12)}
 const grape=(x:number,y:number)=>{p(x+2,y-2,'#749564',4,2);for(let i=0;i<5;i++)p(x+(i%2)*3,y+Math.floor(i/2)*2,'#927093',3,2)}
 const cup=(x:number,y:number,juice=false)=>{p(x,y,'#cfb996',6,6);p(x+1,y,juice?'#927093':'#9a7450',4,1);p(x+6,y+2,'#cfb996',2,3)}
 const board=(x:number,y:number,flat=false)=>{p(x,y,'#87694b',flat?30:5,flat?5:30);p(x+1,y+1,'#c6a77c',flat?28:3,flat?2:27);p(x+1,y+6,'#a58a64',flat?20:3,1)}
 const basket=(x:number,y:number,wide=false)=>{p(x,y,'#ad9168',19,10);p(x+2,y-6,'#927553',wide?6:2,8);p(x+12,y-6,'#927553',wide?6:2,8);p(x+4,y-8,'#927553',wide?12:10,wide?3:1);for(let i=0;i<3;i++)p(x+2+i*5,y+4,'#c6ab80',2,1)}
 if(room||['ev:marigold:story:2','ev:marigold:short:spouseHabit'].includes(id))table()
 if(psit)seat(px);if(sit)seat(nx);if(showOther&&os)seat(ox)
 // The two owned chairs remain behind the grandfather and granddaughter, not duplicated for visitors.
 if(id==='ev:grandpa:story:4'){board(nx-4,f-14);board(ox-4,f-14)}
 person(p,px,ground,av,'right','writer',psit)
 if(sleep){const full=npc.avatar?withLookDefaults(npc.avatar):undefined,pal=npc.who==='writer'?writerPalette('spring',full):PALETTE,rows=spriteRows(npc.who,'left',{frame:0,blink:true,avatar:full,pose:'crouch',growth:1});rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&pal[c])p(nx+x*2,ground-rows.length*2+y*2,pal[c],2,2)}))}
 else person(p,nx,ground,npc.avatar,'left',npc.who,sit,id==='ev:marigold:run'&&(beat===0||choice===1&&beat>=4)||id==='ev:marigold:ledgerNew'&&choice===0&&beat>=3,t)
 if(showOther){
  const a=others[0],stroke=id==='ev:marigold:juice'&&choice===0&&beat>=2||id==='ev:marigold:rainTea'&&choice===1&&beat>=3
  if(stroke){
   const full=a.avatar?withLookDefaults(a.avatar):undefined,pal=a.who==='writer'?writerPalette('spring',full):PALETTE,base=spriteRows(a.who,'down',{frame:0,blink:false,avatar:full,pose:os?'crouch':'stand',growth:1}),raised=spriteRows(a.who,'down',{frame:0,blink:false,avatar:full,pose:'handUp',growth:1})
   // One original short raised hand, beside the granddaughter's hair; never stretch the arm.
   base.forEach((r,yy)=>[...r].forEach((c,xx)=>{const ink=xx<2&&yy<raised.length?raised[yy][xx]:c;if(ink!=='.'&&pal[ink])p(ox+xx*2,ground-base.length*2+yy*2,pal[ink],2,2)}))
  }else person(p,ox,ground,a.avatar,'left',a.who,os)
 }
 const x=nx-26,y=f-7
 if(id.startsWith('ev:grandpa:story:')&&id!=='ev:grandpa:story:4'){
  const repair=id.endsWith(':3'),fixed=repair&&beat>=2
  board(repair&&beat>=2?nx-31:nx-8,repair&&beat>=2?f-4:f-15,repair&&beat>=2);p(nx-10,f+10,'#a58a64',25,3);p(nx-7,f+13,'#745638',3,6);p(nx+10,f+(fixed?13:12),'#745638',3,fixed?6:7)
  if(repair){p(nx-7,f+13,'#c6a77c',7,4);if(beat>=2){board(x-6,f+12,true);p(ox-2,ground-9,skin(others[0]),2,3)}if(choice===0){p(px+18,ground-10,skin(null),2,3);p(px+20,f-1,'#c6a77c',14,4)}}else p(nx-2,ground-9,skin(npc),2,3)
 }else if(id==='ev:marigold:story:2'){
  paper(x,y,5);if(beat>=3){p(x+12,y+1,'#a08964',1,14);if(choice===2)p(x+2,y+10,'#eee0bd',20,3)}
 }else if(id==='ev:grandpa:story:4'){
  if(choice===1){grape(nx-13,f-1);grape(ox-13,f-1)}
 }else if(id==='ev:marigold:grandpaIll'){
  if(!illGone){p(nx+18,ground-10,skin(npc),2,3);p(ox-2,ground-10,skin(others[0]),2,3)}else{p(nx-9,f-5,'#eee0bd',7,6);if(beat===3)p(nx-2,ground-12,'#92aaa9',1,3)}
 }else if(prune){
  const sx=choice===0?px+19:nx-8;p(sx,f-5,'#8e9c95',2,7);p(sx+3,f-5,'#8e9c95',2,7);p(sx,f+1,'#80664e',5,1);if(choice===0&&beat>=2)for(let i=0;i<8;i++)p(cx-26+i*9,f+18+i%3*2,'#79684b',7,1)
 }else if(id.endsWith('costSheet')){
  paper(x,y,4);paper(x-20,y+4,2);if(choice===1){paper(x-20,y+4,4);paper(x,y,2)}
 }else if(id==='ev:marigold:tooMuch'){
  if(!sleep){paper(x,y,5);paper(x-16,y+3,5);if(choice===1&&beat>=3){paper(px+20,y,5);paper(x,y,5)}}
 }else if(id==='ev:marigold:ledgerTalk'||night){
  const hidden=id==='ev:marigold:ledgerTalk'&&choice!==1,bagX=hidden?nx+22:x+13
  p(bagX,f-3,'#927553',8,8);p(bagX+1,f-5,'#c6ab80',6,3)
  if((night&&beat<3)||choice===1)for(let i=0;i<9;i++)p(x-8+i%5*4,f+4+Math.floor(i/5)*4,'#cbaa59',3,2)
  if(night&&beat===3)p(nx-9,f-5,'#eee0bd',7,6)
 }else if(id.endsWith('harvestBasket')){
  basket(x-12,f-3);basket(x+12,f-3,true);if(choice===0)p(nx-2,ground-9,skin(npc),2,3)
 }else if(id==='ev:marigold:story:3'){
  if(!rest){paper(x,y,5);p(x+3,y+10,'#eee0bd',17,3);if(choice===2)p(x+12,y+12,'#a08964',1,1)}else{paper(x,f+6,0);p(nx+4,ground-3,skin(npc),2,2);p(nx+10,ground-3,skin(npc),2,2)}
 }else if(id==='ev:marigold:run'){
  p(nx+23,f-5,'#ad9168',12,13);p(nx+25,f-7,'#d0ad77',8,3);grape(choice===0?px+19:nx-12,f-2)
 }else if(id==='ev:marigold:home:2'){
  paper(x,y,3);if(choice===1){paper(px+20,f-5,2)}
 }else if(id==='ev:marigold:love:1'){
  // Ten slots initially, nine written; a requested extra wish extends to eleven.
  const n=choice===1?11:10;paper(x,y,n,24);if(choice==null)p(x+3,y+3+9*2,'#eee0bd',17,1);if(choice===1)p(x+3,y+3+10*2,'#eee0bd',17,1);if(choice===0)p(x+3,y+3+9*2,'#749564',17,1)
 }else if(id.endsWith('oldTools')){
  const tx=x+4;p(tx,f-2,'#826347',10,3);p(tx+10,f-4,'#8e9c95',7,6);if(choice===1){p(px+20,f-3,'#eee0bd',15,8);p(px+18,ground-9,skin(null),2,3)}
 }else if(id==='ev:marigold:short:spouseHabit'){
  paper(x,y,0);for(let i=1;i<4;i++){p(x+i*5,y+2,'#a08964',1,10);p(x+2,y+i*3,'#a08964',19,1)}
  if(choice!=null){const c=choice===1?'#cbaa59':'#749564';p(x+4,y+6,c,4,2);if(choice===2)p(x+14,y+6,c,4,2)}
 }else if(id==='ev:marigold:home:1'){
  p(x+8,f-15,'#79684b',2,22);p(x+5,f-17,'#89a874',7,3);p(x+9,f-12,'#749564',8,3);p(x+4,f+5,'#eee0bd',12,3)
 }else if(id==='dinner:grandpa'){
  cup(nx-14,f);cup(px+19,f);p(x-3,f+1,'#b99968',10,2)
 }else if(id==='ev:marigold:juice'){
  p(x-9,f-8,'#927093',8,14);p(x-7,f-11,'#c6ab80',4,3)
  if(beat>=1){if(!(choice===0&&beat>=4))cup(nx-13,f,true);cup(choice===0&&beat>=2?ox+20:px+19,f,true)}
  if(choice===0&&beat>=4){p(nx-13,f+18,'#cfb996',6,3);p(nx-12,f+20,'#927093',8,2)}
 }else if(id==='ev:marigold:ledgerNew'){
  const folded=choice===0&&beat>=3;paper(x,folded?f+1:y,folded?0:5,folded?10:24)
 }else if(id==='ev:marigold:rainTea'){
  p(ox+1,ground-6,'#b3a4a1',14,4);p(ox+3,ground-5,'#d3bfb5',10,1)
  cup(px+19,f);cup(nx-14,f);cup(close?ox+20:ox-14,f)
 }else if(id==='ev:marigold:love:2'){
  paper(x,y,2)
 }
}

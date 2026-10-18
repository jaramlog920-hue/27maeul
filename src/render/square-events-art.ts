import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawMarketSquareBackground} from './market-square-background'
import {drawTeaRoomBackground} from './tea-room-background'
import {newbornArt} from './newborn-art'
import {spriteRows,writerPalette,PALETTE,ICONS,ICON_PALETTE} from './sprites'
import {SQUARE_REMAINDER_IDS,isSquareRemainder,squareRemainderPeople,drawSquareRemainder} from './square-remainder-art'
export const SQUARE_EVENT_IDS=[...SQUARE_REMAINDER_IDS,"ev:romance:merchant:lateReturn","ev:romance:merchant:noSale","ev:romance:postman:noParcel","ev:romance:postman:ownMessage","ev:dexter:small:cloudShapes", "ev:merchant:short:spouseHabit", "ev:merchant:small:souvenirs", "ev:beekeeper:story:3", "ev:wendell:stalls", "growth:stall:full", "ev:merchant:home:1", "ev:romance:merchant:returnLetter", "ev:marigold:story:1", "ev:romance:merchant:homeShelf", "ev:merchant:story:3", "ev:merchant:story:2", "ev:merchant:home:2", "ev:merchant:love:1", "ev:rudy:lunch", "ev:merchant:story:4", "ev:merchant:love:2", "ev:merchant:small:signOrder", "ev:tilly:market", "ev:marigold:bossy", "fam:walk", "fam:market", "fam:errand", "ev:weaver:small:scraps", "ev:cosmo:gossip", "ev:juniper:love:1", "ev:juniper:book", "ev:juniper:short:laugh", "ev:juniper:love:2"] as const
export const isSquareEvent=(id:string)=>(SQUARE_EVENT_IDS as readonly string[]).includes(id)
export const isSquareFamilyKid=(id:string)=>['fam:walk','fam:market','fam:errand'].includes(id)
export function squareEventPeople(id:string):string[]{
 if(isSquareRemainder(id))return squareRemainderPeople(id)
 if(id.startsWith('ev:romance:postman:'))return ['postman']
 if(isSquareFamilyKid(id))return id==='fam:walk'?['child']:['child','merchant']
 if(id==='growth:stall:full')return []
 if(id==='ev:dexter:small:cloudShapes')return ['dexter','cosmo']
 if(id==='ev:beekeeper:story:3')return ['beekeeper','baker']
 if(id==='ev:wendell:stalls')return ['wendell','poppy']
 if(id==='ev:merchant:story:3')return ['merchant','weaver']
 if(id==='ev:merchant:story:4')return ['merchant','poppy']
 if(id==='ev:juniper:short:laugh')return ['juniper','cosmo']
 if(id==='ev:marigold:bossy')return ['marigold','baker','postman']
 if(id==='ev:tilly:market')return ['tilly','grandpa','carpenter']
 return [id.split(':').find(s=>['merchant','marigold','rudy','weaver','cosmo','juniper'].includes(s))??'merchant']
}
export type SquareChild=FinalePerson&{baby?:boolean}
/** Each branch keeps the original objects, people and point in the story. */
export function drawSquareEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:SquareChild,others:FinalePerson[],beat:number,choice?:number|null,found='herb'){
 if(isSquareRemainder(id)){drawSquareRemainder(g,id,w,h,t,av,npc,others,beat);return}
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=f+8,px=cx-55,nx=cx+25
 const merchant=id.includes('merchant:'),tea=id==='ev:merchant:story:4',lunch=id==='ev:rudy:lunch',clouds=id==='ev:dexter:small:cloudShapes',honey=id==='ev:beekeeper:story:3',stalls=id==='ev:wendell:stalls',family=isSquareFamilyKid(id),dance=id==='ev:juniper:love:2',bookDance=id==='ev:juniper:book'&&choice===0&&beat>=3,danceStep=(dance||bookDance)&&(choice===0||choice===1)?Math.floor(t*2)%2*2:0
 const market=merchant||honey||stalls||id==='ev:tilly:market'||id==='growth:stall:full'||id==='fam:market'||id==='ev:weaver:small:scraps',evening=id.includes('marigold')||id.startsWith('ev:juniper:')||id==='ev:cosmo:gossip',rain=id.endsWith('souvenirs'),sit=tea&&choice===0||lunch,psit=tea&&choice===0||lunch||id==='ev:merchant:love:2'&&choice===0||dance&&choice===1
 const stamp=(rows:readonly string[],pal:Record<string,string>,x:number,y:number,scale=1)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*scale,y+yy*scale,pal[c],scale,scale)}))
 const skin=(a:FinalePerson|null)=>{const v=a?a.avatar:av;return !a||a.who==='writer'?writerPalette('spring',v?withLookDefaults(v):undefined).s:PALETTE.s}
 const paper=(x:number,y:number,width=24,height=15,lines=0)=>{p(x,y,'#eee0bd',width,height);for(let i=0;i<lines;i++)p(x+3,y+3+i*2,'#9c835f',width-6,1)}
 const box=(x:number,y:number,open=true)=>{p(x,y,'#947450',24,13);p(x+1,y+1,open?'#65523d':'#b3936b',22,9);p(x+1,y+11,'#b3936b',22,2);p(x+3,y-4,'#b3936b',18,4);p(x+10,y+8,'#6b5942',3,2)}
 const bread=(x:number,y:number)=>{p(x,y,'#b28754',10,5);p(x+1,y-2,'#dab581',8,5);p(x+3,y-1,'#eee0b6',1,2);p(x+6,y-1,'#eee0b6',1,2)}
 const plate=(x:number,y:number)=>p(x,y,'#e4d9b9',16,3)
 const cup=(x:number,y:number,wide=false)=>{p(x,y,'#cbb997',6,6);p(x+1,y,'#8e704f',4,1);p(x+6,y+1,'#cbb997',wide?4:2,4);if(wide)p(x+7,y+2,'#a58c6a',2,2)}
 const table=(x:number,width=40)=>{p(x,f+4,'#b49469',width,4);p(x+2,f+8,'#745638',3,12);p(x+width-5,f+8,'#745638',3,12)}
 const seat=(x:number)=>{p(x-2,f+6,'#b49469',23,3);p(x,f+9,'#745638',3,10);p(x+16,f+9,'#745638',3,10)}
 const honeyJar=(x:number,y:number,color:string)=>{p(x,y,color,7,9);p(x-1,y-2,'#aa8960',9,3);p(x+2,y+2,'#eed7a2',2,4)}
 const route=(x:number,y:number)=>{p(x+2,y+2,'#93775b',5,1);p(x+6,y+3,'#93775b',1,4);p(x+6,y+6,'#93775b',9,1);p(x+14,y+3,'#93775b',1,4);p(x+14,y+3,'#93775b',7,1);p(x+19,y+3,'#93775b',1,6);p(x+4,y+9,'#93775b',16,1)}
 g.imageSmoothingEnabled=false
 if(tea)drawTeaRoomBackground(p,w,h,f-17)
 else drawMarketSquareBackground(p,w,h,f-15,market,evening,rain,t)
 if(['ev:romance:merchant:lateReturn','ev:romance:merchant:noSale','ev:romance:postman:noParcel','ev:romance:postman:ownMessage'].includes(id)){
  const parcel=id.endsWith('noParcel'),own=id.endsWith('ownMessage'),walk=own&&choice===1&&beat>=2,approach=parcel&&beat===0,arrival=approach?Math.round(18*(1-Math.min(1,t/1.2))):0,ax=nx+arrival
  // These three stories occur near closing time; late-return planning remains daytime.
  if(!id.endsWith('lateReturn'))drawMarketSquareBackground(p,w,h,f-15,merchant,true,false)
  if(merchant)table(cx-14,42)
  person(p,px,ground,av,'right','writer',false,walk,t)
  person(p,ax,ground,npc.avatar,walk?'right':'left',npc.who,false,walk||approach&&t<1.2,t)
  if(id.endsWith('lateReturn')){
   paper(cx-11,ground-5,27,12)
   for(let i=0;i<4;i++)p(cx-8+i*6,ground-3,'#ad9672',1,8)
   p(cx-9,ground-1,'#7d9a7f',3,2)
   if(choice===0&&beat>=2){p(cx+9,ground+2,'#7d9a7f',3,2);p(cx+10,ground-2,'#a77e5f',4,1)}
   if(choice===1&&beat>=2){p(cx+2,ground-3,'#a77e5f',5,1);p(cx+2,ground-2,'#a77e5f',1,6)}
  }else if(id.endsWith('noSale')){
   // The opening narration has already closed the notebook. Goods stay unsold.
   p(cx-11,ground-2,'#889d9b',16,6);p(cx-9,ground-1,'#b0bfad',12,2)
   p(cx+9,ground-5,'#89664e',13,8);p(cx+10,ground-4,'#b99366',11,5);p(cx+11,ground+1,'#e5d5ac',9,1)
   // Past bridge/sunrise memories remain conversation at the stall.
  }else{
   // Closed bag at the outer hip; no mail or parcel is handed over.
   p(ax+18,ground-12,'#806247',9,10);p(ax+19,ground-11,'#b28d61',7,3);p(ax+22,ground-7,'#685c46',2,2)
   if(own&&beat>=1){
    paper(walk?ax+18:ax-3,ground-12,7,6,1)
   }
  }
  return
 }
 if(clouds){
  // Same cloud can be read as a fish or an oar. After a third suggestion it disperses.
  const late=choice===0&&beat>=4
  p(cx-50,12,'#f2edda',late?18:45,5);p(cx-43,8,'#f2edda',late?12:23,4)
  if(!late){p(cx-8,10,'#f2edda',8,10);p(cx-3,6,'#f2edda',4,18);p(cx-16,15,'#e4e7d6',30,3)}else p(cx+17,16,'#f2edda',9,2)
 }
 if(market&&!tea)table(cx-14,stalls?90:honey?78:42)
 if(tea)table(cx-13,42)
 if(lunch){p(cx-66,f+6,'#a9b184',105,9)}
 if(psit&&!lunch)seat(px);if(sit&&!lunch)seat(nx)
 if(id==='ev:merchant:love:2')seat(px)
 if(id==='growth:stall:full'){
  // An unlocked empty selling place. No invented products, sale or reward.
  person(p,px,ground,av,'right');paper(nx-22,f-6,28,13,3);return
 }
 if(family){
  const walk=id!=='fam:market'&&beat===0,kx=id==='fam:errand'&&beat>=1?nx-33:px+22
  // Keep both pairs of feet on the same ground; join only the two-pixel native hands.
  const handY=ground-10,kidFloor=ground
  person(p,px,ground,av,'right','writer',false,walk,t)
  if(npc.baby){const b=newbornArt(npc.avatar);stamp(b.rows,b.palette,px+20,ground-15,2)}
  else person(p,kx,kidFloor,npc.avatar,'right',npc.who,false,walk,t,1,npc.short)
  if(id==='fam:walk'&&!npc.baby){p(px+20,handY,skin(null),2,2);if(beat>=1)stamp(ICONS[found]??ICONS.herb,ICON_PALETTE,kx+18,kidFloor-11);else stamp(ICONS[found]??ICONS.herb,ICON_PALETTE,kx+26,kidFloor-7)}
  for(let i=0;i<others.length;i++)person(p,nx+i*34,ground,others[i].avatar,'left',others[i].who)
  if(id==='fam:market'){plate(nx-21,f+3);bread(nx-18,f-2);p(kx+18,kidFloor-12,skin(npc),2,2)}
  if(id==='fam:errand'){const x=beat>=1?nx-12:kx+19;paper(x,f-3,9,7,1);if(beat>=1){p(nx-2,ground-10,skin(others[0]??null),2,2);p(kx+20,kidFloor-10,skin(npc),2,2);p(kx+20,kidFloor-6,skin(npc),2,2)}}
  return
 }
 const dx=danceStep
 if(id==='ev:marigold:bossy'&&choice===0){const full=av?withLookDefaults(av):undefined,rows=spriteRows('writer','right',{avatar:full,frame:0,blink:false,growth:1,pose:'handUp'});stamp(rows,writerPalette('spring',full),px,ground-rows.length*2,2)}
 else person(p,px+(dance&&choice===0?dx:0),ground,av,'right','writer',psit,dance&&choice===0,t)
 person(p,nx+dx,ground,npc.avatar,'left',npc.who,sit,(dance||bookDance)&&(choice===0||choice===1),t)
 const busy=id==='ev:marigold:bossy',customers=id==='ev:tilly:market',leftCrowd=busy&&beat>=2
 for(let i=0;i<others.length;i++){
  if(customers&&choice==null)continue
  const ox=leftCrowd?cx-118+i*26:cx+75+i*29
  person(p,ox,ground,others[i].avatar,leftCrowd?'left':'left',others[i].who,false,leftCrowd,t)
 }
 const x=nx-26,y=f-6
 if(clouds){bread(nx-13,f-1);bread(cx+62,f-1)}
 else if(id==='ev:merchant:short:spouseHabit'){
  paper(x,y,25,19);p(x+12,y+2,'#a48a66',1,15);for(let i=1;i<4;i++)p(x+2,y+i*4,'#a48a66',21,1)
  if(choice===0)p(x+15,y+6,'#7e9b83',6,2);if(choice===1)p(x+2,y+13,'#7e9b83',20,2)
 }else if(id==='ev:merchant:small:souvenirs'){
  box(x-5,f-4);p(x-3,f-3,'#acb4a1',20,choice===1?8:3);p(x+5,f,'#b88c5c',6,4)
  if(choice===1)p(px+18,ground-10,skin(null),2,2)
 }else if(honey){
  for(let i=0;i<3;i++){honeyJar(x-23+i*13,f-8,['#d6b978','#bd9454','#a67b42'][i]);plate(x-24+i*15,f+3);bread(x-21+i*15,f-1);if(choice===0)paper(x-23+i*13,f-6,7,5,1)}
  if(choice===1){plate(px+20,f+3);bread(px+23,f-1)}
  if(choice===2)p(x+8,f,'#d6b978',7,1)
 }else if(stalls){
  const shift=beat>=1?choice===0&&beat>=4?12:6:0
  for(let i=0;i<3;i++){bread(x-21+i*11+shift,f-2);p(cx+52+i*7,f-1,'#b99b75',5,4)}
  p(cx+51,f+4,'#8a6a4a',2,4)
  if(choice===1){plate(px+20,f+3);bread(px+22,f-1);p(px+32,f-1,'#b99b75',4,4)}
 }else if(id==='ev:merchant:home:1'){
  paper(x,y,27,18);route(x,y);p(x+(choice===0?4:19),y+11,'#7d9a7f',3,3)
 }else if(id==='ev:romance:merchant:returnLetter'){
  paper(x,y,25,15,3);if(choice===0)p(x+3,y+11,'#7d9a7f',8,1);if(choice===1)paper(px+20,y,24,15,5);if(choice===2){paper(x-11,f+9,11,7);p(x-8,f+11,'#7d9a7f',4,2)}
 }else if(id==='ev:marigold:story:1'){
  paper(x,y,26,19,6);p(x+3,y+3,'#eee0bd',20,3);if(choice===0)p(x+3,y+3,'#7d9a7f',20,1)
  if(choice===2){paper(px+20,f+2,25,10,1)}
 }else if(id==='ev:romance:merchant:homeShelf'){
  paper(x,y,26,17);p(x+4,y+4,'#a0845c',18,1);p(x+4,y+10,'#a0845c',18,1);p(x+4,y+4,'#a0845c',1,9);p(x+21,y+4,'#a0845c',1,9)
  if(choice===1)paper(x+9,f+12,13,7,1);if(choice===2)p(x+2,y+13,'#7d9a7f',20,1)
 }else if(id==='ev:merchant:story:3'){
  box(cx+102,f+8,false);p(x-5,f-6,'#9aa99e',27,10);p(x-5,f-6,'#788e92',choice===0?24:27,3)
  if(choice===0){p(x-5,f+1,'#b3beb0',27,2);p(px+18,ground-10,skin(null),2,2)}
  if(choice===2){p(x+1,f-3,'#b88c5c',7,5)}
 }else if(id==='ev:merchant:story:2'){
  const folded=choice===2;box(x-17,f+5);p(x-3,folded?f+6:y,'#b9a48a',folded?9:24,folded?6:15);if(!folded)route(x-3,y)
 }else if(id==='ev:merchant:home:2'){
  box(x-5,f-4,choice!==1);p(x+4,f-5,'#9c7652',3,10);p(x+2,f-6,'#d3b888',7,2);p(x+2,f+4,'#d3b888',7,2)
  if(choice===0){paper(x-4,f+10,24,10);p(x,f+12,'#a0845c',16,1)}
 }else if(id==='ev:merchant:love:1'){
  paper(x,y,26,17);route(x,y);if(choice===1){p(x+9,y+5,'#7d9a7f',1,8);p(x+4,y+12,'#7d9a7f',16,1);p(px+18,ground-10,skin(null),2,2)}
 }else if(lunch){
  plate(x-4,f+7);if(!(choice===1&&beat>=3))bread(x-1,f+2)
  const bx=choice===0?px+20:nx-11,by=choice===0?ground-11:f+3
  p(bx,by,'#b48b60',7,4);p(bx+5,by-2,'#b48b60',4,3);p(bx-2,by+1,'#b48b60',3,2);p(bx+3,by+1,'#d3b182',2,1)
 }else if(tea){
  cup(px+20,f);cup(nx-12,f,choice===1);box(nx+23,beat>=2?f+12:f-2,false)
 }else if(id==='ev:merchant:love:2'){
  p(x-4,f-4,'#a1ac9b',13,8);p(x+12,f-3,'#b28c65',7,8);if(choice===0){p(nx-2,ground-10,skin(npc),2,2)}
 }else if(id==='ev:merchant:small:signOrder'){
  for(let i=0;i<3;i++){p(x-5+i*10,f-3,'#ac9975',7,7);paper(x-5+i*10,f+9,8,5,1)}if(choice===1)p(x+14,f-3,'#cfb798',8,7)
 }else if(customers){
  const hammer=(xx:number)=>{p(xx+3,f-4,'#92704f',2,12);p(xx,f-7,'#969c94',10,5)}
  hammer(x-3);hammer(choice===0||choice===1&&beat>=4?cx+63:x+12)
  if(choice===1){paper(cx-15,f-44,35,14,3);p(cx,f-30,'#92704f',2,20)}
 }else if(busy){
  // Full list stays beside the face. Only the first response assigns the first 23 tasks.
  const folded=choice===2&&beat>=4;paper(x,folded?f+3:y,folded?10:26,folded?7:28)
  if(!folded)for(let i=0;i<47;i++)p(x+3+i%4*5,y+3+Math.floor(i/4)*2,'#9c835f',3,1)
  if(choice===0){paper(px+21,f-7,22,28);for(let i=0;i<23;i++)p(px+24+i%2*7,f-4+Math.floor(i/2)*2,'#9c835f',5,1)}
  if(choice===2&&!folded)p(x+18,y+25,'#7d9a7f',3,1)
 }else if(id==='ev:weaver:small:scraps'){
  box(x-6,f-4);for(let i=0;i<4;i++)p(x-3+i*5,f-1,['#97adab','#c6a3a2','#b6ad7e','#aaa2b6'][i],5,6)
  if(choice===0)for(let i=0;i<4;i++)p(x-8+i*8,f+10,['#97adab','#c6a3a2','#b6ad7e','#aaa2b6'][i],7,4)
 }else if(id==='ev:cosmo:gossip'){
  // A conversation in the square, not a second lakeside scene with the absent Tilly.
  p(nx-2,ground-11,skin(npc),2,3);if(choice===2&&beat>=3)p(nx+3,ground-9,skin(npc),2,2)
 }else if(id==='ev:juniper:love:1'){
  paper(x,y,25,18,6);p(x+22,y+2,'#b79f79',1,13);if(choice===0)p(x+3,y+15,'#7d9a7f',18,1)
 }else if(id==='ev:juniper:book'){
  const hug=choice===0;for(let i=0;i<12;i++){p(x-24+i%2*15,f+3-Math.floor(i/2)*3,'#a18c6d',13,3);p(x-23+i%2*15,f+3-Math.floor(i/2)*3,'#e8dbbc',11,1)}
  p(x-4,f-16,'#b9aa78',11,5);p(x,f-15,'#6e614b',3,2)
  if(hug){p(nx-2+dx,ground-12,skin(npc),2,3);p(nx-7,f-7,'#b9aa78',5,3)}
  // Her native face remains visible even when she laughs behind her lowered notebook.
 }else if(id==='ev:juniper:short:laugh'){
  paper(x,y,15,12,2);if(beat>=3)p(nx-2,ground-12,skin(npc),2,2);p(cx+69,ground-15,skin(others[0]),2,2)
 }else if(dance){
  if(choice===0||choice===1){p(nx+33,f-14,'#d3b16a',4,2);p(nx+37,f-14,'#665a3b',1,2)}
  if(choice===1){p(px+6,ground-11,skin(null),3,3);p(px+11,ground-11,skin(null),3,3)}
 }
}

import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {writerPalette,PALETTE,spriteRows} from './sprites'
import {drawCarpenterRoomBackground} from './carpenter-room-background'
import {drawWritingRoomBackground} from './writing-room-background'
import {drawFamilyRoomBackground} from './family-room-background'
import {drawPastureGround} from './pasture-ground'
import {FURNITURE_ART,FURNI_PALETTE} from './furniture-art'
export const WOOD_EVENT_IDS=["ev:child:story:2","ev:rudy:small:winterSigns", "ev:rudy:short:spouseHabit", "ev:rudy:silence", "ev:carpenter:story:2", "ev:carpenter:story:1", "ev:rudy:carvingTalk", "saw:rudy:carving", "ev:rudy:home:2", "ev:rudy:level", "ev:rudy:love:2", "ev:carpenter:small:benchTidy", "ev:postman:story:3", "ev:rudy:story:2", "ev:rudy:shelf", "ev:rudy:readTogether", "ev:rudy:story:1", "ev:rudy:label", "ev:rudy:home:1", "ev:carpenter:story:4"] as const
export const isWoodEvent=(id:string)=>(WOOD_EVENT_IDS as readonly string[]).includes(id)
export function woodEventPeople(id:string){
 if(id==='ev:child:story:2')return ['carpenter','child']
 if(id==='ev:postman:story:3')return ['postman','carpenter']
 if(id==='ev:carpenter:story:4')return ['carpenter','rudy']
 if(id==='ev:rudy:story:2'||id==='ev:rudy:silence')return ['rudy','carpenter']
 return [id.startsWith('ev:carpenter:')?'carpenter':'rudy']
}
/** Original dialogue phases drive material changes; future promises remain sketches. */
export function drawWoodEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=f+8,px=cx-55,nx=cx+25,selected=choice!=null
 const library=id==='ev:rudy:readTogether'&&beat>=1,home=id==='ev:carpenter:story:4'||id==='ev:rudy:silence'&&choice===0&&beat>=4,hill=id==='ev:rudy:love:2'||id==='ev:rudy:readTogether'&&beat===0,night=id==='saw:rudy:carving',warm=id.endsWith('winterSigns')&&choice===1&&beat>=2
 const sit=home||library,playerSit=library||home&&choice===0||id==='ev:rudy:love:2'&&beat>=1
 g.imageSmoothingEnabled=false
 if(id==='ev:child:story:2'){
  drawCarpenterRoomBackground(p,w,h,f-20)
  // A low unfinished display box and a separate drawing board fit between people.
  const support=choice===0&&beat>=3,bx=cx-14,by=ground-5,paperX=cx+64
  p(bx,by,'#8b6846',44,9);p(bx+2,by+2,'#c3a374',40,5)
  p(bx+3,by+3,'#a28660',19,3);p(bx+25,by+3,'#a28660',7,2)
  p(bx+22,by+1,'#8b6846',2,7)
  if(support){p(px+14,ground-8,'#b7996c',72,3);p(px+20,ground-5,'#806144',3,10)}
  p(paperX-2,ground+4,'#a7885f',31,3);p(paperX,ground+7,'#806144',3,11);p(paperX+24,ground+7,'#806144',3,11)
  person(p,px,ground,av,'right','writer')
  person(p,nx,ground,npc.avatar,'left',npc.who)
  const child=others[0]
  if(child)person(p,cx+85,ground,child.avatar,'left',child.who)
  p(paperX,ground-4,'#eee0bd',27,8)
  if(beat>=2){
   const wide=choice===1&&beat>=3?12:10
   p(paperX+2,ground-2,'#947b57',wide,1);p(paperX+2,ground,'#947b57',wide,1)
   p(paperX+2,ground-2,'#947b57',1,3);p(paperX+wide+1,ground-2,'#947b57',1,3)
   p(paperX+wide+3,ground-2,'#947b57',2,3)
   p(cx+90,ground-3,'#846344',1,5)
  }
  // Props meet the existing sprite's hands; no detached or extended hands are painted.
  if(beat>=2)p(nx+4,ground-8,'#8b6846',2,3)
  return
 }
 if(home)drawFamilyRoomBackground(p,w,h,f,true)
 else if(library)drawWritingRoomBackground(p,w,h,f-10)
 else if(hill)drawPastureGround(p,w,h,f-18)
 else if(night||id==='ev:postman:story:3'){
  // The same wall, roof, door and wood stack as Rudy's existing proposal exterior.
  p(0,0,night?'#434c5e':'#d8dfc8',w,h);p(0,f-25,night?'#66765c':'#91a17d',w,h-f+25);p(0,f+3,night?'#9b9074':'#c0ad87',w,h-f-3)
  p(cx-137,f-79,'#bfad8b',95,82);p(cx-141,f-89,'#8d7058',103,11);p(cx-137,f-87,'#a47e64',95,5)
  p(cx-122,f-65,'#806547',37,30);p(cx-119,f-62,night?'#536577':'#d9b68a',31,24);p(cx-105,f-62,'#ad895f',2,24);p(cx-119,f-51,'#ad895f',31,2)
  p(cx-75,f-46,'#957450',27,49);p(cx-72,f-43,'#765a40',21,46);p(cx-58,f-23,'#d6b685',2,3)
  for(let i=0;i<4;i++){p(cx-132+i*9,f-15-i*3,'#9d7c54',6,29+i*3);p(cx-131+i*9,f-14-i*3,'#c4a275',2,26+i*3)}
 }else drawCarpenterRoomBackground(p,w,h,f-20)
 const wood=(x:number,y:number,width=24,height=10)=>{p(x,y,'#987043',width,height);p(x+1,y+1,'#d3b084',width-2,height-2);p(x+2,y+2,'#e2c497',width-4,1)}
 const table=(x:number,width=40)=>{p(x,f+4,'#b49469',width,4);p(x+3,f+8,'#745638',3,12);p(x+width-6,f+8,'#745638',3,12)}
 const seat=(x:number)=>{p(x-2,f+6,'#a8835e',24,3);p(x,f+9,'#76583e',3,10);p(x+17,f+9,'#76583e',3,10)}
 const chair=(x:number,y:number,uneven=false)=>FURNITURE_ART.chair.rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&c!=='z'&&!(id.startsWith('ev:carpenter:')&&yy<3)&&FURNI_PALETTE[c])p(x+xx*2,y+yy*2-(uneven&&yy>=10&&xx>=12?3:0),FURNI_PALETTE[c],2,2)}))
 const tool=(x:number,y:number,kind='chisel')=>{if(kind==='plane'){p(x,y,'#826347',12,4);p(x+3,y-3,'#c1a675',5,3);p(x+8,y,'#a0a797',2,2)}else{p(x+2,y-2,'#826347',2,8);p(x+(kind==='hammer'?-1:2),y-4,'#a0a797',kind==='hammer'?8:2,kind==='hammer'?3:5)}}
 const paper=(x:number,y:number,lines=0)=>{p(x,y,'#eee0bd',24,12);for(let i=0;i<lines;i++)p(x+3,y+3+i*2,'#a08964',17-i*2,1)}
 const book=(x:number,y:number)=>{p(x,y,'#a48a66',24,10);p(x+1,y+1,'#eee0bd',22,8);p(x+12,y+1,'#b8a382',1,8);for(let i=0;i<2;i++){p(x+3,y+3+i*3,'#a08964',7,1);p(x+15,y+3+i*3,'#a08964',6,1)}}
 const cup=(x:number,y:number)=>{p(x,y,'#748d83',7,6);p(x+1,y,'#9a7450',5,1);p(x+7,y+2,'#748d83',2,3)}
 const skin=(a:FinalePerson|null)=>{const avatar=a?a.avatar:av;return !a||a.who==='writer'?writerPalette('spring',avatar?withLookDefaults(avatar):undefined).s:PALETTE.s}
 // Work surface sits between actors. Feet, clothes and native short arms remain in front.
 if(library)table(cx-55,120);else if(!hill&&!home)table(cx-12,40)
 if(id==='ev:rudy:love:2')chair(px-8,f-18);else if(playerSit)seat(px)
 if(sit){if(id==='ev:carpenter:story:4')chair(nx-8,f-18);else seat(nx)}
 if(home&&others[0])seat(cx+85)
 person(p,px,ground,av,'right','writer',playerSit)
 if(id==='ev:rudy:level'){
  // Close one native eye while sighting the shelf; never paint a prop over the face.
  const full=npc.avatar?withLookDefaults(npc.avatar):undefined,pal=npc.who==='writer'?writerPalette('spring',full):PALETTE,rows=spriteRows(npc.who,'left',{frame:0,blink:false,avatar:full,growth:1}),eye=rows.findIndex(r=>r.includes('o'))
  rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c]){const shut=yy===eye&&xx===r.indexOf('o');p(nx+xx*2,ground-rows.length*2+yy*2,shut?pal.s:pal[c],2,2)}}))
 }else person(p,nx,ground,npc.avatar,'left',npc.who,sit)
 if(others[0]&&(id!=='ev:rudy:silence'||home))person(p,cx+85,ground,others[0].avatar,'left',others[0].who,home)
 const x=nx-26,y=f-6
 if(id.endsWith('winterSigns')){
  p(cx-116,f-79,'#d6d9cc',37,12)
  for(let i=0;i<3;i++){wood(cx-10+i*9,f+1,8,6);p(cx-8+i*9,f+3,'#735536',4,1)}
  tool(warm?cx-10:nx-5,f-1)
  if(warm){p(nx+3,ground-11,skin(npc),4,2);p(nx+11,ground-11,skin(npc),4,2)}else{p(nx-6,ground-12,skin(npc),2,2);p(nx-7,ground-23,'#e7eadf',3,1)}
 }else if(id==='ev:rudy:short:spouseHabit'){
  paper(x,y);p(x+3,y+3,'#a08964',18,1);if(choice===1){p(x+4,y+5,'#a08964',5,4);p(x+14,y+5,'#a08964',5,4)}
 }else if(id==='ev:rudy:silence'){
  if(!home){wood(x,y);p(x+2,y+2,'#eee0bd',20,6);if(choice===1)book(px+20,y)}
 }else if(id==='ev:carpenter:story:1'){
  chair(cx-17,f-18,true);if(choice===1)p(cx-2,f+8,'#a0a797',3,2)
 }else if(id==='ev:carpenter:story:2'){
  wood(x,y,24,10);p(x+1,y+1,'#b49469',2,2);p(x+21,y+1,'#b49469',2,2);p(nx-2,ground-9,skin(npc),2,3)
  // Only the corner sample is rounded. Assembly is a future meeting.
 }else if(id==='ev:rudy:carvingTalk'||night){
  for(let i=0;i<(night?1:3);i++)wood(x-i*8,y+i*3)
  const glyph=night?(beat===1?'blank':'d'):selected&&choice===0?'r':'d'
  if(glyph!=='blank'){p(x+4,y+3,'#735536',7,1);p(x+4,y+3,'#735536',1,4);p(x+4,y+7,'#735536',7,1);if(glyph==='r'){p(x+10,y+3,'#735536',1,3);p(x+4,y+5,'#735536',7,1)}}
  if(id==='ev:rudy:carvingTalk'&&choice===0){paper(px+20,y,1);p(nx-2,ground-9,skin(npc),2,3)}
  tool(nx-5,f-1,night&&beat===1?'plane':'chisel')
  for(let i=0;i<9;i++)p(x-7+i*4,f+17+i%3*3,'#c3a77b',3,1)
  if(night){p(cx+69,f-11,'#775946',10,3);p(cx+71,f-22,'#dec29a',6,11);p(cx+70,f-24,'#826347',8,2);p(cx+73,f-26,Math.floor(t*3)%2?'#f0bd7c':'#f9da98',2,4)}
 }else if(id==='ev:rudy:home:2'){
  paper(x,y,3);if(choice===0){p(px+19,f-2,skin(null),2,2);paper(px+20,y,3)}
 }else if(id==='ev:rudy:level'){
  const corrected=choice===0&&beat>=3,tilt=corrected?0:3
  for(let i=0;i<24;i++)p(x+i,y+Math.round(tilt*i/23),'#b69871',1,3)
  p(nx-2,ground-9,skin(npc),2,3)
  if(choice===0){tool(x-14,f+1,'plane');if(beat>=2)for(let i=0;i<(beat>=3?4:2);i++)p(x+i*3,f+14,'#c3a77b',2,1)}
  if(choice===1){p(x,y+5,'#87988a',21,3);p(x+9,y+6,'#e3dfba',4,1);p(x+10,y+6,'#6d806f',1,1)}
 }else if(id==='ev:rudy:love:2'){
  // Only the measured chair exists; Rudy's second chair is still a promise.
  p(px+22,f-5,'#a08964',1,13);p(px+21,f+3,'#eee0bd',3,1)
 }else if(id.endsWith('benchTidy')){
  const order=choice===1?['hammer','plane','chisel']:['plane','chisel','hammer']
  order.forEach((kind,i)=>tool(selected?cx+76+i*15:cx-12+i*11,selected?f-72:f+1,kind));chair(cx-85,f+6)
 }else if(id==='ev:postman:story:3'){
  const bx=choice===2?px+20:x
  p(bx,y,'#94714d',24,13);p(bx+1,y+1,'#b19360',22,5);p(bx+9,y+5,'#67736e',5,4);const loop=choice===2?bx-2:bx+8; p(loop,y-2,'#94714d',8,2);p(loop-1,y-1,'#94714d',2,3);p(loop+7,y-1,'#94714d',2,3)
  if(choice===2){p(px+18,ground-13,skin(null),2,4);p(bx-2,y,skin(null),2,2);p(cx+71,f-1,'#eee0bd',12,8);p(cx+74,f+2,'#67736e',3,2)}
 }else if(id==='ev:rudy:story:2'){
  wood(x,y-5,24,15);for(let i=0;i<4;i++)p(x+19+i,y-5+i*2,'#826347',1,8-i);p(x+2,y-4,'#e2c497',19,3);p(x+2,y+7,'#826347',21,3)
  if(choice===0&&beat>=5){for(let i=0;i<3;i++)p(x+4+i*7,y+7,'#67736e',2,2);tool(nx-5,f-1,'hammer');p(nx-2,ground-9,skin(npc),2,3)}
  if(choice===1){tool(x-15,f+1,'plane');if(beat>=5)p(x+4,y-3,'#a0a797',14,1)}
  if(others[0])tool(cx+71,f+1,'plane')
 }else if(id==='ev:rudy:shelf'){
  p(x-9,f-29,'#947754',31,38);p(x-6,f-26,'#c7a67b',25,32);for(let i=0;i<2;i++)p(x-6,f-11+i*16,'#947754',25,3)
  if(choice===1)tool(nx-6,f-1,'plane');if(choice===0&&beat>=3)p(nx-1,ground-21,'#c5856f',2,2)
 }else if(id==='ev:rudy:readTogether'){
  if(library){book(x,f-3);p(nx-2,ground-7,skin(npc),2,2);p(x+22,f+(choice===0&&beat>=3?3:choice===1&&beat>=3?1:-1),skin(npc),2,2)}
 }else if(id==='ev:rudy:story:1'){
  for(let i=0;i<3;i++){wood(cx-11+i*12,f,10,7);if(i===0){p(cx-11,f,'#b49469',2,2);p(cx-3,f+5,'#b49469',2,2)}if(i===2)p(cx+20,f,'#b49469',2,3)}
  if(choice===1){p(cx+2,f,'#a08964',7,1);p(cx+10,f+1,'#a08964',1,5)}
  if(choice===2){paper(px+20,y);p(px+23,y+3,'#a08964',4,3);p(px+29,y+3,'#a08964',4,3);p(px+36,y+3,'#a08964',4,3)}
  if(choice===0&&beat>=4)p(nx-2,ground-9,skin(npc),2,3)
 }else if(id==='ev:rudy:label'){
  const down=choice===1&&beat>=3;wood(down?cx-12:x,down?f+1:y);for(let i=0;i<3;i++)p((down?cx-12:x)+4+i*6,(down?f+1:y)+4,'#735536',3,3)
  if(!down)p(nx-2,ground-9,skin(npc),2,3)
 }else if(id==='ev:rudy:home:1'){
  // Sketch remains on the workbench; no shelf is installed ahead of the dialogue.
  paper(x,y);p(x+3,y+4,'#a08964',18,1);if(choice===1){p(x+12,y+3,'#a08964',1,6);p(x+4,y+7,'#a08964',5,1)}else p(x+3,y+2,'#a08964',18,1)
 }else if(id==='ev:carpenter:story:4'){
  cup(nx-15,f-1);cup(cx+69,f-1);p(nx-2,ground-8,skin(npc),2,2);if(others[0])p(cx+83,ground-8,skin(others[0]),2,2)
 }
}

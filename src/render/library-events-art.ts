import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawLibraryRoomBackground} from './library-room-background'
import {drawHomeYardBackground} from './home-yard-background'
import {drawFamilyRoomBackground} from './family-room-background'
import {drawPostmanBackground} from './postman-background'
import {FURNITURE_ART,FURNI_PALETTE} from './furniture-art'
import {REMAINING_FIXTURE_DIRECTIONS} from './remaining-furniture-art'
import {ICONS,ICON_PALETTE,writerPalette,PALETTE} from './sprites'
import {COOL_CUPBOARD} from './cooking-art'
import {newbornArt} from './newborn-art'
export const LIBRARY_EVENT_IDS=['ev:child:small:pocketSort','ev:child:story:1','ev:child:story:3','ev:child:story:4','ev:child:small:labelTurn','ev:romance:postman:otherDay','ev:romance:postman:lastDelivery','built:sootCatcher','growth:visitor','ev:rudy:story:3','gospelFeast','ev:rudy:library','roomOpen:rev','roomOpen:hebJud','roomOpen:romPhm','allFeast','growth:shelf','bibleReadingLetter:0','bibleReadingLetter:1','bibleReadingLetter:2','built:homeCoolCupboard','growth:clubs:full','growth:cooking:full','welcome','growth:smallRequest','growth:clubs','built:supplyChest','growth:cooking','growth:mailbox','growth:mailbox:full','fam:show'] as const
export const isLibraryEvent=(id:string)=>(LIBRARY_EVENT_IDS as readonly string[]).includes(id)
export function libraryEventPeople(id:string):string[]{
 if(id.startsWith('ev:child:'))return ['child']
 if(id.startsWith('ev:romance:postman:'))return ['postman']
 if(id==='fam:show')return ['child']
 if(id.startsWith('ev:rudy:'))return ['rudy']
 if(id.startsWith('built:'))return ['carpenter']
 if(id.startsWith('roomOpen:'))return ['postman']
 if(id==='gospelFeast')return ['baker','grandpa','carpenter']
 if(id==='allFeast')return ['grandpa','carpenter','postman']
 return []
}
/** Unlock notices show the described tools/plans; they do not perform the unlocked activity. */
export function drawLibraryEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson&{baby?:boolean},others:FinalePerson[],beat:number,choice?:number|null,workItem='clothDoll'){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=f+8,px=cx-55,nx=cx+25,x=cx-1
 const rudy=id.startsWith('ev:rudy:'),entered=id==='ev:rudy:library'&&choice===0&&beat>=3,room=id.startsWith('roomOpen:'),feast=id==='gospelFeast'||id==='allFeast',show=id==='fam:show',letter=id.startsWith('bibleReadingLetter:'),mail=id.startsWith('growth:mailbox'),cast=libraryEventPeople(id)
 g.imageSmoothingEnabled=false
 if(rudy&&!entered){drawPostmanBackground(p,w,h,f-18,{minute:1110,indoors:false,wet:false,at:{x:24,y:9}},t);p(cx-48,ground-57,'#b3b09d',110,58);p(cx-48,ground-58,'#8f937f',110,3);p(nx-7,ground-57,'#927351',36,58);p(nx-4,ground-54,'#aa875c',30,55);p(nx+21,ground-22,'#d6ba85',2,3)}
 else if(room||feast||entered||show)drawLibraryRoomBackground(p,w,h,f-18,room)
 else if(mail)drawHomeYardBackground(p,w,h,ground-38)
 else drawFamilyRoomBackground(p,w,h,f-18)
 const stamp=(rows:readonly string[],pal:Record<string,string>,xx:number,yy:number,scale=1)=>rows.forEach((r,j)=>[...r].forEach((c,i)=>{if(c!=='.'&&pal[c])p(xx+i*scale,yy+j*scale,pal[c],scale,scale)}))
 const icon=(item:string,xx:number,yy:number)=>{if(ICONS[item])stamp(ICONS[item],ICON_PALETTE,xx,yy,2)}
 const paper=(xx:number,yy:number,a=24,b=16)=>{p(xx,yy,'#eee1c4',a,b);p(xx+2,yy+3,'#b29a79',a-4,1)}
 const lines=(xx:number,yy:number,n:number)=>{paper(xx,yy);for(let i=0;i<n;i++)p(xx+3,yy+6+i*3,'#aa9574',i%2?12:17,1)}
 const tabletop=(xx=x-4,yy=ground+8,a=44)=>{p(xx,yy,'#ba9b70',a,4);p(xx+3,yy+4,'#85674e',3,10);p(xx+a-6,yy+4,'#85674e',3,10)}
 const books=(count:number,xx=cx-34,yy=f-74)=>{p(xx-4,yy-4,'#947451',72,48);p(xx,yy,'#514333',64,40);for(let i=0;i<count;i++){const col=i%9,row=Math.floor(i/9);p(xx+2+col*7,yy+2+row*13,['#a98761','#80917a','#a99874','#948299','#a67965'][i%5],5,10);p(xx+3+col*7,yy+4+row*13,'#e1d2ad',3,1)}for(let j=0;j<3;j++)p(xx,yy+12+j*13,'#b4966d',64,2)}
 if(id.startsWith('ev:child:')||id.startsWith('ev:romance:postman:')){
  const classroom=['ev:child:story:3','ev:child:story:4','ev:child:small:labelTurn'].includes(id),post=id.startsWith('ev:romance:postman:'),pocket=id.endsWith('pocketSort'),first=id==='ev:child:story:1',reply=choice!=null&&beat>=(pocket||id.endsWith('labelTurn')?1:2)
  if(classroom){drawLibraryRoomBackground(p,w,h,f-18);p(cx-33,f-77,'#967753',66,27);p(cx-30,f-74,'#586b5e',60,21)}
  else drawPostmanBackground(p,w,h,f-18,{minute:post?960:660,indoors:false,wet:false,at:{x:post?22:8,y:post?8:9}},t)
  person(p,px,ground,av,'right','writer')
  person(p,nx,ground,npc.avatar,'left',npc.who,false,false,t,1,npc.short)
  const stone=(xx:number,yy:number,turned=false)=>{p(xx,yy,'#929789',8,5);p(xx+1,yy-1,'#b5b9aa',5,2);p(xx+(turned?4:1),yy+1,'#656f66',turned?1:6,turned?3:1)}
  const leaf=(xx:number,yy:number)=>{p(xx,yy,'#839d70',8,3);p(xx+2,yy-1,'#a6b78b',5,2);p(xx+1,yy+2,'#607d55',7,1)}
  const label=(xx:number,yy:number,back=false)=>{p(xx,yy,back?'#b69972':'#eee1c4',12,7);if(!back){p(xx+2,yy+2,'#aa9574',8,1);p(xx+2,yy+4,'#aa9574',5,1)}}
  if(post){
   tabletop(cx-15,ground+8,43);paper(cx-11,ground-5,30,12)
   p(cx+1,ground-4,'#b29a79',1,9)
   for(let i=0;i<2;i++){p(cx-8,ground-2+i*4,'#aa9574',7,1);p(cx+4,ground-2+i*4,'#aa9574',11,1)}
   if(id.endsWith('otherDay')&&reply&&choice===0){p(cx+4,ground+2,'#eee1c4',11,1);p(cx+7,ground+2,'#839d70',8,1)}
   if(id.endsWith('lastDelivery')){p(cx+4,ground-2,'#839d70',9,1);if(reply&&choice===1)p(cx+12,ground+1,'#a68663',2,3)}
   // Tomorrow's bread, dinner and escort stay future promises, with no delivery reward.
  }else if(pocket||first){
   const spread=!pocket||reply,xx=cx-12,yy=ground-6
   p(xx,yy,'#b9a58b',spread?34:14,10);p(xx+1,yy+1,'#d4c4a4',spread?32:12,1)
   if(first&&beat===0){stone(nx-4,ground-5)}
   else{stone(xx+3,yy+3,first&&reply&&choice===1);leaf(xx+(spread?23:3),yy+(spread?4:14))}
  }else{
   const xx=cx-8,yy=ground-7,turn=id.endsWith('labelTurn'),exhibit=id==='ev:child:story:4'
   p(xx,yy,'#8b6846',34,12);p(xx+2,yy+2,'#c3a374',30,8);p(xx+20,yy+1,'#8b6846',2,10)
   stone(xx+5,yy+4);leaf(xx+23,yy+4)
   const moved=turn?reply:beat>=1
   label(moved?xx-15:xx+3,yy+(moved?2:1),turn&&!reply)
   if(exhibit&&beat>=1){p(xx+21,yy-1,'#8b6846',2,2);label(xx+16,yy-8)}
   if(exhibit&&reply&&choice===2){const pal=writerPalette('spring',av?withLookDefaults(av):undefined);p(px+12,ground-12,pal.s,2,2);p(px+14+Math.floor(t*3)%2,ground-12,pal.s,2,2)}
  }
  return
 }
 if(entered||feast)books(entered?9:id==='gospelFeast'?4:27)
 if(entered){p(nx+22,ground-46,'#947451',29,46);p(nx+25,ground-43,'#514333',23,40);for(let i=0;i<3;i++)p(nx+25,ground-32+i*13,'#b4966d',23,2)}
 if(room){
  if(id==='roomOpen:romPhm'){p(cx-35,f-44,'#947451',64,4);p(cx-32,f-40,'#80664e',3,7);p(cx+23,f-40,'#80664e',3,7)}else books(0,cx-35,f-74)
  if(id==='roomOpen:rev'){p(cx-55,f-38,'#947451',17,3);p(cx-52,f-35,'#80664e',3,7)}
  for(const dx of [-71,46]){p(cx+dx,f-80,'#a7835f',23,26);p(cx+dx+2,f-78,'#e8d1aa',19,22);p(cx+dx+10,f-78,'#b09268',1,22)}
  if(id==='roomOpen:rev'){p(cx-14,f-80,'#9d815c',28,21);for(let i=0;i<7;i++)p(cx-11+i%4*6,f-77+Math.floor(i/4)*9,'#e3d0a7',4,7)}
  else {p(cx-14,f-80,'#9d815c',28,21);for(let i=0;i<3;i++){p(cx-11+i*8,f-74,'#c4aa7c',6,10);p(cx-10+i*8,f-76,'#eee0bd',4,6)}}
  tabletop(cx-20,ground+8,id==='roomOpen:romPhm'?39:50)
 }
 if(show){p(cx-40,f-73,'#9b7b58',80,29);p(cx-37,f-70,'#586b5e',74,23);tabletop(cx-4,ground+8,39)}
 person(p,px,ground,av,'right','writer')
 if(cast.length){if(show&&npc.baby){const baby=newbornArt(npc.avatar);stamp(baby.rows,baby.palette,nx,ground-14,2)}else person(p,nx,ground,npc.avatar,'left',npc.who,false,false,t,1,npc.short)}
 others.forEach((a,i)=>person(p,cx+65+i*30,ground,a.avatar,'left',a.who,false,false,t,1,a.short))
 const hand=(xx:number,yy:number,a:FinalePerson|null)=>{const avatar=a?a.avatar:av,pal=a&&a.who!=='writer'?PALETTE:writerPalette('spring',avatar?withLookDefaults(avatar):undefined);p(xx,yy,pal.s,2,2)}
 if(rudy){
  if(entered){p(nx+22,ground-13,'#bfa478',2,12);hand(nx+20,ground-13,npc)}
  else if(id==='ev:rudy:story:3'){p(nx-15,ground-11,'#b59465',12,9);p(nx-15,ground-11,'#cfb687',9,2);p(nx-15,ground-11,'#c9b79b',3,2);if(choice===2){p(nx-13,ground-5,'#82694c',7,1);p(nx-13,ground-7,'#82694c',1,3)}hand(nx-2,ground-9,npc)}
  else if(choice===1&&beat>=3)hand(nx-2,ground-10,npc)
 }else if(room){if(beat===0){paper(x,ground-10);p(x+4,ground-7,'#967c56',5,9);p(x+13,ground-7,'#aa9473',6,9)}}
 else if(feast){paper(x,ground+9,29,17);p(x+4,ground+14,'#a48b67',21,1);p(x+10,ground+20,'#9a7d60',9,1)}
 else if(show){icon(workItem,x,ground-5);if(beat>=1){paper(x-16,ground+13,17,12);p(x-12,ground+16,'#97aa8b',6,5)}}
 else if(id==='built:sootCatcher'){
  const art=REMAINING_FIXTURE_DIRECTIONS.hearth.down;if(art)stamp(art.rows,FURNI_PALETTE,cx-10,ground-12,1)
  const catcher=REMAINING_FIXTURE_DIRECTIONS.sootCatcher.down;if(catcher)stamp(catcher.rows,FURNI_PALETTE,cx-9,ground-18,1)
 }else if(id==='built:supplyChest'||id==='built:homeCoolCupboard'){
  const art=id==='built:homeCoolCupboard'?COOL_CUPBOARD.closed.down:FURNITURE_ART.supplyChest;if(art)stamp(art.rows,FURNI_PALETTE,cx-6,ground-8,1)
 }else if(letter){
  tabletop(x-6,ground+10,45);paper(x,ground-2,26,18);p(x+3,ground+2,['#8d9b78','#9caeb2','#b28e73'][Number(id.at(-1))],5,5);for(let i=0;i<3;i++)p(x+11,ground+2+i*4,'#ab9472',11,1)
  p(x+2,ground+11,'#ab9472',16,1)
  if(id.endsWith(':0')){for(let i=0;i<4;i++)p(x+31,ground+i*3,'#8b765c',10-i,1)}
  else if(id.endsWith(':1')){paper(x+29,ground+5,18,13);p(x+32,ground+9,'#9a8968',3,4);p(x+40,ground+9,'#9a8968',3,4);p(x+37,ground+7,'#b6a586',1,10)}
  else {p(x+30,ground+1,'#b88d69',4,17);p(x+30,ground+18,'#eee1c4',2,2)}
 }else if(mail){
  tabletop(x-5,ground+10,41);p(x,ground-5,'#b08b59',26,17);for(let i=0;i<4;i++)p(x,ground-2+i*4,'#d1b587',26,1);paper(x+4,ground-10,18,11);p(x+8,ground-7,'#a89a76',10,1)
  if(id.endsWith(':full')){paper(x+26,ground+17,16,9);paper(x-12,ground+21,15,8)}
 }else if(id==='growth:shelf'){
  tabletop(x-6,ground+10,47);for(let i=0;i<7;i++){paper(x+i%3*7,ground-7+Math.floor(i/3)*4,22,12);p(x+3+i%3*7,ground-3+Math.floor(i/3)*4,'#a99c7f',12,1)}
 }else if(id==='growth:visitor'){
  lines(x,ground-7,3);p(x+3,ground+5,'#8d9d85',17,2);p(x+29,ground-5,'#a88f6c',9,9);p(x+33,ground-2,'#eee0bd',1,4)
 }else if(id==='growth:smallRequest'){
  icon('barley',x,ground-1);icon('barley',x+14,ground+7);icon('barley',x-9,ground+15);paper(x-5,ground-13,21,10)
 }else if(id==='growth:clubs'||id==='growth:clubs:full'){
  lines(x,ground-8,2);p(x+3,ground+3,'#a0805c',7,4);p(x+15,ground+3,'#a0805c',7,4);if(id.endsWith(':full')){icon('thread',x+29,ground+12);icon('herb',x-14,ground+13)}
 }else if(id==='growth:cooking'||id==='growth:cooking:full'){
  lines(x,ground-8,2);icon(id.endsWith(':full')?'barley':'herb',x+27,ground+8);p(x+3,ground+3,'#b09a78',17,4);p(x+6,ground,'#cbb28a',11,3)
 }else if(id==='welcome'){
  tabletop(x-6,ground+10,48);paper(x,ground-8,30,20);for(let i=0;i<4;i++)p(x+3,ground-4+i*4,'#a79375',22-i*3,1);p(x+34,ground-2,'#826951',6,9);p(x+36,ground-9,'#c4aa7b',1,9)
 }
}

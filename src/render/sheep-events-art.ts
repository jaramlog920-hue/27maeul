import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawSheepPastureBackground} from './sheep-pasture-background'
import {drawBeeFieldBackground} from './bee-field-background'
import {drawPastureGround} from './pasture-ground'
import {drawFamilyRoomBackground} from './family-room-background'
import {drawWeaverRoomBackground} from './weaver-room-background'
import {SHEEP,SMALL_PALETTE,writerPalette,PALETTE,spriteRows} from './sprites'
export const SHEEP_EVENT_IDS=["ev:dexter:winterNight", "ev:dexter:small:winterTidy", "ev:shepherd:small:winterPen", "ev:shepherd:short:seasonNews", "ev:dexter:love:2", "ev:dexter:short:spouseHabit", "ev:dexter:forgot", "friends", "ev:shepherd:story:3", "ev:shepherd:story:1", "ev:dexter:stars", "ev:dexter:map", "ev:shepherd:small:newApron", "ev:dexter:home:1", "ev:shepherd:story:2", "ev:dexter:count", "saw:lamb:firstBite", "ev:shepherd:small:woolSort", "ev:dexter:home:2", "ev:dexter:angry", "ev:dexter:love:1", "ev:shepherd:story:4"] as const
export const isSheepEvent=(id:string)=>(SHEEP_EVENT_IDS as readonly string[]).includes(id)
export function sheepEventPeople(id:string):string[]{
 if(id==='friends')return ['shepherd','child']
 if(id==='saw:lamb:firstBite')return ['dexter','juniper','basil']
 if(id==='ev:shepherd:small:winterPen'||id==='ev:shepherd:story:3'||id==='ev:shepherd:story:4')return ['shepherd','dexter']
 if(id==='ev:shepherd:small:newApron')return ['shepherd','weaver']
 if(id==='ev:shepherd:short:seasonNews')return ['shepherd','beekeeper']
 return [id.startsWith('ev:shepherd:')?'shepherd':'dexter']
}
/** Original phases change the work in progress; invitations do not jump to future visits. */
export function drawSheepEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,_t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=f+8,px=cx-55,nx=cx+25
 const night=id==='ev:dexter:winterNight',winter=night||id.endsWith('winterTidy')||id.endsWith('winterPen'),hill=['ev:dexter:stars','ev:dexter:map','ev:dexter:love:1','ev:dexter:love:2'].includes(id),home=id.startsWith('ev:dexter:home:')||id==='ev:dexter:short:spouseHabit',apron=id==='ev:shepherd:small:newApron',season=id==='ev:shepherd:short:seasonNews'
 const psit=night&&choice===0||id==='ev:dexter:stars'||id==='ev:dexter:love:2'&&choice===1||id==='friends'||id==='ev:shepherd:story:1'&&choice===1||id.endsWith('woolSort')&&choice===0
 const sit=night||id==='ev:dexter:stars'||id==='ev:dexter:love:2'&&choice===1||id==='saw:lamb:firstBite'||id==='friends'||id==='ev:shepherd:story:1'||id.endsWith('woolSort')
 const stamp=(rows:readonly string[],pal:Record<string,string>,x:number,y:number,scale=1)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*scale,y+yy*scale,pal[c],scale,scale)}))
 const sheep=(x:number,y:number,lamb=false)=>stamp(SHEEP,SMALL_PALETTE,x,y,lamb?1:2)
 g.imageSmoothingEnabled=false
 if(home)drawFamilyRoomBackground(p,w,h,f-12)
 else if(apron)drawWeaverRoomBackground(p,w,h,f-18)
 else if(hill){
  drawPastureGround(p,w,h,f-18,true)
  // Existing hill silhouette and its night palette; no sheep pen on the hill.
  for(let i=0;i<62;i++){const x=(i*61+7)%w,y=4+(i*29)%Math.max(8,f-88);p(x,y,i%5===0?'#e4dec4':'#9ca9ab',1,1)}
  p(cx+97,12,'#dedbc0',5,8);p(cx+99,10,'#dedbc0',4,3)
 }else if(night){
  // The pen shelter uses the same timber and pasture colours as the existing fence.
  p(0,0,'#424e64',w,h);p(0,f-63,'#8d7d64',w,h-f+63)
  for(let y=f-62;y<f+8;y+=10)p(0,y,'#77684f',w,1)
  p(cx-136,f-76,'#79654b',272,8);p(cx-127,f-70,'#a58b62',5,88);p(cx+124,f-70,'#a58b62',5,88)
  p(cx-112,f-57,'#635e56',34,25);p(cx-110,f-55,'#424e64',30,21)
  p(0,f+8,'#aa9670',w,h-f-8)
  for(let i=0;i<54;i++)p((i*47+9)%w,f+9+(i*13)%28,'#ccb687',7,1)
  sheep(cx-113,f-6);sheep(cx+66,f-6);sheep(nx-25,f+9,true)
  for(let i=0;i<12;i++)p(cx-109+i*2,f-53+(i*11)%17,'#e2e5d6',1,1)
 }else if(season)drawBeeFieldBackground(p,w,h,f-45,false)
 else {drawSheepPastureBackground(p,w,h,f-18,false);sheep(cx-113,f-11);sheep(cx-82,f-11)}
 if(winter&&!night){p(0,f+18,'#e3e5d3',w,h-f-18);for(let i=0;i<24;i++)p((i*43)%w,f+19+(i*11)%24,'#c1c9b8',5,1)}
 const paper=(x:number,y:number,width=24,height=14)=>{p(x,y,'#eee0bd',width,height);p(x+2,y+2,'#c2aa7e',width-4,1)}
 const cloud=(x:number,y:number)=>{p(x+2,y,'#faf1d6',11,3);p(x,y+2,'#faf1d6',17,4);p(x+3,y+6,'#faf1d6',11,2)}
 const wool=(x:number,y:number,rough=false)=>{p(x+2,y,rough?'#c0b497':'#eee5ce',10,9);p(x,y+2,rough?'#b3a588':'#e4dcc3',14,5);p(x+4,y-2,rough?'#c0b497':'#eee5ce',6,2)}
 const comb=(x:number,y:number)=>{p(x,y,'#86664a',11,3);for(let i=0;i<5;i++)p(x+i*2,y+3,'#ad8e64',1,4)}
 const scissors=(x:number,y:number)=>{p(x,y,'#a7ada2',2,8);p(x+4,y,'#a7ada2',2,8);p(x,y+7,'#77563f',6,2)}
 const cord=(x:number,y:number)=>{p(x,y,'#ddc8a4',9,2);p(x,y+2,'#ddc8a4',2,4);p(x+7,y+2,'#ddc8a4',2,4);p(x,y+5,'#ddc8a4',9,2)}
 const straw=(x:number,y:number)=>{p(x,y,'#cab17d',20,6);for(let i=0;i<7;i++)p(x+i*3,y-2,'#e3cc94',1,10);p(x+9,y-2,'#8a7550',2,10)}
 const bucket=(x:number,y:number,ice=false)=>{p(x,y,'#8c765a',13,10);p(x+1,y+1,ice?'#c4d9d5':'#809995',11,3);p(x+3,y-5,'#8c765a',7,1);p(x+2,y-4,'#8c765a',1,4);p(x+10,y-4,'#8c765a',1,4)}
 const skin=(a:FinalePerson|null)=>{const v=a?a.avatar:av;return !a||a.who==='writer'?writerPalette('spring',v?withLookDefaults(v):undefined).s:PALETTE.s}
 const table=(x:number,width=42)=>{p(x,f+4,'#b49469',width,4);p(x+2,f+8,'#745638',3,13);p(x+width-5,f+8,'#745638',3,13)}
 if(apron||home||id==='ev:shepherd:story:1'||id.endsWith('woolSort'))table(cx-13)
 // High hooks and the rota are on an empty shelter post, never over a face.
 if(id==='ev:shepherd:story:3'||id==='ev:shepherd:story:4'){
  p(cx-12,f-54,'#a38760',4,62)
  if(id.endsWith(':3')){paper(cx-25,f-48,28,23);for(let i=1;i<3+(choice===1?1:0);i++)p(cx-23+i*6,f-44,'#655943',1,17);p(cx-23,f-37,'#655943',23,1);if(choice===2)p(cx-22,f-28,'#8ca77c',20,2)}
  else {p(cx-31,f-48,'#987552',55,3);for(let i=0;i<4;i++)p(cx-27+i*13,f-45,'#775a3d',2,4);comb(cx-30,f-39);scissors(cx-15,f-39);cord(cx-3,f-39);p(cx+11,f-39,'#b8a47a',11,17);p(cx+13,f-44,'#b8a47a',7,6)}
 }
 if(id==='ev:dexter:angry'){
  for(let i=0;i<3;i++){const fixed=choice===0&&beat>=3,x=cx-21+i*15;p(x,f+(fixed?-13:8+i*2),'#a38760',fixed?3:14,fixed?31:3)}
  if(choice===0&&beat>=3){p(cx-21,f-6,'#b69a70',34,3);p(cx-21,f+4,'#b69a70',34,3)}
  for(const sx of [cx+80,cx+108]){sheep(sx,f-4);p(sx+4,f+2,'#efe3c4',5,3)}
 }
 if(id==='saw:lamb:firstBite'){p(cx+63,f-28,'#a38760',3,38);p(cx+60,f-19,'#b69a70',35,3);p(cx+60,f-8,'#b69a70',35,3)}
 person(p,px,ground,av,'right','writer',psit)
 if(night&&choice===0&&beat>=3){const full=npc.avatar?withLookDefaults(npc.avatar):undefined;const rows=spriteRows(npc.who,'left',{frame:0,blink:true,avatar:full,pose:'crouch',growth:1});stamp(rows,npc.who==='writer'?writerPalette('spring',full):PALETTE,nx,ground-rows.length*2,2)}
 else person(p,nx,ground,npc.avatar,'left',npc.who,sit)
 for(let i=0;i<others.length;i++)person(p,cx+70+i*31,ground,others[i].avatar,'left',others[i].who,id==='friends')
 const x=nx-26,y=f-6
 if(night){
  // Warm wool surrounds their feet, not their faces or torsos.
  sheep(nx+22,f+8);if(choice===0)sheep(px+22,f+8)
  if(beat===0){p(cx+69,f-17,'#c5ccc0',3,1);p(cx+73,f-20,'#c5ccc0',2,1)}
 }else if(id.endsWith('winterTidy')||id.endsWith('winterPen')){
  straw(x-5,f+2);bucket(cx+101,f+1,id.endsWith('winterTidy')&&beat===0)
  if(choice===0){straw(px+20,f-5);p(px+18,ground-10,skin(null),2,2);sheep(cx+77,f+11,true)}
  if(choice===1){p(nx-2,ground-10,skin(npc),2,2);p(x+4,f-18,'#80785f',2,19);paper(x-13,f+10,15,10);p(x-11,f+14,'#786544',8,1)}
 }else if(season){
  for(let i=0;i<7;i++){p(cx-100+i*7,f-28+i%3*3,'#7d9961',1,9);p(cx-102+i*7,f-31+i%3*3,'#e3ce89',5,3)}
  p(cx+93,f-10,'#d5b365',3,2);p(cx+96,f-10,'#665a3b',1,2)
 }else if(id==='ev:dexter:love:2'){
  paper(x,y,26,16);p(x+13,y+2,'#b8a382',1,12);cloud(x+2,y+3);p(x+2,y+12,'#9d835e',8,1)
  if(choice===1){p(x+17,y+5,'#faf1d6',choice===1?7:3,4);p(px+18,ground-10,skin(null),2,2)}
 }else if(id==='ev:dexter:short:spouseHabit'){
  paper(cx-13,f-57,25,17)
  if(choice!==2)cloud(cx-9,f-53)
  if(choice===0)p(cx-10,f-44,'#8b7555',17,1)
 }else if(id==='ev:dexter:forgot'){
  sheep(cx+77,f+6,true)
  if(choice===1&&beat>=3){p(nx+3,ground-9,'#ddc8a4',3,1);cord(x+9,f+4)}else cord(x+9,f+4)
 }else if(id==='friends'){
  sheep(cx+50,f+7);comb(cx+56,f-3);p(cx+68,ground-9,skin(others[0]),2,2)
 }else if(id==='ev:shepherd:story:1'){
  p(x-9,f-4,'#a58b61',30,14);p(x-7,f-7,'#c4aa7e',26,3)
  scissors(x-7,f-8);cord(x+4,f-6);bucket(x-24,f+2)
  comb(choice===1?x+9:x,f+(choice===1?-12:1))
  // A suggestion is only a proposal: the hooks do not appear before story four.
 }else if(id==='ev:dexter:stars'){
  for(let i=0;i<(choice===0&&beat>=1?12:5);i++)p(cx-16+i%6*4,f+13+Math.floor(i/6)*3,'#e0d5b4',2,1)
  if(choice===1)p(cx+38,19,'#faf1d6',2,2)
 }else if(id==='ev:dexter:map'||id==='ev:dexter:love:1'){
  paper(x,y,26,20)
  // Thirty constellation marks; the small paired stars remain joined.
  for(let i=0;i<30;i++)p(x+2+i%6*4,y+4+Math.floor(i/6)*3,'#796a52',1,1)
  p(x+9,y+10,'#a38a63',7,1)
  if(id.endsWith('love:1')&&choice!=null)p(x+17,y+17,'#796a52',choice===0?3:6,1)
  if(id.endsWith(':map')&&choice===0&&beat>=3){p(nx-2,ground-11,skin(npc),2,2)}
 }else if(apron||id==='ev:shepherd:story:2'){
  // Apron laid beside the wearer: full native clothing and short arms remain visible.
  p(x-5,y-3,'#b8a47a',20,17);p(x,y-8,'#b8a47a',10,6);p(x+6,y+5,'#8d7958',7,6);p(x+7,y+6,'#cbb78c',5,4)
  if(apron){p(x-13,y,'#cbb78c',7,8);if(choice===0){p(x-2,y+9,'#8d7958',6,5);p(px+18,ground-10,skin(null),2,2)}}
  else if(choice!=null)p(nx+11,ground-10,'#cbb78c',5,5)
 }else if(id==='ev:dexter:home:1'){
  // The lamb was born this morning; this home conversation is naming it, not a second birth.
  paper(x,y,25,15);sheep(x+3,y+4,true);if(choice!=null)p(x+3,y+12,'#8b7555',choice===0?8:12,1)
 }else if(id==='ev:dexter:count'){
  for(let i=0;i<6;i++)sheep(cx-119+i*17,f+13+i%2*5,true)
  paper(x,f+3,23,10);p(x+3,f+6,'#796a52',4,4);p(x+9,f+6,'#796a52',4,4);p(x+15,f+6,'#796a52',choice===1?6:4,4)
 }else if(id==='saw:lamb:firstBite'){
  sheep(nx-27,f+9,true)
  p(nx-8,f+1,'#7c9863',1,7);p(nx-12,f+1,'#a4b98b',7,3)
  if(beat===0)p(nx-10,f-2,'#d6b780',3,2)
  p(nx-2,ground-9,skin(npc),2,2)
  if(beat>=2)p(nx-20,f+5,'#a4b98b',4,2)
  paper(cx+58,f-7,10,9);p(cx+68,ground-10,skin(others[0]),2,2)
 }else if(id.endsWith('woolSort')){
  wool(x-11,f-4);wool(x+10,f-4,true)
  if(choice===0){p(px+21,f-1,'#b09a73',14,13);wool(px+21,f-6)}
  if(choice===1){wool(nx-13,f-5);p(nx-2,ground-9,skin(npc),2,2)}
 }else if(id==='ev:dexter:home:2'){
  paper(x,y,25,14);p(x+3,y+5,'#c5a97a',12,4);p(x+17,y+4,'#927276',3,4)
  // Packing is still ahead. These small marks show the offered bread and figs on a plan.
  if(choice===0){p(x+2,y+10,'#9fae9b',10,2)}else if(choice===1){p(x+17,y+9,'#927276',4,3)}
 }
}

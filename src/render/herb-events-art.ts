import {drawEventPrecipitation} from './event-precipitation'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawApothecaryFrontBackground} from './apothecary-front-background'
import {drawTeaRoomBackground} from './tea-room-background'
import {drawTeaFrontBackground} from './tea-front-background'
import {drawPastureGround} from './pasture-ground'
import {ICONS,ICON_PALETTE,writerPalette,PALETTE} from './sprites'
export const HERB_EVENT_IDS=['ev:basil:blend','ev:basil:love:2','ev:basil:story:2','ev:apothecary:story:3','ev:apothecary:story:2','ev:basil:love:1','ev:basil:mountain','ev:basil:home:2','ev:basil:story:1','ev:apothecary:small:dayOffTea','ev:apothecary:story:1','ev:basil:checkup','ev:basil:sort','ev:basil:home:1','ev:basil:short:spouseHabit','ev:basil:legend','ev:apothecary:small:shelf'] as const
export const isHerbEvent=(id:string)=>(HERB_EVENT_IDS as readonly string[]).includes(id)
export const HERB_TEA_IDS=['ev:basil:blend','ev:basil:love:2','ev:basil:love:1','ev:basil:legend','ev:apothecary:small:dayOffTea'] as const
export function herbEventPeople(id:string){
 const who=id.startsWith('ev:apothecary:')?'apothecary':'basil'
 return [who,...(id==='ev:apothecary:story:2'?['grandpa']:id==='ev:apothecary:story:3'?['basil']:id==='ev:basil:story:2'?['apothecary']:id==='ev:basil:sort'?['child']:id==='ev:basil:blend'||id==='ev:basil:legend'||id.endsWith('dayOffTea')?['poppy']:[])]
}
export function drawHerbEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=foot+8,selected=choice!=null
 const tea=(HERB_TEA_IDS as readonly string[]).includes(id),indoor=id.endsWith('dayOffTea'),vine=id==='ev:apothecary:story:2',rain=id==='ev:basil:mountain',sniff=id==='ev:basil:sort'&&choice===1&&beat>=3
 g.imageSmoothingEnabled=false
 if(indoor)drawTeaRoomBackground(p,w,h,foot-24)
 else if(tea)drawTeaFrontBackground((x,y,c,a,b)=>p(x,y,c==='#817f91'?'#d7d9b8':c,a,b),w,h,foot-15)
 else if(vine){
  drawPastureGround(p,w,h,foot-18)
  // Reuse the village's 16-pixel grape trellis motif from decor.ts.
  for(let i=0;i<5;i++){const x=cx-133+i*49,y=foot-63-i%2*6;p(x+2,y+2,'#b17640',2,12);p(x+12,y+2,'#b17640',2,12);p(x,y+1,'#b17640',16,2);p(x+1,y,'#76ae45',14,3);p(x+6,y+3,'#8741a3',3,3)}
 }else drawApothecaryFrontBackground(p,w,h,foot-21,rain?60:0)
 if(rain)drawEventPrecipitation(p,w,h,t)
 if(id==='ev:basil:sort'&&choice===0)p(0,0,'#b7a5a5',w,Math.max(1,foot-105))
 const stamp=(rows:readonly string[],pal:Record<string,string>,x:number,y:number)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx,y+yy,pal[c])}))
 const table=(x:number,width=48)=>{p(x,foot+4,'#b69871',width,3);p(x+2,foot+7,'#866548',3,12);p(x+width-5,foot+7,'#866548',3,12)}
 const bench=(x:number)=>{p(x-2,foot+6,'#a8835e',22,3);p(x,foot+9,'#76583e',3,10);p(x+15,foot+9,'#76583e',3,10)}
 const herb=(x:number,y:number,type=0)=>{const c=['#7caa75','#9ca882','#7e8e73'][type];p(x,y,c,type===1?7:5,2);p(x+2,y-2,c,2,6);if(type===2)p(x+3,y,'#a592a8',1,2)}
 const cup=(x:number,y:number)=>{p(x,y,'#748d83',7,6);p(x+1,y,'#9a7450',5,1);p(x+7,y+2,'#748d83',2,3)}
 const paper=(x:number,y:number,lines=2)=>{p(x,y,'#eee0bd',24,12);for(let i=0;i<lines;i++)p(x+3,y+3+i*2,'#a08964',16,1)}
 const book=(x:number,y:number,open=true)=>{p(x,y,'#a48a66',open?26:13,12);p(x+1,y+1,'#eee0bd',open?24:11,10);if(open){p(x+13,y+1,'#b8a382',1,10);herb(x+4,y+5,1);p(x+17,y+4,'#a08964',6,1);p(x+17,y+7,'#a08964',5,1)}}
 const basket=(x:number,y:number)=>{p(x,y,'#ad9168',24,10);p(x+2,y-2,'#c5ab80',20,2);for(let i=0;i<3;i++)herb(x+3+i*6,y-3,i)}
 const pot=(x:number,y:number,dry=false,leaves=3)=>{p(x,y,'#ad8461',13,8);p(x-1,y-1,'#c6a077',15,2);p(x+6,y-14,'#708b5b',1,14);if(leaves===6){for(let i=0;i<3;i++){p(x+1,y-13+i*4,'#8ea76e',4,2);p(x+7,y-13+i*4,'#8ea76e',4,2)}}else{p(x+3,y-15,'#8ea76e',7,3);p(x+1,y-7,dry?'#d1bc78':'#8ea76e',5,3);p(x+8,y-7,dry?'#d1bc78':'#8ea76e',5,3)}}
 const skin=(a:FinalePerson)=>a.who==='writer'?writerPalette('spring',a.avatar?withLookDefaults(a.avatar):undefined).s:PALETTE.s
 const seated=id==='ev:basil:story:1'||indoor,playerSit=indoor&&choice===0
 if(seated)bench(cx+25);if(playerSit)bench(cx-55)
 if(['ev:basil:sort','ev:basil:home:1','ev:apothecary:story:3','ev:apothecary:small:shelf','ev:apothecary:story:1','ev:basil:blend','ev:basil:story:2'].includes(id)||indoor)table(cx-12)
 const px=sniff?cx-27:cx-55,nx=cx+25
 person(p,px,ground,av,'right','writer',sniff||playerSit)
 person(p,nx,ground,npc.avatar,'left',npc.who,sniff||seated)
 if(others[0]&&(id!=='ev:basil:sort'||sniff))person(p,cx+85,ground,others[0].avatar,'left',others[0].who)
 if(id==='ev:basil:mountain'||id==='ev:basil:love:1'){
  const planning=rain&&choice===0&&beat>=4,closed=rain&&choice===1&&beat>=4
  if(planning){p(nx-37,foot-17,'#eee0bd',34,26);for(let i=0;i<30;i++)p(nx-35+Math.floor(i/10)*10,foot-15+i%10*2,'#a08964',7,1);p(nx-33,foot+6,'#8d9990',2,2);p(nx-31,foot+7,'#8d9990',6,1);p(nx-25,foot+6,'#8d9990',4,1)}else book(nx-26,foot-8,!closed)
  if(id==='ev:basil:love:1'){p(nx-8,foot-5,'#c5856f',2,2);if(selected)p(nx-17,foot-3,'#c5856f',2,2)}
 }else if(id==='ev:basil:sort'){
  for(let i=0;i<12;i++){const species=i%3,x=choice===0?cx-9+species*13:cx-10+i%5*6,y=foot+3+Math.floor(i/5)*3;herb(x,y,species)}
 }else if(id==='ev:basil:checkup'){
  const gift=choice===0&&beat>=2
  if(gift){const gx=beat>=3?px+15:nx-26;paper(gx,foot-4,0);for(let i=0;i<5;i++)p(gx+3+i*3,foot-2,'#cfb6aa',2,2);if(beat>=3){paper(gx,foot-4,0);p(gx+2,foot-2,'#b8a382',20,1)}}
  if(choice===1){p(nx-2,ground-9,'#c18573',2,2);if(beat>=2){const full=npc.avatar?withLookDefaults(npc.avatar):undefined,pal=npc.who==='writer'?writerPalette('spring',full):PALETTE;p(nx-2,ground-10,pal.r??pal.V,2,5)}}
 }else if(id==='ev:basil:story:1'){
  basket(nx+29,foot+8);p(nx-2,ground-8,skin(npc),2,3);if(selected){paper(nx-26,foot-4,0);p(nx-21,foot,'#a08964',3,1);p(nx-14,foot,'#a08964',3,1)}
 }else if(id==='ev:basil:story:2'){
  const handed=choice===1;basket(handed?cx+61:nx-26,foot-5)
 }else if(id==='ev:apothecary:story:1'){
  pot(nx-25,foot-4,true);if(choice===1)p(nx-15,foot-20,'#b1bd83',2,3)
 }else if(id==='ev:apothecary:story:2'){
  // Asking the vineyard elder; choosing a future soil check does not move the party yet.
  p(cx+93,ground-10,skin(others[0]??npc),2,3)
 }else if(id==='ev:apothecary:story:3'){
  pot(cx+70,foot-2,true);if(others[0])p(cx+83,foot-2,skin(others[0]),2,2);const x=nx-26;paper(x,foot-8,0)
  for(let i=1;i<6;i++)p(x+i*4,foot-7,'#a08964',1,10)
  for(const i of [2,5]){p(x+i*4+1,foot-4,'#a08964',2,1);p(x+i*4+1,foot-2,'#a08964',2,1)}
  if(choice===0)for(const i of [2,5])p(x+i*4+1,foot-5,'#ab8660',2,7)
  if(choice===2){p(x-5,foot-8,'#eee0bd',5,12);p(x-5,foot-7,'#a08964',1,10)}
 }else if(id==='ev:apothecary:small:shelf'){
  const x=cx+48;for(let y=foot-28;y<foot+9;y+=18)p(x,y,'#ad8b61',46,3)
  for(let i=0;i<6;i++){const xx=x+3+i%3*13,yy=foot-39+Math.floor(i/3)*18;stamp(ICONS.jar,ICON_PALETTE,xx,yy);p(xx+2,yy+4,'#eee0bd',5,3);p(xx+3,yy+5,'#a08964',3,1)}
  if(choice===0)stamp(ICONS.jar,ICON_PALETTE,nx-13,foot-4)
 }else if(id==='ev:basil:home:1'){
  p(cx-13,foot-8,'#9b7953',40,13);p(cx-11,foot-7,'#cfba96',36,10);stamp(ICONS.jar,ICON_PALETTE,cx-8,foot-5);stamp(ICONS.herb,ICON_PALETTE,cx+3,foot-4);p(cx+15,foot-5,'#eee0bd',8,6)
  if(choice===0)stamp(ICONS.honey,ICON_PALETTE,cx+3,foot-5)
  if(choice===1){p(cx+4,foot-5,'#eee0bd',18,8);p(cx+7,foot-2,'#a08964',12,1)}
 }else if(id==='ev:basil:short:spouseHabit'){
  paper(nx-26,foot-4,0);if(choice===0){p(nx-17,foot-1,'#a08964',8,4)}else if(choice===1){p(nx-21,foot-1,'#a08964',4,4);p(nx-13,foot-1,'#a08964',4,4)}else p(nx-22,foot+3,'#a08964',15,1)
 }else if(id==='ev:basil:blend'){
  // Posted menu and current tea, with mint and honey; no mountain expedition is depicted.
  paper(cx-105,foot-58,2);cup(nx-15,foot-2);stamp(ICONS.honey,ICON_PALETTE,nx-31,foot-3);herb(nx-23,foot-2)
  if(choice===0)p(nx-7,foot-6,'#e5ddc5',1,3)
 }else if(indoor){
  cup(nx-15,foot-2);if(playerSit)cup(px+15,foot-2);pot(cx-82,foot-43,false,6)
 }else if(id==='ev:basil:legend'){
  // A conversation about an old feast: no present-day sleeping villagers.
 }else if(id==='ev:basil:home:2')basket(nx+29,foot+8)
 // The delayed-closing dialogue has no child still present and no new medicine reward.
}

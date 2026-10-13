import type {Avatar} from '../engine/avatar'
import type {LivingKind} from '../engine/scenic-kinds'
import type {Book} from '../engine/types'
import type {Binding} from '../engine/binding'
import type {FacilityId} from '../engine/village-sites'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {libraryPalette,libraryBookRows} from './library-art'
import {EXPANSION_PROPS,EXPANSION_VIEWS} from './expansion-prop-art'
import {VILLAGE_BENCH_ART} from './village-bench-art'
import {FURNI_PALETTE} from './furniture-art'
export const LIVING_PHOTO_TIME=8
export interface LivingDetails {guests:FinalePerson[];host:FinalePerson|null;book:Book;binding?:Binding;facility:FacilityId;decor:boolean}
type Px=(x:number,y:number,c:string,w?:number,h?:number)=>void
const ease=(n:number)=>{const k=Math.max(0,Math.min(1,n));return k*k*(3-2*k)}
export function drawLivingMoment(g:CanvasRenderingContext2D,kind:LivingKind,w:number,h:number,t:number,avatar:Avatar|null,d:LivingDetails){
 g.imageSmoothingEnabled=false
 const p:Px=(x,y,c,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),floor=Math.round(h*.68)
 const outdoor=kind==='facilityFinished'
 p(0,0,outdoor?'#c7d5b1':'#d1c0a6',w,h);p(0,floor,outdoor?'#a3bb86':'#b09572',w,h-floor)
 if(!outdoor)for(let y=floor+7;y<h;y+=9)p(0,y,'#9c7b58',w)
 const window=(x:number,y:number)=>{p(x-3,y-3,'#a78a60',40,40);p(x,y,kind==='firstDinner'?'#cfab98':'#dce1ca',34,34);p(x,y+18,kind==='firstDinner'?'#9d8a89':'#b5c69b',34,16);p(x+16,y,'#b89c74',2,34);p(x,y+16,'#b89c74',34,2)}
 const table=(x:number,y:number,ww:number)=>{p(x,y,'#ba9a70',ww,6);p(x+4,y+6,'#7e5e42',3,13);p(x+ww-7,y+6,'#7e5e42',3,13)}
 const paint=(rows:readonly string[],pal:Record<string,string>,x:number,y:number,scale=1)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*scale,y+yy*scale,pal[c],scale,scale)}))
 if(kind==='readingFinished'){
  window(cx-114,floor-72)
  for(const x of [cx+49,cx+81]){p(x,floor-67,'#876b4c',25,65);p(x+3,floor-63,'#61503a',19,55);for(let i=0;i<3;i++){for(let j=0;j<3;j++)p(x+4+j*5,floor-61+i*18,['#c8d1b8','#d1b998','#b5c6d6'][j],3,12);p(x+2,floor-46+i*18,'#b79b73',21,2)}}
  d.guests.slice(0,3).forEach((guest,i)=>person(p,cx-55+i*32,floor+8,guest.avatar,'down',guest.who,true))
  table(cx-71,floor-2,113)
  for(let i=0;i<Math.max(1,Math.min(3,d.guests.length));i++){const x=cx-62+i*31;p(x,floor-4,'#947b58',15,2);p(x+1,floor-4,t<3?'#e6d5af':'#bba781',12,1)}
  person(p,cx-95,floor+15,avatar,'right')
 }else if(kind==='firstDinner'){
  window(cx+57,floor-70);p(cx-112,floor-60,'#9b825f',30,58);p(cx-108,floor-56,'#705d46',22,54)
  if(t<5){
   if(d.host)person(p,cx+17,floor+9,d.host.avatar,'left',d.host.who,true)
   person(p,cx-49,floor+9,avatar,'right','writer',true)
   table(cx-31,floor-1,53)
   for(const x of [cx-21,cx+4]){p(x,floor-5,'#ebdcc0',14,3);p(x+3,floor-7,'#a78b64',8,3)}
  }else{
   const a=ease((t-5)/3)
   if(d.host)person(p,cx-53,floor+13,d.host.avatar,'left',d.host.who)
   person(p,cx-73-35*a,floor+15,avatar,'left','writer',false,a<1,t)
   table(cx-20,floor-1,52);p(cx-10,floor-5,'#ebdcc0',13,3)
  }
 }else if(kind==='coverFinished'){
  window(cx-109,floor-72)
  table(cx-40,floor-1,74);person(p,cx-9,floor+15,avatar,'up')
  const pal:Record<string,string>=libraryPalette(d.book,d.binding)
  const rows=libraryBookRows(d.book,d.binding,undefined,false,true)
  for(let y=0;y<rows.length;y+=2)for(let x=0;x<rows[y].length;x+=2){const c=rows[y][x];if(c!=='.'&&pal[c])p(cx+2+x/2,floor-17+y/2,pal[c])}
  p(cx-27,floor-8,'#e7d5af',16,5);p(cx-25,floor-12,'#8b7457',8,4)
  if(t>=4){
   p(cx+53,floor-93,'#9f8965',58,76);p(cx+55,floor-91,'#e4d8b9',54,72)
   paint(rows,pal,cx+58,floor-88,2)
  }
 }else if(kind==='childLetterReceived'){
  window(cx+52,floor-73)
  table(cx-47,floor-1,72)
  person(p,cx-13,floor+13,avatar,'down','writer',true)
  p(cx-10,floor+1,'#a38862',17,7);p(cx-9,floor,'#eee0bd',15,6)
  for(let i=0;i<3;i++)p(cx-7,floor+1+i*2,'#a6926f',11,1)
  p(cx-36,floor-5,'#dfceaa',18,8);p(cx-36,floor-5,'#efe4c8',18,2);p(cx-29,floor-2,'#b7976c',4,3)
 }else{
  p(cx-97,floor+12,'#bdaf89',195,12)
  const x=cx-48
  if(d.facility==='longBench')paint(VILLAGE_BENCH_ART.rows,FURNI_PALETTE,x,floor-2,2)
  else if(d.facility==='flowerBed')for(let i=0;i<3;i++)paint(EXPANSION_PROPS.flowerBorder.rows,FURNI_PALETTE,x+i*32,floor-3,2)
  else if(d.facility==='shade')paint(EXPANSION_VIEWS.shadeComplete.down.rows,FURNI_PALETTE,x,floor-70,2)
  else paint(EXPANSION_PROPS.restSign.rows,FURNI_PALETTE,cx-16,floor-17,2)
  person(p,cx-85,floor+24,avatar,'right')
  d.guests.slice(0,3).forEach((guest,i)=>person(p,cx-35+i*33,floor+34,guest.avatar,i===2?'left':'up',guest.who))
  if(d.decor&&d.facility==='longBench')paint(EXPANSION_PROPS.cushionPattern.rows,FURNI_PALETTE,cx-14,floor-3)
 }
}

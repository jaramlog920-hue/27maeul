import {withLookDefaults,type Avatar} from '../engine/avatar'
import {person} from './milestone-moments-art'
import {drawTravelTownBackground} from './travel-town-background'
import {boat} from './shore-kit'

/** The unnamed local owner is not Poppy, his parent or another visiting village NPC. */
export const harborBaker=withLookDefaults({name:'항구 빵집 주인',look:'m',skin:2,hairFront:9,hairBack:0,top:7,bottom:2,acc:0,hairColor:[28,32,28]})

export function drawHarborTrip(g:CanvasRenderingContext2D,w:number,h:number,t:number,av:Avatar|null,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=f+8
 g.imageSmoothingEnabled=false
 drawTravelTownBackground(p,w,h,f-18)
 const bag=(x:number)=>{p(x,ground-9,'#b29167',11,9);p(x+1,ground-8,'#d0b58c',9,6);p(x+4,ground-12,'#896d4f',3,3);p(x+5,ground-10,'#e0c89e',1,3)}
 if(beat===0){
  // Reuse the travel town's stone quay and palette, adding the arrival's actual harbor objects.
  p(0,0,'#d4d9c3',w,Math.max(1,f-58));p(0,f-58,'#89b2aa',w,46)
  for(let i=0;i<8;i++)for(let x=(i*17+Math.floor(t*3))%43;x<w;x+=43)p(x,f-54+i*5,'#b6ccc0',11,1)
  p(0,f-12,'#a49d85',w,6);p(0,f-6,'#c8b58f',w,7)
  boat(p,cx+2,f-31,98,false,true)
  // Distant tied boats have separate masts and no invented passengers.
  for(const x of [cx-86,cx+118]){p(x,f-86,'#80664c',2,54);p(x-8,f-82,'#a88d6b',19,2);p(x-11,f-33,'#8d5829',25,4);p(x-8,f-29,'#b17640',19,3)}
  const wing=Math.floor(t*3)%2
  for(const x of [cx-112,cx+70]){p(x,f-91,'#f4efdb',3,1);p(x-3,f-92-wing,'#f4efdb',3,1);p(x+3,f-92-wing,'#f4efdb',3,1)}
  for(const x of [cx-138,cx+110]){
   p(x,ground-5,'#a7875e',29,3);p(x+2,ground-2,'#76583e',3,10);p(x+24,ground-2,'#76583e',3,10)
   p(x-1,ground-38,'#947450',2,34);p(x+28,ground-38,'#947450',2,34);p(x-3,ground-40,'#d1b58a',35,5)
   p(x+3,ground-12,'#a67d54',8,7);p(x+4,ground-14,'#ceb18a',6,3);p(x+15,ground-11,'#8f9d8b',9,6);p(x+16,ground-13,'#b4bba0',7,3)
  }
  person(p,cx-55,ground,av,'right');bag(cx-71)
  return
 }
 // The same travel-town alley ends at a small bakery; no family member is summoned from home.
 p(cx+2,f-45,'#b4956d',28,11);p(cx+4,f-43,'#d5b88a',24,7)
 p(cx+11,f-42,'#dab581',11,4);p(cx+13,f-44,'#ead2a5',7,3)
 p(cx-16,ground-5,'#b49469',38,4);p(cx-13,ground-1,'#745638',3,10);p(cx+16,ground-1,'#745638',3,10)
 const moving=beat>=3&&t<1.4,x=beat>=3?Math.round(cx-55+20*Math.min(1,t/1.4)):cx-55
 person(p,x,ground,av,'right','writer',false,moving,t)
 person(p,cx+25,ground,harborBaker,'left')
 // Luggage stays where it was set down while the traveler steps toward the wrapped loaf.
 bag(cx-71)
 if(beat>=3){
  // Bread is wrapped on the counter; folds meet the board and stay below both faces.
  p(cx-13,ground-11,'#e7d5af',18,6);p(cx-11,ground-13,'#dab581',12,5);p(cx-13,ground-8,'#f0e2c2',18,3)
  p(cx-12,ground-10,'#c4ac84',2,3);p(cx+2,ground-10,'#c4ac84',2,3);p(cx-5,ground-8,'#b99c72',1,3)
 }else{
  p(cx-3,ground-6,'#e3d4b2',20,1);p(cx+1,ground-11,'#b28754',12,5);p(cx+2,ground-13,'#dab581',10,4)
  p(cx+4,ground-12,'#eee0b6',1,2);p(cx+8,ground-12,'#eee0b6',1,2)
 }
}

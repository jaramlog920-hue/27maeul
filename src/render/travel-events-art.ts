import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawTravelTownBackground} from './travel-town-background'
import {drawRiverRestBackground} from './river-rest-background'
import {writerPalette,ICONS,ICON_PALETTE} from './sprites'
import {drawHarborTrip} from './harbor-trip-art'
export const TRAVEL_EVENT_IDS=['growth:travel:full','trip:hillTown','trip:harbor'] as const
export const isTravelEvent=(id:string)=>(TRAVEL_EVENT_IDS as readonly string[]).includes(id)
/** Existing Wendell/poppy slot supplies the family skin/hair; the brother stays in his village. */
export const travelEventPeople=(id:string):string[]=>id==='trip:hillTown'?['poppy']:[]
export function travelSister(reference:FinalePerson){return withLookDefaults({...reference.avatar,name:'웬델의 동생',look:'f',hairFront:1,hairBack:1,acc:0})}
export function drawTravelEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,_others:FinalePerson[],beat:number){
 if(id==='trip:harbor'){drawHarborTrip(g,w,h,t,av,beat);return}
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=f+8,px=cx-55
 g.imageSmoothingEnabled=false
 const icon=(name:string,x:number,y:number,k=2)=>ICONS[name]?.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&ICON_PALETTE[c])p(x+xx*k,y+yy*k,ICON_PALETTE[c],k,k)}))
 if(id==='growth:travel:full'){
  drawRiverRestBackground(p,w,h,t,f-46,f-15,false,false)
  // This unlock notice is a route sketch at the shore, not a completed boat ride.
  p(cx-2,ground-5,'#b3976b',40,4);p(cx+1,ground-1,'#80684e',3,12);p(cx+32,ground-1,'#80684e',3,12)
  p(cx+2,ground-22,'#eee0bf',30,18);p(cx+6,ground-18,'#a9b491',7,4);p(cx+19,ground-18,'#a9b491',8,4);p(cx+8,ground-9,'#97afa5',17,2);p(cx+9,ground-10,'#967959',7,2)
  person(p,px,ground,av,'right','writer')
  return
 }
 drawTravelTownBackground(p,w,h,f-18,true)
 // A drying rack beside the tea house: leaves first, the same handful leaves the tray in beat 2.
 const rx=cx+90,ry=ground-2
 p(rx,ry,'#aa8b60',47,4);p(rx+3,ry+4,'#846849',3,12);p(rx+41,ry+4,'#846849',3,12)
 p(rx+2,ry-10,'#bfa57a',43,11);p(rx+4,ry-8,'#d1bd91',39,6)
 for(let i=0;i<12;i++)if(beat<2||i>=4)p(rx+5+i%6*6,ry-7+Math.floor(i/6)*4,i%2?'#8a9871':'#a2aa7d',4,2)
 person(p,px,ground,av,'right','writer')
 if(beat>=1){
  const sister=travelSister(npc),from=cx+57,to=beat>=2?cx-20:cx+25,x=Math.round(from+(to-from)*Math.min(1,t/1.4)),moving=t<1.4
  person(p,x,ground,sister,'left','writer',false,moving,t,.75,1)
  if(beat>=2){
   // Native hand at the edge of her body; gift remains outside both faces and below their shoulders.
   const pal=writerPalette('spring',sister)
   p(x-2,ground-8,pal.s,2,2);icon('dryFlowers',x-10,ground-9,1)
  }
 }
}

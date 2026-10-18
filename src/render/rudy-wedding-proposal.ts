import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {WEDDING_ARCH,WEDDING_PROPS} from './wedding-art'
import {FURNI_PALETTE} from './furniture-art'
import {spriteRows,writerPalette,PALETTE} from './sprites'

/** One review proposal only. Existing game weddings remain unchanged until reviewed. */
export {weddingGuestPlaces as rudyWeddingGuestPlaces} from './wedding-ceremony-layout'
import {weddingGuestPlaces as rudyWeddingGuestPlaces} from './wedding-ceremony-layout'

export function drawRudyWeddingProposal(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,spouse:FinalePerson,guests:FinalePerson[],beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const stamp=(rows:readonly string[],palette:Record<string,string>,x:number,y:number)=>rows.forEach((row,yy)=>[...row].forEach((c,xx)=>{if(c!=='.'&&palette[c])p(x+xx,y+yy,palette[c])}))
 const cx=Math.round(w/2),f=Math.max(112,Math.round(h*.54))
 p(0,0,'#56586b',w,h);p(0,Math.max(0,f-94),'#7c8571',w,h);p(0,f-27,'#9d9a7b',w,h)
 for(let i=0;i<42;i++)p((i*59+17)%w,f-20+(i*17)%Math.max(20,h-f+16),'#89866b',2)
 // Lanterns hang behind the guests, away from heads and the open centre.
 for(const dx of [-123,-68,70,123]){
  const x=cx+dx,y=7
  p(x,y,'#876e51',2,19);p(x-4,y-2,'#b0976c',10,10);p(x-2,y,'#e2c389',6,6)
  p(x,y+1+Math.floor(t*2)%2,'#f3ddb0',2,3)
 }
 for(const slot of rudyWeddingGuestPlaces(guests.length,w,f)){
  const a=guests[slot.index],facing=slot.x<cx?'right':'left'
  // Stagger a brief greeting. Native wave sprites keep their original short arms.
  const wave=beat>=2&&Math.floor(t*2+slot.index*1.7)%11===0
  if(wave){
   const av=a.avatar?withLookDefaults(a.avatar):undefined
   const rows=spriteRows(a.who,facing,{avatar:av,pose:'wave',frame:0,blink:false,growth:a.growth??1,short:a.short,elder:a.elder,season:a.season??'spring'})
   const palette=a.who==='writer'?writerPalette(a.season??'spring',av):PALETTE
   rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.'&&palette[c])p(slot.x+x*2,slot.foot-rows.length*2+y*2,palette[c],2,2)}))
  }else person(p,slot.x,slot.foot,a.avatar,Math.floor(t/3+slot.index)%7===0?'down':facing,a.who,false,false,t,a.growth??1,a.short,a.elder,a.season)
 }
 stamp(WEDDING_ARCH.down.rows,FURNI_PALETTE,cx-32,f-47)
 stamp(WEDDING_PROPS.flowerPot.rows,FURNI_PALETTE,cx-47,f-27)
 stamp(WEDDING_PROPS.flowerPot.rows,FURNI_PALETTE,cx+33,f-27)
 stamp(WEDDING_PROPS.candlePair.rows,FURNI_PALETTE,cx-45,f-6)
 // Rudy's original completed table and two native feast trays stay at his side.
 const tx=cx+4,ty=f+54
 p(tx+3,ty+4,'#896c4a',5,22);p(tx+54,ty+4,'#896c4a',5,22)
 p(tx+6,ty+17,'#a38259',50,4);p(tx+7,ty+17,'#c29c6b',48)
 p(tx,ty,'#98744c',64,7);p(tx+1,ty,'#dbb887',62,3)
 for(let x=tx+16;x<tx+63;x+=16)p(x,ty,'#b69467',1,3)
 stamp(WEDDING_PROPS.feastTray.rows,FURNI_PALETTE,tx+9,ty-12)
 stamp(WEDDING_PROPS.feastTray.rows,FURNI_PALETTE,tx+35,ty-12)
 // The couple stay visible in front of the arch. Introduction uses a short walk,
 // never an extended arm or a torso hidden behind the banquet table.
 const approach=beat===1?Math.min(1,t/1.8):0
 person(p,cx-21,f+5,avatar,beat>=2?'down':'right','writer',false,false,t)
 const sx=cx+2+Math.round(approach*13),sy=f+5+Math.round(approach*8)
 person(p,sx,sy,spouse.avatar,beat>=2?'down':beat===1&&approach===1?'right':'left',spouse.who,false,beat===1&&approach<1,t,spouse.growth??1,spouse.short,spouse.elder,spouse.season)
 stamp(WEDDING_PROPS.petalPatch.rows,FURNI_PALETTE,cx-19,f+12)
 // A small fire beside the ceremony, with an unobstructed path to the couple.
 const fx=cx-61,fy=f+35
 p(fx-12,fy+5,'#6f6551',27,5);p(fx-14,fy+3,'#88765a',5,6);p(fx+13,fy+3,'#88765a',5,6)
 const pulse=Math.floor(t*3)%2
 for(let y=0;y<16;y++){const span=3+Math.floor(y/3)*2;p(fx-Math.floor(span/2)+(y<5?pulse:0),fy-13+y,'#cc8b55',span);if(y>7)p(fx-1,fy-13+y,'#edd093',3)}
}


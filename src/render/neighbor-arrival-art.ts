import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawApothecaryFrontBackground} from './apothecary-front-background'
import {drawCarpenterRoomBackground} from './carpenter-room-background'
import {drawWeaverRoomBackground} from './weaver-room-background'
import {spriteRows,writerPalette,PALETTE} from './sprites'

export const NEIGHBOR_ARRIVAL_IDS=['movedIn:apothecary','movedIn:carpenter','movedIn:weaver'] as const
export const isNeighborArrival=(id:string)=>(NEIGHBOR_ARRIVAL_IDS as readonly string[]).includes(id)
export const neighborArrivalPeople=(id:string)=>[id.split(':')[1]]

/** Introductory cuts show the named new workshop without moving the actual morning queue. */
export function drawNeighborArrival(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),ground=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),loom=id==='movedIn:weaver',herb=id==='movedIn:apothecary'
 g.imageSmoothingEnabled=false
 if(herb)drawApothecaryFrontBackground(p,w,h,ground-8)
 else if(loom)drawWeaverRoomBackground(p,w,h,ground-24)
 else drawCarpenterRoomBackground(p,w,h,ground-29)
 const box=(x:number,y:number)=>{p(x,y,'#a18256',23,12);p(x+2,y+2,'#c1a275',19,8);p(x+6,y,'#8a6b45',1,12);p(x+17,y,'#8a6b45',1,12);p(x,y+4,'#b99d72',23,2)}
 if(herb){
  box(cx-8,ground-11)
  p(cx-2,ground-17,'#ad8461',10,7);p(cx-3,ground-18,'#c6a077',12,2)
  p(cx+2,ground-29,'#708b5b',1,11);p(cx-2,ground-27,'#8ea76e',9,3);p(cx+1,ground-31,'#8ea76e',7,3)
 }else if(loom){
  box(cx-12,ground-11)
  for(let i=0;i<2;i++){const x=cx-8+i*10;p(x,ground-18,'#af8b61',7,2);p(x+1,ground-16,i?'#c7ad96':'#a5b7a5',5,6);p(x,ground-10,'#af8b61',7,2)}
 }else{
  // Cover boards stay stock material; no finished shelf or equipment is handed over.
  p(cx-12,ground-8,'#9d7652',35,5);p(cx-9,ground-3,'#78553c',3,8);p(cx+17,ground-3,'#78553c',3,8)
  for(let i=0;i<3;i++){p(cx-9+i*9,ground-15,'#b99162',7,7);p(cx-8+i*9,ground-14,'#d0b186',1,5)}
  box(cx+77,ground-11)
 }
 person(p,cx-48,ground,av,'right')
 const arriving=loom&&beat===0,progress=arriving?Math.min(1,Math.max(0,t/.8)):1,nx=cx+25+Math.round((1-progress)*20),waving=!arriving&&t<.55
 if(waving){
  const full=npc.avatar?withLookDefaults(npc.avatar):undefined,rows=spriteRows(npc.who,'left',{frame:0,blink:false,avatar:full,short:npc.short,pose:'wave'}),pal=npc.who==='writer'?writerPalette('spring',full):PALETTE
  rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&pal[c])p(nx+x*2,ground-rows.length*2+y*2,pal[c],2,2)}))
 }else person(p,nx,ground,npc.avatar,'left',npc.who,false,arriving&&progress<1,t,1,npc.short)
}

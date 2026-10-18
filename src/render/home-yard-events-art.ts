import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {animalRows,ANIMAL_PALETTE,spriteRows,writerPalette,PALETTE} from './sprites'
import {drawHomeYardBackground} from './home-yard-background'
import {homeYardEventContext,type HomeYardEventContext} from './home-yard-event-context'

export const HOME_YARD_EVENT_IDS=['companionJoined','strays','homeMailbox','reedRack'] as const
export const isHomeYardEvent=(id:string)=>(HOME_YARD_EVENT_IDS as readonly string[]).includes(id)
export function homeYardEventPeople(id:string):string[]{return id==='companionJoined'?['child']:id==='homeMailbox'?['postman']:id==='reedRack'?['fisher']:[]}

/** Same native greeting pose as the world renderer; no hand/arm extension or face-covering prop. */
function greeting(p:(x:number,y:number,c:string,a?:number,b?:number)=>void,npc:FinalePerson,x:number,ground:number){
 const av=npc.avatar?withLookDefaults(npc.avatar):undefined,rows=spriteRows(npc.who,'down',{frame:0,blink:false,pose:'wave',avatar:av,short:npc.short}),pal=npc.who==='writer'?writerPalette('spring',av):PALETTE
 rows.forEach((r,y)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*2,ground-rows.length*2+y*2,pal[c],2,2)}))
}
/** Shared read-only yard story renderer. */
export function drawHomeYardEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,beat:number,context:HomeYardEventContext=homeYardEventContext()){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),ground=Math.round(h>w?h*.54:h<=170?h*.69:h*.6)+8,f=ground-10
 g.imageSmoothingEnabled=false
 if(id==='reedRack'){
  // Camera follows the saved rack; changing its world tile changes the house's relative offset.
  const dx=(8-context.reedRack.x)*14,dy=(8-context.reedRack.y)*14
  drawHomeYardBackground(p,w,h,f-35,{x:dx,y:dy})
  const rx=cx+8,top=ground-39
  if(context.rackPlaced){
   p(rx+6,top,'#8d5829',6,39);p(rx+36,top,'#8d5829',6,39)
   p(rx+3,top,'#b17640',42,6);p(rx+6,top+24,'#b17640',36,6);p(rx+6,top+1,'#c39157',36,1)
   for(const [dx,len,c] of [[12,21,'#ddd188'],[21,24,'#bfb964'],[30,21,'#ddd188']] as const){
    p(rx+dx,top+6,c,6,7)
    for(let j=0;j<3;j++){const sway=Math.round(Math.sin(t*2)*.5);p(rx+dx+j*2+sway,top+13,c,1,len-7)}
    p(rx+dx,top+8,'#9c8753',6,2)
   }
   p(rx+45,ground-9,'#ded2ae',17,9);p(rx+46,ground-9,'#eee3c5',15,7)
  }
  const waving=beat>=3&&t<.55,leaving=beat>=3&&t>=.55,nx=Math.round(cx+74+(leaving?Math.min(1,(t-.55)/1.4)*30:0))
  person(p,cx-29,ground,av,'right')
  if(waving)greeting(p,npc,nx,ground)
  else person(p,nx,ground,npc.avatar,leaving?'right':'left',npc.who,false,leaving&&t<1.95,t,1,npc.short)
  return
 }
 drawHomeYardBackground(p,w,h,f)
 if(id==='homeMailbox'){
  // Original legacy narration: the wooden box is left of the door, separate from today's basket.
  const door=cx-101,box=door-27
  p(door,f-39,'#9f7852',20,43);p(door+3,f-36,'#75583f',14,38);p(door+14,f-16,'#d0b17e',2,2)
  if(beat>=2||beat===1&&t>=.65){p(box+7,f-10,'#8d6948',3,20);p(box,f-22,'#ad8a5e',19,13);p(box+2,f-20,'#c2a375',15,9);p(box+3,f-18,'#654f3c',13,2);p(box-1,f-24,'#795b43',21,3)}
  person(p,cx-35,ground,av,'left')
  const nx=beat===0?cx-68:beat===1?Math.round(cx-68-Math.min(1,t/.65)*35):cx-103
  person(p,nx,ground,npc.avatar,'left',npc.who,beat===1&&t>=.65,beat===1&&t<.65,t,1,npc.short)
  return
 }
 const petGround=ground-18
 person(p,cx-35,petGround,av,'left')
 if(id==='companionJoined'&&beat>=1)person(p,cx+110,petGround,npc.avatar,'left',npc.who,false,false,0,1,npc.short)
 const progress=Math.min(1,Math.max(0,t/1.3))
 for(const kind of ['cat','dog'] as const){
  const owned=id==='companionJoined'&&context.companion?.kind===kind,other=id==='companionJoined'&&context.childPet===kind
  if(id==='companionJoined'&&!owned&&!other)continue
  const start=cx+(context.strays[kind].x-context.front.x)*20,target=owned?cx-10:other&&beat>=1?cx+80:start
  // Once adopted it stays beside the player; the other pet takes a separate foreground lane.
  const movement=owned&&beat>=1?1:progress,x=Math.round(start+(target-start)*(owned?Math.min(1,movement/.65):movement)),petFloor=Math.round(petGround+24-(owned?16*Math.max(0,(movement-.65)/.35):0))
  const rows=animalRows(kind,'baby',other&&beat>=1?'right':'left'),pal=ANIMAL_PALETTE[kind]
  rows.forEach((r,y)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*2,petFloor-rows.length*2+y*2,pal[c],2,2)}))
 }
}

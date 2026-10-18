import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawForgeRoomBackground} from './forge-room-background'
import {drawForgeYardBackground} from './forge-yard-background'
import {drawRiverRestBackground} from './river-rest-background'
import {spriteRows} from './sprites'
export const SMITH_WORK_IDS=['ev:tilly:love:2','ev:tilly:tongs','ev:tilly:busy','ev:smith:small:earlyClose'] as const
export const isSmithWork=(id:string)=>(SMITH_WORK_IDS as readonly string[]).includes(id)
export function smithWorkPeople(id:string){return id==='ev:smith:small:earlyClose'?['smith']:id==='ev:tilly:love:2'?['tilly','smith']:['tilly']}
export function drawSmithWork(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*.66:h<=170?h*.69:h*.6),ground=foot+8,chosen=choice!=null
 const actor=(who:FinalePerson|null,x:number,face:'left'|'right'='left',sit=false)=>person(p,x,ground,who?who.avatar:avatar,face,who?who.who:'writer',sit,false,t)
 const anvil=()=>{p(cx-5,foot+9,'#886747',25,15);p(cx-12,foot+2,'#8b9388',40,4);p(cx-8,foot+6,'#657169',29,5)}
 const hammer=(x:number,y:number)=>{p(x,y,'#926f4c',12,2);p(x-3,y-2,'#7f8981',4,6)}
 g.imageSmoothingEnabled=false
 if(id==='ev:smith:small:earlyClose'){
  drawForgeYardBackground(p,w,h,foot)
  p(cx+42,ground-2,'#b69871',41,3);p(cx+45,ground+1,'#866548',3,10);p(cx+76,ground+1,'#866548',3,10)
  actor(null,cx-85,'right',chosen&&choice===0);actor(npc,cx+55,'left',beat>=1)
  p(cx+42,foot-4,'#b58e5d',12,2);p(cx+46,foot-6,'#b58e5d',7,5);p(cx+47,foot-6,chosen&&choice===1?'#8fa9a2':'#735c40',5,1)
  hammer(cx-20,foot+2);return
 }
 if(id==='ev:tilly:love:2'){
  if(chosen&&choice===0){drawForgeRoomBackground(p,w,h,foot-28);actor(null,cx-85,'right');actor(npc,cx+55);if(others[0]){
   actor(others[0],cx+80)
   const av=others[0].avatar?withLookDefaults(others[0].avatar):undefined,rows=spriteRows(others[0].who,'left',{frame:0,blink:false,avatar:av})
   for(let yy=4;yy<7;yy++)for(let xx=0;xx<rows[yy].length;xx++)if(rows[yy][xx]==='+')p(cx+80+xx*2,ground-rows.length*2+yy*2,'#df8f78',2,2)
  }}else{drawForgeYardBackground(p,w,h,foot);actor(null,cx-85,'right');actor(npc,cx+55);anvil();hammer(cx+38,foot)
   if(chosen&&choice===1)for(let i=0;i<2;i++){p(cx+3+i*4,foot-6,'#e2d0ab',2,2);p(cx-96+i*4,foot-48,'#e2d0ab',2,2)}
  }
  return
 }
 const completed=id==='ev:tilly:busy'&&choice===0&&beat>=4
 if(completed&&t>=2){drawRiverRestBackground(p,w,h,t,foot-50,foot-20,true);actor(null,cx-35,'right');actor(npc,cx+2,'right');return}
 drawForgeRoomBackground(p,w,h,foot-28)
 const working=id==='ev:tilly:busy'&&choice===0&&beat===3
 actor(null,id==='ev:tilly:tongs'?cx-35:working?cx-102:cx-85,'right');actor(npc,cx+41,id==='ev:tilly:busy'?'right':'left');anvil()
 if(id==='ev:tilly:busy'){
  hammer(cx+28,foot-3)
  p(cx-115,ground+3,'#8d704b',32,4);p(cx-111,ground+1,'#a9895a',25,3);p(cx-100,ground,'#735c40',13,1)
  if(completed){p(cx-26,foot-26,'#b69871',58,31);for(let i=0;i<20;i++){const x=cx-20+i%5*10,y=foot-23+Math.floor(i/5)*7;p(x,y,'#879185',5,1);p(x,y,'#879185',1,5);p(x+4,y,'#879185',1,5);p(x+1,y+4,'#879185',3,1)}}
  else {p(cx-17,foot-4,'#d29c68',31,2);p(cx-20,foot+3,'#e2d0ab',19,9);for(let i=0;i<4;i++)p(cx-17+i*4,foot+5,'#8d704b',1,5)}
  return
 }
 // 집게·망치가 손에 닿도록 물건을 놓는다. 얼굴과 몸통 앞에는 큰 도구를 겹치지 않는다.
 const ready=chosen&&choice===0
 p(cx+6,foot,'#a4ada0',20,3);if(beat>=1)p(cx+8,foot,ready?'#b99874':'#d59d66',17,2)
 p(cx-17,foot+1,'#697a73',29,1);p(cx-17,foot+4,'#697a73',29,1);p(cx+10,foot+1,'#697a73',2,4)
 hammer(cx+28,foot-2)
 if(beat>=1){
  const av=npc.avatar?withLookDefaults(npc.avatar):undefined,rows=spriteRows(npc.who,'left',{frame:0,blink:false,avatar:av})
  const spread=choice===1&&beat>=4
  for(let yy=4;yy<7;yy++){const cols=[...rows[yy]].flatMap((c,xx)=>c==='s'||c==='+'?[xx]:[]);for(const xx of spread?cols.filter(xx=>xx<rows[yy].length/2):yy===5?cols.slice(0,1):[])p(cx+41+xx*2,ground-rows.length*2+yy*2,'#776958',spread?2:1,spread?2:1)}
 }
}

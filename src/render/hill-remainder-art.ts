import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {spriteRows} from './sprites'
import {drawPastureGround} from './pasture-ground'
import {drawSunsetBackground} from './sunset-background'

export const HILL_REMAINDER_IDS=['date:walk:1','saw:tilly:flower'] as const
/** Native short hand location, including the current generation's body and crouching pose. */
function shortHand(npc:FinalePerson,x:number,ground:number,crouch:boolean){
 const rows=spriteRows(npc.who,'left',{frame:0,blink:false,avatar:npc.avatar?withLookDefaults(npc.avatar):undefined,pose:crouch?'crouch':'stand',short:npc.short})
 let row=rows.length-1
 while(row>7&&!rows[row].includes('s'))row--
 const col=Math.max(0,rows[row].indexOf('s'))
 const edge=Math.min(...rows.slice(Math.max(0,row-2),row+4).map(r=>[...r].findIndex(c=>c!=='.')).filter(i=>i>=0))
 return {x:x+col*2,y:ground-rows.length*2+row*2,edge:x+edge*2}
}
export function drawHillRemainder(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),ground=Math.round(h>w?h*.54:h<=170?h*.69:h*.6)+8,date=id==='date:walk:1'
 g.imageSmoothingEnabled=false
 if(date){
  drawPastureGround(p,w,h,ground-8)
  // The path's native flowers remain on the verge, separate from the offered stem.
  for(const x of [cx-102,cx+81]){p(x,ground-5,'#79966b',1,5);p(x-1,ground-7,'#eee7cf',3,3)}
  const crouch=beat===0&&t<.6,nx=cx+25
  person(p,cx-20,ground,av,'right')
  person(p,nx,ground,npc.avatar,'left',npc.who,crouch,false,0,1,npc.short)
  const hand=shortHand(npc,nx,ground,crouch),x=Math.min(hand.x-5,hand.edge-3),y=hand.y-3
  p(x+1,y+2,'#79966b',1,5);p(x,y+4,'#8b9e70',1,2)
  p(x,y,'#eee7cf',3,3);p(x+1,y+1,'#dcc278',1,1)
  return
 }
 drawSunsetBackground(g,w,h,t,ground-64,ground-10,ground+10)
 const leaving=beat>=3,progress=leaving?Math.max(0,Math.min(1,(t-.35)/1.4)):0,nx=Math.round(cx+25+progress*35)
 person(p,cx-55,ground,av,'right')
 person(p,nx,ground,npc.avatar,leaving&&t>=.35?'right':'left',npc.who,false,leaving&&t>=.35&&t<1.75,t,1,npc.short)
 if(!leaving||t<.35){
  const hand=shortHand(npc,nx,ground,false),x=Math.min(hand.x-5,hand.edge-3),y=hand.y-2
  // Fingernail-sized metal petals with a file mark; never a picked or awarded live flower.
  p(x+1,y,'#879395',1,4);p(x,y+1,'#a8b5b1',3,2);p(x+1,y+1,'#d4d8ca',1,1)
 }
}

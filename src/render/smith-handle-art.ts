import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawForgeRoomBackground} from './forge-room-background'
import {lodgingBuildingRows,LODGING_PALETTE} from './lodging-art'

export const SMITH_HANDLE_IDS=['saw:forge:handle'] as const
const windowRows=lodgingBuildingRows().slice(77,88).map(row=>row.slice(19,29))
/** A narrative cut to Tilly's window; the witness and Tilly do not enter this private cut. */
export function drawSmithHandle(g:CanvasRenderingContext2D,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),ground=Math.round(h>w?h*.54:h<=170?h*.69:h*.6)+8
 g.imageSmoothingEnabled=false
 if(beat<2){
  drawForgeRoomBackground(p,w,h,ground+25,true,true)
  const palette:Record<string,string>={...LODGING_PALETTE,b:'#6e7b88',h:'#9aa4aa'}
  windowRows.forEach((row,y)=>[...row].forEach((c,x)=>{if(palette[c])p(cx-64+x*2,ground-58+y*2,palette[c],2,2)}))
  // Freshly carved wooden handle only. Its engraved leaf is wood, not a new leaf/hammer head.
  const x=cx-48,y=ground-24
  p(x,y,'#ad8358',5,24);p(x+1,y+1,'#dec49a',2,22);p(x+4,y+2,'#846243',1,22)
  p(x+2,y+5,'#8b714c',1,9);p(x+1,y+6,'#8b714c',1,2);p(x+3,y+9,'#8b714c',1,2)
  person(p,beat===0?cx-40:cx+10,ground,npc.avatar,'left',npc.who,beat===0,false,0,1,npc.short)
  return
 }
 // Runtime sighting remains in the normalized lower forge (6,125); the handle stays at the window.
 drawForgeRoomBackground(p,w,h,ground-32,true)
 person(p,cx-112,ground,av,'right')
 const progress=Math.max(0,Math.min(1,(t-.45)/1.3)),x=Math.round(cx+58-progress*40)
 person(p,x,ground,npc.avatar,'left',npc.who,false,t>.45&&t<1.75,t,1,npc.short)
 if(t<.45){p(x-6,ground-23,'#bdb6a4',2,1);p(x-9,ground-25,'#bdb6a4',2,1)}
}

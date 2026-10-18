import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawBakeryRoomBackground} from './bakery-room-background'
import {newbornArt} from './newborn-art'

export const BAKERY_DINNER_IDS=['dinner:baker'] as const
export const isBakeryDinner=(id:string)=>(BAKERY_DINNER_IDS as readonly string[]).includes(id)

/** The original soup invitation: the household baby plays in the open gap beneath the table. */
export function drawBakeryDinner(g:CanvasRenderingContext2D,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],_beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),ground=Math.round(h>w?h*.54:h<=170?h*.69:h*.6)
 g.imageSmoothingEnabled=false
 drawBakeryRoomBackground(p,w,h,ground-22)
 person(p,cx-48,ground,av,'right','writer',true)
 person(p,cx+44,ground,npc.avatar,'left',npc.who,true,false,t,1,npc.short)
 const x=cx-12,y=ground-17
 p(x,y,'#b88e60',48,5);p(x+2,y,'#d0ac77',44,2)
 p(x+3,y+5,'#806043',3,24);p(x+42,y+5,'#806043',3,24)
 // Two soup bowls stay between the seated bodies, entirely outside their hands and faces.
 for(const dx of [1,27]){
  p(x+dx,ground-22,'#e2d6b5',17,4);p(x+dx+2,ground-24,'#c6a06a',13,3)
  p(x+dx+5,ground-24,'#92a37b',2,1)
  p(x+dx+8,ground-31-Math.round(Math.sin(t*2)),'#eee0bf',1,4)
 }
 const baby=newbornArt(others[0]?.avatar??npc.avatar,Math.floor(t*2))
 // Only the native baby rows move. Table legs, scale and floor stay fixed through both pages.
 const bx=cx+1+Math.round(Math.sin(Math.min(t,1.2)*3)*2),by=ground+10-baby.rows.length*2
 baby.rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&baby.palette[c])p(bx+xx*2,by+yy*2,baby.palette[c],2,2)}))
 // The final welcome remains seated; it does not stand up, leave, or award another meal.
}

import {SHORE_FISHER_IDS,fisherPeople,drawShoreFisher} from './shore-fisher-art'
import {SHORE_BOAT_IDS,boatPeople,drawShoreBoat} from './shore-boat-art'
import {SHORE_PERSONAL_IDS,personalPeople,drawShorePersonal} from './shore-personal-art'
import {SHORE_LETTER_IDS,letterPeople,drawShoreLetter} from './shore-letter-art'
import {SHORE_QUIET_IDS,quietPeople,drawShoreQuiet} from './shore-quiet-art'
import {SHORE_STONES_IDS,drawShoreStones} from './shore-stones-art'
import {SHORE_REMAINDER_IDS,isShoreRemainder,shoreRemainderPeople,drawShoreRemainder} from './shore-remainder-art'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawRiverRestBackground} from './river-rest-background'
export const SHORE_EVENT_IDS=[...SHORE_FISHER_IDS,...SHORE_BOAT_IDS,...SHORE_PERSONAL_IDS,...SHORE_LETTER_IDS,...SHORE_QUIET_IDS,...SHORE_STONES_IDS,...SHORE_REMAINDER_IDS,'ev:cosmo:story:3','ev:cosmo:home:2'] as const
export const isShoreEvent=(id:string)=>(SHORE_EVENT_IDS as readonly string[]).includes(id)
const inList=(ids:readonly string[],id:string)=>ids.includes(id)
export function shoreEventPeople(id:string){if(isShoreRemainder(id))return shoreRemainderPeople(id);if(inList(SHORE_FISHER_IDS,id))return fisherPeople(id);if(inList(SHORE_BOAT_IDS,id))return boatPeople(id);if(inList(SHORE_PERSONAL_IDS,id))return personalPeople(id);if(inList(SHORE_LETTER_IDS,id))return letterPeople(id);if(inList(SHORE_QUIET_IDS,id))return quietPeople(id);if(inList(SHORE_STONES_IDS,id))return ['tilly'];return ['cosmo']}
export function drawShoreEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,choice?:number|null,others:FinalePerson[]=[]){
 if(isShoreRemainder(id)){drawShoreRemainder(g,id,w,h,t,avatar,npc,others,beat);return}
 if(inList(SHORE_FISHER_IDS,id)){drawShoreFisher(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(inList(SHORE_BOAT_IDS,id)){drawShoreBoat(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(inList(SHORE_PERSONAL_IDS,id)){drawShorePersonal(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(inList(SHORE_LETTER_IDS,id)){drawShoreLetter(g,id,w,h,t,avatar,npc,beat,choice);return}
 if(inList(SHORE_QUIET_IDS,id)){drawShoreQuiet(g,id,w,h,t,avatar,npc,beat,choice);return}
 if(inList(SHORE_STONES_IDS,id)){drawShoreStones(g,id,w,h,t,avatar,npc,beat,choice);return}
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*.56:h<=170?h*.69:h*.6),rest=id==='ev:cosmo:story:3',chosen=choice!=null
 g.imageSmoothingEnabled=false;drawRiverRestBackground(p,w,h,t,foot-66,foot-24,true)
 // Fixed shoreline landing; native feet stand on its planks, never in the water.
 p(cx-74,foot-19,'#a58c67',148,42);for(let y=foot-17;y<foot+22;y+=6)p(cx-74,y,'#897455',148,1)
 p(cx-72,foot+23,'#735c43',5,14);p(cx+67,foot+23,'#735c43',5,14)
 if(rest){
  // Finished storage rack, oar, net and hanging shells from the actual opening line.
  const x=cx+81,y=foot-48
  p(x,y,'#80664c',3,57);p(x+37,y,'#80664c',3,57);p(x-2,y,'#ac8961',44,4)
  p(x+9,y+5,'#b48a57',2,27);p(x+6,y+32,'#b48a57',8,10);p(x+7,y+33,'#c5a674',6,7)
  for(let yy=y+8;yy<y+35;yy+=5)p(x+19,yy,'#8b9b87',16,1)
  for(let xx=x+19;xx<x+36;xx+=4)p(xx,y+7,'#8b9b87',1,29)
  for(let i=0;i<3;i++){const sx=x+4+i*13;p(sx,y+3,'#d1bd97',1,8);p(sx-2,y+10,'#d9cbae',5,3);p(sx-1,y+13,'#d9cbae',3,1)}
  for(const sx of [cx-40,cx+4]){p(sx-2,foot+6,'#a8835e',24,3);p(sx,foot+9,'#76583e',3,9)}
  person(p,cx-40,foot+8,avatar,'right','writer',chosen)
  person(p,cx+4,foot+8,npc.avatar,'left',npc.who,beat>=2||chosen)
 }else{
  // Their father is asking about a future visit. He is not already at dinner.
  person(p,cx-40,foot+8,avatar,'right','writer');person(p,cx+4,foot+8,npc.avatar,'left',npc.who)
 }
}

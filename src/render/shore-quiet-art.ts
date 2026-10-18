import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {shoreFrame,shoreActor,bench} from './shore-kit'
export const SHORE_QUIET_IDS=['ev:marigold:small:freeAfternoon','ev:basil:small:walk','ev:penelope:hesitate1'] as const
export function quietPeople(id:string){return [id.split(':')[1]]}
export function drawShoreQuiet(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,beat:number,choice?:number|null){
 const {p,cx,foot:f,ground}=shoreFrame(g,w,h,t,'day'),sit=id.includes('freeAfternoon'),walk=id.includes(':walk')&&choice===0
 if(sit){bench(p,cx+55,f);if(choice===0)bench(p,cx-85,f)}
 shoreActor(p,cx-85,ground,null,av,'right',sit&&choice===0,walk,t);shoreActor(p,cx+55,ground,npc,av,'left',sit,walk,t)
 if(id.includes(':walk')){
  // Empty hands: the herb is left in the ground rather than harvested.
  p(cx+22,f+17,'#849469',1,9);p(cx+19,f+21,'#849469',7,2)
  if(beat>=1){p(cx+36,f+15,'#90a07c',5,2)}
 }
 // No basket/list for Marigold; no invented object for Penelope's unspoken words.
}

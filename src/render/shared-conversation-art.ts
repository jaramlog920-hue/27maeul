import {withLookDefaults,type Avatar} from '../engine/avatar'
import {REQUESTS} from '../engine/bonds'
import type {Facing} from '../engine/types'
import type {FinalePerson} from './library-finale-art'
import {PALETTE,spriteRows,writerPalette,type Pose} from './sprites'
import {OLD_PROPS,OLD_VILLAGE_PALETTE} from './old-village-art'

type Gesture='count'|'lookUp'|'spread'|'low'|'laugh'|'inspect'|'palm'|'notebook'|'listen'|'explain'|'greet'
/** Each pair follows the two original lines; memories and plans stay conversations. */
const STORIES:Record<string,readonly [Gesture,Gesture]>={
 'romance1:presser':['count','count'],
 'romance2:presser':['count','listen'],
 'romance2:presser:friend':['count','listen'],
 'romance1:dexter':['explain','lookUp'],
 'romance2:dexter':['lookUp','explain'],
 'romance2:dexter:friend':['lookUp','explain'],
 'romance1:merchant':['spread','spread'],
 'romance2:merchant':['explain','listen'],
 'romance1:rudy':['low','listen'],
 'romance2:rudy':['listen','explain'],
 'romance1:marigold':['laugh','listen'],
 'romance2:marigold':['explain','listen'],
 'romance2:marigold:friend':['explain','listen'],
 'romance1:basil':['inspect','inspect'],
 'romance2:basil':['explain','listen'],
 'romance2:basil:friend':['explain','listen'],
 'romance1:poppy':['count','explain'],
 'romance2:poppy':['explain','listen'],
 'romance1:juniper':['palm','laugh'],
 'romance2:juniper':['spread','listen'],
 'romance2:juniper:friend':['spread','listen'],
 'romance1:cosmo':['lookUp','listen'],
 'romance2:cosmo':['spread','explain'],
 'romance1:tilly':['palm','palm'],
 'romance2:tilly':['explain','listen'],
 'romance2:tilly:friend':['explain','listen'],
 'romance1:postman':['explain','notebook'],
 'romance2:postman':['listen','notebook'],
 'romance2:postman:friend':['listen','notebook'],
}
const NOTICES:Record<string,string>={'notice:starNight':'grandpa','notice:picnic':'child','notice:babyParty':'baker','invite:grandpa':'grandpa','invite:child':'child','invite:baker':'baker'}
const ASK_GESTURES:Record<string,readonly [Gesture,Gesture]>={
 'grandpa:1':['low','count'],'grandpa:2':['low','count'],
 'smith:1':['palm','count'],'smith:2':['lookUp','count'],
 'weaver:1':['lookUp','count'],'merchant:1':['spread','count'],
 'merchant:2':['lookUp','count'],'shepherd:1':['spread','count'],
 'shepherd:2':['explain','count'],'presser:1':['palm','count'],
 'presser:2':['spread','count'],'child:1':['lookUp','count'],
 'child:2':['low','count'],'beekeeper:1':['spread','count'],
 'baker:1':['low','count'],'baker:2':['palm','count'],
}
export const SHARED_CONVERSATION_IDS=[...Object.keys(STORIES),...REQUESTS.map(r=>`ask:${r.id}`),...Object.keys(NOTICES)]
export function sharedConversationPeople(id:string):string[]{
 if(STORIES[id])return [id.split(':')[1]]
 if(NOTICES[id])return [NOTICES[id]]
 const request=REQUESTS.find(r=>`ask:${r.id}`===id)
 return request?[request.npc]:[]
}
export interface ConversationActorFrame {x:number;facing:Facing;pose:Pose;walk:boolean}
export interface ConversationFrame {player:ConversationActorFrame;npc:ConversationActorFrame;gesture:Gesture;notebook:boolean}
export function sharedConversationFrame(id:string,w:number,beat:number,t:number):ConversationFrame|null {
 if(!SHARED_CONVERSATION_IDS.includes(id))return null
 const phase=Math.min(1,Math.max(0,beat)),gesture=STORIES[id]?.[phase]??ASK_GESTURES[id.slice(4)]?.[phase]??'greet'
 const cx=Math.round(w/2),active=t<1.4,friend=id.endsWith(':friend'),greeting=!!NOTICES[id]
 let facing:Facing='left',pose:Pose='stand'
 if(active){
  if(gesture==='lookUp')facing=t<.6?'up':'left'
  else if(gesture==='low')pose=t<.8?'crouch':'stand'
  else if(gesture==='inspect')pose=t<.5||t>=.8&&t<1.1?'crouch':'stand'
  else if(['count','spread','palm','laugh','explain','greet'].includes(gesture)){
   facing=t<1?'down':'left'
   pose=(gesture==='count'&&Math.floor(t*5)%2===0)?'stand':gesture==='spread'?'handUp':'wave'
  }
 }
 const arriving=greeting&&beat===0&&t<.8,offset=arriving?Math.round((1-t/.8)*14):0
 return {gesture,notebook:gesture==='notebook',
  player:{x:cx-(friend?58:52),facing:'right',pose:'stand',walk:false},
  npc:{x:cx+31+offset,facing:arriving?'left':facing,pose:arriving?'stand':pose,walk:arriving}}
}
export function drawConversationActor(g:CanvasRenderingContext2D,actor:FinalePerson,f:ConversationActorFrame,ground:number,t:number){
 const av=actor.avatar?withLookDefaults(actor.avatar):undefined,palette=actor.who==='writer'?writerPalette(actor.season??'spring',av):PALETTE
 const rows=spriteRows(actor.who,f.facing,{avatar:av,pose:f.pose,short:actor.short,growth:actor.growth,elder:actor.elder,season:actor.season,frame:f.walk?(Math.floor(t*3)%2?1:2):0,blink:false})
 rows.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch!=='.'&&palette[ch]){g.fillStyle=palette[ch];g.fillRect(f.x+x*2,ground-rows.length*2+y*2,2,2)}}))
}
/** Native gestures only. Requested materials, memories and future meals are not spawned. */
export function drawSharedConversationForeground(g:CanvasRenderingContext2D,id:string,w:number,ground:number,t:number,beat:number,av:Avatar|null,npc:FinalePerson,season:NonNullable<FinalePerson['season']>='spring'){
 const frame=sharedConversationFrame(id,w,beat,t)
 if(!frame)return
 if(frame.notebook){
  // A small route notebook on a low ledge, outside both bodies and faces.
  const x=frame.npc.x-28,y=ground-16,art=OLD_PROPS.personalNote
  art.rows.forEach((r,yy)=>[...r].forEach((ch,xx)=>{const c=(OLD_VILLAGE_PALETTE as Record<string,string>)[ch];if(ch!=='.'&&c){g.fillStyle=c;g.fillRect(x+xx,y+yy,1,1)}}))
  g.fillStyle='#a68a63';g.fillRect(x,ground,16,2)
 }
 drawConversationActor(g,{avatar:av,who:'writer',season},frame.player,ground,t)
 drawConversationActor(g,npc,frame.npc,ground,t)
}

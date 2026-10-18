import type {Avatar} from '../engine/avatar'
import {CANDIDATE_IDS} from '../engine/romance'
import type {FinalePerson} from './library-finale-art'
import {drawConversationActor,type ConversationActorFrame} from './shared-conversation-art'

export const SHARED_RETURN_WALK_IDS=CANDIDATE_IDS.map(id=>`loverTrust:${id}`)
/** The four original lines: slow down, talk, listen, continue side by side. */
export function sharedReturnWalkFrame(w:number,beat:number,t:number){
 const phase=Math.max(0,Math.min(3,beat)),cx=Math.round(w/2),u=Math.min(1,Math.max(0,t/1.6))
 let player:ConversationActorFrame,npc:ConversationActorFrame
 if(phase===0){
  player={x:cx-52+Math.round(16*u),facing:'right',pose:'stand',walk:u<1}
  npc={x:cx+3+Math.round(6*Math.min(1,u/.55)),facing:'right',pose:'stand',walk:u<.55}
 }else if(phase===3){
  player={x:cx-36+Math.round(18*u),facing:'right',pose:'stand',walk:u<1}
  npc={x:cx+9+Math.round(18*u),facing:'right',pose:'stand',walk:u<1}
 }else{
  player={x:cx-36,facing:'right',pose:'stand',walk:false}
  npc={x:cx+9,facing:'left',pose:'stand',walk:false}
 }
 return {phase,player,npc}
}
/** No job props or invented outing destination. The shared backdrop uses date provenance. */
export function drawSharedReturnWalkForeground(g:CanvasRenderingContext2D,id:string,w:number,ground:number,t:number,beat:number,av:Avatar|null,npc:FinalePerson,season:NonNullable<FinalePerson['season']>='spring'){
 if(!SHARED_RETURN_WALK_IDS.includes(id))return
 const f=sharedReturnWalkFrame(w,beat,t)
 drawConversationActor(g,{avatar:av,who:'writer',season},f.player,ground,t)
 drawConversationActor(g,npc,f.npc,ground,t)
}

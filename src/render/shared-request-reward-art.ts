import type {Avatar} from '../engine/avatar'
import {REQUESTS} from '../engine/bonds'
import {SCENES} from '../content/text'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {FURNITURE_ART,FURNI_PALETTE} from './furniture-art'
import {ICONS,ICON_PALETTE} from './sprites'
import type {GiftProp} from './shared-gift-art'
import {householdCradleFrame} from './village-followup-art'

/** All sixteen thank-you scenes belong to the same unfinished 118-event batch. */
export const SHARED_REQUEST_REWARD_IDS=REQUESTS.map(r=>`done:${r.id}`)
export function sharedRequestRewardSpec(id:string){
 const request=id.startsWith('done:')?REQUESTS.find(r=>`done:${r.id}`===id):undefined
 return request?{request,original:SCENES[id].lines}:undefined
}

/** The first line describes the result; only the second line presents the actual reward. */
export function sharedRequestRewardProps(id:string,cx:number,ground:number,t:number,beat:number):GiftProp[]{
 const spec=sharedRequestRewardSpec(id)
 if(!spec||beat<1)return []
 const items=Object.entries(spec.request.reward).flatMap(([item,n])=>Array.from({length:n??0},()=>item))
 const approach=Math.round((1-Math.min(1,Math.max(0,t/.8)))*10)
 return items.map((item,i)=>{
  // Multiple objects use their inventory-size native art so the mixed baker/presser
  // rewards are separate objects rather than furniture piled at the same coordinate.
  const furniture=items.length===1&&item!=='rug'?FURNITURE_ART[item]:undefined
  const rows=furniture?.rows??ICONS[item]
  if(!rows)throw new Error(`Missing native request reward: ${id}/${item}`)
  const width=rows[0].length*2,height=rows.length*2
  return {item,rows,palette:furniture?FURNI_PALETTE:ICON_PALETTE,scale:2,
   x:Math.round(cx-width/2+(i-(items.length-1)/2)*24+approach),
   y:items.length>1?ground-14-height:ground+6-height}
 })
}

/** Foreground only: never creates an unlocked facility at an unrelated meeting place. */
export function drawSharedRequestRewardForeground(g:CanvasRenderingContext2D,id:string,w:number,ground:number,t:number,beat:number,av:Avatar|null,npc:FinalePerson,baby:FinalePerson|null=null,season:NonNullable<FinalePerson['season']>='spring'){
 const spec=sharedRequestRewardSpec(id)
 if(!spec)return
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))},cx=Math.round(w/2)
 const props=sharedRequestRewardProps(id,cx,ground,t,beat)
 if(id==='done:baker:2'&&baby){
  const appearance=Object.fromEntries(Object.entries(baby.avatar??{}).filter((entry):entry is [string,number]=>typeof entry[1]==='number'))
  const art=householdCradleFrame({name:baby.avatar?.name??'아기',look:baby.avatar?.look??'f',avatar:appearance,hair:baby.avatar?.hairColor},0,true),bx=cx+90,by=ground+6-32
  const stamp=(rows:readonly string[],palette:Record<string,string>)=>rows.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch!=='.'&&palette[ch])p(bx+x*2,by+y*2,palette[ch],2,2)}))
  // The existing household cradle and shared user-baby body stay beside the parent.
  stamp(art.back,art.propPalette);stamp(art.actor,art.actorPalette)
  // Decorate only swaddle cloth, below and beside the native head and face.
  art.actor.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='w'&&y%2===0&&x%3===0)p(bx+x*2,by+y*2,'#c5b1a2',2,2)}))
  stamp(art.front,art.propPalette)
 }
 if(props.length>1){
  const width=props.length*24+4
  p(cx-width/2,ground-12,'#b69871',width+10,4)
  p(cx-width/2+3,ground-8,'#866548',3,14);p(cx+width/2+4,ground-8,'#866548',3,14)
 }
 for(const a of props)a.rows.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch!=='.'&&a.palette[ch])p(a.x+x*2,a.y+y*2,a.palette[ch],2,2)}))
 if(id==='done:child:2'&&props.length){
  const x=props[0].x+props[0].rows[0].length
  p(x,ground-22,'#708b5b',1,12);p(x-4,ground-24,'#eee1bd',5,3);p(x+1,ground-27,'#c8a3ad',5,3)
 }
 person(p,cx-71,ground,av,'right','writer',false,false,t,1,undefined,undefined,season)
 person(p,cx+60,ground,npc.avatar,'left',npc.who,beat>=1&&props.length===1&&t<.65,false,t,npc.growth??1,npc.short,npc.elder,npc.season)
}

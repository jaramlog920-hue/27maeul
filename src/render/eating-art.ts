import type { Facing } from '../engine/types'
import type { SpriteOpts, Who } from './sprites'
import { furnitureUseFrame } from './furniture-use-motion'

export const EAT_DURATIONS = [300,220,260,420,380,320] as const
export type EatFood = 'bread' | 'fruit' | 'bowl' | 'honey'
export const EAT_FOODS:Record<EatFood,string>={bread:'빵 먹기',fruit:'무화과 먹기',bowl:'한 숟갈 먹기',honey:'꿀 맛보기'}
export function eatFoodFor(item:string):EatFood {
  return item==='fig'||item==='figPlate'?'fruit':item==='honey'?'honey':item==='bean'||item==='beanDish'||item==='herbBeanDish'?'bowl':'bread'
}
export function eatingFrame(who:Who,facing:Facing,frame:number,opts:SpriteOpts,food:EatFood='bread'){
  const f=Math.max(0,Math.min(5,Math.trunc(frame))),d=facing==='left'?'right':facing
  const a=furnitureUseFrame(who,d,'craft',0,{...opts,blink:opts.blink||f===4},false)
  const actor=a.actor.map(r=>[...r]),prop=Array.from({length:24},()=>Array<string>(24).fill('.'))
  const rect=(p:string[][],c:string,x:number,y:number,w:number,h:number)=>{for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)if(p[y+dy]?.[x+dx]!==undefined)p[y+dy][x+dx]=c}
  const x=d==='right'?16:d==='up'?16:14,y=[14,12,10,10,12,14][f],bite=f>=3
  // Small fingertips follow the food. The clothed torso remains unchanged.
  rect(actor,'s',d==='down'?x+1:x-1,y+2,2,1)
  if(food==='bread'){
    rect(prop,'W',x,y+1,bite?2:4,2);rect(prop,'l',x,y,bite?2:4,2);rect(prop,'y',x,y,bite?1:3,1)
    if(!bite)rect(prop,'C',x+1,y+1,1,1)
  }else if(food==='fruit'){
    rect(prop,'v',x,y+1,bite?2:3,2);rect(prop,'V',x,y,bite?1:2,2);rect(prop,'g',x+1,y-1,1,1)
  }else{
    const bx=d==='right'?14:d==='up'?15:9
    rect(prop,'B',bx,15,6,3);rect(prop,'c',bx,14,6,1);rect(prop,food==='honey'?'y':'r',bx+1,14,4,1)
    rect(prop,'w',x,y+1,3,1);rect(prop,food==='honey'?'y':'Y',x+2,y,2,1)
    rect(actor,'s',bx-1,16,2,1)
  }
  // Tiny crumbs signal the bite; chewing has a deliberate pause, no bouncing.
  if(f===3&&food==='bread'){rect(prop,'y',x+3,y+4,1,1)}
  const orient=(rows:string[])=>facing==='left'?rows.map(r=>[...r].reverse().join('')):rows
  const empty=Array<string>(24).fill('.'.repeat(24)),rows=orient(prop.map(r=>r.join('')))
  return {actor:orient(actor.map(r=>r.join(''))),propBack:d==='up'?rows:empty,propFront:d==='up'?empty:rows,anchor:{x:12,y:18},duration:EAT_DURATIONS[f],loop:false}
}

import { spriteRows, type SpriteOpts, type Who } from './sprites'
import { eventMotionFrame } from './event-life-motion'
import { extraUseFrame } from './expansion-life-motion'
import { furnitureUseFrame } from './furniture-use-motion'
import type { Facing } from '../engine/types'
export const GENERATION_STAGES=['baby','toddler','child','teen','adult'] as const
export type GenerationStage=typeof GENERATION_STAGES[number]
export const FAMILY_ACTIONS=['sootheBaby','holdBaby','readTogether','familyMeal','firstErrand','apprentice','showWork','moveHouse','welcome','listen'] as const
export type FamilyAction=typeof FAMILY_ACTIONS[number]
export const FAMILY_ACTION_LABELS:Record<FamilyAction,string>={sootheBaby:'아기 달래기',holdBaby:'아기 안기',readTogether:'함께 읽기',familyMeal:'가족 식사',firstErrand:'첫 심부름',apprentice:'견습 손일',showWork:'작품 보여주기',moveHouse:'독립 짐 들기',welcome:'가족 맞이하기',listen:'이야기 듣기'}
export function generationRows(stage:GenerationStage,facing:Facing,frame:number,opts:SpriteOpts):string[] {
  if(stage==='baby') {
    // 보호자와 별도 그리는 8px 아기. 장식이나 성인 머리를 얹지 않는다.
    const p=Array.from({length:14},()=>Array<string>(10).fill('.'))
    const source=facing==='up'?['.hhhh.','hh11hh','.rrrr.','rrllrr','.rrrr.','..RR..']:facing==='right'||facing==='left'?['.hh...','hssso.','.rrrr.','rrllrr','.rrrr.','..RR..']:['.hhhh.','hsosoh','.ssss.','rrllrr','.rrrr.','..RR..']
    source.forEach((r,y)=>[...r].forEach((c,x)=>{if(y+3<14&&x+2<10)p[y+3][x+2]=c}))
    if(frame%4===2)for(let y=0;y<14;y++)for(let x=0;x<10;x++)if(p[y][x]==='o')p[y][x]='s'
    return facing==='left'?p.map(r=>r.reverse().join('')):p.map(r=>r.join(''))
  }
  const rows=spriteRows('writer',facing,{...opts,frame:(Math.abs(frame)%3) as 0|1|2,short:stage==='toddler'?0:stage==='child'?1:stage==='teen'?2:undefined})
  // 키가 작은 몸체를 늘리지 않고 위쪽을 투명하게 채워 바닥 앵커를 공유한다.
  return [...Array<string>(Math.max(0,14-rows.length)).fill('.'.repeat(10)),...rows]
}
export function familyFrame(who:Who,facing:Facing,action:FamilyAction,frame:number,stage:Exclude<GenerationStage,'baby'>,opts:SpriteOpts) {
  const options={...opts,short:stage==='toddler'?0:stage==='child'?1:stage==='teen'?2:undefined}
  if(action==='readTogether')return {...furnitureUseFrame(who,facing,'read',frame,options),duration:300,loop:true}
  if(action==='apprentice'||action==='showWork')return extraUseFrame(who,facing,action==='apprentice'?'plane':'show',frame,options)
  const actions={sootheBaby:'holdBaby',holdBaby:'holdBaby',familyMeal:'shareFood',firstErrand:'carryParcel',moveHouse:'carryParcel',welcome:'smile',listen:'nod'} as const
  return {...eventMotionFrame(who,facing,actions[action],frame,options),duration:action==='sootheBaby'?400:260}
}
/** 두 사람은 각자의 24px 캔버스와 외형을 유지한다. 가로로 늘리지 않는다. */
export function familyPairFrame(facing:Facing,action:'readTogether'|'familyMeal'|'welcome',frame:number,adult:SpriteOpts,child:SpriteOpts) {
  const first=familyFrame('writer',facing,action,frame,'adult',adult),second=familyFrame('writer',facing,action,frame,'child',child)
  return {width:48,height:24,actors:[{...first,offset:{x:0,y:0}},{...second,offset:{x:24,y:0}}],duration:300,loop:true}
}

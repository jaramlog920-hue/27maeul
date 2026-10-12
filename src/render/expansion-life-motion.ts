import { furnitureUseFrame } from './furniture-use-motion'
import { spriteRows, type SpriteOpts, type Who } from './sprites'
import { EXPANSION_PROPS } from './expansion-prop-art'
import type { Facing } from '../engine/types'
export const EXTRA_ACTIONS = ['sitDown','standUp','lieDown','rise','give','take','water','draw','show','plane','weave','pour','carry','tidy'] as const
export type ExtraAction = typeof EXTRA_ACTIONS[number]
export const EXTRA_LABELS: Record<ExtraAction,string> = { sitDown:'앉기',standUp:'일어나기',lieDown:'눕기',rise:'누웠다 일어나기',give:'건네기',take:'받기',water:'물 주기',draw:'그림 그리기',show:'작품 보여 주기',plane:'나무 다듬기',weave:'직조',pour:'차 따르기',carry:'재료 운반',tidy:'정리하기' }
// Prop assets keep the furniture palette. Never merge it with the character palette.
export function extraUseFrame(who:Who,facing:Facing,action:ExtraAction,frame:number,opts:SpriteOpts) {
  const f=((frame%4)+4)%4
  const reversed=['standUp','rise','take'].includes(action), phase=reversed?3-f:f
  const base=furnitureUseFrame(who,facing,['lieDown','rise'].includes(action)?'lie':['sitDown','standUp'].includes(action)?'sit':['water','give','take','show','carry','tidy'].includes(action)?'reach':'craft',phase,opts,false)
  const source=spriteRows(who,facing,{...opts,frame:0,pose:phase===1?'crouch':'stand'})
  if (['sitDown','standUp','lieDown','rise'].includes(action)&&phase<2) {
    base.actor=Array.from({length:24},(_,y)=>y>=4&&y<4+source.length?'.'.repeat(7)+source[y-4]+'.'.repeat(7):'.'.repeat(24))
    base.anchor={x:12,y:4+source.length}
  }
  // Static-prop IDs let the game swap the actual selected item for the default sample.
  const id:Partial<Record<ExtraAction,string>>={give:'wrappedGoods',take:'wrappedGoods',water:'wateringCan',draw:'notebookOpen',show:'flowerDrawing',plane:'planeTool',weave:'clothPattern',pour:'cupPersonal',carry:'buildMaterials',tidy:'bagRepaired'}
  const prop=Array.from({length:24},()=>Array<string>(24).fill('.'))
  const selected=id[action]
  if(selected){const a=EXPANSION_PROPS[selected];const small=a.rows.filter((_,y)=>y%2===0).map(r=>[...r].filter((_,x)=>x%2===0));const ox=facing==='right'?15:facing==='left'?1:8, oy=['show'].includes(action)?7:12+(phase%2)
    small.forEach((r,y)=>r.forEach((c,x)=>{if(c!=='.'&&oy+y<24)prop[oy+y][ox+x]=c}))
    if(action==='water'||action==='pour')for(let y=18;y<22;y++)prop[y][facing==='left'?2:21]=phase%2?'b':'.'
    if(action==='draw') {prop[11+phase%2][14]='S';prop[12+phase%2][13]='S'}
    // Active hands follow the object's local height, including smaller children.
    const hands=base.actor.map(r=>[...r]),hy=Math.min(22,oy+3),hx=facing==='right'?15:facing==='left'?7:8
    for(const [x,y]of [[hx,hy],[facing==='down'||facing==='up'?15:hx-1,hy+1]])if(x>=0&&x<24){hands[y][x]='s';hands[y+1][x]='5'}
    base.actor=hands.map(r=>r.join(''))
    base.interaction={x:hx,y:hy}
  }
  const rows=prop.map(r=>r.join('')),empty=Array<string>(24).fill('.'.repeat(24))
  return {...base,propBack:facing==='up'?rows:empty,propFront:facing==='up'?empty:rows,propId:selected,duration:['sitDown','standUp','lieDown','rise','give','take'].includes(action)?180:260,loop:!['sitDown','standUp','lieDown','rise','give','take'].includes(action)}
}

export { PET_ACTIONS, petMotionRows } from './pet-art'

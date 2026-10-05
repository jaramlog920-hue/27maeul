import { furnitureUseFrame } from './furniture-use-motion'
import { spriteRows, animalRows, type SpriteOpts, type Who } from './sprites'
import { EXPANSION_PROPS } from './expansion-prop-art'
import type { Facing } from '../engine/types'
export const EXTRA_ACTIONS = ['sitDown','standUp','lieDown','rise','give','take','water','draw','show','plane','weave','pour','carry','tidy'] as const
export type ExtraAction = typeof EXTRA_ACTIONS[number]
export const EXTRA_LABELS: Record<ExtraAction,string> = { sitDown:'앉기',standUp:'일어나기',lieDown:'눕기',rise:'누웠다 일어나기',give:'건네기',take:'받기',water:'물 주기',draw:'그림 그리기',show:'작품 보여 주기',plane:'나무 다듬기',weave:'직조',pour:'차 따르기',carry:'재료 운반',tidy:'정리하기' }
// Prop assets keep the furniture palette. Never merge it with the character palette.
export function extraUseFrame(who:Who,facing:Facing,action:ExtraAction,frame:number,opts:SpriteOpts) {
  const f=((frame%4)+4)%4
  const reversed=['standUp','rise','take'].includes(action), phase=reversed?3-f:f
  const base=furnitureUseFrame(who,facing,['lieDown','rise'].includes(action)?'lie':['sitDown','standUp'].includes(action)?'sit':['water','give','take','show','carry','tidy'].includes(action)?'reach':'craft',phase,opts)
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
    for(let y=11;y<19;y++)for(let x=0;x<24;x++)if(['s','5','!','K'].includes(base.actor[y][x])) {
      base.actor[y]=base.actor[y].slice(0,x)+'.'+base.actor[y].slice(x+1)
    }
    const hands=base.actor.map(r=>[...r]),hy=Math.min(22,oy+3),hx=facing==='right'?15:facing==='left'?7:8
    for(const [x,y]of [[hx,hy],[facing==='down'||facing==='up'?15:hx-1,hy+1]])if(x>=0&&x<24){hands[y][x]='s';hands[y+1][x]='5'}
    base.actor=hands.map(r=>r.join(''))
    base.interaction={x:hx,y:hy}
  }
  const rows=prop.map(r=>r.join('')),empty=Array<string>(24).fill('.'.repeat(24))
  return {...base,propBack:facing==='up'?rows:empty,propFront:facing==='up'?empty:rows,propId:selected,duration:['sitDown','standUp','lieDown','rise','give','take'].includes(action)?180:260,loop:!['sitDown','standUp','lieDown','rise','give','take'].includes(action)}
}

export const PET_ACTIONS=['walk','wait','sniff','play','fetch','wag'] as const
export function petMotionRows(kind:'cat'|'dog',facing:Facing,action:typeof PET_ACTIONS[number],frame:number,baby=false):string[] {
  const p=Array.from({length:16},()=>Array<string>(16).fill('.')),f=frame%4
  const put=(x:number,y:number,c:string)=>{if(x>=0&&x<16&&y>=0&&y<16)p[y][x]=c}
  if(facing==='down'||facing==='up') {
    for(let y=6;y<12;y++)for(let x=5;x<11;x++)put(x,y,'a')
    for(let y=3;y<7;y++)for(let x=5;x<11;x++)put(x,y,'a')
    put(5,2,'A');put(10,2,'A');put(6,12+(action==='walk'?f%2:0),'A');put(9,12+(action==='walk'?(f+1)%2:0),'A')
    if(kind==='dog'){put(5,2,'.');put(10,2,'.');put(4,4,'A');put(4,5,'A');put(11,4,'A');put(11,5,'A')}
    if(facing==='down'){put(6,5,'e');put(9,5,'e');put(8,6,'n');put(7,9,'w')}else{put(7+(action==='wag'?f%2:0),12,'A');put(7+(action==='wag'?f%2:0),13,'A')}
  }else{
    const a=animalRows(kind,baby?'baby':'adult',facing)
    a.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.')put(4+x,5+y+(action==='sniff'&&x<(a[0].length/2)?f%2:0),c)}))
    if(action==='walk') {for(let x=0;x<16;x++)if(p[10][x]==='a')p[10][x]='.';const o=f%2;put(4+o*2,10,'a');put(8+o*2,10,'a')}
    if(action==='wait'){for(let x=4;x<14;x++)p[11][x]='.';put(8,10,'a');put(9,10,'a')}
    if(action==='wag'){const tx=facing==='left'?11:4;put(tx,4+f%2,'a');put(tx,5+f%2,'a')}
  }
  if(action==='play'){put(3+f,12,'n');put(4+f,12,'w')}
  if(action==='fetch'){const x=facing==='left'?3:facing==='right'?12:8;put(x,7,'w');put(x+1,7,'n')}
  // Waiting has a blink, sniffing lowers the nose, carrying has a moving tail.
  if(action==='wait'&&f===2)for(let y=0;y<16;y++)for(let x=0;x<16;x++)if(p[y][x]==='e')p[y][x]='A'
  if(action==='wait'&&facing==='up'&&f===2){put(6,3,'A');put(7,3,'A')}
  if(action==='sniff'&&(facing==='up'||facing==='down')){put(8,6+f%2,'n');put(8,6+(f+1)%2,'a')}
  if(action==='fetch'){put(7+f%2,13,'a');put(7+(f+1)%2,13,'.')}
  if(action==='wag'&&facing==='down'){put(12,9+f%2,'a');put(12,9+(f+1)%2,'.')}
  const rows=p.map(r=>r.join(''))
  // Front/back young pets also have a genuinely smaller silhouette.
  return baby&&(facing==='down'||facing==='up') ? rows.filter((_,y)=>y!==8&&y!==10).map(r=>r.slice(0,4)+r.slice(5,11)+r.slice(12)+'.'.repeat(2)).concat(['.'.repeat(16),'.'.repeat(16)]) : rows
}

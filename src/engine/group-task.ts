import type { GameState } from './game'
import { FIRE } from './neighbors'
import { FESTIVAL_FROM, FESTIVAL_TO, festivalOf } from './calendar'
import { canAttendAppt } from './plans'

export interface GroupTaskProgress { stage: number; choice?: string; selection?: string }
/** 손일 진행만 저장한다. 보상은 원래 회차 정산 한 곳에서 지급한다. */
export function advanceGroupTask(s:GameState,id:string,stage:number,choice?:string):GameState {
 if((s.map ?? 'village')!=='village') return s
 const a=s.plans.appts.find(a=>a.id===id)
 if(!a) {
  const f=s.fests.find(f=>f.id===id&&f.kind==='festival'&&!f.closed&&f.day===s.clock.day)
  if(!f||!f.role||!festivalOf(s.clock.day)||s.clock.minute<FESTIVAL_FROM||s.clock.minute>=FESTIVAL_TO||Math.abs(Math.round(s.player.x)-FIRE.x)+Math.abs(Math.round(s.player.y)-FIRE.y)>4||(f.task?.stage??0)!==stage||stage>=3)return s
  return {...s,fests:s.fests.map(x=>x.id===id?{...x,task:{stage:stage+1,choice:choice??x.task?.choice,selection:stage===0?choice:x.task?.selection}}:x)}
 }
 if(!a.attended||!canAttendAppt(s,id))return s
 if(a.clubId) {
  const run=s.clubSessions[id]
  if(!run||run.mode!=='direct'||run.step!=='activity'||(run.task?.stage??0)!==stage||stage>=3)return s
  return {...s,clubSessions:{...s.clubSessions,[id]:{...run,...(stage===2&&a.activity==='sew'?{woven:true,step:'finish' as const}:{}),task:{stage:stage+1,choice:choice??run.task?.choice,selection:stage===0?choice:run.task?.selection}}}}
 }
 const f=s.fests.find(f=>f.id===a.festId)
 if(!f||!f.joined||f.closed||f.step!=='activity'||(f.task?.stage??0)!==stage||stage>=3)return s
 return {...s,fests:s.fests.map(x=>x.id===f.id?{...x,task:{stage:stage+1,choice:choice??x.task?.choice,selection:stage===0?choice:x.task?.selection}}:x)}
}
export function cleanGroupTask(raw:unknown):GroupTaskProgress|undefined {
 if(!raw||typeof raw!=='object')return undefined
 const r=raw as GroupTaskProgress
 return Number.isInteger(r.stage)&&r.stage>=0&&r.stage<=3?{stage:r.stage,choice:typeof r.choice==='string'?r.choice.slice(0,80):undefined,selection:typeof r.selection==='string'?r.selection.slice(0,80):undefined}:undefined
}

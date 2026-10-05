import { canWorkDay, type WorkState } from './work-day'
import { passTime, playerTile, overflows, putAway, recordExperienceIn, type GameState } from './game'
import { npcTile } from './neighbors'
import { startMini, stepMini, tapMini, isDone, type MiniState } from './minigame'
import { has, take } from './items'
import type { GameContent, Rng } from './types'

export const FINISH_SKILL = 'carpenterFinish'
export type WoodFinish = 'plain'|'warm'
export interface LearnedSkill {day:number;from:string;picked:WoodFinish}
export type Skills = Record<string,LearnedSkill>
export interface SkillLesson {id:typeof FINISH_SKILL;npc:string;day:number;step:0|1|2;picked:WoodFinish;mini?:MiniState}
export type SkillState = GameState & {skills?:Skills;skillLesson?:SkillLesson}
function lessonNearby(s:SkillState):boolean {
  const n=s.npcs.carpenter
  const p=playerTile(s),at=n&&npcTile(n)
  return !!n?.visible && !!at && Math.abs(p.x-at.x)+Math.abs(p.y-at.y)<=3
}
export function discoveredFinish(s:SkillState): boolean {
  return Object.values(s.life.experiences ?? {}).some(e=>e.with.includes('carpenter') && (e.kind==='work'||e.id==='story:carpenterChair'))
}
export function canLearnFinish(s:SkillState,content:GameContent): 'unknown'|'known'|'busy'|null {
  if(s.skills?.[FINISH_SKILL]) return 'known'
  if(!discoveredFinish(s)) return 'unknown'
  if((s as WorkState).workDay?.day===s.clock.day && !(s as WorkState).workDay?.paid) return 'busy'
  // 진행 중인 같은 손일은 돕기 표식과 관계없이 이어갈 수 있다.
  const check=canWorkDay({...s,helped:s.helped.filter(id=>id!=='carpenter'),workDay:undefined,flags:{...s.flags,workPayDay:0}},'carpenter',content)
  return check ? 'busy' : null
}
export function startFinishLesson(s:SkillState,content:GameContent):SkillState {
  if(canLearnFinish(s,content)) return s
  if(s.skillLesson?.day===s.clock.day && s.skillLesson.step<2) return s
  return {...s,skillLesson:{id:FINISH_SKILL,npc:'carpenter',day:s.clock.day,step:0,picked:'plain'}}
}
export function chooseFinish(s:SkillState,picked:WoodFinish,rng:Rng):SkillState {
  const l=s.skillLesson
  if(!l || l.day!==s.clock.day || l.step!==0 || !lessonNearby(s) || (picked!=='plain'&&picked!=='warm')) return s
  return {...s,skillLesson:{...l,picked,step:1,mini:startMini('hold',rng)}}
}
export function finishLessonHand(s:SkillState,kind:'tick'|'tap',input:number,rng:Rng):SkillState {
  const l=s.skillLesson
  if(!l || l.day!==s.clock.day || l.step!==1 || !l.mini || !lessonNearby(s)) return s
  return {...s,skillLesson:{...l,mini:kind==='tick'?stepMini(l.mini,Math.min(.2,Math.max(0,input)),rng):tapMini(l.mini,input)}}
}
export function finishLesson(s:SkillState):SkillState {
  const l=s.skillLesson
  if(!l || l.day!==s.clock.day || l.step!==1 || !l.mini || !isDone(l.mini) || !lessonNearby(s) || s.skills?.[FINISH_SKILL]) return s
  const next={...s,flags:{...s.flags,'skillFinish:stool':l.picked==='warm'?2:1},skills:{...s.skills,[FINISH_SKILL]:{day:s.clock.day,from:l.npc,picked:l.picked}},skillLesson:{...l,step:2 as const,mini:undefined}}
  return passTime(recordExperienceIn(next,{id:`learn:${FINISH_SKILL}`,kind:'learn',with:[l.npc],choice:l.picked==='warm'?1:0}),30)
}
/** 가구 모습만 고른다. 생산량·능력·책 작업에는 영향을 주지 않는다. */
export function chooseStoolFinish(s:SkillState,picked:WoodFinish):SkillState {
  if(!s.skills?.[FINISH_SKILL] || (picked!=='plain'&&picked!=='warm')) return s
  return {...s,flags:{...s.flags,'skillFinish:stool':picked==='warm'?2:1}}
}
export const STOOL_NEEDS = {reed:2} as const
export function craftLearnedStool(s:SkillState):SkillState {
  if(!s.skills?.[FINISH_SKILL] || !has(s.inv,STOOL_NEEDS) || overflows(s,{stool:1})) return s
  const next=putAway({...s,inv:take(s.inv,STOOL_NEEDS)!,flags:{...s.flags,'skillMade:stool':s.clock.day,'skillFinish:stool':s.flags['skillFinish:stool']??1}},{stool:1})
  return passTime(next,30)
}
/** 자신이 가진 의자를 보여 줄 때만 반응한다. */
export function canShowFinishedStool(s:SkillState):boolean {
  return !!s.skills?.[FINISH_SKILL] && (!!s.inv.stool || s.room.some(f=>f.item==='stool')) && (s.flags['skillMade:stool']??0)>0
}
export function sanitizeSkills(raw:unknown):Skills {
  if(!raw || typeof raw!=='object' || Array.isArray(raw)) return {}
  const result:Skills={}
  const v=(raw as Record<string,LearnedSkill>)[FINISH_SKILL]
  if(v && Number.isInteger(v.day) && v.day>0 && v.from==='carpenter' && (v.picked==='plain'||v.picked==='warm')) result[FINISH_SKILL]={day:v.day,from:v.from,picked:v.picked}
  return result
}
export function sanitizeSkillLesson(raw:unknown):SkillLesson|undefined {
  if(!raw || typeof raw!=='object') return undefined
  const l=raw as SkillLesson
  if(l.id!==FINISH_SKILL || l.npc!=='carpenter' || !Number.isInteger(l.day) || l.day<1 || ![0,1,2].includes(l.step) || !['plain','warm'].includes(l.picked)) return undefined
  return {id:FINISH_SKILL,npc:'carpenter',day:l.day,step:l.step,picked:l.picked,mini:l.step===1?startMini('hold',()=>.5):undefined}
}

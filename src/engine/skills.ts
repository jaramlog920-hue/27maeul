import { canWorkDay, type WorkState } from './work-day'
import { availability } from './plans'
import { notYet, passTime, playerTile, overflows, putAway, recordExperienceIn, type GameState } from './game'
import { npcTile } from './neighbors'
import { startMini, stepMini, tapMini, isDone, type MiniState } from './minigame'
import { has, take } from './items'
import { FINISH_SKILL, SKILL_DEFS, SKILL_IDS, skillOf } from './skill-defs'
import type { GameContent, Rng } from './types'

export { FINISH_SKILL, SKILL_DEFS, SKILL_IDS, skillOf }
export type WoodFinish = 'plain'|'warm'
export interface LearnedSkill {day:number;from:string;picked:string}
export type Skills = Record<string,LearnedSkill>
export interface SkillLesson {id:string;npc:string;day:number;step:0|1|2;picked:string;mini?:MiniState}
export type SkillState = GameState & {skills?:Skills;skillLesson?:SkillLesson}
/** 시범과 실습에 드는 시간 (끝낼 때 한 번) */
export const LESSON_MINUTES = 30
/** 함께 지낸 일로 배울 거리를 알게 된다 — 선물·인사만으로는 열리지 않는다 */
const DISCOVER_KINDS = ['work','club','event','story','project'] as const

function nearby(s:GameState,npc:string):boolean {
  const n=s.npcs[npc]
  const p=playerTile(s),at=n&&npcTile(n)
  return !!n?.visible && !!at && Math.abs(p.x-at.x)+Math.abs(p.y-at.y)<=3
}
/** 가르쳐 줄 이웃과 실제로 함께한 일이 있으면 배울 거리를 안다 */
export function discoveredSkill(s:SkillState,id:string):boolean {
  if(!SKILL_IDS.includes(id)) return false
  const def=SKILL_DEFS[id]
  return Object.values(s.life.experiences ?? {}).some(e=>e.with.some(w=>def.teachers.includes(w)) && (DISCOVER_KINDS as readonly string[]).includes(e.kind))
}
export function discoveredFinish(s:SkillState):boolean { return discoveredSkill(s,FINISH_SKILL) }

export type LessonBlock = 'unknown'|'known'|'away'|'busy'|'late'|null
/** 지금 이 이웃에게 배울 수 있는지. 바쁘면 다른 때를 안내할 뿐 불이익은 없다 */
export function canLearn(s:SkillState,npc:string,content:GameContent):LessonBlock {
  const id=skillOf(npc)
  if(!id) return 'away'
  if(s.skills?.[id]) return 'known'
  if(!discoveredSkill(s,id)) return 'unknown'
  if((s as WorkState).workDay?.day===s.clock.day && !(s as WorkState).workDay?.paid) return 'busy'
  if(id===FINISH_SKILL) {
    // 목수는 작업장에서 일하는 시간에 보여 준다. 진행 중인 같은 손일은 돕기 표식과 관계없이 이어갈 수 있다.
    const check=canWorkDay({...s,helped:s.helped.filter(n=>n!=='carpenter'),workDay:undefined,flags:{...s.flags,workPayDay:0}},'carpenter',content)
    return check==='away'||check==='late' ? check : check ? 'busy' : null
  }
  const d=content.neighbors.find(n=>n.id===npc)
  if(!d || notYet(d,s.flags.villageLevel??0,s.flags) || !nearby(s,npc)) return 'away'
  if(s.clock.minute+LESSON_MINUTES>18*60) return 'late'
  if(availability(s,npc,s.clock.day,s.clock.minute,s.clock.minute+LESSON_MINUTES,content)!=='ok') return 'busy'
  return null
}
export function canLearnFinish(s:SkillState,content:GameContent):LessonBlock { return canLearn(s,'carpenter',content) }

/** 시범부터 시작한다. 오늘 같은 이웃과 하던 배움이 있으면 그 단계에서 이어간다 */
export function startLesson(s:SkillState,npc:string,content:GameContent):SkillState {
  const id=skillOf(npc)
  if(!id || canLearn(s,npc,content)) return s
  const l=s.skillLesson
  if(l?.day===s.clock.day && l.id===id && l.npc===npc && l.step<2) return s
  return {...s,skillLesson:{id,npc,day:s.clock.day,step:0,picked:SKILL_DEFS[id].styles[0]}}
}
export function startFinishLesson(s:SkillState,content:GameContent):SkillState { return startLesson(s,'carpenter',content) }

function current(s:SkillState):SkillLesson|null {
  const l=s.skillLesson
  return l && l.day===s.clock.day && SKILL_IDS.includes(l.id) && nearby(s,l.npc) ? l : null
}
/** 모양·방식을 고르고 실습을 시작한다 */
export function chooseStyle(s:SkillState,picked:string,rng:Rng):SkillState {
  const l=current(s)
  if(!l || l.step!==0 || !SKILL_DEFS[l.id].styles.includes(picked)) return s
  return {...s,skillLesson:{...l,picked,step:1,mini:startMini(SKILL_DEFS[l.id].hand,rng)}}
}
export const chooseFinish = (s:SkillState,picked:WoodFinish,rng:Rng):SkillState => chooseStyle(s,picked,rng)
/** 실습 중 다시 살펴보기 — 다른 방식을 고르는 데로 돌아간다 (실패로 끝나지 않는다) */
export function lookAgain(s:SkillState):SkillState {
  const l=current(s)
  if(!l || l.step!==1) return s
  return {...s,skillLesson:{...l,step:0,mini:undefined}}
}
export function lessonHand(s:SkillState,kind:'tick'|'tap',input:number,rng:Rng):SkillState {
  const l=current(s)
  if(!l || l.step!==1 || !l.mini) return s
  return {...s,skillLesson:{...l,mini:kind==='tick'?stepMini(l.mini,Math.min(.2,Math.max(0,input)),rng):tapMini(l.mini,input)}}
}
export const finishLessonHand = lessonHand
/** 실습을 마치면 한 번만 익힌다. 배운 날·가르쳐 준 이웃·고른 모습이 함께한 기억으로 남는다 */
export function finishLesson(s:SkillState):SkillState {
  const l=current(s)
  if(!l || l.step!==1 || !l.mini || !isDone(l.mini) || s.skills?.[l.id]) return s
  const def=SKILL_DEFS[l.id]
  const idx=Math.max(0,def.styles.indexOf(l.picked))
  const next={...s,flags:{...s.flags,[`skillFinish:${def.item}`]:idx+1},skills:{...s.skills,[l.id]:{day:s.clock.day,from:l.npc,picked:l.picked}},skillLesson:{...l,step:2 as const,mini:undefined}}
  return passTime(recordExperienceIn(next,{id:`learn:${l.id}`,kind:'learn',with:[l.npc],choice:idx,item:def.item}),LESSON_MINUTES)
}
/** 물건 모습만 고른다. 생산량·능력·책 작업에는 영향을 주지 않는다. */
export function chooseSkillStyle(s:SkillState,id:string,picked:string):SkillState {
  const def=SKILL_IDS.includes(id) ? SKILL_DEFS[id] : undefined
  if(!def || !s.skills?.[id] || !def.styles.includes(picked)) return s
  return {...s,flags:{...s.flags,[`skillFinish:${def.item}`]:def.styles.indexOf(picked)+1}}
}
export const chooseStoolFinish = (s:SkillState,picked:WoodFinish):SkillState => chooseSkillStyle(s,FINISH_SKILL,picked)
export function styleOf(s:SkillState,id:string):string {
  const def=SKILL_DEFS[id]
  return s.flags[`skillFinish:${def.item}`]===2 ? def.styles[1] : def.styles[0]
}
/** 개인 재료로 배운 물건 하나를 만든다 (재료가 정해진 기술만) */
export function craftLearned(s:SkillState,id:string):SkillState {
  const def=SKILL_IDS.includes(id) ? SKILL_DEFS[id] : undefined
  if(!def?.needs || !s.skills?.[id] || !has(s.inv,def.needs) || overflows(s,{[def.item]:1})) return s
  const key=`skillFinish:${def.item}`
  const next=putAway({...s,inv:take(s.inv,def.needs)!,flags:{...s.flags,[`skillMade:${def.item}`]:s.clock.day,[key]:s.flags[key]??1}},{[def.item]:1})
  return passTime(next,30)
}
export const STOOL_NEEDS = SKILL_DEFS[FINISH_SKILL].needs!
export const craftLearnedStool = (s:SkillState):SkillState => craftLearned(s,FINISH_SKILL)
/** 배운 방식의 물건을 가지고 있을 때만 보여 줄 수 있다 (만드는 기술은 직접 만든 것이 있어야) */
export function canShowSkillItem(s:SkillState,id:string):boolean {
  const def=SKILL_IDS.includes(id) ? SKILL_DEFS[id] : undefined
  if(!def || !s.skills?.[id]) return false
  const owns=!!s.inv[def.item] || s.room.some(f=>f.item===def.item)
  return owns && (!def.needs || (s.flags[`skillMade:${def.item}`]??0)>0)
}
export const canShowFinishedStool = (s:SkillState):boolean => canShowSkillItem(s,FINISH_SKILL)
export function sanitizeSkills(raw:unknown):Skills {
  if(!raw || typeof raw!=='object' || Array.isArray(raw)) return {}
  const result:Skills={}
  for(const id of SKILL_IDS) {
    const v=(raw as Record<string,LearnedSkill>)[id], def=SKILL_DEFS[id]
    if(v && Number.isInteger(v.day) && v.day>0 && def.teachers.includes(v.from) && def.styles.includes(v.picked)) result[id]={day:v.day,from:v.from,picked:v.picked}
  }
  return result
}
export function sanitizeSkillLesson(raw:unknown):SkillLesson|undefined {
  if(!raw || typeof raw!=='object') return undefined
  const l=raw as SkillLesson
  const def=typeof l.id==='string' && SKILL_IDS.includes(l.id) ? SKILL_DEFS[l.id] : undefined
  if(!def || !def.teachers.includes(l.npc) || !Number.isInteger(l.day) || l.day<1 || ![0,1,2].includes(l.step) || !def.styles.includes(l.picked)) return undefined
  return {id:l.id,npc:l.npc,day:l.day,step:l.step,picked:l.picked,mini:l.step===1?startMini(def.hand,()=>.5):undefined}
}

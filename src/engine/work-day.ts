import { availability } from './plans'
import { notYet, passTime, playerTile, recordExperienceIn, routineOf, type GameState } from './game'
import { npcTile } from './neighbors'
import { isDone, startMini, stepMini, tapMini, type MiniState } from './minigame'
import type { GameContent, Rng } from './types'
import { isWet, grapesRipe, weatherOf } from './calendar'

export const WORK_PAY = 8
export const WORK_MINUTES = 120
export interface WorkDay {
  id: string; npc: string; day: number; startedAt: number; step: number
  choices: string[]; used: boolean; paid: boolean; mini?: MiniState
}
export type WorkState = GameState & { workDay?: WorkDay }
/** 가게 공급품으로 하는 손일. 위험한 공정은 주민이 맡는다. */
export const WORK_JOBS: Record<string, readonly string[]> = {
  carpenter: ['wood'], tilly: ['hammer'], smith: ['hammer'], baker: ['bread'], wendell: ['bread'],
  weaver: ['weave'], penelope: ['weave'], presser: ['press'], grandpa: ['grape'],
  shepherd: ['sheep'], dexter: ['sheep'], poppy: ['tea'], basil: ['herb'], apothecary: ['sort'], fisher: ['net'],
}
export type WorkBlock = 'away' | 'notWorking' | 'busy' | 'done' | 'late' | 'weather' | 'season' | null
function nearby(s: GameState, npc: string): boolean {
  const n = s.npcs[npc]
  const p = playerTile(s), at = n && npcTile(n)
  return !!n?.visible && !!at && Math.abs(p.x-at.x)+Math.abs(p.y-at.y) <= 3
}
export function canWorkDay(s: WorkState, npc: string, content: GameContent): WorkBlock {
  const d = content.neighbors.find((n) => n.id === npc)
  if (!d || notYet(d, s.flags.villageLevel ?? 0, s.flags) || !nearby(s, npc)) return 'away'
  if (s.workDay && !s.workDay.paid && s.workDay.day === s.clock.day) return 'busy'
  if (s.helped.includes(npc) || s.flags.workPayDay === s.clock.day) return 'done'
  if (s.clock.minute + WORK_MINUTES > 18*60) return 'late'
  if (npc === 'fisher' && isWet(weatherOf(s.clock.day))) return 'weather'
  if (npc === 'grandpa' && !grapesRipe(s.clock.day)) return 'season'
  const r = routineOf(s, npc)
  if (!r?.doing || !WORK_JOBS[npc]?.includes(r.doing)) return 'notWorking'
  const at=npcTile(s.npcs[npc])
  if(Math.abs(at.x-r.at.x)+Math.abs(at.y-r.at.y)>1) return 'notWorking'
  // 필요한 두 시간 모두 근무 중이어야 한다. 일과 변경 직전에는 시작하지 않는다.
  const later = routineOf({ ...s, clock: { ...s.clock, minute: s.clock.minute + WORK_MINUTES - 1 } }, npc)
  if (!later?.doing || !WORK_JOBS[npc]?.includes(later.doing) || later.at.x !== r.at.x || later.at.y !== r.at.y) return 'notWorking'
  if (availability(s, npc, s.clock.day, s.clock.minute, s.clock.minute+WORK_MINUTES, content) !== 'ok') return 'busy'
  return null
}
export function startWorkDay(s: WorkState, npc: string, choice: 'sort'|'finish', content: GameContent): WorkState {
  if (canWorkDay(s, npc, content)) return s
  return { ...s, helped: [...s.helped, npc], workDay: { id: `work:${npc}:${s.clock.day}`, npc, day:s.clock.day, startedAt:s.clock.minute, step:0, choices:[choice], used:false, paid:false } }
}
export function prepareWorkDay(s: WorkState, rng: Rng): WorkState {
  const w=s.workDay
  if (!w || w.paid || w.day!==s.clock.day || w.step!==0 || !nearby(s,w.npc)) return s
  const next=passTime(s,30)
  return { ...next, workDay:{...w,step:1,used:true,mini:startMini('hold',rng)} }
}
export function workDayHand(s: WorkState, kind: 'tick'|'tap', input: number, rng: Rng): WorkState {
  const w=s.workDay
  if (!w || w.paid || w.day!==s.clock.day || !w.mini || w.step<1 || w.step>2 || !nearby(s,w.npc)) return s
  const mini=kind==='tick'?stepMini(w.mini,Math.min(.2,Math.max(0,input)),rng):tapMini(w.mini,input)
  return { ...s,workDay:{...w,mini} }
}
export function finishWorkStep(s: WorkState, rng: Rng): WorkState {
  const w=s.workDay
  if (!w || w.paid || w.day!==s.clock.day || !w.mini || !isDone(w.mini) || !nearby(s,w.npc)) return s
  const next=passTime(s,30)
  return { ...next,workDay:{...w,step:w.step+1,mini:w.step===1?startMini('hold',rng):undefined} }
}
export function finishWorkDay(s: WorkState): WorkState {
  const w=s.workDay
  if (!w || w.paid || w.day!==s.clock.day || w.step!==3 || !nearby(s,w.npc)) return s
  const pay=s.flags.workPayDay===s.clock.day?0:WORK_PAY
  let next:WorkState={...s,coins:s.coins+pay,flags:{...s.flags,workPayDay:s.clock.day},workDay:{...w,step:4,paid:true}}
  next=recordExperienceIn(next,{id:w.id,kind:'work',with:[w.npc],choice:w.choices[0]==='finish'?1:0})
  return passTime(next,30)
}
/** 자리를 떠나도 끝낸 단계는 남는다. 다음 날은 단계당 2닢만 한 번 정산한다. */
export function expireWorkDay(s: WorkState): WorkState {
  const w=s.workDay
  if (!w || w.paid || w.day>=s.clock.day) return s
  const pay=s.flags.workPayDay===w.day?0:Math.min(WORK_PAY,Math.max(0,w.step-1)*2)
  return {...s,coins:s.coins+pay,flags:{...s.flags,workPayDay:w.day},workDay:{...w,paid:true,mini:undefined}}
}
export function sanitizeWorkDay(raw: unknown): WorkDay|undefined {
  if (!raw || typeof raw!=='object') return undefined
  const w=raw as WorkDay
  if (typeof w.id!=='string' || typeof w.npc!=='string' || !WORK_JOBS[w.npc] || !Number.isInteger(w.day) || w.day<1 || !Number.isFinite(w.startedAt) || !Number.isInteger(w.step) || w.step<0 || w.step>4) return undefined
  // 진행 중 손일만 다시 시작한다. 끝낸 단계와 정산은 그대로 둔다.
  return {id:w.id,npc:w.npc,day:w.day,startedAt:w.startedAt,step:w.step,choices:Array.isArray(w.choices)?w.choices.filter(x=>x==='sort'||x==='finish'):[],used:w.used===true,paid:w.paid===true,mini:w.step===1||w.step===2?startMini('hold',()=>.5):undefined}
}

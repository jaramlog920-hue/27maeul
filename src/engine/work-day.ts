import { availability } from './plans'
import { heartUp, notYet, passTime, playerTile, recordExperienceIn, routineOf, stageWith, type GameState } from './game'
import { npcTile } from './neighbors'
import { GAIN } from './hearts'
import { isDone, startMini, stepMini, tapMini, type MiniState } from './minigame'
import { personOf, relOf, type Activity } from './people'
import type { GameContent, Minigame, Rng } from './types'
import { isWet, grapesRipe, weatherOf } from './calendar'

export const WORK_PAY = 8
export const WORK_MINUTES = 120
/** 이 회차를 끝낸 흔적(작업장 앞 소품)이 놓여 있는 날 수 */
export const WORK_TRACE_DAYS = 3
export interface WorkDay {
  id: string; npc: string; day: number; startedAt: number; step: number
  /** [맡은 부분, 마무리 방식] — 마무리는 끝낼 때 더한다 */
  choices: string[]; used: boolean; paid: boolean; mini?: MiniState
  /** 이 회차의 두 손일 (시작할 때 정한다 — 계절 작업이 저장 뒤에도 같게). 옛 저장은 길게 누르기 둘 */
  hands?: Minigame[]
}
export type WorkState = GameState & { workDay?: WorkDay }

/**
 * 작업장별 함께 일하기 (02 문서 §4). 가게 공급품으로 하는 안전한 손일만 맡고, 위험한 공정은 주민이 맡는다.
 * prep: 맡을 부분 · hands: 짧은 손일 둘(기존 여섯 손일 재사용) · finish: 마무리(진열·정리·인계) · art: 작업장 앞에 남는 흔적(assets 도트)
 */
export interface WorkShop {
  npcs: readonly string[]
  jobs: readonly Activity[]
  prep: readonly string[]
  hands: (day: number) => Minigame[]
  finish: readonly string[]
  art: (prep: string, finish: string, hands: readonly Minigame[]) => string
}
const fixed = (a: Minigame, b: Minigame) => () => [a, b]
export const WORK_SHOPS: Record<string, WorkShop> = {
  carpenter: { npcs: ['carpenter'], jobs: ['wood'], prep: ['sort', 'finish'], hands: fixed('hold', 'hold'), finish: ['light', 'dark'], art: (_p, f) => (f === 'dark' ? 'woodenFinishDark' : 'woodenFinishLight') },
  bakery: { npcs: ['baker', 'wendell'], jobs: ['bread'], prep: ['round', 'plain'], hands: fixed('mash', 'order'), finish: ['front', 'tray'], art: (p, f) => (f === 'tray' ? 'breadTray' : p === 'plain' ? 'breadPlain' : 'breadRound') },
  forge: { npcs: ['smith', 'tilly'], jobs: ['hammer'], prep: ['round', 'square'], hands: fixed('timing', 'pick'), finish: ['hang', 'box'], art: (p, f) => (f === 'box' ? 'metalParts' : p === 'square' ? 'ringSquare' : 'ringRound') },
  loom: { npcs: ['weaver', 'penelope'], jobs: ['weave'], prep: ['blue', 'rose'], hands: fixed('weave', 'hold'), finish: ['shelf', 'fold'], art: (p) => (p === 'rose' ? 'clothRose' : 'clothBlue') },
  press: { npcs: ['presser'], jobs: ['press'], prep: ['jars', 'cloth'], hands: fixed('order', 'hold'), finish: ['shade', 'label'], art: () => 'oilFull' },
  vineyard: { npcs: ['grandpa'], jobs: ['grape'], prep: ['look', 'basket'], hands: (day) => (grapesRipe(day) ? ['pick', 'hold'] : ['order', 'weave']), finish: ['share', 'shed'], art: (_p, _f, h) => (h[0] === 'pick' ? 'basketGrapes' : 'basketEmpty') },
  pen: { npcs: ['shepherd', 'dexter'], jobs: ['sheep'], prep: ['water', 'fence'], hands: fixed('hold', 'pick'), finish: ['sack', 'shelf'], art: () => 'woolSorted' },
  teahouse: { npcs: ['poppy'], jobs: ['tea'], prep: ['cups', 'snack'], hands: fixed('order', 'hold'), finish: ['tray', 'seats'], art: (_p, f) => (f === 'tray' ? 'teaTray' : 'cupPersonal') },
  apothecary: { npcs: ['apothecary', 'basil'], jobs: ['sort', 'herb'], prep: ['jars', 'labels'], hands: fixed('pick', 'order'), finish: ['shelf', 'handover'], art: () => 'namePlate' },
  dock: { npcs: ['fisher'], jobs: ['net'], prep: ['net', 'tools'], hands: fixed('weave', 'order'), finish: ['rack', 'box'], art: () => 'netRepaired' },
}
export function shopOf(npc: string): string | null {
  for (const [id, sh] of Object.entries(WORK_SHOPS)) if (sh.npcs.includes(npc)) return id
  return null
}
/** 이 이웃이 근무 중으로 보는 일과 (예전 표와 같은 값) */
export const WORK_JOBS: Record<string, readonly string[]> = Object.fromEntries(
  Object.values(WORK_SHOPS).flatMap((sh) => sh.npcs.map((n) => [n, sh.npcs.length > 1 && sh.jobs.length > 1 ? [sh.jobs[sh.npcs.indexOf(n)]] : sh.jobs])),
)
const MINIS: readonly Minigame[] = ['mash', 'timing', 'pick', 'hold', 'weave', 'order']

export type WorkBlock = 'away' | 'notWorking' | 'busy' | 'done' | 'late' | 'weather' | null
function nearby(s: GameState, npc: string): boolean {
  const n = s.npcs[npc]
  const p = playerTile(s), at = n && npcTile(n)
  return !!n?.visible && !!at && Math.abs(p.x-at.x)+Math.abs(p.y-at.y) <= 3
}
export function canWorkDay(s: WorkState, npc: string, content: GameContent): WorkBlock {
  const d = content.neighbors.find((n) => n.id === npc)
  if (!d || !shopOf(npc) || notYet(d, s.flags.villageLevel ?? 0, s.flags) || !nearby(s, npc)) return 'away'
  if (s.workDay && !s.workDay.paid && s.workDay.day === s.clock.day) return 'busy'
  if (s.helped.includes(npc) || s.flags.workPayDay === s.clock.day) return 'done'
  if (s.clock.minute + WORK_MINUTES > 18*60) return 'late'
  // 나루는 궂은 날 쉰다 (그물이 젖고 물가가 미끄럽다)
  if (shopOf(npc) === 'dock' && isWet(weatherOf(s.clock.day))) return 'weather'
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
/** 맡을 부분을 고르고 시작한다. 고를 수 없는 값이면 그 작업장의 첫 부분 */
export function startWorkDay(s: WorkState, npc: string, choice: string, content: GameContent): WorkState {
  if (canWorkDay(s, npc, content)) return s
  const sh = WORK_SHOPS[shopOf(npc)!]
  const prep = sh.prep.includes(choice) ? choice : sh.prep[0]
  return { ...s, helped: [...s.helped, npc], workDay: { id: `work:${npc}:${s.clock.day}`, npc, day:s.clock.day, startedAt:s.clock.minute, step:0, choices:[prep], used:false, paid:false, hands: sh.hands(s.clock.day) } }
}
const handsOf = (w: WorkDay): Minigame[] => w.hands ?? ['hold', 'hold']
export function prepareWorkDay(s: WorkState, rng: Rng): WorkState {
  const w=s.workDay
  if (!w || w.paid || w.day!==s.clock.day || w.step!==0 || !nearby(s,w.npc)) return s
  const next=passTime(s,30)
  return { ...next, workDay:{...w,step:1,used:true,mini:startMini(handsOf(w)[0],rng)} }
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
  return { ...next,workDay:{...w,step:w.step+1,mini:w.step===1?startMini(handsOf(w)[1],rng):undefined} }
}
/** 마무리 방식을 고르고 끝낸다. 수고비는 하루 한 번, 마음(GAIN.work)이 오르고, 가게 물건은 가방에 들지 않는다 — 흔적은 작업장 앞 소품으로 남는다 */
export function finishWorkDay(s: WorkState, finish?: string): WorkState {
  const w=s.workDay
  if (!w || w.paid || w.day!==s.clock.day || w.step!==3 || !nearby(s,w.npc)) return s
  const sh=WORK_SHOPS[shopOf(w.npc)!]
  const fin=finish && sh.finish.includes(finish) ? finish : sh.finish[0]
  const prep=w.choices[0] ?? sh.prep[0]
  const pay=s.flags.workPayDay===s.clock.day?0:WORK_PAY
  let next:WorkState={...s,coins:s.coins+pay,flags:{...s.flags,workPayDay:s.clock.day},workDay:{...w,step:4,paid:true,choices:[prep,fin]}}
  // 같은 이웃과 함께 일한 기억은 한 항목 (횟수·최근 날이 쌓인다). 함께한 그 이웃만
  next=recordExperienceIn(next,{id:`work:${w.npc}`,kind:'work',with:[w.npc],choice:sh.finish.indexOf(fin),place:shopOf(w.npc)!,item:sh.art(prep,fin,handsOf(w))})
  // 끝까지 함께 일하면 마음도 오른다 (중간에 그만둔 날은 수고비만)
  next=heartUp(next,w.npc,GAIN.work)
  return passTime(next,30)
}
/** 자리를 떠나도 끝낸 단계는 남는다. 다음 날은 끝낸 손일 하나당 2닢만 한 번 정산한다(기억·흔적은 남지 않는다). */
export function expireWorkDay(s: WorkState): WorkState {
  const w=s.workDay
  if (!w || w.paid || w.day>=s.clock.day) return s
  const pay=s.flags.workPayDay===w.day?0:Math.min(WORK_PAY,Math.max(0,w.step-1)*2)
  return {...s,coins:s.coins+pay,flags:{...s.flags,workPayDay:w.day},workDay:{...w,paid:true,mini:undefined}}
}
/** 이웃이 하는 말 (작업장 안내·손일·마무리). 연인·배우자에게 다른 첫마디가 있으면 그것 */
export function workLine(s: GameState, npc: string, at: 'start'|'hand'|'finish'): string | null {
  const l = personOf(npc)?.workLines
  if (!l) return null
  if (at === 'start') {
    const r = s.romance?.partner === npc ? s.romance.stage : null
    const rel = relOf(stageWith(s, npc), r)
    if (rel === 'spouse' && l.spouse) return l.spouse
    if (rel === 'lover' && l.lover) return l.lover
  }
  return l[at] ?? null
}
export function sanitizeWorkDay(raw: unknown): WorkDay|undefined {
  if (!raw || typeof raw!=='object') return undefined
  const w=raw as WorkDay
  const shop=typeof w.npc==='string' ? shopOf(w.npc) : null
  if (typeof w.id!=='string' || !shop || !Number.isInteger(w.day) || w.day<1 || !Number.isFinite(w.startedAt) || !Number.isInteger(w.step) || w.step<0 || w.step>4) return undefined
  const sh=WORK_SHOPS[shop]
  const choices=Array.isArray(w.choices)?w.choices.filter((x,i)=>typeof x==='string' && (i===0?sh.prep:sh.finish).includes(x)).slice(0,2):[]
  const hands=Array.isArray(w.hands)&&w.hands.length===2&&w.hands.every(h=>MINIS.includes(h))?[...w.hands]:undefined
  const out:WorkDay={id:w.id,npc:w.npc,day:w.day,startedAt:w.startedAt,step:w.step,choices,used:w.used===true,paid:w.paid===true}
  if (hands) out.hands=hands
  // 진행 중 손일만 다시 시작한다. 끝낸 단계와 정산은 그대로 둔다.
  if (w.step===1||w.step===2) out.mini=startMini(handsOf(out)[w.step-1],()=>.5)
  return out
}

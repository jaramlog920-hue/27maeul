import { spotsForAppt, venueFor, type Appt } from './plans'
import type { GameState } from './game'
import type { EventMotion } from './event-scene'
import type { ClubActivity } from './clubs'
import type { Tile } from './types'
import { FESTIVAL_SPOTS, FIRE } from './neighbors'
import { festivalOf, isWet, weatherOf } from './calendar'

export const SOCIAL_ACTIONS = ['wave','pour','offer','drink','stitch','show','inspect','point','dig','sow','water','read','prepare','play','tidy'] as const
export type SocialAction = typeof SOCIAL_ACTIONS[number]
export type SocialProp = 'teapot'|'cup'|'cloth'|'seed'|'water'|'book'|'copy'|'dough'|'bowl'|'food'|'picture'|'instrument'|'gift'|'tray'|'decor'
export const SOCIAL_CYCLE = 18
export interface SocialBeat { action: SocialAction | 'clap' | 'nod' | 'smile'; prop?: SocialProp; label: string }
const beat = (action: SocialBeat['action'], prop: SocialProp | undefined, label: string): SocialBeat => ({action,prop,label})
export const CLUB_BEATS: Record<ClubActivity, readonly SocialBeat[]> = {
 tea:[beat('inspect','cup','찻잔 준비'),beat('pour','teapot','차 따르기'),beat('pour','teapot','내민 잔에 차 따르기'),beat('drink','cup','함께 차 마시기')],
 sew:[beat('inspect','cloth','천 꺼내기'),beat('stitch','cloth','함께 바느질'),beat('show','cloth','천 펼쳐 보여주기'),beat('clap',undefined,'작품에 박수')],
 observe:[beat('inspect',undefined,'주변 둘러보기'),beat('read','book','발견한 것 기록'),beat('point',undefined,'발견한 곳 가리키기'),beat('nod',undefined,'같은 곳 바라보기')],
 garden:[beat('dig','seed','흙 파기'),beat('sow','seed','씨앗 심기'),beat('water','water','이웃이 물주기'),beat('nod',undefined,'심은 자리 살피기')],
 read:[beat('inspect','book','책 펼치기'),beat('read','book','함께 읽기'),beat('show','book','한 부분 가리키기'),beat('nod',undefined,'함께 들여다보기')],
 cook:[beat('prepare','dough','반죽하기'),beat('prepare','bowl','재료 섞기'),beat('offer','food','음식 건네기'),beat('drink','food','맛보고 반응하기')],
 paint:[beat('inspect','picture','그림 준비'),beat('prepare','picture','함께 그림 그리기'),beat('show','picture','완성품 보여주기'),beat('clap',undefined,'감상하고 박수')],
 music:[beat('inspect','instrument','악기 준비'),beat('play','instrument','악기 연주'),beat('play','instrument','함께 박자 맞추기'),beat('clap',undefined,'박수로 응답하기')],
}
const distance = (a: Tile,b: Tile) => Math.abs(a.x-b.x)+Math.abs(a.y-b.y)
const toward = (a: Tile,b: Tile): EventMotion['facing'] => Math.abs(a.x-b.x)>=Math.abs(a.y-b.y)?a.x>b.x?'left':'right':a.y>b.y?'up':'down'
function frame(action:SocialBeat['action'],prop:SocialProp|undefined,facing:EventMotion['facing'],t:number,label:string,offset?:Tile):EventMotion {
 return {set:['clap','nod','smile'].includes(action)?'event':'social',action,prop,facing,frame:Math.floor(t*(action==='play'?5:4))%(['clap','nod','smile'].includes(action)?4:8),label,offset}
}
function participants(s:GameState,a:Appt) {
 const spots=spotsForAppt(a)
 return (a.startedWith??a.members).map((id,i)=>({id,at:spots[i],actor:s.npcs[id]})).filter(p=>p.at&&p.actor?.visible&&!p.actor.path.length&&distance(p.actor,p.at)<.6)
}
/** 같은 회차의 공통 시계와 역할 순서. 반응은 0.3~0.7초 늦게 이어진다. */
export function socialEventMotion(s:GameState,id:string,t:number):EventMotion|null {
 const festival=s.fests?.find(f=>f.kind==='festival'&&f.day===s.clock.day&&!f.closed)
 if(festival&&festivalOf(s.clock.day)&&!isWet(weatherOf(s.clock.day))&&s.clock.minute>=1080&&s.clock.minute<1260) {
  const actor=id==='player'?s.player:s.npcs[id],at=id==='player'?FIRE:FESTIVAL_SPOTS[id]
  if((id==='player'||s.npcs[id]?.visible)&&actor&&at&&!actor.path.length&&distance(actor,at)<=4) {
   const phase=(s.clock.minute-1080)%18,owner=id==='player'||Object.keys(FESTIVAL_SPOTS).indexOf(id)%3===0
   const role=festival.role??'food'
   const action=role==='deco'?'show':role==='tidy'?'tidy':phase<9?'prepare':'offer'
   const task=festival.task
   const finished=(task?.stage??0)>=3
   const target=id==='player'?s.npcs[task?.choice??'']??s.npcs.baker??FIRE:s.player
   const doing=id==='player'||(!task&&owner)
   return frame(finished?(id==='player'?'offer':'nod'):doing?action:'inspect',doing?(role==='deco'?'decor':role==='tidy'?'tray':'food'):undefined,toward(actor,target),t,finished?'함께 준비를 마치고 감사하기':'함께 잔치 준비')
  }
 }
 for(const a of s.plans?.appts??[]) {
  if(!['club','event'].includes(a.kind)||a.day!==s.clock.day||venueFor(a).moved)continue
  const closing=a.state==='done'&&a.endedAt!==undefined&&s.clock.minute>=a.endedAt&&s.clock.minute<a.endedAt+16
  if(!closing&&(a.state!=='running'||s.clock.minute<a.from||s.clock.minute>=a.to))continue
  const cast=participants(s,a)
  const me=id==='player'?s.player:cast.find(p=>p.id===id)?.actor
  if(!me||me.path.length)continue
  if(id==='player'&&(!a.attended||!spotsForAppt(a).some(p=>distance(p,me)<=3)||s.act))continue
  const index=id==='player'?-1:(a.startedWith??a.members).indexOf(id)
  if(closing) {
   const elapsed=s.clock.minute-a.endedAt!
   if(id!=='player'&&elapsed>=8+Math.floor(index/2)*4)continue
   return frame(elapsed<3?'wave':elapsed<7?'tidy':'wave',elapsed>=3&&elapsed<7?'tray':undefined,toward(me,cast.find(p=>p.id!==id)?.actor??s.player),t,'인사하고 정리하기')
  }
  if(!cast.length)continue
  const cycle=Math.floor((s.clock.minute-a.from)/SOCIAL_CYCLE)
  const f=s.fests?.find(f=>f.id===a.festId)
  const host=f?.kind==='housewarming'&&a.attended&&distance(s.player,cast[0].at)<=3?s.player:cast[cycle%cast.length].actor
  const leaderId=host===s.player?'player':cast[cycle%cast.length].id
  const isLead=id===leaderId
  const other=cast.find(p=>p.id!==leaderId)?.actor??(a.attended?s.player:host)
  const focus=isLead?other:host
  const lag=isLead?0:.3+((Math.max(0,index)*2+cycle)%5)*.1
  const phase=Math.max(0,(s.clock.minute-a.from)%SOCIAL_CYCLE-lag)
  const step=phase<3?0:phase<9?1:phase<12?2:3
  let selected:SocialBeat
  if(f) {
   if(f.step==='tidy')selected=beat(isLead?'tidy':'offer',isLead?'tray':'decor','행사 자리 준비')
   else if(f.step==='arrive')selected=beat(isLead?'wave':'offer',isLead?undefined:'gift','손님 맞이와 선물 인사')
   else if(f.step==='finish')selected=beat(step<2?'tidy':'wave',step<2?'tray':undefined,'물건 정리와 작별 인사')
   else if(f.kind==='showcase')selected=isLead?beat(step<2?'show':'point','picture','작품 소개'):beat(step<3?'inspect':'clap',undefined,'작품 살펴보고 박수')
   else if(f.kind==='housewarming'&&step===0)selected=beat(isLead?'point':'inspect',undefined,'집 안 함께 둘러보기')
   else selected=isLead?CLUB_BEATS.tea[step]:beat(step===1?'offer':step>=2?'drink':'inspect','cup','차 받고 감사하기')
  } else {
   const activity=a.activity as ClubActivity
   const beats=CLUB_BEATS[activity]
   if(!beats)continue
   selected=beats[step]
   if(!isLead&&step===2)selected=activity==='garden'?beat('water','water','심은 자리에 물주기'):activity==='tea'?beat('offer','cup','잔을 내밀기'):activity==='cook'?beat('drink','food','건넨 음식 맛보기'):beat('inspect',undefined,'진행자가 보여주는 것 살피기')
   if(isLead&&activity==='garden'&&step===2)selected=beat('inspect',undefined,'물주는 이웃 기다리기')
   if(!isLead&&step===3)selected=beat(activity==='music'||activity==='paint'||activity==='sew'?'clap':'nod',undefined,'조금 늦게 응답하기')
   if(activity==='read'&&s.clubSessions?.[a.id]?.picked?.includes('필사'))selected={...selected,prop:selected.prop==='book'?'copy':selected.prop,label:selected.label.replace('책','필사본')}
  }
  const task=f?.task??s.clubSessions?.[a.id]?.task
  if(task&&a.attended) {
   const activity=(a.activity && a.activity in CLUB_BEATS?a.activity:'tea') as ClubActivity
   const b=CLUB_BEATS[activity][Math.min(2,task.stage)]
   if(id==='player')selected=task.stage>=3?beat('show',b.prop,'이웃에게 보여주기'):b
   else selected=beat(task.stage>=3?'nod':'inspect',task.stage>=3&&activity==='tea'?'cup':undefined,'유저가 하는 일 바라보기')
   if(id==='player'&&task.stage===1) {
    if(activity==='garden')selected=task.selection?.includes('물주기')?beat('water','water','내가 물주기'):beat('sow','seed','내가 씨앗 심기')
    if(activity==='music'&&task.selection?.includes('박수'))selected=beat('clap',undefined,'내가 박수로 박자 맞추기')
    if(activity==='cook')selected=beat('prepare',task.selection?.includes('섞기')?'bowl':'dough','내가 음식 준비하기')
   }
   if(task.selection?.includes('필사본')&&id==='player')selected={...selected,action:task.stage===1?'read':'show',prop:'copy',label:task.stage===1?'내 말씀 필사본 함께 읽기':'내 말씀 필사본 보여주기'}
   if(f?.kind==='showcase'&&id==='player'&&!task.selection?.includes('필사본'))selected=beat('show','picture','내 작품 보여주기')
   if(!['tea','cook'].includes(activity)&&task.stage===0&&id==='player')selected={...selected,prop:CLUB_BEATS[activity][0].prop}
  }
  let facing=toward(me,focus)
  if(task&&a.attended)facing=toward(me,id==='player'?s.npcs[task.choice??'']??other:s.player)
  if(a.activity==='observe'&&step>=2)facing=(cycle%2?'up':'right')
  const leaning=!isLead&&step===3&&['sew','read','paint'].includes(a.activity??'')
  const offset=leaning?{x:(focus.x-me.x)*.12,y:(focus.y-me.y)*.12}:undefined
  return frame(selected.action,selected.prop,facing,t-lag,selected.label,offset)
 }
 return null
}

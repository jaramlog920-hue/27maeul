import { nameProblem } from './avatar'
import { availability, scheduleAppt, attendAppt, settleAppt, apptSpots, venueFor, type Appt } from './plans'
import { notYet, passTime, type GameState } from './game'
import { key, lockedTiles, PLACES } from './world'
import { builtIds } from './projects'
import { FACILITY_CLUBS, FACILITY_PLACES, SITES } from './village-sites'
import { seasonOf } from './clock'
import { weatherOf, isWet } from './calendar'
import { harvest, water, isRipe } from './garden'
import { has, take, addGift } from './items'
import type { GameContent, PlaceId, Tile } from './types'

export type ClubActivity = 'tea'|'sew'|'garden'|'observe'
export type ClubSlot = 'morning'|'afternoon'|'evening'
export interface Club {
 id:string; name:string; place:PlaceId; members:string[]; weekday:number; slot:ClubSlot; activity:ClubActivity; alt?:PlaceId; active:boolean; paused:boolean
}
export interface ClubSession {
 id:string; mode:'direct'|'beside'|'brief'; step:'choose'|'activity'|'finish'|'done'; picked?:string; note?:string
 woven?:boolean; made?:boolean; result?:'home'|'club'; gardenDone?:string[]
 /** 차 모임에 나눈 만든 음식 · 근황에 함께한 이웃 (2026-10-08 club-extras) */
 shared?:string; joinedNews?:string
}
export const CLUB_MAX=3
export const CLUB_SLOTS: Record<ClubSlot,readonly [number,number]>={morning:[600,720],afternoon:[840,960],evening:[1080,1200]}
export type ClubInput=Omit<Club,'id'|'active'|'paused'>
export const clubApptId=(club:string,day:number)=>`${club}:day:${day}`
export function nextClubDay(day:number,weekday:number):number {return day+((weekday-day%7+7)%7)}
/** 모임 장소가 될 수 있는 자리 전부 (저장에서 거를 때) — 공동 시설은 완성된 것만 clubVenues에 오른다 */
export const CLUB_PLACES:readonly PlaceId[]=['hallTable','teaTable','pavilion','garden',...FACILITY_PLACES]
export function clubVenues(s:GameState,activity:ClubActivity):PlaceId[] {
 const venues:PlaceId[]=['hallTable','teaTable','pavilion']
 if(activity==='garden' && Object.keys(s.garden).length) venues.push('garden')
 // 주민이 함께 지은 공동 시설 (계획 16 작업 20): 완성된 곳만, 그 시설에서 할 수 있는 모임만 — 꽃밭은 관찰 모임, 그늘막·긴 벤치는 차·바느질
 for(const id of builtIds(s.flags)) {const site=SITES[id]; if((FACILITY_CLUBS[site.place] as readonly string[]).includes(activity)) venues.push(site.place)}
 const locked=lockedTiles(Object.keys(s.shelved).length)
 return venues.filter(place=>apptSpots(place).length && apptSpots(place).every(t=>!locked.has(key(t))))
}
/** 함께 만든 작품 자리 (계획 16 작업 15): 모임 장소의 탁자·벤치 칸 중 앉는 자리·잠긴 칸이 아닌 곳만 — 길·앉는 자리·서는 칸을 쓰지 않는다. 같은 장소의 작품은 모임 번호 차례로 한 칸씩 */
export function clubWorkTiles(s:Pick<GameState,'shelved'>,place:PlaceId):Tile[] {
 const seats=new Set(apptSpots(place).map(key)),locked=lockedTiles(Object.keys(s.shelved).length)
 return (PLACES[place]?.tiles??[]).filter(t=>!seats.has(key(t)) && !locked.has(key(t)))
}
/** 이 모임 작품을 모임 자리에 남길 수 있는가 — 다른 모임 작품과 칸을 나눠 쓰고, 칸이 모자라면 집에 두기만 */
export function canLeaveWork(s:GameState,clubId:string,place:PlaceId):boolean {
 const others=Object.entries(s.clubWorks??{}).filter(([id,w])=>id!==clubId && w.place===place && (s.clubs??[]).some(c=>c.id===id && c.active)).length
 return clubWorkTiles(s,place).length>others
}
export interface ClubWorkSpot {club:string; art:'cushionPattern'; color:string; place:PlaceId; at:Tile}
/** 지금 모임 자리에 놓여 있는 작품 — 해산한 모임·아직 짓지 않은 공동 시설의 작품은 보이지 않는다 */
export function clubWorkSpots(s:Pick<GameState,'clubs'|'clubWorks'|'shelved'|'flags'>):ClubWorkSpot[] {
 const out:ClubWorkSpot[]=[],used:Record<string,number>={}
 const built=new Set(builtIds(s.flags).map(id=>SITES[id].place))
 const ids=Object.keys(s.clubWorks??{}).sort((a,b)=>(Number(a.split(':')[1])||0)-(Number(b.split(':')[1])||0))
 for(const club of ids) {
  const w=s.clubWorks[club]
  if(!(s.clubs??[]).some(c=>c.id===club && c.active) || !CLUB_PLACES.includes(w.place) || (FACILITY_PLACES.includes(w.place as never) && !built.has(w.place as never))) continue
  const at=clubWorkTiles(s,w.place)[used[w.place]??0]
  used[w.place]=(used[w.place]??0)+1
  if(at) out.push({club,art:'cushionPattern',color:w.color,place:w.place,at})
 }
 return out
}
export function clubCandidates(s:GameState,content:GameContent):string[] {
 return content.neighbors.filter(n=>s.notebook.met.includes(n.id) && !notYet(n,s.flags.villageLevel??0,s.flags)).map(n=>n.id)
}
export function createClub(s:GameState,input:ClubInput,content:GameContent,editId?:string):{state:GameState;error?:string} {
 const clubs=s.clubs??[]
 if(!editId && clubs.filter(c=>c.active).length>=CLUB_MAX) return {state:s,error:'limit'}
 if(nameProblem(input.name)) return {state:s,error:'name'}
 if(!clubVenues(s,input.activity).includes(input.place) || (input.alt && !clubVenues(s,input.activity).includes(input.alt))) return {state:s,error:'venue'}
 if(!input.members.length || input.members.length>3 || input.members.some(id=>!clubCandidates(s,content).includes(id))) return {state:s,error:'members'}
 if(!Number.isInteger(input.weekday) || input.weekday<0 || input.weekday>6 || !(input.slot in CLUB_SLOTS)) return {state:s,error:'time'}
 const [from,to]=CLUB_SLOTS[input.slot]
 let day=nextClubDay(s.clock.day,input.weekday)
 if(day===s.clock.day && from<=s.clock.minute) day+=7
 for(const member of input.members) {
  const check=availability(s,member,day,from,to,content)
  if(check!=='ok') return {state:s,error:check.busy}
 }
 const id=editId??`club:${Math.max(0,...clubs.map(c=>Number(c.id.split(':')[1])||0))+1}`
 const club:Club={...input,id,name:input.name.trim(),members:[...new Set(input.members)],active:true,paused:false}
 let next={...s,clubs:editId?clubs.map(c=>c.id===id?club:c):[...clubs,club]}
 // Edits affect the next session; a running session keeps its original cast and venue.
 if(editId) next={...next,plans:{...next.plans,appts:next.plans.appts.map(a=>a.clubId===id && a.state!=='running' && a.state!=='done'?{...a,state:'skipped' as const}:a)}}
 return {state:expandClubs(next,content)}
}
export function pauseClub(s:GameState,id:string,paused=true):GameState {
 return {...s,clubs:(s.clubs??[]).map(c=>c.id===id?{...c,paused}:c),plans:{...s.plans,appts:s.plans.appts.map(a=>paused && a.clubId===id && a.state!=='running' && a.state!=='done'?{...a,state:'skipped'}:a)}}
}
export function dissolveClub(s:GameState,id:string):GameState {
 const next=pauseClub(s,id)
 return {...next,clubs:next.clubs.map(c=>c.id===id?{...c,active:false}:c)}
}
/** Keep only the next committed occurrence; each ID survives postponement and reconnecting. */
export function expandClubs(s:GameState,content:Pick<GameContent,'neighbors'>):GameState {
 let next=s
 for(const club of s.clubs??[]) {
  if(!club.active || club.paused || next.plans.appts.some(a=>a.clubId===club.id && ['planned','running','moved'].includes(a.state))) continue
  const [from,to]=CLUB_SLOTS[club.slot]
  let day=nextClubDay(s.clock.day,club.weekday)
  if(day===s.clock.day && from<=s.clock.minute) day+=7
  const id=clubApptId(club.id,day)
  if(next.plans.appts.some(a=>a.id===id)) continue
  // Forecast clashes move to a common available date; never substitute a festival for a session.
  let proposed=day
  let okay=false
  for(let d=day;d<=day+14;d++) {
   if(club.members.every(n=>availability(next,n,d,from,to,content)==='ok')) {proposed=d;okay=true;break}
  }
  if(!okay) continue
  const result=scheduleAppt(next,{kind:'club',day:proposed,from,to,place:club.place,alt:club.alt,members:club.members,activity:club.activity,clubId:club.id,title:club.name,...(proposed!==day?{movedFrom:day,reason:'busy' as const}:{})},content as GameContent)
  if(result.appt) next={...result.state,plans:{...result.state.plans,appts:result.state.plans.appts.map(a=>a.id===result.appt!.id?{...a,id,state:proposed!==day?'moved':'planned'}:a)}}
 }
 return next
}
export function clubHere(s:GameState,place:PlaceId):Appt|undefined {
 return s.plans.appts.find(a=>a.clubId && a.state==='running' && a.day===s.clock.day && s.clock.minute>=a.from && s.clock.minute<a.to && venueFor(a).place===place)
}
export function joinClub(s:GameState,id:string,mode:ClubSession['mode']):GameState {
 const next=attendAppt(s,id)
 const a=next.plans.appts.find(a=>a.id===id)
 if(!a?.attended || a.state!=='running') return s
 const saved=s.clubSessions?.[id]
 return {...next,clubSessions:{...s.clubSessions,[id]:saved??{id,mode,step:'choose'}}}
}
export function chooseClub(s:GameState,id:string,picked:string,note?:string):GameState {
 const run=s.clubSessions?.[id]
 if(!run || run.step!=='choose') return s
 return {...s,clubSessions:{...s.clubSessions,[id]:{...run,picked,note:note?.trim().slice(0,120),step:'activity'}}}
}
export function clubWeaveDone(s:GameState,id:string):GameState {
 const run=s.clubSessions?.[id]
 if(!run || run.step!=='activity') return s
 return {...s,clubSessions:{...s.clubSessions,[id]:{...run,woven:true,step:'finish'}}}
}
export function doClubActivity(s:GameState,id:string,plotKey?:string):GameState {
 const run=s.clubSessions?.[id],a=s.plans.appts.find(a=>a.id===id)
 if(!run || run.step!=='activity' || !a || a.state!=='running') return s
 let next=s
 if(a.activity==='garden' && venueFor(a).place==='garden' && plotKey && seasonOf(s.clock.day)!=='winter' && !isWet(weatherOf(s.clock.day))) {
  const [x,y]=plotKey.split(',').map(Number)
  const plot=s.garden[plotKey]
  if(plot && !run.gardenDone?.includes(plotKey)) next=(isRipe(plot)?harvest(s,{x,y}):water(s,{x,y}))??s
 }
 return {...next,clubSessions:{...next.clubSessions,[id]:{...run,step:'finish',gardenDone:plotKey?[...(run.gardenDone??[]),plotKey]:run.gardenDone}}}
}
export function finishClub(s:GameState,id:string,result:'home'|'club'='home'):GameState {
 const run=s.clubSessions?.[id],a=s.plans.appts.find(a=>a.id===id)
 if(!run || run.step!=='finish' || !a || !a.attended || a.state!=='running') return s
 let next=s
 // 전용 자리가 없으면(칸이 모자람) 작품은 집으로 — 길을 막지 않는다
 if(result==='club' && !canLeaveWork(s,a.clubId!,venueFor(a).place)) result='home'
 if(a.activity==='sew' && run.mode==='direct' && run.woven && !run.made && has(s.inv,{wool:2})) {
  next={...next,inv:take(next.inv,{wool:2})!}
  if(result==='home') next={...next,inv:addGift(next.inv,{cushion:1})}
  else next={...next,clubWorks:{...next.clubWorks,[a.clubId!]:{item:'cushion',color:run.picked??'blue',place:venueFor(a).place}}}
 }
 next={...next,clubSessions:{...next.clubSessions,[id]:{...run,step:'done',made:a.activity==='sew' && run.mode==='direct' && run.woven && has(s.inv,{wool:2}),result}}}
 next=passTime(next,Math.max(0,a.to-next.clock.minute))
 next=settleAppt(next,id)
 return next
}
export function sanitizeClubs(raw:unknown):Club[] {
 if(!Array.isArray(raw)) return []
 const ids=new Set<string>()
 return raw.filter((c):c is Club=>!!c && typeof c.id==='string' && !ids.has(c.id) && !nameProblem(c.name??'') && ['tea','sew','observe','garden'].includes(c.activity) && CLUB_PLACES.includes(c.place) && Array.isArray(c.members) && c.members.length>0 && c.members.length<=3 && c.members.every((id:unknown)=>typeof id==='string') && Number.isInteger(c.weekday) && c.weekday>=0 && c.weekday<=6 && c.slot in CLUB_SLOTS && !!ids.add(c.id)).slice(0,CLUB_MAX).map(c=>({...c,active:c.active!==false,paused:c.paused===true}))
}
export function sanitizeClubSessions(raw:unknown):Record<string,ClubSession> {
 if(!raw || typeof raw!=='object') return {}
 return Object.fromEntries(Object.entries(raw).filter(([id,r])=>!!r && typeof r==='object' && (r as ClubSession).id===id && ['direct','beside','brief'].includes((r as ClubSession).mode) && ['choose','activity','finish','done'].includes((r as ClubSession).step))) as Record<string,ClubSession>
}

import { scheduleAppt, attendAppt, settleAppt, venueFor, type Appt } from './plans'
import { reserveSeats, spaceReady } from './spaces'
import { passTime, type GameState } from './game'
import { festivalOf } from './calendar'
import { has, take, add, type Inventory } from './items'
import { isBirthday } from './notebook'
import type { GameContent, ItemId, PlaceId } from './types'

export type FestKind='tea'|'housewarming'|'showcase'|'festival'
export interface Fest {id:string;apptId:string;kind:FestKind;reserve:Inventory;decoration?:ItemId;role?:'food'|'cloth'|'tidy';step:'prepare'|'arrive'|'activity'|'talk'|'finish';choice?:string;closed:boolean;cancelled:boolean;birthday?:string}
export interface FestInput {kind:FestKind;day:number;from:number;place:PlaceId;alt?:PlaceId;members:string[];snack?:'bread'|'fig'|'honey';decoration?:'cushion'|'rug';role?:Fest['role'];birthday?:string;title:string}
export function createFest(s:GameState,input:FestInput,content:GameContent):{state:GameState;error?:string;id?:string} {
 if(input.day<s.clock.day || input.day>s.clock.day+7) return {state:s,error:'date'}
 if(input.members.length>3 || !input.members.length || input.members.some(id=>!s.notebook.met.includes(id))) return {state:s,error:'members'}
 if(input.kind==='showcase' && !Object.keys(s.clubWorks??{}).length && !Object.values(s.life.experiences??{}).some(e=>['make','work','learn'].includes(e.kind))) return {state:s,error:'work'}
 if(input.kind==='festival' && !festivalOf(input.day)) return {state:s,error:'festival'}
 const reserve:Inventory={...(input.snack?{[input.snack]:1}:{}),...(input.decoration?{[input.decoration]:1}:{})}
 if(!has(s.inv,reserve)) return {state:s,error:'stock'}
 const id=`fest:${Math.max(0,...(s.fests??[]).map(f=>Number(f.id.split(':')[1])||0))+1}`
 let seats:Appt['seats']
 if(input.kind==='housewarming') {
  const space=(s.spaces??[]).find(space=>space.use==='tea' && spaceReady(s.room,space))
  if(!space) return {state:s,error:'space'}
  const reservations=reserveSeats(s.room,space,input.members)
  if(Object.keys(reservations).length<input.members.length) return {state:s,error:'space'}
  seats=input.members.map(id=>reservations[id].stand)
 }
 const result=scheduleAppt(s,{kind:'event',festId:id,title:input.title,day:input.day,from:input.from,to:input.from+60,place:input.kind==='housewarming'?'house':input.place,alt:input.kind==='housewarming'?undefined:input.alt,members:input.members,activity:input.kind==='showcase'?'make':'tea',...(seats?{seats,requiresPlayer:true}:{})},content)
 if(!result.appt) return {state:s,error:typeof result.blocked==='object'?result.blocked.busy:String(result.blocked)}
 const fest:Fest={id,apptId:result.appt.id,kind:input.kind,reserve,decoration:input.decoration,role:input.role,step:'prepare',closed:false,cancelled:false,...(input.birthday && input.members.includes(input.birthday) && isBirthday(input.birthday,input.day)?{birthday:input.birthday}:{})}
 return {state:{...result.state,inv:take(s.inv,reserve)!,fests:[...(s.fests??[]),fest]},id}
}
export function cancelFest(s:GameState,id:string):GameState {
 const f=s.fests?.find(f=>f.id===id)
 if(!f || f.closed) return s
 return {...s,inv:add(s.inv,f.reserve),fests:s.fests.map(x=>x.id===id?{...x,reserve:{},closed:true,cancelled:true}:x),plans:{...s.plans,appts:s.plans.appts.map(a=>a.id===f.apptId?{...a,state:'skipped'}:a)}}
}
export function postponeFest(s:GameState,id:string,day:number,from:number,content:GameContent):{state:GameState;error?:string} {
 const f=s.fests?.find(f=>f.id===id),a=s.plans.appts.find(a=>a.id===f?.apptId)
 if(!f || !a || f.closed || a.state==='running' || day<s.clock.day || day>s.clock.day+7) return {state:s,error:'time'}
 const base={...s,plans:{...s.plans,appts:s.plans.appts.map(x=>x.id===a.id?{...x,state:'skipped' as const}:x)}}
 const result=scheduleAppt(base,{...a,day,from,to:from+(a.to-a.from)},content)
 if(!result.appt) return {state:s,error:typeof result.blocked==='object'?result.blocked.busy:String(result.blocked)}
 return {state:{...result.state,fests:result.state.fests.map(x=>x.id===id?{...x,apptId:result.appt!.id}:x)}}
}
export function joinFest(s:GameState,id:string):GameState {
 const f=s.fests?.find(f=>f.id===id)
 return f && !f.closed?attendAppt(s,f.apptId):s
}
export function stepFest(s:GameState,id:string,choice?:string):GameState {
 const f=s.fests?.find(f=>f.id===id),a=s.plans.appts.find(a=>a.id===f?.apptId)
 if(!f || f.closed || !a?.attended || a.state!=='running') return s
 const steps=['prepare','arrive','activity','talk','finish'] as const,index=steps.indexOf(f.step)
 let next={...s,fests:s.fests.map(x=>x.id===id?{...x,step:steps[Math.min(index+1,4)],...(choice?{choice}: {})}:x)}
 if(f.step==='finish') {
  next=settleAppt(passTime(next,Math.max(0,a.to-s.clock.minute)),a.id)
  next=settleFests(next)
 }
 return next
}
export function settleFests(s:GameState):GameState {
 let next=s
 for(const f of s.fests??[]) {
  const a=s.plans.appts.find(a=>a.id===f.apptId)
  if(f.closed || !a || !['done','skipped'].includes(a.state)) continue
  const remaining={...f.reserve}
  if(a.attended && a.state==='done') for(const snack of ['bread','fig','honey'] as const) delete remaining[snack]
  next={...next,inv:add(next.inv,remaining),fests:next.fests.map(x=>x.id===f.id?{...x,reserve:{},closed:true,step:'finish'}:x)}
 }
 return next
}
export function festHere(s:GameState,place:PlaceId):Fest|undefined {
 return s.fests?.find(f=>{const a=s.plans.appts.find(a=>a.id===f.apptId);return !f.closed && a?.state==='running' && venueFor(a).place===place})
}
export function sanitizeFests(raw:unknown):Fest[] {
 if(!Array.isArray(raw)) return []
 const ids=new Set<string>()
 return raw.filter((f):f is Fest=>!!f && typeof f.id==='string' && !ids.has(f.id) && typeof f.apptId==='string' && ['tea','housewarming','showcase','festival'].includes(f.kind) && ['prepare','arrive','activity','talk','finish'].includes(f.step) && !!ids.add(f.id)).map(f=>({...f,reserve:Object.fromEntries(Object.entries(f.reserve??{}).filter(([id,n])=>['bread','fig','honey','cushion','rug'].includes(id)&&Number.isInteger(n)&&(n as number)>0)),closed:f.closed===true,cancelled:f.cancelled===true}))
}

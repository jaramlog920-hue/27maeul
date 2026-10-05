import { CONTENT, PEOPLE } from '../content/catalog'
import { newGame, hallGuestsToday, settle, type GameState } from './game'
import { availability, scheduleAppt, venueFor, advancePlans, settleAppt, attendAppt, appointmentSpots, sanitizePlans, APPT_HEART_CAP, inviteReaction, type Appt } from './plans'
import { weatherOf, festivalOf } from './calendar'
import { deserialize, serialize } from './save'
import { scheduledEvents, alertsBetween } from './events'

function ready(day=2,minute=480):GameState {
  const s=newGame(CONTENT)
  return {...s,clock:{day,minute},scenes:[],flags:{...s.flags,villageLevel:10,...Object.fromEntries(CONTENT.neighbors.map(n=>[`movedIn:${n.id}`,1]))},life:{...s.life,seen:Object.values(PEOPLE.people).flatMap(p=>(p.events??[]).map(e=>e.id))}}
}
const input=(s:GameState,extra:Partial<Appt>={})=>({kind:'club' as const,day:s.clock.day,from:600,to:720,place:'hallTable' as const,members:['baker'],activity:'tea' as const,...extra})
function booked(s=ready(),extra:Partial<Appt>={}):GameState {
 const result=scheduleAppt(s,input(s,extra),CONTENT)
 expect(result.blocked).toBeUndefined()
 return result.state
}
describe('shared appointment engine',()=>{
 it('merchant only comes on market day, child cannot attend after 18:00, absent residents cannot be invited',()=>{
  const s=ready()
  expect(availability(s,'merchant',2,600,720,CONTENT)).toMatchObject({busy:'market',suggest:{day:7}})
  expect(availability(s,'merchant',7,600,720,CONTENT)).toBe('ok')
  expect(availability(s,'child',2,1050,1140,CONTENT)).toMatchObject({busy:'early'})
  expect(availability(newGame(CONTENT),'weaver',2,600,720,CONTENT)).toMatchObject({busy:'away',suggest:null})
 })
 it('rejects overlapping invitations without changing the original state, suggests another time',()=>{
  const s=booked()
  expect(scheduleAppt(s,input(s,{from:660,to:780}),CONTENT)).toMatchObject({state:s,blocked:{busy:'appointment'}})
  expect(s.plans.appts).toHaveLength(1)
 })
 it('reserves festivals, wedding, gatherings, visitors and dinner invitations',()=>{
  const s=ready(20)
  expect(festivalOf(20)).not.toBeNull()
  expect(availability(s,'baker',20,1080,1200,CONTENT)).toMatchObject({busy:'festival'})
  const invited={...ready(),today:{...s.today,inviter:'baker'}}
  expect(availability(invited,'baker',2,1080,1200,CONTENT)).toMatchObject({busy:'invite'})
  const wedding={...ready(),romance:{...s.romance,weddingDay:3}}
  expect(availability(wedding,'baker',3,1080,1200,CONTENT)).toMatchObject({busy:'festival'})
 })
 it('rain, snow and heat use an indoor alternate; no alternate moves to another day',()=>{
  const days=[Array.from({length:400},(_,i)=>i+3).find(d=>weatherOf(d)==='rain')!,Array.from({length:400},(_,i)=>i+3).find(d=>weatherOf(d)==='snow')!,Array.from({length:400},(_,i)=>i+3).find(d=>weatherOf(d)==='hot')!]
  for(const day of days){
   const s=ready(day)
   const a={...input(s,{place:'pavilion'}),id:'appt:1',state:'planned',rewarded:false,remembered:false} as Appt
   expect(venueFor({...a,alt:'hallTable'})).toEqual({place:'hallTable',moved:false})
   expect(venueFor(a)).toMatchObject({moved:true,day:day+1,reason:'weather'})
   const moved=advancePlans({...s,clock:{day,minute:600},plans:{appts:[a],nextId:2}},CONTENT)
   expect(moved.plans.appts[0]).toMatchObject({state:'moved',day:day+1,reason:'weather'})
  }
 })
 it('starts by clock, fixes the cast and seats even a late resident',()=>{
  let s=booked()
  s=settle({...s,clock:{day:2,minute:600}},CONTENT)
  expect(s.plans.appts[0]).toMatchObject({state:'running',startedWith:['baker']})
  const spot=appointmentSpots(s).baker
  expect(s.npcs.baker).toMatchObject({...spot,visible:true})
 })
 it('only explicit participant receives memory, normal heart points capped, settlement and reload repeat safely',()=>{
  let s=advancePlans({...booked(),clock:{day:2,minute:600}},CONTENT)
  const spot=appointmentSpots(s).baker
  s=attendAppt({...s,player:{...s.player,...spot}},'appt:1')
  const romance=s.romance
  s=settleAppt({...s,clock:{day:2,minute:720}},'appt:1')
  expect(s.life.experiences['appt:1']).toMatchObject({count:1,with:['baker']})
  expect(s.hearts.baker).toBeLessThanOrEqual(APPT_HEART_CAP)
  expect(s.romance).toEqual(romance)
  expect(s.life.memories.child).toBeUndefined()
  expect(settleAppt(s,'appt:1')).toEqual(s)
  const loaded=deserialize(serialize(s),CONTENT)!
  expect(settleAppt(loaded,'appt:1')).toEqual(loaded)
  expect(loaded.life.experiences['appt:1'].count).toBe(1)
 })
 it('nonparticipants and skipped sessions have no memory or penalty; day skipping and old saves stay empty',()=>{
  const s=booked()
  const skipped=advancePlans({...s,clock:{day:8,minute:600}},CONTENT)
  expect(skipped.plans.appts[0].state).toBe('skipped')
  expect(skipped.hearts).toEqual(s.hearts)
  expect(skipped.life.experiences).toEqual(s.life.experiences)
  const running=advancePlans({...s,clock:{day:2,minute:600}},CONTENT)
  const done=settleAppt({...running,clock:{day:2,minute:720}},'appt:1')
  expect(done.life.experiences).toEqual(s.life.experiences)
  expect(sanitizePlans(undefined,10)).toEqual({appts:[],nextId:1})
  expect(sanitizePlans(s.plans,10).appts[0].state).toBe('skipped')
 })
 it('evening appointments exclude their residents from the daily hall guests and appear in the seven-day schedule',()=>{
  let s=ready(2)
  const npc=hallGuestsToday(s,CONTENT)[0]
  s=booked(s,{members:[npc],from:1080,to:1200})
  expect(hallGuestsToday(s,CONTENT)).not.toContain(npc)
  const events=scheduledEvents(s,CONTENT)
  expect(events.find(e=>e.id==='2:appt:1')).toMatchObject({title:'차 모임',location:'사랑방'})
  expect(alertsBetween(events,2,1040,1050)).toContain('30분 뒤 차 모임 · 사랑방')
 })
 it('preference reactions are deterministic and do not reject an invitation randomly',()=>{
  expect(inviteReaction('poppy','tea','indoor','afternoon')).toBe('likes')
  expect(inviteReaction('poppy','tea','indoor','afternoon')).toBe(inviteReaction('poppy','tea','indoor','afternoon'))
 })
})

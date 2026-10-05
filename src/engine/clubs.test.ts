import { CONTENT, PEOPLE } from '../content/catalog'
import { newGame, settle, type GameState } from './game'
import { createClub, nextClubDay, expandClubs, pauseClub, dissolveClub, joinClub, chooseClub, doClubActivity, clubWeaveDone, finishClub, clubVenues, sanitizeClubs, type ClubInput } from './clubs'
import { advancePlans, appointmentSpots } from './plans'
import { deserialize, serialize } from './save'
import { isMarketDay, weatherOf } from './calendar'

function ready(day=2,minute=480):GameState {
 const s=newGame(CONTENT)
 return {...s,clock:{day,minute},scenes:[],notebook:{...s.notebook,met:CONTENT.neighbors.map(n=>n.id)},flags:{...s.flags,villageLevel:10,...Object.fromEntries(CONTENT.neighbors.map(n=>[`movedIn:${n.id}`,1]))},life:{...s.life,seen:Object.values(PEOPLE.people).flatMap(p=>(p.events??[]).map(e=>e.id))}}
}
const config:ClubInput={name:'작은 차 모임',place:'hallTable',members:['baker'],weekday:2,slot:'morning',activity:'tea',alt:'hallTable'}
function created(input:Partial<ClubInput>={},s=ready()):GameState {
 const result=createClub(s,{...config,...input},CONTENT)
 expect(result.error).toBeUndefined()
 return result.state
}
function joined(activity:ClubInput['activity']='tea',mode:'direct'|'beside'|'brief'='direct'):GameState {
 let s=created({activity})
 s=settle({...s,clock:{day:2,minute:600}},CONTENT)
 const id=s.plans.appts[0].id
 const spot=appointmentSpots(s).baker
 return joinClub({...s,player:{...s.player,...spot}},id,mode)
}
describe('player-created clubs',()=>{
 it('weekly date uses the market-day anchor and passed time moves to next week',()=>{
  expect(nextClubDay(2,2)).toBe(2)
  expect(nextClubDay(2,0)).toBe(7)
  const s=created({},ready(2,601))
  expect(s.plans.appts[0].day).toBe(9)
  expect(isMarketDay(nextClubDay(2,0))).toBe(true)
 })
 it('rejects absent, unmet residents, unavailable venue, forbidden name and fourth club',()=>{
  expect(createClub(newGame(CONTENT),config,CONTENT).error).toBe('members')
  expect(createClub(ready(),{...config,name:''},CONTENT).error).toBe('name')
  expect(createClub(ready(),{...config,place:'garden'},CONTENT).error).toBe('venue')
  let s=created()
  s=created({weekday:3},s)
  s=created({weekday:4},s)
  expect(createClub(s,{...config,weekday:5},CONTENT).error).toBe('limit')
 })
 it('does not show a garden venue or activity without actual crops',()=>{
  expect(clubVenues(ready(),'garden')).not.toContain('garden')
  expect(clubVenues({...ready(),garden:{'14,3':{crop:'herb',grown:0,wateredDay:null}}},'garden')).toContain('garden')
 })
 it('refuses overlapping club invitations; market-only residents and children obey availability',()=>{
  const s=created()
  expect(createClub(s,config,CONTENT).error).toBe('appointment')
  expect(createClub(ready(),{...config,members:['merchant']},CONTENT).error).toBe('market')
  expect(createClub(ready(),{...config,members:['child'],slot:'evening'},CONTENT).error).toBe('early')
 })
 it('tea participant chooses a drink, tastes a snack and settles a session exactly once',()=>{
  let s=joined(),id=s.plans.appts[0].id
  s=chooseClub(s,id,'따뜻한 차')
  s=doClubActivity(s,id)
  s=finishClub(s,id)
  expect(s.clubSessions[id].step).toBe('done')
  expect(s.plans.appts.find(a=>a.id===id)?.state).toBe('done')
  expect(s.life.experiences['club:1']).toMatchObject({kind:'club',count:1,with:['baker']})
  expect(finishClub(s,id)).toEqual(s)
 })
 it('reconnection restores in-progress choices, successful session memory and unique IDs',()=>{
  let s=joined(),id=s.plans.appts[0].id
  s=chooseClub(s,id,'시원한 물')
  s=deserialize(serialize(s),CONTENT)!
  expect(s.clubSessions[id].picked).toBe('시원한 물')
  s=finishClub(doClubActivity(s,id),id)
  const reloaded=deserialize(serialize(s),CONTENT)!
  expect(finishClub(reloaded,id)).toEqual(reloaded)
 })
 it('unattended sessions finish between residents without player memories or automatic objects',()=>{
  let s=created({activity:'sew'})
  s=advancePlans({...s,clock:{day:2,minute:600}},CONTENT)
  s=advancePlans({...s,clock:{day:2,minute:720}},CONTENT)
  expect(s.plans.appts[0].state).toBe('done')
  expect(s.life.experiences).toEqual({})
  expect(s.inv.cushion).toBeUndefined()
 })
 it('pauses/dissolves without friendship loss and resume computes a future session',()=>{
  const s=created()
  const paused=pauseClub(s,'club:1')
  expect(paused.plans.appts[0].state).toBe('skipped')
  expect(paused.hearts).toEqual(s.hearts)
  expect(dissolveClub(s,'club:1').clubs[0].active).toBe(false)
  const resumed=expandClubs({...pauseClub(paused,'club:1',false),clock:{day:3,minute:480}},CONTENT)
  expect(resumed.plans.appts.find(a=>a.state==='planned')?.day).toBe(9)
 })
 it('late participation starts from a recorded step without restarting or awarding twice',()=>{
  let s=joined('observe','brief'),id=s.plans.appts[0].id
  s=chooseClub(s,id,'짧은 메모 남기기','오늘 본 잎')
  s=joinClub({...s,clock:{day:2,minute:680}},id,'direct')
  expect(s.clubSessions[id]).toMatchObject({step:'activity',mode:'brief',note:'오늘 본 잎'})
  s=finishClub(doClubActivity(s,id),id)
  expect(s.life.experiences['club:1'].count).toBe(1)
 })
 it('sewing requires completed handwork and actual player wool, creates only one selected destination',()=>{
  let s=joined('sew'),id=s.plans.appts[0].id
  s={...s,inv:{...s.inv,wool:2}}
  s=clubWeaveDone(chooseClub(s,id,'파랑'),id)
  s=finishClub(s,id,'club')
  expect(s.inv.wool??0).toBe(0)
  expect(s.inv.cushion??0).toBe(0)
  expect(s.clubWorks['club:1']).toMatchObject({item:'cushion',color:'파랑',place:'hallTable'})
  expect(finishClub(s,id,'home')).toEqual(s)
  let watcher=joined('sew','beside'),wid=watcher.plans.appts[0].id
  watcher=finishClub(doClubActivity(chooseClub(watcher,wid,'초록'),wid),wid)
  expect(watcher.inv.cushion??0).toBe(0)
 })
 it('garden activity reuses real harvest and removes the harvested crop exactly once',()=>{
  let s=ready()
  s={...s,garden:{'14,3':{crop:'herb',grown:3,wateredDay:2}}}
  s=created({activity:'garden',place:'garden'},s)
  s=advancePlans({...s,clock:{day:2,minute:600}},CONTENT)
  const spot=appointmentSpots(s).baker,id=s.plans.appts[0].id
  s=joinClub({...s,player:{...s.player,...spot}},id,'direct')
  s=doClubActivity(chooseClub(s,id,'오늘 자란 것 보기'),id,'14,3')
  expect(s.garden['14,3']).toBeUndefined()
  expect(s.inv.herb).toBe(2)
  expect(doClubActivity(s,id,'14,3')).toEqual(s)
 })
 it('weather uses an indoor alternative, old saves have empty club states',()=>{
  const day=Array.from({length:80},(_,i)=>i+3).find(d=>weatherOf(d)==='rain')!
  let s=created({place:'pavilion',alt:'hallTable',weekday:day%7},ready(day))
  s=advancePlans({...s,clock:{day,minute:600}},CONTENT)
  expect(appointmentSpots(s).baker).toBeDefined()
  expect(sanitizeClubs(undefined)).toEqual([])
 })
})

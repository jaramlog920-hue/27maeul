import { CONTENT, PEOPLE } from '../content/catalog'
import { newGame, settle, type GameState } from './game'
import { createClub, nextClubDay, expandClubs, pauseClub, dissolveClub, joinClub, chooseClub, doClubActivity, clubWeaveDone, finishClub, clubVenues, sanitizeClubs, clubWorkSpots, canLeaveWork, type ClubInput } from './clubs'
import { clubFollowUp, clubMissed, clubPerson, clubVoice } from './club-life'
import { T } from '../content/text'
import { isWalkable, key, lockedTiles, PLACES } from './world'
import { advancePlans, appointmentSpots, apptSpots } from './plans'
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
/** 방석을 직접 만들어 마친 첫 회차 (result: 집에 두기/모임 자리에 남기기) */
function sewnFirst(result:'home'|'club',extra:Partial<ClubInput>={}):GameState {
 let s=joined('sew')
 if(extra.place) throw new Error('use created() directly')
 const id=s.plans.appts[0].id
 s={...s,inv:{...s.inv,wool:2}}
 return finishClub(clubWeaveDone(chooseClub(s,id,'파랑'),id),id,result)
}
describe('club work left at the club (계획 16 작업 15)',()=>{
 it('shows nothing until the cushion is left; then one dot on a dedicated table tile, not a seat or locked tile',()=>{
  const home=sewnFirst('home')
  expect(clubWorkSpots(home)).toEqual([])
  const left=sewnFirst('club')
  const spots=clubWorkSpots(left)
  expect(spots).toHaveLength(1)
  const [w]=spots
  expect(w).toMatchObject({club:'club:1',art:'cushionPattern',place:'hallTable',color:'파랑'})
  expect(PLACES.hallTable.tiles.some(t=>key(t)===key(w.at))).toBe(true)
  expect(apptSpots('hallTable').some(t=>key(t)===key(w.at))).toBe(false)
  expect(lockedTiles(Object.keys(left.shelved).length).has(key(w.at))).toBe(false)
  expect(isWalkable(w.at)).toBe(false)
 })
 it('disappears when the club is dissolved and survives save and reload',()=>{
  const left=sewnFirst('club')
  expect(clubWorkSpots(dissolveClub(left,'club:1'))).toEqual([])
  const reloaded=deserialize(serialize(left),CONTENT)!
  expect(clubWorkSpots(reloaded).map(w=>w.at)).toEqual(clubWorkSpots(left).map(w=>w.at))
  expect(clubWorkSpots({...left,clubWorks:{}})).toEqual([])
 })
 it('two clubs at one place get different tiles; the leave choice closes when the place has no free tile',()=>{
  let s=created({activity:'sew'})
  s=created({activity:'sew',weekday:3},s)
  s=created({activity:'sew',weekday:4},s)
  const work=(place:'hallTable'|'teaTable')=>({item:'cushion' as const,color:'초록',place})
  const two={...s,clubWorks:{'club:1':work('hallTable'),'club:2':work('hallTable')}}
  const [a,b]=clubWorkSpots(two)
  expect(key(a.at)).not.toBe(key(b.at))
  const tea={...s,clubWorks:{'club:1':work('teaTable'),'club:2':work('teaTable')}}
  expect(canLeaveWork(tea,'club:3','teaTable')).toBe(false)
  expect(canLeaveWork(tea,'club:2','teaTable')).toBe(true)
  expect(canLeaveWork(two,'club:3','hallTable')).toBe(true)
 })
 it('falls back to the home option when the venue cannot hold another work',()=>{
  let s=joined('sew')
  const id=s.plans.appts[0].id
  const other=()=>({item:'cushion' as const,color:'노랑',place:'hallTable' as const})
  s={...s,inv:{...s.inv,wool:2},clubWorks:{'club:8':other(),'club:9':other(),'club:10':other(),'club:11':other()},clubs:[...s.clubs,...[8,9,10,11].map(n=>({...s.clubs[0],id:`club:${n}`}))]}
  s=finishClub(clubWeaveDone(chooseClub(s,id,'파랑'),id),id,'club')
  expect(s.inv.cushion).toBe(1)
  expect(s.clubWorks['club:1']).toBeUndefined()
})
})
describe('villager club behaviour and follow-ups (계획 16 작업 15)',()=>{
 it('follow-up asks about the real cushion only after a session where it was made',()=>{
  const first=sewnFirst('home')
  let s=expandClubs({...first,clock:{day:3,minute:480}},CONTENT)
  s=advancePlans({...s,clock:{day:9,minute:600}},CONTENT)
  const next=s.plans.appts.find(a=>a.state==='running')!
  const line=clubFollowUp(s,next)
  expect(line).toMatchObject({npc:'baker'})
  expect(line!.text).toContain('파란 방석')
  expect(line!.text).toContain('집에')
  // 집에 두지 않고 모임 자리에 남긴 경우엔 그 자리 이야기
  const left=sewnFirst('club')
  let t=expandClubs({...left,clock:{day:3,minute:480}},CONTENT)
  t=advancePlans({...t,clock:{day:9,minute:600}},CONTENT)
  expect(clubFollowUp(t,t.plans.appts.find(a=>a.state==='running')!)!.text).toContain('놓여 있')
  // 첫 회차: 아직 지난 일이 없다
  const fresh=advancePlans({...created({activity:'sew'}),clock:{day:2,minute:600}},CONTENT)
  expect(clubFollowUp(fresh,fresh.plans.appts.find(a=>a.state==='running')!)).toBeNull()
 })
 it('no follow-up when the player only watched, and none for a session without player memory',()=>{
  let s=joined('sew','beside'),id=s.plans.appts[0].id
  s=finishClub(doClubActivity(chooseClub(s,id,'초록'),id),id)
  s=expandClubs({...s,clock:{day:3,minute:480}},CONTENT)
  s=advancePlans({...s,clock:{day:9,minute:600}},CONTENT)
  const next=s.plans.appts.find(a=>a.state==='running')!
  expect(clubFollowUp(s,next)).toBeNull()
 })
 it('missed sessions are told only by who really gathered, without guilt, and only for a week',()=>{
  let s=created({activity:'sew'})
  s=advancePlans({...s,clock:{day:2,minute:600}},CONTENT)
  s=advancePlans({...s,clock:{day:2,minute:720}},CONTENT)
  const missed=clubMissed({...s,clock:{day:3,minute:480}},'club:1')
  expect(missed?.items.map(i=>i.npc)).toEqual(['baker'])
  expect(missed?.items[0].does).toBe(clubPerson('baker','sew')!.does)
  expect(clubMissed({...s,clock:{day:10,minute:480}},'club:1')).toBeNull()
  expect(s.hearts).toEqual(created({activity:'sew'}).hearts)
 })
 it('every villager has a distinct behaviour and distinct lines for each club activity',()=>{
  for(const activity of ['tea','sew','garden','observe'] as const) {
   const seenDoes=new Set<string>(),seenStart=new Set<string>()
   for(const n of CONTENT.neighbors) {
    const p=clubPerson(n.id,activity)
    expect(p,`${n.id} ${activity}`).not.toBeNull()
    expect(p!.does.length).toBeGreaterThan(3)
    expect(seenDoes.has(p!.does),`${n.id} does ${activity}`).toBe(false)
    expect(seenStart.has(p!.start),`${n.id} start ${activity}`).toBe(false)
    seenDoes.add(p!.does);seenStart.add(p!.start)
   }
  }
 })
 it('speech levels match each villager and the lines make no claims about health, rewards or guilt',()=>{
  const ends=(t:string)=>t.split(/(?<=[.?!…])\s+/).map(x=>x.trim()).filter(x=>x.length>8)
  for(const n of CONTENT.neighbors) {
   const voice=clubVoice(n.id)
   for(const activity of ['tea','sew','garden','observe'] as const) {
    const p=clubPerson(n.id,activity)!
    for(const line of [p.start,p.finish]) {
     for(const sentence of ends(line)) {
      const last=sentence.replace(/[.?!…”"]+$/,'')
      if(voice==='casual'||voice==='sir'||voice==='old') expect(last,`${n.id}: ${sentence}`).not.toMatch(/요$/)
      if(voice==='polite') expect(last,`${n.id}: ${sentence}`).toMatch(/(요|죠|까|니다)$/)
     }
     expect(line,n.id).not.toMatch(/(효과|치료|낫|병|벌점|죄송|미안|왜 안)/)
    }
   }
  }
  for(const voice of Object.values(T.clubs.follow)) for(const text of Object.values(voice)) expect(text).not.toMatch(/(왜 |안 왔|못 왔)/)
 })
})
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

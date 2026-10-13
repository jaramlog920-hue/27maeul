import { legacyGame as newGame } from './growth-test-support'
import { CONTENT, PEOPLE } from '../content/catalog'
import { settle, type GameState } from './game'
import { advancePlans, appointmentSpots, venueFor } from './plans'
import { createFest, cancelFest, postponeFest, joinFest, festStep, festFinish, festKinds, festReactions, festivalRoleReady, doFestivalRole, homeSeats, festWorks, sanitizeFests, festWaiting, settleFests, festivalDays, FEST_STEPS, type FestInput } from './fest'
import { deserialize, serialize } from './save'
import { festivalOf, weatherOf, FESTIVAL_FROM, FESTIVAL_TO } from './calendar'
import { FESTIVAL_SPOTS } from './neighbors'
import { eventPropsNow } from './event-scene'
import { solidTiles } from './room'
import { HOME_ENTRY, isHome, isWalkable, key, PLACES } from './world'
import { findPath } from './movement'

function ready(day=2,minute=480):GameState {
 const s=newGame(CONTENT)
 return {...s,clock:{day,minute},scenes:[],notebook:{...s.notebook,met:CONTENT.neighbors.map(n=>n.id)},flags:{...s.flags,villageLevel:10,...Object.fromEntries(CONTENT.neighbors.map(n=>[`movedIn:${n.id}`,1]))},life:{...s.life,seen:Object.values(PEOPLE.people).flatMap(p=>(p.events??[]).map(e=>e.id))}}
}
const tea:FestInput={kind:'tea',day:3,slot:'morning',place:'hallTable',members:['baker','poppy']}
describe('계절 잔치 간식과 종료/저장 경계', () => {
 it.each([20, 65, 110, 140])('%i일 잔치 완료 뒤 같은 날 재준비는 막지만 다음 해에는 새로 준비한다', day => {
  const input: FestInput = { kind: 'festival', day, role: 'food', snack: 'bread', members: [] }
  const prepared = createFest({ ...ready(day - 5), inv: { bread: 3 } }, input, CONTENT)
  expect(prepared.error).toBeUndefined()
  const onsite = { ...prepared.state, clock: { day, minute: FESTIVAL_FROM }, player: { ...prepared.state.player, x: 24, y: 20 } }
  const done = deserialize(serialize(doFestivalRole(onsite, prepared.id!)), CONTENT)!
  expect(festivalDays(done)).not.toContain(day)
  const repeated = createFest(done, input, CONTENT)
  expect(repeated.error).toBe('festival')
  expect(repeated.state).toBe(done)
  const yearLater = { ...done, clock: { day: day + 160 - 5, minute: 600 } }
  const next = createFest(yearLater, { ...input, day: day + 160 }, CONTENT)
  expect(next.error).toBeUndefined()
  expect(next.id).not.toBe(prepared.id)
  expect(next.state.fests[0]).toEqual(done.fests[0])
  expect(next.state.fests[1]).toMatchObject({ day: day + 160, joined: false, consumed: false, closed: false, reserve: { bread: 1 } })
  expect(next.state.inv.bread).toBe(done.inv.bread! - 1)
 })
 it('완료하지 않은 준비를 취소하면 같은 잔치에 다시 준비할 수 있다', () => {
  const input: FestInput = { kind: 'festival', day: 20, role: 'food', snack: 'bread', members: [] }
  const base = { ...ready(15), inv: { bread: 2 } }
  const made = createFest(base, input, CONTENT)
  const cancelled = deserialize(serialize(cancelFest(made.state, made.id!)), CONTENT)!
  expect(cancelled.inv).toEqual(base.inv)
  const retry = createFest(cancelled, input, CONTENT)
  expect(retry.error).toBeUndefined()
  expect(retry.state.inv.bread).toBe(1)
 })
 it('현장 참석자가 셋보다 많아도 역할 완료 후 저장에서 모두 유지된다', () => {
  const base = { ...ready(15), inv: { bread: 2, candle: 1 } }
  let s = createFest(base, { kind: 'festival', day: 20, role: 'food', snack: 'bread', deco: 'candle', members: [] }, CONTENT).state
  const ids = ['baker', 'child', 'grandpa', 'smith', 'shepherd']
  s = { ...s, clock: { day: 20, minute: FESTIVAL_FROM }, player: { ...s.player, x: 24, y: 20 },
    npcs: Object.fromEntries(Object.entries(s.npcs).map(([id, n]) => [id, ids.includes(id)
      ? { ...n, ...FESTIVAL_SPOTS[id], visible: true, path: [] } : { ...n, visible: false }])) }
  const done = doFestivalRole(s, s.fests[0].id)
  expect(done.fests[0].members).toHaveLength(5)
  expect(done.inv.bread).toBe(1)
  expect(done.inv.candle).toBe(1)
  expect(done.fests[0].closed).toBe(true)
  const restored = deserialize(serialize(done), CONTENT)!
  expect(restored.fests[0].members).toEqual(done.fests[0].members)
  expect(sanitizeFests([{ ...done.fests[0], kind: 'tea' }])[0].members).toHaveLength(3)
  expect(doFestivalRole(restored, restored.fests[0].id)).toBe(restored)
  expect(settleFests(restored).inv).toEqual(done.inv)
 })
 it.each([FESTIVAL_TO, FESTIVAL_TO + 1])('%i분에 끝난 준비는 간식과 장식을 한 번 반환한다', minute => {
  const base = { ...ready(15), inv: { bread: 2, candle: 1 } }
  const made = createFest(base, { kind: 'festival', day: 20, role: 'food', snack: 'bread', deco: 'candle', members: [] }, CONTENT).state
  const late = { ...made, clock: { day: 20, minute }, player: { ...made.player, x: 24, y: 20 } }
  expect(festivalRoleReady(late)).toBeNull()
  expect(doFestivalRole(late, late.fests[0].id)).toBe(late)
  const ended = settleFests(late)
  expect(ended.inv).toEqual(base.inv)
  expect(ended.fests[0].consumed).toBe(false)
  const restored = deserialize(serialize(ended), CONTENT)!
  expect(settleFests(restored).inv).toEqual(base.inv)
 })
})
function made(input:Partial<FestInput>={},s=ready()):GameState {
 const r=createFest(s,{...tea,...input},CONTENT)
 expect(r.error).toBeUndefined()
 return r.state
}
/** 시작 시각에 회차를 열고, 첫 자리 곁에 서서 함께하기 */
function joined(s:GameState,minute?:number):GameState {
 const f=s.fests[0],a=s.plans.appts.find(a=>a.id===f.apptId)!
 s=settle({...s,clock:{day:a.day,minute:minute??a.from}},CONTENT)
 const spot=Object.values(appointmentSpots(s))[0]
 return joinFest({...s,player:{...s.player,...spot}},f.id)
}
function walkThrough(s:GameState,pick?:string):GameState {
 const id=s.fests[0].id
 while(s.fests[0].step!=='finish' && s.fests[0].step!=='done') {
  const before=s.fests[0].step
  s=festStep(s,id,before==='activity'?(pick??'basic'):undefined)
  expect(s.fests[0].step).not.toBe(before)
 }
 return festFinish(s,id)
}

describe('내가 준비하는 작은 행사',()=>{
 it('cannot advance or finish a joined event after leaving its venue',()=>{
  const at=joined(made())
  const away={...at,player:{...at.player,x:1,y:8}}
  expect(festStep(away,away.fests[0].id)).toBe(away)
  expect(joinFest(away,away.fests[0].id)).toBe(away)
  let ending=at
  while(ending.fests[0].step!=='finish') ending=festStep(ending,ending.fests[0].id,ending.fests[0].step==='activity'?'basic':undefined)
  const left={...ending,player:{...ending.player,x:1,y:8}}
  expect(festFinish(left,left.fests[0].id)).toBe(left)
  expect(festFinish(ending,ending.fests[0].id).fests[0].closed).toBe(true)
 })
 it('차 모임: 예약 → 당일 정돈·도착·함께·대화·마무리 → 정산은 한 번, 참석자만 기억', ()=>{
  let s=made({snack:'bread'},{...ready(),inv:{...ready().inv,bread:2}})
  expect(s.inv.bread).toBe(1)
  expect(s.fests[0].reserve).toEqual({bread:1})
  expect(s.plans.appts[0]).toMatchObject({kind:'event',festId:s.fests[0].id,day:3,from:600})
  s=joined(s)
  expect(s.fests[0].step).toBe('tidy')
  const hearts={...s.hearts}
  s=walkThrough(s,'bread')
  expect(s.fests[0]).toMatchObject({step:'done',closed:true,consumed:true,reserve:{}})
  expect(s.inv.bread).toBe(1)
  expect(s.plans.appts[0].state).toBe('done')
  expect(s.life.experiences['fest:1']).toMatchObject({kind:'event',count:1})
  expect(s.life.experiences['fest:1'].with.sort()).toEqual(['baker','poppy'])
  expect(s.life.experiences['fest:1'].with).not.toContain('smith')
  expect((s.hearts.baker??0)-(hearts.baker??0)).toBeLessThanOrEqual(3)
  expect(festFinish(s,s.fests[0].id)).toEqual(s)
  expect(advancePlans({...s,clock:{day:4,minute:500}},CONTENT).inv).toEqual(s.inv)
 })
 it('간식을 고르지 않으면 보관한 간식은 그대로 돌아온다 — 소비는 한 번만', ()=>{
  let s=made({snack:'fig'},{...ready(),inv:{...ready().inv,fig:1}})
  expect(s.inv.fig??0).toBe(0)
  s=walkThrough(joined(s),'basic')
  expect(s.inv.fig).toBe(1)
  expect(s.fests[0].consumed).toBe(false)
 })
 it('취소: 보관한 간식·장식을 돌려주고 관계는 그대로, 일정은 건너뜀', ()=>{
  let s=made({snack:'bread',deco:'vase'},{...ready(),inv:{...ready().inv,bread:1,vase:1}})
  expect(s.inv.vase??0).toBe(0)
  const c=cancelFest(s,s.fests[0].id)
  expect(c.inv.bread).toBe(1)
  expect(c.inv.vase).toBe(1)
  expect(c.hearts).toEqual(s.hearts)
  expect(c.plans.appts[0].state).toBe('skipped')
  expect(c.fests[0]).toMatchObject({closed:true,cancelled:true,reserve:{}})
  expect(cancelFest(c,c.fests[0].id)).toEqual(c)
 })
 it('미루기: 다음 가능한 날로 다시 잡고 예전 약속은 건너뜀', ()=>{
  let s=made()
  const r=postponeFest(s,s.fests[0].id,5,'afternoon',CONTENT)
  expect(r.error).toBeUndefined()
  s=r.state
  const a=s.plans.appts.find(a=>a.id===s.fests[0].apptId)!
  expect(a).toMatchObject({day:5,from:840,state:'planned'})
  expect(s.plans.appts.filter(a=>a.state==='planned')).toHaveLength(1)
 })
 it('계획: 며칠 안의 날짜만, 셋 이내, 만난 이웃만, 겹치면 이유와 다른 시간', ()=>{
  expect(createFest(ready(),{...tea,day:20},CONTENT).error).toBe('date')
  expect(createFest(ready(),{...tea,members:['baker','poppy','smith','tilly']},CONTENT).error).toBe('members')
  expect(createFest(newGame(CONTENT),tea,CONTENT).error).toBe('members')
  expect(createFest(ready(),{...tea,members:['merchant']},CONTENT).error).toBe('market')
  expect(createFest(ready(),{...tea,members:['child'],slot:'evening'},CONTENT).error).toBe('early')
  const s=made()
  expect(createFest(s,{...tea,members:['baker']},CONTENT).error).toBe('appointment')
  expect(createFest(ready(),{...tea,place:'pavilion'},CONTENT).error).toBe('alt')
  expect(createFest({...ready(),inv:{}},{...tea,snack:'bread'},CONTENT).error).toBe('stock')
 })
 it('날씨: 정자 행사는 미리 정한 실내 자리로', ()=>{
  const day=Array.from({length:5},(_,i)=>i+2).find(d=>weatherOf(d)==='rain'||weatherOf(d)==='snow')
  const rainy=day ?? Array.from({length:80},(_,i)=>i+2).find(d=>weatherOf(d)==='rain')!
  let s=made({day:rainy,place:'pavilion',alt:'hallTable'},ready(rainy))
  s=advancePlans({...s,clock:{day:rainy,minute:600}},CONTENT)
  const a=s.plans.appts[0]
  expect(venueFor(a).place).toBe('hallTable')
  expect(appointmentSpots(s).baker).toBeDefined()
 })
 it('늦게 오면 진행 중인 단계부터, 처음부터 되풀이하지 않는다', ()=>{
  let s=joined(made(),600+80)
  expect(FEST_STEPS.indexOf(s.fests[0].step)).toBeGreaterThanOrEqual(FEST_STEPS.indexOf('talk'))
  s=walkThrough(s)
  expect(s.life.experiences['fest:1'].count).toBe(1)
 })
 it('플레이어가 없으면 이웃끼리 마치고 기억·보상 없이 보관분을 돌려준다', ()=>{
  let s=made({snack:'bread'},{...ready(),inv:{...ready().inv,bread:1}})
  s=advancePlans({...s,clock:{day:3,minute:600}},CONTENT)
  s=advancePlans({...s,clock:{day:3,minute:720}},CONTENT)
  expect(s.plans.appts[0].state).toBe('done')
  expect(s.life.experiences['fest:1']).toBeUndefined()
  expect(s.inv.bread).toBe(1)
  expect(s.fests[0].closed).toBe(true)
 })
 it('행사 소품은 기록자가 걸어 다녀도 제자리에 있다 (2026-10-14 사용자: 지나갈 때 왔다 갔다 함)', ()=>{
  const b=joined(made({day:9,members:['baker']},ready(8)))
  const spots=(st:typeof b)=>eventPropsNow(st).map(p=>`${p.art}@${p.at.x},${p.at.y}`)
  const first=spots(b)
  expect(first.length).toBeGreaterThan(0)
  for (const p of eventPropsNow(b)) expect(spots({...b,player:{...b.player,x:p.at.x,y:p.at.y}})).toEqual(first)
 })
 it('생일과 겹치면 장식과 한마디만 — 생일 보상·장면을 새로 만들지 않는다', ()=>{
  // 빵 굽는 이웃 생일: 봄 10일
  let b=made({day:10,members:['baker']},ready(8))
  expect(b.fests[0].birthday).toBe('baker')
  let plain=made({day:9,members:['baker']},ready(8))
  b=joined(b); plain=joined(plain)
  expect(eventPropsNow(b).map(p=>p.art)).toContain('birthdayBanner')
  expect(eventPropsNow(plain).map(p=>p.art)).not.toContain('birthdayBanner')
  const reactions=festReactions(b,b.fests[0])
  expect(reactions.find(r=>r.npc==='baker')?.kind).toBe('birthday')
  const beforeB=b.hearts.baker??0, beforeP=plain.hearts.baker??0
  b=walkThrough(b); plain=walkThrough(plain)
  expect((b.hearts.baker??0)-beforeB).toBe((plain.hearts.baker??0)-beforeP)
  expect(b.flags['candleOut:baker']).toBeUndefined()
  expect(Object.keys(b.life.experiences).filter(k=>k.startsWith('fest:'))).toEqual(['fest:1'])
 })
 it('반응은 취향·함께한 기억에서 — 보태 준 이웃은 손님으로도 앉는다', ()=>{
  let s=made({members:['baker','smith'],help:['baker']})
  s={...s,life:{...s.life,experiences:{'work:x':{id:'work:x',kind:'work',with:['smith'],first:1,last:1,count:1}}}}
  s=joined(s)
  const r=festReactions(s,s.fests[0])
  expect(r.find(x=>x.npc==='baker')?.kind).toBe('help')
  expect(r.find(x=>x.npc==='smith')?.kind).toBe('memory')
  expect(r.every(x=>x.text.length>0)).toBe(true)
  expect(createFest(ready(),{...tea,members:['smith'],help:['smith']},CONTENT).error).toBe('help')
 })
 it('재접속: 진행 단계·보관분이 그대로, 다시 불러와도 한 번만 정산', ()=>{
  let s=made({snack:'bread'},{...ready(),inv:{...ready().inv,bread:1}})
  s=joined(s)
  s=festStep(festStep(s,s.fests[0].id),s.fests[0].id)
  const loaded=deserialize(serialize(s),CONTENT)!
  expect(loaded.fests[0]).toEqual(s.fests[0])
  let done=walkThrough(loaded,'bread')
  done=deserialize(serialize(done),CONTENT)!
  expect(festFinish(done,done.fests[0].id)).toEqual(done)
  expect(done.life.experiences['fest:1'].count).toBe(1)
  expect(done.inv.bread??0).toBe(0)
 })
 it('옛 저장은 빈 행사, 모양이 틀린 행사는 버린다', ()=>{
  const raw=JSON.parse(serialize(ready()))
  delete raw.fests
  const loaded=deserialize(JSON.stringify(raw),CONTENT)
  expect(loaded?.fests).toEqual([])
  expect(sanitizeFests([{id:'fest:1',kind:'party'},null,{id:'fest:2',kind:'tea',day:3,step:'tidy',members:['baker'],place:'hallTable',reserve:{bread:-1,papyrus:2}}])).toEqual([expect.objectContaining({id:'fest:2',reserve:{}})])
 })
 it('집들이: 집 안 동선·가구를 막지 않는 자리에만, 집에 없으면 열지 않고 다시 잡거나 마무리', ()=>{
  let s=ready()
  const seats=homeSeats(s,3)
  expect(seats).toHaveLength(3)
  const blocked=new Set([...solidTiles(s.room),...seats.map(key)])
  for(const t of seats) expect(isHome(t) && isWalkable(t,solidTiles(s.room))).toBe(true)
  for(const p of ['bed','desk','hearth','shelf','workbench'] as const) expect(findPath(HOME_ENTRY,PLACES[p].stand!,blocked)).not.toBeNull()
  s=made({kind:'housewarming',place:'hearth',members:['baker','poppy'],deco:'vase'},{...s,inv:{...s.inv,vase:1}})
  expect(s.plans.appts[0]).toMatchObject({requiresPlayer:true})
  const elsewhere=advancePlans({...s,map:'newland',clock:{day:3,minute:601},player:{...s.player,...HOME_ENTRY}},CONTENT)
  expect(elsewhere.plans.appts[0]).toMatchObject({state:'skipped',reason:'host'})
  // 집 밖에 있는 동안 시작 시각이 지나간다
  s=advancePlans({...s,clock:{day:3,minute:601},player:{...s.player,...PLACES.well.stand!}},CONTENT)
  expect(s.plans.appts[0].state).toBe('skipped')
  expect(festWaiting(s,s.fests[0])).toBe(true)
  expect(s.fests[0].reserve).toEqual({vase:1})
  const again=postponeFest(s,s.fests[0].id,4,'afternoon',CONTENT)
  expect(again.error).toBeUndefined()
  expect(festWaiting(again.state,again.state.fests[0])).toBe(false)
  const closed=cancelFest(s,s.fests[0].id)
  expect(closed.inv.vase).toBe(1)
  expect(closed.hearts).toEqual(s.hearts)
 })
 it('집들이를 집 안에서 열면 이웃이 집 안 자리에 앉고 보여 준 물건이 기억에 남는다', ()=>{
  let s=ready()
  s=made({kind:'housewarming',place:'hearth',members:['baker']},s)
  const seat=s.plans.appts[0].seats![0]
  s=settle({...s,clock:{day:3,minute:600},player:{...s.player,x:HOME_ENTRY.x,y:HOME_ENTRY.y}},CONTENT)
  expect(s.plans.appts[0].state).toBe('running')
  expect(appointmentSpots(s).baker).toEqual(seat)
  s=joinFest({...s,player:{...s.player,...seat}},s.fests[0].id)
  s=walkThrough(s,'basic')
  expect(s.life.experiences['fest:1']).toMatchObject({kind:'event',count:1,with:['baker']})
 })
 it('작품 소개는 함께 만든 것이 있을 때만', ()=>{
  expect(festKinds(ready(),CONTENT)).not.toContain('showcase')
  expect(createFest(ready(),{...tea,kind:'showcase',work:'work:x'},CONTENT).error).toBe('work')
  const s={...ready(),life:{...ready().life,experiences:{'work:x':{id:'work:x',kind:'work' as const,with:['carpenter'],first:1,last:1,count:1}}}}
  expect(festWorks(s).map(w=>w.id)).toEqual(['work:x'])
  expect(festKinds(s,CONTENT)).toContain('showcase')
  const made2=createFest(s,{...tea,kind:'showcase',work:'work:x',members:['carpenter']},CONTENT)
  expect(made2.error).toBeUndefined()
  expect(made2.state.plans.appts[0].activity).toBe('make')
 })
 it('계절 잔치 준비 역할: 잔치 날짜·내용은 그대로, 맡은 일은 한 번만 기억', ()=>{
  const day=20
  expect(festivalOf(day)).toBe('blossom')
  expect(festKinds(ready(10),CONTENT)).not.toContain('festival')
  let s=ready(15)
  expect(festKinds(s,CONTENT)).toContain('festival')
  expect(createFest(s,{kind:'festival',day:19,role:'food',members:[]},CONTENT).error).toBe('festival')
  s={...s,inv:{...s.inv,bread:1}}
  const r=createFest(s,{kind:'festival',day,role:'food',snack:'bread',members:[]},CONTENT)
  expect(r.error).toBeUndefined()
  s=r.state
  expect(s.plans.appts).toEqual([])
  expect(festKinds(s,CONTENT)).not.toContain('festival')
  s={...s,clock:{day,minute:FESTIVAL_FROM+10},player:{...s.player,x:24,y:21}}
  s={...s,npcs:Object.fromEntries(Object.entries(s.npcs).map(([id,n])=>[id,FESTIVAL_SPOTS[id]&&id==='baker'?{...n,...FESTIVAL_SPOTS[id],path:[],visible:true}:{...n,visible:false}]))}
  expect(festivalRoleReady(s)?.id).toBe(s.fests[0].id)
  const elsewhere={...s,map:'newland' as const}
  expect(festivalRoleReady(elsewhere)).toBeNull()
  expect(doFestivalRole(elsewhere,s.fests[0].id)).toBe(elsewhere)
  s=doFestivalRole(s,s.fests[0].id)
  expect(s.inv.bread??0).toBe(0)
  expect(s.life.experiences['fest:1']).toMatchObject({kind:'event',with:['baker']})
  expect(doFestivalRole(s,s.fests[0].id)).toEqual(s)
  expect(festivalRoleReady(s)).toBeNull()
 })
 it('잔치에 오지 않아도 잔치는 그대로, 보관분은 돌아오고 아무 불이익 없음', ()=>{
  let s:GameState={...ready(15),inv:{...ready(15).inv,bread:1}}
  s=createFest(s,{kind:'festival',day:20,role:'food',snack:'bread',members:[]},CONTENT).state
  const hearts={...s.hearts}
  s=advancePlans({...s,clock:{day:21,minute:480}},CONTENT)
  expect(s.fests[0].closed).toBe(true)
  expect(s.inv.bread).toBe(1)
  expect(s.hearts).toEqual(hearts)
  expect(s.life.experiences['fest:1']).toBeUndefined()
 })
 it('행사는 필사·책상에 아무 조건도 걸지 않는다', ()=>{
  const s=joined(made())
  expect(Object.keys(s).filter(k=>k.startsWith('copy'))).toEqual(Object.keys(ready()).filter(k=>k.startsWith('copy')))
  expect(s.copy).toEqual(ready().copy)
 })
})

import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame, tick, type GameState } from './game'
import { appointmentSpots, settleAppt, type Appt } from './plans'
import { advanceGroupTask } from './group-task'
import { CLUB_ACTIVITIES, sanitizeClubs, sanitizeClubSessions } from './clubs'
import { socialEventMotion } from './social-scene'
import { serialize, deserialize } from './save'
import { HALL_SPOTS } from './places'
import { FESTIVAL_SPOTS, FIRE } from './neighbors'

function scene(activity:Appt['activity']='tea'):GameState {
 const base=newGame(CONTENT)
 const a:Appt={id:'social:1',clubId:'club:1',kind:'club',day:2,from:600,to:720,place:'hallTable',members:['baker','grandpa','child'],startedWith:['baker','grandpa','child'],state:'running',rewarded:false,remembered:false,attended:true,activity}
 const npcs={...base.npcs}
 a.members.forEach((id,i)=>{npcs[id]={...npcs[id],...HALL_SPOTS[i],id,visible:true,path:[],goal:HALL_SPOTS[i]}})
 return {...base,clock:{day:2,minute:601},player:{...base.player,x:HALL_SPOTS[0].x,y:HALL_SPOTS[0].y+1,path:[]},npcs,plans:{appts:[a],nextId:2},clubSessions:{[a.id]:{id:a.id,mode:'direct' as const,step:'activity' as const}},scenes:[]}
}

describe('함께 하는 생활 모션',()=>{
 it('여덟 모임에 진행자·참가자 반응이 있고, 차와 정원은 서로 다른 역할이다',()=>{
  for(const activity of CLUB_ACTIVITIES){
   const s=scene(activity);s.clock.minute=610.1
   const leader=socialEventMotion(s,'baker',1)!
   const follower=socialEventMotion(s,'grandpa',1)!
   expect(leader).not.toBeNull();expect(follower).not.toBeNull()
   expect(leader.action).not.toBe(follower.action)
  }
  const s=scene('garden');s.clock.minute=610
  expect(socialEventMotion(s,'baker',1)?.action).toBe('inspect')
  expect(socialEventMotion(s,'grandpa',1)?.action).toBe('water')
 })
 it('반응은 0.3~0.7초 늦게, 관찰 모임은 같은 방향을 바라본다',()=>{
  const s=scene('sew');s.clock.minute=609.1
  expect(socialEventMotion(s,'baker',1)?.action).toBe('show')
  expect(socialEventMotion(s,'grandpa',1)?.action).toBe('stitch')
  s.clock.minute=609.8
  expect(socialEventMotion(s,'grandpa',1)?.action).toBe('inspect')
  s.plans.appts[0].activity='observe';s.clock.minute=612
  expect(socialEventMotion(s,'baker',1)?.facing).toBe(socialEventMotion(s,'grandpa',1)?.facing)
 })
 it('구경만 한 유저에게 역할을 강제로 주지 않고, 걸어가는 이웃은 동작하지 않는다',()=>{
  const s=scene();s.plans.appts[0].attended=false
  expect(socialEventMotion(s,'player',1)).toBeNull()
  s.npcs.baker.path=[{x:1,y:1}]
  expect(socialEventMotion(s,'baker',1)).toBeNull()
 })
 it('끝난 뒤 인사·정리 후 두 명씩 보내고, 다시 정산해도 끝 시각과 보상은 늘지 않는다',()=>{
  const s=scene();s.clock.minute=720
  const done=settleAppt(s,'social:1')
  expect(appointmentSpots(done).baker).toBeDefined()
  expect(socialEventMotion(done,'baker',1)?.action).toBe('wave')
  const tidy={...done,clock:{day:2,minute:724}}
  expect(socialEventMotion(tidy,'baker',1)?.action).toBe('tidy')
  const first={...done,clock:{day:2,minute:729}}
  expect(appointmentSpots(first).baker).toBeUndefined()
  expect(appointmentSpots(first).grandpa).toBeUndefined()
  expect(appointmentSpots(first).child).toBeDefined()
  expect(appointmentSpots({...done,clock:{day:2,minute:733}})).toEqual({})
  const again=settleAppt(first,'social:1')
  expect(again.plans.appts[0].endedAt).toBe(720)
  expect(again.hearts).toEqual(done.hearts)
  expect(appointmentSpots({...done,clock:{day:3,minute:720}})).toEqual({})
 })
 it('출석한 손일은 순서대로 한 번 진행되고, 저장·불러오기에도 남으며 별도 보상은 없다',()=>{
  let s=scene('read')
  const before=s.hearts
  expect(advanceGroupTask(s,'social:1',1)).toBe(s)
  s=advanceGroupTask(s,'social:1',0,'요한복음 1장 필사본')
  expect(advanceGroupTask(s,'social:1',0)).toBe(s)
  s=advanceGroupTask(s,'social:1',1)
  s=advanceGroupTask(s,'social:1',2,'baker')
  expect(s.hearts).toEqual(before)
  expect(socialEventMotion(s,'player',1)?.prop).toBe('copy')
  expect(socialEventMotion(s,'baker',1)?.action).toBe('nod')
  expect(deserialize(serialize(s),CONTENT)?.clubSessions['social:1'].task).toEqual(s.clubSessions['social:1'].task)
  expect(advanceGroupTask(s,'social:1',3)).toBe(s)
 })
 it('새 활동은 저장 정리에서 유지되고, 잘못된 손일 진행은 버린다',()=>{
  for(const activity of CLUB_ACTIVITIES)expect(sanitizeClubs([{id:'club:1',name:'우리 모임',activity,place:'hallTable',members:['baker'],weekday:2,slot:'morning',active:true,paused:false}])[0].activity).toBe(activity)
  expect(sanitizeClubSessions({x:{id:'x',mode:'direct',step:'activity',task:{stage:99}}}).x.task).toBeUndefined()
 })
 it('내가 손일을 하는 동안 선택한 역할의 동작을 보여준다',()=>{
  for(const [activity,choice,action,prop] of [['sew','작은 꽃무늬','stitch','cloth'],['garden','물주기 맡기','water','water'],['cook','재료 섞기 맡기','prepare','bowl'],['music','박수로 박자 맞추기','clap',undefined]] as const){
   const s=advanceGroupTask(scene(activity),'social:1',0,choice)
   expect(socialEventMotion(s,'player',1)).toMatchObject({action,...(prop?{prop}:{})})
   expect(socialEventMotion(s,'grandpa',1)?.action).toBe('inspect')
  }
 })
 it('계절 잔치에서는 실제 자리에 온 유저만 손일을 진행하고 완료 후 이웃이 반응한다',()=>{
  let s=scene();s.clock={day:20,minute:1090};s.player={...s.player,...FIRE}
  s.npcs.baker={...s.npcs.baker,...FESTIVAL_SPOTS.baker,path:[]}
  s.fests=[{id:'fest:qa',kind:'festival',day:20,place:'bench',members:[],role:'deco',reserve:{},step:'tidy',joined:false,consumed:false,closed:false,cancelled:false}]
  const far={...s,player:{...s.player,x:FIRE.x+10}}
  expect(advanceGroupTask(far,'fest:qa',0,'꽃 장식 잇기')).toBe(far)
  s=advanceGroupTask(s,'fest:qa',0,'꽃 장식 잇기')
  expect(socialEventMotion(s,'player',1)?.prop).toBe('decor')
  s=advanceGroupTask(s,'fest:qa',1);s=advanceGroupTask(s,'fest:qa',2,'baker')
  expect(socialEventMotion(s,'baker',1)?.action).toBe('nod')
  expect(deserialize(serialize(s),CONTENT)?.fests[0].task).toEqual(s.fests[0].task)
 })
 it('모임에 가는 NPC를 자리로 순간 이동시키지 않는다',()=>{
  const s=scene();s.npcs.baker={...s.npcs.baker,x:HALL_SPOTS[0].x-4,path:[],goal:null}
  const next=tick(s,.05,()=>.5,CONTENT).state
  expect(Math.abs(next.npcs.baker.x-s.npcs.baker.x)).toBeLessThan(.5)
 })
})

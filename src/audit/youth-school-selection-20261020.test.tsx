import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { newChild, childStage } from '../engine/child'
import { canSchool, childAtSchool, childTile, SCHOOL_SEAT, sendToSchool, setChildMode, type GameState } from '../engine/game'
import { legacyGame } from '../engine/growth-test-support'
import { selectKid, siblingTile, siblingAtSchool } from '../engine/siblings'
import { canKidAct } from '../engine/family'
import { deserialize, serialize } from '../engine/save'
import { useGame } from '../store/game-store'
import { isHome } from '../engine/world'
import { Family } from '../features/family/Family'

function fixture(age:number):GameState {
 const base=legacyGame(CONTENT),day=100
 return {...base,homeLevel:2,coins:200,scenes:[],clock:{day,minute:600},
  child:{...newChild(day-age,base.stats,undefined),name:'검사아이',born:day-age},
  siblings:[{...newChild(day-age-46,base.stats,undefined),name:'다른아이',born:day-age-46,...(age+46>=84?{job:'scribe' as const,jobConfirmed:true}:{})}],
  flags:{...base.flags,villageLevel:10},player:{...base.player,x:21,y:46,path:[]}}
}
afterEach(()=>cleanup())
for(const [age,stage] of [[20,'toddler'],[50,'helper']] as const){
 it(`${stage}: 아이 전환/저장 뒤에도 등원한 아이는 학교에 있다`,()=>{
  const initial=fixture(age),born=initial.child!.born
  expect(childStage(initial.child!,initial.clock.day)).toBe(stage)
  const sent=sendToSchool(initial,'wit')!
  expect(sent.coins).toBe(initial.coins-15)
  expect(childAtSchool(sent)).toBe(true)
  expect(childTile(sent)).toEqual(SCHOOL_SEAT)
  expect(sendToSchool(sent,'wit')).toBeNull()
  expect(canKidAct(sent,'read')).toBe('school')
  for(const state of [selectKid(sent,initial.siblings![0].born),deserialize(serialize(selectKid(sent,initial.siblings![0].born)),CONTENT)!]){
   const index=state.siblings!.findIndex(k=>k.born===born),kid=state.siblings![index]
   expect(kid.kidFlags!.schoolDay).toBe(state.clock.day)
   // 선택 아이와 겹치지 않는 학교 옆 자리를 유지한다.
   expect(siblingTile(state,kid,index)).toEqual({x:SCHOOL_SEAT.x+index+1,y:SCHOOL_SEAT.y})
   const back=selectKid(state,born)
   expect(childTile(back)).toEqual(SCHOOL_SEAT)
   expect(canKidAct(back,'read')).toBe('school')
   expect(back.coins).toBe(sent.coins)
  }
 })
}
it('집에 두었던 어린이는 다른 아이 선택 뒤에도 집 안에 남는다',()=>{
 const home=setChildMode(fixture(50),'home'),at=childTile(home)
 const switched=selectKid(home,home.siblings![0].born),kid=switched.siblings![0]
 expect(kid.mode).toBe('home')
 expect(isHome(siblingTile(switched,kid,0))).toBe(true)
 expect(childTile(selectKid(switched,kid.born))).toEqual(at)
})
it('취소/미선택은 비용과 등원 기록을 바꾸지 않고 18시/다음 날에는 정상적으로 등원 제한이 해제된다',()=>{
 const s=fixture(20),raw=serialize(s)
 expect(canSchool(s)).toBeNull();expect(serialize(s)).toBe(raw)
 const sent=sendToSchool(s,'wit')!
 for(const clock of [{day:100,minute:1080},{day:101,minute:600}]){
  const later={...sent,clock}
  expect(childAtSchool(later)).toBe(false)
  expect(canKidAct(later,'read')).toBeNull()
 }
})
it('실제 가족 선택 단추를 눌러도 등원 표시가 유지된다',()=>{
 const sent=sendToSchool(fixture(20),'wit')!
 useGame.setState({game:sent,modal:{kind:'family'},toast:null,decorating:null})
 render(<Family />)
 fireEvent.click(screen.getByRole('button',{name:/다른아이/}))
 const next=useGame.getState().game,kid=next.siblings![0]
 expect(next.child!.name).toBe('다른아이')
 expect(kid.kidFlags!.schoolDay).toBe(100)
 expect(siblingTile(next,kid,0).y).toBe(SCHOOL_SEAT.y)
})

it('아이 셋을 모두 맡겨도 선택 전환과 저장 뒤 세 학교 자리가 겹치지 않는다',()=>{
 let s=fixture(20)
 s={...s,clock:{...s.clock,day:200},child:{...s.child!,born:180},siblings:[{...s.siblings![0],born:134},{...newChild(140,s.stats,undefined),born:140}]}
 const births=[s.child!.born,...s.siblings!.map(k=>k.born)]
 for(const born of births){s=selectKid(s,born);s=sendToSchool(s,'wit')!}
 s=deserialize(serialize(s),CONTENT)!
 const seats=[childTile(s)!,...s.siblings!.map((k,i)=>siblingTile(s,k,i))]
 expect(new Set(seats.map(at=>`${at.x},${at.y}`)).size).toBe(3)
 expect(seats.every(at=>at.y===SCHOOL_SEAT.y)).toBe(true)
 expect(s.siblings!.every(k=>siblingAtSchool(s,k))).toBe(true)
 const after={...s,clock:{...s.clock,minute:1080}}
 expect(after.siblings!.every(k=>!siblingAtSchool(after,k))).toBe(true)
})

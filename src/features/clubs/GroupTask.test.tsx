import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { newGame, type GameState } from '../../engine/game'
import { HALL_SPOTS } from '../../engine/places'
import { useGame } from '../../store/game-store'
import { ClubSession } from './ClubSession'
import { FestSession } from '../fest/FestSession'
import { T } from '../../content/text'
import { FESTIVAL_SPOTS, FIRE } from '../../engine/neighbors'

vi.mock('../../render/renderer',()=>({drawGroupPreview:vi.fn()}))
beforeEach(()=>{
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null)
 localStorage.clear()
 const b=newGame(CONTENT)
 const s:GameState={...b,clock:{day:2,minute:602},scenes:[],player:{...b.player,...HALL_SPOTS[0]},plans:{nextId:2,appts:[{id:'appt:1',clubId:'club:1',kind:'club',day:2,from:600,to:720,place:'hallTable',members:['baker'],startedWith:['baker'],state:'running',rewarded:false,remembered:false,attended:true,activity:'tea'}]},clubSessions:{'appt:1':{id:'appt:1',mode:'direct',step:'activity'}}}
 useGame.getState().load(s)
})
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks()})

describe('유저가 맡는 모임 손일',()=>{
 it('shows a venue hint instead of event controls after leaving a joined event',()=>{
  const b=useGame.getState().game
  useGame.getState().load({...b,player:{...b.player,x:1,y:8},clubSessions:{},plans:{...b.plans,appts:b.plans.appts.map(a=>({...a,clubId:undefined,kind:'event',festId:'fest:1'}))},fests:[{id:'fest:1',apptId:'appt:1',kind:'tea',day:2,place:'hallTable',members:['baker'],reserve:{},step:'tidy',joined:true,consumed:false,closed:false,cancelled:false}]})
  render(<FestSession id="fest:1"/>)
  expect(screen.getByText(T.fest.joinFar)).toBeInTheDocument()
  expect(screen.queryByRole('button',{name:T.fest.next})).not.toBeInTheDocument()
 })
 it('차 모임: 이웃마다 입맛을 듣고 한 잔씩 — 끝에 결과 창(맞았는지·마음)과 남은 이야기, 마치면 모임이 끝난다 (2026-10-13)',async()=>{
  const { wantOf, HOLD_BANDS, apptGuests } = await import('../../engine/club-round')
  vi.useFakeTimers()
  render(<ClubSession id="appt:1"/>)
  const guests=apptGuests(useGame.getState().game,'appt:1')
  for(const [i,npc] of guests.entries()){
   expect(screen.getByRole('heading',{name:`${guests.length}명 가운데 ${i+1}번째 차례`})).toBeInTheDocument()
   const [lo,hi]=HOLD_BANDS[wantOf(npc,'tea')]
   const before=useGame.getState().game.hearts[npc]??0
   const hold=screen.getByRole('button',{name:T.round.hold})
   fireEvent.keyDown(hold,{key:' '});act(()=>vi.advanceTimersByTime(Math.round((lo+hi)/2/2)*40));fireEvent.keyUp(hold,{key:' '})
   expect(useGame.getState().game.hearts[npc]).toBeGreaterThan(before)
   fireEvent.click(screen.getByRole('button',{name:'다음'}))
  }
  expect(screen.getByRole('heading',{name:T.round.resultTitle})).toBeInTheDocument()
  expect(screen.getAllByText(T.round.good)).toHaveLength(guests.length)
  expect(screen.getByRole('heading',{name:T.round.talkTitle})).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:T.round.finish}))
  expect(useGame.getState().game.clubSessions['appt:1'].step).toBe('done')
 })
 it('그림 모임: 이웃마다 그리고 싶은 것을 골라 주면, 결과 창 뒤에 모임을 마치는 기존 단추로 이어진다',async()=>{
  const { wantOf, apptGuests } = await import('../../engine/club-round')
  const b=useGame.getState().game
  useGame.getState().load({...b,plans:{...b.plans,appts:b.plans.appts.map(a=>({...a,activity:'paint'}))}})
  render(<ClubSession id="appt:1"/>)
  const opts=(T.round.kinds.paint.opts as string[])
  for(const npc of apptGuests(useGame.getState().game,'appt:1')){
   fireEvent.click(screen.getByRole('button',{name:opts[wantOf(npc,'paint')]}))
   fireEvent.click(screen.getByRole('button',{name:'다음'}))
  }
  expect(screen.getByRole('heading',{name:T.round.resultTitle})).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'그림 보여주고 감상하기'}))
  expect(useGame.getState().game.clubSessions['appt:1'].step).toBe('finish')
 })
 it('작품 소개 행사: 이웃이 궁금한 데를 보여 준 다음 행사 이야기를 이어간다',async()=>{
  const { wantOf } = await import('../../engine/club-round')
  const b=useGame.getState().game
  useGame.getState().load({...b,clubSessions:{},plans:{...b.plans,appts:b.plans.appts.map(a=>({...a,clubId:undefined,kind:'event',festId:'fest:1',startedWith:['baker']}))},fests:[{id:'fest:1',apptId:'appt:1',kind:'showcase',day:2,place:'hallTable',members:['baker'],reserve:{},step:'activity',joined:true,consumed:false,closed:false,cancelled:false}]})
  render(<FestSession id="fest:1"/>)
  expect(screen.queryByRole('button',{name:T.fest.pick.show})).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:(T.round.kinds.showcase.opts as string[])[wantOf('baker','showcase')]}))
  fireEvent.click(screen.getByRole('button',{name:'다음'}))
  fireEvent.click(screen.getByRole('button',{name:T.fest.pick.show}))
  expect(useGame.getState().game.fests[0].step).toBe('talk')
 })
 it('계절 잔치 장식 역할은 모닥불 곁에 온 이웃과 마친 뒤 완료할 수 있다',async()=>{
  const { wantOf } = await import('../../engine/club-round')
  const b=useGame.getState().game
  useGame.getState().load({...b,clock:{day:20,minute:1090},player:{...b.player,...FIRE},npcs:{...b.npcs,baker:{...b.npcs.baker,...FESTIVAL_SPOTS.baker,visible:true,path:[]}},plans:{appts:[],nextId:1},clubSessions:{},fests:[{id:'fest:1',kind:'festival',day:20,place:'bench',members:[],role:'deco',reserve:{},step:'tidy',joined:false,consumed:false,closed:false,cancelled:false}]})
  render(<FestSession id="fest:1"/>)
  expect(screen.getByRole('button',{name:T.fest.roleButton})).toHaveAttribute('aria-disabled', 'true')
  fireEvent.click(screen.getByRole('button',{name:(T.round.kinds.festivalDeco.opts as string[])[wantOf('baker','festivalDeco')]}))
  fireEvent.click(screen.getByRole('button',{name:'다음'}))
  fireEvent.click(screen.getByRole('button',{name:T.fest.roleButton}))
  expect(useGame.getState().game.fests[0]).toMatchObject({closed:true,step:'done'})
 })
})

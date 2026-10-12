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
 it('차 따르기는 너무 빨리 놓으면 다시 하고, 적당히 따른 뒤 이웃에게 건넨다',()=>{
  vi.useFakeTimers()
  render(<ClubSession id="appt:1"/>)
  fireEvent.click(screen.getByRole('button',{name:'따뜻한 차 따르기'}))
  const hold=screen.getByRole('button',{name:'누르고 있다가 놓기'})
  fireEvent.keyDown(hold,{key:' '});act(()=>vi.advanceTimersByTime(100));fireEvent.keyUp(hold,{key:' '})
  expect(screen.getByRole('status')).toHaveTextContent('다시 누르고')
  expect(useGame.getState().game.clubSessions['appt:1'].task?.stage).toBe(1)
  fireEvent.keyDown(hold,{key:' '});act(()=>vi.advanceTimersByTime(750));fireEvent.keyUp(hold,{key:' '})
  expect(useGame.getState().game.clubSessions['appt:1'].task?.stage).toBe(2)
  fireEvent.click(screen.getByRole('button',{name:/에게$/}))
  expect(useGame.getState().game.clubSessions['appt:1'].task?.stage).toBe(3)
  expect(screen.getByRole('status')).toHaveTextContent('고개를 끄덕여요')
  expect(useGame.getState().game.plans.appts[0].rewarded).toBe(false)
 })
 it('선 잇기는 순서대로 마쳐야 전달할 수 있고, 모임을 마치는 기존 버튼으로 이어진다',()=>{
  const b=useGame.getState().game
  useGame.getState().load({...b,plans:{...b.plans,appts:b.plans.appts.map(a=>({...a,activity:'paint'}))}})
  render(<ClubSession id="appt:1"/>)
  fireEvent.click(screen.getByRole('button',{name:'꽃 그리기'}))
  expect(screen.getByRole('button',{name:'2번째 선 잇기'})).toBeDisabled()
  for(let n=1;n<=4;n++)fireEvent.click(screen.getByRole('button',{name:`${n}번째 선 잇기`}))
  fireEvent.click(screen.getByRole('button',{name:/에게$/}))
  fireEvent.click(screen.getByRole('button',{name:'그림 보여주고 감상하기'}))
  expect(useGame.getState().game.clubSessions['appt:1'].step).toBe('finish')
 })
 it('작품 소개는 직접 작업하고 이웃에게 보여준 다음 행사 이야기를 이어간다',()=>{
  const b=useGame.getState().game
  useGame.getState().load({...b,clubSessions:{},plans:{...b.plans,appts:b.plans.appts.map(a=>({...a,clubId:undefined,kind:'event',festId:'fest:1'}))},fests:[{id:'fest:1',apptId:'appt:1',kind:'showcase',day:2,place:'hallTable',members:['baker'],reserve:{},step:'activity',joined:true,consumed:false,closed:false,cancelled:false}]})
  render(<FestSession id="fest:1"/>)
  expect(screen.queryByRole('button',{name:T.fest.pick.show})).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'작품 펼쳐 보이기'}))
  for(let n=1;n<=4;n++)fireEvent.click(screen.getByRole('button',{name:`${n}번째 선 잇기`}))
  fireEvent.click(screen.getByRole('button',{name:/에게$/}))
  fireEvent.click(screen.getByRole('button',{name:T.fest.pick.show}))
  expect(useGame.getState().game.fests[0].step).toBe('talk')
 })
 it('계절 잔치 장식 역할은 자리에 온 이웃과 마친 뒤 완료할 수 있다',()=>{
  const b=useGame.getState().game
  useGame.getState().load({...b,clock:{day:20,minute:1090},player:{...b.player,...FIRE},npcs:{...b.npcs,baker:{...b.npcs.baker,...FESTIVAL_SPOTS.baker,visible:true,path:[]}},plans:{appts:[],nextId:1},clubSessions:{},fests:[{id:'fest:1',kind:'festival',day:20,place:'bench',members:[],role:'deco',reserve:{},step:'tidy',joined:false,consumed:false,closed:false,cancelled:false}]})
  render(<FestSession id="fest:1"/>)
  expect(screen.getByRole('button',{name:T.fest.roleButton})).toBeDisabled()
  fireEvent.click(screen.getByRole('button',{name:'꽃 장식 잇기'}))
  for(let n=1;n<=4;n++)fireEvent.click(screen.getByRole('button',{name:`${n}번째 선 잇기`}))
  fireEvent.click(screen.getByRole('button',{name:'헤이즐에게'}))
  fireEvent.click(screen.getByRole('button',{name:T.fest.roleButton}))
  expect(useGame.getState().game.fests[0]).toMatchObject({closed:true,step:'done'})
 })
})

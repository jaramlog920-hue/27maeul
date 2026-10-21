import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { GameState } from '../engine/game'
import { CONTENT } from '../content/catalog'
import { ITEM_TEXT } from '../content/text'
import { newChild, childStage } from '../engine/child'
import { legacyGame, establishedGame } from '../engine/growth-test-support'
import { canKidAct, doKidAct, kidActsToday } from '../engine/family'
import { BAG_SLOTS, slotsUsed, type Inventory } from '../engine/items'
import { deserialize, serialize } from '../engine/save'
import { storageChest } from '../engine/storage-access'
import type { ItemId } from '../engine/types'
import { useGame } from '../store/game-store'
import { ModalLayer } from '../features/ModalLayer'

const ids=(Object.keys(ITEM_TEXT) as ItemId[]).filter(id=>!['woodToy','clothDoll','bread','herb','fig','olive','reed'].includes(id))
const full=():Inventory=>Object.fromEntries(ids.slice(0,BAG_SLOTS).map(id=>[id,1]))
function fixture(age=41):GameState {
 const b=legacyGame(CONTENT),day=100
 return {...b,room:[],homeLevel:2,scenes:[],inv:full(),clock:{day,minute:600},child:{...newChild(day-age,b.stats,undefined),name:'검사아이',born:day-age}}
}
afterEach(cleanup)
for(const age of [41,42])for(const act of ['make','cook','walk'] as const){
 it(`나이${age} ${act}: 전량 받을 공간이 없으면 아무것도 소모하지 않고 먼저 안내한다`,()=>{
  const s=fixture(age),raw=serialize(s)
  expect(childStage(s.child!,100)).toBe(age===41?'toddler':'helper')
  expect(slotsUsed(s.inv)).toBe(50);expect(storageChest(s)).toBeNull()
  expect(canKidAct(s,act)).toBeNull()
  expect(doKidAct(s,act,CONTENT)).toBeNull();expect(serialize(s)).toBe(raw)
  useGame.setState({game:s,modal:{kind:'kidTime'},toast:null,decorating:null,piecePopups:[]})
  useGame.getState().kidAct(act)
  expect(useGame.getState().modal).toMatchObject({kind:'kidCapacity',retry:{act,born:s.child!.born}})
  expect(serialize(useGame.getState().game)).toBe(raw)
  render(<ModalLayer/>)
  expect(screen.getByText(/가방을 비우시겠습니까/)).toBeInTheDocument()
  expect(screen.getByText(/시간과 오늘 활동 횟수는 그대로/)).toBeInTheDocument()
 })
}
it('빈칸/묶음 여유/보관함 여유에서는 정상 수령하고 보관함도 차면 미리 거절한다',()=>{
 const s=fixture(),inv={...s.inv};delete inv[ids[0]]
 expect(doKidAct({...s,inv},'make',CONTENT)!.state.inv.woodToy).toBe(1)
 expect(doKidAct({...s,inv:{...inv,woodToy:98}},'make',CONTENT)!.state.inv.woodToy).toBe(99)
 const flags={...s.flags,'unlock:supplyChest':1}
 expect(doKidAct({...s,flags,chest:{}},'make',CONTENT)!.state.chest!.woodToy).toBe(1)
 expect(doKidAct({...s,flags,chest:{woodToy:30}},'make',CONTENT)).toBeNull()
})
it('가방 정리/다시 받기/연타: 원래 작품을 한 번 받고 시간·횟수도 한 번만 사용한다',()=>{
 const game=fixture();useGame.setState({game,modal:{kind:'kidTime'},toast:null,piecePopups:[]})
 useGame.getState().kidAct('make');render(<ModalLayer/>)
 fireEvent.click(screen.getByRole('button',{name:'가방 비우기'}))
 expect(useGame.getState().modal).toMatchObject({kind:'bag',resumeKid:{act:'make'}})
 // 정리 전 재시도도 소모/보상 없음
 fireEvent.click(screen.getByRole('button',{name:'공간 확인하고 다시 받기'}))
 expect(useGame.getState().game).toBe(game)
 fireEvent.click(screen.getByRole('button',{name:'가방 비우기'}))
 useGame.getState().discard(ids[0],1)
 fireEvent.click(screen.getByRole('button',{name:'공간 확인하고 다시 받기'}))
 useGame.getState().retryKidAct();useGame.getState().retryKidAct()
 const final=useGame.getState().game
 expect(final.inv.woodToy).toBe(1);expect(final.inv.clothDoll??0).toBe(0)
 expect(kidActsToday(final)).toBe(1);expect(final.flags.kidMade).toBe(1);expect(final.clock.minute).toBe(640)
 const loaded=deserialize(serialize(final),CONTENT)!
 expect(loaded.inv.woodToy).toBe(1);expect(loaded.flags.kidMade).toBe(1)
})
it('취소와 가방 닫기: 활동이 실행되지 않고, 가방 닫기는 원래 안내로 돌아온다',()=>{
 const game=fixture(),raw=serialize(game);useGame.setState({game,modal:{kind:'kidTime'},toast:null,piecePopups:[]})
 useGame.getState().kidAct('make');render(<ModalLayer/>)
 fireEvent.click(screen.getByRole('button',{name:'가방 비우기'}))
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().modal?.kind).toBe('kidCapacity')
 fireEvent.click(screen.getByRole('button',{name:'나중에'}))
 expect(useGame.getState().modal).toBeNull();expect(serialize(useGame.getState().game)).toBe(raw)
})
it('대기 중 아이/학교 상태가 바뀌면 다른 아이에게 실행하거나 시간을 쓰지 않는다',()=>{
 const game=fixture();useGame.setState({game,modal:{kind:'kidTime'},toast:null,piecePopups:[]})
 useGame.getState().kidAct('make')
 useGame.setState({game:{...game,child:{...game.child!,born:1}}})
 useGame.getState().retryKidAct()
 expect(useGame.getState().game.clock.minute).toBe(600);expect(useGame.getState().modal?.kind).toBe('kidTime')
 useGame.setState({game,modal:{kind:'kidTime'}});useGame.getState().kidAct('make')
 useGame.setState({game:{...game,flags:{...game.flags,schoolDay:100}}})
 useGame.getState().retryKidAct();expect(useGame.getState().modal?.kind).toBe('kidTime')
 expect(kidActsToday(useGame.getState().game)).toBe(0)
})
it('현재 완필 해금 저장도 동일하게 보호하고, 산출물이 없는 탄 빵 활동은 그대로 허용한다',()=>{
 const s=fixture(),current=establishedGame(CONTENT,27),flags={...s.flags,...current.flags};delete flags.growthLegacy
 const ready={...s,progress:current.progress,shelved:current.shelved,flags}
 expect(storageChest(ready)).toBeNull();expect(doKidAct(ready,'make',CONTENT)).toBeNull()
 expect(doKidAct({...s,flags:{...s.flags,kidCooks:1}},'cook',CONTENT)!.burnt).toBe(true)
})

import { describe,it,expect } from 'vitest'
import { useGame } from '../store/game-store'
import { CONTENT } from '../content/catalog'
import { newGame } from './game'
import { newChild } from './child'
import { freshStats } from './stats'
import { deserialize,serialize } from './save'

describe('자식 진로 확정과 독립된 거주 선택',()=>{
 it('진로를 확정한 뒤 거주지를 바꿔도 직업이 유지되고 저장된다',()=>{
  const base=newGame(CONTENT),child={...newChild(1,freshStats(),undefined),job:'cook' as const,jobConfirmed:false,left:false}
  useGame.setState({game:{...base,clock:{...base.clock,day:85},child}})
  useGame.getState().chooseChildCareer('painter')
  expect(useGame.getState().game.child).toMatchObject({job:'painter',jobConfirmed:true,left:false})
  useGame.getState().setChildResidence(true)
  expect(useGame.getState().game.child).toMatchObject({job:'painter',left:true})
  useGame.getState().setChildResidence(false)
  const saved=deserialize(serialize(useGame.getState().game),CONTENT)
  expect(saved?.child).toMatchObject({job:'painter',jobConfirmed:true,left:false})
  useGame.getState().chooseChildCareer('cook')
  expect(useGame.getState().game.child?.job).toBe('painter')
 })
 it('성인 전에는 진로와 거주지를 바꿀 수 없다',()=>{
  const base=newGame(CONTENT),child={...newChild(1,freshStats(),undefined),job:'cook' as const,jobConfirmed:false,left:false}
  useGame.setState({game:{...base,child}})
  useGame.getState().chooseChildCareer('painter');useGame.getState().setChildResidence(true)
  expect(useGame.getState().game.child).toEqual(child)
 })
})

import {it,expect} from 'vitest'
import {CONTENT} from '../content/catalog'
import {T} from '../content/text'
import {newGame} from '../engine/game'
import {useGame} from './game-store'

it.each([
 ['baker','grapes','liked'],
 ['shepherd','wool','disliked'],
 ['baker','olive','disliked'],
 ['shepherd','scentCandle','plain'],
 ['baker','perfumeOil','liked'],
] as const)('%s에게 %s 선물은 아이템 용도 없이 %s 반응을 보인다',(neighborId,item,reaction)=>{
 const g=newGame(CONTENT)
 useGame.setState({game:{...g,inv:{[item]:1}},modal:null})
 useGame.getState().gift(neighborId,item)
 const modal=useGame.getState().modal
 expect(modal?.kind).toBe('talk')
 if(modal?.kind==='talk'){
  expect(modal.line).toBe(T.giftReplies[reaction])
  expect(modal.line).not.toMatch(/먹|쓸|포도|양털|향초|향유|올리브/)
 }
 expect(useGame.getState().game.inv[item]??0).toBe(0)
})

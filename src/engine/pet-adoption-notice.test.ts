import {beforeEach,expect,it,vi} from 'vitest'
import {CONTENT} from '../content/catalog'
import {newGame} from './game'
import {useGame} from '../store/game-store'

vi.mock('../audio/sound',()=>({sfx:vi.fn(),setAudioMuted:vi.fn()}))
beforeEach(()=>{
  const game=newGame(CONTENT)
  useGame.setState({game:{...game,clock:{...game.clock,day:2}},toast:null,modal:null,clockMs:0})
})
for(const animal of ['cat','dog'] as const)it(`adopting ${animal} keeps your pet and reports the other adoption once`,()=>{
  useGame.getState().adopt(animal,'새 식구')
  expect(useGame.getState().game.companion).toMatchObject({kind:animal,name:'새 식구'})
  expect(useGame.getState().toast?.text).toBe(`${animal==='cat'?'강아지는':'고양이는'} 윌로가 데려갔어요.`)
  // The saved flag remains a record, with no NPC pet sprite rendered from it.
  expect(useGame.getState().game.flags.childPet).toBe(animal==='cat'?2:1)
  useGame.setState({toast:null})
  useGame.getState().adopt(animal==='cat'?'dog':'cat','다른 동물')
  expect(useGame.getState().game.companion?.kind).toBe(animal)
  expect(useGame.getState().toast).toBeNull()
})

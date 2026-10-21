import { it, expect } from 'vitest'
import { CONTENT } from '../../../src/content/catalog'
import { newGame, startCopy, writeVerse, canTrip } from '../../../src/engine/game'
import { freshStats } from '../../../src/engine/stats'
import { useGame } from '../../../src/store/game-store'
import { DESTS,tripCost } from '../../../src/engine/travel'
import { copySpot } from '../../../src/engine/copying'
import { deserialize,SAVE_KEY } from '../../../src/engine/save'

it('family trip return works after supplying a currently unlocked fixture',()=>{
  localStorage.clear()
  const f=newGame(CONTENT),game={...f,coins:tripCost(DESTS.harbor,[])+15,clock:{day:19,minute:600},flags:{...f.flags,growthLegacy:1},child:{name:'아이',look:'girl' as const,born:14,stats:freshStats(),lean:null,close:0}}
  expect(canTrip(game,'harbor')).toBeNull()
  useGame.getState().load(game)
  useGame.getState().startTripBoard('harbor',true);useGame.getState().finishTripBoard([])
  useGame.getState().goTrip('harbor',['perfumeOil'])
  expect(useGame.getState().game).toBe(game)
  useGame.getState().goTrip('harbor',[])
  const after=useGame.getState().game,loaded=deserialize(localStorage.getItem(SAVE_KEY),CONTENT)!
  expect(loaded.child!.close).toBe(5);expect(loaded.coins).toBe(15);expect(loaded.clock.day).toBe(20)
  useGame.getState().goTrip('harbor',[]);expect(useGame.getState().game).toBe(after)
  console.log('TRIAGE_FAMILY_TRIP current unlock fixture returns/persists/rewards once')
})

it('recopy reaches done using real-sized insertText keystrokes instead of prohibited whole-verse insertText',()=>{
  let game=startCopy({...newGame(CONTENT),scenes:[]},'phm',CONTENT)
  while(copySpot(game,'phm',CONTENT))game=writeVerse(game,'phm',copySpot(game,'phm',CONTENT)!.verse.text,CONTENT).state
  useGame.setState({game,modal:{kind:'copy',view:'menu'},piecePopups:[]})
  useGame.getState().copyAgain('phm',1)
  for(let guard=0;guard<40&&useGame.getState().modal?.kind==='copy'&&(useGame.getState().modal as {view:string}).view==='write';guard++){
    const s=useGame.getState().game,text=copySpot(s,'phm',CONTENT)!.verse.text
    for(let n=1;n<=text.length;n++)expect(useGame.getState().copyType(text.slice(0,n),{inputType:'insertText',hold:true})).toBe(true)
    expect(useGame.getState().copyType(text,{inputType:'insertText'})).toBe(true)
  }
  expect(useGame.getState().modal).toMatchObject({kind:'copy',view:'done'})
  expect(useGame.getState().game.copy.againDone?.['phm:1']).toBe(1)
  console.log('TRIAGE_COPY_AGAIN real keystroke-size input completes once')
})

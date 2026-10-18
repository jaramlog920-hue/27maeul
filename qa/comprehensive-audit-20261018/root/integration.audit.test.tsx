import React from 'react'
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react'
import {CONTENT} from '../../../src/content/catalog'
import {newGame,heartUp} from '../../../src/engine/game'
import {deserialize,serialize,setActiveSlot,saveGame,exportSave,importSave,loadGame} from '../../../src/engine/save'
import {useGame} from '../../../src/store/game-store'
import {ScreenBoundary} from '../../../src/features/ScreenBoundary'

beforeEach(()=>{localStorage.clear();setActiveSlot('1');useGame.getState().load({...newGame(CONTENT),scenes:[]});vi.spyOn(console,'error').mockImplementation(()=>{})})
afterEach(()=>{cleanup();vi.restoreAllMocks()})

it('control: normal save/export/import uses a new slot and preserves source game',()=>{
 const original={...newGame(CONTENT,{look:'f',name:'감사 원본'}),coins:123,scenes:[]}
 expect(saveGame(original)).toBe(true)
 const imported=importSave(exportSave({...original,coins:789}),CONTENT)
 expect(imported).toMatchObject({slot:'2'})
 expect(loadGame(CONTENT)?.coins).toBe(789)
 expect(loadGame(CONTENT,undefined,'1')?.coins).toBe(123)
})

it('repro: numeric-string coins are accepted and become 500 from 50 on load',()=>{
 const data=JSON.parse(serialize(newGame(CONTENT)))
 data.coins='50'
 const loaded=deserialize(JSON.stringify(data),CONTENT)
 expect(loaded).not.toBeNull()
 expect(loaded!.coins).toBe('500')
 console.log('COINS_REPRO',JSON.stringify({input:data.coins,loaded:loaded!.coins}))
})

it('repro: malformed heart count passes load and next one-point gain becomes cap',()=>{
 const data=JSON.parse(serialize(newGame(CONTENT)))
 data.hearts.baker='50'
 const loaded=deserialize(JSON.stringify(data),CONTENT)!
 expect(loaded).not.toBeNull()
 expect(loaded.hearts.baker).toBe('50')
 const after=heartUp(loaded,'baker',1)
 console.log('HEARTS_REPRO',JSON.stringify({loaded:loaded.hearts.baker,after:after.hearts.baker}))
 expect(after.hearts.baker).not.toBe(51)
})

it('fault injection: closing a failed mandatory scene opens the same failed scene next frame',()=>{
 const game={...newGame(CONTENT),scenes:['welcome']}
 useGame.getState().load(game)
 act(()=>useGame.getState().frame(0.016))
 expect(useGame.getState().modal).toMatchObject({kind:'scene',id:'welcome'})
 const Broken=():React.JSX.Element=>{throw new Error('audit injected scene render failure')}
 render(<ScreenBoundary><Broken/></ScreenBoundary>)
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().modal).toBeNull()
 act(()=>useGame.getState().frame(0.016))
 expect(useGame.getState().modal).toMatchObject({kind:'scene',id:'welcome'})
 expect(useGame.getState().game.scenes).toEqual(['welcome'])
})


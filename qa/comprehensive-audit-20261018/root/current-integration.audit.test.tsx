import React from 'react'
import {writeFileSync} from 'node:fs'
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react'
import {CONTENT} from '../../../src/content/catalog'
import {newGame,heartUp} from '../../../src/engine/game'
import {deserialize,serialize,setActiveSlot,saveGame,exportSave,importSave,loadGame} from '../../../src/engine/save'
import {useGame} from '../../../src/store/game-store'
import {ScreenBoundary} from '../../../src/features/ScreenBoundary'

beforeEach(()=>{localStorage.clear();setActiveSlot('1');useGame.getState().load({...newGame(CONTENT),scenes:[]});vi.spyOn(console,'error').mockImplementation(()=>{})})
afterEach(()=>{cleanup();vi.restoreAllMocks()})

it('current control: import uses a new slot and preserves source state',()=>{
 const original={...newGame(CONTENT,{look:'f',name:'감사 원본'}),coins:123,scenes:[]}
 expect(saveGame(original)).toBe(true)
 expect(importSave(exportSave({...original,coins:789}),CONTENT)).toMatchObject({slot:'2'})
 expect(loadGame(CONTENT)?.coins).toBe(789)
 expect(loadGame(CONTENT,undefined,'1')?.coins).toBe(123)
})

it('current fix: malformed coin and heart strings are normalized before arithmetic',()=>{
 const data=JSON.parse(serialize(newGame(CONTENT)))
 data.coins='50'; data.hearts.baker='50'
 const loaded=deserialize(JSON.stringify(data),CONTENT)!
 expect(loaded).not.toBeNull();expect(loaded.coins).toBe(0)
 expect(loaded.hearts.baker).toBeUndefined()
 expect(heartUp(loaded,'baker',1).hearts.baker).toBe(1)
})

it('current fix: failed mandatory scene can be skipped and does not reopen',()=>{
 useGame.getState().load({...newGame(CONTENT),scenes:['welcome']})
 act(()=>useGame.getState().frame(0.016))
 const Broken=():React.JSX.Element=>{throw new Error('audit injected render failure')}
 render(<ScreenBoundary><Broken/></ScreenBoundary>)
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 act(()=>useGame.getState().frame(0.016))
 expect(useGame.getState().game.scenes).not.toContain('welcome')
 expect(useGame.getState().modal).not.toEqual(expect.objectContaining({kind:'scene',id:'welcome'}))
})

it('creates a synthetic browser import fixture without any user data',()=>{
 const game={...newGame(CONTENT,{look:'m',name:'가져오기검증'}),clock:{day:7,minute:600},coins:789,scenes:[]}
 const text=exportSave(game)
 expect(deserialize(JSON.parse(text).save,CONTENT)?.avatar?.name).toBe('가져오기검증')
 writeFileSync('qa/comprehensive-audit-20261018/root/browser-import.json',text)
})

import {afterEach,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render} from '@testing-library/react'
import {Settings} from '../../../src/features/play/Settings'
import {newGame} from '../../../src/engine/game'
import {CONTENT} from '../../../src/content/catalog'
import {useGame} from '../../../src/store/game-store'
import * as save from '../../../src/engine/save'
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})
it('rejects the import/reset race candidate: the confirmation action and run latch block erase while another record operation is pending',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false}))
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{readText:vi.fn().mockResolvedValue('audit dummy, never imported')}})
 let release!:(value:boolean)=>void
 const deferred=new Promise<boolean>(resolve=>{release=resolve})
 vi.spyOn(save,'saveGameAsync').mockReturnValue(deferred)
 const erase=vi.spyOn(save,'eraseSaveAsync').mockResolvedValue(false),importing=vi.spyOn(save,'importSaveAsync').mockResolvedValue({error:'format'})
 useGame.setState({game:newGame(CONTENT),modal:{kind:'settings'}})
 const view=render(<Settings/>);fireEvent.click(view.getByRole('tab',{name:'기록'}))
 await act(async()=>fireEvent.click(view.getByText('붙여넣기')))
 expect(view.getByRole('dialog').getAttribute('aria-busy')).toBe('true')
 expect(view.getByText('처음부터')).not.toBeDisabled();fireEvent.click(view.getByText('처음부터'))
 const confirm=view.getByText('모두 지우기');expect(confirm).toBeDisabled();fireEvent.click(confirm);expect(erase).not.toHaveBeenCalled()
 await act(async()=>release(false))
 expect(importing).not.toHaveBeenCalled();expect(erase).not.toHaveBeenCalled();expect(view.getByText('모두 지우기')).not.toBeDisabled()
 console.log('ROUND2_SETTINGS_BUSY',JSON.stringify({resetOpenerEnabled:true,confirmationDisabled:true,eraseCallsDuringBusy:0,importCallsAfterFailedSave:0}))
})

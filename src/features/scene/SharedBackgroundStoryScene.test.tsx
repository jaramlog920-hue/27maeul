import {useContext,useEffect} from 'react'
import {act,fireEvent,render,screen} from '@testing-library/react'
import {CONTENT} from '../../content/catalog'
import {SCENES} from '../../content/text'
import {legacyGame} from '../../engine/growth-test-support'
import {useGame} from '../../store/game-store'
import {SHARED_BACKGROUND_DRAFT_IDS} from '../../render/shared-background-draft-art'
import * as shared from '../../render/shared-background-scene'
import * as authored from '../../render/authored-story-art'
import {AuthoredStoryScene,StoryArtBeat} from './AuthoredStoryScene'
import {EventThumbnail} from './EventThumbnail'
import {SharedBackgroundStoryScene} from './SharedBackgroundStoryScene'
import {sharedBackgroundPreviewState} from '../../render/shared-background-preview'

let frames:FrameRequestCallback[]
beforeEach(()=>{
 localStorage.clear();frames=[]
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn()} as unknown as CanvasRenderingContext2D)
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(window,'cancelAnimationFrame').mockImplementation(()=>{})
 vi.stubGlobal('matchMedia',vi.fn(()=>({matches:true} as MediaQueryList)))
 vi.spyOn(shared,'drawSharedBackgroundScene').mockReturnValue(true)
 vi.spyOn(authored,'drawAuthoredStory').mockImplementation(()=>{})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,unused')
 useGame.setState({game:legacyGame(CONTENT),dateArtOrigin:null})
})
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals()})
const flush=()=>act(()=>{frames.splice(0).forEach(cb=>cb(performance.now()+1000))})

it.each(SHARED_BACKGROUND_DRAFT_IDS)('%s passes the exact same detached snapshot to live, preview and thumbnail without writes',id=>{
 const game=useGame.getState().game,before=JSON.stringify(game),scene=shared.sharedBackgroundSceneSnapshot(game,id)!,snapshotBefore=JSON.stringify(scene)
 const beat=Math.max(0,SCENES[id].lines.length-1)
 const live=render(<AuthoredStoryScene id={id} title={SCENES[id].title} beat={beat} sharedScene={scene}><p>대사</p></AuthoredStoryScene>)
 flush()
 expect(shared.drawSharedBackgroundScene).toHaveBeenLastCalledWith(expect.anything(),scene,320,180,8,beat)
 live.unmount()
 const preview=render(<AuthoredStoryScene id={id} title={SCENES[id].title} preview sharedScene={scene}><p>미리보기</p></AuthoredStoryScene>)
 flush()
 expect(shared.drawSharedBackgroundScene).toHaveBeenLastCalledWith(expect.anything(),scene,320,180,8,0)
 preview.unmount()
 const automatic=render(<AuthoredStoryScene id={id} title={SCENES[id].title} beat={beat} readOnly><p>실제 자동 연결</p></AuthoredStoryScene>)
 flush()
 expect(shared.drawSharedBackgroundScene).toHaveBeenLastCalledWith(expect.anything(),scene,320,180,8,beat)
 automatic.unmount()
 const expectedPreview=shared.sharedBackgroundSceneSnapshot(sharedBackgroundPreviewState(id),id,{preview:true})!
 const automaticPreview=render(<AuthoredStoryScene id={id} title={SCENES[id].title} preview><p>기본 미리보기</p></AuthoredStoryScene>)
 flush()
 expect(shared.drawSharedBackgroundScene).toHaveBeenLastCalledWith(expect.anything(),expectedPreview,320,180,8,0)
 automaticPreview.unmount()
 render(<EventThumbnail entry={{id,title:SCENES[id].title,caption:'',kind:null,category:'검토',fresh:false}} sharedScene={scene}/>)
 expect(shared.drawSharedBackgroundScene).toHaveBeenLastCalledWith(expect.anything(),scene,300,170,8,beat)
 expect(authored.drawAuthoredStory).not.toHaveBeenCalled()
 expect(JSON.stringify(scene)).toBe(snapshotBefore);expect(useGame.getState().game).toBe(game);expect(JSON.stringify(game)).toBe(before)
 expect(localStorage.length).toBe(0);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
 expect(authored.hasAuthoredStory(id)).toBe(true)
})

function Page({at}:{at:number}){
 const setBeat=useContext(StoryArtBeat)
 useEffect(()=>setBeat(at),[at,setBeat])
 return <p>대사 {at}</p>
}
it('forwards every original preview page instead of clamping shared scene dialogue to a legacy phase',()=>{
 const id='done:baker:2',scene=shared.sharedBackgroundSceneSnapshot(useGame.getState().game,id)!
 const view=render(<AuthoredStoryScene id={id} title="부탁" preview sharedScene={scene}><Page at={0}/></AuthoredStoryScene>)
 flush()
 view.rerender(<AuthoredStoryScene id={id} title="부탁" preview sharedScene={scene}><Page at={1}/></AuthoredStoryScene>)
 flush()
 expect(screen.getByText('대사 1')).toBeInTheDocument()
 expect(shared.drawSharedBackgroundScene).toHaveBeenLastCalledWith(expect.anything(),scene,320,180,8,1)
})
it('repaints the reduced-motion phone at its actual ratio and cleans up the canvas lifecycle',()=>{
 let height=693
 vi.spyOn(HTMLCanvasElement.prototype,'getBoundingClientRect').mockImplementation(()=>({width:320,height}) as DOMRect)
 const scene=shared.sharedBackgroundSceneSnapshot(useGame.getState().game,'firstChapter')!
 const view=render(<SharedBackgroundStoryScene scene={scene} title="첫 장"><p>대사</p></SharedBackgroundStoryScene>)
 flush()
 expect(shared.drawSharedBackgroundScene).toHaveBeenLastCalledWith(expect.anything(),scene,320,693,8,0)
 height=180;fireEvent(window,new Event('resize'))
 expect(shared.drawSharedBackgroundScene).toHaveBeenLastCalledWith(expect.anything(),scene,320,180,8,0)
 view.unmount()
 const count=vi.mocked(shared.drawSharedBackgroundScene).mock.calls.length
 fireEvent(window,new Event('resize'))
 expect(shared.drawSharedBackgroundScene).toHaveBeenCalledTimes(count)
 expect(window.cancelAnimationFrame).toHaveBeenCalled()
})
it('keeps motion time and the requested dialogue stage on the same snapshot',()=>{
 vi.spyOn(performance,'now').mockReturnValue(0)
 vi.mocked(window.matchMedia).mockReturnValue({matches:false} as MediaQueryList)
 const scene=shared.sharedBackgroundSceneSnapshot(useGame.getState().game,'firstChapter')!
 const view=render(<SharedBackgroundStoryScene scene={scene} title="첫 장" beat={2}><p>대사</p></SharedBackgroundStoryScene>)
 act(()=>frames.shift()!(600))
 expect(shared.drawSharedBackgroundScene).toHaveBeenLastCalledWith(expect.anything(),scene,320,180,.6,2)
 view.unmount()
})
it('cleans up the original canvas when switching to a shared snapshot and back',()=>{
 const scene=shared.sharedBackgroundSceneSnapshot(useGame.getState().game,'firstChapter')!
 const view=render(<AuthoredStoryScene id="bookBound" title="책 완성"><p>원문</p></AuthoredStoryScene>)
 flush()
 expect(authored.drawAuthoredStory).toHaveBeenCalled()
 vi.mocked(authored.drawAuthoredStory).mockClear()
 view.rerender(<AuthoredStoryScene id="firstChapter" title="첫 장" sharedScene={scene}><p>원문</p></AuthoredStoryScene>)
 flush()
 expect(authored.drawAuthoredStory).not.toHaveBeenCalled()
 expect(shared.drawSharedBackgroundScene).toHaveBeenCalled()
 vi.mocked(shared.drawSharedBackgroundScene).mockClear()
 view.rerender(<AuthoredStoryScene id="bookBound" title="책 완성"><p>원문</p></AuthoredStoryScene>)
 flush()
 expect(authored.drawAuthoredStory).toHaveBeenCalled()
 expect(shared.drawSharedBackgroundScene).not.toHaveBeenCalled()
 expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})
it('captures a live album image only at the final original stage without changing game progress',()=>{
 const id='done:baker:2',game=useGame.getState().game,before=JSON.stringify(game)
 const view=render(<AuthoredStoryScene id={id} title="답례" beat={0}><p>첫 줄</p></AuthoredStoryScene>)
 expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
 view.rerender(<AuthoredStoryScene id={id} title="답례" beat={1}><p>답례 줄</p></AuthoredStoryScene>)
 expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledOnce()
 expect(localStorage.getItem(`twenty-seven/album/${id}`)).toBe('data:image/png;base64,unused')
 expect(JSON.stringify(useGame.getState().game)).toBe(before)
 view.rerender(<AuthoredStoryScene id={id} title="답례" beat={1}><p>같은 줄</p></AuthoredStoryScene>)
 expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledOnce()
})

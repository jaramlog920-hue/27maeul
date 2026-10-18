import {act,render,screen,fireEvent} from '@testing-library/react'
import {AuthoredStoryScene} from './AuthoredStoryScene'
import {EventGallery} from './EventGallery'
import {EventThumbnail} from './EventThumbnail'
import {ModalLayer} from '../ModalLayer'
import {HOME_YARD_EVENT_IDS,homeYardEventPeople} from '../../render/home-yard-events-art'
import {CONTENT} from '../../content/catalog'
import {SCENES} from '../../content/text'
import {legacyGame} from '../../engine/growth-test-support'
import {adopt,STRAY_SPOTS} from '../../engine/companion'
import {useGame} from '../../store/game-store'
import {eventPreviewEntries} from './event-registry'
import * as art from '../../render/authored-story-art'

beforeEach(()=>{
 localStorage.clear()
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn()} as unknown as CanvasRenderingContext2D)
 useGame.setState({game:legacyGame(CONTENT),modal:null,piecePopups:[],copyResult:null,afterScene:null})
})
afterEach(()=>vi.restoreAllMocks())

it.each(HOME_YARD_EVENT_IDS)('%s uses the registered renderer through the real dialogue flow and preserves its original lines',id=>{
 const before={...useGame.getState().game,scenes:[id]},draw=vi.spyOn(art,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 act(()=>useGame.setState({game:before,modal:{kind:'scene',id}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 for(let beat=0;beat<SCENES[id].lines.length;beat++){
  expect(screen.getByText(SCENES[id].lines[beat].text)).toBeInTheDocument()
  act(()=>frames.slice().forEach(cb=>cb(1000+beat*1000)))
  expect(draw.mock.calls.at(-1)?.[8]).toBe(beat)
  expect(useGame.getState().game).toBe(before)
  if(beat<SCENES[id].lines.length-1)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 }
 const unchanged=useGame.getState().game
 expect(unchanged.inv).toEqual(before.inv);expect(unchanged.clock).toEqual(before.clock);expect(unchanged.hearts).toEqual(before.hearts)
})

it.each(['cat','dog'] as const)('passes the saved %s name, other animal and moved rack without mutation or motion-driven restarts',kind=>{
 const initial=useGame.getState().game,companion=adopt(kind,'달콩',2,STRAY_SPOTS[kind]),yard={reedRack:{x:2,y:12}},flags={...initial.flags,childPet:kind==='cat'?2:1,'unlock:reedRack':1},game={...initial,companion,yard,flags}
 const frames:FrameRequestCallback[]=[],draw=vi.spyOn(art,'drawAuthoredStory')
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 act(()=>useGame.setState({game}))
 render(<AuthoredStoryScene id="companionJoined" title="새 식구" beat={1}><p>원문</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)?.[13]).toMatchObject({mode:'game',companion:{kind,name:'달콩'},childPet:kind==='cat'?'dog':'cat',reedRack:{x:2,y:12},rackPlaced:true})
 expect(draw.mock.calls.at(-1)?.[6]).toMatchObject({id:'child'})
 expect(useGame.getState().game).toBe(game)
 const scheduled=frames.length
 act(()=>useGame.setState({game:{...game,companion:{...companion,x:companion.x+1}}}))
 expect(frames).toHaveLength(scheduled)
 expect(yard.reedRack).toEqual({x:2,y:12});expect(companion.name).toBe('달콩')
})

it.each(HOME_YARD_EVENT_IDS)('%s preview and thumbnail share the renderer without saving or changing the album',id=>{
 const before=useGame.getState().game,draw=vi.spyOn(art,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,unused')
 render(<AuthoredStoryScene id={id} title={SCENES[id].title} preview><p>미리보기</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)?.[13]).toMatchObject({mode:'preview'})
 render(<EventThumbnail entry={eventPreviewEntries().find(e=>e.id===id)!}/>)
 expect(useGame.getState().game).toBe(before);expect(localStorage.length).toBe(0);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
 expect(homeYardEventPeople('companionJoined')).toEqual(['child'])
})

it('collects the entire four-event yard group in one preview filter',()=>{
 render(<EventGallery/>)
 fireEvent.click(screen.getByRole('button',{name:'새 마당'}))
 for(const id of HOME_YARD_EVENT_IDS)expect(screen.getByRole('link',{name:new RegExp(SCENES[id].title)})).toHaveAttribute('href',`play.html?event=${encodeURIComponent(id)}`)
 expect(screen.getAllByRole('link').filter(l=>l.getAttribute('href')?.includes('play.html?event=')&&!l.getAttribute('href')?.includes('sequence='))).toHaveLength(4)
})

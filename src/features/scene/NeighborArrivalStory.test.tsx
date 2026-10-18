import {act,render,screen,fireEvent} from '@testing-library/react'
import {AuthoredStoryScene} from './AuthoredStoryScene'
import {EventGallery} from './EventGallery'
import {EventThumbnail} from './EventThumbnail'
import {ModalLayer} from '../ModalLayer'
import {NEIGHBOR_ARRIVAL_IDS} from '../../render/neighbor-arrival-art'
import {CONTENT} from '../../content/catalog'
import {SCENES} from '../../content/text'
import {legacyGame} from '../../engine/growth-test-support'
import {useGame} from '../../store/game-store'
import {eventPreviewEntries} from './event-registry'
import * as art from '../../render/authored-story-art'

beforeEach(()=>{
 localStorage.clear()
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn()} as unknown as CanvasRenderingContext2D)
 useGame.setState({game:legacyGame(CONTENT),modal:null,piecePopups:[],copyResult:null,afterScene:null})
})
afterEach(()=>vi.restoreAllMocks())

it.each(NEIGHBOR_ARRIVAL_IDS)('%s uses the registered renderer through the real dialogue flow and preserves its original lines',id=>{
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


it.each(NEIGHBOR_ARRIVAL_IDS)('%s preview and thumbnail never mutate save or album',id=>{
 const before=useGame.getState().game,frames:FrameRequestCallback[]=[];vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length});vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,unused');render(<AuthoredStoryScene id={id} title={SCENES[id].title} preview><p>미리보기</p></AuthoredStoryScene>);act(()=>frames.slice().forEach(cb=>cb(1000)));render(<EventThumbnail entry={eventPreviewEntries().find(e=>e.id===id)!}/>);expect(useGame.getState().game).toBe(before);expect(localStorage.length).toBe(0);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
});
it('shows the whole shared background batch together',()=>{window.history.replaceState({},'', '?background=neighbor-arrivals');render(<EventGallery/>);expect(screen.getByText('3개 이벤트 · 도트 모션 3개')).toBeInTheDocument()});

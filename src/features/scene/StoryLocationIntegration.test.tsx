import * as shared from '../../render/shared-background-scene'
import {act,render} from '@testing-library/react'
import {AuthoredStoryScene} from './AuthoredStoryScene'
import {EventThumbnail} from './EventThumbnail'
import {eventPreviewEntries} from './event-registry'
import {storyLocationContext} from '../../render/story-location-context'
import {CONTENT} from '../../content/catalog'
import {legacyGame} from '../../engine/growth-test-support'
import {useGame} from '../../store/game-store'
import {INTERIOR_ENTRY} from '../../engine/newland-config'
import {currentMapId} from '../../engine/maps'
import * as art from '../../render/authored-story-art'
import {NO_ROMANCE} from '../../engine/romance'
import {serialize} from '../../engine/save'

beforeEach(()=>{
 localStorage.clear()
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn()} as unknown as CanvasRenderingContext2D)
 useGame.setState({game:legacyGame(CONTENT),dateArtOrigin:null,modal:null,piecePopups:[],copyResult:null,afterScene:null})
})

it.each(['tea','walk'] as const)('captures %s in UI metadata after the real date and keeps it out of game saves',place=>{
 const initial=useGame.getState().game,flags:Record<string,number>={...initial.flags,villageLevel:99}
 for(const n of CONTENT.neighbors)flags[`movedIn:${n.id}`]=1
 const game={...initial,scenes:[],coins:50,flags,romance:{...NO_ROMANCE,partner:'wendell',stage:'dating' as const,since:1},hearts:{...initial.hearts,wendell:1},clock:{day:2,minute:740}}
 act(()=>useGame.setState({game}))
 act(()=>useGame.getState().goDate(place))
 const after=useGame.getState()
 expect(after.game).not.toBe(game)
 expect(after.dateArtOrigin).toMatchObject({place,partner:'wendell',day:2,map:'village',at:{x:game.player.x,y:game.player.y},minute:after.game.clock.minute})
 expect(serialize(after.game)).not.toContain('dateArtOrigin')
 act(()=>useGame.getState().load(game))
 expect(useGame.getState().dateArtOrigin).toBeNull()
})

it('retains the captured tea origin after its earlier dialogue leaves the queue',()=>{
 const initial=useGame.getState().game,game={...initial,clock:{day:3,minute:1200},scenes:['loverTrust:wendell']},frames:FrameRequestCallback[]=[],draw=vi.spyOn(shared,'drawSharedBackgroundScene')
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 act(()=>useGame.setState({game,dateArtOrigin:{place:'tea',partner:'wendell',day:3,minute:1180,map:'village',at:{x:5,y:84}}}))
 render(<AuthoredStoryScene id="loverTrust:wendell" title="함께 돌아오던 길"><p>원문</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)?.[1]?.location).toMatchObject({datePlace:'tea',dateSource:'explicit',minute:1180,at:{x:5,y:84}})
 expect(useGame.getState().game).toBe(game)
})
afterEach(()=>vi.restoreAllMocks())

it.each([null,{place:'tea',partner:'wendell',day:2,minute:1180,map:'village',at:{x:5,y:84}},{place:'tea',partner:'rudy',day:3,minute:1180,map:'village',at:{x:5,y:84}}] as const)('does not use restored queue history with invalid return provenance %j',dateArtOrigin=>{
 const initial=useGame.getState().game,game={...initial,clock:{day:3,minute:1200},scenes:['dateTea','loverTrust:wendell']},frames:FrameRequestCallback[]=[],draw=vi.spyOn(shared,'drawSharedBackgroundScene')
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 act(()=>useGame.setState({game,dateArtOrigin}))
 render(<AuthoredStoryScene id="loverTrust:wendell" title="함께 돌아오던 길"><p>원문</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)?.[1]?.location).toMatchObject({at:{x:game.player.x,y:game.player.y},minute:1200,datePlace:null,dateSource:'unavailable'})
 expect(useGame.getState().game).toBe(game);expect(localStorage.length).toBe(0)
})

it('passes the live newland room, position, clock and queued date through the shared game renderer without mutations',()=>{
 const initial=useGame.getState().game,game={...initial,map:'newland' as const,player:{...initial.player,...INTERIOR_ENTRY},clock:{day:123,minute:1300},scenes:['date:tea:1','loverTrust:wendell'],rooms:{'newland:archive':[{item:'jar' as const,x:18,y:33}]}}
 const frames:FrameRequestCallback[]=[],draw=vi.spyOn(art,'drawAuthoredStory'),map=currentMapId()
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 act(()=>useGame.setState({game}))
 render(<AuthoredStoryScene id="movedIn:weaver" title="새 이웃" beat={1}><p>원문</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)?.[14]).toMatchObject({mode:'game',map:'newland',at:INTERIOR_ENTRY,day:123,minute:1300,indoors:true,room:{kind:'newland-archive'},datePlace:'tea',dateSource:'queue'})
 expect(draw.mock.calls.at(-1)?.[14]?.layout?.furniture).toEqual(game.rooms['newland:archive'])
 expect(draw.mock.calls.at(-1)?.[14]?.layout?.furniture[0]).not.toBe(game.rooms['newland:archive'][0])
 expect(useGame.getState().game).toBe(game);expect(currentMapId()).toBe(map);expect(localStorage.length).toBe(0)
})

it('passes the same explicit preview location to the scene and thumbnail without reading the live game',()=>{
 const before=useGame.getState().game,frames:FrameRequestCallback[]=[],draw=vi.spyOn(art,'drawAuthoredStory')
 const location=storyLocationContext(undefined,{preview:{map:'newland',at:INTERIOR_ENTRY,minute:1250,weather:'snow'}})
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,unused')
 render(<AuthoredStoryScene id="movedIn:weaver" title="새 이웃" preview location={location}><p>원문</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)?.[14]).toEqual(location)
 render(<EventThumbnail entry={eventPreviewEntries().find(e=>e.id==='movedIn:weaver')!} location={location}/>)
 expect(draw.mock.calls.at(-1)?.[14]).toEqual(location)
 expect(useGame.getState().game).toBe(before);expect(localStorage.length).toBe(0);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})

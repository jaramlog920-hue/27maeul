import {SHOP_REMAINDER_IDS,shopRemainderPeople} from '../../render/shop-remainder-art'
import {TRAVEL_EVENT_IDS,travelEventPeople} from '../../render/travel-events-art'
import {LIBRARY_EVENT_IDS,libraryEventPeople} from '../../render/library-events-art'
import {POSTMAN_EVENT_IDS,postmanEventPeople} from '../../render/postman-events-art'
import {HILL_EVENT_IDS,hillEventPeople,isHillFamilyKid,isHillDate} from '../../render/hill-events-art'
import {hallGuestsToday} from '../../engine/game'
import {HALL_EVENT_IDS,hallEventPeople} from '../../render/hall-events-art'
import {SQUARE_EVENT_IDS,isSquareFamilyKid,squareEventPeople} from '../../render/square-events-art'
const SQUARE_NPC_IDS=SQUARE_EVENT_IDS.filter(id=>!isSquareFamilyKid(id)&&squareEventPeople(id).length>0)
import {SHEEP_EVENT_IDS,sheepEventPeople} from '../../render/sheep-events-art'
import {VINE_EVENT_IDS,vineEventPeople} from '../../render/vine-events-art'
import {OIL_EVENT_IDS,oilEventPeople} from '../../render/oil-events-art'
import {WOOD_EVENT_IDS,woodEventPeople} from '../../render/wood-events-art'
import {HERB_EVENT_IDS,herbEventPeople} from '../../render/herb-events-art'
import {BEE_EVENT_IDS,beeEventPeople} from '../../render/bee-events-art'
import {SHORE_EVENT_IDS,shoreEventPeople} from '../../render/shore-events-art'
import {WEAVER_EVENT_IDS,weaverEventPeople} from '../../render/weaver-events-art'
import {SMITH_EVENT_IDS,smithEventPeople} from '../../render/smith-events-art'
import {TEA_EVENT_IDS,teaEventPeople} from '../../render/tea-events-art'
import {BAKERY_EVENT_IDS,bakeryEventPeople} from '../../render/bakery-events-art'
import {HOME_ROOM_IDS,HOME_ROOM_ACTIVITY_IDS,isHomeRoomKid} from '../../render/home-family-art'
import {NO_LIFE,recordExperience} from '../../engine/people'
import {act,fireEvent,render,screen} from '@testing-library/react'
import {freshStats} from '../../engine/stats'
import {CONTENT} from '../../content/catalog'
import {SCENES,T} from '../../content/text'
import {legacyGame} from '../../engine/growth-test-support'
import {useGame,albumImage,storeAlbumImage} from '../../store/game-store'
import {ModalLayer} from '../ModalLayer'
import {AuthoredStoryScene} from './AuthoredStoryScene'
import {eventPreviewEntries} from './event-registry'
import {TIMED_GATHERINGS,gatheringPhoto} from '../../render/timed-gathering-art'
import {drawWorriedApothecary} from '../../render/worried-apothecary-art'
import * as authoredArt from '../../render/authored-story-art'
import {START,isIndoor} from '../../engine/world'
import {isWet,weatherOf} from '../../engine/calendar'

const id='ev:wendell:home:2'
beforeEach(()=>{
 localStorage.clear()
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn()} as unknown as CanvasRenderingContext2D)
 const game=legacyGame(CONTENT)
 useGame.setState({game:{...game,scenes:[id],romance:{...game.romance,partner:'wendell',stage:'married'}},modal:{kind:'scene',id},piecePopups:[],copyResult:null,afterScene:null})
})
afterEach(()=>vi.restoreAllMocks())
it.each([['dexter',false],['dexter',true],['rudy',false],['rudy',true],['postman',false],['postman',true],['marigold',false],['marigold',true],['basil',false],['basil',true],['merchant',false],['merchant',true],['presser',false],['presser',true],['poppy',false],['poppy',true],['juniper',false],['juniper',true],['cosmo',false],['cosmo',true],['tilly',false],['tilly',true],['wendell',false],['wendell',true],['penelope',false],['penelope',true]] as const)('%s에게 건넨 끈은 실제 실내 여부(%s)·시간·외형을 반영하고 약혼과 소지품을 바꾸지 않는다',(candidate,indoors)=>{
 const event=`propose:${candidate}`,s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const player={...s.player,...(indoors?START:candidate==='rudy'?{x:19,y:15}:candidate==='postman'?{x:22,y:8}:candidate==='marigold'?{x:38,y:10}:candidate==='basil'?{x:34,y:32}:candidate==='merchant'?{x:21,y:14}:candidate==='presser'?{x:43,y:25}:candidate==='poppy'?{x:20,y:32}:candidate==='juniper'?{x:43,y:26}:candidate==='cosmo'?{x:30,y:32}:candidate==='tilly'?{x:28,y:15}:candidate==='wendell'?{x:1,y:17}:candidate==='penelope'?{x:39,y:24}:{x:3,y:29})},clock={day:50,minute:indoors?1200:900},romance={...s.romance,partner:candidate,stage:'engaged' as const,weddingDay:55},inv={...s.inv,promiseCord:0},looks={...s.looks,[candidate]:{name:'약속한 이웃',look:'m' as const,top:4}}
 expect(isIndoor(player)).toBe(indoors)
 act(()=>useGame.setState({game:{...s,player,clock,romance,inv,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'약속의 끈'})).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(frame=>frame(1000)))
 expect(draw.mock.calls.at(-1)?.[6]).toMatchObject({avatar:{name:'약속한 이웃',top:4}})
 expect(draw.mock.calls.at(-1)?.[10]).toEqual({minute:clock.minute,indoors,wet:isWet(weatherOf(clock.day)),snow:weatherOf(clock.day)==='snow',at:{x:player.x,y:player.y}})
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 expect(screen.getByText(SCENES[event].lines[1].text.replace('{player}',s.avatar?.name??'필사가'))).toBeInTheDocument()
 act(()=>frames.slice().forEach(frame=>frame(1200)))
 expect(draw.mock.calls.at(-1)?.[8]).toBe(1)
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 const after=useGame.getState().game
 expect(after.romance).toEqual(romance);expect(after.inv).toEqual(inv)
 expect(after.clock).toEqual(clock);expect(after.hearts).toEqual(s.hearts)
 expect(after.album).toEqual(s.album);expect(after.looks).toEqual(looks)
})
it.each(['dexter','rudy','postman','marigold','basil','merchant','presser','poppy','juniper','cosmo','tilly','wendell','penelope'])('%s 약속의 끈 미리보기는 저장·약혼·앨범을 바꾸지 않는다',candidate=>{
 const before=useGame.getState().game
 render(<AuthoredStoryScene id={`propose:${candidate}`} title="약속의 끈" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(before);expect(localStorage.length).toBe(0)
})
it.each(['dexter','rudy','postman','marigold','basil','merchant','presser','poppy','juniper','cosmo','tilly','wendell','penelope'])('%s 결혼 잔치는 실제 배우자·이사 온 손님만 그리며 원래 결혼 상태와 앨범을 보존한다',candidate=>{
 const event=`wedding:${candidate}`,name=candidate==='dexter'?'덱스터':candidate==='rudy'?'루디':candidate==='postman'?'마일로':candidate==='marigold'?'메리골드':candidate==='basil'?'바질':candidate==='merchant'?'오스카':candidate==='presser'?'올리버':candidate==='poppy'?'웬델':candidate==='juniper'?'주니퍼':candidate==='cosmo'?'코스모':candidate==='tilly'?'틸리':candidate==='wendell'?'파피':'페넬로피',s=useGame.getState().game,frames:FrameRequestCallback[]=[],draw=vi.spyOn(authoredArt,'drawAuthoredStory')
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,wedding-dexter')
 const romance={...s.romance,partner:candidate,stage:'married' as const,marriedDay:50,weddingDay:null},flags={...s.flags,'movedIn:fisher':0,'movedIn:carpenter':0}
 const looks={...s.looks,grandpa:{name:'잔치의 할아버지',look:'m' as const,top:7},merchant:{name:'잔치의 상인',look:'m' as const,top:8},cosmo:{name:'아직 안 온 코스모',look:'f' as const,top:9},[candidate]:{name,look:'m' as const,top:4}}
 act(()=>useGame.setState({game:{...s,romance,flags,looks,clock:{day:50,minute:1110},scenes:[event]},modal:{kind:'scene',id:event}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'마을 잔치'})).toHaveClass('authored-story-scene')
 expect(screen.getByRole('dialog',{name:'마을 잔치'})).toHaveClass('wedding-ceremony')
 act(()=>frames.slice().forEach(frame=>frame(1000)))
 const call=draw.mock.calls.at(-1)!
 expect(call[6]).toMatchObject({avatar:{name,top:4}})
 expect(call[7]?.some(a=>a.avatar?.name==='잔치의 상인')).toBe(candidate!=='merchant')
 if(candidate==='marigold')expect(call[7]?.find(a=>'id' in a&&a.id==='grandpa')).toMatchObject({avatar:{name:'잔치의 할아버지',top:7}})
 expect(call[7]?.some(a=>a.avatar?.name==='아직 안 온 코스모')).toBe(false)
 expect(draw.mock.calls.some(c=>c[1]===event&&c[8]===SCENES[event].lines.length-1)).toBe(true)
 for(let i=1;i<SCENES[event].lines.length;i++){
  fireEvent.click(screen.getByRole('button',{name:'다음'}))
  expect(screen.getByText(SCENES[event].lines[i].text)).toBeInTheDocument()
 }
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 const after=useGame.getState().game
 expect(after.romance).toEqual(romance);expect(after.flags).toEqual(flags)
 expect(after.looks).toEqual(looks);expect(after.clock).toEqual({day:50,minute:1110})
 expect(after.inv).toEqual(s.inv);expect(after.hearts).toEqual(s.hearts)
 expect(after.album.filter(a=>a.id===event)).toHaveLength(1)
 localStorage.setItem(`twenty-seven/album/${event}`,'data:image/png;base64,original')
 act(()=>useGame.setState({modal:{kind:'scene',id:event}}))
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(localStorage.getItem(`twenty-seven/album/${event}`)).toBe('data:image/png;base64,original')
 expect(useGame.getState().game.album.filter(a=>a.id===event)).toHaveLength(1)
})
it.each(['dexter','rudy','postman','marigold','basil','merchant','presser','poppy','juniper','cosmo','tilly','wendell','penelope'])('%s 결혼 잔치 미리보기는 결혼·저장·앨범을 바꾸지 않는다',candidate=>{
 const before=useGame.getState().game
 render(<AuthoredStoryScene id={`wedding:${candidate}`} title="마을 잔치" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(before);expect(localStorage.length).toBe(0)
})
it('휴대폰 표시 영역에 맞추고 창 비율과 달라도 도트의 가로·세로 배율을 유지한다',()=>{
 const frames:FrameRequestCallback[]=[],draw=vi.spyOn(authoredArt,'drawAuthoredStory')
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 let bounds={width:390,height:844}
 vi.spyOn(HTMLCanvasElement.prototype,'getBoundingClientRect').mockImplementation(()=>({...bounds,x:0,y:0,left:0,top:0,right:bounds.width,bottom:bounds.height,toJSON:()=>bounds}))
 const {container}=render(<AuthoredStoryScene id="siblingBorn" title="또 한 식구" preview><p>미리보기</p></AuthoredStoryScene>)
 const canvas=container.querySelector('canvas')!
 act(()=>frames.slice().forEach(frame=>frame(1000)))
 expect(canvas.width).toBe(320);expect(canvas.height).toBe(693)
 expect(Math.abs(bounds.width/canvas.width-bounds.height/canvas.height)).toBeLessThan(.002)
 expect(draw.mock.calls.at(-1)!.slice(2,4)).toEqual([320,693])
 bounds={width:844,height:390}
 // resize 이벤트가 누락되어도 실제 그리는 프레임에서 새 영역으로 바로 맞춘다.
 act(()=>frames.slice().forEach(frame=>frame(1200)))
 expect(canvas.height).toBe(180)
 expect(draw.mock.calls.at(-1)!.slice(2,4)).toEqual([320,180])
})
it('새 식구는 실제 배우자·아이 모습과 세 대사를 유지하며 요람 컷을 저장하고 재생으로 덮어쓰지 않는다',()=>{
 const event='childBorn',s=useGame.getState().game,frames:FrameRequestCallback[]=[],draw=vi.spyOn(authoredArt,'drawAuthoredStory')
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,newborn-cradle')
 const child={name:'보리',look:'boy' as const,born:50,stats:freshStats(),lean:null,close:0},flags={...s.flags,babyWish:46,babyNews:46}
 const looks={...s.looks,child:{name:'보리',look:'m' as const,top:6},postman:{name:'마일로',look:'m' as const,top:4}},romance={...s.romance,partner:'postman',stage:'married' as const}
 act(()=>useGame.setState({game:{...s,avatar:{name:'기록자',look:'m',skin:3},child,flags,looks,romance,clock:{day:50,minute:480},scenes:[event]},modal:{kind:'scene',id:event}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'새 식구'})).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(frame=>frame(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{top:4},who:'writer'})
 expect(draw.mock.calls.at(-1)![7]).toMatchObject([{avatar:{name:'보리',look:'m',skin:3,top:6}}])
 expect(draw.mock.calls.some(call=>call[1]===event&&call[8]===2)).toBe(true)
 expect(localStorage.getItem('twenty-seven/album/childBorn')).toBe('data:image/png;base64,newborn-cradle')
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 expect(screen.getByText(SCENES[event].lines[2].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 const after=useGame.getState().game
 expect(after.child).toEqual(child);expect(after.flags).toEqual(flags)
 expect(after.looks).toEqual(looks);expect(after.romance).toEqual(romance)
 expect(after.clock).toEqual({day:50,minute:480});expect(after.inv).toEqual(s.inv)
 expect(after.album.some(a=>a.id===event)).toBe(true)
 localStorage.setItem('twenty-seven/album/childBorn','data:image/png;base64,original')
 act(()=>useGame.setState({modal:{kind:'scene',id:event}}))
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(localStorage.getItem('twenty-seven/album/childBorn')).toBe('data:image/png;base64,original')
 expect(useGame.getState().game.album.filter(a=>a.id===event)).toHaveLength(1)
})
it('새 식구 앨범을 다시 봐도 선택 중인 막내 대신 실제 첫 아이를 그린다',()=>{
 const s=useGame.getState().game,frames:FrameRequestCallback[]=[],draw=vi.spyOn(authoredArt,'drawAuthoredStory')
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,newborn')
 const firstborn={name:'누리',look:'girl' as const,born:1,stats:freshStats(),lean:null,wardrobe:{name:'누리',look:'f',top:7}},youngest={name:'보리',look:'boy' as const,born:50,stats:freshStats(),lean:null}
 act(()=>useGame.setState({game:{...s,child:youngest,siblings:[firstborn],clock:{day:50,minute:480},looks:{child:{name:'보리',look:'m',top:2}}},modal:null}))
 render(<AuthoredStoryScene id="childBorn" title="새 식구"><p>재생</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(frame=>frame(1000)))
 expect(draw.mock.calls.at(-1)![7]).toMatchObject([{avatar:{name:'누리',look:'f',top:7}}])
 expect(useGame.getState().game.child).toEqual(youngest)
 expect(useGame.getState().game.siblings).toEqual([firstborn])
})
it('새 식구 미리보기는 가족·저장·앨범을 바꾸지 않는다',()=>{
 const before=useGame.getState().game
 render(<AuthoredStoryScene id="childBorn" title="새 식구" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(before);expect(localStorage.length).toBe(0)
})
it('또 한 식구 미리보기는 가족 데이터와 저장·앨범을 바꾸지 않는다',()=>{
 const before=useGame.getState().game
 render(<AuthoredStoryScene id="siblingBorn" title="또 한 식구" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(before)
 expect(localStorage.length).toBe(0)
})
it.each([false,true])('또 한 식구는 선택 아이가 막내인 경우(%s)에도 출생 순서·옷차림을 보존한다',youngestSelected=>{
 const event='siblingBorn',s=useGame.getState().game,frames:FrameRequestCallback[]=[],draw=vi.spyOn(authoredArt,'drawAuthoredStory')
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const older={name:'누리',look:'girl' as const,born:1,stats:freshStats(),lean:null,close:35,wardrobe:{name:'누리',look:'f',top:7}},baby={name:'보리',look:'boy' as const,born:50,stats:freshStats(),lean:null,close:0}
 const child=youngestSelected?baby:older,siblings=youngestSelected?[older]:[baby]
 const looks={...s.looks,child:{name:child.name,look:youngestSelected?'m' as const:'f' as const,top:youngestSelected?1:7},postman:{name:'마일로',look:'m' as const,top:4}}
 const romance={...s.romance,partner:'postman',stage:'married' as const}
 act(()=>useGame.setState({game:{...s,avatar:{name:'기록자',look:'m',skin:3},child,siblings,looks,romance,clock:{day:50,minute:480},scenes:[event]},modal:{kind:'scene',id:event}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'또 한 식구'})).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(frame=>frame(1000)))
 const call=draw.mock.calls.at(-1)!
 expect(call[6]).toMatchObject({avatar:{top:4},who:'writer'})
 expect(call[7]).toMatchObject([{avatar:{name:'누리',top:7,skin:3}},{avatar:{name:'보리',look:'m',skin:3},baby:true}])
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 expect(screen.getByText(SCENES[event].lines[1].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 const after=useGame.getState().game
 expect(after.child).toEqual(child);expect(after.siblings).toEqual(siblings)
 expect(after.looks).toEqual(looks);expect(after.romance).toEqual(romance)
 expect(after.clock).toEqual({day:50,minute:480});expect(after.inv).toEqual(s.inv)
 expect(localStorage.getItem('twenty-seven/album/siblingBorn')).toBeNull()
})
it('아기 소식 장면은 실제 배우자의 옷차림을 쓰고 가족·출산 날짜·보상을 바꾸지 않는다',()=>{
 const event='pregnancy',s=useGame.getState().game,frames:FrameRequestCallback[]=[],draw=vi.spyOn(authoredArt,'drawAuthoredStory')
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,pregnancy-empty-cradle')
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const romance={...s.romance,partner:'postman',stage:'married' as const},flags={...s.flags,babyWish:50,babyNews:50}
 act(()=>useGame.setState({game:{...s,romance,flags,looks:{...s.looks,postman:{name:'마일로',look:'m',top:4,hairColor:[28,40,35]}},scenes:[event]},modal:{kind:'scene',id:event}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'기다리는 아기'})).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(frame=>frame(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({who:'writer',avatar:{top:4,hairColor:[28,40,35]}})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 const after=useGame.getState().game
 expect(after.romance).toEqual(romance)
 expect(after.flags.babyWish).toBe(50)
 expect(after.flags.babyNews).toBe(50)
 expect(after.child).toEqual(s.child)
 expect(after.inv).toEqual(s.inv)
 expect(after.clock).toEqual(s.clock)
 expect(localStorage.getItem('twenty-seven/album/pregnancy')).toBe('data:image/png;base64,pregnancy-empty-cradle')
 expect(after.album.some(a=>a.id==='pregnancy')).toBe(true)
})
it('27권 잔치의 새 그림에서도 음식 나누기는 한 번만 소비하고 기존 흐름을 끝낸다',()=>{
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,feast')
 const initial=useGame.getState().game,event='allFeastFire'
 act(()=>useGame.setState({game:{...initial,inv:{bread:2},scenes:[event],flags:{...initial.flags,allFeast:1}},modal:{kind:'scene',id:event}}))
 render(<ModalLayer/>)
 for(let i=0;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 fireEvent.click(screen.getByRole('button',{name:T.items.bread.name}))
 expect(useGame.getState().game.inv.bread).toBe(1)
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 expect(useGame.getState().game.inv.bread).toBe(1)
 expect(useGame.getState().game.scenes).not.toContain(event)
})
it.each(Object.keys(TIMED_GATHERINGS))('시간에 맞춰 참석하는 %s는 원래 대사·앨범 대상·보상을 유지한다',event=>{
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,gathering')
 const initial=useGame.getState().game,s=event==='feastFire'||event==='allFeastFire'?{...initial,inv:{}}:initial,scene=SCENES[event],photo=gatheringPhoto(event)
 act(()=>useGame.setState({game:{...s,scenes:[event]},modal:{kind:'scene',id:event}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:scene.title})).toHaveClass('authored-story-scene')
 for(let i=1;i<scene.lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 expect(screen.getByText(scene.lines.at(-1)!.text)).toBeInTheDocument()
 if(event==='feastFire'||event==='allFeastFire'){
  fireEvent.click(screen.getByRole('button',{name:'다음'}))
  fireEvent.click(screen.getByRole('button',{name:'다음'}))
 }else fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().game.scenes).not.toContain(event)
 expect(useGame.getState().game.inv).toEqual(s.inv)
 expect(useGame.getState().game.hearts).toEqual(s.hearts)
 expect(useGame.getState().game.clock).toEqual(s.clock)
 expect(useGame.getState().game.romance).toEqual(s.romance)
 expect(localStorage.getItem(`twenty-seven/album/${photo}`)).toBe('data:image/png;base64,gathering')
 localStorage.setItem(`twenty-seven/album/${photo}`,'data:image/png;base64,original')
 act(()=>useGame.setState({modal:{kind:'scene',id:event}}))
 expect(localStorage.getItem(`twenty-seven/album/${photo}`)).toBe('data:image/png;base64,original')
})
it.each([0,1])('빵집의 개별 도트 장면에서도 기존 선택 %s와 답변을 그대로 이어간다',index=>{
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'가게 닫는 날'})).toHaveClass('authored-story-scene')
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 const choice=SCENES[id].choices![index]
 act(()=>fireEvent.click(screen.getByRole('button',{name:choice.label})))
 expect(screen.getByText(choice.reply![0].text)).toBeInTheDocument()
 expect(useGame.getState().game.scenes).toContain(id)
 expect(useGame.getState().game.romance.partner).toBe('wendell')
})
it('개별 그림의 미리보기는 진행과 앨범을 저장하지 않는다',()=>{
 const before=useGame.getState().game
 render(<AuthoredStoryScene id={id} title="가게 닫는 날" preview><p>미리보기 대사</p></AuthoredStoryScene>)
 expect(localStorage.length).toBe(0)
 expect(useGame.getState().game).toBe(before)
})
it('직접 완성한 장면만 도트 모션으로 표시한다',()=>{
 const entries=eventPreviewEntries()
 expect(entries.find(e=>e.id===id)?.authored).toBe(true)
 expect(entries.find(e=>e.id==='ev:poppy:story:2')?.authored).toBe(true)
 expect(entries.find(e=>e.id==='built:reedRack')?.authored).toBe(true)
 expect(entries.find(e=>e.id==='ev:rudy:small:signPost')?.authored).toBe(true)
 expect(entries.find(e=>e.id==='village:3')?.authored).toBe(true)
 expect(entries.find(e=>e.id==='ev:beekeeper:story:1')?.authored).toBe(true)
 expect(entries.find(e=>e.id==='ev:penelope:lunch')?.authored).toBe(true)
 expect(entries.find(e=>e.id==='fam:read')?.authored).toBe(true)
 expect(entries.find(e=>e.title.startsWith('거꾸로 새긴 글자'))?.authored).toBe(true)
})

it('같이 읽은 책은 실제 아이 이름과 가까움을 보존하고 펼친 책 사진을 남긴다',()=>{
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,family-reading')
 const s=useGame.getState().game,child={name:'누리',look:'boy' as const,born:1,stats:freshStats(),lean:null,close:25}
 act(()=>useGame.setState({game:{...s,child,clock:{day:50,minute:800},scenes:['fam:read']},modal:{kind:'scene',id:'fam:read'}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'같이 읽은 책'})).toHaveClass('authored-story-scene')
 expect(screen.getByText('누리가 옆에 바짝 붙어 앉아 그림을 하나하나 손가락으로 짚었다.')).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 expect(screen.getByText('책을 덮자 누리가 처음부터 다시 읽어 달라고 했다.')).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().game.child?.close).toBe(25)
 expect(useGame.getState().game.child?.stats).toEqual(child.stats)
 expect(useGame.getState().game.inv).toEqual(s.inv)
 expect(localStorage.getItem('twenty-seven/album/fam:read')).toBe('data:image/png;base64,family-reading')
 localStorage.setItem('twenty-seven/album/fam:read','data:image/png;base64,original')
 act(()=>useGame.setState({modal:{kind:'scene',id:'fam:read'}}))
 expect(localStorage.getItem('twenty-seven/album/fam:read')).toBe('data:image/png;base64,original')
})

it.each([0,1])('같은 자리 선택 %s는 원래 답변 수와 상태를 보존한다',index=>{
 const seatId='ev:penelope:lunch',s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,scenes:[seatId]},modal:{kind:'scene',id:seatId}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'같은 자리'})).toHaveClass('authored-story-scene')
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 const choice=SCENES[seatId].choices![index]
 fireEvent.click(screen.getByRole('button',{name:choice.label}))
 for(let i=0;i<choice.reply!.length;i++){
  expect(screen.getByText(choice.reply![i].text)).toBeInTheDocument()
  if(i+1<choice.reply!.length)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 }
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().modal).toBeNull()
 expect(useGame.getState().game.scenes).not.toContain(seatId)
 expect(useGame.getState().game.inv).toEqual(s.inv)
 expect(useGame.getState().game.clock).toEqual(s.clock)
 expect(useGame.getState().game.romance).toEqual(s.romance)
})

it.each([0,1,2])('벌 관찰 공책 선택 %s는 원래 답변과 닫기 흐름을 보존한다',index=>{
 const beeId='ev:beekeeper:story:1',s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,scenes:[beeId]},modal:{kind:'scene',id:beeId}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'같은 벌, 다른 공책'})).toHaveClass('authored-story-scene')
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 const choice=SCENES[beeId].choices![index]
 fireEvent.click(screen.getByRole('button',{name:choice.label}))
 expect(screen.getByText(choice.reply![0].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().modal).toBeNull()
 expect(useGame.getState().game.scenes).not.toContain(beeId)
 expect(useGame.getState().game.inv).toEqual(s.inv)
 expect(useGame.getState().game.clock).toEqual(s.clock)
 expect(useGame.getState().game.romance).toEqual(s.romance)
})

it('강가 쉼터는 저녁 컷을 앨범에 저장하며 닫기·재생으로 원본 사진과 보상을 바꾸지 않는다',()=>{
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,river-rest')
 const riverId='village:3',s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,scenes:[riverId],flags:{...s.flags,villageLevel:3}},modal:{kind:'scene',id:riverId}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'강가 쉼터'})).toHaveClass('authored-story-scene')
 expect(localStorage.getItem('twenty-seven/album/village:3')).toBe('data:image/png;base64,river-rest')
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 expect(screen.getByText(SCENES[riverId].lines[1].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().game.album.some(a=>a.id===riverId)).toBe(true)
 expect(useGame.getState().game.inv).toEqual(s.inv)
 expect(useGame.getState().game.hearts).toEqual(s.hearts)
 expect(useGame.getState().game.clock).toEqual(s.clock)
 expect(localStorage.getItem('twenty-seven/album/village:3')).toBe('data:image/png;base64,river-rest')
 localStorage.setItem('twenty-seven/album/village:3','data:image/png;base64,original-river')
 act(()=>useGame.setState({modal:{kind:'scene',id:riverId}}))
 expect(localStorage.getItem('twenty-seven/album/village:3')).toBe('data:image/png;base64,original-river')
})
it('강가 쉼터 미리보기는 앨범이나 마을 진행을 저장하지 않는다',()=>{
 const s=useGame.getState().game
 render(<AuthoredStoryScene id="village:3" title="강가 쉼터" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(localStorage.length).toBe(0)
 expect(useGame.getState().game).toBe(s)
})

it('약병은 다섯 개에서 선택에 맞춰 네 개 또는 빈 탁자로 바뀌며 질문 중에는 치우지 않는다',()=>{
 const fillRect=vi.fn(),g={fillRect} as unknown as CanvasRenderingContext2D
 const count=(beat:number,choice?:number)=>{
  fillRect.mockClear()
  drawWorriedApothecary(g,320,180,8,null,{avatar:null,who:'writer'},beat,choice)
  return fillRect.mock.calls.filter(c=>c[2]===7&&c[3]===8).length
 }
 expect(count(2)).toBe(5)
 expect(count(3,0)).toBe(4)
 expect(count(3,1)).toBe(5)
 expect(count(4,1)).toBe(0)
})
it.each([0,1])('걸음 세기 선택 %s는 약속 대사와 기존 관계·소지품·시간을 보존한다',index=>{
 const event='ev:presser:love:1',s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,scenes:[event]},modal:{kind:'scene',id:event}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'걸음 세기'})).toHaveClass('authored-story-scene')
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 const choice=SCENES[event].choices![index]
 fireEvent.click(screen.getByRole('button',{name:choice.label}))
 expect(screen.getByText(choice.reply![0].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().game.scenes).not.toContain(event)
 expect(useGame.getState().game.inv).toEqual(s.inv)
 expect(useGame.getState().game.clock).toEqual(s.clock)
 expect(useGame.getState().game.romance).toEqual(s.romance)
})
it.each([0,1])('걱정 많은 날 선택 %s는 모든 답변과 기존 상태를 보존한다',index=>{
 const event='ev:basil:worry',s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,scenes:[event]},modal:{kind:'scene',id:event}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'걱정 많은 날'})).toHaveClass('authored-story-scene')
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 const choice=SCENES[event].choices![index]
 fireEvent.click(screen.getByRole('button',{name:choice.label}))
 for(let i=0;i<choice.reply!.length;i++){
  expect(screen.getByText(choice.reply![i].text)).toBeInTheDocument()
  if(i+1<choice.reply!.length)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 }
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().game.scenes).not.toContain(event)
 expect(useGame.getState().game.inv).toEqual(s.inv)
 expect(useGame.getState().game.clock).toEqual(s.clock)
 expect(useGame.getState().game.romance).toEqual(s.romance)
})
it.each([0,1])('거꾸로 새긴 글자 선택 %s는 원래 답변과 관계 상태를 보존한다',index=>{
 const event='ev:rudy:love:1',s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,scenes:[event]},modal:{kind:'scene',id:event}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'거꾸로 새긴 글자'})).toHaveClass('authored-story-scene')
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 const choice=SCENES[event].choices![index]
 fireEvent.click(screen.getByRole('button',{name:choice.label}))
 for(let i=0;i<choice.reply!.length;i++){
  expect(screen.getByText(choice.reply![i].text)).toBeInTheDocument()
  if(i+1<choice.reply!.length)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 }
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().game.scenes).not.toContain(event)
 expect(useGame.getState().game.inv).toEqual(s.inv)
 expect(useGame.getState().game.clock).toEqual(s.clock)
 expect(useGame.getState().game.romance).toEqual(s.romance)
})
it.each([0,1])('갈림목 표지 선택 %s는 원래 답변 수와 완료 흐름을 보존한다',index=>{
 const signId='ev:rudy:small:signPost',s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,scenes:[signId]},modal:{kind:'scene',id:signId}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'갈림목 표지'})).toHaveClass('authored-story-scene')
 for(let i=1;i<SCENES[signId].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 const choice=SCENES[signId].choices![index]
 fireEvent.click(screen.getByRole('button',{name:choice.label}))
 for(let i=0;i<choice.reply!.length;i++){
  expect(screen.getByText(choice.reply![i].text)).toBeInTheDocument()
  if(i+1<choice.reply!.length)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 }
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().modal).toBeNull()
 expect(useGame.getState().game.scenes).not.toContain(signId)
 expect(useGame.getState().game.inv).toEqual(s.inv)
 expect(useGame.getState().game.clock).toEqual(s.clock)
 expect(useGame.getState().game.romance).toEqual(s.romance)
})

it('갈대 틀 설치 안내는 두 대사로 닫히고 다음 날 종이를 미리 지급하지 않는다',()=>{
 const rackId='built:reedRack',s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,scenes:[rackId],flags:{...s.flags,'unlock:reedRack':1}},modal:{kind:'scene',id:rackId}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'갈대 말리는 틀'})).toHaveClass('authored-story-scene')
 expect(screen.getByText(SCENES[rackId].lines[0].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 expect(screen.getByText(SCENES[rackId].lines[1].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().modal).toBeNull()
 expect(useGame.getState().game.inv).toEqual(s.inv)
 expect(useGame.getState().game.scenes).not.toContain(rackId)
 expect(useGame.getState().game.clock).toEqual(s.clock)
 expect(useGame.getState().game.romance).toEqual(s.romance)
})

it.each([0,1,2])('간식과 찻잔 선택 %s는 원래 답변을 보여 주고 추가 보상 없이 끝난다',index=>{
 const teaId='ev:poppy:story:2',s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,scenes:[teaId]},modal:{kind:'scene',id:teaId}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'간식과 찻잔'})).toHaveClass('authored-story-scene')
 for(let i=1;i<SCENES[teaId].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 const choice=SCENES[teaId].choices![index]
 fireEvent.click(screen.getByRole('button',{name:choice.label}))
 expect(screen.getByText(choice.reply![0].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().modal).toBeNull()
 expect(useGame.getState().game.inv).toEqual(s.inv)
 expect(useGame.getState().game.clock).toEqual(s.clock)
 expect(useGame.getState().game.romance).toEqual(s.romance)
})


it.each([0,1,2])('가마 장면의 선택 %s는 기존 답변과 진열 놀이 연결을 유지한다',index=>{
 const ovenId='ev:baker:story:3',s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,scenes:[ovenId]},modal:{kind:'scene',id:ovenId}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'가마 나누는 날'})).toHaveClass('authored-story-scene')
 for(let i=1;i<SCENES[ovenId].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 const choice=SCENES[ovenId].choices![index]
 fireEvent.click(screen.getByRole('button',{name:choice.label}))
 expect(screen.getByText(choice.reply![0].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 if(index===0){
  const modal=useGame.getState().modal
  expect(modal?.kind).toBe('mini')
  if(modal?.kind==='mini')expect(modal.pending).toMatchObject({kind:'story',event:'baker:story:3',npc:'baker'})
 }else expect(useGame.getState().modal).toBeNull()
})


it('가벼운 신의 세 대사를 마치거나 다시 봐도 신 보상과 장비 상태가 중복 변경되지 않는다',()=>{
 const s=useGame.getState().game,inv={...s.inv,sturdyShoes:1,lightShoes:1},gearOff=['lightShoes' as const]
 act(()=>useGame.setState({game:{...s,scenes:['lightShoes'],inv,gearOff,giftsGot:[...s.giftsGot,'lightShoes']},modal:{kind:'scene',id:'lightShoes'}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'가벼운 신'})).toHaveClass('authored-story-scene')
 for(let i=1;i<SCENES.lightShoes.lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 expect(screen.getByText(SCENES.lightShoes.lines[2].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().game.inv).toEqual(inv)
 expect(useGame.getState().game.gearOff).toEqual(gearOff)
 expect(useGame.getState().game.scenes).not.toContain('lightShoes')
 act(()=>useGame.setState({modal:{kind:'scene',id:'lightShoes'}}))
 for(let i=1;i<SCENES.lightShoes.lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().game.inv.lightShoes).toBe(1)
})


it('가족 여행은 실제 아이 이름과 기존 보상을 유지하고 돌아오는 배 사진을 남긴다',()=>{
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,family-boat')
 const s=useGame.getState().game
 const child={name:'누리',look:'boy' as const,born:1,stats:freshStats(),lean:null,close:25}
 act(()=>useGame.setState({game:{...s,child,clock:{day:50,minute:800},scenes:['fam:trip']},modal:{kind:'scene',id:'fam:trip'}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'가족 여행'})).toHaveClass('authored-story-scene')
 expect(screen.getByText('낯선 마을의 길을 누리와 나란히 걸었다.')).toBeInTheDocument()
 expect(localStorage.getItem('twenty-seven/album/fam:trip')).toBe('data:image/png;base64,family-boat')
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 expect(screen.getByText('돌아오는 배 위에서 누리가 다음에는 어디에 가자고 손가락을 꼽았다.')).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().game.child?.close).toBe(25)
 expect(useGame.getState().game.inv).toEqual(s.inv)
 expect(useGame.getState().game.album.some(a=>a.id==='fam:trip')).toBe(true)
 localStorage.setItem('twenty-seven/album/fam:trip','data:image/png;base64,original')
 act(()=>useGame.setState({modal:{kind:'scene',id:'fam:trip'}}))
 expect(localStorage.getItem('twenty-seven/album/fam:trip')).toBe('data:image/png;base64,original')
})
it('가족 여행 미리보기는 실제 아이와 앨범을 바꾸지 않는다',()=>{
 const s=useGame.getState().game
 render(<AuthoredStoryScene id="fam:trip" title="가족 여행" preview><p>미리보기 대사</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s)
 expect(localStorage.length).toBe(0)
})


it.each([0,1,2])('의자 조립 선택 %s는 원래 답변과 받침 잡기 놀이를 유지한다',index=>{
 const chairId='ev:carpenter:story:3',s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,scenes:[chairId]},modal:{kind:'scene',id:chairId}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'각자가 맡은 부분'})).toHaveClass('authored-story-scene')
 for(let i=1;i<SCENES[chairId].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 const choice=SCENES[chairId].choices![index]
 fireEvent.click(screen.getByRole('button',{name:choice.label}))
 expect(screen.getByText(choice.reply![0].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 if(index===0){
  const modal=useGame.getState().modal
  expect(modal?.kind).toBe('mini')
  if(modal?.kind==='mini')expect(modal.pending).toMatchObject({kind:'story',event:'carpenter:story:3',npc:'carpenter'})
 }else expect(useGame.getState().modal).toBeNull()
})


it.each([0,1])('간식 바구니 선택 %s와 원래 담기 놀이를 보존한다',index=>{
 const snackId='ev:baker:small:festBasket',s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,scenes:[snackId]},modal:{kind:'scene',id:snackId}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:'간식 바구니'})).toHaveClass('authored-story-scene')
 const choice=SCENES[snackId].choices![index]
 fireEvent.click(screen.getByRole('button',{name:choice.label}))
 expect(screen.getByText(choice.reply![0].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 if(index===0){
  const modal=useGame.getState().modal
  expect(modal?.kind).toBe('mini')
  if(modal?.kind==='mini')expect(modal.pending).toMatchObject({kind:'story',event:'baker:small:festBasket',npc:'baker'})
 }else expect(useGame.getState().modal).toBeNull()
})



it('임신 미리보기는 아이를 생성하거나 앨범 사진을 저장하지 않는다',()=>{
 const before=useGame.getState().game;render(<AuthoredStoryScene id="pregnancy" title="기다리는 아기" preview><p>미리보기</p></AuthoredStoryScene>);
 expect(useGame.getState().game).toBe(before);expect(localStorage.getItem('twenty-seven/album/pregnancy')).toBeNull();
})

it.each(HOME_ROOM_IDS)('%s 가족방 그림은 실제 외형과 원래 대사를 쓰고 게임 상태를 바꾸지 않는다',event=>{
 const s=useGame.getState().game,frames:FrameRequestCallback[]=[],draw=vi.spyOn(authoredArt,'drawAuthoredStory')
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,family-room')
 const child={name:'보리',look:'boy' as const,born:1,stats:freshStats(),lean:null,close:4}
 const looks={...s.looks,child:{name:'보리',look:'m' as const,top:6},postman:{name:'실제 배우자',look:'m' as const,top:4}},romance={...s.romance,partner:'postman',stage:'married' as const}
 act(()=>useGame.setState({game:{...s,child,looks,romance,clock:{day:50,minute:1110},scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 const call=draw.mock.calls.at(-1)!
 expect(call[1]).toBe(event)
 if(isHomeRoomKid(event))expect(call[6]).toMatchObject({avatar:{name:'보리',top:6}})
 if(['fam:supperFirst','fam:supperAll','fam:bdaySpouse','fam:bdayChild','fam:supper','fam:meal'].includes(event))expect(call[6]).toMatchObject({avatar:{name:'실제 배우자',top:4}})
 if(event.startsWith('fam:with:'))expect(call[7]).toMatchObject([{avatar:{name:'보리',top:6}}])
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 const after=useGame.getState().game
 expect(after).toEqual(before)
 if(SCENES[event].album)expect(localStorage.getItem(`twenty-seven/album/${event}`)).toBe('data:image/png;base64,family-room')
})
it.each(HOME_ROOM_IDS)('%s 가족방 미리보기는 저장·앨범·식구를 바꾸지 않는다',event=>{
 const before=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="가족방" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(before)
 expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
 expect(localStorage.getItem(`twenty-seven/album/${event}`)).toBeNull()
})
it.each([...HOME_ROOM_ACTIVITY_IDS,'fam:play','fam:cook'].flatMap(id=>[0,1,2].map(choice=>[id,choice] as const)))('%s 실제 고른 항목 %i를 그림에 전달한다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,chosen')
 const life=recordExperience(NO_LIFE,{id:event,kind:'family',with:['family:child'],choice,place:'home'},{day:50,minute:1110,season:'spring',weather:weatherOf(50)})
 act(()=>useGame.setState({game:{...s,life},modal:null}))
 render(<AuthoredStoryScene id={event} title="가족방" beat={1}><p>원래 대사</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(draw.mock.calls.at(-1)![8]).toBe(1)
 expect(useGame.getState().game.life).toBe(life)
})

it.each(BAKERY_EVENT_IDS)('%s 빵집 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,bakery')
 const npcId=bakeryEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(BAKERY_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="빵집" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(BAKERY_EVENT_IDS)('%s 빵집 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="빵집" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})
it.each(TEA_EVENT_IDS)('%s 찻집 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=event==='dateTea'?'wendell':teaEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(TEA_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="찻집" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(TEA_EVENT_IDS)('%s 찻집 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="찻집" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})

it.each(SMITH_EVENT_IDS)('%s 대장간 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=smithEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(SMITH_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="대장간" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(SMITH_EVENT_IDS)('%s 대장간 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="대장간" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})

it.each(WEAVER_EVENT_IDS)('%s 베틀 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=weaverEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(WEAVER_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="베틀" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(WEAVER_EVENT_IDS)('%s 베틀 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="베틀" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})

it.each(SHORE_EVENT_IDS)('%s 나루 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=shoreEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(SHORE_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="나루" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(SHORE_EVENT_IDS)('%s 나루 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="나루" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})

it.each(BEE_EVENT_IDS)('%s 벌통 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=beeEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(BEE_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="벌통" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(BEE_EVENT_IDS)('%s 벌통 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="벌통" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})

it.each(HERB_EVENT_IDS)('%s 약방 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=herbEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(HERB_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="약방" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(HERB_EVENT_IDS)('%s 약방 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="약방" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})

it.each(WOOD_EVENT_IDS)('%s 목공 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=woodEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(WOOD_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="목공" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(WOOD_EVENT_IDS)('%s 목공 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="목공" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})

it.each(OIL_EVENT_IDS)('%s 기름 작업장 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=oilEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(OIL_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="기름 작업장" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(OIL_EVENT_IDS)('%s 기름 작업장 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="기름 작업장" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})

it.each(VINE_EVENT_IDS)('%s 포도원 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=vineEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(VINE_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="포도원" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(VINE_EVENT_IDS)('%s 포도원 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="포도원" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})

it.each(SHEEP_EVENT_IDS)('%s 양 우리 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=sheepEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(SHEEP_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="양 우리" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(SHEEP_EVENT_IDS)('%s 양 우리 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="양 우리" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})

it.each(SQUARE_NPC_IDS)('%s 광장 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=squareEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(SQUARE_NPC_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="광장" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(SQUARE_NPC_IDS)('%s 광장 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="광장" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})

it.each(['fam:walk','fam:market','fam:errand'])('%s는 실제 아이·기억한 이웃·첫 산책 물건을 사용하고 원래 진행을 지킨다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,first-market')
 const child={name:'누리',look:'boy' as const,born:1,stats:freshStats(),lean:null,close:25},looks={...s.looks,child:{name:'누리',look:'m' as const,top:7},carpenter:{name:'실제 목수',look:'m' as const,top:6}}
 const life=recordExperience(NO_LIFE,{id:event,kind:'family',with:['family:child','wendell','carpenter']},{day:2,minute:800,season:'spring',weather:'sunny'})
 act(()=>useGame.setState({game:{...s,avatar:{name:'기록자',look:'f',skin:3},child,looks,life,clock:{day:51,minute:800},scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>);act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'누리',look:'m',skin:3,top:7},who:'writer',short:1})
 expect(draw.mock.calls.at(-1)![7]![0]).toMatchObject({id:'carpenter',avatar:{name:'실제 목수',top:6}})
 expect(draw.mock.calls.at(-1)![11]).toBe('olive')
 expect(localStorage.getItem('twenty-seven/album/'+event)).toBe('data:image/png;base64,first-market')
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 expect(useGame.getState().game).toEqual(before)
})
it.each(SQUARE_EVENT_IDS)('%s 광장 미리보기는 게임·저장·앨범에 쓰지 않는다',event=>{
 const before=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="광장" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(before);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})

it.each(HALL_EVENT_IDS.filter(id=>hallEventPeople(id).length>0))('%s 사랑방 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=hallEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(HALL_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="사랑방" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(HALL_EVENT_IDS)('%s 사랑방 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="사랑방" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})


it('사랑방의 저녁은 오늘의 실제 참석 이웃을 그리며 미리보기용 손님을 게임에 추가하지 않는다',()=>{
 const s=useGame.getState().game,game={...s,clock:{day:50,minute:1100},flags:{...s.flags,villageLevel:4},scenes:['hallNight']},frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,hall')
 const draw=vi.spyOn(authoredArt,'drawAuthoredStory')
 act(()=>useGame.setState({game,modal:{kind:'scene',id:'hallNight'}}))
 render(<ModalLayer/>);act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![7]!.map(a=>(a as {id?:string}).id)).toEqual(hallGuestsToday(game,CONTENT).filter(id=>id!=='baker'))
 expect(useGame.getState().game).toBe(game)
})

it('사랑방의 저녁 기존 앨범 그림은 다시 그려 덮어쓰지 않는다',()=>{
 storeAlbumImage('hallNight','data:image/png;base64,original-hall')
 const capture=vi.spyOn(HTMLCanvasElement.prototype,'toDataURL')
 render(<AuthoredStoryScene id="hallNight" title="사랑방의 저녁"><p>저녁</p></AuthoredStoryScene>)
 expect(capture).not.toHaveBeenCalled();expect(albumImage('hallNight')).toBe('data:image/png;base64,original-hall')
})

it.each(HILL_EVENT_IDS.filter(id=>!isHillFamilyKid(id)&&!isHillDate(id)))('%s 언덕 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=hillEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(HILL_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="언덕" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(HILL_EVENT_IDS)('%s 언덕 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="언덕" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})


it.each(['dateWalk','date:walk:0','date:walk:1','date:walk:2'].flatMap(event=>['dexter','rudy','postman','marigold','basil','merchant','presser','poppy','juniper','cosmo','tilly','wendell','penelope'].map(partner=>[event,partner] as const)))('%s 산책은 실제 상대 %s의 외형을 사용한다',(event,partner)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,hill')
 const game={...s,romance:{...s.romance,partner},looks:{...s.looks,[partner]:{name:'실제 산책 상대',look:'f' as const,top:7}},scenes:[event]}
 act(()=>useGame.setState({game}))
 render(<AuthoredStoryScene id={event} title="산책"><p>산책</p></AuthoredStoryScene>);act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 산책 상대',top:7}});expect(useGame.getState().game).toBe(game)
})
it('봄 소풍은 부모 피부·입힌 옷·이름·키를 반영한 실제 아이를 사용한다',()=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,picnic')
 const child={name:'누리',look:'boy' as const,born:1,stats:freshStats(),lean:null,close:25}
 const game={...s,avatar:{name:'기록자',look:'f' as const,skin:3},child,looks:{...s.looks,child:{name:'누리',look:'m' as const,top:7}},clock:{day:51,minute:800},scenes:['fam:picnic']}
 act(()=>useGame.setState({game}))
 render(<AuthoredStoryScene id="fam:picnic" title="소풍"><p>꽃</p></AuthoredStoryScene>);act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'누리',look:'m',skin:3,top:7},who:'writer',short:1});expect(useGame.getState().game).toBe(game)
})

it.each(POSTMAN_EVENT_IDS)('%s 편지 집 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=postmanEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(POSTMAN_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="편지 집" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(POSTMAN_EVENT_IDS)('%s 편지 집 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="편지 집" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})


it.each(LIBRARY_EVENT_IDS.filter(id=>libraryEventPeople(id).length>0&&id!=='fam:show'))('%s 서고 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=libraryEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(LIBRARY_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="서고" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(LIBRARY_EVENT_IDS)('%s 서고 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="서고" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})


it('배움터 작품 전시는 부모 피부·입힌 옷·이름·키를 반영한 실제 아이를 사용한다',()=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,picnic')
 const child={name:'누리',look:'boy' as const,born:1,stats:freshStats(),lean:null,close:25}
 const game={...s,avatar:{name:'기록자',look:'f' as const,skin:3},child,looks:{...s.looks,child:{name:'누리',look:'m' as const,top:7}},clock:{day:51,minute:800},scenes:['fam:show'],life:{...s.life,experiences:{...s.life?.experiences,'fam:show':{id:'fam:show',last:51,count:1,first:51,item:'woodToy',choice:0,with:['family:child'],place:'classroom',kind:'family' as const}}}}
 act(()=>useGame.setState({game}))
 render(<AuthoredStoryScene id="fam:show" title="작품"><p>꽃</p></AuthoredStoryScene>);act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'누리',look:'m',skin:3,top:7},who:'writer',short:1});expect(draw.mock.calls.at(-1)![12]).toBe('woodToy');expect(useGame.getState().game).toBe(game)
})

it.each(LIBRARY_EVENT_IDS.filter(id=>!!SCENES[id].album))('%s 기존 앨범 그림은 보존한다',event=>{storeAlbumImage(event,'data:image/png;base64,original-library');const capture=vi.spyOn(HTMLCanvasElement.prototype,'toDataURL');render(<AuthoredStoryScene id={event} title="서고"><p>대화</p></AuthoredStoryScene>);expect(capture).not.toHaveBeenCalled();expect(albumImage(event)).toBe('data:image/png;base64,original-library')})

it('서고 안내가 열린 동안 게임 프레임의 사진 촬영도 기존 앨범을 보존한다',()=>{const s=useGame.getState().game,capture=vi.fn(()=> 'data:image/png;base64,replaced');storeAlbumImage('allFeast','data:image/png;base64,original-library');act(()=>useGame.setState({game:{...s,scenes:['allFeast']},modal:{kind:'scene',id:'allFeast'},capture}));act(()=>useGame.getState().frame(16));expect(capture).not.toHaveBeenCalled();expect(albumImage('allFeast')).toBe('data:image/png;base64,original-library')})

it.each(TRAVEL_EVENT_IDS.filter(id=>travelEventPeople(id).length>0))('%s 여행 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=travelEventPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(TRAVEL_EVENT_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="여행" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(TRAVEL_EVENT_IDS)('%s 여행 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="여행" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})



it('언덕 여행은 꽃잎 전달 컷을 앨범에 쓰고 기존 사진을 보존한다',()=>{const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory');vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,trip');act(()=>useGame.setState({game:{...s,album:s.album.filter(a=>a.id!=='trip:hillTown')}}));render(<AuthoredStoryScene id="trip:hillTown" title="여행"><p>여행</p></AuthoredStoryScene>);expect(draw.mock.calls.some(c=>c[1]==='trip:hillTown'&&c[8]===2)).toBe(true);expect(albumImage('trip:hillTown')).toBe('data:image/png;base64,trip')})

it.each(SHOP_REMAINDER_IDS.filter(id=>id!=='teaFirst'&&!id.startsWith('date:tea:')))('%s 빵집·찻집 장면은 원래 대사·선택과 실제 NPC 옷차림을 유지한다',event=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,tea')
 const npcId=shopRemainderPeople(event)[0],looks={...s.looks,[npcId]:{name:'실제 이웃',look:'f' as const,top:7}}
 act(()=>useGame.setState({game:{...s,looks,scenes:[event]},modal:{kind:'scene',id:event}}))
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('authored-story-scene')
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 이웃',top:7},who:'writer'})
 for(let i=1;i<SCENES[event].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 for(const choice of SCENES[event].choices??[])expect(screen.getByRole('button',{name:choice.label})).toBeInTheDocument()
 expect(useGame.getState().game).toEqual(before)
})
it.each(SHOP_REMAINDER_IDS.flatMap(id=>(SCENES[id].choices??[]).map((_,choice)=>[id,choice] as const)))('%s 선택 %i는 해당 답변 단계로 전달되고 게임 상태를 바꾸지 않는다',(event,choice)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const beat=SCENES[event].lines.length+SCENES[event].choices![choice].reply.length-1
 render(<AuthoredStoryScene id={event} title="빵집·찻집" beat={beat} chosen={choice}><p>답변</p></AuthoredStoryScene>)
 act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![8]).toBe(beat);expect(draw.mock.calls.at(-1)![9]).toBe(choice)
 expect(useGame.getState().game).toBe(s)
})
it.each(SHOP_REMAINDER_IDS)('%s 빵집·찻집 미리보기는 게임 저장과 앨범을 바꾸지 않는다',event=>{
 const s=useGame.getState().game
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,preview')
 render(<AuthoredStoryScene id={event} title="빵집·찻집" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(s);expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})



it.each(['date:tea:0','date:tea:1','date:tea:2'].flatMap(event=>['dexter','rudy','postman','marigold','basil','merchant','presser','poppy','juniper','cosmo','tilly','wendell','penelope'].map(partner=>[event,partner] as const)))('%s 찻집 나들이은 실제 상대 %s의 외형을 사용한다',(event,partner)=>{
 const s=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,hill')
 const game={...s,romance:{...s.romance,partner},looks:{...s.looks,[partner]:{name:'실제 찻집 나들이 상대',look:'f' as const,top:7}},scenes:[event]}
 act(()=>useGame.setState({game}))
 render(<AuthoredStoryScene id={event} title="찻집 나들이"><p>찻집 나들이</p></AuthoredStoryScene>);act(()=>frames.slice().forEach(cb=>cb(1000)))
 expect(draw.mock.calls.at(-1)![6]).toMatchObject({avatar:{name:'실제 찻집 나들이 상대',top:7}});expect(useGame.getState().game).toBe(game)
})


it.each(['village:1','village:2','village:4'])('%s 마을 단계의 새 그림은 기존 앨범 이미지를 덮지 않는다',event=>{
 storeAlbumImage(event,'data:image/png;base64,kept-village');const capture=vi.spyOn(HTMLCanvasElement.prototype,'toDataURL')
 render(<AuthoredStoryScene id={event} title="마을"><p>대화</p></AuthoredStoryScene>)
 expect(capture).not.toHaveBeenCalled();expect(albumImage(event)).toBe('data:image/png;base64,kept-village')
})
it.each(['village:1','village:2','village:4'])('%s 그림이 없던 원래 마을 앨범에 사진을 남기며 게임 상태는 바꾸지 않는다',event=>{
 const game=useGame.getState().game;vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,village')
 render(<AuthoredStoryScene id={event} title="마을"><p>대화</p></AuthoredStoryScene>)
 expect(albumImage(event)).toBe('data:image/png;base64,village');expect(useGame.getState().game).toBe(game)
})
it('꽃길 미리보기는 사용자 저장·앨범을 바꾸지 않는다',()=>{
 const game=useGame.getState().game,capture=vi.spyOn(HTMLCanvasElement.prototype,'toDataURL'),before=Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])
 render(<AuthoredStoryScene id="village:1" title="꽃길" preview><p>미리보기</p></AuthoredStoryScene>)
 expect(capture).not.toHaveBeenCalled();expect(useGame.getState().game).toBe(game);expect(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])).toEqual(before)
})


it('항구 여행은 빵 포장 마지막 컷을 앨범에 남기고 선물·배삯·시간을 다시 처리하지 않는다',()=>{
 const game=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory');vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,harbor')
 render(<AuthoredStoryScene id="trip:harbor" title="항구 여행"><p>대화</p></AuthoredStoryScene>)
 expect(draw.mock.calls.some(c=>c[1]==='trip:harbor'&&c[8]===3)).toBe(true);expect(albumImage('trip:harbor')).toBe('data:image/png;base64,harbor');expect(useGame.getState().game).toBe(game)
})
it('항구 여행의 기존 앨범 그림을 보존한다',()=>{
 storeAlbumImage('trip:harbor','data:image/png;base64,kept-harbor');const capture=vi.spyOn(HTMLCanvasElement.prototype,'toDataURL')
 render(<AuthoredStoryScene id="trip:harbor" title="항구 여행"><p>대화</p></AuthoredStoryScene>)
 expect(capture).not.toHaveBeenCalled();expect(albumImage('trip:harbor')).toBe('data:image/png;base64,kept-harbor')
})

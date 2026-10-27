import {render,screen,fireEvent,act} from '@testing-library/react'
import {CONTENT} from '../../content/catalog'
import {legacyGame} from '../../engine/growth-test-support'
import {useGame} from '../../store/game-store'
import {AuthoredStoryScene} from './AuthoredStoryScene'
import {GiftPicker} from '../talk/GiftPicker'
import {TalkBox} from '../talk/TalkBox'
import {TradeBoard} from '../talk/TradeBoard'
import * as art from '../../render/authored-story-art'

beforeEach(()=>{
 localStorage.clear()
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({clearRect:vi.fn(),fillRect:vi.fn()} as unknown as CanvasRenderingContext2D)
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,formal')
 vi.spyOn(art,'drawAuthoredStory').mockImplementation(()=>{})
 useGame.setState({game:legacyGame(CONTENT),modal:null})
})
afterEach(()=>vi.restoreAllMocks())
it('offers bought attire only to the engaged partner even after the ordinary daily gift',()=>{
 const s=useGame.getState().game
 useGame.setState({game:{...s,inv:{weddingTuxedo:1},gifted:['rudy'],romance:{partner:'rudy',stage:'engaged',since:1,weddingDay:14,marriedDay:null}}})
 const talk=render(<TalkBox modal={{kind:'talk',neighborId:'rudy',line:'안녕하세요.'}}/>)
 expect(screen.getByRole('button',{name:'선물하기'})).toBeEnabled()
 talk.unmount()
 const view=render(<GiftPicker neighborId="postman"/>)
 expect(screen.queryByRole('button',{name:/검정 턱시도/})).not.toBeInTheDocument()
 view.rerender(<GiftPicker neighborId="rudy"/>)
 fireEvent.click(screen.getByRole('button',{name:/검정 턱시도/}))
 expect(useGame.getState().game.inv.weddingTuxedo??0).toBe(0)
 expect(useGame.getState().game.flags['weddingGift:rudy']).toBe(1)
 expect(useGame.getState().game.gifted).toEqual(['rudy'])
})
it('shows all four formal outfits in the market clothes section',()=>{
 const s=useGame.getState().game
 useGame.setState({game:{...s,flags:{...s.flags,growthLegacy:1},clock:{day:7,minute:900},coins:1000}})
 render(<TradeBoard/>)
 expect(screen.getByText(/^결혼 예복/)).toBeInTheDocument()
 for(const name of ['검정 턱시도','흰 재킷 정장','흰 벨라인 웨딩드레스','로즈 레이스 드레스'])expect(screen.getAllByRole('button',{name:new RegExp(name)}).length).toBeGreaterThan(0)
})
it('waits for the real player choice, draws both selected costumes and captures the same dressed player',()=>{
 const s=useGame.getState().game,frames:FrameRequestCallback[]=[]
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 const avatar={name:'기록자',look:'f' as const,skin:3,top:5}
 useGame.setState({game:{...s,avatar,inv:{weddingLaceDress:1},clock:{day:14,minute:1110},flags:{...s.flags,'weddingPartnerWear:rudy:14':1},romance:{partner:'rudy',stage:'married',since:1,weddingDay:null,marriedDay:14},scenes:['wedding:rudy'],album:[{id:'wedding:rudy',day:14}]}})
 render(<AuthoredStoryScene id="wedding:rudy" title="마을 잔치"><p>원문</p></AuthoredStoryScene>)
 expect(art.drawAuthoredStory).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button',{name:'로즈 레이스 드레스 입기'}))
 act(()=>frames.slice().forEach(cb=>cb(performance.now()+2000)))
 expect(screen.queryByRole('dialog',{name:'결혼식에 입을 옷'})).not.toBeInTheDocument()
 expect(art.drawAuthoredStory).toHaveBeenCalled()
 for(const call of vi.mocked(art.drawAuthoredStory).mock.calls){
  expect(call[5]).toMatchObject({name:'기록자',skin:3,weddingOutfit:'bride-lace'})
  expect(call[6].avatar).toMatchObject({weddingOutfit:'groom-midnight'})
 }
 expect(useGame.getState().game.inv.weddingLaceDress).toBe(1)
 expect(useGame.getState().game.avatar).toEqual(avatar)
})
it.each([{preview:true},{readOnly:true}])('never offers a live wardrobe choice or saves on preview/replay %j',mode=>{
 const s=useGame.getState().game
 useGame.setState({game:{...s,inv:{weddingTuxedo:1},scenes:['wedding:rudy'],romance:{partner:'rudy',stage:'married',since:1,weddingDay:null,marriedDay:1}}})
 const before=JSON.stringify(useGame.getState().game)
 render(<AuthoredStoryScene id="wedding:rudy" title="마을 잔치" {...mode}><p>원문</p></AuthoredStoryScene>)
 expect(screen.queryByRole('dialog',{name:'결혼식에 입을 옷'})).not.toBeInTheDocument()
 expect(JSON.stringify(useGame.getState().game)).toBe(before)
 expect(localStorage.length).toBe(0)
 expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
})

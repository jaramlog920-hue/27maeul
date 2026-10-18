import {render,screen,fireEvent,cleanup} from '@testing-library/react'
import {Wardrobe} from './Wardrobe'
import {AvatarForm} from '../intro/AvatarForm'
import {CONTENT} from '../../content/catalog'
import {COPY_OUTFITS,copyOutfitTop} from '../../engine/copy-outfits'
import {newGame} from '../../engine/game'
import {withLookDefaults} from '../../engine/avatar'
import {useGame} from '../../store/game-store'
import {T} from '../../content/text'

beforeEach(()=>{
 localStorage.clear()
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({clearRect:vi.fn(),fillRect:vi.fn()} as unknown as CanvasRenderingContext2D)
 useGame.setState({game:newGame(CONTENT,withLookDefaults({name:'나',look:'f',top:21})),modal:null})
})
afterEach(()=>{cleanup();vi.restoreAllMocks()})
it('only acquired rare outfits enter the wardrobe selector and can actually be worn',()=>{
 const gift=COPY_OUTFITS.find(o=>o.id==='f-1')!,s=useGame.getState().game
 useGame.setState({game:{...s,flags:{...s.flags,[`copyOutfit:${gift.id}`]:1}}})
 render(<Wardrobe who="me" />)
 expect(screen.getByText(/필사 수집 의상 1\/40/)).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:`${T.avatar.rows.top} 다음`}))
 expect(screen.getByText(gift.name)).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'이대로 입기'}))
 expect(useGame.getState().game.avatar?.top).toBe(copyOutfitTop(gift.id))
})
it('never offers locked designs in character creation or a fresh wardrobe',()=>{
 render(<Wardrobe who="me" />)
 fireEvent.click(screen.getByRole('button',{name:`${T.avatar.rows.top} 다음`}))
 for(const o of COPY_OUTFITS)expect(screen.queryByText(o.name)).toBeNull()
 cleanup()
 render(<AvatarForm onDone={vi.fn()} onBack={vi.fn()} />)
 for(let i=0;i<24;i++)fireEvent.click(screen.getByRole('button',{name:`${T.avatar.rows.top} 다음`}))
 for(const o of COPY_OUTFITS)expect(screen.queryByText(o.name)).toBeNull()
})

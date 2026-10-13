import {act,fireEvent,render,screen} from '@testing-library/react'
import {CONTENT} from '../../content/catalog'
import {legacyGame} from '../../engine/growth-test-support'
import {useGame} from '../../store/game-store'
import {ModalLayer} from '../ModalLayer'
import {freshStats} from '../../engine/stats'
import {newGenState} from '../../engine/gen'
import {SCENES} from '../../content/text'

beforeEach(()=>{
 localStorage.clear()
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn()} as unknown as CanvasRenderingContext2D)
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,final-frame')
 useGame.setState({game:{...legacyGame(CONTENT),scenes:[]},modal:null})
})
afterEach(()=>vi.restoreAllMocks())
it.each([['firstOtBook','새 서고의 첫 책'],['psalmRest','펜을 내려놓은 저녁'],['firstHomeBook','내 방에도 한 권'],['workSuccession:baker','이어지는 일터']])('%s은 도트 장면과 마지막 사진을 한 번 남긴다',(id,title)=>{
 const s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,scenes:[id]},modal:{kind:'scene',id}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveAccessibleName(title)
 expect(SCENES[id]).toBeDefined()
 expect(localStorage.getItem(`twenty-seven/album/${id}`)).toBe('data:image/png;base64,final-frame')
 fireEvent.click(screen.getByRole('button',{name:/마을로 돌아가기/}))
 expect(useGame.getState().game.album.some(a=>a.id===id)).toBe(true)
 expect(useGame.getState().game.scenes).not.toContain(id)
})
it('실제 첫 책 배치만 장면을 열며 미완성·재배치는 열지 않는다',()=>{
 act(()=>useGame.getState().toggleHomeBook('phm'))
 expect(useGame.getState().modal).toBeNull()
 const s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,shelved:{phm:0}}}))
 act(()=>useGame.getState().toggleHomeBook('phm'))
 expect(useGame.getState().modal).toEqual({kind:'scene',id:'firstHomeBook'})
 act(()=>useGame.getState().nextScene())
 act(()=>useGame.getState().toggleHomeBook('phm'))
 act(()=>useGame.getState().toggleHomeBook('phm'))
 expect(useGame.getState().modal).toBeNull()
})
it.each(['childLeaves','childStays'])('%s은 기존 대사와 실제 아이를 보존한다',id=>{
 const s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,child:{name:'하린',look:'girl',born:1,stats:freshStats(),lean:null,job:'scribe',jobConfirmed:true,left:id==='childLeaves'},scenes:[id]},modal:{kind:'scene',id}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog')).toHaveClass('stars-scene')
 expect(screen.getByText(/하린/)).toBeInTheDocument()
 for(let i=1;i<SCENES[id].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().game.scenes).not.toContain(id)
 expect(useGame.getState().game.child?.name).toBe('하린')
})
it('실제 거주지를 다른 지역으로 옮길 때만 배웅하며 진로 선택은 막지 않는다',()=>{
 const s=useGame.getState().game
 act(()=>useGame.setState({game:{...s,clock:{day:100,minute:600},child:{name:'하린',look:'girl',born:1,stats:freshStats(),lean:null,job:'scribe',jobConfirmed:false,left:false}}}))
 act(()=>useGame.getState().setChildResidence('away'))
 expect(useGame.getState().modal).toBeNull()
 act(()=>useGame.getState().chooseChildCareer('sailor'))
 act(()=>useGame.getState().setChildResidence('away'))
 expect(useGame.getState().modal).toEqual({kind:'scene',id:'childLeaves'})
 expect(useGame.getState().game.child).toMatchObject({job:'sailor',jobConfirmed:true,left:true})
 act(()=>useGame.getState().nextScene())
 act(()=>useGame.getState().setChildResidence('home'))
 act(()=>useGame.getState().setChildResidence('away'))
 expect(useGame.getState().modal).toBeNull()
})
it('계승 장면은 원래 부모와 실제 자녀 이름을 표시한다',()=>{
 const s=useGame.getState().game,g=newGenState(CONTENT,7,100),id='workSuccession:baker'
 g.persons['g-0001']={id:'g-0001',origin:'born',born:1,stage:'adult',look:'f',name:'루시',parents:['baker'],spouse:null,household:'h-1'}
 g.retired={baker:{heir:'g-0001',day:100}}
 act(()=>useGame.setState({game:{...s,gen:g,scenes:[id]},modal:{kind:'scene',id}}))
 render(<ModalLayer/>)
 expect(screen.getByText(/루시/)).toBeInTheDocument()
})

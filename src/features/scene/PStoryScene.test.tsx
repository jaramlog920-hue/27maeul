import {act,fireEvent,render,screen} from '@testing-library/react'
import {CONTENT} from '../../content/catalog'
import {SCENES} from '../../content/text'
import {legacyGame} from '../../engine/growth-test-support'
import {useGame} from '../../store/game-store'
import {ModalLayer} from '../ModalLayer'
import {AuthoredStoryScene} from './AuthoredStoryScene'

beforeEach(()=>{
 localStorage.clear()
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn()} as unknown as CanvasRenderingContext2D)
 const game=legacyGame(CONTENT)
 useGame.setState({game,modal:null,piecePopups:[],copyResult:null,afterScene:null})
})
afterEach(()=>vi.restoreAllMocks())
it.each(['romance1:wendell','romance2:wendell'])('%s는 원래 대사와 닫기 흐름에서 시간·보상·관계를 보존한다',id=>{
 const before=useGame.getState().game
 act(()=>useGame.setState({game:{...before,scenes:[id]},modal:{kind:'scene',id}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:SCENES[id].title})).toHaveClass('authored-story-scene')
 expect(screen.getByText(SCENES[id].lines[0].text)).toBeInTheDocument()
 for(let i=1;i<SCENES[id].lines.length;i++){
  fireEvent.click(screen.getByRole('button',{name:/^다음$/}))
  expect(screen.getByText(SCENES[id].lines[i].text.replace('{player}',before.avatar?.name??'필사가'))).toBeInTheDocument()
 }
 fireEvent.click(screen.getByRole('button',{name:/^닫기$/}))
 const after=useGame.getState().game
 expect(after.scenes).not.toContain(id)
 for(const key of ['clock','inv','hearts','romance'] as const)expect(after[key]).toEqual(before[key])
})
it.each(['romance1:wendell','romance2:wendell','ev:merchant:story:1'])('%s 미리보기는 게임 상태와 저장·앨범을 바꾸지 않는다',id=>{
 const before=useGame.getState().game
 render(<AuthoredStoryScene id={id} title={SCENES[id].title} preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(before)
 expect(localStorage.length).toBe(0)
})
it.each([0,1,2])('팔지 않는 상자 선택 %s의 원래 답변과 닫기를 보존한다',index=>{
 const id='ev:merchant:story:1',before=useGame.getState().game,scene=SCENES[id]
 act(()=>useGame.setState({game:{...before,scenes:[id]},modal:{kind:'scene',id}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:scene.title})).toHaveClass('authored-story-scene')
 fireEvent.click(screen.getByRole('button',{name:/^다음$/}))
 fireEvent.click(screen.getByRole('button',{name:scene.choices![index].label}))
 expect(screen.getByText(scene.choices![index].reply[0].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:/^닫기$/}))
 expect(useGame.getState().game.scenes).not.toContain(id)
 expect(useGame.getState().game.clock).toEqual(before.clock)
 expect(useGame.getState().game.inv).toEqual(before.inv)
})

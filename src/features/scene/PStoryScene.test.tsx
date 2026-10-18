import {act,fireEvent,render,screen} from '@testing-library/react'
import {CONTENT,neighborById} from '../../content/catalog'
import {sameLookCandidate} from '../../engine/game'
import * as art from '../../render/authored-story-art'
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
it.each(['romance2:penelope:friend','romance2:penelope','romance1:penelope','romance1:wendell','romance2:wendell'])('%s는 원래 대사와 닫기 흐름에서 시간·보상·관계를 보존한다',id=>{
 let before=useGame.getState().game
 if(id==='romance2:penelope'){
  const candidate={...before,avatar:{name:'필사가',look:'m' as const}}
  before={...candidate,avatar:{name:'필사가',look:sameLookCandidate(candidate,neighborById('penelope'))?'f':'m'}}
 }
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
it.each(['romance2:penelope:friend','romance2:penelope','romance1:penelope','romance1:wendell','romance2:wendell','ev:merchant:story:1'])('%s 미리보기는 게임 상태와 저장·앨범을 바꾸지 않는다',id=>{
 const before=useGame.getState().game
 render(<AuthoredStoryScene id={id} title={SCENES[id].title} preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(before)
 expect(localStorage.length).toBe(0)
})
it('게임이 친구 대사를 선택하면 친구의 표지 천 렌더러도 선택한다',()=>{
 const s=useGame.getState().game,candidate={...s,avatar:{name:'필사가',look:'m' as const}}
 const game={...candidate,avatar:{name:'필사가',look:(sameLookCandidate(candidate,neighborById('penelope'))?'m':'f') as 'm'|'f'},scenes:['romance2:penelope']}
 const frames:FrameRequestCallback[]=[],draw=vi.spyOn(art,'drawAuthoredStory')
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
 act(()=>useGame.setState({game,modal:{kind:'scene',id:'romance2:penelope'}}))
 render(<ModalLayer/>)
 act(()=>frames.pop()?.(1000))
 expect(draw.mock.calls.at(-1)?.[1]).toBe('romance2:penelope:friend')
 fireEvent.click(screen.getByRole('button',{name:/^다음$/}))
 expect(screen.getByText(SCENES['romance2:penelope:friend'].lines[1].text.replace('{player}','필사가'))).toBeInTheDocument()
 act(()=>frames.pop()?.(2000))
 expect(draw.mock.calls.at(-1)?.[1]).toBe('romance2:penelope:friend')
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

import {act,fireEvent,render,screen} from '@testing-library/react'
import {CONTENT} from '../../content/catalog'
import {SCENES} from '../../content/text'
import {legacyGame} from '../../engine/growth-test-support'
import {useGame} from '../../store/game-store'
import {ModalLayer} from '../ModalLayer'
import {AuthoredStoryScene} from './AuthoredStoryScene'
import {eventPreviewEntries} from './event-registry'

beforeEach(()=>{
 localStorage.clear()
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn()} as unknown as CanvasRenderingContext2D)
 const game=legacyGame(CONTENT)
 act(()=>useGame.setState({game:{...game,scenes:['shelved']},modal:{kind:'scene',id:'shelved'},piecePopups:[],copyResult:null,afterScene:null}))
})
afterEach(()=>vi.restoreAllMocks())
it('한 권 더는 게임에서도 새 렌더러를 사용하며 닫기로 보상과 시각을 바꾸지 않는다',()=>{
 const before=useGame.getState().game
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:SCENES.shelved.title})).toHaveClass('authored-story-scene')
 expect(screen.getByText(SCENES.shelved.lines[0].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 const after=useGame.getState().game
 for(const key of ['clock','inv','hearts','flags','shelved','bound','album'] as const)expect(after[key]).toEqual(before[key])
 expect(after.scenes).not.toContain('shelved')
})
it.each(['shelved','bookBound','ev:poppy:love:1','ev:juniper:story:2','ev:penelope:unpickTalk','ev:beekeeper:story:4'])('%s 미리보기는 게임과 앨범 저장을 변경하지 않는다',id=>{
 const before=useGame.getState().game
 render(<AuthoredStoryScene id={id} title={SCENES[id].title} preview><p>미리보기</p></AuthoredStoryScene>)
 expect(useGame.getState().game).toBe(before)
 expect(localStorage.length).toBe(0)
})
it('한 권을 다 필사했다는 아직 제본하지 않은 상태와 기존 한 줄을 보존한다',()=>{
 const before=useGame.getState().game,id='bookBound'
 act(()=>useGame.setState({game:{...before,scenes:[id]},modal:{kind:'scene',id}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:SCENES[id].title})).toHaveClass('authored-story-scene')
 expect(screen.getByText(SCENES[id].lines[0].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().game.bound).toEqual(before.bound)
 expect(useGame.getState().game.clock).toEqual(before.clock)
})
it.each([0,1])('하나 더 넣은 차의 선택 %s는 원래 답변과 관계 상태를 보존한다',choice=>{
 const id='ev:poppy:love:1',before=useGame.getState().game
 act(()=>useGame.setState({game:{...before,scenes:[id]},modal:{kind:'scene',id}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:SCENES[id].title})).toHaveClass('authored-story-scene')
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 fireEvent.click(screen.getByRole('button',{name:SCENES[id].choices![choice].label}))
 expect(screen.getByText(SCENES[id].choices![choice].reply[0].text)).toBeInTheDocument()
 expect(useGame.getState().game.clock).toEqual(before.clock)
 expect(useGame.getState().game.inv).toEqual(before.inv)
 expect(useGame.getState().game.hearts).toEqual(before.hearts)
})
it.each([0,1,2])('한 사람 앞에서의 선택 %s는 여섯 줄과 두 답변을 보존한다',choice=>{
 const id='ev:juniper:story:2',before=useGame.getState().game
 act(()=>useGame.setState({game:{...before,scenes:[id]},modal:{kind:'scene',id}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:SCENES[id].title})).toHaveClass('authored-story-scene')
 for(let i=1;i<SCENES[id].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 fireEvent.click(screen.getByRole('button',{name:SCENES[id].choices![choice].label}))
 for(const [i,line] of SCENES[id].choices![choice].reply.entries()){
  if(i)fireEvent.click(screen.getByRole('button',{name:'다음'}))
  expect(screen.getByText(line.text)).toBeInTheDocument()
 }
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().game.scenes).not.toContain(id)
 expect(useGame.getState().game.clock).toEqual(before.clock)
 expect(useGame.getState().game.inv).toEqual(before.inv)
 expect(useGame.getState().game.hearts).toEqual(before.hearts)
})
it.each([0,1])('한 올 선택 %s는 원래 대사·두 답변과 시간·소지품을 보존한다',choice=>{
 const id='ev:penelope:unpickTalk',before=useGame.getState().game
 act(()=>useGame.setState({game:{...before,scenes:[id]},modal:{kind:'scene',id}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:SCENES[id].title})).toHaveClass('authored-story-scene')
 expect(screen.getByText(SCENES[id].lines[0].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 fireEvent.click(screen.getByRole('button',{name:SCENES[id].choices![choice].label}))
 for(const [i,line] of SCENES[id].choices![choice].reply.entries()){
  if(i)fireEvent.click(screen.getByRole('button',{name:'다음'}))
  expect(screen.getByText(line.text)).toBeInTheDocument()
 }
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().game.clock).toEqual(before.clock)
 expect(useGame.getState().game.inv).toEqual(before.inv)
 expect(useGame.getState().game.hearts).toEqual(before.hearts)
})
it.each([0,1,2])('한 장의 관찰 선택 %s는 네 줄과 각 한 답변을 보존한다',choice=>{
 const id='ev:beekeeper:story:4',before=useGame.getState().game
 act(()=>useGame.setState({game:{...before,scenes:[id]},modal:{kind:'scene',id}}))
 render(<ModalLayer/>)
 expect(screen.getByRole('dialog',{name:SCENES[id].title})).toHaveClass('authored-story-scene')
 for(let i=1;i<SCENES[id].lines.length;i++)fireEvent.click(screen.getByRole('button',{name:'다음'}))
 fireEvent.click(screen.getByRole('button',{name:SCENES[id].choices![choice].label}))
 expect(screen.getByText(SCENES[id].choices![choice].reply[0].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(useGame.getState().game.clock).toEqual(before.clock)
 expect(useGame.getState().game.inv).toEqual(before.inv)
 expect(useGame.getState().game.hearts).toEqual(before.hearts)
 expect(useGame.getState().game.scenes).not.toContain(id)
})
it('실제 등록 목록에서 ㅎ 담당 범위를 읽는다',()=>{
 const entries=eventPreviewEntries().filter(e=>/^[하-힣]/.test(e.title)).sort((a,b)=>a.title.localeCompare(b.title,'ko'))
 process.stdout.write('H_EVENT_INVENTORY '+JSON.stringify(entries.map(({id,title,authored,kind})=>({id,title,authored,kind})))+'\n')
 expect(entries.find(e=>e.id==='shelved')?.authored).toBe(true)
})

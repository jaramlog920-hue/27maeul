import {act,fireEvent,render,screen} from '@testing-library/react'
import {freshStats} from '../../engine/stats'
import {CONTENT} from '../../content/catalog'
import {SCENES} from '../../content/text'
import {legacyGame} from '../../engine/growth-test-support'
import {useGame} from '../../store/game-store'
import {ModalLayer} from '../ModalLayer'
import {AuthoredStoryScene} from './AuthoredStoryScene'
import {eventPreviewEntries} from './event-registry'

const id='ev:wendell:home:2'
beforeEach(()=>{
 localStorage.clear()
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn()} as unknown as CanvasRenderingContext2D)
 const game=legacyGame(CONTENT)
 useGame.setState({game:{...game,scenes:[id],romance:{...game.romance,partner:'wendell',stage:'married'}},modal:{kind:'scene',id},piecePopups:[],copyResult:null,afterScene:null})
})
afterEach(()=>vi.restoreAllMocks())
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

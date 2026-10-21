import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { itemName, SCENES, T } from '../../content/text'
import { newGame } from '../../engine/game'
import { extendTurns, NEW_BOARD } from '../../engine/trip-board'
import { useGame } from '../../store/game-store'
import { TravelView } from './TravelView'
import * as authoredArt from '../../render/authored-story-art'

vi.mock('../../shared/ItemIcon', () => ({ ItemIcon: () => null }))
beforeEach(()=>{
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn()} as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,trip')
})
afterEach(()=>vi.restoreAllMocks())
function readStory() {
  while(screen.queryByRole('button',{name:T.ui.next}))fireEvent.click(screen.getByRole('button',{name:T.ui.next}))
  const shop=screen.queryByRole('button',{name:'가게 보기'});if(shop)fireEvent.click(shop)
}

it('추가 주사위 비용 때문에 못 사는 물건은 귀환을 막고, 사지 않는 귀환은 허용한다', () => {
  const game = { ...newGame(CONTENT), coins: 90, scenes: [] }
  const rewards = extendTurns(NEW_BOARD, 15).rewards
  useGame.getState().load(game)
  useGame.setState({ modal: { kind: 'travel', dest: 'harbor', rewards } })
  render(<TravelView dest="harbor" rewards={rewards} />)
  readStory()
  expect(screen.getByText(/사용 가능한 닢 80/)).toBeInTheDocument()
  // 희귀품 가게는 아이콘 칸 — 칸을 고르고 '담기' (2026-10-12)
  fireEvent.click(screen.getByRole('button', { name: itemName('finePapyrus') }))
  fireEvent.click(screen.getByRole('button', { name: '담기' }))
  expect(screen.getByRole('button', { name: '하룻밤 묵고 돌아가기' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: '사지 않고 돌아가기' }))
  expect(useGame.getState().game.coins).toBe(5)
  expect(useGame.getState().game.flags['trip:harbor']).toBe(1)
})

it('여행에서 얻은 닢도 정산 후 사용 가능한 금액에 포함한다', () => {
  useGame.getState().load({ ...newGame(CONTENT), coins: 75, scenes: [] })
  const rewards = [{ kind: 'coins' as const, n: 15 }]
  useGame.setState({ modal: { kind: 'travel', dest: 'harbor', rewards } })
  render(<TravelView dest="harbor" rewards={rewards} />)
  readStory()
  // 희귀품 가게는 아이콘 칸 — 칸을 고르고 '담기' (2026-10-12)
  fireEvent.click(screen.getByRole('button', { name: itemName('finePapyrus') }))
  fireEvent.click(screen.getByRole('button', { name: '담기' }))
  const back = screen.getByRole('button', { name: '하룻밤 묵고 돌아가기' })
  expect(back).not.toBeDisabled()
  fireEvent.click(back)
  expect(useGame.getState().game.coins).toBe(0)
  expect(useGame.getState().game.inv.finePapyrus).toBe(1)
})

it('실제 항구 첫 방문도 네 원문 단계와 같은 도트를 보여 주고 정산 전 게임 상태를 바꾸지 않는다',()=>{
  useGame.getState().load({...newGame(CONTENT),coins:75,scenes:[]})
  const game=useGame.getState().game,draw=vi.spyOn(authoredArt,'drawAuthoredStory'),frames:FrameRequestCallback[]=[]
  vi.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length})
  useGame.setState({modal:{kind:'travel',dest:'harbor',rewards:[]}})
  render(<TravelView dest="harbor" rewards={[]}/>)
  expect(screen.getByRole('dialog',{name:'바닷가 항구 마을'})).toHaveClass('authored-story-scene')
  for(let page=0;page<SCENES['trip:harbor'].lines.length;page++){
    expect(screen.getByText(SCENES['trip:harbor'].lines[page].text)).toBeInTheDocument()
    act(()=>frames.slice().forEach(frame=>frame(1000+page*100)))
    expect(draw.mock.calls.at(-1)?.[8]).toBe(page)
    expect(useGame.getState().game).toBe(game)
    fireEvent.click(screen.getByRole('button',{name:page<3?T.ui.next:'가게 보기'}))
  }
  expect(draw.mock.calls.some(c=>c[1]==='trip:harbor'&&c[8]===3)).toBe(true)
  expect(screen.getByRole('button',{name:'하룻밤 묵고 돌아가기'})).toBeEnabled()
  fireEvent.click(screen.getByRole('button',{name:'하룻밤 묵고 돌아가기'}))
  const after=useGame.getState().game
  expect(after.coins).toBe(0);expect(after.inv.bread??0).toBe((game.inv.bread??0)+1)
  expect(after.flags['trip:harbor']).toBe(1);expect(after.clock.day).toBe(game.clock.day+1)
})

it('다시 간 항구는 첫 방문 사건 대신 다시 간 날의 이야기, 이야기를 다 들은 뒤로는 바로 가게로 간다',()=>{
  const s=newGame(CONTENT)
  useGame.getState().load({...s,coins:75,flags:{...s.flags,'trip:harbor':1},scenes:[]})
  const {unmount}=render(<TravelView dest="harbor" rewards={[]}/>)
  expect(screen.getByText(/다시 찾은 항구/)).toBeInTheDocument()
  expect(screen.queryByText(/한나절을 꼬박/)).toBeNull()
  unmount()
  useGame.getState().load({...s,coins:75,flags:{...s.flags,'trip:harbor':4},scenes:[]})
  render(<TravelView dest="harbor" rewards={[]}/>)
  expect(screen.queryByRole('button',{name:'가게 보기'})).toBeNull()
  expect(screen.getByRole('button',{name:'하룻밤 묵고 돌아가기'})).toBeEnabled()
})

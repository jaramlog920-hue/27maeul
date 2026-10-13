import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT, PEOPLE } from '../../content/catalog'
import { legacyGame } from '../../engine/growth-test-support'
import { clearSky } from '../../engine/game'
import { onceKey } from '../../engine/stories'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { LandscapeScene } from './StarsScene'
import { SCENES } from '../../content/text'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn() } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,landscape')
  useGame.setState({ game: { ...legacyGame(CONTENT), scenes: [] }, modal: null, piecePopups: [], copyResult: null, afterScene: null })
})
afterEach(() => vi.restoreAllMocks())

it.each(['stars', 'sunset'] as const)('%s은 전체 화면 풍경으로 열리고 돌아오면 앨범과 기록을 남긴다', kind => {
  const game = useGame.getState().game
  act(() => useGame.setState({ game: { ...game, scenes: [kind] }, modal: { kind: 'scene', id: kind } }))
  render(<ModalLayer />)
  expect(screen.getByRole('dialog')).toHaveClass('stars-scene')
  expect(screen.getByRole('dialog')).toHaveAccessibleName(kind === 'stars' ? '별 보는 밤' : '호숫가 노을')
  expect(localStorage.getItem(`twenty-seven/album/${kind}`)).toBe('data:image/png;base64,landscape')
  fireEvent.click(screen.getByRole('button', { name: /마을로 돌아가기|완성 기록 보기/ }))
  expect(useGame.getState().modal).toBeNull()
  expect(useGame.getState().game.album.some(a => a.id === kind)).toBe(true)
  expect(useGame.getState().game.scenes).not.toContain(kind)
})

it('미리보기는 실제 저장의 앨범을 바꾸지 않는다', () => {
  const finish = vi.fn()
  render(<LandscapeScene kind="sunset" preview onFinish={finish} />)
  expect(localStorage.getItem('twenty-seven/album/sunset')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: /다음 장면/ }))
  expect(finish).toHaveBeenCalledOnce()
})

it('이미 본 노을도 다시 열리지만 같은 날 운 보상은 중복되지 않는다', () => {
  const s = useGame.getState().game
  const day = Array.from({ length: 30 }, (_, i) => i + 1).find(clearSky)!
  const game = { ...s, clock: { day, minute: 18 * 60 }, flags: { ...s.flags, sunsets: 1, [onceKey('sunset', day)]: 1 } }
  act(() => useGame.setState({ game }))
  act(() => useGame.getState().watchSunset())
  expect(useGame.getState().modal).toEqual({ kind: 'scene', id: 'sunset' })
  expect(useGame.getState().game.stats.luck).toEqual(game.stats.luck)
})

it.each([
  ['bibleLastLetter', '예순여섯 권의 마지막 책'],
  ['firstMorning', '결혼 후 첫 아침'], ['spouseReturn', '배우자가 돌아오는 저녁'],
  ['childFirstHelp', '아이가 처음 도와준 날'], ['fullLibrary', '스물일곱 권이 모인 날'], ['lastManuscript', '스물일곱 권의 마지막 글자'],
  ['familyWinter', '가족의 겨울밤'], ['springWalk', '봄날 꽃길 산책'],
  ['summerCreek', '여름날 물가에서 쉬기'], ['autumnPath', '가을 낙엽길'],
  ['rainbowRest', '비 사이로 뜬 무지개'], ['rainbow', '비 사이로 뜬 무지개'], ['afterCopy', '필사를 마친 늦은 밤'],
  ['rainCopy', '비 오는 밤 필사'], ['bookBound', '한 권을 마친 순간'],
  ['dateSunset', '둘이 보는 노을'], ['date:sunset:0', '둘이 보는 노을'],
  ['babySleep', '아기가 잠든 밤'], ['firstSnow', '첫눈 오는 마을'],
  ['firstShelved', '서고에 책 한 권'], ['shelved', '서고에 책 한 권'],
  ['marketEvening', '장날의 저녁 등불'], ['childWalks', '아기의 첫걸음'], ['home:1', '집을 넓힌 첫날'],
] as const)('%s은 도트 장면으로 열리고 기존 완료 기록을 이어간다', (id, title) => {
  const s = useGame.getState().game
  act(() => useGame.setState({ game: { ...s, scenes: [id] }, modal: { kind: 'scene', id } }))
  render(<ModalLayer />)
  expect(screen.getByRole('dialog')).toHaveAccessibleName(title)
  fireEvent.click(screen.getByRole('button', { name: /마을로 돌아가기|완성 기록 보기/ }))
  expect(useGame.getState().modal).toEqual(id === 'fullLibrary' ? { kind: 'shelfDone' } : null)
  expect(useGame.getState().game.scenes).not.toContain(id)
  if (SCENES[id].album) expect(useGame.getState().game.album.some(a => a.id === id)).toBe(true)
})

it.each([true, false])('고백 도트 배경에서 친구 선택=%s와 수락 대사가 그대로 이어진다', friends => {
  const id = 'ev:rudy:confess'
  const s = useGame.getState().game
  const event = PEOPLE.people.rudy.events!.find(e => e.id === 'rudy:confess')!
  act(() => useGame.setState({ game: { ...s, hearts: { rudy: 80 }, scenes: [id] }, modal: { kind: 'scene', id } }))
  render(<ModalLayer />)
  expect(screen.getByRole('dialog')).toHaveClass('stars-scene')
  for (let i = 1; i < SCENES[id].lines.length; i++) fireEvent.click(screen.getByRole('button', { name: '다음' }))
  const choice = event.choices!.find(c => friends ? c.stayFriends : !c.stayFriends)!
  fireEvent.click(screen.getByRole('button', { name: choice.label }))
  expect(useGame.getState().game.romance.partner).toBe(friends ? null : 'rudy')
  expect(useGame.getState().modal?.kind).toBe('scene')
})


it('완성 장면을 바로 넘겨도 책장 앞 기념사진을 남기고 완성 기록을 보여준다', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function(this: HTMLCanvasElement) {
    return this.isConnected ? 'data:image/png;base64,opening' : 'data:image/png;base64,group-photo'
  })
  const s = useGame.getState().game
  act(() => useGame.setState({ game: { ...s, scenes: ['fullLibrary', 'newlandGift'] }, modal: { kind: 'scene', id: 'fullLibrary' } }))
  render(<ModalLayer />)
  expect(localStorage.getItem('twenty-seven/album/fullLibrary')).toBe('data:image/png;base64,group-photo')
  fireEvent.click(screen.getByRole('button', { name: /마을로 돌아가기|완성 기록 보기/ }))
  expect(useGame.getState().modal).toEqual({ kind: 'shelfDone' })
  expect(useGame.getState().game.scenes).toContain('newlandGift')
  expect(useGame.getState().game.album.some(a => a.id === 'fullLibrary')).toBe(true)
})

it('앨범에서 다시 보는 완성 장면은 완성 기록 창을 다시 예약하지 않는다', () => {
  act(() => useGame.setState({ modal: { kind: 'scene', id: 'fullLibrary' } }))
  render(<ModalLayer />)
  fireEvent.click(screen.getByRole('button', { name: /마을로 돌아가기|완성 기록 보기/ }))
  expect(useGame.getState().modal).toBeNull()
})


it('나중에 다시 봐도 완성 당시의 기념사진을 바꾸지 않는다', () => {
  localStorage.setItem('twenty-seven/album/fullLibrary', 'data:image/png;base64,original-family')
  const game = useGame.getState().game
  act(() => useGame.setState({ game: { ...game, album: [{ id: 'fullLibrary', day: 1 }] }, modal: { kind: 'scene', id: 'fullLibrary' } }))
  render(<ModalLayer />)
  fireEvent.click(screen.getByRole('button', { name: '장면 다시 보기' }))
  expect(localStorage.getItem('twenty-seven/album/fullLibrary')).toBe('data:image/png;base64,original-family')
})


it('66권 엔딩은 사진을 보존하고 추억·아침을 거쳐 다음 날 집으로 돌아간다', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function(this: HTMLCanvasElement) {
    return this.isConnected ? 'data:image/png;base64,desk' : 'data:image/png;base64,two-libraries'
  })
  const game = useGame.getState().game
  act(() => useGame.setState({ game: { ...game, scenes: ['completeBible'] }, modal: { kind: 'scene', id: 'completeBible' } }))
  render(<ModalLayer />)
  expect(localStorage.getItem('twenty-seven/album/completeBible')).toBe('data:image/png;base64,two-libraries')
  fireEvent.click(screen.getByRole('button', { name: /추억 앨범 펼치기/ }))
  expect(screen.getByRole('region',{name:'엔딩 추억 앨범'})).toBeInTheDocument()
  expect(useGame.getState().game.clock.day).toBe(game.clock.day)
  fireEvent.click(screen.getByRole('button', { name: /다음 날 아침으로/ }))
  fireEvent.click(screen.getByRole('button', { name: /마을로 돌아가기/ }))
  expect(useGame.getState().modal).toBeNull()
  expect(useGame.getState().game.clock.day).toBe(game.clock.day+1)
  expect(useGame.getState().game.map).toBe('village')
  expect(useGame.getState().game.album.some(a => a.id === 'completeBible')).toBe(true)
})

it('엔딩 다시보기와 미리보기는 날짜와 완료 표식을 바꾸지 않는다',()=>{
  const s=useGame.getState().game
  act(()=>useGame.setState({game:{...s,scenes:[],flags:{...s.flags,bibleEndingSeen:s.clock.day}},modal:{kind:'scene',id:'completeBible'}}))
  render(<ModalLayer/>)
  fireEvent.click(screen.getByRole('button',{name:/추억 앨범 펼치기/}))
  fireEvent.click(screen.getByRole('button',{name:/다음 날 아침으로/}))
  fireEvent.click(screen.getByRole('button',{name:/마을로 돌아가기/}))
  expect(useGame.getState().game.clock).toEqual(s.clock)
})

it('실제 엔딩 앨범은 겪은 기억과 완성 당시 필사 기록만 사용한다',()=>{
  const s=useGame.getState().game
  act(()=>useGame.setState({game:{...s,album:[{id:'home:1',day:5}],flags:{...s.flags,bibleCompletedDay:10,bibleEndingVerses:777,bibleEndingDays:8},copyStats:{...s.copyStats,verses:999},scenes:[]},modal:{kind:'scene',id:'completeBible'}}))
  render(<ModalLayer/>)
  fireEvent.click(screen.getByRole('button',{name:/추억 앨범 펼치기/}))
  expect(screen.getByText(/777절/)).toBeInTheDocument()
  expect(screen.queryByText(/999절/)).not.toBeInTheDocument()
  expect(screen.getByText(/5일째/)).toBeInTheDocument()
  expect(screen.queryByText(/미리보기 예시/)).not.toBeInTheDocument()
})


it.each(['readingFinished','firstDinner','coverFinished','childLetterReceived','facilityFinished'] as const)('%s 미리보기는 앨범과 진행을 저장하지 않는다', kind => {
  const before = useGame.getState().game
  const finish = vi.fn()
  render(<LandscapeScene kind={kind} preview previewAt={8} finishLabel="목록으로 돌아가기" onFinish={finish}/>)
  expect(screen.getByRole('dialog')).toHaveClass('stars-scene')
  expect(localStorage.length).toBe(0)
  fireEvent.click(screen.getByRole('button', {name:'목록으로 돌아가기'}))
  expect(finish).toHaveBeenCalledOnce()
  expect(useGame.getState().game).toBe(before)
})

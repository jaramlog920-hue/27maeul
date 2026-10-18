import { act, fireEvent, render, screen } from '@testing-library/react'
import { App } from './App'
import { useGame } from '../store/game-store'
import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { activeSlot, saveGame, serialize, setActiveSlot, slotKey } from '../engine/save'
import * as saves from '../engine/save'

describe('App 시작 화면', () => {
  beforeEach(() => {
    localStorage.clear()
    setActiveSlot('1')
  })

  afterEach(() => vi.restoreAllMocks())

  it('제목을 보이고, 삭제한 안내와 누가복음 첫머리는 싣지 않는다', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '스물일곱 권의 마을' })).toBeInTheDocument()
    // 주인공은 누가복음을 쓴 사람이 아니므로 시작 화면에 눅 1:1-4를 두지 않는다
    expect(screen.queryByLabelText('성경 본문 눅 1:1-4')).toBeNull()
    expect(screen.queryByText(/이 마을과 이웃은 게임을 위해 만든 것입니다/)).toBeNull()
    expect(screen.getByRole('button', { name: '새로 시작하기' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '불러오기' })).toBeNull()
    expect(screen.queryByRole('button', { name: '이어하기' })).toBeNull()
  })

  it('새로 시작하기 → 주인공 고르기(모습·이름) → 게임 화면', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '새로 시작하기' }))
    expect(screen.getByRole('heading', { name: '어떤 사람으로 살까요?' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '하늘' } })
    fireEvent.click(screen.getByRole('button', { name: '뒷머리 다음' }))
    fireEvent.click(screen.getByRole('button', { name: '뒷머리 다음' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '이대로 시작' })) })
    expect(screen.queryByRole('heading', { name: '어떤 사람으로 살까요?' })).toBeNull()
    expect(useGame.getState().game.avatar).toMatchObject({ look: 'f', name: '하늘', hairBack: 3 })
  })

  it('깨진 저장만 있으면 불러오기가 보이지 않는다 (저장 칸 여러 개)', () => {
    localStorage.setItem('twenty-seven/save', 'broken')
    const { unmount } = render(<App />)
    expect(screen.queryByRole('button', { name: '불러오기' })).toBeNull() // 깨진 저장은 무시
    expect(screen.queryByRole('button', { name: '이어하기' })).toBeNull()
    unmount()
  })

  it('이어하기는 목록 없이 마지막으로 하던 칸의 최신 진행을 연다', async () => {
    const running = { ...newGame(CONTENT, { look: 'f', name: '하늘' }), clock: { day: 7, minute: 650 }, coins: 123 }
    setActiveSlot('2')
    saveGame(running)
    // 다른 칸의 저장 시각이 더 최근이어도 마지막으로 플레이한 칸을 이어 간다.
    localStorage.setItem(slotKey('1'), serialize(newGame(CONTENT, { look: 'm', name: '다른기록' })))
    localStorage.setItem('twenty-seven/save-meta/1', JSON.stringify({ savedAt: Date.now() + 10000 }))
    render(<App />)
    expect(screen.getByRole('button', { name: '불러오기' })).toBeInTheDocument()
    saveGame({ ...running, coins: 321, clock: { day: 7, minute: 700 } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '이어하기' })) })
    expect(screen.queryByRole('dialog', { name: '불러오기' })).toBeNull()
    expect(screen.queryByRole('heading', { name: '스물일곱 권의 마을' })).toBeNull()
    expect(useGame.getState().game).toMatchObject({ avatar: { name: '하늘' }, coins: 321, clock: { day: 7, minute: 700 } })
    expect(activeSlot()).toBe('2')
  })

  it('불러오기는 저장 목록을 열고 선택한 다른 기록으로 시작한다', async () => {
    saveGame(newGame(CONTENT, { look: 'f', name: '하늘' }))
    setActiveSlot('2')
    saveGame(newGame(CONTENT, { look: 'm', name: '두리' }))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '불러오기' }))
    expect(screen.getByRole('dialog', { name: '불러오기' })).toBeInTheDocument()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /하늘/ })) })
    expect(useGame.getState().game.avatar?.name).toBe('하늘')
    expect(activeSlot()).toBe('1')
  })

  it('마지막으로 하던 칸이 없으면 남은 기록을 이어 가고 저장할 칸도 맞춘다', async () => {
    setActiveSlot('2')
    saveGame(newGame(CONTENT, { look: 'f', name: '남은기록' }))
    setActiveSlot('1')
    render(<App />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '이어하기' })) })
    expect(useGame.getState().game.avatar?.name).toBe('남은기록')
    expect(activeSlot()).toBe('2')
    saveGame({ ...useGame.getState().game, coins: 456 })
    expect(JSON.parse(localStorage.getItem(slotKey('2'))!).coins).toBe(456)
    expect(localStorage.getItem(slotKey('1'))).toBeNull()
  })

  it('불러오기에서 마지막 기록을 지우고 돌아오면 이어하기도 사라진다', async () => {
    saveGame(newGame(CONTENT, { look: 'f', name: '하늘' }))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '불러오기' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '지우기' })) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '지우기' })) })
    fireEvent.click(screen.getByRole('button', { name: '돌아가기' }))
    expect(screen.queryByRole('button', { name: '이어하기' })).toBeNull()
    expect(screen.queryByRole('button', { name: '불러오기' })).toBeNull()
    expect(screen.getByRole('button', { name: '새로 시작하기' })).toBeInTheDocument()
  })

  it('새 칸의 저장이 끝나기 전이나 저장에 실패하면 게임으로 넘어가지 않고 다시 시도할 수 있다', async () => {
    let complete: (slot: string | null) => void = () => {}
    const create = vi.spyOn(saves, 'createSaveAsync').mockImplementationOnce(() => new Promise(resolve => { complete = resolve }))
    const before = useGame.getState().game
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '새로 시작하기' }))
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '다시 시도' } })
    fireEvent.click(screen.getByRole('button', { name: '이대로 시작' }))
    expect(screen.getByRole('status')).toHaveTextContent('저장을 확인하는 중이에요.')
    expect(screen.getByRole('heading', { name: '어떤 사람으로 살까요?' })).toBeInTheDocument()
    expect(useGame.getState().game).toBe(before)

    await act(async () => { complete(null) })
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole('heading', { name: '어떤 사람으로 살까요?' })).toBeInTheDocument()
    expect(useGame.getState().game).toBe(before)
    expect(create).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(slotKey('1'))).toBeNull()

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '이대로 시작' })) })
    expect(screen.queryByRole('heading', { name: '어떤 사람으로 살까요?' })).toBeNull()
    expect(useGame.getState().game.avatar?.name).toBe('다시 시도')
    expect(create).toHaveBeenCalledTimes(2)
  })

  it('불러올 칸 선택을 저장하지 못하면 제목에 머물고 재시도 후에만 해당 칸으로 들어간다', async () => {
    saveGame(newGame(CONTENT, { look: 'f', name: '불러올 기록' }))
    setActiveSlot('2')
    const before = useGame.getState().game
    const select = vi.spyOn(saves, 'selectSaveAsync').mockResolvedValueOnce(false)
    render(<App />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '이어하기' })) })
    expect(screen.getByRole('heading', { name: '스물일곱 권의 마을' })).toBeInTheDocument()
    expect(useGame.getState().game).toBe(before)
    expect(activeSlot()).toBe('2')
    expect(select).toHaveBeenCalledWith('1')

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '이어하기' })) })
    expect(screen.queryByRole('heading', { name: '스물일곱 권의 마을' })).toBeNull()
    expect(useGame.getState().game.avatar?.name).toBe('불러올 기록')
    expect(activeSlot()).toBe('1')
    expect(select).toHaveBeenCalledTimes(2)
  })
})

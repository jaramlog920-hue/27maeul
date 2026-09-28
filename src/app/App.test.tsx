import { fireEvent, render, screen } from '@testing-library/react'
import { App } from './App'
import { useGame } from '../store/game-store'

describe('App 시작 화면', () => {
  beforeEach(() => localStorage.clear())

  it('제목과 게임 안내를 보이고, 누가복음 첫머리는 따로 싣지 않는다', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '스물일곱 권의 마을' })).toBeInTheDocument()
    // 주인공은 누가복음을 쓴 사람이 아니므로 시작 화면에 눅 1:1-4를 두지 않는다
    expect(screen.queryByLabelText('성경 본문 눅 1:1-4')).toBeNull()
    expect(screen.getByText(/이 마을과 이웃은 게임을 위해 만든 것입니다/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '시작하기' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '이어하기' })).toBeNull()
  })

  it('시작하기 → 주인공 고르기(모습·이름) → 게임 화면', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '시작하기' }))
    expect(screen.getByRole('heading', { name: '어떤 사람으로 살까요?' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '하늘' } })
    fireEvent.click(screen.getByRole('button', { name: '뒷머리 다음' }))
    fireEvent.click(screen.getByRole('button', { name: '뒷머리 다음' }))
    fireEvent.click(screen.getByRole('button', { name: '이대로 시작' }))
    expect(screen.queryByRole('heading', { name: '어떤 사람으로 살까요?' })).toBeNull()
    expect(useGame.getState().game.avatar).toMatchObject({ look: 'f', name: '하늘', hairBack: 3 })
  })

  it('저장이 있으면 이어하기가 보인다', () => {
    localStorage.setItem('twenty-seven/save', 'broken')
    const { unmount } = render(<App />)
    expect(screen.queryByRole('button', { name: '이어하기' })).toBeNull() // 깨진 저장은 무시
    unmount()
  })
})

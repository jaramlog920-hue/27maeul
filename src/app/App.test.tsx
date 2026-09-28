import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App 시작 화면', () => {
  beforeEach(() => localStorage.clear())

  it('눅 1:1-4 본문과 게임 안내를 따로 보인다', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '스물일곱 권의 마을' })).toBeInTheDocument()
    // 첫머리는 접힌 채 들어 있다 (펼치면 보임)
    expect(screen.getByText('누가복음의 첫머리 보기 (눅 1:1-4)')).toBeInTheDocument()
    expect(screen.getByLabelText('성경 본문 눅 1:1-4')).toHaveTextContent('데오빌로 각하에게 차례대로 써 보내는 것이 좋은줄 알았노니')
    expect(screen.getByText(/이 마을과 이웃은 게임을 위해 만든 것입니다/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '시작하기' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '이어하기' })).toBeNull()
  })

  it('저장이 있으면 이어하기가 보인다', () => {
    localStorage.setItem('twenty-seven/save', 'broken')
    const { unmount } = render(<App />)
    expect(screen.queryByRole('button', { name: '이어하기' })).toBeNull() // 깨진 저장은 무시
    unmount()
  })
})

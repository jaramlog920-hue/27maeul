// 편지 나르는 이웃: 아침 방문 말이 있어도 "편지가 한 통 왔어요" 알림이 가려지지 않는다 (계획 7 작업 2 검토 이월, 계획 14 작업 5 드문 편지)
import { render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { newGame } from '../../engine/game'
import { POSTMAN } from '../../engine/post'
import { postLine, useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

/** 오늘 편지(말씀 조각 하나)가 온 날 */
function withPost() {
  const s = newGame(CONTENT)
  return { ...s, scenes: [], post: ['rom-001'] }
}

describe('편지 나르는 이웃과의 대화', () => {
  it('방문 말과 편지 알림이 둘 다 보이고, 편지 받기 버튼이 있다', () => {
    const game = withPost()
    const post = postLine(game, POSTMAN)!
    expect(post).toBe(T.word.letterBring)
    useGame.setState({ game, modal: { kind: 'talk', neighborId: POSTMAN, line: '아침 방문 인사' } })
    render(<ModalLayer />)
    expect(screen.getByText('아침 방문 인사')).toBeInTheDocument()
    expect(screen.getByText(post)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '편지 받기' })).toBeInTheDocument()
  })

  it('말이 곧 편지 알림이면 한 번만 보인다', () => {
    const game = withPost()
    const post = postLine(game, POSTMAN)!
    useGame.setState({ game, modal: { kind: 'talk', neighborId: POSTMAN, line: post } })
    render(<ModalLayer />)
    expect(screen.getAllByText(post)).toHaveLength(1)
  })
})

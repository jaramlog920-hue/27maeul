// 빈칸 퀴즈 화면 (2026-10-14): 말씀 메뉴 탭에서 다섯 문제를 풀면 닢을 받고, 한 판 더 할 수 있다
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { BLANK_COIN } from '../../engine/blank-quiz'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

describe('빈칸 퀴즈 화면', () => {
  it('말씀 메뉴의 빈칸 퀴즈 탭에서 풀고 닢을 받는다', async () => {
    const g = newGame(CONTENT)
    useGame.setState({ game: { ...g, scenes: [], coins: 0, copy: { ...g.copy, copied: { lk: [1, 2] } } }, modal: null })
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'word' }))
    fireEvent.click(screen.getByRole('tab', { name: '빈칸 퀴즈' }))
    let right = 0
    for (let i = 0; i < 5; i++) {
      const group = await screen.findByRole('group', { name: '보기' })
      const first = within(group).getAllByRole('button')[0]
      fireEvent.click(first)
      if (screen.queryByText('맞았어요.')) right++
      fireEvent.click(screen.getByRole('button', { name: i < 4 ? '다음 문제' : '마치기' }))
    }
    expect(useGame.getState().game.coins).toBeGreaterThanOrEqual(right * BLANK_COIN)
    expect(screen.getByRole('button', { name: '한 판 더' })).toBeInTheDocument()
  })
})

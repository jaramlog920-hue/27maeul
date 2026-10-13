import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ModalLayer } from '../ModalLayer'
import { FEATURE_RULES } from '../../engine/feature-rules'
import { useGame } from '../../store/game-store'

describe('도움말 › 열리는 때 (2026-10-14)', () => {
  it('목차 → 장 → 뒤로 넘기면 마지막 쪽이 열리는 때', () => {
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'guide' }))
    fireEvent.click(screen.getByRole('button', { name: '필사' }))
    expect(screen.getByRole('region', { name: '필사' })).toHaveTextContent('5분')
    for (let i = 0; i < 10; i++) {
      const next = screen.getByRole('button', { name: '뒤 ›' })
      if ((next as HTMLButtonElement).disabled) break
      fireEvent.click(next)
    }
    expect(screen.getByRole('region', { name: '열리는 때' })).toBeInTheDocument()
  })
  it('모든 기능의 해금 조건과 장소·이웃이 열리는 권수를 보여 준다', () => {
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'guide' }))
    fireEvent.click(screen.getByRole('button', { name: '열리는 때' }))
    const table = screen.getByRole('table', { name: '기능이 열리는 때' })
    expect(within(table).getAllByRole('row')).toHaveLength(Object.keys(FEATURE_RULES).length + 1)
    expect(within(table).getByRole('row', { name: /주민 자율 생활/ })).toHaveTextContent('신약 75장')
    expect(within(table).getByRole('row', { name: /집 꾸미기/ })).toHaveTextContent('신약 1장 체험 · 신약 5장')
    expect(within(table).getByRole('row', { name: /마무리/ })).toHaveTextContent('신약 27권')
    const places = screen.getByRole('table', { name: '장소가 열리는 때' })
    expect(within(places).getByRole('row', { name: /포도원/ })).toHaveTextContent('5권')
    expect(within(places).getByRole('row', { name: /세이지/ })).toHaveTextContent('2권')
  })
})

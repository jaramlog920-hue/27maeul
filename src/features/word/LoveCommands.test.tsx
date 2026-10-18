// 말씀 메뉴 › 사랑의 계명 (2026-10-14): 세 갈래, 마친 장의 계명만 밝아지고 누르면 본문
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

describe('사랑의 계명 탭', () => {
  it('세 갈래가 보이고, 요한복음 13장을 마치면 새 계명이 밝아져 누르면 본문이 나온다', async () => {
    const g = newGame(CONTENT)
    useGame.setState({ game: { ...g, scenes: [], progress: { ...g.progress, jn: { ...g.progress.jn, completed: [13] } } }, modal: null })
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'word' }))
    fireEvent.click(screen.getByRole('tab', { name: '사랑의 계명' }))
    for (const name of ['크고 첫째 되는 계명', '하나님 사랑', '이웃 사랑']) expect(await screen.findByRole('region', { name })).toBeInTheDocument()
    const neighbor = screen.getByRole('region', { name: '이웃 사랑' })
    const card = await within(neighbor).findByRole('button', { name: /요 13:34/ })
    fireEvent.click(card)
    expect(within(neighbor).getByText(/새 계명을 너희에게 주노니/)).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: '크고 첫째 되는 계명' })).getAllByLabelText('아직 발견하지 않은 계명').length).toBeGreaterThan(0)
  })
})

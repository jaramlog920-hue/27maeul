// 가방에 모르는 아이템이 있어도 가방 창이 열린다 (2026-10-18 감사 M-21 — 콘텐츠에서 지운 아이템이 옛 저장에 남은 경우)
import { act, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import type { ItemId } from '../../engine/types'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

it('모르는 아이템은 id 그대로 보이고 창은 정상으로 열린다', async () => {
  localStorage.clear()
  useGame.setState({ game: { ...newGame(CONTENT), scenes: [], inv: { bread: 1, ['gone-item' as ItemId]: 2 } }, modal: null, piecePopups: [] })
  render(<ModalLayer />)
  act(() => useGame.getState().open({ kind: 'bag' }))
  expect(await screen.findByRole('button', { name: 'gone-item 2' })).toBeInTheDocument()
  expect(screen.queryByText('화면을 불러오지 못했어요')).toBeNull()
})

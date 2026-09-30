import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ModalLayer } from '../ModalLayer'
import { useGame } from '../../store/game-store'

describe('마을 지도', () => {
  it('설정에서 열면 마을 전체와 장소 이름, 내 자리가 보인다', () => {
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'villageMap' }))
    expect(screen.getByRole('dialog', { name: '마을 지도' })).toBeInTheDocument()
    expect(screen.getByText('서고')).toBeInTheDocument()
    expect(screen.getByText('광장')).toBeInTheDocument()
  })
})

import { act, fireEvent, render, screen } from '@testing-library/react'
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
  it('잠긴 집 자물쇠: 2권은 약방 하나, 베 짜는 집은 7권 (2026-10-05)', () => {
    const { container } = render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'villageMap' }))
    const locks = [...container.querySelectorAll('.vmap-label.locked')].map((e) => e.textContent)
    expect(locks.filter((t) => t === '🔒 2권')).toHaveLength(1)
    expect(locks).toContain('🔒 7권')
  })
  it('건물을 누르면 아래에 설명, 잠긴 건물은 열리는 권수도 (2026-10-14)', () => {
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'villageMap' }))
    fireEvent.click(screen.getByRole('button', { name: '서고 설명' }))
    expect(screen.getByRole('status')).toHaveTextContent('다 쓴 책을 꽂아 두는 곳')
    fireEvent.click(screen.getByRole('button', { name: '약방 설명' }))
    expect(screen.getByRole('status')).toHaveTextContent('약방 주인 세이지의 집')
    expect(screen.getByRole('status')).toHaveTextContent('서고에 2권을 꽂으면 열려요')
  })
})

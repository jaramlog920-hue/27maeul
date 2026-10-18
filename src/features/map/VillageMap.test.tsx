import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ModalLayer } from '../ModalLayer'
import { useGame } from '../../store/game-store'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { NT_CHAPTER_COUNTS } from '../../engine/progression'
import { VillageMap } from './VillageMap'

describe('마을 지도', () => {
  it('나루와 벌통은 사도행전 완필 없이 4권·6권에서 열리고 설명도 실제 조건을 따른다', () => {
    const game = newGame(CONTENT)
    for (const book of ['phm', '2jn', '3jn', 'jud', '2th', 'tit'] as const) {
      game.progress[book].completed = Array.from({ length: NT_CHAPTER_COUNTS[book] }, (_, i) => i + 1)
    }
    useGame.setState({ game, modal: null })
    const { container } = render(<VillageMap />)
    expect(game.progress.ac.completed).toHaveLength(0)
    expect([...container.querySelectorAll('.vmap-label.locked')].some(el => /나루|벌통/.test(el.textContent ?? ''))).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: '나루 설명' }))
    expect(screen.getByRole('status')).toHaveTextContent('신약 4권')
    expect(screen.getByRole('status')).toHaveTextContent('사도행전 완필 여부와 관계없이')
    fireEvent.click(screen.getByRole('button', { name: '벌통 설명' }))
    expect(screen.getByRole('status')).toHaveTextContent('신약 6권')
    expect(screen.queryByText(/건물·장소를 누르면 설명/)).toBeNull()
    useGame.setState({ game: newGame(CONTENT), modal: null })
  })
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
    expect(screen.getByRole('status')).toHaveTextContent('다 쓴 책을 꽂는 마을 서고')
    fireEvent.click(screen.getByRole('button', { name: '약방 설명' }))
    expect(screen.getByRole('status')).toHaveTextContent('세이지의 약방')
    expect(screen.getByRole('status')).toHaveTextContent('서고에 2권을 꽂으면 열려요')
    // 장소도 누르면 팝업, 닫기로 닫힌다
    fireEvent.click(screen.getByRole('button', { name: '언덕 쉼터 설명' }))
    expect(screen.getByRole('dialog', { name: '언덕 쉼터 설명' })).toHaveTextContent('피로가 풀려요')
    fireEvent.click(within(screen.getByRole('dialog', { name: '언덕 쉼터 설명' })).getByRole('button', { name: '닫기' }))
    expect(screen.queryByRole('dialog', { name: '언덕 쉼터 설명' })).toBeNull()
  })
})

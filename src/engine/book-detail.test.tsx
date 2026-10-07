// 덧장식 (2026-10-08, 다른 창 책 장식 도트 연결): 제본 창의 덧장식 줄, 저장 정리, 표지 그림에 장식 점이 얹힌다
import { fireEvent, render, screen } from '@testing-library/react'
import { sanitizeBindings } from './binding'
import { BookCover } from '../features/library/BookArt'

describe('책 덧장식', () => {
  it('저장 정리: 맞는 덧장식만 남기고, 없음·모르는 값은 뺀다 (옛 저장 그대로)', () => {
    const done = () => true
    const raw = {
      mt: { day: 3, special: { color: 'sky', pattern: 'dots', deco: 'navy', detail: 'ribbonBookmark' } },
      mk: { day: 4, special: { color: 'sky', pattern: 'dots', deco: 'navy', detail: 'gold' } },
      lk: { day: 5, special: { color: 'sky', pattern: 'dots', deco: 'navy', detail: 'none' } },
      jn: { day: 6, special: { color: 'sky', pattern: 'dots', deco: 'navy' } },
    }
    const b = sanitizeBindings(raw, done)
    expect(b.mt?.special?.detail).toBe('ribbonBookmark')
    expect(b.mk?.special?.detail).toBeUndefined()
    expect(b.lk?.special?.detail).toBeUndefined()
    expect(b.jn?.special).toEqual({ color: 'sky', pattern: 'dots', deco: 'navy' })
  })

  it('덧장식을 고르면 표지 그림이 달라진다', () => {
    const plain = { color: 'cream', pattern: 'plain', deco: 'leather' } as const
    const html = (detail?: 'metalCorners') => {
      const { container, unmount } = render(<BookCover book="mt" choice={{ ...plain, ...(detail ? { detail } : {}) }} />)
      const out = container.innerHTML
      unmount()
      return out
    }
    expect(html('metalCorners')).not.toBe(html())
  })

  it('제본 꾸미기 창에 덧장식 줄이 있고 고를 수 있다', async () => {
    const { useGame } = await import('../store/game-store')
    const { ModalLayer } = await import('../features/ModalLayer')
    useGame.setState({ modal: { kind: 'bind', book: 'mt', step: 'decorate' } as never })
    render(<ModalLayer />)
    expect(screen.getByRole('group', { name: '덧장식' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '천 책갈피' }))
    expect(screen.getByRole('button', { name: '천 책갈피' })).toHaveAttribute('aria-pressed', 'true')
  })
})

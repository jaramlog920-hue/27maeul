import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PIECES } from '../../content/catalog'
import { Stamps } from './Stamps'

describe('관련 본문 도장', () => {
  it('관련 본문 기능을 유지하고 삭제 요청한 안내 문장은 표시하지 않는다', () => {
    const piece = PIECES.find((p) => p.stamps.length > 0)!
    const { container } = render(<Stamps piece={piece} />)
    expect(screen.getAllByRole('button')).toHaveLength(piece.stamps.length)
    expect(container.querySelector('.stamp-note')).toBeNull()
    expect(screen.queryByText(/소제목과 관련 본문은 대한성서공회/)).toBeNull()
  })
})

import { act, cleanup, render, screen } from '@testing-library/react'
import { useGame } from '../../store/game-store'
import { Toast } from './Hud'

afterEach(cleanup)

it('moves an active toast out of the canvas stacking context while a modal is open', () => {
  useGame.setState({ modal: null, toast: { text: '가방에 더 들어가지 않는다.', until: 10000 } })
  const { container } = render(<div className="world-frame"><Toast /></div>)
  expect(container.querySelector('.toast')).toBe(screen.getByRole('status'))
  act(() => useGame.setState({ modal: { kind: 'storage', item: 'linenCupboard' } }))
  expect(container.querySelector('.toast')).toBeNull()
  expect(screen.getByRole('status').parentElement).toBe(document.body)
  expect(screen.getByRole('status')).toHaveClass('toast-over-modal')
  expect(screen.getAllByRole('status')).toHaveLength(1)
  act(() => useGame.setState({ modal: null }))
  expect(container.querySelector('.toast')).toBe(screen.getByRole('status'))
  expect(screen.getByRole('status')).not.toHaveClass('toast-over-modal')
  act(() => useGame.setState({ toast: null }))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

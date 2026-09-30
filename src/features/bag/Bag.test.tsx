import { act, fireEvent, render } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { ITEM_TEXT } from '../../content/text'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { Bag } from './Bag'

describe('가방: 아이콘 칸', () => {
  beforeEach(() => useGame.setState({ game: { ...newGame(CONTENT), inv: { bread: 2, ink: 1 } }, modal: { kind: 'bag' } }))
  it('아이콘만 칸에 늘어놓고, 누르면 이름·개수·설명', () => {
    const { container } = render(<Bag />)
    expect(container.querySelectorAll('.bag-slot:not(.empty)')).toHaveLength(2)
    expect(container.querySelectorAll('.bag-slot').length).toBe(12)
    expect(container.textContent).not.toContain(ITEM_TEXT.bread.desc)
    act(() => fireEvent.click(container.querySelector('[aria-label="빵 2"]')!))
    expect(container.querySelector('.bag-detail')!.textContent).toContain(ITEM_TEXT.bread.desc)
  })
  it('몸 상태·능력치 줄을 누르면 설명', () => {
    const { container } = render(<Bag />)
    act(() => fireEvent.click(container.querySelector('.need-tap')!))
    expect(container.querySelector('.needs .tap-explain')!.textContent).toContain('배고픔')
    act(() => fireEvent.click(container.querySelector('[data-stat="hand"]')!))
    expect(container.querySelector('.stats .tap-explain')).not.toBeNull()
  })
})

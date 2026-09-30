import { act, fireEvent, render } from '@testing-library/react'
import { vi } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { loadDeck, useGame } from '../../store/game-store'
import { ControlDeck } from './ControlDeck'
import { Joystick } from './Joystick'

beforeEach(() => {
  localStorage.clear()
  useGame.setState({ game: newGame(CONTENT), modal: null, decorating: null, deck: true, joystick: true })
})

describe('아래 조작판', () => {
  it('처음엔 켜져 있고, 끄면 끈 채로 불러온다', () => {
    expect(loadDeck()).toBe(true)
    act(() => useGame.getState().setDeck(false))
    expect(loadDeck()).toBe(false)
  })
  it('나침반·살피기·가방/일지/설정, 몸 상태 눈금이 있다', () => {
    const { container, getByText } = render(<ControlDeck />)
    expect(container.querySelector('.deck-pad [data-zone="up"]')).not.toBeNull()
    expect(container.querySelectorAll('.deck-need').length).toBeGreaterThanOrEqual(3)
    act(() => getByText('가방').click())
    expect(useGame.getState().modal).toEqual({ kind: 'bag' })
  })
  it('살피기 단추는 바라보는 앞을 누른다', () => {
    const press = vi.fn()
    useGame.setState({ press })
    const { container } = render(<ControlDeck />)
    fireEvent.pointerDown(container.querySelector('.deck-seal')!)
    expect(press).toHaveBeenCalledTimes(1)
  })
  it('조작판을 쓰면 떠 있는 조이스틱은 숨는다', () => {
    const { container } = render(<Joystick />)
    expect(container.querySelector('.joystick')).toBeNull()
  })
})

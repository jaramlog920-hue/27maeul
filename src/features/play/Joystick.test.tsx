import { act, fireEvent, render } from '@testing-library/react'
import { vi } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { directionOf, Joystick } from './Joystick'

beforeEach(() => {
  vi.useFakeTimers()
  useGame.setState({ game: newGame(CONTENT), modal: null, decorating: null, joystick: true })
})
afterEach(() => vi.useRealTimers())

function pad() {
  const { container } = render(<Joystick />)
  const el = container.querySelector('.joystick') as HTMLDivElement
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 78, height: 78, right: 78, bottom: 78, x: 0, y: 0, toJSON: () => ({}) })
  return el
}

describe('조이스틱', () => {
  it('가운데 근처는 멈춤, 벗어나면 네 방향', () => {
    expect(directionOf(5, -5)).toBeNull()
    expect(directionOf(30, 10)).toEqual([1, 0])
    expect(directionOf(-4, -30)).toEqual([0, -1])
  })
  it('누르고 있는 동안 계속 걷고, 떼면 멈춘다', () => {
    const walk = vi.fn()
    useGame.setState({ walk })
    const el = pad()
    fireEvent.pointerDown(el, { clientX: 39 + 30, clientY: 39, pointerId: 1 })
    act(() => vi.advanceTimersByTime(300))
    // 방향이 그대로여도 걸음을 계속 요청한다 (예전에는 한 번뿐)
    expect(walk.mock.calls.length).toBeGreaterThan(5)
    expect(walk).toHaveBeenLastCalledWith(1, 0)
    fireEvent.pointerUp(el, { pointerId: 1 })
    walk.mockClear()
    act(() => vi.advanceTimersByTime(300))
    expect(walk).not.toHaveBeenCalled()
  })
  it('설정에서 끄면 사라진다', () => {
    const { container } = render(<Joystick />)
    expect(container.querySelector('.joystick')).not.toBeNull()
    act(() => useGame.getState().setJoystick(false))
    expect(container.querySelector('.joystick')).toBeNull()
    expect(localStorage.getItem('twenty-seven/joystick')).toBe('off')
  })
})

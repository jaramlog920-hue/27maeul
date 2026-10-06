import { act, fireEvent, render } from '@testing-library/react'
import { vi } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import type { GameState } from '../../engine/game'
import { PLACES } from '../../engine/world'
import { loadJoystick, loadJoystickShape, loadJoystickSide, useGame } from '../../store/game-store'
import { directionOf, Joystick, padZone, PAD_SIZE } from './Joystick'
import { Settings } from './Settings'

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  useGame.setState({ game: newGame(CONTENT), modal: null, decorating: null, joystick: true, joystickShape: 'pad', joystickSide: 'right', deck: false })
})
afterEach(() => vi.useRealTimers())

function box(el: HTMLElement, size: number) {
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width: size, height: size, right: size, bottom: size, x: 0, y: 0, toJSON: () => ({}) })
}

function roundPad() {
  useGame.setState({ joystickShape: 'round' })
  const { container } = render(<Joystick />)
  const el = container.querySelector('.joystick') as HTMLDivElement
  box(el, 78)
  return el
}

function dpad() {
  const { container } = render(<Joystick />)
  const el = container.querySelector('.joystick.dpad') as HTMLDivElement
  box(el, PAD_SIZE)
  return el
}

const C = PAD_SIZE / 2

describe('둥근 조이스틱', () => {
  it('가운데 근처는 멈춤, 벗어나면 네 방향', () => {
    expect(directionOf(5, -5)).toBeNull()
    expect(directionOf(30, 10)).toEqual([1, 0])
    expect(directionOf(-4, -30)).toEqual([0, -1])
  })
  it('누르고 있는 동안 계속 걷고, 떼면 멈춘다', () => {
    const walk = vi.fn()
    useGame.setState({ walk })
    const el = roundPad()
    expect(el.classList.contains('round')).toBe(true)
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

describe('네 방향 패드', () => {
  it('기본 모양이고, 단추는 한 칸 44px 이상', () => {
    const el = dpad()
    expect(el).not.toBeNull()
    expect(el.querySelectorAll('[data-zone]')).toHaveLength(5)
    expect(PAD_SIZE / 3).toBeGreaterThanOrEqual(44)
  })
  it('자리 판정: 가운데 칸, 그 밖은 더 많이 벗어난 쪽', () => {
    expect(padZone(0, 0)).toBe('center')
    expect(padZone(0, -C + 4)).toBe('up')
    expect(padZone(0, C - 4)).toBe('down')
    expect(padZone(-C + 4, 3)).toBe('left')
    expect(padZone(C - 4, -3)).toBe('right')
    // 패드 밖으로 미끄러져 나가도 방향은 이어진다
    expect(padZone(C + 40, 10)).toBe('right')
  })
  it('방향 단추를 누르고 있는 동안 걷고, 미끄러지면 방향이 바뀌고, 떼면 멈춘다', () => {
    const walk = vi.fn()
    useGame.setState({ walk })
    const el = dpad()
    fireEvent.pointerDown(el, { clientX: C, clientY: 8, pointerId: 1 })
    expect(walk).toHaveBeenLastCalledWith(0, -1)
    expect(el.querySelector('[data-zone="up"]')!.classList.contains('pressed')).toBe(true)
    act(() => vi.advanceTimersByTime(300))
    expect(walk.mock.calls.length).toBeGreaterThan(5)
    expect(walk).toHaveBeenLastCalledWith(0, -1)
    // 손가락을 떼지 않고 오른쪽 단추로
    fireEvent.pointerMove(el, { clientX: PAD_SIZE - 8, clientY: C, pointerId: 1, buttons: 1 })
    expect(walk).toHaveBeenLastCalledWith(1, 0)
    expect(el.querySelector('[data-zone="right"]')!.classList.contains('pressed')).toBe(true)
    expect(el.querySelector('[data-zone="up"]')!.classList.contains('pressed')).toBe(false)
    act(() => vi.advanceTimersByTime(300))
    expect(walk).toHaveBeenLastCalledWith(1, 0)
    fireEvent.pointerUp(el, { pointerId: 1 })
    expect(el.querySelector('.pressed')).toBeNull()
    walk.mockClear()
    act(() => vi.advanceTimersByTime(300))
    expect(walk).not.toHaveBeenCalled()
  })
  it('패드를 잡은 손가락 하나만 따른다 — 다른 손가락을 대거나 떼도 걸음은 그대로', () => {
    const walk = vi.fn()
    useGame.setState({ walk })
    const el = dpad()
    fireEvent.pointerDown(el, { clientX: C, clientY: 8, pointerId: 1 })
    fireEvent.pointerDown(el, { clientX: PAD_SIZE - 8, clientY: C, pointerId: 2 })
    fireEvent.pointerUp(el, { pointerId: 2 })
    walk.mockClear()
    act(() => vi.advanceTimersByTime(300))
    expect(walk).toHaveBeenLastCalledWith(0, -1)
    fireEvent.pointerUp(el, { pointerId: 1 })
    walk.mockClear()
    act(() => vi.advanceTimersByTime(300))
    expect(walk).not.toHaveBeenCalled()
  })
  it('가운데 단추는 바라보는 앞 칸을 누른 것과 같다 (tap)', () => {
    const tap = vi.fn()
    const walk = vi.fn()
    const g = newGame(CONTENT)
    const stand = PLACES.desk.stand!
    const desk = PLACES.desk.tiles.find((t) => Math.abs(t.x - stand.x) + Math.abs(t.y - stand.y) === 1)!
    const facing = desk.x < stand.x ? 'left' : desk.x > stand.x ? 'right' : desk.y < stand.y ? 'up' : 'down'
    useGame.setState({ tap, walk, game: { ...g, player: { ...g.player, x: stand.x, y: stand.y, path: [], facing } } as GameState })
    const el = dpad()
    fireEvent.pointerDown(el, { clientX: C, clientY: C, pointerId: 1 })
    expect(tap).toHaveBeenCalledTimes(1)
    expect(tap).toHaveBeenCalledWith(desk)
    act(() => vi.advanceTimersByTime(300))
    // 가운데를 누르고 있어도 걷지 않고, 한 번만 누른다
    expect(walk).not.toHaveBeenCalled()
    expect(tap).toHaveBeenCalledTimes(1)
    fireEvent.pointerUp(el, { pointerId: 1 })
  })
  it('창이 열려 있으면 가운데 단추는 아무것도 하지 않는다', () => {
    const tap = vi.fn()
    useGame.setState({ tap, modal: { kind: 'settings' } })
    act(() => useGame.getState().press())
    expect(tap).not.toHaveBeenCalled()
  })
})

describe('조이스틱 설정', () => {
  it('처음엔 꺼져 있고, 켜면 켠 채로 불러온다', () => {
    localStorage.removeItem('twenty-seven/joystick')
    expect(loadJoystick()).toBe(false)
    act(() => useGame.getState().setJoystick(true))
    expect(localStorage.getItem('twenty-seven/joystick')).toBe('on')
    expect(loadJoystick()).toBe(true)
    act(() => useGame.getState().setJoystick(false))
    expect(loadJoystick()).toBe(false)
  })
  it('모양·자리를 고르면 저장되고, 저장된 값을 불러온다', () => {
    expect(loadJoystickShape()).toBe('pad')
    expect(loadJoystickSide()).toBe('right')
    render(<Settings />)
    act(() => (document.querySelector('[data-mode="float"]') as HTMLButtonElement).click())
    expect(useGame.getState().deck).toBe(false)
    expect(useGame.getState().joystick).toBe(true)
    act(() => {
      ;(document.querySelector('[data-shape="round"]') as HTMLButtonElement).click()
      ;(document.querySelector('[data-side="left"]') as HTMLButtonElement).click()
    })
    expect(useGame.getState().joystickShape).toBe('round')
    expect(useGame.getState().joystickSide).toBe('left')
    expect(localStorage.getItem('twenty-seven/joystick-shape')).toBe('round')
    expect(localStorage.getItem('twenty-seven/joystick-side')).toBe('left')
    expect(loadJoystickShape()).toBe('round')
    expect(loadJoystickSide()).toBe('left')
  })
  it('배경음악 단추는 1–4 번호로 보이고, 고르면 저장된다', () => {
    render(<Settings />)
    const names = Array.from(document.querySelectorAll('[data-track]')).map((b) => b.textContent)
    expect(names).toEqual(['1', '2', '3', '4'])
    act(() => (document.querySelector('[data-track="E"]') as HTMLButtonElement).click())
    expect(localStorage.getItem('twenty-seven/music')).toBe('E')
    act(() => (document.querySelector('[data-track="default"]') as HTMLButtonElement).click())
    expect(localStorage.getItem('twenty-seven/music')).toBe('default')
  })
  it('왼쪽 자리면 joystick-left class', () => {
    const { container, rerender } = render(<Joystick />)
    expect(container.querySelector('.joystick-left')).toBeNull()
    act(() => useGame.getState().setJoystickSide('left'))
    rerender(<Joystick />)
    expect(container.querySelector('.joystick.joystick-left')).not.toBeNull()
    act(() => useGame.getState().setJoystickShape('round'))
    expect(container.querySelector('.joystick.round.joystick-left')).not.toBeNull()
  })
})

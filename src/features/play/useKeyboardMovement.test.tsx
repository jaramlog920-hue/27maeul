import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { useKeyboardMovement } from './useKeyboardMovement'
import { Hud } from './Hud'
import { ModalLayer } from '../ModalLayer'

vi.mock('../../audio/sound', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../audio/sound')>()),
  unlockAudio: vi.fn(),
  setAudioMuted: vi.fn(),
}))

beforeEach(() => {
  vi.useFakeTimers()
  useGame.setState({ game: newGame(CONTENT), modal: null, decorating: null })
})
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

it('WASD와 방향키를 지원하고 키를 놓거나 창을 벗어나면 멈춘다', () => {
  const walk = vi.spyOn(useGame.getState(), 'walk').mockImplementation(() => {})
  renderHook(() => useKeyboardMovement())
  for (const [code, dx, dy] of [['KeyW', 0, -1], ['KeyA', -1, 0], ['KeyS', 0, 1], ['KeyD', 1, 0], ['ArrowRight', 1, 0]] as const) {
    fireEvent.keyDown(window, { code })
    expect(walk).toHaveBeenLastCalledWith(dx, dy)
    fireEvent.keyUp(window, { code })
  }
  walk.mockClear()
  act(() => vi.advanceTimersByTime(100))
  expect(walk).not.toHaveBeenCalled()
  fireEvent.keyDown(window, { code: 'KeyW' })
  fireEvent.blur(window)
  walk.mockClear()
  act(() => vi.advanceTimersByTime(100))
  expect(walk).not.toHaveBeenCalled()
})

it('텍스트 입력과 모달에서는 이동하지 않는다', () => {
  const walk = vi.spyOn(useGame.getState(), 'walk').mockImplementation(() => {})
  renderHook(() => useKeyboardMovement())
  render(<input aria-label="입력" />)
  fireEvent.keyDown(screen.getByLabelText('입력'), { code: 'KeyA' })
  act(() => useGame.setState({ modal: { kind: 'guide' } }))
  fireEvent.keyDown(window, { code: 'KeyW' })
  expect(walk).not.toHaveBeenCalled()
})

it('도움말을 열고 Escape로 닫는다', () => {
  render(<><Hud /><ModalLayer /></>)
  // 도움말은 설정 안에 있다
  fireEvent.click(screen.getByRole('button', { name: '설정' }))
  fireEvent.click(screen.getByRole('button', { name: '도움말' }))
  expect(screen.getByRole('dialog', { name: '도움말' })).toBeInTheDocument()
  expect(screen.getByRole('table', { name: '집 안 장소 안내' })).toHaveTextContent('벽난로')
  expect(screen.getByRole('table', { name: '마을 장소 안내' })).toHaveTextContent('읽을 때마다 피로 30 회복')
  fireEvent.keyDown(screen.getByRole('button', { name: '닫기' }), { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('스페이스는 앞에 있는 것을 누른 것처럼 상호작용한다 (창·입력칸에서는 아님)', () => {
  const interact = vi.spyOn(useGame.getState(), 'interact').mockImplementation(() => true)
  renderHook(() => useKeyboardMovement())
  fireEvent.keyDown(window, { code: 'Space' })
  expect(interact).toHaveBeenCalledTimes(1)
  render(<input aria-label="글" />)
  fireEvent.keyDown(screen.getByLabelText('글'), { code: 'Space' })
  act(() => useGame.setState({ modal: { kind: 'guide' } }))
  fireEvent.keyDown(window, { code: 'Space' })
  expect(interact).toHaveBeenCalledTimes(1)
})

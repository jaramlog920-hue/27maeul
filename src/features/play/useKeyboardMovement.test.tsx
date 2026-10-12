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
  useGame.setState({ game: newGame(CONTENT), modal: null, decorating: null, copyResult: null, piecePopups: [], trip: null })
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

it('누르고 있는 방향은 칸에 도착한 프레임에 이어지고 키를 놓으면 이어지지 않는다', () => {
  const walk = vi.spyOn(useGame.getState(), 'walk').mockImplementation(() => {})
  renderHook(() => useKeyboardMovement())
  fireEvent.keyDown(window, { code: 'KeyD' })
  const moving = () => act(() => useGame.setState(s => ({ game: { ...s.game, player: { ...s.game.player, path: [{ x: 24, y: 26 }] } } })))
  const arrived = () => act(() => useGame.setState(s => ({ game: { ...s.game, player: { ...s.game.player, path: [] } } })))
  moving()
  walk.mockClear()
  arrived()
  expect(walk).toHaveBeenCalledExactlyOnceWith(1, 0)
  moving()
  fireEvent.keyUp(window, { code: 'KeyD' })
  walk.mockClear()
  arrived()
  expect(walk).not.toHaveBeenCalled()
})

it('held movement survives harmless focus, store updates, repeat events and Space with no menu', () => {
  const walk = vi.spyOn(useGame.getState(), 'walk').mockImplementation(() => {})
  vi.spyOn(useGame.getState(), 'interact').mockImplementation(() => false)
  renderHook(() => useKeyboardMovement())
  render(<button>HUD</button>)
  fireEvent.keyDown(window, { code: 'KeyD' })
  act(() => screen.getByRole('button', { name: 'HUD' }).focus())
  act(() => useGame.setState({ clockMs: 100 }))
  fireEvent.keyDown(window, { code: 'KeyD', repeat: true })
  fireEvent.keyDown(window, { code: 'Space' })
  expect(walk).toHaveBeenCalledTimes(1)
  act(() => vi.advanceTimersByTime(300))
  expect(walk).toHaveBeenCalledTimes(11)
  expect(walk).toHaveBeenLastCalledWith(1, 0)
})

it('releasing the newest direction resumes the earlier held direction', () => {
  const walk = vi.spyOn(useGame.getState(), 'walk').mockImplementation(() => {})
  renderHook(() => useKeyboardMovement())
  fireEvent.keyDown(window, { code: 'KeyW' })
  fireEvent.keyDown(window, { code: 'ArrowRight' })
  fireEvent.keyUp(window, { code: 'ArrowRight' })
  act(() => vi.advanceTimersByTime(30))
  expect(walk).toHaveBeenLastCalledWith(0, -1)
  fireEvent.keyUp(window, { code: 'KeyW' })
  walk.mockClear()
  act(() => vi.advanceTimersByTime(90))
  expect(walk).not.toHaveBeenCalled()
})

it.each(['modal', 'decorating', 'piecePopups', 'copyResult', 'trip'] as const)('%s discards held movement until a fresh press', kind => {
  const walk = vi.spyOn(useGame.getState(), 'walk').mockImplementation(() => {})
  const interact = vi.spyOn(useGame.getState(), 'interact').mockImplementation(() => false)
  renderHook(() => useKeyboardMovement())
  fireEvent.keyDown(window, { code: 'KeyD' })
  const blockers = {
    modal: { kind: 'guide' }, decorating: 'pick',
    piecePopups: ['test'], copyResult: [{ id: 'strength', before: 1, after: 2, xp: 1 }],
    trip: { dest: 'harbor', withChild: false },
  } satisfies Partial<ReturnType<typeof useGame.getState>>
  act(() => useGame.setState({ [kind]: blockers[kind] }))
  walk.mockClear()
  fireEvent.keyDown(window, { code: 'KeyD', repeat: true })
  fireEvent.keyDown(window, { code: 'Space' })
  act(() => vi.advanceTimersByTime(90))
  expect(walk).not.toHaveBeenCalled()
  expect(interact).not.toHaveBeenCalled()
  act(() => useGame.setState({ [kind]: kind === 'piecePopups' ? [] : null }))
  fireEvent.keyDown(window, { code: 'KeyD', repeat: true })
  act(() => vi.advanceTimersByTime(90))
  expect(walk).not.toHaveBeenCalled()
  fireEvent.keyUp(window, { code: 'KeyD' })
  fireEvent.keyDown(window, { code: 'KeyD' })
  expect(walk).toHaveBeenCalledTimes(1)
})

it.each(['input', 'textarea', 'select', 'editable', 'dialog', 'menu'])('%s focus discards held movement without ghost movement on exit', kind => {
  const walk = vi.spyOn(useGame.getState(), 'walk').mockImplementation(() => {})
  renderHook(() => useKeyboardMovement())
  render(<>
    <input aria-label="input" /><textarea aria-label="textarea" /><select aria-label="select" />
    <div aria-label="editable" contentEditable tabIndex={0} />
    <div aria-label="dialog" role="dialog" tabIndex={0} /><div aria-label="menu" role="menu" tabIndex={0} />
  </>)
  fireEvent.keyDown(window, { code: 'KeyW' })
  const target = screen.getByLabelText(kind)
  act(() => target.focus())
  walk.mockClear()
  fireEvent.keyDown(target, { code: 'KeyW', repeat: true })
  fireEvent.keyDown(target, { code: 'ArrowRight' })
  act(() => vi.advanceTimersByTime(90))
  act(() => target.blur())
  fireEvent.keyDown(window, { code: 'KeyW', repeat: true })
  act(() => vi.advanceTimersByTime(90))
  expect(walk).not.toHaveBeenCalled()
})

it('modifier shortcuts, visibility changes and load discard movement; unmount removes listeners and timer', () => {
  const walk = vi.spyOn(useGame.getState(), 'walk').mockImplementation(() => {})
  const { unmount } = renderHook(() => useKeyboardMovement())
  for (const stop of [
    () => fireEvent.keyDown(window, { code: 'ControlLeft', ctrlKey: true }),
    () => fireEvent(document, new Event('visibilitychange')),
    () => act(() => useGame.setState({ loadEpoch: useGame.getState().loadEpoch + 1 })),
  ]) {
    fireEvent.keyDown(window, { code: 'KeyW' })
    stop()
    walk.mockClear()
    fireEvent.keyDown(window, { code: 'KeyW', repeat: true })
    act(() => vi.advanceTimersByTime(90))
    expect(walk).not.toHaveBeenCalled()
    fireEvent.keyUp(window, { code: 'KeyW' })
  }
  fireEvent.keyDown(window, { code: 'KeyW' })
  unmount()
  walk.mockClear()
  fireEvent.keyDown(window, { code: 'KeyD' })
  act(() => vi.advanceTimersByTime(90))
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

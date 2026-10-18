// 장면을 그리다 오류가 나면 닫기로 그 장면을 건너뛴다 — 같은 장면이 다시 열려 오류 창이 되풀이되지 않게 (2026-10-18 감사 M-16)
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { useGame } from '../store/game-store'
import { ModalLayer } from './ModalLayer'

vi.mock('./scene/SceneView', async (orig) => {
  const m = (await orig()) as Record<string, unknown>
  return { ...m, SceneView: () => { throw new Error('boom') } }
})

it('오류 창의 닫기는 그 장면을 대기열에서 빼고, 다음 프레임에 다시 열지 않는다', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  useGame.getState().load({ ...newGame(CONTENT), scenes: ['welcome', 'firstChapter'] })
  useGame.setState({ modal: { kind: 'scene', id: 'welcome' } })
  render(<ModalLayer />)
  expect(screen.getByRole('alert')).toHaveTextContent('이 장면을 그리다 문제가 생겼어요')
  fireEvent.click(screen.getByRole('button', { name: '닫기' }))
  expect(useGame.getState().modal).toBeNull()
  expect(useGame.getState().game.scenes).toEqual(['firstChapter'])
  act(() => useGame.getState().frame(0.016))
  expect(useGame.getState().modal).not.toMatchObject({ kind: 'scene', id: 'welcome' })
})

it('아침 순위표 창이 그리다 실패하면 닫을 때 그 알림도 지워 다시 열리지 않는다', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const { skipBrokenScreen } = useGame.getState()
  useGame.getState().load({ ...newGame(CONTENT), scenes: [], rankPopup: { day: 21, place: 3, table: [], pieces: [] } as never })
  useGame.setState({ modal: { kind: 'rank' } })
  skipBrokenScreen()
  expect(useGame.getState().game.rankPopup).toBeUndefined()
  act(() => useGame.getState().frame(0.016))
  expect(useGame.getState().modal?.kind).not.toBe('rank')
})

import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { legacyGame } from '../../engine/growth-test-support'
import { clearSky } from '../../engine/game'
import { onceKey } from '../../engine/stories'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { LandscapeScene } from './StarsScene'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn() } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,landscape')
  useGame.setState({ game: { ...legacyGame(CONTENT), scenes: [] }, modal: null, piecePopups: [], copyResult: null, afterScene: null })
})
afterEach(() => vi.restoreAllMocks())

it.each(['stars', 'sunset'] as const)('%s은 전체 화면 풍경으로 열리고 돌아오면 앨범과 기록을 남긴다', kind => {
  const game = useGame.getState().game
  act(() => useGame.setState({ game: { ...game, scenes: [kind] }, modal: { kind: 'scene', id: kind } }))
  render(<ModalLayer />)
  expect(screen.getByRole('dialog')).toHaveClass('stars-scene')
  expect(screen.getByRole('dialog')).toHaveAccessibleName(kind === 'stars' ? '별 보는 밤' : '호숫가 노을')
  expect(localStorage.getItem(`twenty-seven/album/${kind}`)).toBe('data:image/png;base64,landscape')
  fireEvent.click(screen.getByRole('button', { name: /마을로 돌아가기/ }))
  expect(useGame.getState().modal).toBeNull()
  expect(useGame.getState().game.album.some(a => a.id === kind)).toBe(true)
  expect(useGame.getState().game.scenes).not.toContain(kind)
})

it('미리보기는 실제 저장의 앨범을 바꾸지 않는다', () => {
  const finish = vi.fn()
  render(<LandscapeScene kind="sunset" preview onFinish={finish} />)
  expect(localStorage.getItem('twenty-seven/album/sunset')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: /마을로 돌아가기/ }))
  expect(finish).toHaveBeenCalledOnce()
})

it('이미 본 노을도 다시 열리지만 같은 날 운 보상은 중복되지 않는다', () => {
  const s = useGame.getState().game
  const day = Array.from({ length: 30 }, (_, i) => i + 1).find(clearSky)!
  const game = { ...s, clock: { day, minute: 18 * 60 }, flags: { ...s.flags, sunsets: 1, [onceKey('sunset', day)]: 1 } }
  act(() => useGame.setState({ game }))
  act(() => useGame.getState().watchSunset())
  expect(useGame.getState().modal).toEqual({ kind: 'scene', id: 'sunset' })
  expect(useGame.getState().game.stats.luck).toEqual(game.stats.luck)
})

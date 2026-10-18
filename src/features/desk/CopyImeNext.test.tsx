// '다음 절' 단추를 한글 조합 중에 눌러도 늦게 온 compositionend가 다음 절 입력으로 들어가지 않는다 (2026-10-18 감사 M-8)
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT, versesOf } from '../../content/catalog'
import { T } from '../../content/text'
import { copySpot } from '../../engine/copying'
import { newGame, type GameState } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { preloadScreens } from '../lazy-screen'
import { ModalLayer } from '../ModalLayer'

beforeAll(() => preloadScreens())

it('조합 중 다음 절 → 절은 기록되고, 다음 절에는 쓰다 만 글자가 남지 않는다', async () => {
  localStorage.clear()
  const g: Partial<GameState> = { copy: { book: 'lk', at: { lk: { chapter: 1, verse: 1 } }, legacy: {} } }
  useGame.setState({ game: { ...newGame(CONTENT), scenes: [], ...g }, modal: null, rng: () => 0, decorating: null, toast: null, copyResult: null, copySessionStats: null, piecePopups: [] })
  render(<ModalLayer />)
  act(() => useGame.getState().open({ kind: 'copy', view: 'write' }))
  const box = (await screen.findByLabelText('따라 적기')) as HTMLTextAreaElement
  const text = versesOf('눅 1:1')[0].text
  fireEvent.compositionStart(box)
  fireEvent.change(box, { target: { value: text } })
  fireEvent.click(screen.getByRole('button', { name: (T.copyFocus as Record<string, string>).enterNext }))
  expect(copySpot(useGame.getState().game, 'lk', CONTENT)!.verse.verse).toBe(2)
  // 늦게 온 compositionend (조합 중이던 마지막 글자)
  box.value = text.slice(-1)
  fireEvent.compositionEnd(box)
  expect(copySpot(useGame.getState().game, 'lk', CONTENT)!.draft).toBe('')
})

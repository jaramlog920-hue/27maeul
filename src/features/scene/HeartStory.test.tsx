import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { HEART_HINTS, SCENES, T } from '../../content/text'
import { legacyGame } from '../../engine/growth-test-support'
import { heartUp } from '../../engine/game'
import { NO_ROMANCE } from '../../engine/romance'
import { useGame } from '../../store/game-store'
import { SceneView } from './SceneView'
import { ModalLayer } from '../ModalLayer'

beforeEach(() => {
  localStorage.clear()
  useGame.setState({ piecePopups: [], copyResult: null, toast: null, modal: null, afterScene: null })
})

it('새 연인 이야기는 마지막 줄까지 읽고 닫아야 완료되며 일지에도 남는다', () => {
  const id = 'loverTrust:wendell'
  const s = legacyGame(CONTENT)
  const game = { ...s, clock: { day: 15, minute: 840 }, scenes: [id],
    romance: { ...NO_ROMANCE, partner: 'wendell', stage: 'dating' as const, since: 1, dates: 3, storyQueued: true } }
  act(() => useGame.setState({ game, modal: { kind: 'scene', id } }))
  render(<SceneView id={id} />)
  expect(screen.getByRole('dialog')).toHaveAccessibleName(SCENES[id].title)
  expect(screen.queryByRole('button', { name: T.ui.close })).toBeNull()
  for (let page = 1; page < SCENES[id].lines.length; page++) {
    expect(useGame.getState().game.romance.storyRead).not.toBe(true)
    fireEvent.click(screen.getByRole('button', { name: T.ui.next }))
  }
  fireEvent.click(screen.getByRole('button', { name: T.ui.close }))
  expect(useGame.getState().game.romance.storyRead).toBe(true)
  expect(useGame.getState().game.todayNotes).toContain(id)
})

it('하루 교류 상한에 닿으면 대화창에서 이유를 볼 수 있다', () => {
  const game = { ...heartUp(legacyGame(CONTENT), 'baker', 20), scenes: [] }
  act(() => useGame.setState({ game, modal: { kind: 'talk', neighborId: 'baker', line: '' } }))
  render(<ModalLayer />)
  expect(screen.getByText(HEART_HINTS.daily)).toBeVisible()
})

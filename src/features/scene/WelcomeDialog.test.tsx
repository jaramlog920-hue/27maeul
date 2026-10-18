import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { SCENES, T } from '../../content/text'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { SceneView } from './SceneView'

it('첫 안내는 전체 화면 그림 없이 아래 설명 칸에서 원래 세 줄을 읽는다', () => {
  useGame.setState({ game: newGame(CONTENT), modal: { kind: 'scene', id: 'welcome' }, piecePopups: [], copyResult: null, afterScene: null })
  const { container } = render(<SceneView id="welcome" />)
  expect(container.querySelector('.stars-scene')).toBeNull()
  expect(container.querySelector('canvas')).toBeNull()
  expect(screen.getByRole('dialog')).toHaveClass('scene')
  for (let i = 0; i < SCENES.welcome.lines.length; i++) {
    expect(screen.getByText(SCENES.welcome.lines[i].text)).toBeVisible()
    if (i < SCENES.welcome.lines.length - 1) fireEvent.click(screen.getByRole('button', { name: T.ui.next }))
  }
  fireEvent.click(screen.getByRole('button', { name: T.ui.close }))
  expect(useGame.getState().game.scenes).not.toContain('welcome')
  expect(useGame.getState().game.album.some(a => a.id === 'welcome')).toBe(false)
})

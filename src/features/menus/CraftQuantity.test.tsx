import { render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { PlaceMenu } from './PlaceMenu'

it.each([0, 1])('기름틀 손잡이 개선 상태 %s에 맞는 생산량을 안내한다', upgraded => {
  const base = newGame(CONTENT)
  useGame.getState().load({ ...base, inv: { olive: 2 }, flags: { ...base.flags, 'unlock:pressHandle': upgraded } })
  render(<PlaceMenu place="press" />)
  const button = screen.getByRole('button', { name: /기름 짜기/ })
  expect(button).toHaveTextContent(`올리브 2 → 기름 ${upgraded ? 2 : 1}`)
  expect(button).not.toBeDisabled()
})

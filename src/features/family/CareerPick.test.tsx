// 진로 고르기: 한 아이에게 고른 진로가 다른 아이로 바꿔도 남아 그 아이 진로로 정해지지 않는다 (2026-10-18 감사 L-39)
import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { newGame, type GameState } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { Family } from './Family'

it('첫째에게 고른 진로는 둘째로 바꾸면 버리고, 둘째는 제 진로 그대로', () => {
  const b = newGame(CONTENT)
  const kid = (name: string, born: number, job: string) => ({ name, look: 'boy', born, stats: b.stats, job, jobConfirmed: false, left: false })
  const g: GameState = { ...b, clock: { day: 300, minute: 600 }, child: kid('가', 10, 'scribe') as never, siblings: [kid('나', 20, 'fisher')] as never }
  useGame.setState({ game: g, modal: { kind: 'family' } as never })
  render(<Family />)
  fireEvent.change(document.querySelector('select') as HTMLSelectElement, { target: { value: 'merchant' } })
  fireEvent.click(screen.getByRole('button', { name: /나/ }))
  expect(useGame.getState().game.child?.name).toBe('나')
  expect((document.querySelector('select') as HTMLSelectElement).value).toBe('fisher')
  fireEvent.click(screen.getByText('이 진로로 함께 결정하기'))
  fireEvent.click(screen.getByRole('button', { name: '네' }))
  expect(useGame.getState().game.child).toMatchObject({ name: '나', job: 'fisher', jobConfirmed: true })
})

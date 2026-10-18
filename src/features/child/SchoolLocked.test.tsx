// 배움터가 아직 잠겨 있으면 열리는 때를 알려 준다 (2026-10-18 감사 L-38)
import { render } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { featureHint } from '../../engine/feature-rules'
import { canSchool, newGame, type GameState } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { SchoolView } from './SchoolView'

it('잠긴 배움터의 안내 줄이 비어 있지 않다', () => {
  const b = newGame(CONTENT)
  const g: GameState = { ...b, child: { name: '아이', look: 'boy', born: 1, stats: b.stats } as never, clock: { day: 40, minute: 600 } }
  expect(canSchool(g)).toBe('locked')
  useGame.setState({ game: g, modal: { kind: 'school' } as never })
  const view = render(<SchoolView />)
  const hints = [...view.container.querySelectorAll('p.hint')].map((p) => p.textContent ?? '')
  expect(hints).toContain(featureHint('school'))
  expect(hints.every((t) => t.trim().length > 0)).toBe(true)
})

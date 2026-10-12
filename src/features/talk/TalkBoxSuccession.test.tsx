import { render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { establishedGame } from '../../engine/growth-test-support'
import { newGenState } from '../../engine/gen'
import { useGame } from '../../store/game-store'
import { TalkBox } from './TalkBox'

it('은퇴한 부모가 마을에 남아 있어도 일터의 후계자 이름으로 대화한다', () => {
  const game = establishedGame(CONTENT)
  const gen = newGenState(CONTENT, 7, 134)
  gen.persons['g-0001'] = {
    id: 'g-0001', origin: 'born', born: 10, stage: 'adult', look: 'm',
    name: '아론', parents: ['baker'], spouse: null, household: 'h-1',
  }
  gen.retired = { baker: { heir: 'g-0001', day: 134 } }
  useGame.setState({ game: { ...game, gen } })
  render(<TalkBox modal={{ kind: 'talk', neighborId: 'baker', line: '오늘도 좋은 하루예요.' }} />)
  expect(screen.getByRole('dialog', { name: '아론' })).toBeInTheDocument()
  expect(document.querySelector('.talk-role')?.textContent).toContain('아론')
  expect(document.querySelector('.talk-role')?.textContent).not.toContain('헤이즐')
})

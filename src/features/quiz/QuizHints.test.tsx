import { render, screen } from '@testing-library/react'
import { CONTENT, pieceById, piecesOf, quizSourceFor } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { mulberry32 } from '../../engine/offers'
import { buildQuiz } from '../../engine/quiz'
import { useGame, type Modal } from '../../store/game-store'
import { QuizView } from './QuizView'

it.each([3, 5])('지능 %i단계라도 순서 문제 두 보기는 모두 고를 수 있다', (level) => {
  const base = newGame(CONTENT)
  useGame.getState().load({ ...base, stats: { ...base.stats, wit: { ...base.stats.wit, level } } })
  const q = buildQuiz(piecesOf('mt'), 1, mulberry32(13), quizSourceFor(['mt'])).find(q => q.kind === 'order')!
  expect(q.kind).toBe('order')
  if (q.kind !== 'order') return
  const modal: Extract<Modal, { kind: 'quiz' }> = { kind: 'quiz', mode: { kind: 'chapter', book: 'mt', chapter: 1 },
    questions: [q], index: 0, wrong: [], solved: false, misses: 0, missed: [] }
  render(<QuizView modal={modal} />)
  for (const id of q.options) expect(screen.getByRole('button', { name: pieceById(id).title })).toBeEnabled()
})

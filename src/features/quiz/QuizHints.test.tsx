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
  const modal: Extract<Modal, { kind: 'quiz' }> = { kind: 'quiz', mode: { kind: 'library', book: 'mt', retry: false },
    questions: [q], index: 0, wrong: [], solved: false, misses: 0, missed: [] }
  render(<QuizView modal={modal} />)
  for (const id of q.options) expect(screen.getByRole('button', { name: pieceById(id).title })).toBeEnabled()
})


it('지능 최고치에서도 네 보기 모두 같은 상태로 표시하고 이미 틀린 선택만 표시한다', () => {
  const base = newGame(CONTENT)
  useGame.getState().load({ ...base, stats: { ...base.stats, wit: { level: 5, xp: 0, born: 0 } } })
  const q = { kind: 'blank' as const, ref: '막 1:1', before: '시작', after: '끝', options: ['보기1', '보기2', '보기3', '보기4'], answer: '보기2' }
  const modal: Extract<Modal, { kind: 'quiz' }> = { kind: 'quiz', mode: { kind: 'library', book: 'mk', retry: false }, questions: [q], index: 0, wrong: [], solved: false, misses: 0, missed: [] }
  const { rerender } = render(<QuizView modal={modal} />)
  for (const option of q.options) {
    const button = screen.getByRole('button', { name: option })
    expect(button).toBeEnabled()
    expect(button).not.toHaveClass('wrong')
  }
  rerender(<QuizView modal={{ ...modal, wrong: ['보기4'] }} />)
  expect(screen.getByRole('button', { name: '보기4' })).toHaveClass('wrong')
  for (const option of q.options.slice(0, 3)) expect(screen.getByRole('button', { name: option })).not.toHaveClass('wrong')
})

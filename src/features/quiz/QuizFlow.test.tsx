import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { CONTENT, pieceById, pieceOfQuestion } from '../../content/catalog'
import { T } from '../../content/text'
import { chaptersOf } from '../../engine/books'
import { newGame } from '../../engine/game'
import { mulberry32 } from '../../engine/offers'
import type { Question } from '../../engine/quiz'
import { deserialize, serialize } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  const base = newGame(CONTENT)
  useGame.getState().load({ ...base, scenes: [], progress: { ...base.progress,
    mk: { completed: chaptersOf('mk', CONTENT), arrangement: {} } },
    bound: { mk: { day: 1 } }, inv: { goldLeaf: 3, oil: 3 } })
  useGame.setState({ modal: { kind: 'library' }, rng: mulberry32(13), piecePopups: [], copyResult: null })
})
afterEach(() => vi.restoreAllMocks())

const label = (q: Question, answer: string) => q.kind === 'order' || q.kind === 'verse'
  ? pieceById(answer).title : q.kind === 'book' ? T.quiz.books[answer as keyof typeof T.quiz.books] : answer
function solve(q: Question) {
  if (q.kind === 'puzzle') {
    for (const word of q.answer) fireEvent.click(screen.getAllByRole('button', { name: word }).find(b => !b.hasAttribute('disabled'))!)
    fireEvent.click(screen.getByRole('button', { name: T.quiz.check }))
  } else if (q.kind === 'detective') {
    for (const book of q.answer) fireEvent.click(screen.getByRole('button', { name: T.quiz.books[book] }))
    fireEvent.click(screen.getByRole('button', { name: T.quiz.check }))
  } else fireEvent.click(screen.getByRole('button', { name: label(q, q.answer) }))
}

it('서고 퀴즈 실제 답 클릭·한 번 틀리기·완료는 은박/다시 읽기 기록을 저장한다', () => {
  act(() => useGame.getState().startShelve('mk'))
  render(<ModalLayer />)
  let missed: string | null = null
  for (let i = 0; i < 5; i++) {
    const modal = useGame.getState().modal
    if (modal?.kind !== 'quiz') throw new Error('missing quiz')
    expect(modal.index).toBe(i)
    const q = modal.questions[i]
    act(() => useGame.getState().nextQuiz())
    expect(useGame.getState().modal).toBe(modal)
    if (!missed && q.kind !== 'puzzle' && q.kind !== 'detective') {
      const wrong = q.options.find(o => o !== q.answer)!
      const button = screen.getByRole('button', { name: label(q, wrong) })
      fireEvent.click(button)
      fireEvent.click(button)
      expect(useGame.getState().modal).toMatchObject({ misses: 1, solved: false })
      missed = pieceOfQuestion(q)
    }
    solve(q)
    expect(useGame.getState().modal).toMatchObject({ solved: true })
    const solved = useGame.getState().game
    act(() => useGame.getState().answerQuiz(q.answer))
    expect(useGame.getState().game).toBe(solved)
    fireEvent.click(screen.getByRole('button', { name: i === 4 ? T.quiz.shelveRecord : T.ui.next }))
  }
  const done = useGame.getState().game
  expect(missed).not.toBeNull()
  expect(done.shelved.mk).toBe(1)
  expect(done.rereads).toContain(missed)
  const restored = deserialize(serialize(done), CONTENT)!
  expect(restored.shelved.mk).toBe(1)
  expect(restored.rereads).toEqual(done.rereads)
  act(() => { useGame.getState().answerQuiz('late'); useGame.getState().nextQuiz() })
  expect(useGame.getState().game).toBe(done)
})

it('처음 꽂기 퀴즈를 중단하면 책등 기록 없이 재시작하며 불러오기 뒤 이전 답도 무시한다', () => {
  act(() => useGame.getState().startShelve('mk'))
  render(<ModalLayer />)
  fireEvent.click(screen.getByRole('button', { name: T.quiz.later }))
  const stopped = useGame.getState().game
  expect(stopped.shelved.mk).toBeUndefined()
  expect(stopped.bound.mk).toEqual({ day: 1 })
  act(() => { useGame.getState().answerQuiz('late'); useGame.getState().nextQuiz() })
  expect(useGame.getState().game).toBe(stopped)
  act(() => { useGame.setState({ modal: { kind: 'library' } }); useGame.getState().startShelve('mk') })
  expect(useGame.getState().modal).toMatchObject({ kind: 'quiz', index: 0, misses: 0 })
  const restored = deserialize(serialize(stopped), CONTENT)!
  act(() => useGame.getState().load(restored))
  act(() => { useGame.getState().answerQuiz('late'); useGame.getState().nextQuiz() })
  expect(useGame.getState().game).toBe(restored)
  expect(useGame.getState().modal).toBeNull()
})

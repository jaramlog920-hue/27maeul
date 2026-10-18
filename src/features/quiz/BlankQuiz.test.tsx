import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { makeBlankQuiz, type BlankChapter } from '../../engine/blank-quiz'
import { newGame } from '../../engine/game'
import { serialize, deserialize } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

afterEach(() => vi.restoreAllMocks())
const seed = 7788
async function solve(target: BlankChapter) {
  const questions = makeBlankQuiz(useGame.getState().game, CONTENT, seed, target)
  expect(questions).toHaveLength(10)
  for (let i = 0; i < questions.length; i++) {
    const group = await screen.findByRole('group', { name: '보기' })
    fireEvent.click(within(group).getByRole('button', { name: questions[i].answer }))
    fireEvent.click(screen.getByRole('button', { name: i < 9 ? '다음 문제' : '마치기' }))
  }
}
function setup() {
  vi.spyOn(Date, 'now').mockReturnValue(seed)
  const g = newGame(CONTENT)
  useGame.setState({ game: { ...g, scenes: [], progress: { ...g.progress, lk: { completed: [1, 2], arrangement: {} } }, copy: { ...g.copy, copied: { lk: [1, 2] } } }, modal: null })
  render(<ModalLayer />)
}

describe('장별 빈칸 퀴즈 화면', () => {
  it('말씀 탭에서 장을 골라 10문제, 재풀이는 무료, 다른 장의 첫 풀이는 보상', async () => {
    setup()
    act(() => useGame.getState().open({ kind: 'word' }))
    fireEvent.click(screen.getByRole('tab', { name: '빈칸 퀴즈' }))
    fireEvent.change(screen.getByRole('combobox', { name: '퀴즈를 풀 장' }), { target: { value: 'lk:1' } })
    fireEvent.click(screen.getByRole('button', { name: '10문제 풀기' }))
    await solve({ book: 'lk', chapter: 1 })
    expect(useGame.getState().game.coins).toBe(110)
    expect(screen.getByText(/110닢을 받았어요/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다시 풀기' }))
    await solve({ book: 'lk', chapter: 1 })
    expect(useGame.getState().game.coins).toBe(110)
    expect(screen.getByText(/다시 풀기는 보상이 없어요/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다른 장 고르기' }))
    fireEvent.change(screen.getByRole('combobox', { name: '퀴즈를 풀 장' }), { target: { value: 'lk:2' } })
    fireEvent.click(screen.getByRole('button', { name: '10문제 풀기' }))
    await solve({ book: 'lk', chapter: 2 })
    expect(useGame.getState().game.coins).toBe(220)
  })
  it('장 완료 경로는 지정한 장을 바로 풀고 저장 재접속 후에는 보상이 없다', async () => {
    setup()
    act(() => useGame.getState().open({ kind: 'blankQuiz', target: { book: 'lk', chapter: 2 } }))
    await solve({ book: 'lk', chapter: 2 })
    const back = deserialize(serialize(useGame.getState().game), CONTENT)!
    act(() => { useGame.getState().closeModal(); useGame.getState().load(back) })
    act(() => useGame.getState().open({ kind: 'blankQuiz', target: { book: 'lk', chapter: 2 } }))
    await solve({ book: 'lk', chapter: 2 })
    expect(useGame.getState().game.coins).toBe(110)
    expect(screen.getByText(/다시 풀기는 보상이 없어요/)).toBeInTheDocument()
  })
  it('중간에 닫으면 보상을 지급하거나 첫 풀이 완료로 기록하지 않는다', async () => {
    setup()
    act(() => useGame.getState().open({ kind: 'blankQuiz', target: { book: 'lk', chapter: 1 } }))
    const group = await screen.findByRole('group', { name: '보기' })
    fireEvent.click(within(group).getAllByRole('button')[0])
    act(() => useGame.getState().closeModal())
    expect(useGame.getState().game.coins).toBe(0)
    expect(useGame.getState().game.flags['blankQuizPaid:lk:1']).toBeUndefined()
  })
})

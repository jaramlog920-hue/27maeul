import { CONTENT } from '../content/catalog'
import { chaptersOf } from './books'
import { newGame } from './game'
import { deserialize, serialize } from './save'
import { useGame } from '../store/game-store'

beforeEach(() => {
  localStorage.clear()
  const s = newGame(CONTENT)
  useGame.getState().load({ ...s, scenes: [], progress: { ...s.progress, mk: { completed: chaptersOf('mk', CONTENT), arrangement: {} } }, bound: { mk: { day: 1 } }, shelved: { mk: 0 }, inv: { goldLeaf: 3, oil: 3 } })
  useGame.getState().open({ kind: 'library' })
})

describe('서고 재도전 시작·중단 경계', () => {
  it('진행 중 남은 시작 입력은 재료를 다시 쓰거나 문제를 초기화하지 않는다', () => {
    useGame.getState().startRetry('mk')
    const first = useGame.getState().modal
    if (first?.kind !== 'quiz') throw new Error('missing quiz')
    const running = { ...first, index: 1, wrong: ['틀린 답'], misses: 1 }
    useGame.setState({ modal: running })
    const paid = useGame.getState().game
    expect(paid.inv).toEqual({ goldLeaf: 2, oil: 2 })
    useGame.getState().startRetry('mk')
    expect(useGame.getState().game).toBe(paid)
    expect(useGame.getState().modal).toBe(running)
  })

  it('취소 후 늦은 시작 입력은 무시하고, 선반을 새로 열면 정상적으로 새 비용을 낸다', () => {
    useGame.getState().startRetry('mk')
    useGame.getState().closeModal()
    const paid = useGame.getState().game
    useGame.getState().startRetry('mk')
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().game).toBe(paid)
    const back = deserialize(serialize(paid), CONTENT)!
    expect(back.inv).toEqual({ goldLeaf: 2, oil: 2 })
    expect(back.shelved.mk).toBe(0)
    useGame.getState().load(back)
    useGame.getState().open({ kind: 'library' })
    useGame.getState().startRetry('mk')
    expect(useGame.getState().game.inv).toEqual({ goldLeaf: 1, oil: 1 })
    expect(useGame.getState().modal).toMatchObject({ kind: 'quiz', index: 0 })
  })

  it('방 선반에서도 정상 시작하고 다섯 문제의 정답·완료 중복 입력은 보상을 반복하지 않는다', () => {
    useGame.getState().open({ kind: 'roomShelf', room: 'gospels' })
    useGame.getState().startRetry('mk')
    for (let i = 0; i < 5; i++) {
      const m = useGame.getState().modal
      if (m?.kind !== 'quiz') throw new Error('missing quiz')
      const answer = m.questions[m.index].answer
      useGame.getState().answerQuiz(answer)
      const solved = useGame.getState().game
      useGame.getState().answerQuiz(answer)
      expect(useGame.getState().game).toBe(solved)
      useGame.getState().nextQuiz()
    }
    const done = useGame.getState().game
    const modal = useGame.getState().modal
    expect(done.shelved.mk).toBe(2)
    expect(done.inv).toEqual({ goldLeaf: 2, oil: 2 })
    useGame.getState().nextQuiz()
    useGame.getState().startRetry('mk')
    expect(useGame.getState().game).toBe(done)
    expect(useGame.getState().modal).toBe(modal)
    expect(deserialize(serialize(done), CONTENT)!.shelved.mk).toBe(2)
  })
})

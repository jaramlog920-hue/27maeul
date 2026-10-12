import { CONTENT } from '../content/catalog'
import { chaptersOf } from './books'
import { DEFAULT_CHOICE } from './binding'
import { newGame } from './game'
import { deserialize, serialize } from './save'
import { useGame } from '../store/game-store'

beforeEach(() => {
  localStorage.clear()
  const s = newGame(CONTENT)
  useGame.getState().load({ ...s, scenes: [], progress: { ...s.progress, mk: { completed: chaptersOf('mk', CONTENT), arrangement: {} } }, bound: { mk: { day: 1 } }, inv: { creamPaper: 9, blueDye: 3, fineThread: 6 } })
})

describe('제본 확인 입력의 완료 경계', () => {
  it('표지 다시 꾸미기 완료 뒤 같은 확인 입력이 반복되어도 재료는 한 번만 쓴다', () => {
    useGame.getState().openBind('mk', 'library')
    expect(useGame.getState().modal).toMatchObject({ kind: 'bind', step: 'decorate', redo: true })
    const confirm = useGame.getState().bindSpecial
    confirm(DEFAULT_CHOICE)
    const done = useGame.getState().game
    const modal = useGame.getState().modal
    expect(done.inv).toEqual({ creamPaper: 6, blueDye: 2, fineThread: 4 })
    expect(modal).toMatchObject({ kind: 'bind', step: 'made' })
    confirm(DEFAULT_CHOICE)
    expect(useGame.getState().game).toBe(done)
    expect(useGame.getState().modal).toBe(modal)
    const back = deserialize(serialize(done), CONTENT)!
    expect(back.inv).toEqual(done.inv)
    expect(back.bound).toEqual(done.bound)
    expect(back.bound.mk?.day).toBe(1)
    useGame.getState().load(back)
    useGame.getState().openBind('mk', 'library')
    useGame.getState().bindSpecial({ ...DEFAULT_CHOICE, color: 'sky' })
    expect(useGame.getState().game.inv).toEqual({ creamPaper: 3, blueDye: 1, fineThread: 2 })
    expect(useGame.getState().game.bound.mk?.special?.color).toBe('sky')
  })

  it('표지를 고르는 단계에서는 무료 제본의 남은 입력을 실행하지 않는다', () => {
    const s = useGame.getState().game
    useGame.getState().load({ ...s, bound: {} })
    useGame.getState().openBind('mk')
    const m = useGame.getState().modal
    if (m?.kind !== 'bind') throw new Error('missing bind')
    useGame.getState().open({ ...m, step: 'decorate' })
    const before = useGame.getState().game
    useGame.getState().bindPlain()
    expect(useGame.getState().game).toBe(before)
    expect(useGame.getState().modal).toMatchObject({ step: 'decorate' })
    useGame.getState().bindSpecial(DEFAULT_CHOICE)
    expect(useGame.getState().game.bound.mk?.special).toEqual(DEFAULT_CHOICE)
  })
})

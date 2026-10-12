import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { libraryBookCount, newGame } from '../../engine/game'
import { libraryPay } from '../../engine/progression'
import { jobOf } from '../../engine/job'
import { deserialize, serialize } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { LetterBox } from './LetterBox'

beforeEach(() => {
  localStorage.clear()
  useGame.getState().load(newGame(CONTENT))
  useGame.setState({ piecePopups: [], toast: null })
})

describe('생활 편지 대필 세션', () => {
  it.each([0, 1, 2, 3] as const)('직업 %i 단계의 실제 수고비를 안내하고 한 번만 정산한다', level => {
    const base = newGame(CONTENT)
    const game = {
      ...base,
      lettersDone: level === 1 ? 10 : level === 2 ? 30 : 0,
      shelved: level === 0 ? {} : level === 1 ? { mk: 1 as const }
        : level === 2 ? { mk: 1 as const, lk: 1 as const }
          : { mt: 1 as const, mk: 1 as const, lk: 1 as const, jn: 1 as const },
    }
    expect(jobOf(game)).toBe(level)
    useGame.getState().load(game)
    useGame.setState({ modal: { kind: 'letter' }, piecePopups: [] })
    render(<LetterBox />)
    fireEvent.click(screen.getByRole('button', { name: '써 주기' }))
    const m = useGame.getState().modal
    expect(m?.kind).toBe('mini')
    if (m?.kind !== 'mini' || m.state.kind !== 'timing') throw new Error('timing session missing')
    const finished = { ...m, state: { ...m.state, hits: 3, misses: 0 } }
    act(() => useGame.setState({ modal: finished }))
    act(() => useGame.getState().miniTap())
    const paid = useGame.getState().game
    const amount = paid.coins - game.coins
    expect(amount).toBe(libraryPay([18, 27, 36, 45][level], libraryBookCount(game)))
    expect(useGame.getState().toast?.text).toContain(`${amount}`)
    expect(paid.lettersDone).toBe(game.lettersDone + 1)
    act(() => useGame.getState().miniTap())
    expect(useGame.getState().game).toBe(paid)
    const saved = deserialize(serialize(paid), CONTENT)!
    expect(saved.letterDay).toBe(game.clock.day)
    expect(saved.coins).toBe(paid.coins)
  })

  it('중복 시작은 손일 진행을 지우지 않고 취소 뒤 남은 시작 입력은 무시한다', () => {
    useGame.setState({ modal: { kind: 'letter' } })
    useGame.getState().startLetter()
    const m = useGame.getState().modal
    if (m?.kind !== 'mini' || m.state.kind !== 'timing') throw new Error('timing session missing')
    const advanced = { ...m, state: { ...m.state, hits: 1, misses: 2 } }
    useGame.setState({ modal: advanced })
    useGame.getState().startLetter()
    expect(useGame.getState().modal).toBe(advanced)
    const before = useGame.getState().game
    useGame.getState().quitMini()
    useGame.getState().startLetter()
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().game).toBe(before)
    useGame.setState({ modal: { kind: 'letter' } })
    useGame.getState().startLetter()
    expect(useGame.getState().modal?.kind).toBe('mini')
  })

  it('오늘 완료한 저장에서는 대필을 다시 시작하지 않는다', () => {
    const base = newGame(CONTENT)
    const restored = deserialize(serialize({ ...base, letterDay: base.clock.day, lettersDone: 1 }), CONTENT)!
    useGame.getState().load(restored)
    const modal = { kind: 'letter' as const }
    useGame.setState({ modal })
    useGame.getState().startLetter()
    expect(useGame.getState().modal).toBe(modal)
    expect(useGame.getState().game).toBe(restored)
  })
})

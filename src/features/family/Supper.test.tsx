import { act, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { SUPPER_FROM, supperReady } from '../../engine/family'
import { newGame, type GameState } from '../../engine/game'
import { NO_ROMANCE } from '../../engine/romance'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

function evening(day: number): GameState {
  const g = newGame(CONTENT)
  return { ...g, scenes: [], clock: { ...g.clock, day, minute: SUPPER_FROM + 30 }, romance: { ...NO_ROMANCE, partner: 'wendell', stage: 'married', marriedDay: 5 } }
}

describe('배우자와 저녁 — 화면', () => {
  it('저녁에 배우자에게 말을 걸면 같이 먹는 장면, 이름에 맞는 조사, 처음이면 앨범 표시', () => {
    let d = 20
    while (!supperReady(evening(d))) d++
    localStorage.clear()
    useGame.setState({ game: evening(d), modal: null, rng: () => 0, decorating: null, toast: null })
    render(<ModalLayer />)
    act(() => useGame.getState().talkTo('wendell'))
    expect(useGame.getState().modal).toEqual({ kind: 'scene', id: 'fam:supperFirst' })
    expect(screen.getByText(/웬델이 따뜻한 국과 빵을/)).toBeInTheDocument()
    expect(screen.getByText(/처음 둘이 먹은 저녁/)).toBeInTheDocument()
    expect(useGame.getState().game.flags.supperDay).toBe(d)
  })
})

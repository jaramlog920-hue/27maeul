import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT, versesOf } from '../../content/catalog'
import { newChild } from '../../engine/child'
import { deskAsks, DESK_DOZE_AT } from '../../engine/family'
import { newGame, type GameState } from '../../engine/game'
import { NO_ROMANCE } from '../../engine/romance'
import { freshStats } from '../../engine/stats'
import { PLACES } from '../../engine/world'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

function kidGame(day: number, minute = 10 * 60, extra: Partial<GameState> = {}): GameState {
  const g = newGame(CONTENT)
  const child = { ...newChild(day - 20, freshStats(), undefined), name: '테디', look: 'boy' as const }
  return { ...g, scenes: [], clock: { ...g.clock, day, minute }, child, ...extra }
}
function askDay(): number {
  for (let d = 60; d < 120; d++) if (deskAsks(kidGame(d))) return d
  throw new Error('no ask day')
}
function reset(game: GameState) {
  localStorage.clear()
  useGame.setState({ game, modal: null, rng: () => 0, decorating: null, toast: null })
}
function sit() {
  act(() => useGame.getState().tap(PLACES.desk.tiles[0]))
  act(() => {
    for (let i = 0; i < 2400 && !useGame.getState().modal; i++) useGame.getState().frame(0.05)
  })
}
const writing = (book: 'lk', chapter = 1, verse = 1): Partial<GameState> => ({ copy: { book, at: { [book]: { chapter, verse } }, legacy: {} } })

describe('가족과 함께 있는 필사 — 화면', () => {
  it('아이가 옆에 앉고 싶어 하면 [같이 있기]/[혼자 쓰기]를 묻고, 같이 있으면 쓰는 동안 곁의 그림과 한 줄', () => {
    const d = askDay()
    reset(kidGame(d, 10 * 60, writing('lk')))
    render(<ModalLayer />)
    sit()
    expect(useGame.getState().modal).toEqual({ kind: 'copy', view: 'ask' })
    expect(screen.getByText('테디가 옆에 앉고 싶어 해요.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '같이 있기' }))
    expect(useGame.getState().modal).toMatchObject({ kind: 'copy', view: 'menu' })
    act(() => useGame.getState().copyView('write'))
    expect(screen.getByText('테디가 바닥에 엎드려 그림을 그려요')).toBeInTheDocument()
    expect(document.querySelector('[data-pose="draw"]')).not.toBeNull()
    // 하루에 한 번만 묻는다
    act(() => useGame.getState().copyExit())
    sit()
    expect(useGame.getState().modal).toMatchObject({ kind: 'copy', view: 'menu' })
  })

  it('[혼자 쓰기]면 곁의 그림이 없다', () => {
    reset(kidGame(askDay(), 10 * 60, writing('lk')))
    render(<ModalLayer />)
    sit()
    fireEvent.click(screen.getByRole('button', { name: '혼자 쓰기' }))
    act(() => useGame.getState().copyView('write'))
    expect(document.querySelector('.copy-family')).toBeNull()
  })

  it('같이 쓰다 졸고, 장을 마치면 끝에 "테디와 함께 조용한 시간을 보냈어요." — 처음 잠든 날은 책상에서 나온 뒤 앨범 장면', () => {
    const d = askDay()
    const lk = versesOf('눅 2:1-52')
    // 2장 끝에서 일곱 절 앞부터
    const start = lk[lk.length - (DESK_DOZE_AT + 1)].verse
    const g = kidGame(d, 10 * 60, writing('lk', 2, start))
    reset({ ...g, flags: { ...g.flags, deskAskDay: d, deskKidDay: d, deskKidVerses: 0 } })
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'copy', view: 'write' }))
    for (const v of lk.slice(lk.length - (DESK_DOZE_AT + 1))) act(() => void useGame.getState().copyType(v.text))
    expect(useGame.getState().modal).toMatchObject({ kind: 'copy', view: 'done' })
    expect(screen.getByText('테디와 함께 조용한 시간을 보냈어요.')).toBeInTheDocument()
    expect(useGame.getState().game.scenes).toContain('fam:deskNap')
    // 아이는 능력치를 얻지 않는다
    expect(useGame.getState().game.child!.stats).toEqual(g.child!.stats)
  })

  it('저녁에 부부면 배우자가 같은 방에서 책을 읽는 그림', () => {
    const g = newGame(CONTENT)
    reset({ ...g, scenes: [], clock: { ...g.clock, minute: 20 * 60 }, romance: { ...NO_ROMANCE, partner: 'wendell', stage: 'married', marriedDay: 1 }, ...writing('lk') })
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'copy', view: 'write' }))
    expect(document.querySelector('[data-spouse]')).not.toBeNull()
    expect(screen.getByText(/같은 방에서 책을 읽어요/)).toBeInTheDocument()
  })
})

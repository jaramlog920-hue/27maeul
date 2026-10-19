// 다시 쓰기 화면 (2026-10-18 사용자): 책상 메뉴 → 마친 장 고르기 → 처음부터 다시 옮겨 적기 → 횟수와 한 번 더
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { copySpot } from '../../engine/copying'
import { newGame, startCopy, writeVerse, type GameState } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

function phmDone(): GameState {
  let s: GameState = startCopy({ ...newGame(CONTENT), scenes: [] }, 'phm', CONTENT)
  let r = writeVerse(s, 'phm', copySpot(s, 'phm', CONTENT)!.verse.text, CONTENT)
  while (r.result.kind === 'verse') {
    s = r.state
    r = writeVerse(s, 'phm', copySpot(s, 'phm', CONTENT)!.verse.text, CONTENT)
  }
  return r.state
}

function openMenu(game: GameState) {
  localStorage.clear()
  useGame.setState({ game, modal: null, rng: () => 0, decorating: null, toast: null, copyResult: null, copySessionStats: null, piecePopups: [] })
  render(<ModalLayer />)
  act(() => useGame.getState().open({ kind: 'copy', view: 'menu' }))
}

describe('다시 쓰기 화면', () => {
  it('마친 장이 없으면 다시 쓰기 단추가 없다', () => {
    openMenu(startCopy({ ...newGame(CONTENT), scenes: [] }, 'mt', CONTENT))
    expect(screen.queryByRole('button', { name: '마친 장 다시 쓰기' })).toBeNull()
  })

  it('메뉴 → 장 고르기 → 다시 쓰기 → 마치면 횟수, 한 번 더 누르면 같은 장을 처음부터', () => {
    openMenu(phmDone())
    expect(screen.getByText('빌레몬서 필사를 마쳤습니다.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '마친 장 다시 쓰기' }))
    fireEvent.click(screen.getByRole('button', { name: '1장 · 아직 다시 쓰지 않음' }))
    expect(useGame.getState().modal).toMatchObject({ kind: 'copy', view: 'write' })
    expect(useGame.getState().game.copy.again).toMatchObject({ book: 'phm', chapter: 1 })
    // 끝까지 적는다 (화면을 거치지 않고 같은 저장 경로로)
    act(() => {
      for (let i = 0; i < 40 && useGame.getState().modal?.kind === 'copy' && (useGame.getState().modal as { view: string }).view === 'write'; i++) {
        const g = useGame.getState().game
        useGame.getState().copyType(copySpot(g, 'phm', CONTENT)!.verse.text)
      }
    })
    expect(useGame.getState().modal).toMatchObject({ kind: 'copy', view: 'done' })
    expect(screen.getByText('이 장을 1번 다시 썼어요')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '이 장 한 번 더' }))
    expect(useGame.getState().game.copy.again).toMatchObject({ book: 'phm', chapter: 1 })
    expect(copySpot(useGame.getState().game, 'phm', CONTENT)!.index).toBe(0)
  })

  it('다시 쓰는 중이면 메뉴에 표시하고, 그만두면 다시 쓰기가 사라진다', () => {
    openMenu(phmDone())
    fireEvent.click(screen.getByRole('button', { name: '마친 장 다시 쓰기' }))
    fireEvent.click(screen.getByRole('button', { name: '1장 · 아직 다시 쓰지 않음' }))
    act(() => useGame.getState().copyView('menu'))
    expect(screen.getByText(/다시 쓰는 중 · 빌레몬서 1장/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다시 쓰기 그만두기' }))
    expect(useGame.getState().game.copy.again).toBeUndefined()
    expect(screen.getByRole('button', { name: '마친 장 다시 쓰기' })).toBeInTheDocument()
  })
})

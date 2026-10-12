import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT, pieceById } from '../../content/catalog'
import { copyBookName } from '../../content/text'
import { newGame } from '../../engine/game'
import { libraryVisitorTile } from '../../engine/library-visitor'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { TalkButton } from '../play/TalkButton'

beforeEach(() => {
  localStorage.clear()
  const game = { ...newGame(CONTENT), scenes: [], clock: { day: 9, minute: 12 * 60 }, guestbook: [{ day: 9, kind: 'learner' as const }], npcs: {} }
  const at = libraryVisitorTile(game)!
  useGame.setState({
    game: { ...game, player: { ...game.player, x: at.x - 1, y: at.y, facing: 'right' } },
    modal: null, decorating: null, trip: null, piecePopups: [], copyResult: null, toast: null,
  })
})

it('the visitor can be greeted with the nearby talk button, without owning scripture pieces', () => {
  render(<><TalkButton /><ModalLayer /></>)
  fireEvent.click(screen.getByRole('button', { name: /대화하기 · 서고 방문객/ }))
  act(() => useGame.getState().frame(0))
  expect(screen.getByRole('dialog', { name: '서고 방문객' })).toBeInTheDocument()
  expect(screen.getByText('혼자 읽다가 생각이 많아졌어요. 함께 읽어 주실래요?')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '함께 읽어 주기' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '대화 마치기' }))
  expect(useGame.getState().modal).toBeNull()
})

it('space interaction opens the same visitor conversation and sharing records the reward just once', () => {
  const id = CONTENT.pieces[0].id
  useGame.setState(s => ({ game: { ...s.game, collected: [id] } }))
  useGame.getState().dismissPiecePopup()
  render(<ModalLayer />)
  const before = useGame.getState().game.stats.charm.xp
  act(() => {
    expect(useGame.getState().interact()).toBe(true)
    useGame.getState().frame(0)
  })
  fireEvent.click(screen.getByRole('button', { name: '함께 읽어 주기' }))
  // 책 → 장 → 조각 순서로 고른다
  const p = pieceById(id)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${copyBookName(p.book)}`) }))
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${p.chapter}장`) }))
  fireEvent.click(screen.getByRole('button', { name: new RegExp(p.title) }))
  expect(useGame.getState().game.guestbook?.[0].taught).toBe(id)
  expect(useGame.getState().game.stats.charm.xp).toBeGreaterThan(before)
  const rewarded = useGame.getState().game.stats.charm.xp
  fireEvent.click(screen.getByRole('button', { name: '대화 마치기' }))
  act(() => { useGame.getState().interact(); useGame.getState().frame(0) })
  expect(screen.queryByRole('button', { name: '함께 읽어 주기' })).not.toBeInTheDocument()
  expect(useGame.getState().game.stats.charm.xp).toBe(rewarded)
})

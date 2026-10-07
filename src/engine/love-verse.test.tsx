// 연인에게 구절 선물 (2026-10-08)
import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { pieceFacts } from '../content/piece-moods'
import { canGiveLoveVerse, giveLoveVerse, LOVE_VERSE_GAP, LOVE_VERSE_HEART, newGame, type GameState } from './game'
import { useGame } from '../store/game-store'
import { ModalLayer } from '../features/ModalLayer'

const partner = CONTENT.neighbors.find((d) => d.avatar && d.look)!.id
function dating(extra: Partial<GameState> = {}): GameState {
  const base = newGame(CONTENT)
  return {
    ...base,
    clock: { day: 30, minute: 600 },
    collected: CONTENT.pieces.slice(0, 5).map((p) => p.id),
    romance: { partner, stage: 'dating', since: 20, weddingDay: null, marriedDay: null },
    ...extra,
  }
}

describe('연인에게 구절 선물', () => {
  it('연인에게만, 조각이 있을 때, 이레에 한 번', () => {
    const s = dating()
    expect(canGiveLoveVerse(s, partner)).toBe(true)
    expect(canGiveLoveVerse(s, CONTENT.neighbors.find((d) => d.id !== partner)!.id)).toBe(false)
    expect(canGiveLoveVerse(dating({ collected: [] }), partner)).toBe(false)
    expect(canGiveLoveVerse({ ...s, romance: { ...s.romance, partner: null, stage: null } }, partner)).toBe(false)
    const id = s.collected[0]
    const out = giveLoveVerse(s, id, pieceFacts(s.careDone, id))!
    expect(out.state.hearts[partner]).toBeGreaterThanOrEqual((s.hearts[partner] ?? 0) + LOVE_VERSE_HEART)
    expect(canGiveLoveVerse(out.state, partner)).toBe(false)
    expect(canGiveLoveVerse({ ...out.state, clock: { day: 30 + LOVE_VERSE_GAP, minute: 600 } }, partner)).toBe(true)
  })

  it('창에서 조각을 고르면 고마움 한 줄', () => {
    useGame.setState({ game: dating(), modal: { kind: 'loveVerse' } })
    render(<ModalLayer />)
    const rows = screen.getAllByRole('button').filter((b) => b.classList.contains('row'))
    fireEvent.click(rows[0])
    expect(useGame.getState().game.flags.loveVerse).toBe(30)
    expect(screen.getByText(/고마워요|필요했어요/)).toBeInTheDocument()
  })
})

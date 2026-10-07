// 서고 운영 (2026-10-08): 사서 맡기기 · 방문객 안내 · 방문객에게 조각 하나 함께 읽어 주기
import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { canTeachVisitor, guestMorning, LIBRARIAN_GAIN, librarianCandidates, librarianId, newGame, setLibrarian, teachVisitor, todaysVisitor, type GameState } from './game'
import { useGame } from '../store/game-store'
import { ModalLayer } from '../features/ModalLayer'

const friend = CONTENT.neighbors.find((d) => !d.marketOnly)!.id
function base(extra: Partial<GameState> = {}): GameState {
  const g = newGame(CONTENT)
  return { ...g, clock: { day: 21, minute: 600 }, hearts: { [friend]: 60 }, collected: CONTENT.pieces.slice(0, 3).map((p) => p.id), ...extra }
}

describe('서고 운영', () => {
  it('사서: 마음이 가까운 이웃만, 맡기고 내려놓기', () => {
    const s = base()
    expect(librarianCandidates(s)).toContain(friend)
    const t = setLibrarian(s, friend)
    expect(librarianId(t)).toBe(friend)
    expect(librarianId(setLibrarian(t, null))).toBeNull()
    const stranger = CONTENT.neighbors.find((d) => d.id !== friend && !d.marketOnly)!.id
    expect(librarianId(setLibrarian(s, stranger))).toBeNull()
  })

  it('방문객이 온 날 사서가 안내한다 (방명록·마음)', () => {
    // 21일은 순위 날 — 다른 마을 서기가 꼭 온다
    const s = setLibrarian(base(), friend)
    const t = guestMorning(s)
    const v = todaysVisitor(t)!
    expect(v.by).toBe(friend)
    expect(t.hearts[friend]).toBe(60 + LIBRARIAN_GAIN)
  })

  it('오늘 온 방문객에게 조각 하나 — 한 번만', () => {
    const t = guestMorning(base())
    expect(canTeachVisitor(t)).toBe(true)
    const id = t.collected[0]
    const u = teachVisitor(t, id)!
    expect(todaysVisitor(u)!.taught).toBe(id)
    expect(canTeachVisitor(u)).toBe(false)
    expect(teachVisitor(u, id)).toBeNull()
  })

  it('서고 창: 사서 맡기기 단추', () => {
    useGame.setState({ game: guestMorning(base()), modal: { kind: 'library' } as never })
    render(<ModalLayer />)
    const role = CONTENT.neighbors.find((d) => d.id === friend)!.role
    fireEvent.click(screen.getByRole('button', { name: `${role}에게 사서 맡기기` }))
    expect(librarianId(useGame.getState().game)).toBe(friend)
  })
})

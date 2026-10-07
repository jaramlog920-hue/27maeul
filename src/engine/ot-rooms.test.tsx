// 사용자 결정 ⑦: 구약 서고 확장권으로 범위 방이 하나씩 — 책장이 서고 안에 서고, 책장 창에 방마다 한 줄
import { render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { newGame, otTicketDue, rankMorning, syncHome, type GameState } from './game'
import { BOOKS } from './types'
import { OT_ROOMS, otRow, type OtBook } from './ot-books'
import { ARCHIVE_ROOM_SHELVES, archiveRoomsOpen, newlandTileAt } from './newland'
import { walkableOn } from './world'
import { INTERIOR_DESK, INTERIOR_ENTRY, INTERIOR_SHELF } from './newland-config'
import { useGame } from '../store/game-store'
import { ModalLayer } from '../features/ModalLayer'

const shelved = Object.fromEntries(BOOKS.map((b) => [b, 0])) as GameState['shelved']
const at = (day: number, extra: Partial<GameState> = {}): GameState => ({ ...newGame(CONTENT), clock: { day, minute: 360 }, shelved, ...extra })
const finished = (...books: OtBook[]): GameState['otProgress'] =>
  Object.fromEntries(books.map((b) => [b, { completed: Array.from({ length: otRow(b).chapters }, (_, i) => i + 1), arrangement: {} }]))

describe('구약 서고 방 늘리기', () => {
  it('첫 확장권 뒤에는 마친 구약 책 수가 열린 방 수에 닿을 때마다 한 장 더, 넷까지', () => {
    let s = rankMorning(at(401), CONTENT)
    expect(s.flags.otExpand).toBe(1)
    expect(otTicketDue(s)).toBe(false)
    s = { ...s, otProgress: finished('rut') }
    expect(otTicketDue(s)).toBe(true)
    s = rankMorning({ ...s, clock: { day: 421, minute: 360 } }, CONTENT)
    expect(s.flags.otExpand).toBe(2)
    expect(s.rankPopup!.otTicket).toBe(true)
    s = { ...s, flags: { ...s.flags, otExpand: 4 }, otProgress: finished('rut', 'oba', 'jol', 'nam', 'hab') }
    expect(otTicketDue(s)).toBe(false)
  })
  it('열린 방마다 서고 안 책장이 서고(막힌 칸), 책상·작은 책장·문 앞은 막지 않는다', () => {
    const s = { ...newGame(CONTENT), map: 'newland' as const, flags: { ...newGame(CONTENT).flags, newlandGift: 1, newlandRevealed: 1, otExpand: 2 } }
    syncHome(s)
    expect(archiveRoomsOpen()).toBe(2)
    expect(newlandTileAt(ARCHIVE_ROOM_SHELVES[0].x, ARCHIVE_ROOM_SHELVES[0].y)).toBe('s')
    expect(newlandTileAt(ARCHIVE_ROOM_SHELVES[1].x, ARCHIVE_ROOM_SHELVES[1].y)).toBe('s')
    expect(newlandTileAt(ARCHIVE_ROOM_SHELVES[2].x, ARCHIVE_ROOM_SHELVES[2].y)).toBe('f')
    for (const t of [INTERIOR_DESK.stand, INTERIOR_SHELF.stand, INTERIOR_ENTRY]) expect(walkableOn('newland', t)).toBe(true)
    for (const t of ARCHIVE_ROOM_SHELVES) expect([INTERIOR_DESK.tile, INTERIOR_SHELF.tile].some((x) => x.x === t.x && x.y === t.y)).toBe(false)
    syncHome({ ...s, flags: { ...s.flags, otExpand: 0 } })
    expect(archiveRoomsOpen()).toBe(0)
  })
  it('책장 창: 열린 방마다 범위 이름과 마친 권수', () => {
    const g = { ...newGame(CONTENT), flags: { ...newGame(CONTENT).flags, otExpand: 2 }, otProgress: finished('gen', 'rut') }
    useGame.setState({ game: g, modal: { kind: 'otShelf' } })
    render(<ModalLayer />)
    expect(screen.getByText(OT_ROOMS[0].label)).toBeInTheDocument()
    expect(screen.getByText(OT_ROOMS[1].label)).toBeInTheDocument()
    expect(screen.queryByText(OT_ROOMS[2].label)).toBeNull()
    expect(screen.getByText(`1/${OT_ROOMS[0].books.length}권`)).toBeInTheDocument()
  })
})

// 사용자 결정 ⑦: 구약 서고 확장권으로 범위 방이 하나씩 — 그 책장을 받아 서고 안에 놓고, 책장 창에 방마다 한 줄
import { render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { newGame, otTicketDue, rankMorning, syncHome, type GameState } from './game'
import { BOOKS } from './types'
import { OT_ROOMS, otRow, type OtBook } from './ot-books'
import { archiveRoomsOpen } from './newland'
import { INTERIOR } from './newland-config'
import { ARCHIVE_ROOM_KEY, grantRangeShelves, RANGE_SHELF_ITEMS, rangeShelfAt } from './ot-shelves'
import { deserialize, serialize } from './save'
import { useGame } from '../store/game-store'
import { ModalLayer } from '../features/ModalLayer'

const shelved = Object.fromEntries(BOOKS.map((b) => [b, 0])) as GameState['shelved']
// 서고 운영이 다 열린 옛 저장으로 (새 게임은 진행에 따라 열린다)
const at = (day: number, extra: Partial<GameState> = {}): GameState => { const g = newGame(CONTENT); return { ...g, flags: { ...g.flags, growthLegacy: 1 }, clock: { day, minute: 360 }, shelved, ...extra } }
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
  it('확장권을 받으면 그 묶음 책장을 가방으로 받고, 한 번만 (2026-10-27 가구로)', () => {
    let s = rankMorning(at(401), CONTENT)
    expect(s.inv[RANGE_SHELF_ITEMS.law]).toBe(1)
    s = grantRangeShelves(s)
    expect(s.inv[RANGE_SHELF_ITEMS.law]).toBe(1)
    const two = grantRangeShelves({ ...s, flags: { ...s.flags, otExpand: 2 } })
    expect(two.inv[RANGE_SHELF_ITEMS.history]).toBe(1)
  })
  it('옛 저장은 저절로 서 있던 칸에 가구로 옮겨 놓고, 놓은 책장을 누를 수 있다', () => {
    const g = newGame(CONTENT)
    const s = { ...g, flags: { ...g.flags, newlandGift: 1, otExpand: 2 } }
    const loaded = deserialize(serialize(s), CONTENT)!
    const room = loaded.rooms?.[ARCHIVE_ROOM_KEY] ?? []
    expect(room.map((f) => f.item)).toEqual([RANGE_SHELF_ITEMS.law, RANGE_SHELF_ITEMS.history])
    expect(room[0]).toMatchObject({ x: INTERIOR.x0 + 1, y: INTERIOR.y0 + 1 })
    expect(rangeShelfAt(loaded, room[1])).toBeTruthy()
    expect(loaded.inv[RANGE_SHELF_ITEMS.law] ?? 0).toBe(0)
    syncHome(loaded)
    expect(archiveRoomsOpen()).toBe(2)
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

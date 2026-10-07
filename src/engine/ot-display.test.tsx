// 구약 서고 전시 (2026-10-08): 책별 기록대 · 범위별 진열 · 함께 읽기
import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { newGame, type GameState } from './game'
import { otRow } from './ot-books'
import { canReadOtTogether, OT_READ_HEART, otBookRecord, otGroups, otReadFriends, otReadMemories, readOtTogether } from './ot-display'
import { useGame } from '../store/game-store'
import { ModalLayer } from '../features/ModalLayer'

const all = (n: number) => Array.from({ length: n }, (_, i) => i + 1)
function withRuth(extra: Partial<GameState> = {}): GameState {
  const base = newGame(CONTENT)
  return {
    ...base,
    clock: { day: 80, minute: 600 },
    otProgress: { ...(base.otProgress ?? {}), rut: { completed: all(otRow('rut').chapters) } } as GameState['otProgress'],
    copy: { ...base.copy, days: { ...(base.copy.days ?? {}), rut: { end: 70 } } },
    myLines: { ...base.myLines, 'guide:rut:2': '보아스의 밭에서' },
    ...extra,
  }
}

describe('구약 서고 전시', () => {
  it('기록대: 장 수·마친 날·내가 남긴 한 줄 (옛 저장은 날짜 미상)', () => {
    const r = otBookRecord(withRuth(), 'rut')
    expect(r).toEqual({ book: 'rut', chapters: 4, end: 70, lines: [{ chapter: 2, text: '보아스의 밭에서' }] })
    const old = withRuth()
    expect(otBookRecord({ ...old, copy: { ...old.copy, days: {} } }, 'rut').end).toBeNull()
  })

  it('범위별 진열: 마친 책이 있는 범위만', () => {
    const g = otGroups(withRuth())
    expect(g.map((x) => [x.room.id, x.books])).toEqual([['history', ['rut']]])
  })

  it('함께 읽기: 하루 한 번, 마음 조금, 기억에 남는다', () => {
    const friend = CONTENT.neighbors.find((d) => !d.marketOnly)!.id
    const s = withRuth({ hearts: { [friend]: 50 } })
    expect(otReadFriends(s, CONTENT.neighbors)).toContain(friend)
    expect(canReadOtTogether(s)).toBe(true)
    const t = readOtTogether(s, friend, CONTENT.neighbors)
    expect(t.hearts[friend]).toBe(50 + OT_READ_HEART)
    expect(canReadOtTogether(t)).toBe(false)
    expect(otReadMemories(t, CONTENT.neighbors)).toEqual([{ day: 80, npc: friend }])
    // 마친 구약 책이 없으면 함께 읽을 것도 없다
    expect(canReadOtTogether({ ...s, otProgress: {} as GameState['otProgress'] })).toBe(false)
  })

  it('책장 창: 책등을 누르면 기록대가 보인다', () => {
    useGame.setState({ game: withRuth(), modal: { kind: 'otShelf' } as never })
    render(<ModalLayer />)
    fireEvent.click(screen.getByRole('button', { name: /룻기/ }))
    expect(screen.getByRole('region', { name: '룻기 기록대' })).toBeInTheDocument()
    expect(screen.getByText('보아스의 밭에서')).toBeInTheDocument()
  })
})

// 계획 21 R8·R9: 마을별 서고 순위 업데이트 — 계절 1·21일 아침 한 번, 상위 보답, 27권 완필 뒤 확장권
import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { isRankDay, newGame, rankMorning, type GameState } from './game'
import { BOOKS } from './types'
import { useGame } from '../store/game-store'
import { ModalLayer } from '../features/ModalLayer'

const at = (day: number, extra: Partial<GameState> = {}): GameState => ({ ...newGame(CONTENT), clock: { day, minute: 360 }, ...extra })

describe('마을 서고 순위', () => {
  it('계절 1·21일 아침에만, 같은 날 두 번 없음, 20줄 순위표와 지난 기록', () => {
    expect(isRankDay(21)).toBe(true)
    expect(isRankDay(41)).toBe(true)
    expect(isRankDay(22)).toBe(false)
    expect(rankMorning(at(22), CONTENT).rankPopup).toBeUndefined()
    const s = rankMorning(at(21), CONTENT)
    expect(s.rankPopup?.table).toHaveLength(20)
    expect(s.ranks).toEqual([{ day: 21, place: s.rankPopup!.place }])
    expect(rankMorning(s, CONTENT)).toBe(s)
  })
  it('1위면 장식과 조각 둘, 낮아도 불이익 없음', () => {
    const many = CONTENT.pieces.slice(0, 600).map((p) => p.id)
    const top = rankMorning(at(21, { collected: many }), CONTENT)
    expect(top.rankPopup!.place).toBe(1)
    expect(top.rankPopup!.pieces).toHaveLength(2)
    expect(top.inv.bronzeOrnament).toBe(1)
    const low = rankMorning(at(201), CONTENT)
    expect(low.coins).toBe(at(201).coins)
  })
  it('27권을 다 꽂은 뒤 처음 업데이트에서 맨 위, 구약 서고 확장권은 한 번', () => {
    const shelved = Object.fromEntries(BOOKS.map((b) => [b, 0])) as GameState['shelved']
    const s = rankMorning(at(401, { shelved }), CONTENT)
    expect(s.rankPopup!.place).toBe(1)
    expect(s.rankPopup!.otTicket).toBe(true)
    expect(s.flags.otExpand).toBe(1)
    const again = rankMorning({ ...s, clock: { day: 421, minute: 360 } }, CONTENT)
    expect(again.rankPopup!.otTicket).toBeUndefined()
    expect(again.flags.otExpand).toBe(1)
  })
  it('업데이트 창을 닫으면 다시 뜨지 않는다', () => {
    const s = rankMorning(at(21), CONTENT)
    useGame.setState({ game: s, modal: { kind: 'rank' } })
    render(<ModalLayer />)
    expect(screen.getByRole('dialog', { name: '마을별 서고 순위 업데이트!' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(useGame.getState().game.rankPopup).toBeUndefined()
  })
})

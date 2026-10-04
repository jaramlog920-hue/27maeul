// 계획 14 작업 6: 잠들기 전 오늘의 기록
import { act, render, screen } from '@testing-library/react'
import { CONTENT, neighborById, pieceById } from '../../content/catalog'
import { itemName, JOURNAL_NOTES, T } from '../../content/text'
import { newGame, type GameState } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

function openBed(game: Partial<GameState> = {}) {
  localStorage.clear()
  const base = newGame(CONTENT)
  useGame.setState({ game: { ...base, scenes: [], ...game }, modal: null, rng: () => 0, decorating: null, toast: null })
  render(<ModalLayer />)
  act(() => useGame.setState({ modal: { kind: 'review', pieceId: null } }))
}

describe('잠들기 전 오늘의 기록', () => {
  it('그날 필사한 장·받은 선물·새 말씀 조각·가족 일을 적는다', () => {
    const day = newGame(CONTENT).clock.day
    const p = pieceById('mk-001-001')
    openBed({
      dayLog: { day, chapters: ['mt:2', 'mt:1', 'jn:3'], gifts: [{ from: 'baker', items: { bread: 2 } }] },
      pieceLog: { [p.id]: { day, from: 'letter' } },
      collected: [p.id],
      todayNotes: ['rainbow', 'childWalks'],
    })
    const diary = screen.getByRole('region', { name: T.diary.title })
    expect(screen.getByRole('heading', { name: T.diary.title })).toBeInTheDocument()
    expect(diary).toHaveTextContent('마태복음 1·2장')
    expect(diary).toHaveTextContent('요한복음 3장')
    expect(diary).toHaveTextContent(`${neighborById('baker')!.role} · ${itemName('bread')} 2`)
    expect(diary).toHaveTextContent(`${p.title} (${p.ref})`)
    expect(diary).toHaveTextContent(JOURNAL_NOTES.childWalks.trim())
    // 가족 일이 아닌 일지 표식은 적지 않는다
    expect(diary).not.toHaveTextContent(JOURNAL_NOTES.rainbow.trim())
  })

  it('적을 것이 없는 날은 오늘의 기록이 뜨지 않는다 (하지 않은 일을 말하지 않는다)', () => {
    openBed({ todayNotes: ['rainbow'] })
    expect(screen.getByRole('dialog', { name: T.ui.reviewTitle })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: T.diary.title })).toBeNull()
  })

  it('있는 칸만 보인다 (선물만 받은 날은 선물 칸 하나)', () => {
    openBed({ dayLog: { day: newGame(CONTENT).clock.day, chapters: [], gifts: [{ from: 'baker', items: { bread: 1 } }] } })
    const diary = screen.getByRole('region', { name: T.diary.title })
    expect(diary).toHaveTextContent(T.diary.gifts)
    expect(diary).not.toHaveTextContent(T.diary.chapters)
    expect(diary).not.toHaveTextContent(T.diary.pieces)
    expect(diary).not.toHaveTextContent(T.diary.family)
  })
})

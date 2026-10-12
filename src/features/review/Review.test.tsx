// 계획 14 작업 6: 잠들기 전 오늘의 기록
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT, neighborById, pieceById } from '../../content/catalog'
import { itemName, JOURNAL_NOTES, T } from '../../content/text'
import { goToSleep, newGame, type GameState } from '../../engine/game'
import { todayDiary } from '../../engine/daybook'
import { GUESTS, talkGuest } from '../../engine/newland-life'
import { useGame } from '../../store/game-store'
import { deserialize, serialize } from '../../engine/save'
import { ModalLayer } from '../ModalLayer'

function openBed(game: Partial<GameState> = {}) {
  localStorage.clear()
  const base = newGame(CONTENT)
  useGame.getState().load({ ...base, scenes: [], ...game })
  useGame.setState({ modal: null, rng: () => 0, decorating: null, toast: null, piecePopups: [], copyResult: null })
  render(<ModalLayer />)
  act(() => useGame.setState({ modal: { kind: 'review', pieceId: null } }))
}

describe('잠들기 전 오늘의 기록', () => {
  it.each(GUESTS)('%j 고유 선물은 받은 날의 일기에 이름과 실제 수량으로 남는다', (guest) => {
    const base = newGame(CONTENT)
    const state = { ...base, clock: { day: 22, minute: 1320 }, todayNotes: [],
      flags: { ...base.flags, guestNow: GUESTS.indexOf(guest) + 1, guestSince: 20, guestTalks: 2 },
      dayLog: { day: 22, chapters: [], gifts: [] },
    }
    const result = talkGuest(state)!
    expect(result.gift).toBe(guest.gift)
    expect(result.state.inv[guest.gift]).toBe((state.inv[guest.gift] ?? 0) + 1)
    expect(todayDiary(result.state)?.gifts).toEqual([{ from: guest.id, items: { [guest.gift]: 1 } }])
    expect(talkGuest(result.state)).toBeNull()
    const saved = deserialize(serialize(result.state), CONTENT)!
    expect(todayDiary(saved)?.gifts).toEqual([{ from: guest.id, items: { [guest.gift]: 1 } }])
    expect(goToSleep(saved, CONTENT).dayLog.gifts).toEqual([])
    openBed(saved)
    const diary = screen.getByRole('region', { name: T.diary.title })
    expect(diary).toHaveTextContent(`${T.newlandLife.guests[guest.id].name} · ${itemName(guest.gift)} 1`)
    expect(diary).not.toHaveTextContent(guest.id)
  })
  it('더 깨어 있기로 나가면 날짜·다시 읽기 목록을 유지하고 늦은 잠들기 입력을 무시한다', () => {
    openBed({ clock: { day: 9, minute: 1320 }, rereads: ['mk-001-001', 'mk-001-009'] })
    act(() => useGame.setState({ modal: { kind: 'review', pieceId: 'mk-001-001' } }))
    const before = useGame.getState().game
    const lateSleep = useGame.getState().sleep
    fireEvent.click(screen.getByRole('button', { name: T.ui.stayUp }))
    expect(useGame.getState().game).toBe(before)
    act(() => lateSleep())
    expect(useGame.getState().game).toBe(before)
    expect(useGame.getState().modal).toBeNull()
    expect(deserialize(serialize(before), CONTENT)!.rereads).toEqual(['mk-001-001', 'mk-001-009'])
  })

  it.each([9, 20])('%i일 잠들기는 하루 한 번만 진행하고 읽은 구절만 제거해 저장한다', (day) => {
    openBed({ clock: { day, minute: 1320 }, rereads: ['mk-001-001', 'mk-001-009'] })
    act(() => useGame.setState({ modal: { kind: 'review', pieceId: 'mk-001-001' } }))
    const lateSleep = useGame.getState().sleep
    fireEvent.click(screen.getByRole('button', { name: T.ui.sleep }))
    const morning = useGame.getState().game
    const modal = useGame.getState().modal
    expect(morning.clock.day).toBe(day + 1)
    expect(morning.rereads).toEqual(['mk-001-009'])
    expect(morning.flags.peaceDay).toBe(day + 1)
    act(() => lateSleep())
    expect(useGame.getState().game).toBe(morning)
    expect(useGame.getState().modal).toBe(modal)
    const back = deserialize(serialize(morning), CONTENT)!
    expect(back.clock).toEqual(morning.clock)
    expect(back.rereads).toEqual(['mk-001-009'])
    expect(back.flags.peaceDay).toBe(day + 1)
  })

  it('되새길 조각이 없어도 정상적으로 하루를 마치되 읽은 것으로 기록하지 않는다', () => {
    openBed({ clock: { day: 9, minute: 1320 } })
    fireEvent.click(screen.getByRole('button', { name: T.ui.sleep }))
    const morning = useGame.getState().game
    expect(morning.clock.day).toBe(10)
    expect(morning.flags.peaceDay).toBeUndefined()
    expect(morning.rereads).toEqual([])
    act(() => useGame.getState().sleep())
    expect(useGame.getState().game).toBe(morning)
  })
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

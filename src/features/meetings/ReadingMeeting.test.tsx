import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT, versesOf } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { deserialize, serialize } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { meetingPassage } from './ReadingMeeting'

beforeEach(() => {
  localStorage.clear()
  useGame.setState({
    game: { ...newGame(CONTENT), scenes: [], clock: { day: 5, minute: 19 * 60 } },
    modal: null, toast: null, piecePopups: [], copyResult: null, trip: null, decorating: null, clockMs: 0,
  })
})
afterEach(() => vi.unstubAllGlobals())

it('automatically opens the scripture when the clock reaches the meeting time, without tapping a table or playing audio', () => {
  const speak = vi.fn()
  vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn(), getVoices: () => [] })
  vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} })
  useGame.setState(s => ({ game: { ...s.game, clock: { day: 5, minute: 19 * 60 - 0.1 } } }))
  render(<ModalLayer />)
  act(() => useGame.getState().frame(0.05))
  expect(useGame.getState().modal).toBeNull()
  act(() => useGame.getState().frame(0.1))
  expect(screen.getByRole('dialog', { name: '마을 소리내어 읽기 모임' })).toBeInTheDocument()
  expect(useGame.getState().game.flags.readPromptDay).toBe(5)
  expect(useGame.getState().game.flags.readDay).toBeUndefined()
  expect(speak).not.toHaveBeenCalled()
})

it('does not repeat after closing or loading a save, but permits manual entry and opens again next meeting day', () => {
  act(() => useGame.getState().frame(0))
  act(() => useGame.getState().closeModal())
  act(() => useGame.getState().frame(0))
  expect(useGame.getState().modal).toBeNull()
  const saved = deserialize(serialize(useGame.getState().game), CONTENT)!
  act(() => useGame.getState().load(saved))
  act(() => useGame.getState().frame(0))
  expect(useGame.getState().modal).toBeNull()
  act(() => useGame.getState().startReading())
  expect(useGame.getState().modal).toEqual({ kind: 'readingMeeting', day: 5 })
  act(() => {
    useGame.getState().closeModal()
    useGame.setState(s => ({ game: { ...s.game, clock: { day: 12, minute: 19 * 60 } } }))
    useGame.getState().frame(0)
  })
  expect(useGame.getState().modal).toEqual({ kind: 'readingMeeting', day: 12 })
})

it('manual entry also prevents a second automatic popup after leaving', () => {
  act(() => {
    useGame.getState().startReading()
    useGame.getState().closeModal()
    useGame.getState().frame(0)
  })
  expect(useGame.getState().modal).toBeNull()
})

it.each(['modal', 'decorating', 'trip', 'piecePopups', 'copyResult'] as const)(
  'waits for %s to finish instead of interrupting it', (busy) => {
    const blocked = {
      modal: { kind: 'settings' } as const,
      decorating: 'pick' as const,
      trip: { dest: 'harbor', withChild: false } as const,
      piecePopups: [CONTENT.pieces[0].id],
      copyResult: [{ id: 'wit' as const, before: 0, after: 1, xp: 2 }],
    } satisfies Partial<ReturnType<typeof useGame.getState>>
    useGame.setState({ [busy]: blocked[busy] })
    act(() => useGame.getState().frame(0))
    expect(useGame.getState().modal).toEqual(busy === 'modal' ? blocked.modal : null)
    expect(useGame.getState().game.flags.readPromptDay).toBeUndefined()
    act(() => {
      useGame.setState({ modal: null, decorating: null, trip: null, piecePopups: [], copyResult: null })
      useGame.getState().frame(0)
    })
    expect(useGame.getState().modal).toEqual({ kind: 'readingMeeting', day: 5 })
  },
)

it('opens scripture without collected pieces, advances each verse, and grants the daily reward once', () => {
  act(() => useGame.getState().startReading())
  render(<ModalLayer />)
  const piece = meetingPassage(5)
  const verses = versesOf(piece.ref)
  const before = useGame.getState().game.stats.wit.xp
  expect(screen.getByRole('heading', { name: piece.title })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '함께 읽기 마치기' })).toBeDisabled()
  for (let i = 0; i < verses.length; i++) {
    expect(screen.getByText(verses[i].text, { exact: false })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: i + 1 < verses.length ? '읽었어요 · 다음 절' : '마지막 절 읽었어요' }))
  }
  fireEvent.click(screen.getByRole('button', { name: '함께 읽기 마치기' }))
  expect(useGame.getState().game.stats.wit.xp).toBe(before + 2)
  expect(useGame.getState().game.flags.readDay).toBe(5)
  act(() => useGame.getState().startReading())
  expect(useGame.getState().modal).toBeNull()
})

it('leaving partway gives no reward, and unavailable meetings show their next date', () => {
  act(() => useGame.getState().startReading())
  render(<ModalLayer />)
  fireEvent.click(screen.getByRole('button', { name: '그만 읽기' }))
  expect(useGame.getState().game.flags.readDay).not.toBe(5)
  act(() => {
    useGame.setState(s => ({ game: { ...s.game, clock: { day: 6, minute: 19 * 60 } } }))
    useGame.getState().open({ kind: 'menu', place: 'hallTable' })
  })
  expect(screen.getByRole('button', { name: /본문 펼치기/ })).toBeDisabled()
  expect(screen.getByText(/다음 모임은 12일째/)).toBeInTheDocument()
})

it('cancels narration on close and ignores callbacks from canceled speech', () => {
  const speak = vi.fn()
  const cancel = vi.fn()
  vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices: () => [] })
  vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} })
  act(() => useGame.getState().startReading())
  const view = render(<ModalLayer />)
  fireEvent.click(screen.getByRole('button', { name: '음성으로 낭독하기' }))
  expect(speak).toHaveBeenCalledOnce()
  const speech = speak.mock.calls[0][0]
  fireEvent.click(screen.getByRole('button', { name: '그만 읽기' }))
  act(() => speech.onend())
  expect(speak).toHaveBeenCalledOnce()
  expect(cancel).toHaveBeenCalled()
  expect(useGame.getState().game.flags.readDay).not.toBe(5)
  view.unmount()
  vi.unstubAllGlobals()
})

it('advances the displayed verse as narration ends, then allows completion', () => {
  const speak = vi.fn()
  vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn(), getVoices: () => [] })
  vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} })
  act(() => useGame.getState().startReading())
  render(<ModalLayer />)
  fireEvent.click(screen.getByRole('button', { name: '음성으로 낭독하기' }))
  const verses = versesOf(meetingPassage(5).ref)
  for (let i = 0; i < verses.length; i++) {
    const speech = speak.mock.calls[i][0]
    expect(speech.text).toBe(verses[i].text)
    act(() => speech.onend())
  }
  expect(screen.getByRole('button', { name: '함께 읽기 마치기' })).toBeEnabled()
})

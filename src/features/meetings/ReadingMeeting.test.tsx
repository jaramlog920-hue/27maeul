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

// 마이크로 내가 읽는다 (2026-10-19 사용자) — 음성 인식이 맞게 들으면 다음 절, 다르게 들리면 그 절에 머문다
class FakeRecognizer {
  static last: FakeRecognizer | null = null
  lang = ''; interimResults = false; continuous = false; maxAlternatives = 1
  onresult: ((e: unknown) => void) | null = null
  onerror: ((e: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn(() => { FakeRecognizer.last = this })
  stop = vi.fn()
  abort = vi.fn()
  say(text: string) {
    this.onresult?.({ resultIndex: 0, results: { length: 1, 0: Object.assign([{ transcript: text }], { isFinal: true }) } })
  }
}

it('reads each verse aloud through the microphone and moves on only when it is heard right', () => {
  vi.stubGlobal('SpeechRecognition', FakeRecognizer)
  act(() => useGame.getState().startReading())
  render(<ModalLayer />)
  const verses = versesOf(meetingPassage(5).ref)
  expect(screen.queryByRole('button', { name: '읽었어요 · 다음 절' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '🎙 소리 내어 읽기' }))
  act(() => FakeRecognizer.last!.say('전혀 다른 말'))
  expect(screen.getByRole('status')).toHaveTextContent(`1 / ${verses.length}절`)
  for (let i = 0; i < verses.length; i++) {
    fireEvent.click(screen.getByRole('button', { name: '🎙 소리 내어 읽기' }))
    act(() => FakeRecognizer.last!.say(verses[i].text))
  }
  expect(screen.getByRole('button', { name: '함께 읽기 마치기' })).toBeEnabled()
})

it('falls back to reading by hand when the microphone is denied', () => {
  vi.stubGlobal('SpeechRecognition', FakeRecognizer)
  act(() => useGame.getState().startReading())
  render(<ModalLayer />)
  fireEvent.click(screen.getByRole('button', { name: '🎙 소리 내어 읽기' }))
  act(() => FakeRecognizer.last!.onerror?.({ error: 'not-allowed' }))
  expect(screen.getByRole('button', { name: /읽었어요 · 다음 절|마지막 절 읽었어요/ })).toBeInTheDocument()
})

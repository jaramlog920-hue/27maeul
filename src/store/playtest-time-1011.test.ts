// 2026-10-11 시간·행사·저장 점검 — 스토어에서 보이는 것
import { beforeEach, expect, it, vi } from 'vitest'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { hallGuestsToday, newGame, type GameState } from '../engine/game'
import { READING_FROM } from '../engine/meetings'
import { useGame } from './game-store'

vi.mock('../audio/sound', () => ({ sfx: vi.fn(), setAudioMuted: vi.fn() }))

const at = (day: number): GameState => ({ ...newGame(CONTENT), clock: { day, minute: READING_FROM + 5 } })
beforeEach(() => useGame.setState({ toast: null, modal: null }))

it('2. 사랑방 손님이 있는 날은 호감도 줄과 함께 알린다', () => {
  const g = at(12)
  expect(hallGuestsToday(g, CONTENT).length).toBeGreaterThan(0)
  useGame.setState({ game: g, modal: null })
  useGame.getState().startReading()
  expect(useGame.getState().modal?.kind).toBe('readingMeeting')
  useGame.getState().completeReadingMeeting()
  expect(useGame.getState().toast?.text).toBe(`${T.meetings.readDone} · 이웃 호감도 +2 · 지능 경험치 +2`)
})

it('2. 잔치 날에는 읽기 모임 창이 열리지 않는다', () => {
  useGame.setState({ game: at(110), modal: null })
  useGame.getState().startReading()
  expect(useGame.getState().modal).toBeNull()
})

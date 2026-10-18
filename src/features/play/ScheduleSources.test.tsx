// 일정 화면들이 같은 목록을 본다 (2026-10-18 감사 M-24), 장날 예복에 이름이 있다 (M-11)
import { cleanup, fireEvent, render } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { scheduledEvents } from '../../engine/events'
import { newGame } from '../../engine/game'
import { WEDDING_ATTIRE } from '../../engine/wedding-attire'
import { useGame } from '../../store/game-store'
import { TradeBoard } from '../talk/TradeBoard'
import { ControlDeck } from './ControlDeck'
import { ScheduleDialog } from './EventSchedule'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('일정 목록', () => {
  it('직접 만든 약속이 아래 조작판의 다음 일정에도 나온다', () => {
    const base = newGame(CONTENT)
    const appt = { id: 'appt:1', kind: 'event' as const, activity: 'tea' as const, title: '작은 차 모임', day: 1, from: 600, to: 660, place: 'hallTable' as const, members: ['grandpa'], state: 'planned' as const, rewarded: false, remembered: false }
    const game = { ...base, clock: { day: 1, minute: 590 }, plans: { appts: [appt], nextId: 2 } }
    expect(scheduledEvents(game, CONTENT).some((e) => e.title === appt.title)).toBe(true)
    useGame.setState({ game, modal: null, deck: true })
    const deck = render(<ControlDeck />)
    expect(deck.container.querySelector('.deck-next')!.textContent).toContain(appt.title)
  })

  it('약혼한 내 결혼식이 전체 일정에 나온다', () => {
    const base = newGame(CONTENT)
    const game = { ...base, clock: { day: 7, minute: 1079 }, romance: { ...base.romance, stage: 'engaged' as const, partner: 'wendell', weddingDay: 7 } }
    const wedding = scheduledEvents(game, CONTENT).find((e) => e.id === '7:wedding')!
    expect(wedding).toBeDefined()
    useGame.setState({ game, modal: null, deck: true })
    const dialog = render(<ScheduleDialog />)
    expect(dialog.getByText(wedding.title)).toBeInTheDocument()
  })
})

it('장날 결혼 예복 네 가지에 이름이 보인다', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  const base = newGame(CONTENT)
  useGame.setState({ game: { ...base, clock: { day: 7, minute: 600 }, coins: 5000 }, modal: null })
  const view = render(<TradeBoard />)
  const section = [...view.container.querySelectorAll('.icon-grid')].find((e) => e.getAttribute('aria-label') === '결혼 예복')!
  const buttons = [...section.querySelectorAll<HTMLButtonElement>('.bag-grid button')]
  expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(WEDDING_ATTIRE.map((a) => a.name))
  fireEvent.click(buttons[0])
  expect(section.querySelector('.bag-detail strong')!.textContent).toBe(WEDDING_ATTIRE[0].name)
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { CONTENT } from '../../../src/content/catalog'
import { T } from '../../../src/content/text'
import { newGame, TRADES } from '../../../src/engine/game'
import { scheduledEvents } from '../../../src/engine/events'
import { WEDDING_ATTIRE } from '../../../src/engine/wedding-attire'
import { useGame } from '../../../src/store/game-store'
import { ControlDeck } from '../../../src/features/play/ControlDeck'
import { ScheduleDialog } from '../../../src/features/play/EventSchedule'
import { TradeBoard } from '../../../src/features/talk/TradeBoard'

afterEach(() => { cleanup(); vi.restoreAllMocks() })
describe('Audit UI state projection reproductions', () => {
  it('shows a planned appointment in ScheduleDialog but drops it from default control deck', () => {
    const base = newGame(CONTENT)
    const appt = { id: 'appt:1', kind: 'event' as const, activity: 'tea' as const, title: '감사 재현 차 모임', day: 1, from: 600, to: 660, place: 'hallTable' as const, members: ['grandpa'], state: 'planned' as const, rewarded: false, remembered: false }
    const game = { ...base, clock: {day:1,minute:590}, today: {}, plans: {appts:[appt],nextId:2} }
    expect(scheduledEvents(game,CONTENT).some(e=>e.title===appt.title)).toBe(true)
    useGame.setState({game,modal:null,deck:true})
    const deck = render(<ControlDeck/>),label=deck.container.querySelector('.deck-next')!.textContent
    expect(label).not.toContain(appt.title)
    deck.unmount()
    const dialog=render(<ScheduleDialog/>)
    expect(dialog.getByText(appt.title)).toBeDefined()
    console.log('DECK_SCHEDULE_PROBE',JSON.stringify({expectedNext:appt.title,actualNext:label,fullScheduleContainsAppointment:true}))
  })
  it('drops the engaged player wedding from the full schedule dialog', () => {
    const base=newGame(CONTENT)
    const game={...base,clock:{day:7,minute:1079},today:{},romance:{...base.romance,stage:'engaged' as const,partner:'wendell',weddingDay:7}}
    const wedding=scheduledEvents(game,CONTENT).find(e=>e.id==='7:wedding')!
    expect(wedding).toBeDefined()
    useGame.setState({game,modal:null,deck:true})
    const dialog=render(<ScheduleDialog/>)
    expect(dialog.queryByText(wedding.title)).toBeNull()
    console.log('MY_WEDDING_PROBE',JSON.stringify({expectedTitle:wedding.title,actualDialogContainsWedding:false}))
  })
  it('renders unnamed wedding attire cards and a blank selected title', () => {
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null)
    const base=newGame(CONTENT)
    useGame.setState({game:{...base,clock:{day:7,minute:600},coins:5000},modal:null})
    const view=render(<TradeBoard/>)
    const section=[...view.container.querySelectorAll('.icon-grid')].find(e=>e.getAttribute('aria-label')==='결혼 예복')!
    const buttons=[...section.querySelectorAll<HTMLButtonElement>('.bag-grid button')]
    expect(buttons).toHaveLength(4)
    for(const attire of WEDDING_ATTIRE) {
      expect(TRADES.some(t=>t.id===attire.item)).toBe(true)
      expect((T.trades as Record<string,string>)[attire.item]).toBeUndefined()
    }
    expect(buttons.every(b=>!b.getAttribute('aria-label'))).toBe(true)
    fireEvent.click(buttons[0])
    expect(section.querySelector('.bag-detail strong')!.textContent).toBe('')
    console.log('ATTIRE_TRADE_PROBE',JSON.stringify({cards:buttons.length,accessibleLabels:buttons.map(b=>b.getAttribute('aria-label')),selectedTitle:section.querySelector('.bag-detail strong')!.textContent}))
  })
})

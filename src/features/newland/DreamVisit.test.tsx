import { StrictMode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONTENT, neighborById } from '../../content/catalog'
import { goToSleep, newGame, syncHome, type GameState } from '../../engine/game'
import { setActiveMap } from '../../engine/maps'
import { setNewlandOpen } from '../../engine/newland'
import type { Build } from '../../engine/newland-build'
import { DREAM_GIFT_GAP, DREAM_TROUBLE_AFTER, dreamKey } from '../../engine/newland-life'
import { deserialize, serialize } from '../../engine/save'
import { todayDiary } from '../../engine/daybook'
import { itemList, T } from '../../content/text'
import { Review } from '../review/Review'
import { useGame } from '../../store/game-store'
import { dreamText, FacilityView } from './FacilityView'

const reload = (s: GameState) => deserialize(serialize(s), CONTENT)!
beforeEach(() => { localStorage.clear(); vi.useFakeTimers() })
afterEach(() => { vi.runOnlyPendingTimers(); vi.useRealTimers(); setActiveMap('village'); setNewlandOpen(false) })

describe('주민 꿈터 선택·선물 저장', () => {
  it.each([
    ['penelope', 'weaver', 1], ['penelope', 'weaver', 2],
    ['tilly', 'gallery', 1], ['tilly', 'gallery', 2],
  ] as const)('%s의 %s에서 선택 %i를 저장하고 같은 날/7일 전 선물을 반복하지 않는다', (npc, kind, choice) => {
    const base = newGame(CONTENT)
    const build: Build = { id: 'b1', kind, x: 10, y: 12, facing: 'down', state: 'done',
      orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false }
    let s: GameState = { ...base, scenes: [], map: 'newland', clock: { day: 30, minute: 600 },
      flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1, [`dream:${npc}`]: 29 },
      newland: { builds: [build], tiles: {}, nextId: 2, settledDay: 30 } }
    const D = dreamText(npc)
    const gifts = neighborById(npc)!.help.gives
    const open = () => {
      useGame.getState().load(reload(s))
      useGame.setState({ modal: { kind: 'facility', id: kind }, piecePopups: [] })
      syncHome(useGame.getState().game)
      return render(<StrictMode><FacilityView id={kind} /></StrictMode>)
    }
    let view = open()
    expect(screen.getByText(D.open)).toBeInTheDocument()
    s = reload(useGame.getState().game)
    expect(s.flags[dreamKey('dreamOpen', npc)]).toBe(30)
    expect(s.flags[dreamKey('dreamPick', npc)]).toBeUndefined()
    view.unmount()
    for (let i = 0; i < DREAM_TROUBLE_AFTER; i++) s = reload(goToSleep(s, CONTENT))
    view = open()
    expect(screen.getByText(D.trouble)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: choice === 1 ? D.pickSlow : D.pickTwo }))
    expect(screen.getByText(choice === 1 ? D.afterSlow : D.afterTwo)).toBeInTheDocument()
    s = reload(useGame.getState().game)
    expect(s.flags[dreamKey('dreamPick', npc)]).toBe(choice)
    const before = s.inv
    view.unmount()
    view = open()
    expect(screen.queryByRole('button', { name: D.pickSlow })).toBeNull()
    s = reload(useGame.getState().game)
    for (const [item, amount] of Object.entries(gifts)) {
      expect(s.inv[item as keyof typeof s.inv]).toBe((before[item as keyof typeof before] ?? 0) + amount!)
    }
    expect(s.flags[dreamKey('dreamGiftDay', npc)]).toBe(33)
    expect(todayDiary(s)?.gifts).toEqual([{ from: npc, items: gifts }])
    const paid = s.inv
    view.unmount()
    view = open()
    expect(useGame.getState().game.inv).toEqual(paid)
    s = reload(useGame.getState().game)
    expect(todayDiary(s)?.gifts).toEqual([{ from: npc, items: gifts }])
    view.unmount()
    const review = render(<Review pieceId={null} />)
    expect(screen.getByRole('region', { name: T.diary.title })).toHaveTextContent(`${neighborById(npc)!.role} · ${itemList(gifts)}`)
    review.unmount()
    for (let d = 1; d <= DREAM_GIFT_GAP; d++) {
      s = reload(goToSleep(s, CONTENT))
      view = open()
      s = reload(useGame.getState().game)
      expect(todayDiary(s)?.gifts ?? []).toEqual(d === DREAM_GIFT_GAP ? [{ from: npc, items: gifts }] : [])
      for (const [item, amount] of Object.entries(gifts)) {
        expect(s.inv[item as keyof typeof s.inv]).toBe((paid[item as keyof typeof paid] ?? 0) + (d === DREAM_GIFT_GAP ? amount! : 0))
      }
      view.unmount()
    }
    expect(s.flags[dreamKey('dreamGiftDay', npc)]).toBe(40)
    const other = npc === 'penelope' ? 'tilly' : 'penelope'
    expect(s.flags[dreamKey('dreamPick', other)]).toBeUndefined()
  })
})

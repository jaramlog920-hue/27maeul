import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { goToSleep, newGame, syncHome, type GameState } from '../../engine/game'
import { setActiveMap } from '../../engine/maps'
import { setNewlandOpen } from '../../engine/newland'
import type { Build } from '../../engine/newland-build'
import { GUESTS, GUEST_STAY, GUEST_GAP, guestNow, talkGuest } from '../../engine/newland-life'
import { deserialize, serialize } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { FacilityView } from './FacilityView'

const inn: Build = { id: 'b1', kind: 'guest', x: 10, y: 12, facing: 'down', state: 'done',
  orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false }
const reload = (s: GameState) => deserialize(serialize(s), CONTENT)!

beforeEach(() => localStorage.clear())
afterEach(() => { setActiveMap('village'); setNewlandOpen(false) })

describe('손님집 대화·선물·재방문 저장', () => {
  it.each(GUESTS)('$id 사흘 대화는 고유 선물을 한 번만 주고 재방문에도 반복하지 않는다', def => {
    const base = newGame(CONTENT)
    let s: GameState = { ...base, scenes: [], clock: { day: 20, minute: 660 }, map: 'newland',
      flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1,
        guestNow: GUESTS.indexOf(def) + 1, guestSince: 20, guestTalks: 0 },
      inv: { [def.gift]: 9 },
      newland: { builds: [inn], tiles: {}, nextId: 2, settledDay: 20 } }
    const text = T.newlandLife.guests[def.id]
    for (let day = 0; day < GUEST_STAY; day++) {
      s = reload(s)
      useGame.getState().load(s)
      useGame.setState({ modal: { kind: 'facility', id: 'guest' }, piecePopups: [], toast: null })
      syncHome(s)
      const view = render(<FacilityView id="guest" />)
      expect(screen.getByText(text.name)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: T.newlandLife.guestTalk }))
      expect(screen.getByText(text.lines[day])).toBeInTheDocument()
      const talked = useGame.getState().game
      expect(talked.flags.guestTalks).toBe(day + 1)
      expect(talked.inv[def.gift]).toBe(day === 2 ? 10 : 9)
      fireEvent.click(screen.getByRole('button', { name: T.newlandLife.guestTalk }))
      expect(useGame.getState().game).toBe(talked)
      expect(useGame.getState().toast?.text).toBe(T.newlandLife.guestTalked)
      s = reload(talked)
      expect(talkGuest(s)).toBeNull()
      view.unmount()
      s = goToSleep(s, CONTENT)
    }
    expect(guestNow(s)).toBeNull()
    const nextDay = s.flags.guestNext
    expect(nextDay).toBe(20 + GUEST_STAY + GUEST_GAP)
    while (s.clock.day < nextDay) {
      expect(guestNow(reload(s))).toBeNull()
      s = goToSleep(reload(s), CONTENT)
    }
    expect(guestNow(s)).not.toBeNull()
    // 아직 선물을 주지 않은 손님이 우선이므로 다른 손님에게도 매일 말한 뒤 정상 재방문을 기다린다.
    for (let days = 0; days < 120 && guestNow(s) !== def.id; days++) {
      s = talkGuest(reload(s))?.state ?? s
      s = goToSleep(reload(s), CONTENT)
    }
    expect(guestNow(s)).toBe(def.id)
    const visit = talkGuest(reload(s))!
    expect(visit.line).toBe('again')
    expect(visit.gift).toBeUndefined()
    expect(visit.state.inv[def.gift]).toBe(10)
    expect(reload(visit.state).flags[`guestGift:${def.id}`]).toBe(22)
  })
})

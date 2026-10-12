import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { canGatherYard, gatherYard, goToSleep, heartUp, neighborsPresent, newGame, syncHome,
  yardFriends, YARD_FROM, YARD_TO, YARD_GAIN, type GameState } from '../../engine/game'
import { setActiveMap } from '../../engine/maps'
import { setNewlandOpen } from '../../engine/newland'
import type { Build } from '../../engine/newland-build'
import { memoriesOf } from '../../engine/newland-life'
import { deserialize, serialize } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { FacilityView } from './FacilityView'

const yard: Build = { id: 'b1', kind: 'courtyard', x: 10, y: 12, facing: 'down', state: 'done',
  orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false }
function state(): GameState {
  const base = newGame(CONTENT)
  return { ...base, clock: { day: 20, minute: YARD_FROM }, scenes: [], map: 'newland',
    hearts: Object.fromEntries(CONTENT.neighbors.map(n => [n.id, 40])),
    flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1 },
    newland: { builds: [yard], tiles: {}, nextId: 2, settledDay: 20 } }
}
const reload = (s: GameState) => deserialize(serialize(s), CONTENT)!
beforeEach(() => localStorage.clear())
afterEach(() => { setActiveMap('village'); setNewlandOpen(false) })

describe('공동 마당 모임', () => {
  it.each([YARD_FROM - 1, YARD_TO, YARD_TO + 1])('%i분은 모임 시간 밖이고 상태를 바꾸지 않는다', minute => {
    const s = { ...state(), clock: { day: 20, minute } }
    expect(canGatherYard(s, CONTENT)).toBe('time')
    expect(gatherYard(s, CONTENT)).toBe(s)
  })

  it('닫힌 마당·친한 이웃 없음에는 모임을 정산하지 않는다', () => {
    const base = state()
    const closed = { ...base, newland: { ...base.newland!, builds: [{ ...yard, state: 'building' as const }] } }
    expect(canGatherYard(closed, CONTENT)).toBe('noYard')
    expect(gatherYard(closed, CONTENT)).toBe(closed)
    const lonely = { ...base, hearts: {} }
    expect(canGatherYard(lonely, CONTENT)).toBe('nobody')
    expect(gatherYard(lonely, CONTENT)).toBe(lonely)
  })

  it('해금되고 오늘 나오는 친한 이웃만 참석하며 클릭·저장 후 중복 모임을 막는다', () => {
    const s = state()
    const present = neighborsPresent(s, CONTENT)
    const expected = CONTENT.neighbors.filter(n => present.includes(n.id) && (s.hearts[n.id] ?? 0) >= 30).map(n => n.id)
    expect(expected.length).toBeGreaterThan(0)
    expect(yardFriends(s, CONTENT)).toEqual(expected)
    useGame.getState().load(s)
    useGame.setState({ modal: { kind: 'facility', id: 'courtyard' }, piecePopups: [], toast: null })
    syncHome(s)
    const view = render(<FacilityView id="courtyard" />)
    fireEvent.click(screen.getByRole('button', { name: T.newlandLife.yardGather }))
    const done = useGame.getState().game
    expect(done.flags.yardDay).toBe(20)
    expect(done.flags['yardMemo:20']).toBe(expected.length)
    for (const n of CONTENT.neighbors) {
      if (expected.includes(n.id)) expect(done.hearts[n.id]).toBe(heartUp(s, n.id, YARD_GAIN).hearts[n.id])
      else expect(done.hearts[n.id]).toBe(s.hearts[n.id])
    }
    expect(expected.some(id => done.hearts[id] > s.hearts[id])).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: T.newlandLife.yardGather }))
    expect(useGame.getState().game).toBe(done)
    expect(useGame.getState().toast?.text).toBe(T.newlandLife.yardAgain)
    view.unmount()
    const saved = reload(done)
    expect(canGatherYard(saved, CONTENT)).toBe('done')
    expect(gatherYard(saved, CONTENT)).toBe(saved)
    expect(memoriesOf(saved).filter(m => m.kind === 'yard' && m.day === 20)).toHaveLength(1)
    const morning = reload(goToSleep(saved, CONTENT))
    const afternoon = { ...morning, clock: { ...morning.clock, minute: YARD_FROM } }
    expect(canGatherYard(afternoon, CONTENT)).toBeNull()
    const again = gatherYard(afternoon, CONTENT)
    expect(again.flags.yardDay).toBe(21)
    expect(memoriesOf(reload(again)).filter(m => m.kind === 'yard')).toHaveLength(2)
  })
})

// 기존 생활 시나리오는 개편 이전 저장의 권한으로 검증한다. 새 해금은 late-growth.test.ts에서 검증한다.
import { legacyGame as newGame } from './growth-test-support'
import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT, PEOPLE } from '../content/catalog'
import { chooseInEvent, eventNow} from './game'
import { canPair, newGenState, relationId, type GenState, type Relation } from './gen'
import { slotPerson } from './gen-growth'
import { consultFor } from './gen-marriage'
import { settleOneDay } from './gen-settle'
import { setPeopleData, type PersonEvent } from './people'
import { ConsultBoard } from '../features/talk/ConsultBoard'
import { useGame } from '../store/game-store'
import { T } from '../content/text'

const a = 'g-0001', b = 'g-0002', pair = relationId(a, b)
const day = 200

// Two unrelated adult heirs, each occupying a different retired parent's slot.
function heirs(): GenState {
  const g = newGenState(CONTENT, 7, day)
  return { ...g, affinity: { [pair]: 85 }, relations: {},
    persons: { ...g.persons,
      [a]: { id: a, origin: 'born', born: 1, stage: 'adult', look: 'm', name: 'Aaron', parents: ['rudy'], spouse: null, household: null },
      [b]: { id: b, origin: 'born', born: 1, stage: 'adult', look: 'f', name: 'Beth', parents: ['cosmo'], spouse: null, household: null },
    }, retired: { rudy: { heir: a, day: 125 }, cosmo: { heir: b, day: 125 } } }
}

function relation(stage: Relation['stage']): Relation {
  return { id: pair, a, b, stage, since: 150,
    ...(stage === 'lover' ? { consult: { asked: [], answers: [], nextAsk: day, round: day } } : {}),
    ...(stage === 'preparing' ? { prep: { tasks: ['bread'], done: [], wedding: day + 5 } } : {}),
  }
}

afterEach(() => setPeopleData(PEOPLE))

describe('marriage slot/person regressions', () => {
  it('uses genuinely eligible, unrelated adult heirs', () => {
    const g = heirs()
    expect(slotPerson(g, 'rudy')).toBe(a)
    expect(slotPerson(g, 'cosmo')).toBe(b)
    expect(canPair(g, null, a, b)).toBe(true)
  })

  it.each(['fixed', 'heir'] as const)('blocks %s resident spouses in event availability and stale confession choices', kind => {
    const base = newGame(CONTENT)
    const id = kind === 'heir' ? a : 'rudy'
    let g = kind === 'heir' ? heirs() : newGenState(CONTENT, 7, day)
    const event: PersonEvent = { id: 'test:confess', title: 'Confession', stage: 0, at: { x: 1, y: 1 }, confess: true,
      lines: [], choices: [{ label: 'Accept', color: 'warm' as const, reply: [] }] }
    setPeopleData({ people: { rudy: { ...PEOPLE.people.rudy, events: [event] } }, threads: [] })
    const s = { ...base, gen: g, hearts: { ...base.hearts, rudy: 80 }, avatar: { ...base.avatar, name: 'Player', look: 'f' as const }, clock: { day, minute: 600 } }
    expect(eventNow(s, 'rudy')?.id).toBe(event.id)
    expect(chooseInEvent(s, event.id, 0).romance.partner).toBe('rudy')
    const spouse = kind === 'heir' ? b : 'poppy'
    g = { ...g, persons: { ...g.persons, [id]: { ...g.persons[id], spouse }, [spouse]: { ...g.persons[spouse], spouse: id } } }
    const married = { ...s, gen: g }
    expect(eventNow(married, 'rudy')).toBeNull()
    expect(chooseInEvent(married, event.id, 0).romance.partner).toBeNull()
  })

  it.each(['lover', 'preparing'] as const)('releases a player heir partner from resident %s relationships and prevents re-pairing', stage => {
    const g = { ...heirs(), relations: { [pair]: relation(stage) } }
    const base = newGame(CONTENT)
    const next = settleOneDay(g, day + 1, { romance: { ...base.romance, partner: 'rudy', stage: 'dating', since: day } }, CONTENT, {})
    expect(next.relations[pair]?.stage).not.toBe('lover')
    expect(next.relations[pair]?.stage).not.toBe('preparing')
    expect(next.log.some(l => l.kind === 'wedding' && l.who.includes(a))).toBe(false)
  })

  it('selects the consulting heir by slot hearts and records the UI answer', () => {
    const g = { ...heirs(), relations: { [pair]: relation('lover') } }
    const hearts = { rudy: 10, cosmo: 40 }
    expect(consultFor(g, a, hearts, day)).toBeNull()
    expect(consultFor(g, b, hearts, day)?.id).toBe(pair)
    const base = newGame(CONTENT)
    useGame.setState({ game: { ...base, gen: g, hearts, scenes: [], clock: { day, minute: 600 } } })
    render(<ConsultBoard />)
    fireEvent.click(screen.getByRole('button', { name: /고민 쪽지/ }))
    fireEvent.click(screen.getByRole('button', { name: T.gen.answers.cheer }))
    expect(useGame.getState().game.gen!.relations[pair].consult!.answers).toEqual(['cheer'])
  })

  it('keeps fixed resident consultation hearts working', () => {
    const g = newGenState(CONTENT, 7, day)
    const id = relationId('rudy', 'poppy')
    const fixed = { ...g, relations: { [id]: { ...relation('lover'), id, a: 'rudy', b: 'poppy' } } }
    expect(consultFor(fixed, 'poppy', { rudy: 10, poppy: 40 }, day)?.id).toBe(id)
  })
})

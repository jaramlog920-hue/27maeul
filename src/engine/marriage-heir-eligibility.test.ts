// 기존 생활 시나리오는 개편 이전 저장의 권한으로 검증한다. 새 해금은 late-growth.test.ts에서 검증한다.
import { slotPerson } from './gen-growth'
import { legacyGame as newGame } from './growth-test-support'
import { afterEach, expect, it } from 'vitest'
import { CONTENT, PEOPLE } from '../content/catalog'
import { breakUp, canGiveBouquet, chooseInEvent, eventNow, isSuitor, type GameState } from './game'
import { canPair, newGenState, relationId, type GenState } from './gen'
import { settleOneDay } from './gen-settle'
import { setPeopleData, type PersonEvent } from './people'
import { deserialize, serialize } from './save'

afterEach(() => setPeopleData(PEOPLE))

function fixture(look: 'm' | 'f' = 'm'): GameState & { gen: GenState } {
  const base = newGame(CONTENT)
  const gen = newGenState(CONTENT, 7, 200)
  const a = 'g-0001', b = 'g-0002', pair = relationId(a, b)
  return { ...base, clock: { day: 200, minute: 600 }, avatar: { ...base.avatar, name: 'Player', look: 'f' as const },
    hearts: { ...base.hearts, rudy: 100 }, inv: { ...base.inv, bouquet: 1 },
    gen: { ...gen, log: [], affinity: { [pair]: 85 }, relations: {
      [pair]: { id: pair, a, b, stage: 'friend' as const, since: 190 },
    }, persons: { ...gen.persons,
      [a]: { id: a, origin: 'born' as const, born: 1, stage: 'adult' as const, look, parents: ['rudy'], spouse: null, household: null },
      [b]: { id: b, origin: 'born' as const, born: 1, stage: 'adult' as const, look: 'f' as const, parents: ['cosmo'], spouse: null, household: null },
    }, retired: { rudy: { heir: a, day: 125 }, cosmo: { heir: b, day: 125 } } },
  }
}

it('uses the current heir appearance rather than the original resident for courtship', () => {
  const s = fixture('f')
  expect(s.gen.persons['g-0001'].look).toBe(s.avatar?.look)
  expect(canGiveBouquet(s, CONTENT.neighbors.find(n => n.id === 'rudy')!)).toBe('notSuitor')
})

it('allows an opposite-appearance heir in a formerly same-appearance resident slot', () => {
  const s = fixture('m')
  s.gen.retired = { cosmo: { heir: 'g-0002', day: 125 }, poppy: { heir: 'g-0001', day: 125 } }
  s.gen.persons['g-0001'].parents = ['poppy']
  s.hearts = { ...s.hearts, poppy: 100 }
  expect(canGiveBouquet(s, CONTENT.neighbors.find(n => n.id === 'poppy')!)).toBeNull()
})

it('honors the 14-day resident dating cooldown after breaking up with an heir', () => {
  const s = fixture()
  expect(canPair(s.gen, null, 'g-0001', 'g-0002')).toBe(true)
  const broken = breakUp({ ...s, romance: { ...s.romance, partner: 'rudy', stage: 'dating', since: 180 } }, 'rudy')
  expect(broken.flags['exPartner:rudy']).toBe(200)
  const next = settleOneDay(broken.gen!, 201, broken, CONTENT, {})
  expect(next.relations[relationId('g-0001', 'g-0002')]?.stage).toBe('friend')
})

// 2026-10-21 사용자: 은퇴를 없앴다 — 헤어진 뒤 저장을 불러오면 은퇴 기록이 지워져 부모 이웃이 제 자리로 돌아온다
// (내 연인·배우자인 동안만 그 자리를 남긴다)
it('after breaking up with an heir and reloading, the parent neighbor returns to the slot', () => {
  const s = fixture()
  const dating = { ...s, romance: { ...s.romance, partner: 'rudy', stage: 'dating' as const, since: 180 } }
  expect(deserialize(serialize(dating), CONTENT)!.gen?.retired?.rudy).toBeDefined()
  const broken = breakUp(dating, 'rudy')
  const restored = deserialize(serialize(broken), CONTENT)!
  expect(restored.gen?.retired?.rudy).toBeUndefined()
  expect(slotPerson(restored.gen, 'rudy')).toBe('rudy')
})

it('uses the same current-person rule for confession availability and acceptance', () => {
  const event: PersonEvent = { id: 'test:heir-confession', title: 'Confession', stage: 0,
    at: { x: 1, y: 1 }, confess: true, lines: [],
    choices: [{ label: 'Accept', color: 'warm', reply: [] }] }
  setPeopleData({ people: { rudy: { ...PEOPLE.people.rudy, events: [event] } }, threads: [] })
  const same = fixture('f')
  expect(eventNow(same, 'rudy')).toBeNull()
  expect(chooseInEvent(same, event.id, 0).romance.partner).toBeNull()
  const opposite = fixture('m')
  expect(eventNow(opposite, 'rudy')?.id).toBe(event.id)
  expect(chooseInEvent(opposite, event.id, 0).romance.partner).toBe('rudy')
})

it('keeps original residents eligible and does not guess a missing heir appearance', () => {
  const s = newGame(CONTENT)
  const rudy = CONTENT.neighbors.find(n => n.id === 'rudy')!
  expect(isSuitor({ ...s, avatar: { ...s.avatar, name: 'Player', look: 'f' } }, rudy)).toBe(true)
  expect(isSuitor({ ...s, avatar: { ...s.avatar, name: 'Player', look: 'm' } }, rudy)).toBe(false)
  const heir = fixture()
  delete (heir.gen.persons['g-0001'] as { look?: string }).look
  expect(isSuitor(heir, rudy)).toBe(false)
})

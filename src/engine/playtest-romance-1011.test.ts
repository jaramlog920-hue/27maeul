// 2026-10-11 연애·가족 점검(docs/playtest-연애가족-2026-10-11.md)에서 찾은 버그의 회귀 검사
import { afterEach, describe, expect, it } from 'vitest'
import { CONTENT, PEOPLE } from '../content/catalog'
import { chooseInEvent, eventNow, newGame, type GameState } from './game'
import { establishedGame, legacyGame } from './growth-test-support'
import { featureAccess } from './feature-rules'
import { NO_ROMANCE } from './romance'
import { setPeopleData, type PersonEvent } from './people'
import { newGenState } from './gen'
import { slotHeir } from './gen-growth'
import { companionsOf } from './gen-looks'

afterEach(() => setPeopleData(PEOPLE))

const confess: PersonEvent = { id: 'test:confess', title: 'Confession', stage: 0, at: { x: 1, y: 1 }, confess: true,
  lines: [], choices: [{ label: 'Accept', color: 'warm' as const, reply: [] }] }
const withConfess = () => setPeopleData({ people: { rudy: { ...PEOPLE.people.rudy, events: [confess] } }, threads: [] })
const player = (s: GameState): GameState => ({ ...s, avatar: { ...s.avatar!, name: 'Player', look: 'f' }, clock: { day: 60, minute: 600 } })

describe('1. 이미 연인·약혼·부부면 다른 후보의 고백 장면이 열리지 않는다', () => {
  it.each(['dating', 'engaged', 'married'] as const)('%s', (stage) => {
    withConfess()
    const s = player(legacyGame(CONTENT))
    expect(eventNow(s, 'rudy')?.id).toBe(confess.id)
    const taken = { ...s, romance: { ...NO_ROMANCE, partner: 'wendell', stage, since: 10 } }
    expect(eventNow(taken, 'rudy')).toBeNull()
    // 헤어지면 다시 열린다 (본 것으로 소모되지 않았다)
    expect(eventNow({ ...taken, romance: NO_ROMANCE }, 'rudy')?.id).toBe(confess.id)
  })
})

describe('결정 2. 성장 개편의 연애 잠금이 고백 장면에도 걸린다', () => {
  it('연애가 잠긴 새 저장은 고백이 열리지 않고, 골라도 연인이 되지 않는다', () => {
    withConfess()
    const s = player(establishedGame(CONTENT, 16))
    expect(featureAccess(s, 'suitors')).toBe('full')
    expect(featureAccess(s, 'dating')).not.toBe('full')
    expect(eventNow(s, 'rudy')).toBeNull()
    expect(chooseInEvent(s, confess.id, 0).romance.partner).toBeNull()
  })
  it('연애가 열리면 그때 고백이 열린다', () => {
    withConfess()
    const s = player(establishedGame(CONTENT, 17))
    expect(featureAccess(s, 'dating')).toBe('full')
    expect(eventNow(s, 'rudy')?.id).toBe(confess.id)
    expect(chooseInEvent(s, confess.id, 0).romance.partner).toBe('rudy')
  })
  it('옛 저장은 지금처럼 다 열림', () => {
    withConfess()
    expect(eventNow(player(legacyGame(CONTENT)), 'rudy')?.id).toBe(confess.id)
  })
})
void newGame

describe('결정 3. 은퇴 뒤에는 이어받은 자녀가 그 자리 주인으로 보이고, 은퇴한 부모는 곁에', () => {
  const retiredGen = (moved?: number) => {
    const g = newGenState(CONTENT, 7, 300)
    return { ...g, persons: { ...g.persons, 'g-0001': { id: 'g-0001', origin: 'born' as const, born: 100, stage: 'adult' as const, look: 'm' as const, name: '아치', parents: ['cosmo'], spouse: null, household: null } },
      retired: { cosmo: { heir: 'g-0001', day: 286, ...(moved != null ? { moved } : {}) } } }
  }
  it('이사 가지 않아도 자리 주인 모습은 자녀', () => {
    expect(slotHeir(retiredGen(), 'cosmo')?.id).toBe('g-0001')
    expect(slotHeir(retiredGen(300), 'cosmo')?.id).toBe('g-0001')
    expect(slotHeir(newGenState(CONTENT, 7, 300), 'cosmo')).toBeNull()
  })
  it('은퇴한 부모는 자녀 곁에 그려지고, 자녀는 곁 목록에 없다 (이사 갔으면 부모도 없다)', () => {
    const near = companionsOf(retiredGen(), 'cosmo')
    expect(near.some((c) => c.retiredParent === 'cosmo')).toBe(true)
    expect(near.some((c) => c.person.id === 'g-0001')).toBe(false)
    expect(companionsOf(retiredGen(300), 'cosmo').some((c) => c.retiredParent)).toBe(false)
  })
})

describe('결정 1. 후보 13명 고백 장면 모두 "지금은 친구로" 선택지가 있고, 고르면 연인이 되지 않는다', () => {
  const confessions = Object.values(PEOPLE.people).flatMap((p) => (p.events ?? []).filter((e) => e.confess).map((e) => ({ owner: p.id, e })))
  it('13명 모두 하나씩, 선택지 글은 16자 안', () => {
    expect(confessions).toHaveLength(13)
    for (const { e } of confessions) {
      const friends = (e.choices ?? []).filter((c) => c.stayFriends)
      expect(friends, e.id).toHaveLength(1)
      for (const c of e.choices ?? []) expect([...c.label].length, `${e.id} ${c.label}`).toBeLessThanOrEqual(16)
    }
  })
  it('친구로를 고르면 연인이 되지 않고, 고백은 본 것으로 남는다', () => {
    const s = player(legacyGame(CONTENT))
    for (const { owner, e } of confessions) {
      const i = e.choices!.findIndex((c) => c.stayFriends)
      const out = chooseInEvent({ ...s, life: { ...s.life!, seen: [...(s.life?.seen ?? []), e.id] } }, e.id, i)
      expect(out.romance.partner, owner).toBeNull()
    }
  })
})

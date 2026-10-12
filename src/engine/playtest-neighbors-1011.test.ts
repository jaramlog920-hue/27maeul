// 2026-10-11 이웃 생활 점검(docs/playtest-이웃생활-2026-10-11.md)·연애 점검 2에서 찾은 버그의 회귀 검사
import { afterEach, describe, expect, it } from 'vitest'
import { CONTENT, PEOPLE } from '../content/catalog'
import { isWet, weatherOf } from './calendar'
import { eventNow, freeNow, routineOf, type GameState } from './game'
import { newGenState } from './gen'
import { withPairs } from './gen-settle'
import { legacyGame } from './growth-test-support'
import { eventById, setPeopleData, type PersonEvent } from './people'
import { findPath } from './movement'
import { isWalkable } from './world'

afterEach(() => setPeopleData(PEOPLE))

const dryDay = (() => { let d = 3; while (isWet(weatherOf(d))) d++; return d })()
function village(minute: number): GameState {
  const s = legacyGame(CONTENT)
  const gen = { ...newGenState(CONTENT, 11, dryDay, withPairs()), on: true }
  const flags = { ...s.flags, villageLevel: 5, ...Object.fromEntries(CONTENT.neighbors.map((d) => [`movedIn:${d.id}`, 1])) }
  return { ...s, gen, flags, clock: { day: dryDay, minute } }
}

describe('1. 남의 이야기에 함께 나오는 이웃은 그 시각 자유 시간으로 흩어지지 않는다', () => {
  const story: PersonEvent = { id: 'test:withGrandpa', title: 'With', stage: 0, at: { x: 40, y: 7 }, when: { from: 900, to: 1020, weather: ['dry'] },
    with: ['grandpa'], lines: [], choices: [] } as PersonEvent
  it('사건이 열릴 수 있는 동안 할아버지는 자유 시간 목록에서 빠진다', () => {
    const s = village(15 * 60 + 30)
    expect(freeNow(s, CONTENT).has('grandpa')).toBe(true)
    setPeopleData({ people: { ...PEOPLE.people, marigold: { ...PEOPLE.people.marigold, events: [story] } }, threads: PEOPLE.threads })
    expect(freeNow(s, CONTENT).has('grandpa')).toBe(false)
    // 사건을 본 뒤에는 다시 자유 시간
    const seen = { ...s, life: { ...s.life!, seen: [...(s.life?.seen ?? []), story.id] } }
    expect(eventNow(seen, 'marigold')).toBeNull()
    expect(freeNow(seen, CONTENT).has('grandpa')).toBe(true)
  })
})

describe('연애 3. 할아버지 18:00~19:00 맑은 날은 포도원 앞(43,9) — 올리버 늦은 차가 열릴 수 있게', () => {
  it('저녁 여섯 시 반 할아버지 일과 자리', () => {
    const r = routineOf(village(18 * 60 + 30), 'grandpa')
    expect(r?.at).toEqual({ x: 43, y: 9 })
  })
  it('그 앞뒤는 그대로 쉬는 자리(41,7)', () => {
    expect(routineOf(village(15 * 60 + 30), 'grandpa')?.at).toEqual({ x: 41, y: 7 })
    expect(routineOf(village(19 * 60 + 15), 'grandpa')?.at).toEqual({ x: 41, y: 7 })
  })
})

/** 그 요일·시각에 사건이 열릴 조건을 갖춘 마을 — 함께 나오는 이웃은 일과 자리에 세운다 */
function storyDay(eventId: string, seen: string[], minute: number) {
  const { owner, event } = eventById(eventId)!
  const want = event.when!.days![0]
  let day = 3
  while (day % 7 !== want || isWet(weatherOf(day))) day++
  const base = village(minute)
  const hearts = Object.fromEntries(CONTENT.neighbors.map((d) => [d.id, 100]))
  let s: GameState = { ...base, clock: { day, minute }, hearts, life: { ...base.life!, seen } }
  const npcs = { ...s.npcs }
  for (const id of event.with ?? []) {
    const r = routineOf(s, id)!
    npcs[id] = { ...npcs[id], x: r.at.x, y: r.at.y, visible: true, path: [] }
  }
  npcs[owner] = { ...npcs[owner], x: event.at.x, y: event.at.y, visible: true, path: [] }
  s = { ...s, npcs }
  return { s, owner, event, cast: (event.with ?? []).map((id) => ({ x: npcs[id].x, y: npcs[id].y })) }
}
function reachable(from: { x: number; y: number }, at: { x: number; y: number }, blocked: { x: number; y: number }[]) {
  const block = new Set([at, ...blocked].map((t) => `${t.x},${t.y}`))
  return [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => {
    const t = { x: at.x + dx, y: at.y + dy }
    return isWalkable(t) && !block.has(`${t.x},${t.y}`) && findPath(from, t, block) !== null
  })
}

describe('2~4. 막혀 있던 이야기 사건은 함께 나오는 이웃이 제자리에 서면 열리고, 곁에 갈 수 있다', () => {
  it('핀 이야기 2: 나루 끝 한 칸 길을 목수가 막지 않는다', () => {
    const { s, owner, event, cast } = storyDay('fisher:story:2', ['fisher:story:1'], 17 * 60 + 20)
    expect(eventNow(s, owner)?.id).toBe(event.id)
    expect(reachable({ x: 24, y: 31 }, event.at, cast)).toBe(true)
  })
  it('대장장이 이야기 2: 목수와 틸리가 같은 칸에 서지 않는다', () => {
    const { s, owner, event, cast } = storyDay('smith:story:2', ['smith:story:1'], 16 * 60 + 20)
    expect(new Set(cast.map((t) => `${t.x},${t.y}`)).size).toBe(cast.length)
    expect(eventNow(s, owner)?.id).toBe(event.id)
    expect(reachable({ x: 6, y: 129 }, event.at, cast)).toBe(true)
  })
  it('목수 이야기 3: 대장장이 이야기 2와 시각이 겹치지 않고, 그 시각 루디·대장장이가 작업장 곁에 있다', () => {
    const { s, owner, event, cast } = storyDay('carpenter:story:3', ['carpenter:story:1', 'carpenter:story:2', 'smith:story:1'], (eventById('carpenter:story:3')!.event.when!.from ?? 0) + 20)
    const smith2 = eventById('smith:story:2')!.event.when!
    const w = event.when!
    expect(w.from! >= smith2.to! || w.to! <= smith2.from!).toBe(true)
    expect(eventNow(s, owner)?.id).toBe(event.id)
    expect(reachable({ x: 22, y: 129 }, event.at, cast)).toBe(true)
  })
})

import { planGathering, STAR_NIGHT_GAP } from './bonds'
import { goToSleep } from './game'

describe('5. 별 보는 밤을 놓쳐도 7일 간격을 두고 다시 잡는다 (그 사이엔 저녁 초대가 올 수 있다)', () => {
  it('한 번 잡은 날 뒤로 간격 안의 맑은 날은 잡지 않고, 간격이 지나면 다시', () => {
    expect(STAR_NIGHT_GAP).toBe(7)
    let d = 30
    while (planGathering(d, 3, {}) !== 'starNight') d++
    const flags = { starNightPlanned: d }
    for (let x = d + 1; x < d + STAR_NIGHT_GAP; x++) expect(planGathering(x, 3, flags), `${x}`).not.toBe('starNight')
    let next = d + STAR_NIGHT_GAP
    while (planGathering(next, 3, {}) !== 'starNight') next++
    expect(planGathering(next, 3, flags)).toBe('starNight')
  })
  it('잠들어 별 보는 밤이 잡히면 그날을 적어 둔다', () => {
    let d = 30
    while (planGathering(d, 3, {}) !== 'starNight') d++
    const s = village(22 * 60)
    const hearts = Object.fromEntries(Object.keys(s.npcs).map((id) => [id, 100]))
    const out = goToSleep({ ...s, hearts, clock: { day: d - 1, minute: 22 * 60 } }, CONTENT)
    expect(out.today.gathering).toBe('starNight')
    expect(out.flags.starNightPlanned).toBe(d)
  })
})

import { ourScore } from './villages'

describe('6. 서고 순위 점수는 끝낸 부탁 필사만 센다 (이웃 물건 부탁은 빼고)', () => {
  it('물건 부탁을 듣거나 마쳐도 점수가 오르지 않고, 부탁 필사는 2점씩', () => {
    const base = { collected: [], shelved: {}, careDone: [], flags: {} as Record<string, number> }
    expect(ourScore(base)).toBe(0)
    expect(ourScore({ ...base, flags: { 'req:baker:1': 1, 'req:child:2': 2 } })).toBe(0)
    expect(ourScore({ ...base, flags: { 'req:12:0': 3, 'req:gen:40:basil': 2, 'req:growth:board:intro': 1 } })).toBe(6)
  })
})

import { dine, inviteOpen, meetContext } from './game'
import { INVITE_DOORS } from './bonds'
import { ROOMS } from './world'

describe('7. 저녁 초대한 이웃은 18:00~20:30 제 집 안에 있고, 집에 있을 때만 저녁을 먹는다', () => {
  for (const id of Object.keys(INVITE_DOORS))
    it(id, () => {
      const room = ROOMS.find((r) => r.owner === id)!
      const s = { ...village(18 * 60 + 40), today: { ...village(0).today, inviter: id, dined: false } } as GameState
      expect(inviteOpen(s, id)).toBe(true)
      expect(meetContext(s, CONTENT).late[id]).toEqual(room.sit)
      const away = { ...s, npcs: { ...s.npcs, [id]: { ...s.npcs[id], x: 24, y: 20, visible: true, path: [] } } }
      expect(dine(away, id)).toBeNull()
      const home = { ...s, npcs: { ...s.npcs, [id]: { ...s.npcs[id], x: room.sit.x, y: room.sit.y, path: [] } } }
      expect(dine(home, id)?.today.dined).toBe(true)
    })
})

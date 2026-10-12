// 기존 생활 시나리오는 개편 이전 저장의 권한으로 검증한다. 새 해금은 late-growth.test.ts에서 검증한다.
import { legacyGame as newGame } from './growth-test-support'
import { CONTENT } from '../content/catalog'
import { goToSleep} from './game'
import { newGenState, relationId } from './gen'
import { MAX_CATCHUP } from './gen-config'
import { settleGen, withPairs } from './gen-settle'
import { deserialize, serialize } from './save'
import { RETIRE_AFTER, slotPerson } from './gen-growth'

const reload = (s: ReturnType<typeof newGame>) => deserialize(serialize(s), CONTENT)!

it('긴 미정산 아이는 다음 아침 성장·견습을 한 번 기록하고 한 계절 뒤 부모 자리를 이어받는다', () => {
  const base = newGame(CONTENT)
  const gen = newGenState(CONTENT, 7919, 85, withPairs())
  const id = 'g-0001'
  const baby = { id, origin: 'born' as const, born: 10, stage: 'teen' as const, look: 'm' as const,
    name: '아론', avatar: { skin: 2, top: 3 }, parents: ['rudy', 'poppy'], spouse: null, household: 'h-1' }
  let state = reload({ ...base, scenes: [], clock: { day: 130, minute: 600 }, gen: { ...gen,
    persons: { ...gen.persons, [id]: baby }, nextPerson: 2,
    households: { 'h-1': { id: 'h-1', members: ['rudy', 'poppy'], home: 'rudy', children: [id], lastBirth: 10, since: 1 } } } })
  state = reload(settleGen(state, CONTENT))
  // The seven-day catch-up intentionally ends at day 92, before adulthood on day 94.
  expect(state.gen!.persons[id].stage).toBe('teen')
  expect(state.gen!.heirs?.rudy).toBeUndefined()
  state = reload(goToSleep(state, CONTENT))
  expect(state.clock.day).toBe(131)
  expect(state.gen!.persons[id]).toMatchObject({ ...baby, stage: 'adult' })
  expect(state.gen!.heirs?.rudy).toEqual({ heir: id, since: 131 })
  expect(state.gen!.log.filter(l => l.kind === 'apprentice' && l.who.includes(id))).toHaveLength(1)
  for (let i = 1; i <= RETIRE_AFTER; i++) {
    state = reload(goToSleep(state, CONTENT))
    expect(state.gen!.persons[id].parents).toEqual(baby.parents)
    expect(state.gen!.households['h-1'].children).toEqual([id])
    expect(state.gen!.retired?.rudy).toEqual(i === RETIRE_AFTER ? { heir: id, day: 171 } : undefined)
  }
  expect(slotPerson(state.gen, 'rudy')).toBe(id)
  expect(state.gen!.persons.rudy).toBeDefined()
  expect(state.gen!.log.filter(l => l.kind === 'retired' && l.who.includes(id))).toHaveLength(1)
  const logs = state.gen!.log
  for (let i = 0; i < 3; i++) {
    state = reload(settleGen(state, CONTENT))
    expect(state.gen!.log).toEqual(logs)
    expect(state.gen!.retired?.rudy).toEqual({ heir: id, day: 171 })
    expect(state.gen!.persons[id].avatar).toEqual(baby.avatar)
  }
})

it.each([13, 401])('%i일 미정산 저장은 한도만 따라잡고 반복 정산/불러오기에 사건을 복제하지 않는다', (day) => {
  const base = newGame(CONTENT)
  const gen = newGenState(CONTENT, 7919, 1, withPairs())
  const pair = relationId('rudy', 'poppy')
  const stale = reload({ ...base, scenes: [], clock: { day, minute: 600 },
    gen: { ...gen, affinity: { ...gen.affinity, [pair]: 85 },
      meets: { [pair]: { day: 1, n: 2, last: 600 } } } })
  // Loading preserves the game date; autonomous-family catch-up runs at morning/explicit settlement.
  expect(stale.clock.day).toBe(day)
  const caught = settleGen(stale, CONTENT)
  expect(caught.gen!.settledDay).toBe(day)
  expect(caught.gen!.meets).toEqual({})
  expect(caught.gen!.log.length).toBeGreaterThan(0)
  for (const entry of caught.gen!.log) expect(entry.day).toBeLessThanOrEqual(1 + MAX_CATCHUP)
  expect(settleGen(caught, CONTENT).gen).toEqual(caught.gen)
  let saved = reload(caught)
  for (let i = 0; i < 3; i++) {
    saved = reload(settleGen(saved, CONTENT))
    expect(saved.gen!.log).toEqual(caught.gen!.log)
    expect(saved.gen!.persons).toEqual(caught.gen!.persons)
    expect(saved.gen!.relations).toEqual(caught.gen!.relations)
  }
  const morning = goToSleep(saved, CONTENT)
  expect(morning.gen!.settledDay).toBe(day + 1)
  expect(morning.gen!.log.slice(0, caught.gen!.log.length)).toEqual(caught.gen!.log)
  const once = reload(morning)
  expect(settleGen(once, CONTENT).gen!.log).toEqual(once.gen!.log)
})

it('자율 진행을 끈 미정산 저장은 관계 전환 없이 날짜만 정산한다', () => {
  const base = newGame(CONTENT)
  const gen = newGenState(CONTENT, 7919, 1, withPairs())
  const pair = relationId('rudy', 'poppy')
  const state = reload({ ...base, clock: { day: 401, minute: 600 }, gen: { ...gen, on: false,
    affinity: { ...gen.affinity, [pair]: 85 } } })
  const caught = settleGen(state, CONTENT)
  expect(caught.gen!.settledDay).toBe(401)
  expect(caught.gen!.relations).toEqual(state.gen!.relations)
  expect(caught.gen!.log).toEqual(state.gen!.log)
  expect(reload(caught).gen!.on).toBe(false)
})

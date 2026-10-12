import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { householdBabies } from '../render/village-followup-scene'
import { newGame } from './game'
import { activeEligible, canPair, newGenState, relationId, type GenState } from './gen'
import { giveCrib } from './gen-birth'
import { BIRTH_AFTER_CRIB, STAGE_AT } from './gen-config'
import { companionsOf } from './gen-looks'
import { homeOfFor, settleGen, settleOneDay } from './gen-settle'
import { ROOMS } from './world'
import { deserialize, serialize } from './save'

function successors(): GenState {
  const g = newGenState(CONTENT, 7, 150)
  return { ...g, nextPerson: 3, persons: { ...g.persons,
    'g-0001': { id: 'g-0001', origin: 'born', born: 10, stage: 'adult', look: 'm', parents: ['rudy', 'poppy'], spouse: null, household: 'h-0001' },
    'g-0002': { id: 'g-0002', origin: 'born', born: 10, stage: 'adult', look: 'f', parents: ['basil', 'penelope'], spouse: null, household: 'h-0002' },
  }, households: {
    'h-0001': { id: 'h-0001', members: ['rudy', 'poppy'], home: 'carpenter', children: ['g-0001'], lastBirth: 10, since: 1 },
    'h-0002': { id: 'h-0002', members: ['basil', 'penelope'], home: 'basil', children: ['g-0002'], lastBirth: 10, since: 1 },
  }, retired: { rudy: { heir: 'g-0001', day: 134 }, basil: { heir: 'g-0002', day: 134 } } }
}

function bornFamily() {
  let g = successors()
  expect(activeEligible(g, 'g-0001')).toBe(true)
  expect(canPair(g, null, 'g-0001', 'g-0002', () => false)).toBe(true)
  const id = relationId('g-0001', 'g-0002')
  g = { ...g, affinity: { ...g.affinity, [id]: 80 }, relations: { [id]: {
    id, a: 'g-0001', b: 'g-0002', stage: 'preparing', since: 140,
    prep: { wedding: 150, tasks: [], done: [] },
  } } }
  g = settleOneDay(g, 151, {}, CONTENT, {})
  const h = g.households[g.persons['g-0001'].household!]
  expect(g.relations[id].stage).toBe('spouse')
  expect(ROOMS.some((r) => r.owner === h.home)).toBe(true)
  g = settleOneDay({ ...g, affinity: { ...g.affinity, [id]: 100 } }, 152, {}, CONTENT, {})
  g = giveCrib(g, h.id, 152)!
  const day = 152 + BIRTH_AFTER_CRIB
  g = settleOneDay(g, day, {}, CONTENT, {})
  return { g, day, hid: h.id, child: g.households[h.id].children[0] }
}

describe('generated descendant visibility', () => {
  it('eligible successors wed in a real family room and their baby becomes one visible companion as it grows', () => {
    let { g, day, hid, child } = bornFamily()
    const room = ROOMS.find((r) => r.owner === g.households[hid].home)!
    const clock = { ...newGame(CONTENT).clock, day }
    expect(householdBabies({ gen: g, clock }, room).map((b) => b.baby.id)).toContain(child)
    expect(companionsOf(g, 'rudy').some((c) => c.person.id === child)).toBe(false)
    for (const stage of ['child', 'teen', 'adult'] as const) {
      g = settleOneDay(g, day + STAGE_AT[stage], {}, CONTENT, {})
      const all = CONTENT.neighbors.flatMap((n) => companionsOf(g, n.id)).filter((c) => c.person.id === child)
      expect(all).toHaveLength(1)
      expect(all[0].short).toBe(stage !== 'adult')
      expect(companionsOf(g, 'rudy').some((c) => c.person.id === child)).toBe(true)
      expect(householdBabies({ gen: g, clock: { ...clock, day: day + STAGE_AT[stage] } }, room)).toEqual([])
    }
  })

  it('repairs legacy generated homes on the already-settled day, including disabled simulation, without repeat changes', () => {
    const { g, day, hid, child } = bornFamily()
    const base = newGame(CONTENT)
    const legacy = { ...base, clock: { ...base.clock, day }, gen: { ...g, on: false, settledDay: day,
      households: { ...g.households, [hid]: { ...g.households[hid], home: 'g-0001' } },
    } }
    const before = JSON.stringify(legacy)
    const repaired = settleGen(legacy, CONTENT)
    const home = repaired.gen!.households[hid].home
    expect(home).toBe(homeOfFor(CONTENT, g)('g-0001').home)
    const room = ROOMS.find((r) => r.owner === home)!
    expect(householdBabies(repaired, room).map((b) => b.baby.id)).toContain(child)
    expect(JSON.stringify(legacy)).toBe(before)
    expect(settleGen(repaired, CONTENT)).toBe(repaired)
    const loaded = deserialize(serialize(legacy), CONTENT)!
    expect(loaded.gen!.households[hid].home).toBe(home)
    expect(loaded.gen!.settledDay).toBe(day)
    expect(loaded.gen!.households[hid].children).toEqual(g.households[hid].children)
    expect(householdBabies(loaded, room).map((b) => b.baby.id)).toContain(child)
  })

  it('resolves saved family rooms without succession and terminates cyclic ancestry', () => {
    const g = { ...successors(), retired: undefined }
    expect(homeOfFor(CONTENT, g)('g-0001')).toEqual({ home: 'carpenter', own: false })
    g.persons['g-0001'] = { ...g.persons['g-0001'], household: null, parents: ['g-0001'] }
    expect(companionsOf(g, 'rudy')).toEqual([])
    expect(homeOfFor(CONTENT, g)('g-0001').home).toBe('g-0001')
  })
})

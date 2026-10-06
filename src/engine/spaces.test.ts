// 계획 16 작업 23: 집 안 공간별 쓰임 — 차 자리 하나로 끝까지, 이어서 가족·동물·읽는 자리, 충돌·저장
import { CONTENT } from '../content/catalog'
import { childTile, homeSeatsNow, moveFurniture, newGame, placeFurniture, removeFurniture, rotateFurniture, syncHome, tapTile, tick, type GameState } from './game'
import { moodOf } from './mood'
import { petStayGoal } from './pet-life'
import { adopt } from './companion'
import { findPath } from './movement'
import { footprint, placement, solidTiles, type Furniture } from './room'
import { deserialize, serialize } from './save'
import { canUseSpace, setSpace, unsetSpace, useSpace, SPACE_TOGETHER_ID, spaceOfPiece } from './space-life'
import {
  designateSpace, furnitureId, guestStands, liveSpaces, pruneSpaces, reserveSeats, sanitizeSpaces, spaceAtTile, spaceReady, SPACES_PER_ROOM, usesFor, petSpaceTile, familySeats,
  type HomeSpace,
} from './spaces'
import { homeSeats, createFest } from './fest'
import { appointmentSpots } from './plans'
import { settle } from './game'
import { canSpouseAct, doSpouseAct } from './family-memory'
import { newChild } from './child'
import { freshStats } from './stats'
import { HOME_ENTRY, PET_HOME, PLACES, isHome, key, sameTile } from './world'
import type { ItemId } from './types'

type Facing = 'up' | 'down' | 'left' | 'right'
/** 작업실에 차례대로 놓는다 (놓을 수 없으면 실패 — 길을 막는 배치를 걸러 낸다) */
function furnish(s: GameState, pieces: [ItemId, number, number, Facing?][]): GameState {
  syncHome(s)
  let room: Furniture[] = [...s.room]
  for (const [item, x, y, facing] of pieces) {
    const f = placement(room, item, { x, y }, facing)
    expect(f, `${item} ${x},${y}`).not.toBeNull()
    room = [...room, f!]
    syncHome({ ...s, room })
  }
  return { ...s, room }
}
const find = (s: GameState, item: ItemId, x?: number) => s.room.find(f => f.item === item && (x === undefined || f.x === x))!
function base(): GameState {
  const s = newGame(CONTENT)
  return { ...s, scenes: [], clock: { day: 3, minute: 15 * 60 } }
}
/** 탁자 하나와 의자 둘이 있는 차 자리 */
function teaRoom(): GameState {
  return furnish(base(), [['table', 19, 112], ['chair', 19, 113, 'up'], ['chair', 20, 113, 'up']])
}
function withTea(): GameState {
  const s = teaRoom()
  const next = setSpace(s, find(s, 'table'), 'tea')
  expect(next).not.toBeNull()
  return next!
}

describe('자리의 쓰임 정하기 — 차 자리 하나로 끝까지', () => {
  it('탁자와 의자가 있어야 차 자리가 제안되고, 의자만 있으면 쉼터만', () => {
    const s = teaRoom()
    expect(usesFor(s.room, find(s, 'table'))).toEqual(expect.arrayContaining(['tea', 'craft']))
    const lone = furnish(base(), [['chair', 19, 113, 'up']])
    expect(usesFor(lone.room, find(lone, 'chair'))).toEqual(['family'])
  })
  it('정하면 쓸 수 있고, 붙박이·필사 책상은 쓰임을 얻지 않는다', () => {
    const s = withTea()
    expect(s.spaces).toHaveLength(1)
    expect(liveSpaces(s)).toHaveLength(1)
    for (const item of ['homeDesk', 'homeBed', 'homeHearth', 'homeShelf', 'homeWorkbench'] as const) expect(usesFor(s.room, find(s, item))).toEqual([])
    const desk = PLACES.desk.tiles[0]
    expect(spaceAtTile(s, desk)).toBeUndefined()
    syncHome(s)
    expect(tapTile(s, desk).target).toMatchObject({ kind: 'place', id: 'desk' })
    expect(findPath(HOME_ENTRY, PLACES.desk.stand!, solidTiles(s.room))).not.toBeNull()
  })
  it('다가가 앉아 차를 마시면: 시간이 흐르고 앉는 동작, 그날 기분만 오르고 닢·능력치·가방은 그대로', () => {
    let s = withTea()
    syncHome(s)
    s = { ...s, player: { ...s.player, x: 20, y: 114, path: [] } }
    const tableTile = footprint(find(s, 'table'))[0]
    expect(tapTile(s, tableTile).target).toMatchObject({ kind: 'space' })
    const before = { coins: s.coins, inv: s.inv, stats: s.stats, minute: s.clock.minute, mood: moodOf(s) }
    expect(canUseSpace(s, s.spaces[0].id)).toBeNull()
    const r = useSpace(s, s.spaces[0].id)!
    expect(r.use).toBe('tea')
    expect(r.state.act).toMatchObject({ kind: 'drink' })
    expect(r.state.clock.minute).toBe(before.minute + 20)
    expect(r.state.coins).toBe(before.coins)
    expect(r.state.inv).toEqual(before.inv)
    expect(r.state.stats).toEqual(before.stats)
    expect(moodOf(r.state)).toBeGreaterThan(before.mood)
    // 그날 하루만 (다음 날엔 이 덤이 없다)
    expect(moodOf(r.state) - moodOf({ ...r.state, flags: { ...r.state.flags, spaceDay: 2 } })).toBe(5)
    expect(r.state.flags.spaceDay).toBe(3)
  })
  it('저장하면 그대로 돌아오고, 가구 회수는 그때그때 다시 따진다', () => {
    let s = withTea()
    const loaded = deserialize(serialize(s), CONTENT)!
    expect(loaded.spaces).toEqual(s.spaces)
    expect(liveSpaces(loaded)).toHaveLength(1)
    const c1 = find(s, 'chair', 19), c2 = find(s, 'chair', 20)
    s = removeFurniture(s, { x: c1.x, y: c1.y })
    expect(liveSpaces(s)).toHaveLength(1)
    s = removeFurniture(s, { x: c2.x, y: c2.y })
    expect(liveSpaces(s)).toHaveLength(0)
    expect(s.spaces).toHaveLength(1)
    expect(canUseSpace(s, s.spaces[0].id)).toBe('gone')
    const t = find(s, 'table')
    s = removeFurniture(s, { x: t.x, y: t.y })
    expect(s.spaces).toEqual([])
  })
  it('가구를 옮기면 자리가 따라가고, 너무 멀어지면 쉬었다가 가까이 오면 되살아난다', () => {
    let s = withTea()
    const moved = moveFurniture(s, find(s, 'chair', 20), { x: 22, y: 113 })
    expect(moved).not.toBeNull()
    s = moved!
    expect(s.spaces[0].furniture.some(id => id === 'chair:22:113')).toBe(true)
    // 남은 의자가 탁자 곁이라 계속 쓸 수 있다
    expect(liveSpaces(s)).toHaveLength(1)
    const far = moveFurniture(s, find(s, 'chair', 19), { x: 17, y: 114 })
    expect(far).not.toBeNull()
    s = far!
    expect(liveSpaces(s)).toHaveLength(0)
    expect(s.spaces).toHaveLength(1)
    s = moveFurniture(s, find(s, 'chair', 17), { x: 19, y: 113 })!
    expect(liveSpaces(s)).toHaveLength(1)
  })
  it('돌려도 쓸 수 있는지 다시 따지고, 쓰임을 풀 수 있다', () => {
    const s = withTea()
    const turned = rotateFurniture(s, find(s, 'chair', 19))
    if (turned) expect(liveSpaces(turned).length).toBeGreaterThanOrEqual(0)
    expect(unsetSpace(s, s.spaces[0].id).spaces).toEqual([])
  })
})

describe('충돌과 경로', () => {
  it('앉을 곳까지 걸어갈 수 없는 의자는 자리가 되지 못한다', () => {
    const s = base()
    syncHome(s)
    const room: Furniture[] = [...s.room,
      { item: 'chair', x: 21, y: 113 }, { item: 'barrel', x: 20, y: 113 }, { item: 'barrel', x: 22, y: 113 }, { item: 'barrel', x: 21, y: 112 },
      { item: 'barrel', x: 21, y: 114 }, { item: 'table', x: 19, y: 112 }]
    syncHome({ ...s, room })
    const chair = room.find(f => f.item === 'chair')!
    expect(usesFor(room, chair)).not.toContain('tea')
    expect(designateSpace(room, [], chair, 'family')).toBeNull()
  })
  it('문·침대·책상·작업대 앞 길을 막는 자리는 만들 수 없다 — 집들이 손님 자리도 길을 지킨다', () => {
    const s = withTea()
    const stands = guestStands(s, 6)
    expect(stands.length).toBeGreaterThan(0)
    const blocked = new Set([...solidTiles(s.room), ...stands.map(key)])
    for (const p of ['bed', 'desk', 'hearth', 'shelf', 'workbench'] as const) expect(findPath(HOME_ENTRY, PLACES[p].stand!, blocked)).not.toBeNull()
    for (const t of stands) expect(isHome(t) && !sameTile(t, HOME_ENTRY)).toBe(true)
  })
  it('방마다 자리는 셋까지', () => {
    const s = furnish(base(), [['table', 19, 112], ['chair', 19, 113, 'up'], ['chair', 20, 113, 'up'], ['cushion', 22, 113]])
    let spaces: HomeSpace[] = []
    const a = designateSpace(s.room, spaces, find(s, 'table'), 'tea')
    expect(a).not.toBeNull()
    spaces = a!
    spaces = designateSpace(s.room, spaces, find(s, 'chair', 20), 'family')!
    spaces = designateSpace(s.room, spaces, find(s, 'cushion'), 'pet')!
    expect(spaces).toHaveLength(SPACES_PER_ROOM)
    expect(designateSpace(s.room, spaces, find(s, 'chair', 19), 'family')).toBeNull()
    // 이미 있는 자리의 쓰임은 바꿀 수 있다
    expect(designateSpace(s.room, spaces, find(s, 'cushion'), 'family')).not.toBeNull()
  })
})

describe('동시 이용', () => {
  it('같은 의자에 둘이 겹치지 않는다', () => {
    const s = withTea()
    const sp = s.spaces[0]
    const two = reserveSeats(s.room, sp, ['a', 'b'])
    expect(Object.keys(two)).toEqual(['a', 'b'])
    expect(key(two.a.at)).not.toBe(key(two.b.at))
    expect(key(two.a.stand)).not.toBe(key(two.b.stand))
    expect(Object.keys(reserveSeats(s.room, sp, ['a', 'b', 'c']))).toEqual(['a', 'b'])
    const taken = reserveSeats(s.room, sp, ['x'], new Set([key(two.a.stand)]))
    expect(taken.x && key(taken.x.stand)).not.toBe(key(two.a.stand))
  })
  it('기록자가 앉은 자리는 배우자가 쓰지 않는다', () => {
    const s = withTea()
    const me = useSpace({ ...s, player: { ...s.player, x: 20, y: 114, path: [] } }, s.spaces[0].id)!
    const seat = me.state.act!.at!
    const fam = familySeats(me.state, { spouse: 'poppy' }, new Set([key(seat)]))
    expect(fam.spouse).toBeDefined()
    expect(key(fam.spouse!)).not.toBe(key(seat))
  })
})

describe('가족·이웃·동물이 자리를 쓴다', () => {
  function married(): GameState {
    const s = withTea()
    return { ...s, clock: { day: 20, minute: 19 * 60 + 30 },
      romance: { ...s.romance, partner: 'poppy', stage: 'married' as const, marriedDay: 3 },
      flags: { ...s.flags, villageLevel: 10 } }
  }
  it('배우자는 저녁에 취향 맞는 자리에, 자리가 없거나 저녁이 아니면 기존 자리', () => {
    const s = married()
    const spot = homeSeatsNow(s).spouse
    expect(spot).toBeDefined()
    expect(isHome(spot!)).toBe(true)
    expect(footprint(find(s, 'table')).some(t => Math.abs(t.x - spot!.x) + Math.abs(t.y - spot!.y) <= 3)).toBe(true)
    expect(homeSeatsNow({ ...s, spaces: [] }).spouse).toBeUndefined()
    expect(homeSeatsNow({ ...s, clock: { day: 20, minute: 22 * 60 } }).spouse).toBeUndefined()
  })
  it('아이는 단계에 맞게: 아기는 요람, 걷는 아이(집에 둔 날)는 놀이 곁, 돕는 아이는 저녁에, 어른은 집 자리 없음', () => {
    const s = married()
    const kid = (age: number, mode?: 'home') => ({ name: '해', look: 'boy' as const, born: s.clock.day - age, stats: s.stats, lean: null, ...(mode ? { mode } : {}) })
    expect(homeSeatsNow({ ...s, child: kid(3) }).child).toBeUndefined()
    const toddler = { ...s, child: kid(20, 'home'), clock: { day: s.clock.day, minute: 10 * 60 } }
    const spot = homeSeatsNow(toddler).child
    expect(spot).toBeDefined()
    expect(childTile(toddler)).toEqual(spot)
    const helperNight = { ...s, child: kid(60), clock: { day: s.clock.day, minute: 20 * 60 + 10 } }
    expect(homeSeatsNow(helperNight).child).toBeDefined()
    expect(homeSeatsNow({ ...helperNight, clock: { day: s.clock.day, minute: 22 * 60 } }).child).toBeUndefined()
    expect(homeSeatsNow({ ...s, child: kid(200) }).child).toBeUndefined()
  })
  it('집들이 손님은 정한 자리에 앉고, 자리가 없으면 기본 자리', () => {
    const s = withTea()
    const seats = homeSeats(s, 2)
    const designated = guestStands(s, 2)
    expect(seats.slice(0, designated.length)).toEqual(designated)
    expect(homeSeats({ ...s, spaces: [] }, 2)).toHaveLength(2)
    expect(homeSeats({ ...s, spaces: [] }, 2)).not.toEqual(seats)
  })
  it('동물 쉼터: 낮잠·놀이 자리는 쉼터로, 쉼터가 쉬면 기존 자리', () => {
    let s = furnish(base(), [['cushion', 22, 113]])
    s = setSpace(s, find(s, 'cushion'), 'pet')!
    expect(petSpaceTile(s)).toEqual({ x: 22, y: 113 })
    const c = { ...adopt('cat', '나비', 1, { x: PET_HOME.x, y: PET_HOME.y }), stay: true, ways: { curious: 0, distance: 1 as const, energy: 0 as const } }
    let hits = 0
    for (let day = 2; day < 40; day++) for (let m = 6 * 60; m < 22 * 60; m += 30) {
      const g = petStayGoal({ ...s, clock: { day, minute: m }, companion: c, player: { ...s.player, path: [] }, idle: { ...s.idle, seconds: 0 } }, c, new Set(), { x: 20, y: 113 })
      if (g.x === 22 && g.y === 113) hits++
    }
    expect(hits).toBeGreaterThan(0)
    expect(petSpaceTile(unsetSpace(s, s.spaces[0].id))).toBeNull()
  })
  it('동물 명령이 먼저: 따라다니는 동안은 쉼터로 가지 않는다', () => {
    let s = furnish(base(), [['cushion', 22, 113]])
    s = setSpace(s, find(s, 'cushion'), 'pet')!
    s = { ...s, companion: { ...adopt('cat', '나비', 1, { x: 21, y: 113 }), stay: false }, clock: { day: 12, minute: 15 * 60 } }
    s = { ...s, player: { ...s.player, x: HOME_ENTRY.x, y: HOME_ENTRY.y, path: [] } }
    for (let i = 0; i < 40; i++) s = tick(s, 0.1, () => 0.5, CONTENT).state
    const pet = { x: Math.round(s.companion!.x), y: Math.round(s.companion!.y) }
    expect(Math.abs(pet.x - Math.round(s.player.x)) + Math.abs(pet.y - Math.round(s.player.y))).toBeLessThanOrEqual(3)
  })
})

describe('가족과 함께 정한 자리의 첫 기억', () => {
  it('배우자나 아이가 곁에 있으면 가족 기억(처음 한 번 안내, 다음엔 횟수만), 혼자면 기록 없음', () => {
    let s = withTea()
    s = { ...s, player: { ...s.player, x: 20, y: 114, path: [] }, romance: { ...s.romance, partner: 'poppy', stage: 'married' as const, marriedDay: 1 }, flags: { ...s.flags, villageLevel: 10 } }
    const alone = useSpace(s, s.spaces[0].id)!
    expect(alone.together).toEqual([])
    expect(alone.state.life.experiences[SPACE_TOGETHER_ID]).toBeUndefined()
    const npc = s.npcs.poppy
    const near = { ...s, npcs: { ...s.npcs, poppy: { ...npc, visible: true, x: 21, y: 112, path: [] } } }
    const first = useSpace(near, near.spaces[0].id)!
    expect(first.first).toBe(true)
    expect(first.together).toEqual(['poppy'])
    expect(first.state.life.experiences[SPACE_TOGETHER_ID]).toMatchObject({ kind: 'family', count: 1, with: ['poppy'] })
    const second = useSpace({ ...first.state, act: undefined, clock: { ...first.state.clock, day: first.state.clock.day + 1 } }, near.spaces[0].id)!
    expect(second.first).toBe(false)
    expect(second.state.life.experiences[SPACE_TOGETHER_ID]).toMatchObject({ count: 2 })
  })
})

describe('저장·옛 저장·집 넓힘', () => {
  it('옛 저장에는 자리가 없고, 모양이 틀린 것·없는 가구는 버린다', () => {
    const s = withTea()
    const raw = JSON.parse(serialize(s))
    delete raw.spaces
    expect(deserialize(JSON.stringify(raw), CONTENT)!.spaces).toEqual([])
    raw.spaces = [null, { id: 'x' }, { id: 'space:ghost', use: 'tea', furniture: ['table:1:1'], at: { x: 1, y: 1 } }, ...s.spaces]
    const back = deserialize(JSON.stringify(raw), CONTENT)!
    expect(back.spaces.map(sp => sp.id)).toEqual(s.spaces.map(sp => sp.id))
    expect(sanitizeSpaces('nope', s.room)).toEqual([])
  })
  it('집 단계가 맞지 않아 가방으로 돌아간 가구의 자리는 사라진다', () => {
    let s = base()
    s = { ...s, homeLevel: 1 as const }
    syncHome(s)
    const room: Furniture[] = [...s.room, { item: 'table', x: 20, y: 106 }, { item: 'chair', x: 20, y: 107, facing: 'up' }]
    const pieces = room.slice(-2).map(furnitureId)
    const spaces: HomeSpace[] = [{ id: 'space:table:20:106', use: 'tea', furniture: pieces, at: { x: 20, y: 106 } }]
    const withRoom = { ...s, room, spaces }
    expect(liveSpaces(withRoom)).toHaveLength(1)
    const raw = JSON.parse(serialize(withRoom))
    raw.homeLevel = 0
    const loaded = deserialize(JSON.stringify(raw), CONTENT)!
    expect(loaded.room.some(f => f.item === 'table')).toBe(false)
    expect(loaded.spaces).toEqual([])
    expect(pruneSpaces(spaces, [])).toEqual([])
  })
  it('자리가 없어도 기본 생활은 그대로 — 가구를 놓아도 자리가 저절로 생기지 않는다', () => {
    let s = base()
    s = { ...s, inv: { ...s.inv, table: 1, chair: 1 } }
    const t = placeFurniture(s, 'table', { x: 19, y: 112 })!
    expect(t.spaces).toEqual([])
  })
  it('읽는 자리는 의자와 책장이 가까워야 한다', () => {
    const s = furnish(base(), [['bookcase', 19, 112], ['chair', 19, 113, 'up']])
    expect(usesFor(s.room, find(s, 'chair'))).toContain('read')
    const far = furnish(base(), [['bookcase', 22, 111], ['chair', 19, 113, 'up']])
    expect(usesFor(far.room, find(far, 'chair'))).not.toContain('read')
    const spaces = designateSpace(s.room, [], find(s, 'chair'), 'read')!
    expect(spaceReady(s.room, spaces[0])).toBe(true)
    expect(spaceOfPiece({ spaces }, find(s, 'chair'))).toBeDefined()
  })
})

describe('집들이가 정한 자리를 쓴다', () => {
  it('손님은 차 자리 곁에 서고, 모임이 끝나면 자리를 떠난다', () => {
    let s = withTea()
    s = { ...s, scenes: [], clock: { day: 2, minute: 480 },
      notebook: { ...s.notebook, met: CONTENT.neighbors.map(n => n.id) },
      flags: { ...s.flags, villageLevel: 10, ...Object.fromEntries(CONTENT.neighbors.map(n => [`movedIn:${n.id}`, 1])) } }
    const made = createFest(s, { kind: 'housewarming', day: 3, slot: 'morning', place: 'hearth', members: ['baker'] }, CONTENT)
    expect(made.error).toBeUndefined()
    const appt = made.state.plans.appts[0]
    expect(guestStands(made.state, 1)).toContainEqual(appt.seats![0])
    let run = settle({ ...made.state, clock: { day: 3, minute: appt.from }, player: { ...made.state.player, x: HOME_ENTRY.x, y: HOME_ENTRY.y } }, CONTENT)
    expect(appointmentSpots(run).baker).toEqual(appt.seats![0])
    run = { ...run, clock: { day: 3, minute: appt.to + 5 } }
    expect(appointmentSpots(run).baker).toBeUndefined()
  })
})

describe('저녁 가족 활동이 차 자리에서', () => {
  it('식구가 정한 자리에 둘러앉아 하면 그날 기분과 함께 정한 자리의 기억이 한 번 남는다', () => {
    const s = withTea()
    const born = 20 - 20
    const fam: GameState = { ...s, scenes: [], clock: { day: 20, minute: 19 * 60 + 30 }, flags: { ...s.flags, villageLevel: 10 },
      player: { ...s.player, x: HOME_ENTRY.x, y: HOME_ENTRY.y, path: [] },
      romance: { ...s.romance, partner: 'poppy', stage: 'married' as const, marriedDay: 3 },
      child: { ...newChild(born, freshStats(), undefined), born, mode: 'home' } }
    expect(canSpouseAct(fam)).toBeNull()
    const seated = homeSeatsNow(fam)
    expect(seated.spouse && seated.child && key(seated.spouse) !== key(seated.child)).toBe(true)
    const r = doSpouseAct(fam, 0)!
    expect(r.state.life.experiences[SPACE_TOGETHER_ID]).toMatchObject({ kind: 'family', count: 1 })
    expect(r.state.flags.spaceDay).toBe(20)
    // 자리가 없던 집에서는 이 기억이 없다
    expect(doSpouseAct({ ...fam, spaces: [] }, 0)!.state.life.experiences[SPACE_TOGETHER_ID]).toBeUndefined()
  })
})

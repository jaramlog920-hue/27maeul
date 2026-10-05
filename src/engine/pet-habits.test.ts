// 계획 16 작업 21: 반려동물의 습관·산책 기억·이웃 접근 (성향·저장 기본은 pet-ways.test.ts)
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { petEventText } from '../content/pet-text'
import { adopt, comesToPlayer, favoriteSpot, favoriteToy, interactPet, petFollowPose, petHabit, petHomeGoal, petSpotSafe, petWays, PET_TOYS, sanitizeCompanion, walkPlaceAt, type Companion } from './companion'
import { copyMinutes, newGame, setCompanionStay, tick, type GameEvent, type GameState } from './game'
import { petLife, petStayGoal } from './pet-life'
import { dayOf } from './calendar'
import { HOME_ENTRY, HOME_ROOM, isHome, key, PET_HOME, PLACES, WARPS } from './world'

const zero = () => 0
const mk = (kind: 'cat' | 'dog', name: string, ways: Companion['ways'], since = 1): Companion =>
  ({ ...adopt(kind, name, since, { x: PET_HOME.x, y: PET_HOME.y }), ways })
const at = (c: Companion) => ({ x: Math.round(c.x), y: Math.round(c.y) })
const pet = mk('cat', '나비', { curious: 1, distance: 1, energy: 1 }, 2)

describe('습관: 성향에 따라 하루가 다르게 보이고, 같은 조건이면 늘 같다', () => {
  const active = mk('cat', '나비', { curious: 2, distance: 1, energy: 2 })
  const calm = mk('cat', '구름', { curious: 0, distance: 1, energy: 0 })
  const sunny = dayOf('spring', 4)
  const keysOf = (c: Companion, day: number, w: 'sunny' | 'rain' = 'sunny') => {
    const out: string[] = []
    for (let m = 6 * 60; m < 22 * 60; m += 20) out.push(petHabit(c, day, m, w).key)
    return out
  }
  it('활동량 높은 고양이는 놀이·살피기가 보이고, 조용한 고양이는 낮잠이 많다', () => {
    expect(keysOf(active, sunny)).toContain('toyPlay')
    expect(keysOf(calm, sunny)).not.toContain('toyPlay')
    const naps = (c: Companion) => keysOf(c, sunny).filter((k) => /Nap|afterMeal/.test(k)).length
    expect(naps(calm)).toBeGreaterThan(naps(active))
  })
  it('고양이는 창가, 강아지는 문 앞 기다리기가 아침에 나온다', () => {
    expect(petHabit(active, sunny, 7 * 60, 'sunny')).toMatchObject({ spot: 'window' })
    expect(petHabit(mk('dog', '누렁이', { curious: 1, distance: 1, energy: 1 }), sunny, 7 * 60, 'sunny')).toMatchObject({ spot: 'door', pose: 'wait', key: 'doorWait' })
  })
  it('식사 뒤에는 쉬고, 비 오는 날은 집 안, 여름 한낮은 시원한 바닥, 겨울 오후는 화덕 곁', () => {
    expect(petHabit(active, sunny, 13 * 60 + 10, 'sunny').key).toBe('afterMeal')
    expect(petHabit(calm, sunny, 10 * 60, 'rain').key).toBe('rainBlanket')
    expect(petHabit(active, sunny, 10 * 60, 'rain').key).toBe('rainWindow')
    expect(petHabit(calm, dayOf('summer', 5), 14 * 60, 'sunny')).toMatchObject({ spot: 'cool', pose: 'nap' })
    expect(petHabit(calm, dayOf('winter', 5), 16 * 60, 'sunny')).toMatchObject({ spot: 'hearth', pose: 'nap' })
  })
  it('같은 입력은 같은 결과(저장 없이 다시 계산)이고, 좋아하는 자리·장난감은 이름+입양일로 늘 같다', () => {
    expect(keysOf(active, sunny)).toEqual(keysOf({ ...active }, sunny))
    expect(favoriteSpot(active)).toBe(favoriteSpot(mk('cat', '나비', { curious: 0, distance: 0, energy: 0 })))
    expect(PET_TOYS.cat as readonly string[]).toContain(favoriteToy(active))
    expect(PET_TOYS.dog as readonly string[]).toContain(favoriteToy(mk('dog', '콩이', undefined)))
  })
  it('자세가 어지럽게 바뀌지 않는다 (반복 빈도)', () => {
    const seq = keysOf(active, sunny)
    let changes = 0
    for (let i = 1; i < seq.length; i++) if (seq[i] !== seq[i - 1]) changes++
    expect(changes).toBeLessThanOrEqual(10)
  })
  it('따라다니며 가만히 설 때 작은 자세는 잠깐 보이고 15초가 넘으면 졸기는 그리는 쪽', () => {
    expect(petFollowPose(active, 1, 'sunny')).toBeNull()
    expect(petFollowPose(active, 5, 'sunny')).toBe('wait')
    expect(petFollowPose(active, 10, 'sunny')).toBe('sniff')
    expect(petFollowPose(calm, 10, 'sunny')).toBe('wait')
    expect(petFollowPose(active, 20, 'sunny')).toBeNull()
  })
})

describe('안전한 쉬는 자리: 문과 길을 막지 않는다', () => {
  const spots = ['door', 'window', 'blanket', 'toy', 'hearth', 'cool'] as const
  it('어느 자리·성향이든 문깔개·들어오는 칸·문 곁이 아니고 집 안 모든 바닥에 닿는다', () => {
    for (const kind of ['cat', 'dog'] as const) for (const distance of [0, 1, 2]) for (const spot of spots) {
      const c = mk(kind, '테스트', { curious: 1, distance, energy: 1 })
      const g = petHomeGoal(c, new Set(), spot)
      expect(isHome(g)).toBe(true)
      expect(petSpotSafe(g)).toBe(true)
      expect(WARPS.has(key(g))).toBe(false)
      expect(key(g)).not.toBe(key(HOME_ENTRY))
      expect(Math.abs(g.x - HOME_ROOM.exit.x) + Math.abs(g.y - HOME_ROOM.exit.y)).toBeGreaterThan(1)
    }
  })
  it('꾸미기로 그 자리에 가구가 놓이면 안전한 다른 칸으로 옮기고, 놓인 가구 칸은 쓰지 않는다', () => {
    const c = mk('cat', '나비', { curious: 1, distance: 1, energy: 1 })
    const blocked = new Set<string>()
    const seen = new Set<string>()
    for (let i = 0; i < 12; i++) {
      const g = petHomeGoal(c, blocked, 'window')
      expect(blocked.has(key(g))).toBe(false)
      expect(petSpotSafe(g, blocked)).toBe(true)
      seen.add(key(g))
      blocked.add(key(g))
    }
    expect(seen.size).toBe(12)
  })
  it('문 앞 길목을 가구가 좁혀도 길을 끊는 칸에는 두지 않는다', () => {
    const blocked = new Set([key({ x: HOME_ENTRY.x - 1, y: HOME_ENTRY.y }), key({ x: HOME_ENTRY.x + 1, y: HOME_ENTRY.y })])
    expect(petSpotSafe({ x: HOME_ENTRY.x, y: HOME_ENTRY.y - 1 }, blocked)).toBe(false)
    expect(petSpotSafe(HOME_ENTRY, blocked)).toBe(false)
  })
  it('따라다니는 동물도 문·문깔개 위에는 서지 않는다', () => {
    const s0 = newGame(CONTENT)
    const side = { x: HOME_ENTRY.x - 1, y: HOME_ENTRY.y }
    let s: GameState = { ...s0, npcs: {}, companion: { ...mk('dog', '누렁이', undefined), stay: false, ...side }, player: { ...s0.player, ...HOME_ENTRY, path: [] } }
    for (let i = 0; i < 80; i++) s = tick(s, 0.05, zero, CONTENT).state
    expect(WARPS.has(key(at(s.companion!)))).toBe(false)
  })
})

describe('집에 두기·따라다니기 명령이 습관보다 먼저', () => {
  it('따라다니기: 습관 시간이어도 기록자 곁을 따라온다', () => {
    const s0 = newGame(CONTENT)
    let s: GameState = { ...s0, npcs: {}, clock: { ...s0.clock, minute: 7 * 60 }, companion: { ...mk('dog', '누렁이', { curious: 1, distance: 1, energy: 1 }), stay: false, x: s0.player.x + 1, y: s0.player.y } }
    for (let i = 0; i < 60; i++) s = tick(s, 0.05, zero, CONTENT).state
    expect(Math.abs(s.companion!.x - s.player.x) + Math.abs(s.companion!.y - s.player.y)).toBeLessThanOrEqual(1.5)
  })
  it('집에 두기: 기록자가 집 밖에 있어도 집 안 습관 자리에 머문다', () => {
    const s0 = newGame(CONTENT)
    let s = setCompanionStay({ ...s0, npcs: {}, companion: mk('cat', '나비', { curious: 1, distance: 1, energy: 1 }) }, true)
    s = { ...s, player: { ...s.player, x: 10, y: 9, path: [] } }
    for (let i = 0; i < 200; i++) s = tick(s, 0.1, zero, CONTENT).state
    expect(isHome(at(s.companion!))).toBe(true)
    expect(s.companion!.stay).toBe(true)
  })
  it('습관 자리가 막히면 다른 칸을 쓴다', () => {
    const s0 = newGame(CONTENT)
    const c = { ...mk('cat', '나비', { curious: 1, distance: 1, energy: 1 }), stay: true }
    const s = { ...s0, clock: { ...s0.clock, minute: 7 * 60 }, player: { ...s0.player, x: 10, y: 9, path: [] } }
    const occupied = new Set<string>()
    const goal1 = petStayGoal(s, c, occupied, { x: 10, y: 9 })
    occupied.add(key(goal1))
    const goal2 = petStayGoal(s, c, occupied, { x: 10, y: 9 })
    expect(key(goal2)).not.toBe(key(goal1))
  })
  it('친숙해지기 전에는 먼저 곁으로 오지 않고, 거리가 먼 성향은 더 오래 지난 뒤', () => {
    const near = { ...mk('cat', '가까이', { curious: 1, distance: 0, energy: 1 }, 1), found: ['play' as const] }
    const far = { ...mk('cat', '멀리', { curious: 1, distance: 2, energy: 1 }, 1), found: ['play' as const, 'rest' as const] }
    expect(comesToPlayer({ ...near, found: [] }, 10)).toBe(false)
    expect(comesToPlayer(near, 3)).toBe(true)
    expect(comesToPlayer(far, 5)).toBe(false)
    expect(comesToPlayer(far, 12)).toBe(true)
  })
})

describe('하루 종일 돌려 보기', () => {
  it('집에 둔 동물이 하루 내내 문·문깔개·들어오는 칸을 밟지 않고 집 안 자리를 옮겨 다닌다', () => {
    const s0 = newGame(CONTENT)
    let s: GameState = setCompanionStay({ ...s0, npcs: {}, scenes: [], companion: mk('cat', '나비', { curious: 2, distance: 1, energy: 2 }) }, true)
    s = { ...s, player: { ...s.player, x: 10, y: 9, path: [] } }
    const seen = new Set<string>()
    for (let i = 0; i < 900; i++) {
      s = { ...s, scenes: [] }
      s = tick(s, 2, zero, CONTENT).state
      const t = at(s.companion!)
      seen.add(key(t))
      expect(isHome(t)).toBe(true)
      expect(WARPS.has(key(t))).toBe(false)
      expect(key(t)).not.toBe(key(HOME_ENTRY))
    }
    expect(seen.size).toBeGreaterThan(1)
  })
})

describe('옛 저장과 새 필드', () => {
  it('새 필드가 없던 옛 저장은 빈 기록으로 열리고 입양일·이름·이동 상태는 그대로', () => {
    const old = { kind: 'dog', name: '누렁이', since: 3, x: 5, y: 6, path: [], facing: 'down', walkTime: 0, stay: true, found: ['play'], moments: { play: 4 } } as unknown as Companion
    const c = sanitizeCompanion(old)!
    expect(c).toMatchObject({ name: '누렁이', since: 3, stay: true, found: ['play'], moments: { play: 4 }, plays: 0, walked: {}, met: {} })
    expect(c.ways).toEqual(petWays(old))
  })
  it('모양이 틀린 산책·만남 기록은 버린다', () => {
    const bad = { ...pet, walked: { nowhere: 3, well: 0, hill: 5 }, met: { shepherd: { n: -1, last: 4 }, dexter: { n: 2, last: 6 } }, plays: -4, found: ['toy', 'bogus'] } as unknown as Companion
    const c = sanitizeCompanion(bad)!
    expect(c.walked).toEqual({ hill: 5 })
    expect(c.met).toEqual({ dexter: { n: 2, last: 6 } })
    expect(c.plays).toBe(0)
    expect(c.found).toEqual(['toy'])
  })
})

describe('놀이 — 좋아하는 장난감 알아보기', () => {
  it('세 번 함께 놀면 좋아하는 장난감을 알게 되고 그 날짜를 남긴다 (보상 없음)', () => {
    let c: Companion = pet
    for (let i = 0; i < 3; i++) c = interactPet(c, 'play', 3 + i, 600)!
    expect(c.found).toContain('toy')
    expect(c.moments?.toy).toBe(5)
    expect(interactPet(c, 'play', 9, 600)!.moments?.toy).toBe(5)
  })
})

describe('함께 걸은 곳의 기억과 이웃·아이와 마주침', () => {
  const well = PLACES.well.stand!
  const base = (c: Companion, extra: Partial<GameState> = {}): GameState => {
    const s0 = newGame(CONTENT)
    return { ...s0, npcs: {}, scenes: [], clock: { ...s0.clock, day: 21, minute: 10 * 60 }, player: { ...s0.player, x: well.x, y: well.y, path: [] }, companion: { ...c, stay: false, x: well.x + 1, y: well.y, path: [] }, ...extra }
  }
  const petEvents = (ev: GameEvent[]) => ev.filter((e): e is Extract<GameEvent, { type: 'pet' }> => e.type === 'pet')
  const dog = mk('dog', '누렁이', { curious: 1, distance: 1, energy: 1 })
  const calm = (s: GameState): GameState => ({ ...s, companion: { ...s.companion!, motion: undefined } })

  it('처음 닿은 곳은 기록하고 처음 걸은 날을 남기며, 같은 곳은 한 번만 알리고 여섯 시간 뒤 낯익은 반응', () => {
    const ev: GameEvent[] = []
    let s = petLife(base(dog), well, ev, null)
    expect(petEvents(ev).map((e) => e.key)).toEqual(['firstWalk'])
    expect(s.companion!.walked).toEqual({ well: s.clock.day })
    expect(s.companion!.moments?.walk).toBe(s.clock.day)
    expect(s.companion!.found).toContain('walk')
    expect(s.companion!.motion?.action).toBe('sniff')
    const ev2: GameEvent[] = []
    s = petLife(calm(s), well, ev2, null)
    expect(petEvents(ev2)).toHaveLength(0)
    const ev3: GameEvent[] = []
    s = petLife(calm({ ...s, clock: { ...s.clock, minute: s.clock.minute + 400 } }), well, ev3, null)
    expect(petEvents(ev3).map((e) => e.key)).toEqual(['knownPlace'])
    expect(s.companion!.motion?.action).toBe('wag')
    expect(petEventText(petEvents(ev3)[0], s.companion!)).toContain('우물가')
  })
  it('집에 둔 동물은 걷지 않으므로 산책 기억이 생기지 않는다', () => {
    const ev: GameEvent[] = []
    const s0 = base(dog)
    const s = petLife({ ...s0, companion: { ...s0.companion!, stay: true } }, well, ev, null)
    expect(petEvents(ev)).toHaveLength(0)
    expect(s.companion!.walked ?? {}).toEqual({})
  })
  it('walkPlaceAt은 정해진 마을 자리 곁에서만 이름을 돌려준다', () => {
    expect(walkPlaceAt(well)).toBe('well')
    expect(walkPlaceAt({ x: 1, y: 1 })).toBeNull()
  })

  // 이웃 마주침은 걷기 기억이 없는 길 위에서 (한 번에 한 가지 반응만)
  const road = { x: 10, y: 9 }
  const withNpc = (id: string, c: Companion, dx = 1, extra: Partial<GameState> = {}): GameState => {
    const s0 = base(c, extra)
    const s = { ...s0, player: { ...s0.player, x: road.x, y: road.y, path: [] }, companion: { ...s0.companion!, x: road.x + 1, y: road.y } }
    const t = { x: road.x + 1 + dx, y: road.y }
    return { ...s, npcs: { [id]: { id, visible: true, goal: null, x: t.x, y: t.y, path: [], facing: 'down', walkTime: 0 } } }
  }
  it('양치기·덱스터는 천천히 — 첫 만남엔 서로 기다리고, 다음 날엔 코를 대고, 셋째 만남부터 꼬리를 흔든다', () => {
    let s = withNpc('shepherd', dog)
    const got: string[] = [], motions: string[] = []
    for (let i = 0; i < 3; i++) {
      const ev: GameEvent[] = []
      s = petLife(calm({ ...s, clock: { ...s.clock, day: 20 + i } }), road, ev, null)
      got.push(...petEvents(ev).filter((e) => e.npc).map((e) => e.key))
      motions.push(s.companion!.motion!.action)
    }
    expect(got).toEqual(['slowFirst', 'slowAgain', 'slowKnown'])
    expect(motions).toEqual(['wait', 'sniff', 'wag'])
    expect(s.life.experiences['pet:meet:shepherd']).toMatchObject({ kind: 'pet', with: ['shepherd'], count: 3 })
  })
  it('같은 날 두 번 마주쳐도 한 번, 먼 이웃과는 일어나지 않는다', () => {
    let s = withNpc('shepherd', dog)
    const ev: GameEvent[] = []
    s = petLife(s, road, ev, null)
    s = petLife(calm(s), road, ev, null)
    expect(petEvents(ev).filter((e) => e.npc)).toHaveLength(1)
    const far: GameEvent[] = []
    petLife(withNpc('shepherd', dog, 6), road, far, null)
    expect(petEvents(far).filter((e) => e.npc)).toHaveLength(0)
  })
  it('모임·잔치·장면 중에는 동물이 아무것도 시작하지 않는다', () => {
    const gathering = withNpc('shepherd', dog, 1, { today: { visitor: null, visitGot: false, inviter: null, dined: false, gathering: 'hall' as never } })
    const ev: GameEvent[] = []
    petLife(gathering, road, ev, null)
    expect(ev).toHaveLength(0)
    petLife(withNpc('shepherd', dog, 1, { scenes: ['strays'] }), road, ev, null)
    expect(ev).toHaveLength(0)
  })
  it('이웃은 취향대로: 빵 굽는 이웃은 냄새를 맡고, 포도원 할아버지 곁에서는 가만히', () => {
    expect(petLife(withNpc('baker', dog), road, [], null).companion!.motion?.action).toBe('sniff')
    expect(petLife(withNpc('grandpa', dog), road, [], null).companion!.motion?.action).toBe('wait')
  })
  it('아이: 걷는 아이 곁에서는 기다리고 돕는 아이와는 짧게 논다, 아기(요람)는 해당 없음', () => {
    const s0 = withNpc('none', dog)
    const kidAt = { x: road.x + 3, y: road.y }
    const kid = (age: number): GameState => ({ ...s0, child: { name: '루시', look: 'girl', born: s0.clock.day - age, lean: null } as never })
    const ev: GameEvent[] = []
    const toddler = petLife(kid(20), road, ev, kidAt)
    expect(petEvents(ev)[0]).toMatchObject({ key: 'kidSmall', kid: true })
    expect(toddler.companion!.motion?.action).toBe('wait')
    const ev2: GameEvent[] = []
    petLife(kid(50), road, ev2, kidAt)
    expect(petEvents(ev2)[0]).toMatchObject({ key: 'kidHelper' })
    const ev3: GameEvent[] = []
    petLife(kid(3), road, ev3, kidAt)
    expect(ev3).toHaveLength(0)
  })
  it('모든 반응 글은 행동만 적고 빈칸이 남지 않는다', () => {
    const c = { name: '나비', kind: 'cat' as const }
    for (const e of [{ key: 'firstWalk', place: 'hill' }, { key: 'newPlace', place: 'bench' }, { key: 'knownPlace', place: 'well' }, { key: 'foundSpot' }, { key: 'came' },
      { key: 'slowFirst', npc: 'dexter' }, { key: 'slowAgain', npc: 'dexter' }, { key: 'slowKnown', npc: 'shepherd' }, { key: 'kidSmall' }, { key: 'kidHelper' },
      ...['juniper', 'baker', 'carpenter', 'grandpa', 'fisher'].flatMap((npc) => [{ key: 'neighborFirst', npc }, { key: 'neighborAgain', npc }])]) {
      for (const kind of ['cat', 'dog'] as const) {
        const text = petEventText(e, { ...c, kind })
        expect(text.length).toBeGreaterThan(5)
        expect(text).not.toMatch(/[{}]/)
      }
    }
  })
})

describe('불이익·죄책감 없음, 필사는 막지 않음', () => {
  it('동물 글 어디에도 돌보지 못한 탓·외로움·병·가출 같은 말이 없다', () => {
    const all = JSON.stringify(T.pet)
    for (const bad of ['외로', '배고', '가출', '미안', '죄책', '버려', '슬퍼', '아파', '병', '죽', '벌', '굶', '삐', '화가']) expect(all).not.toContain(bad)
  })
  it('오래 돌보지 않아도 동물 기록·성향은 그대로이고 습관 계산은 마지막 함께한 시각을 보지 않는다', () => {
    const c = { ...pet, lastInteraction: 3 * 1440, found: ['play' as const], moments: { play: 3 } }
    const later = sanitizeCompanion(c)!
    expect(later).toMatchObject({ found: ['play'], moments: { play: 3 }, ways: pet.ways })
    expect(petHabit(later, 100, 600, 'sunny')).toEqual(petHabit({ name: later.name, since: later.since, kind: later.kind, ways: later.ways }, 100, 600, 'sunny'))
  })
  it('동물 반응은 동물·경험 말고는 아무것도 바꾸지 않고 필사 시간은 동물과 무관', () => {
    const well = PLACES.well.stand!
    const s0 = newGame(CONTENT)
    const s: GameState = { ...s0, npcs: {}, player: { ...s0.player, x: well.x, y: well.y, path: [] }, companion: { ...mk('dog', '누렁이', undefined), stay: false, x: well.x + 1, y: well.y } }
    const out = petLife(s, well, [], null)
    const { companion: _a, life: _b, ...rest } = out
    const { companion: _c, life: _d, ...rest0 } = s
    expect(rest).toEqual(rest0)
    const without: GameState = { ...s, companion: null }
    expect(copyMinutes(s)).toBe(copyMinutes(without))
  })
})

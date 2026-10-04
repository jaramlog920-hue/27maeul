import { dayOf } from './calendar'
import { CONTENT } from '../content/catalog'
import { SCENES } from '../content/text'
import {
  BABY_PARTY_DAY,
  BABY_PARTY_SPOTS,
  HILL_SPOTS,
  INVITE_DOORS,
  pickInviter,
  pickVisitor,
  planGathering,
  REQUESTS,
  requestFor,
  VILLAGE_STEPS,
  villageLevel,
  VISIT_SPOT,
  VISIT_FROM,
  VISIT_TO,
} from './bonds'
import { findPath } from './movement'
import {
  activeRequest,
  chooseBook,
  askRequest,
  dine,
  fulfillRequest,
  goToSleep,
  greetNeighbor,
  helpReward,
  inviterAtDoor,
  newGame,
  receiveVisit,
  tick,
  tradesFor,
  type GameState,
} from './game'
import { isWalkable } from './world'
import type { NeighborDef } from './types'

const zero = () => 0
const def = (id: string) => CONTENT.neighbors.find((n) => n.id === id) as NeighborDef
const at = (s: GameState, minute: number, day = s.clock.day): GameState => ({ ...s, clock: { day, minute } })

describe('A. 이웃의 부탁', () => {
  it('모든 부탁에 부탁·완료 장면이 있고, 완료는 앨범에 남는다', () => {
    for (const r of REQUESTS) {
      expect(SCENES[`ask:${r.id}`], r.id).toBeDefined()
      expect(SCENES[`done:${r.id}`]?.album, r.id).toBeTruthy()
    }
  })
  it('마음 4부터 부탁 → 가져다주면 보상·변화·마음, 그다음 마음 7의 부탁', () => {
    let s: GameState = { ...newGame(CONTENT), hearts: { smith: 30 } }
    expect(requestFor('smith', 30, s.flags)).toBeNull()
    s = { ...s, hearts: { smith: 40 } }
    s = askRequest(s, 'smith')
    expect(s.scenes).toContain('ask:smith:1')
    expect(activeRequest(s, 'smith')?.id).toBe('smith:1')
    expect(fulfillRequest(s, 'smith')).toBeNull() // 아직 재료가 없다
    s = fulfillRequest({ ...s, inv: { wool: 2, oil: 1 } }, 'smith')!
    expect(s.flags['unlock:bigBellows']).toBe(1)
    expect(s.inv.soot).toBe(2)
    expect(s.hearts.smith).toBe(46)
    expect(s.scenes).toContain('done:smith:1')
    // 새 풀무 뒤로는 풀무질 보상이 두 배
    expect(helpReward(def('smith'), s.clock.day, s.flags)).toEqual({ soot: 2 })
    // 다음 부탁은 마음 7부터
    expect(requestFor('smith', 46, s.flags)).toBeNull()
    expect(requestFor('smith', 70, s.flags)?.id).toBe('smith:2')
  })
  it('상인의 부탁을 들어주면 장날 좌판에 물건이 는다', () => {
    const before = tradesFor({}).length
    expect(tradesFor({ 'unlock:moreTrades': 1 }).length).toBe(before + 3)
  })
})

describe('B. 먼저 찾아오기와 저녁 초대', () => {
  it.each([
    [VISIT_FROM - 1, false],
    [VISIT_FROM, true],
    [VISIT_TO - 0.01, true],
    [VISIT_TO, false],
    [15 * 60, false],
  ])('방문 선물은 방문 시간 안에서만 받는다: %s분', (minute, allowed) => {
    const s = at(newGame(CONTENT), minute)
    s.today = { ...s.today, visitor: 'baker' }
    const result = receiveVisit(s, 'baker')
    if (allowed) {
      expect(result?.state.inv.bread).toBe((s.inv.bread ?? 0) + 2)
      expect(receiveVisit(result!.state, 'baker')).toBeNull()
    } else {
      expect(result).toBeNull()
      expect(s.today.visitGot).toBe(false)
    }
    expect(receiveVisit(s, 'child')).toBeNull()
  })
  it('마음 5 이상인 이웃만 들르고, 나흘 안에 다시 오지 않는다', () => {
    const hearts = { baker: 50, smith: 20 }
    const days = Array.from({ length: 30 }, (_, i) => i + 3)
    const visits = days.map((d) => pickVisitor(d, hearts, {}, ['baker', 'smith']))
    expect(visits).not.toContain('smith')
    expect(visits).toContain('baker')
    expect(pickVisitor(10, hearts, { 'visitDay:baker': 8 }, ['baker'])).toBeNull()
  })
  it('들른 이웃은 아침에 집 앞에 서 있고, 말을 걸면 선물을 받는다 (한 번만)', () => {
    let s: GameState = { ...at(newGame(CONTENT), 7 * 60 + 30), today: { visitor: 'baker', visitGot: false, inviter: null, dined: false, gathering: null } }
    s = tick(s, 0.05, zero, CONTENT).state
    s = { ...s, npcs: { ...s.npcs } }
    for (let i = 0; i < 400; i++) s = tick(s, 0.05, zero, CONTENT).state
    expect([Math.round(s.npcs.baker.x), Math.round(s.npcs.baker.y)]).toEqual([VISIT_SPOT.x, VISIT_SPOT.y])
    const v = receiveVisit(s, 'baker')!
    expect(v.gift).toEqual({ bread: 2 })
    expect(receiveVisit(v.state, 'baker')).toBeNull()
  })
  it('저녁 초대: 마음 7, 궂은 날·잔치 날엔 없음, 그 집 문에서 저녁을 먹는다', () => {
    expect(pickInviter(dayOf('summer', 25), { baker: 90 }, {})).toBeNull() // 잔치 날
    const days = Array.from({ length: 40 }, (_, i) => i + 3)
    expect(days.some((d) => pickInviter(d, { baker: 70 }, {}) === 'baker')).toBe(true)
    expect(days.every((d) => pickInviter(d, { baker: 60 }, {}) === null)).toBe(true)
    let s: GameState = { ...at(newGame(CONTENT), 18 * 60 + 30), needs: { hunger: 80, fatigue: 0, cold: 0, heat: 0 }, today: { visitor: null, visitGot: false, inviter: 'grandpa', dined: false, gathering: null } }
    expect(inviterAtDoor(s, INVITE_DOORS.baker)).toBeNull()
    expect(inviterAtDoor(s, INVITE_DOORS.grandpa)).toBe('grandpa')
    s = dine(s, 'grandpa')!
    expect(s.needs.hunger).toBeLessThanOrEqual(30)
    expect(s.scenes).toContain('dinner:grandpa')
    expect(dine(s, 'grandpa')).toBeNull()
  })
})

describe('C. 마을이 자란다', () => {
  it('마음 점수의 합으로 단계가 오르고, 새 날 아침에 알린다', () => {
    expect(villageLevel({})).toBe(0)
    expect(villageLevel({ a: 60, b: 40 })).toBe(1)
    expect(villageLevel({ a: 100, b: 100, c: 100, d: 100, e: 100, f: 100 })).toBe(4)
    const s = goToSleep({ ...newGame(CONTENT), hearts: { baker: 100, child: 100, grandpa: 40 } }, CONTENT)
    expect(s.scenes).toEqual(expect.arrayContaining(['village:1', 'village:2']))
    expect(s.flags.villageLevel).toBe(2)
    // 다시 자도 같은 단계는 다시 알리지 않는다
    expect(goToSleep(s, CONTENT).scenes.filter((x) => x === 'village:1')).toHaveLength(1)
    expect(VILLAGE_STEPS).toHaveLength(4)
  })
  it('새 이웃은 이사 온 뒤에만 보이고 이야기를 전한다', () => {
    const before = goToSleep(chooseBook(newGame(CONTENT), 'lk', CONTENT), CONTENT)
    expect(before.npcs.weaver.visible).toBe(false)
    expect(before.offers.weaver).toBeUndefined()
    // 베 짜는 이웃은 서고에 책이 일곱 권 꽂히면 이사 온다 (2026-10-04 사용자 — 마을 단계 대신 권수, 2026-10-05: 약방과 겹치던 2권 → 7권)
    const six = { mt: 1, mk: 1, lk: 1, jn: 1, ac: 1, rom: 1 } as GameState['shelved']
    const notYet = goToSleep({ ...at(chooseBook(newGame(CONTENT), 'lk', CONTENT), 22 * 60, 3), shelved: six }, CONTENT)
    expect(notYet.flags['movedIn:weaver']).toBeUndefined()
    expect(notYet.scenes).not.toContain('movedIn:weaver')
    const after = goToSleep({ ...at(chooseBook(newGame(CONTENT), 'lk', CONTENT), 22 * 60, 3), shelved: { ...six, gal: 1 } as GameState['shelved'] }, CONTENT)
    expect(after.scenes).toContain('movedIn:weaver')
    expect(after.clock.day).toBe(4)
    // 4일째 07:30 이후 베틀 곁
    let s = at(after, 8 * 60)
    for (let i = 0; i < 600; i++) s = tick(s, 0.05, zero, CONTENT).state
    expect(s.npcs.weaver.visible).toBe(true)
    // 여러 주가 지나는 동안 새 이웃도 특별한 대화로 말씀 조각을 건넨다 (조각은 드물게 — 계획 14 작업 5)
    let d = after
    const tellers = new Set<string>()
    for (let i = 0; i < 300 && !tellers.has('weaver'); i++) {
      Object.keys(d.offers).forEach((k) => tellers.add(k))
      d = goToSleep(d, CONTENT)
    }
    expect(tellers).toContain('weaver')
  })
  it('예전 2권 때 이미 이사 온 베 짜는 이웃은 7권이 안 되어도 그대로 산다 (옛 저장)', () => {
    const old = { ...at(chooseBook(newGame(CONTENT), 'lk', CONTENT), 22 * 60, 3), shelved: { mk: 1, lk: 1 } as GameState['shelved'] }
    const kept = goToSleep({ ...old, flags: { ...old.flags, 'movedIn:weaver': 1 } }, CONTENT)
    expect(kept.flags['movedIn:weaver']).toBe(1)
    expect(kept.scenes).not.toContain('movedIn:weaver')
    let s = at(kept, 8 * 60)
    for (let i = 0; i < 600; i++) s = tick(s, 0.05, zero, CONTENT).state
    expect(s.npcs.weaver.visible).toBe(true)
  })
})

describe('D. 이웃끼리', () => {
  it('아이와 양치기의 마음이 모두 5면 단짝이 된다 (한 번)', () => {
    const s = goToSleep({ ...newGame(CONTENT), hearts: { child: 50, shepherd: 50 } }, CONTENT)
    expect(s.scenes).toContain('friends')
    expect(goToSleep(s, CONTENT).scenes.filter((x) => x === 'friends')).toHaveLength(1)
  })
  it('아기 잔치는 정해진 날, 소풍·별 보기는 마을이 자란 뒤 맑은 날', () => {
    expect(planGathering(BABY_PARTY_DAY, 0, {})).toBe('babyParty')
    expect(planGathering(4, 1, {})).toBeNull()
    expect(planGathering(4, 2, {})).toBe('picnic')
    expect(planGathering(4, 2, { 'done:picnic': 1 })).toBeNull()
    expect(planGathering(4, 3, { 'done:picnic': 1 })).toBe('starNight')
  })
  it('모임 자리는 모두 걸어갈 수 있다', () => {
    for (const spot of [...Object.values(BABY_PARTY_SPOTS), ...Object.values(HILL_SPOTS), VISIT_SPOT]) expect(isWalkable(spot), `${spot.x},${spot.y}`).toBe(true)
    for (const d of CONTENT.neighbors) {
      for (const spot of [BABY_PARTY_SPOTS[d.id], HILL_SPOTS[d.id]].filter(Boolean)) expect(findPath(d.door, spot!), d.id).not.toBeNull()
      expect(findPath(d.door, VISIT_SPOT), d.id).not.toBeNull()
    }
  })
  it('모임 시간에 그 자리에 가면 장면이 열린다', () => {
    let s: GameState = { ...at(newGame(CONTENT), 18 * 60 + 10, BABY_PARTY_DAY), today: { visitor: null, visitGot: false, inviter: null, dined: false, gathering: 'babyParty' } }
    // 빵집 앞 모임 자리 (내 집 앞이 아니다)
    s = { ...s, player: { ...s.player, x: 5, y: 17 } }
    const r = tick(s, 0.05, zero, CONTENT)
    expect(r.events).toContainEqual({ type: 'moment', id: 'babyParty' })
    expect(r.state.flags['done:babyParty']).toBe(1)
  })
})

describe('E. 마음 9', () => {
  it('마음 9가 되면 특별한 선물과 앨범 장면', () => {
    const s = greetNeighbor({ ...newGame(CONTENT), hearts: { grandpa: 89 } }, 'grandpa')
    expect(s.scenes).toContain('gift:grandpa:9')
    expect(SCENES['gift:grandpa:9'].album).toBeTruthy()
    expect(s.inv.bowl).toBe(1)
  })
})

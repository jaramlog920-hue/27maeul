// 2026-10-21 중반 점검: 여행이 그날 큰일을 지우지 않게 · 공들이는 연애 후보를 다른 주민이 데려가지 않게
import { CONTENT } from '../content/catalog'
import { canTrip, type GameState } from './game'
import { gameAtChapters } from './growth-test-support'
import { canPair, newGenState, type GenState } from './gen'
import { COURT_POINTS, settleOneDay, withPairs } from './gen-settle'
import type { Fest } from './fest'

const ready = (): GameState => { const s = gameAtChapters(CONTENT, 120); return { ...s, coins: 5000, scenes: [], clock: { ...s.clock, minute: 9 * 60 } } }

describe('여행은 그날 큰일이 있으면 떠나지 않는다', () => {
  it('평소엔 떠나고, 내 결혼 잔치 날·준비한 행사 날은 막는다', () => {
    const s = ready()
    expect(canTrip(s, 'harbor')).toBeNull()
    const wed: GameState = { ...s, romance: { partner: 'tilly', stage: 'engaged', since: 1, weddingDay: s.clock.day, marriedDay: null } }
    expect(canTrip(wed, 'harbor')).toBe('wedding')
    const fest = { id: 'fest:1', kind: 'tea', day: s.clock.day, place: 'hallTable', members: ['tilly'], reserve: {}, step: 'tidy', joined: false, consumed: false, closed: false, cancelled: false } as Fest
    expect(canTrip({ ...s, fests: [fest] }, 'harbor')).toBe('event')
    // 취소했거나 끝난 행사, 다른 날 행사는 막지 않는다
    expect(canTrip({ ...s, fests: [{ ...fest, cancelled: true, closed: true }] }, 'harbor')).toBeNull()
    expect(canTrip({ ...s, fests: [{ ...fest, day: s.clock.day + 1 }] }, 'harbor')).toBeNull()
    // 이미 떠난 여행에서 돌아오는 것은 막지 않는다
    expect(canTrip(wed, 'harbor', [], true)).toBeNull()
  })
})

describe('공들이는 연애 후보', () => {
  it('연인이 없는 플레이어가 가장 공들이는 후보(6하트 이상)는 다른 주민과 사귀지 않는다 — 더 가까운 후보가 있거나 연인이 생기면 풀린다', () => {
    const g: GenState = newGenState(CONTENT, 7, 1, withPairs())
    const id = 'poppy'
    expect(CONTENT.neighbors.find((n) => n.id === id)?.romanceable).toBe(true)
    const other = Object.keys(g.persons).find((b) => b !== id && canPair(g, null, id, b))!
    const rid = [id, other].sort().join('|')
    const [a, b] = [id, other].sort()
    const friends: GenState = { ...g, affinity: { ...g.affinity, [rid]: 90 }, relations: { ...g.relations, [rid]: { id: rid, a, b, stage: 'friend', since: 1 } } }
    const avatar = { look: g.persons[id].look === 'f' ? 'm' : 'f' } as GameState['avatar']
    const settle = (s: Parameters<typeof settleOneDay>[2]) => { let x = friends; for (let d = 10; d < 14; d++) x = settleOneDay(x, d, s, CONTENT, {}); return x.relations[rid].stage }
    expect(settle({ flags: {}, avatar, hearts: { [id]: COURT_POINTS } })).toBe('friend')
    expect(settle({ flags: {}, avatar, hearts: { [id]: COURT_POINTS - 1 } })).toBe('lover')
    // 더 공들이는 다른 후보가 있으면 이 사람은 풀린다
    const rival = CONTENT.neighbors.find((n) => n.romanceable && n.id !== id && n.id !== other && g.persons[n.id]?.look === g.persons[id].look && !g.persons[n.id]?.spouse)!.id
    expect(settle({ flags: {}, avatar, hearts: { [id]: COURT_POINTS, [rival]: COURT_POINTS + 10 } })).toBe('lover')
    expect(settle({ flags: {}, avatar, hearts: { [id]: COURT_POINTS }, romance: { partner: 'tilly', stage: 'dating', since: 1, weddingDay: null, marriedDay: null } })).toBe('lover')
  })
})

describe('다시 간 여행지 (2026-10-21)', () => {
  it('둘째–넷째 여행은 같은 이웃의 마음이 오르고 작은 것을 받는다, 다섯째부터는 없다', async () => {
    const { takeTrip } = await import('./game')
    const { TRIP_REVISITS, TRIP_REVISIT_GAIN, DESTS } = await import('./travel')
    const { count } = await import('./items')
    const s = ready()
    const friend = DESTS.harbor.friend
    const at = (visits: number) => ({ ...s, hearts: { ...s.hearts, [friend]: 0 }, flags: { ...s.flags, 'trip:harbor': visits } })
    const second = takeTrip(at(1), CONTENT, 'harbor')!
    expect(second.hearts[friend]).toBeGreaterThanOrEqual(TRIP_REVISIT_GAIN)
    expect(count(second.inv, 'bread')).toBeGreaterThanOrEqual(count(s.inv, 'bread') + TRIP_REVISITS.harbor[0].bread!)
    const fifth = takeTrip(at(4), CONTENT, 'harbor')!
    expect(fifth.hearts[friend] ?? 0).toBe(0)
  })
})

describe('그날 모임은 불러와도 남는다 (2026-10-21 자동 점검 규칙 9)', () => {
  it.each(['picnic', 'babyParty', 'starNight'] as const)('%s', async (gathering) => {
    const { serialize, deserialize } = await import('./save')
    const s = ready()
    const back = deserialize(serialize({ ...s, today: { ...s.today, gathering } }), CONTENT)!
    expect(back.today.gathering).toBe(gathering)
  })
})

describe('배우자 아침 선물 · 배움터 (2026-10-21)', () => {
  it('배우자 선물은 나흘에 걸쳐 바뀐다 (집안 일 것 둘, 계절 것, 허브 차)', async () => {
    const { spouseGift, SPOUSE_SEASON_GIFT } = await import('./game')
    const { seasonOf } = await import('./clock')
    const def = CONTENT.neighbors.find((n) => n.id === 'tilly')!
    const base = ready()
    const got = [0, 1, 2, 3].map((k) => {
      const day = 40 + k
      const s: GameState = { ...base, clock: { ...base.clock, day }, romance: { partner: 'tilly', stage: 'married', since: 1, weddingDay: null, marriedDay: 30 } }
      return Object.keys(spouseGift(s, def)!.gift)[0]
    })
    const own = Object.keys(def.help.gives)[0]
    expect(got.filter((g) => g === own).length).toBe(2)
    expect(got).toContain('herbTea')
    expect(got).toContain(SPOUSE_SEASON_GIFT[seasonOf(42)])
  })
  it('배움터에 맡기면 그 능력치 쪽 마을 일에 관심이 붙는다', async () => {
    const { sendToSchool } = await import('./game')
    const { JOBS_BY_STAT } = await import('./child')
    const s = ready()
    const child = { name: '아이', born: s.clock.day - 30, stats: s.child?.stats ?? {}, lean: 'wit' } as unknown as NonNullable<GameState['child']>
    const school = gameAtChapters(CONTENT, 150)
    const at = { ...school, coins: 100, clock: { ...school.clock, minute: 9 * 60 }, child: { ...child, stats: school.stats } } as GameState
    const next = sendToSchool(at, 'hand')
    expect(next).not.toBeNull()
    expect(next!.child!.interests?.[JOBS_BY_STAT.hand[0]]).toBe(1)
    expect(next!.child!.interests?.[JOBS_BY_STAT.hand[1]]).toBeUndefined()
  })
})

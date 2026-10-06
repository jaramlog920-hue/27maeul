// 계획 20 2부 작업 A: 세대 상태 — 처음 만들기·참여 대상·짝 조건·호감도·난수·저장 되돌리기
import { CONTENT } from '../content/catalog'
import { newGame, type GameState } from './game'
import { addAffinity, affinityOf, canPair, GEN_ELIGIBLE, genEligible, genRng, hasRoom, newGenState, relationId, sanitizeGen, type GenState } from './gen'
import { settleGen, withPairs } from './gen-settle'
import { MAX_GENERATED, START_CLOSE } from './gen-config'
import { CANDIDATE_IDS } from './romance'
import { deserialize, serialize } from './save'

const day = (s: GameState, d: number): GameState => ({ ...s, clock: { ...s.clock, day: d } })
const fresh = (d = 1): GenState => newGenState(CONTENT, 7, d, withPairs())

describe('처음 만들기', () => {
  it('고정 주민 23명이 계보에 들어가고 부모·친척은 neighbors.json family에서, 모습은 look/gender', () => {
    const g = fresh()
    expect(Object.keys(g.persons)).toHaveLength(CONTENT.neighbors.length)
    expect(g.persons.rudy.parents).toEqual(['carpenter'])
    expect(g.persons.tilly.parents).toEqual(['smith'])
    expect(g.persons.marigold.kin).toEqual([{ id: 'grandpa', rel: 'grandparent' }])
    expect(g.persons.carpenter.born).toBeNull()
    expect(g.persons.rudy.look).toBe('m')
    expect(g.persons.poppy.look).toBe('f')
    expect(g.persons.smith.look).toBe('m')
    expect(g.on).toBe(true)
  })
  it('처음 호감도: 양쪽에 함께하는 일과가 있는 쌍·집안으로 이어진 쌍은 30, 나머지는 0', () => {
    const g = fresh()
    expect(affinityOf(g, 'smith', 'carpenter')).toBe(START_CLOSE) // 양쪽 with
    expect(affinityOf(g, 'tilly', 'wendell')).toBe(START_CLOSE)
    expect(affinityOf(g, 'rudy', 'carpenter')).toBe(START_CLOSE) // 집안
    expect(affinityOf(g, 'rudy', 'juniper')).toBe(0)
    expect(withPairs().length).toBeGreaterThan(5)
  })
  it('gen 없는 저장의 첫 정산: 만들고 settledDay를 오늘로, 30인 남은 소식 없이 친한 사이, 가족은 친한 사이로 적지 않는다', () => {
    const s0 = day(newGame(CONTENT), 50)
    expect(s0.gen).toBeUndefined()
    const s = settleGen(s0, CONTENT, { seed: 99 })
    expect(s.gen?.settledDay).toBe(50)
    expect(s.gen?.seed).toBe(99)
    expect(s.gen?.relations[relationId('carpenter', 'smith')]).toMatchObject({ stage: 'friend', since: 50 })
    expect(s.gen?.relations[relationId('rudy', 'carpenter')]).toBeUndefined()
    expect(s.gen?.log).toEqual([])
  })
  it('플레이어 가족(아이·배우자)을 주민 가족으로 따로 만들지 않는다', () => {
    const plain = settleGen(day(newGame(CONTENT), 5), CONTENT, { seed: 1 })
    const withFamily = settleGen({ ...day(newGame(CONTENT), 5), child: { name: '루시', look: 'girl', born: 1 } as GameState['child'], romance: { partner: 'wendell', stage: 'married', since: 1, weddingDay: 2, marriedDay: 2 } }, CONTENT, { seed: 1 })
    expect(Object.keys(withFamily.gen?.persons ?? {}).sort()).toEqual(Object.keys(plain.gen?.persons ?? {}).sort())
    expect(withFamily.gen?.persons.wendell.spouse).toBeNull()
  })
})

describe('참여 대상과 짝 조건 (D28·P7)', () => {
  it('연애 후보 13명 모두와 목수·대장장이가 참여, 아이·노년·부모 세대 나머지는 아니다', () => {
    for (const id of CANDIDATE_IDS) expect(genEligible(id)).toBe(true)
    expect(genEligible('carpenter')).toBe(true)
    expect(genEligible('smith')).toBe(true)
    for (const id of ['child', 'grandpa', 'baker', 'shepherd', 'weaver', 'beekeeper', 'apothecary', 'fisher']) expect(genEligible(id)).toBe(false)
    expect(GEN_ELIGIBLE).toHaveLength(15)
  })
  it('서로 다른 모습·같은 세대·남남만, 플레이어의 연인은 빠진다', () => {
    const g = fresh()
    expect(canPair(g, null, 'rudy', 'poppy')).toBe(true)
    expect(canPair(g, null, 'rudy', 'cosmo')).toBe(false) // 같은 모습
    expect(canPair(g, null, 'tilly', 'smith')).toBe(false) // 부모 세대 · 친족
    expect(canPair(g, null, 'carpenter', 'smith')).toBe(false) // 같은 모습
    expect(canPair(g, null, 'carpenter', 'poppy')).toBe(false) // 세대가 다르다
    expect(canPair(g, null, 'grandpa', 'poppy')).toBe(false) // 참여 대상 아님
    expect(canPair(g, 'rudy', 'rudy', 'poppy')).toBe(false)
  })
  it('다른 연인이 있으면 짝이 되지 않는다', () => {
    let g = fresh()
    const id = relationId('rudy', 'poppy')
    g = { ...g, relations: { [id]: { id, a: 'poppy', b: 'rudy', stage: 'lover', since: 1 } } }
    expect(canPair(g, null, 'rudy', 'tilly')).toBe(false)
    expect(canPair(g, null, 'rudy', 'poppy')).toBe(true) // 이미 둘이 연인인 쌍은 그대로
  })
})

describe('호감도', () => {
  it('0–100으로 자르고, 배우자는 50 아래로 내려가지 않는다', () => {
    let g = fresh()
    g = addAffinity(g, 'rudy', 'poppy', 130)
    expect(affinityOf(g, 'poppy', 'rudy')).toBe(100)
    g = addAffinity(g, 'rudy', 'poppy', -300)
    expect(affinityOf(g, 'rudy', 'poppy')).toBe(0)
    const id = relationId('rudy', 'poppy')
    g = addAffinity({ ...g, relations: { [id]: { id, a: 'poppy', b: 'rudy', stage: 'spouse', since: 1 } } }, 'rudy', 'poppy', -10)
    expect(affinityOf(g, 'rudy', 'poppy')).toBe(50)
  })
})

describe('난수 (저장된 씨앗)', () => {
  it('같은 씨앗·같은 입력이면 같은 값, 인물 순서가 달라도 같다', () => {
    const a = genRng(5, 'birth', ['x', 'y'], 1), b = genRng(5, 'birth', ['y', 'x'], 1)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  it('씨앗·종류·횟수가 달라지면 값도 달라진다', () => {
    const v = (seed: number, kind: string, n: number) => genRng(seed, kind, ['x', 'y'], n)()
    expect(v(5, 'birth', 1)).not.toBe(v(6, 'birth', 1))
    expect(v(5, 'birth', 1)).not.toBe(v(5, 'name', 1))
    expect(v(5, 'birth', 1)).not.toBe(v(5, 'birth', 2))
  })
})

describe('인구', () => {
  it('생성 주민은 8명까지, 고정 주민은 세지 않는다', () => {
    let g = fresh()
    expect(hasRoom(g)).toBe(true)
    const persons = { ...g.persons }
    for (let i = 1; i <= MAX_GENERATED; i++) persons[`g-000${i}`] = { id: `g-000${i}`, origin: 'born', born: 1, stage: 'baby', parents: [], spouse: null, household: null }
    g = { ...g, persons }
    expect(hasRoom(g)).toBe(false)
  })
})

describe('저장', () => {
  it('저장했다 불러와도 같은 상태 (씨앗·호감도·관계·settledDay)', () => {
    const s = settleGen(day(newGame(CONTENT), 12), CONTENT, { seed: 4242 })
    const back = deserialize(serialize(s), CONTENT)
    expect(back?.gen).toEqual(s.gen)
  })
  it('gen이 없는 옛 저장은 gen 없이 불러온다', () => {
    const s = day(newGame(CONTENT), 12)
    expect(deserialize(serialize(s), CONTENT)?.gen).toBeUndefined()
  })
  it('깨진 gen은 undefined, 모양이 틀린 항목만 버리고 나머지는 남긴다', () => {
    expect(sanitizeGen('x', 5)).toBeUndefined()
    expect(sanitizeGen({ persons: 3 }, 5)).toBeUndefined()
    const base = fresh(5)
    const cs = relationId('carpenter', 'smith')
    const raw = {
      ...base,
      persons: { ...base.persons, bad: { id: 'bad', origin: 'martian' }, 7: 'x' },
      affinity: { ...base.affinity, 'a|b': 40, [relationId('rudy', 'poppy')]: 140, [relationId('rudy', 'juniper')]: 45 },
      relations: {
        'a|b': { id: 'a|b', a: 'a', b: 'b', stage: 'lover' },
        [cs]: { id: cs, a: 'carpenter', b: 'smith', stage: 'friend', since: 2 },
        [relationId('rudy', 'carpenter')]: { id: relationId('rudy', 'carpenter'), a: 'carpenter', b: 'rudy', stage: 'lover', since: 2 },
        [relationId('rudy', 'poppy')]: { id: relationId('rudy', 'poppy'), a: 'poppy', b: 'rudy', stage: 'preparing', since: 2 },
      },
      events: [{ id: 'e-0001', kind: 'wedding', day: 3, who: ['carpenter'], done: false, news: false }, { id: 'e-0001', kind: 'dup', day: 4, who: [], done: false, news: false }, { id: 5 }],
    }
    const g = sanitizeGen(raw, 5)!
    expect(g.persons.bad).toBeUndefined()
    expect(Object.keys(g.persons)).toHaveLength(CONTENT.neighbors.length)
    expect(Object.keys(g.relations)).toEqual([cs]) // 친족 연인·준비 없는 결혼 준비는 버린다
    expect(g.affinity['a|b']).toBeUndefined()
    expect(g.affinity[relationId('rudy', 'poppy')]).toBeUndefined() // 100 넘는 값
    expect(g.affinity[relationId('rudy', 'juniper')]).toBe(45)
    expect(g.events).toHaveLength(1)
    expect(g.nextEvent).toBe(2)
  })
  it('날짜가 미래인 값(저장 되돌리기)은 오늘로 맞추고, 지난 날의 만남 수는 버린다', () => {
    const base = fresh(5)
    const rp = relationId('rudy', 'poppy')
    const g = sanitizeGen({ ...base, settledDay: 99, meets: { [rp]: { day: 4, n: 2, last: 600 } } }, 5)!
    expect(g.settledDay).toBe(5)
    expect(g.meets).toEqual({})
    const today = sanitizeGen({ ...base, meets: { [rp]: { day: 5, n: 2, last: 600 } } }, 5)!
    expect(today.meets[rp]).toEqual({ day: 5, n: 2, last: 600 })
  })
  it('계보에는 배우자인데 관계 기록이 없으면 배우자 관계를 되살린다', () => {
    const base = fresh(5)
    const persons = { ...base.persons, rudy: { ...base.persons.rudy, spouse: 'poppy' }, poppy: { ...base.persons.poppy, spouse: 'rudy' } }
    const g = sanitizeGen({ ...base, persons }, 5)!
    expect(g.relations[relationId('rudy', 'poppy')]?.stage).toBe('spouse')
  })
  it('배열 순서를 바꿔도 id로 같은 인물이다', () => {
    const base = fresh(5)
    const shuffled = { ...base, persons: Object.fromEntries(Object.entries(base.persons).reverse()) }
    const g = sanitizeGen(shuffled, 5)!
    expect(g.persons.rudy).toEqual(base.persons.rudy)
  })
})

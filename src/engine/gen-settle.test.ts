// 계획 20 2부 작업 A·C·D·E: 하루 정산 — 밀린 날·켜고 끄기·관계 단계·헤어짐·상담·결혼 준비·결혼·아기 침대·출생
import { CONTENT } from '../content/catalog'
import { newGame, type GameState } from './game'
import { affinityOf, newGenState, relationId, type GenState } from './gen'
import { setGenOn, settleGen, settleOneDay, withPairs } from './gen-settle'
import { releasePlayerPartner } from './gen-relations'
import { answerConsult, consultFor, consultQuestion, CONSULT_LINES, helpPrep, reconsider } from './gen-marriage'
import { cribAskOf, giveCrib } from './gen-birth'
import { BIRTH_AFTER_CRIB, CONSULT_AFTER, CONSULT_RETRY, MAX_CATCHUP, MAX_LOVERS, WEDDING_DAYS } from './gen-config'

const day = (s: GameState, d: number): GameState => ({ ...s, clock: { ...s.clock, day: d } })
const RP = relationId('rudy', 'poppy')
const base = (d = 1): GenState => newGenState(CONTENT, 7, d, withPairs())
const setAff = (g: GenState, pairs: Record<string, number>): GenState => ({ ...g, affinity: { ...g.affinity, ...pairs } })
const run = (g: GenState, from: number, to: number, s: Partial<Pick<GameState, 'romance'>> = {}): GenState => {
  for (let d = from; d <= to; d++) g = settleOneDay(g, d, s, CONTENT, {})
  return g
}

describe('정산 가드 (D18)', () => {
  it('같은 날 두 번 정산해도 한 번', () => {
    const s1 = settleGen(day(newGame(CONTENT), 3), CONTENT, { seed: 1 })
    const s2 = settleGen(day(s1, 4), CONTENT)
    expect(settleGen(s2, CONTENT)).toBe(s2)
  })
  it('12일 건너뛰면 7일만 처리하고 settledDay는 오늘', () => {
    let s = settleGen(day(newGame(CONTENT), 1), CONTENT, { seed: 1 })
    // 연인이 될 만한 쌍을 하나 두고 12일 뒤 — 처리된 날 수는 log의 날짜로 본다
    s = { ...s, gen: setAff(s.gen!, { [RP]: 65, [relationId('cosmo', 'juniper')]: 65 }) }
    const after = settleGen(day(s, 13), CONTENT)
    expect(after.gen!.settledDay).toBe(13)
    expect(Math.max(...after.gen!.log.map((l) => l.day))).toBeLessThanOrEqual(1 + MAX_CATCHUP)
  })
  it('끄면 날짜만 맞추고 전환 없음, 다시 켜도 밀린 기간을 몰아 처리하지 않는다', () => {
    let s = settleGen(day(newGame(CONTENT), 1), CONTENT, { seed: 1 })
    s = setGenOn({ ...s, gen: setAff(s.gen!, { [RP]: 65 }) }, false)
    s = settleGen(day(s, 5), CONTENT)
    expect(s.gen!.settledDay).toBe(5)
    expect(s.gen!.log).toEqual([])
    s = setGenOn(day(s, 20), true)
    expect(s.gen!.settledDay).toBe(20)
    expect(settleGen(s, CONTENT).gen!.log).toEqual([])
  })
  it('같은 씨앗·같은 상태면 같은 결과', () => {
    const g = setAff(base(), { [RP]: 85, [relationId('cosmo', 'juniper')]: 62 })
    expect(run(g, 2, 40)).toEqual(run(g, 2, 40))
  })
})

describe('관계 단계 (D30·P6)', () => {
  it('30이면 친한 사이, 60이면 연인 — 연인은 하루 한 쌍', () => {
    let g = setAff(base(), { [RP]: 65, [relationId('cosmo', 'juniper')]: 65 })
    g = run(g, 2, 2)
    expect(g.relations[RP]?.stage).toBe('friend')
    g = run(g, 3, 3)
    const lovers = Object.values(g.relations).filter((r) => r.stage === 'lover')
    expect(lovers).toHaveLength(1)
    g = run(g, 4, 4)
    expect(Object.values(g.relations).filter((r) => r.stage === 'lover')).toHaveLength(2)
    expect(g.log.filter((l) => l.kind === 'lover')).toHaveLength(2)
  })
  it('친족은 친한 사이·연인이 되지 않는다', () => {
    const g = run(setAff(base(), { [relationId('tilly', 'smith')]: 90 }), 2, 6)
    expect(g.relations[relationId('tilly', 'smith')]).toBeUndefined()
  })
  it('마을 전체 연인은 4쌍까지', () => {
    const pairs = { [RP]: 70, [relationId('cosmo', 'juniper')]: 70, [relationId('dexter', 'marigold')]: 70, [relationId('basil', 'penelope')]: 70, [relationId('wendell', 'tilly')]: 70 }
    const g = run(setAff(base(), pairs), 2, 12)
    expect(Object.values(g.relations).filter((r) => r.stage === 'lover')).toHaveLength(MAX_LOVERS)
  })
  it('연인 사이 40 아래면 다음 아침 헤어지고, 7일은 다시 사귀지 않는다', () => {
    let g = run(setAff(base(), { [RP]: 65 }), 2, 3)
    expect(g.relations[RP]?.stage).toBe('lover')
    g = run(setAff(g, { [RP]: 35 }), 4, 4)
    expect(g.relations[RP]).toBeUndefined()
    expect(g.breakup[RP]).toBe(4)
    expect(g.log.at(-1)?.kind).toBe('breakup')
    g = run(setAff(g, { [RP]: 70 }), 5, 10)
    expect(g.relations[RP]?.stage).not.toBe('lover')
    g = run(g, 11, 13)
    expect(g.relations[RP]?.stage).toBe('lover')
  })
  it('플레이어의 연인은 후보에서 빠지고, 사귀기 시작하면 주민 연인 관계는 조용히 풀린다', () => {
    const romance = { partner: 'rudy', stage: 'dating' as const, since: 1, weddingDay: null, marriedDay: null }
    let g = run(setAff(base(), { [RP]: 70 }), 2, 5, { romance })
    expect(g.relations[RP]?.stage).toBe('friend')
    g = run(setAff(base(), { [RP]: 70 }), 2, 3)
    expect(g.relations[RP]?.stage).toBe('lover')
    const logLen = g.log.length
    g = releasePlayerPartner(g, 'poppy')
    expect(g.relations[RP]).toBeUndefined()
    expect(affinityOf(g, 'rudy', 'poppy')).toBe(70)
    expect(g.log).toHaveLength(logLen)
  })
  it('큰 사건이 걸린 날은 전환을 보류한다', () => {
    const g = setAff(base(), { [RP]: 65 })
    const busy = settleOneDay(settleOneDay(g, 2, {}, CONTENT, {}), 3, {}, CONTENT, { busy: (n) => n === 'rudy' })
    expect(busy.relations[RP]?.stage).toBe('friend')
  })
})

/** 연인 + 상담이 열린 상태로 */
function consulting(): GenState {
  let g = run(setAff(base(), { [RP]: 65 }), 2, 3)
  g = run(setAff(g, { [RP]: 85 }), 4, 3 + CONSULT_AFTER)
  return g
}

describe('결혼 상담 (D31·P8)', () => {
  it('연인 14일 + 80이면 상담이 열리고, 플레이어 마음이 더 높은 쪽이 꺼낸다', () => {
    const g = consulting()
    expect(g.relations[RP].consult).toBeTruthy()
    const d = g.relations[RP].consult!.nextAsk
    expect(consultFor(g, 'poppy', { rudy: 10, poppy: 30 }, d)?.id).toBe(RP)
    expect(consultFor(g, 'rudy', { rudy: 10, poppy: 30 }, d)).toBeNull()
  })
  it('하루 한 질문, 세 번 중 응원 둘이면 다음 아침 결혼 준비, 결혼식은 7일 뒤', () => {
    let g = consulting()
    const d0 = g.relations[RP].consult!.nextAsk
    const q: number[] = []
    let d = d0
    for (const a of ['cheer', 'wait', 'cheer'] as const) {
      expect(consultFor(g, 'poppy', { poppy: 30 }, d)).not.toBeNull()
      q.push(consultQuestion(g, g.relations[RP]))
      const out = answerConsult(g, RP, a, d)
      g = out.g
      expect(consultFor(g, 'poppy', { poppy: 30 }, d)).toBeNull() // 오늘은 더 묻지 않는다
      d++
      if (out.result !== 'asked') expect(out.result).toBe('cheered')
    }
    expect(new Set(q).size).toBe(3) // 한 바퀴 안에서 겹치지 않는다
    expect(q.every((i) => i >= 0 && i < CONSULT_LINES)).toBe(true)
    g = run(g, d, d)
    expect(g.relations[RP].stage).toBe('preparing')
    expect(g.relations[RP].prep?.wedding).toBe(d + WEDDING_DAYS)
    expect(g.relations[RP].prep?.tasks).toHaveLength(2)
  })
  it('기다려 보라는 쪽이 많으면 14일 뒤 다시, 관계는 그대로', () => {
    const g = consulting()
    const d = g.relations[RP].consult!.nextAsk
    let r = answerConsult(g, RP, 'wait', d)
    r = answerConsult(r.g, RP, 'wait', d + 1)
    r = answerConsult(r.g, RP, 'cheer', d + 2)
    expect(r.result).toBe('wait')
    expect(r.g.relations[RP].stage).toBe('lover')
    expect(r.g.relations[RP].consult?.nextAsk).toBe(d + 2 + CONSULT_RETRY)
    expect(run(r.g, d + 3, d + 5).relations[RP].stage).toBe('lover')
  })
  it('플레이어가 상담에 오지 않으면 진행 없음', () => {
    const g = run(consulting(), 4 + CONSULT_AFTER, 60)
    expect(g.relations[RP].stage).toBe('lover')
  })
})

function preparing(): { g: GenState; d: number } {
  let g = consulting()
  let d = g.relations[RP].consult!.nextAsk
  for (const a of ['cheer', 'cheer', 'cheer'] as const) g = answerConsult(g, RP, a, d++).g
  g = run(g, d, d)
  return { g, d }
}

describe('결혼 준비·다시 생각·결혼 (D31·P9)', () => {
  it('준비 돕기는 정해진 일만, 한 번씩', () => {
    const { g } = preparing()
    const [t] = g.relations[RP].prep!.tasks
    const g2 = helpPrep(g, RP, t)!
    expect(g2.relations[RP].prep!.done).toEqual([t])
    expect(helpPrep(g2, RP, t)).toBeNull()
    expect(helpPrep(g2, RP, 'nothing')).toBeNull()
  })
  it('다시 생각해 보라면 연인으로, 14일 뒤 다시 상담', () => {
    const { g, d } = preparing()
    const back = reconsider(g, RP, d + 1)
    expect(back.relations[RP].stage).toBe('lover')
    expect(back.relations[RP].consult).toMatchObject({ answers: [], nextAsk: d + 1 + CONSULT_RETRY })
    expect(run(back, d + 2, d + 10).relations[RP].stage).toBe('lover')
  })
  it('결혼식 다음 아침 부부가 되고 한 가구 — 결혼한 날 호감도를 적는다, 결혼 뒤 헤어짐 없음', () => {
    const { g: g0, d } = preparing()
    const wed = g0.relations[RP].prep!.wedding
    let g = run(g0, d + 1, wed)
    expect(g.relations[RP].stage).toBe('preparing')
    g = run(g, wed + 1, wed + 1)
    expect(g.relations[RP].stage).toBe('spouse')
    expect(g.persons.rudy.spouse).toBe('poppy')
    const h = Object.values(g.households)[0]
    expect(h.members.sort()).toEqual(['poppy', 'rudy'])
    expect(h.since).toBe(wed)
    expect(h.wedAffinity).toBe(85)
    // 파피의 집안은 찻집(teahouse — 첫 마을에 방이 있다), 루디는 목수 집 → 둘 다 집안 집이면 id 순으로 파피 쪽 = 찻집 (2026-10-08 22-B)
    expect(h.home).toBe('teahouse')
    g = run(setAff(g, { [RP]: 10 }), wed + 2, wed + 4)
    expect(g.relations[RP].stage).toBe('spouse')
  })
  it('결혼식은 열 수 없는 날을 피한다', () => {
    let g = consulting()
    let d = g.relations[RP].consult!.nextAsk
    for (const a of ['cheer', 'cheer', 'cheer'] as const) g = answerConsult(g, RP, a, d++).g
    const out = settleOneDay(g, d, {}, CONTENT, { weddingFree: (x) => x !== d + WEDDING_DAYS })
    expect(out.relations[RP].prep!.wedding).toBe(d + WEDDING_DAYS + 1)
  })
})

function married(): { g: GenState; d: number; hid: string } {
  const { g: g0, d } = preparing()
  const wed = g0.relations[RP].prep!.wedding
  const g = run(g0, d + 1, wed + 1)
  return { g, d: wed + 1, hid: Object.keys(g.households)[0] }
}

describe('아기 침대와 출생 (D32·P10·P11)', () => {
  it('호감도가 결혼한 날보다 15 오르면 부탁, 건네면 28일 뒤 출생', () => {
    const { g: g0, d, hid } = married()
    let g = run(g0, d + 1, d + 3)
    expect(cribAskOf(g, 'rudy')).toBeNull()
    g = run(setAff(g, { [RP]: 100 }), d + 4, d + 4)
    expect(cribAskOf(g, 'rudy')?.id).toBe(hid)
    g = giveCrib(g, hid, d + 5)!
    expect(g.households[hid].birthDue).toBe(d + 5 + BIRTH_AFTER_CRIB)
    expect(giveCrib(g, hid, d + 6)).toBeNull()
    g = run(g, d + 6, d + 5 + BIRTH_AFTER_CRIB)
    const kids = g.households[hid].children
    expect(kids).toHaveLength(1)
    const baby = g.persons[kids[0]]
    expect(baby).toMatchObject({ origin: 'born', stage: 'baby', born: d + 5 + BIRTH_AFTER_CRIB, household: hid })
    expect(baby.parents.sort()).toEqual(['poppy', 'rudy'])
    expect(baby.name).toBeTruthy()
    expect(g.log.at(-1)?.kind).toBe('birth')
  })
  it('안 건네면 아이는 오지 않고, 며칠 뒤 한 번만 다시 말한다', () => {
    const { g: g0, d } = married()
    const g = run(setAff(g0, { [RP]: 100 }), d + 1, d + 60)
    expect(Object.values(g.households)[0].children).toHaveLength(0)
    expect(g.log.filter((l) => l.kind === 'cribAgain')).toHaveLength(1)
    expect(g.log.filter((l) => l.kind === 'crib')).toHaveLength(1)
  })
  it('같은 씨앗이면 같은 아이, 둘째는 부탁 없이 56일 뒤부터, 가족당 둘까지', () => {
    const { g: g0, d, hid } = married()
    let g = run(setAff(g0, { [RP]: 100 }), d + 1, d + 1)
    g = giveCrib(g, hid, d + 2)!
    const a = run(g, d + 3, d + 200)
    const b = run(g, d + 3, d + 200)
    expect(a.households[hid].children).toEqual(b.households[hid].children)
    expect(a.persons[a.households[hid].children[0]]).toEqual(b.persons[b.households[hid].children[0]])
    expect(a.households[hid].children).toHaveLength(2)
    expect(a.log.filter((l) => l.kind === 'expecting')).toHaveLength(1)
    expect(a.log.filter((l) => l.kind === 'crib')).toHaveLength(1)
  })
})

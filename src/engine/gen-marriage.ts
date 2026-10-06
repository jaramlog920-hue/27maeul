// 계획 20 2부 작업 D: 주민 결혼 — 플레이어 상담, 준비 돕기와 다시 생각, 광장 결혼식 (D31·P8·P9·D21).
// 상담은 겉으로 허락을 구하지 않는다: 친구에게 털어놓듯 묻고, 플레이어 답이 응원 쪽이어야 다음 아침 결혼 준비로 넘어간다.
// 플레이어가 상담에 오지 않으면 아무것도 진행되지 않는다 (정산이 저절로 결혼시키지 않음).
import { CONSULT_CHEER, CONSULT_QUESTIONS, CONSULT_RETRY, MAX_PREPARING, WEDDING_DAYS } from './gen-config'
import { addLog, affinityOf, genRng, relationId, type ConsultAnswer, type GenState, type Household, type Relation } from './gen'
import type { DayCtx } from './gen-relations'
import type { ItemId } from './types'

/** 준비 일 (P9): 잔치 자리에 쓸, 이미 있는 물건들. 두 가지를 날 씨앗으로 고른다 */
export const PREP_TASKS: Record<string, Partial<Record<ItemId, number>>> = {
  bread: { bread: 2 },
  grapes: { grapes: 2 },
  fig: { fig: 2 },
  oil: { oil: 1 },
  blanket: { blanket: 1 },
}
export const PREP_IDS = Object.keys(PREP_TASKS)
/** 준비 하나를 도우면 오르는 마음 (둘 모두) */
export const PREP_GAIN = 5
/** 상담 질문 수 (life-text.json gen.consult의 줄 수와 같다 — 테스트가 맞춰 본다) */
export const CONSULT_LINES = 8

/** 상담을 꺼내는 사람: 둘 중 플레이어 마음이 더 높은 쪽, 같으면 id 순 (P8) */
export function consultantOf(r: Pick<Relation, 'a' | 'b'>, hearts: Record<string, number>): string {
  const ha = hearts[r.a] ?? 0, hb = hearts[r.b] ?? 0
  return hb > ha ? r.b : r.a
}

/** 오늘 이 이웃이 꺼낼 상담 (없으면 null): 상담이 열려 있고, 물을 날이 됐고, 오늘 아직 안 물었고, 세 번 다 묻지 않았다 */
export function consultFor(g: GenState | undefined, npc: string, hearts: Record<string, number>, day: number): Relation | null {
  if (!g?.on) return null
  for (const r of Object.values(g.relations)) {
    if (r.stage !== 'lover' || !r.consult || (r.a !== npc && r.b !== npc)) continue
    if (consultantOf(r, hearts) !== npc) continue
    const c = r.consult
    if (c.nextAsk > day || c.asked.includes(day) || c.answers.length >= CONSULT_QUESTIONS) continue
    return r
  }
  return null
}

/** 이번에 물을 질문 번호 (한 바퀴 안에서 겹치지 않게, 씨앗으로) */
export function consultQuestion(g: GenState, r: Relation): number {
  const round = r.consult?.round ?? 0 // 바퀴마다 다른 순서
  const order = [...Array(CONSULT_LINES).keys()]
  const rnd = genRng(g.seed, 'consult', [r.a, r.b], round)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order[(r.consult?.answers.length ?? 0) % CONSULT_LINES]
}

export type ConsultResult = 'asked' | 'cheered' | 'wait'

/**
 * 상담에 답하기: 답을 적고 내일 다음 질문. 세 번째 답에서 응원이 둘 이상이면 'cheered'(다음 아침 결혼 준비),
 * 기다려 보라는 쪽이 더 많으면 'wait' — 상담을 비우고 14일 뒤 다시 (관계·마음은 그대로)
 */
export function answerConsult(g: GenState, rid: string, answer: ConsultAnswer, day: number): { g: GenState; result: ConsultResult } {
  const r = g.relations[rid]
  if (!r?.consult || r.stage !== 'lover') return { g, result: 'asked' }
  const c = { ...r.consult, asked: [...r.consult.asked, day], answers: [...r.consult.answers, answer], nextAsk: day + 1 }
  let result: ConsultResult = 'asked'
  let consult = c
  if (c.answers.length >= CONSULT_QUESTIONS) {
    const cheer = c.answers.filter((a) => a === 'cheer').length
    if (cheer >= CONSULT_CHEER) result = 'cheered'
    else {
      result = 'wait'
      consult = { asked: [], answers: [], nextAsk: day + CONSULT_RETRY, round: day + CONSULT_RETRY }
    }
  }
  let out: GenState = { ...g, relations: { ...g.relations, [rid]: { ...r, consult } } }
  if (result === 'wait') out = addLog(out, day, 'consultWait', [r.a, r.b])
  return { g: out, result }
}

export const consultCheered = (r: Relation): boolean =>
  !!r.consult && r.consult.answers.length >= CONSULT_QUESTIONS && r.consult.answers.filter((a) => a === 'cheer').length >= CONSULT_CHEER

/** 지금 결혼 준비 중인 쌍 */
export const preparingOf = (g: GenState): Relation[] => Object.values(g.relations).filter((r) => r.stage === 'preparing')

/** 오늘 저녁이 주민 결혼식인 쌍 (없으면 null) */
export function weddingTodayOf(g: GenState | undefined, day: number): Relation | null {
  if (!g) return null
  return preparingOf(g).find((r) => r.prep?.wedding === day) ?? null
}

export interface MarriageCtx extends DayCtx {
  /** 결혼식을 열 수 있는 날인가 (장날·잔치·플레이어 결혼식을 피한다) */
  weddingFree: (day: number) => boolean
}

/** 결혼식 날: 준비 시작 + 7일부터, 열 수 있는 첫날 (2주 안에 없으면 + 7일 그대로) */
export function pickWeddingDay(from: number, free: (day: number) => boolean): number {
  for (let d = from + WEDDING_DAYS; d < from + WEDDING_DAYS + 14; d++) if (free(d)) return d
  return from + WEDDING_DAYS
}

const nextHouseholdId = (g: GenState): string => {
  let n = 1
  for (const id of Object.keys(g.households)) {
    const m = /^h-(\d+)$/.exec(id)
    if (m) n = Math.max(n, Number(m[1]) + 1)
  }
  return `h-${String(n).padStart(4, '0')}`
}

/** 사는 집: 집 주인 npc id와, 제 집인지(집안 어른 집에 함께 사는 것이 아닌지) */
export type HomeOf = (id: string) => { home: string; own: boolean }

/** 신혼 거주: 제 집이 있는 쪽, 둘 다 있거나 둘 다 없으면 id 순 (D21) */
export function marry(g: GenState, r: Relation, day: number, homeOf: HomeOf): GenState {
  const hid = nextHouseholdId(g)
  const ha = homeOf(r.a), hb = homeOf(r.b)
  const home = ha.own !== hb.own ? (ha.own ? ha.home : hb.home) : ha.home
  const persons = { ...g.persons }
  persons[r.a] = { ...persons[r.a], spouse: r.b, household: hid }
  persons[r.b] = { ...persons[r.b], spouse: r.a, household: hid }
  const h: Household = { id: hid, members: [r.a, r.b], home, children: [], lastBirth: null, since: day, wedAffinity: affinityOf(g, r.a, r.b) }
  const rel: Relation = { id: r.id, a: r.a, b: r.b, stage: 'spouse', since: day }
  return { ...g, persons, relations: { ...g.relations, [r.id]: rel }, households: { ...g.households, [hid]: h } }
}

export function settleMarriage(g: GenState, d: number, ctx: MarriageCtx, homeOf: HomeOf): GenState {
  // 결혼식이 지난 아침: 부부가 된다 (결혼식 날 저녁에 잔치가 열렸다)
  for (const r of preparingOf(g)) {
    if (!r.prep || d <= r.prep.wedding) continue
    g = marry(g, r, r.prep.wedding, homeOf)
    g = addLog(g, d, 'married', [r.a, r.b])
  }
  // 상담이 응원으로 끝난 다음 아침: 결혼 준비 (동시에 한 쌍)
  for (const r of Object.values(g.relations).sort((x, y) => (x.id < y.id ? -1 : 1))) {
    if (r.stage !== 'lover' || !consultCheered(r) || preparingOf(g).length >= MAX_PREPARING) continue
    if (ctx.busy(r.a) || ctx.busy(r.b) || (ctx.partner && (ctx.partner === r.a || ctx.partner === r.b))) continue
    if (r.consult && r.consult.asked[r.consult.asked.length - 1] >= d) continue // 답한 날 밤을 지나야
    const rnd = genRng(g.seed, 'prep', [r.a, r.b], d)
    const pool = [...PREP_IDS]
    const tasks: string[] = []
    while (tasks.length < 2 && pool.length) tasks.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0])
    const rel: Relation = { id: r.id, a: r.a, b: r.b, stage: 'preparing', since: d, prep: { tasks, done: [], wedding: pickWeddingDay(d, ctx.weddingFree) } }
    g = addLog({ ...g, relations: { ...g.relations, [r.id]: rel } }, d, 'preparing', [r.a, r.b])
  }
  return g
}

/** 준비 돕기: 물건을 건네면 그 일 완료 — 이미 한 일·없는 일은 그대로 */
export function helpPrep(g: GenState, rid: string, task: string): GenState | null {
  const r = g.relations[rid]
  if (r?.stage !== 'preparing' || !r.prep || !r.prep.tasks.includes(task) || r.prep.done.includes(task)) return null
  return { ...g, relations: { ...g.relations, [rid]: { ...r, prep: { ...r.prep, done: [...r.prep.done, task] } } } }
}

/** 다시 생각해 보라고 하기: 준비 취소, 연인으로 돌아가고 14일 뒤 다시 상담 (관계·마음은 그대로) */
export function reconsider(g: GenState, rid: string, day: number): GenState {
  const r = g.relations[rid]
  if (r?.stage !== 'preparing') return g
  const rel: Relation = { id: r.id, a: r.a, b: r.b, stage: 'lover', since: r.since, consult: { asked: [], answers: [], nextAsk: day + CONSULT_RETRY, round: day + CONSULT_RETRY } }
  return addLog({ ...g, relations: { ...g.relations, [rid]: rel } }, day, 'reconsider', [r.a, r.b])
}

/** 이 이웃이 준비 중인 쌍 */
export function preparingFor(g: GenState | undefined, npc: string): Relation | null {
  if (!g) return null
  return preparingOf(g).find((r) => r.a === npc || r.b === npc) ?? null
}

export const pairOf = (r: Pick<Relation, 'a' | 'b'>, npc: string): string => (r.a === npc ? r.b : r.a)
export { relationId }

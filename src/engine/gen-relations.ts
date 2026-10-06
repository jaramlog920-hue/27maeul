// 계획 20 2부 작업 C: 관계 단계와 헤어짐 (D30·P6·P7).
// 하루 정산에서 한 날씩 부른다: 플레이어 연인 떼어 내기 → 헤어짐(하루 한 쌍) → 친한 사이 → 연인(하루 한 쌍) → 상담 시작.
// 소식은 gen.log에 쌓고, 화면 글은 news 쪽이 만든다. 극적인 장면은 없다.
import { closeKin } from './gen-kin'
import { BREAKUP_BELOW, BREAKUP_QUIET, CONSULT_AFTER, CONSULT_AT, FRIEND_AT, LOVER_AT, MAX_LOVERS, MIN_GAP } from './gen-config'
import { addLog, affinityOf, canPair, relationId, type GenState, type Relation } from './gen'

export interface DayCtx {
  /** 플레이어의 연인·약혼자·배우자 */
  partner: string | null
  /** 오늘 큰 사건이 걸린 사람 (계보 id) — 그 사람의 전환은 보류 */
  busy: (id: string) => boolean
}

/** 오늘(d) 이미 큰 전환이 있었던 사람 — 같은 사람의 두 전환 사이는 하루 띄운다 (P6) */
export function changedOn(g: GenState, d: number): Set<string> {
  const out = new Set<string>()
  for (const l of g.log) if (d - l.day < MIN_GAP) for (const w of l.who) out.add(w)
  return out
}

const without = (g: GenState, id: string): GenState => {
  const relations = { ...g.relations }
  delete relations[id]
  return { ...g, relations }
}

/** 플레이어가 그 사람과 사귀기 시작하면 그 사람의 주민 연인·결혼 준비 관계는 조용히 이웃으로 (호감도는 그대로, 소식 없음 — P7) */
export function releasePlayerPartner(g: GenState, partner: string | null): GenState {
  if (!partner) return g
  for (const r of Object.values(g.relations)) {
    if ((r.stage === 'lover' || r.stage === 'preparing') && (r.a === partner || r.b === partner)) g = without(g, r.id)
  }
  return g
}

export const loverCount = (g: GenState): number => Object.values(g.relations).filter((r) => r.stage === 'lover' || r.stage === 'preparing').length

/** 헤어진 지 7일 안인가 (그 둘의 만남은 담담하다) */
export const quietAfterBreakup = (g: GenState, a: string, b: string, day: number): boolean => {
  const d = g.breakup[relationId(a, b)]
  return d != null && day - d < BREAKUP_QUIET
}

export function settleRelations(g: GenState, d: number, ctx: DayCtx): GenState {
  g = releasePlayerPartner(g, ctx.partner)
  const free = (id: string, changed: Set<string>) => !ctx.busy(id) && !changed.has(id)

  // 헤어짐: 연인 단계에서 40 아래면 (하루 한 쌍, 낮은 쪽 먼저). 결혼 준비·결혼 뒤에는 없다
  let changed = changedOn(g, d)
  const low = Object.values(g.relations)
    .filter((r) => r.stage === 'lover' && affinityOf(g, r.a, r.b) < BREAKUP_BELOW && free(r.a, changed) && free(r.b, changed))
    .sort((x, y) => affinityOf(g, x.a, x.b) - affinityOf(g, y.a, y.b) || (x.id < y.id ? -1 : 1))
  if (low.length) {
    const r = low[0]
    g = { ...without(g, r.id), breakup: { ...g.breakup, [r.id]: d } }
    g = addLog(g, d, 'breakup', [r.a, r.b])
  }

  // 친한 사이: 호감도 30 이상인 남(가까운 친족 아님)은 친한 사이로. 수가 많아도 모두 (가벼운 소식)
  changed = changedOn(g, d)
  for (const [id, v] of Object.entries(g.affinity).sort(([x], [y]) => (x < y ? -1 : 1))) {
    if (v < FRIEND_AT || g.relations[id]) continue
    const [a, b] = id.split('|')
    if (!g.persons[a] || !g.persons[b] || closeKin(g.persons, a, b) || quietAfterBreakup(g, a, b, d)) continue
    const r: Relation = { id, a, b, stage: 'friend', since: d }
    g = addLog({ ...g, relations: { ...g.relations, [id]: r } }, d, 'friend', [a, b])
  }

  // 연인: 친한 사이 중 60 이상·짝 조건 (하루 한 쌍, 마을 전체 4쌍까지). 헤어진 지 7일 안은 다시 사귀지 않는다
  changed = changedOn(g, d)
  if (loverCount(g) < MAX_LOVERS) {
    const ready = Object.values(g.relations)
      .filter((r) => r.stage === 'friend' && affinityOf(g, r.a, r.b) >= LOVER_AT && canPair(g, ctx.partner, r.a, r.b) && !quietAfterBreakup(g, r.a, r.b, d))
      .filter((r) => free(r.a, changed) && free(r.b, changed))
      .sort((x, y) => affinityOf(g, y.a, y.b) - affinityOf(g, x.a, x.b) || (x.id < y.id ? -1 : 1))
    // 짝 조건은 다른 연인이 없어야 하므로, 고른 한 쌍만
    if (ready.length) {
      const r = ready[0]
      g = addLog({ ...g, relations: { ...g.relations, [r.id]: { ...r, stage: 'lover', since: d } } }, d, 'lover', [r.a, r.b])
    }
  }

  // 상담 시작: 연인 된 지 14일 이상 + 80 이상, 아직 상담이 없으면 (오늘부터 물을 수 있다)
  for (const r of Object.values(g.relations).sort((x, y) => (x.id < y.id ? -1 : 1))) {
    if (r.stage !== 'lover' || r.consult || d - r.since < CONSULT_AFTER || affinityOf(g, r.a, r.b) < CONSULT_AT) continue
    if (ctx.busy(r.a) || ctx.busy(r.b)) continue
    g = addLog({ ...g, relations: { ...g.relations, [r.id]: { ...r, consult: { asked: [], answers: [], nextAsk: d, round: d } } } }, d, 'consult', [r.a, r.b])
  }
  return g
}

// 계획 20 2부 작업 C: 관계 단계와 헤어짐 (D30·P6·P7).
// 하루 정산에서 한 날씩 부른다: 플레이어 연인 떼어 내기 → 헤어짐(하루 한 쌍) → 짝이 될 친한 사이·연인이 조금씩 가까워짐 → 친한 사이 → 연인(하루 한 쌍) → 상담 시작.
// 소식은 gen.log에 쌓고, 화면 글은 news 쪽이 만든다. 극적인 장면은 없다.
import { closeKin } from './gen-kin'
import { BREAKUP_BELOW, BREAKUP_QUIET, CONSULT_AFTER, CONSULT_AT, CONSULT_NUDGE, CONSULT_QUESTIONS, FRIEND_AT, FRIEND_DRIFT, LOVER_AT, PAIR_DRIFT, MAX_LOVERS, MIN_GAP } from './gen-config'
import { addAffinity, addLog, affinityOf, canPair, relationId, type GenState, type Relation } from './gen'

export interface DayCtx {
  /** 플레이어의 연인·약혼자·배우자 */
  partner: string | null
  /** 오늘 큰 사건이 걸린 사람 (계보 id) — 그 사람의 전환은 보류 */
  busy: (id: string) => boolean
  /** 플레이어와 헤어진 지 14일 안인 사람 — 다른 주민과 사귀지 않는다 */
  cooling?: (id: string) => boolean
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

  // 짝이 될 수 있는 친한 사이는 연인 문턱(LOVER_AT)까지, 연인은 상담 문턱(CONSULT_AT)까지 날마다 조금씩 저절로 가까워진다 (FRIEND_DRIFT).
  // 그 위는 만남으로만 — 결혼한 날 호감도보다 더 올라야 아기를 바라므로(gen-birth) 결혼 전에 가득 차지 않게. 오늘 다른 일이 걸린 사람은 빼고
  changed = changedOn(g, d)
  for (const r of Object.values(g.relations).sort((x, y) => (x.id < y.id ? -1 : 1))) {
    const cap = r.stage === 'lover' ? CONSULT_AT : r.stage === 'friend' && canPair(g, ctx.partner, r.a, r.b, ctx.cooling) && !quietAfterBreakup(g, r.a, r.b, d) ? LOVER_AT : 0
    if (affinityOf(g, r.a, r.b) < cap && free(r.a, changed) && free(r.b, changed)) g = addAffinity(g, r.a, r.b, Math.min(FRIEND_DRIFT, cap - affinityOf(g, r.a, r.b)))
  }

  // 짝이 될 수 있는 둘이 한 번이라도 만났으면 친한 사이가 되기 전에도 조금씩 가까워진다 — 친한 사이까지 만남으로만 40일 넘게 걸려
  // 자율 생활이 열리고 두 달이 지나야 첫 연인이 생겼다 (2026-10-27 사용자: 한 달이면 생기게)
  changed = changedOn(g, d)
  for (const [id, v] of Object.entries(g.affinity).sort(([x], [y]) => (x < y ? -1 : 1))) {
    if (v <= 0 || v >= FRIEND_AT || g.relations[id]) continue
    const [a, b] = id.split('|')
    if (free(a, changed) && free(b, changed) && canPair(g, ctx.partner, a, b, ctx.cooling) && !quietAfterBreakup(g, a, b, d)) g = addAffinity(g, a, b, Math.min(PAIR_DRIFT, FRIEND_AT - v))
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
      .filter((r) => r.stage === 'friend' && affinityOf(g, r.a, r.b) >= LOVER_AT && canPair(g, ctx.partner, r.a, r.b, ctx.cooling) && !quietAfterBreakup(g, r.a, r.b, d))
      .filter((r) => free(r.a, changed) && free(r.b, changed))
      .sort((x, y) => affinityOf(g, y.a, y.b) - affinityOf(g, x.a, x.b) || (x.id < y.id ? -1 : 1))
    // 짝 조건은 다른 연인이 없어야 하므로, 고른 한 쌍만
    if (ready.length) {
      const r = ready[0]
      g = addLog({ ...g, relations: { ...g.relations, [r.id]: { ...r, stage: 'lover', since: d } } }, d, 'lover', [r.a, r.b])
    }
  }

  // 상담을 기다리는 쌍: 플레이어가 들어 주지 않으면 진행은 없고, CONSULT_NUDGE일마다 마을 소식으로 다시 알린다 (P8 — 2026-10-22 중후반 점검: 재촉이 빠져 있어 모르고 지나갔다)
  for (const r of Object.values(g.relations).sort((x, y) => (x.id < y.id ? -1 : 1))) {
    if (r.stage !== 'lover' || !r.consult || r.consult.answers.length >= CONSULT_QUESTIONS || d < r.consult.nextAsk) continue
    const mine = (l: { kind: string; who: string[] }) => l.kind === 'consult' && l.who.includes(r.a) && l.who.includes(r.b)
    const last = [...g.log].reverse().find(mine)
    // 같은 쌍의 상담 소식은 하나만 남긴다 — 기록 한도(LOG_CAP) 안에서 결혼·출생 같은 옛 기록이 밀려나지 않게
    if (!last || d - last.day >= CONSULT_NUDGE) g = addLog({ ...g, log: g.log.filter((l) => !mine(l)) }, d, 'consult', [r.a, r.b])
  }

  // 상담 시작: 연인 된 지 14일 이상 + 80 이상, 아직 상담이 없으면 (오늘부터 물을 수 있다)
  for (const r of Object.values(g.relations).sort((x, y) => (x.id < y.id ? -1 : 1))) {
    if (r.stage !== 'lover' || r.consult || d - r.since < CONSULT_AFTER || affinityOf(g, r.a, r.b) < CONSULT_AT) continue
    if (ctx.busy(r.a) || ctx.busy(r.b)) continue
    g = addLog({ ...g, relations: { ...g.relations, [r.id]: { ...r, consult: { asked: [], answers: [], nextAsk: d, round: d } } } }, d, 'consult', [r.a, r.b])
  }
  return g
}

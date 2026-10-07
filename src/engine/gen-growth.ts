// 세대교체 (사용자 결정 2026-10-07): 주민 아이는 플레이어 아이와 같은 속도로 자라고(14·42·84일),
// 어른이 되면 부모 일터에서 견습을 시작한다. 한 계절(40일) 뒤 부모는 조용히 은퇴해 쉬고(사망 없음),
// 그 이웃의 자리(일·돕기·함께 일하기·대화·마음)는 자녀가 이어받는다.
import { STAGE_AT } from './gen-config'
import { addLog, type GenPerson, type GenState, type GenStage } from './gen'

/** 은퇴: 견습을 시작하고 이만큼 지나면 (한 계절) */
export const RETIRE_AFTER = 40

/** 태어난 날부터 센 단계 */
export function stageByAge(born: number, day: number): GenStage {
  const age = day - born
  return age >= STAGE_AT.elder ? 'elder' : age >= STAGE_AT.adult ? 'adult' : age >= STAGE_AT.teen ? 'teen' : age >= STAGE_AT.child ? 'child' : 'baby'
}

/** 일을 물려줄 부모 (그 집의 고정 주민 — 집 주인이면 먼저) */
function workParent(g: GenState, childId: string, home: string): string | null {
  const c = g.persons[childId]
  const fixed = c.parents.filter((p) => g.persons[p]?.origin === 'fixed')
  if (!fixed.length) return null
  return fixed.includes(home) ? home : [...fixed].sort()[0]
}

/** 이 이웃 자리에 지금 서 있는 사람 (은퇴했으면 이어받은 자녀, 아니면 그 이웃) */
export function slotPerson(g: GenState | undefined, npc: string): string {
  return g?.retired?.[npc]?.heir ?? npc
}

/** 사람 → 그 사람이 서 있는 이웃 자리 (부모 자리를 이어받은 자녀면 부모의 자리, 아니면 자기 id) — 2026-10-08 버그 22-C */
export function slotOfPerson(g: GenState | undefined, pid: string): string {
  for (const [npc, r] of Object.entries(g?.retired ?? {})) if (r.heir === pid) return npc
  return pid
}

/** 이 이웃이 은퇴했나 */
export const isRetired = (g: GenState | undefined, npc: string): boolean => !!g?.retired?.[npc]

/** 은퇴하고 이만큼 지나면 마을을 떠나 이사 간다 (2026-10-07 사용자: 고맙다는 편지·말씀 조각·선물을 남긴다) */
export const MOVE_AFTER = 14
/** 이사 갔나 */
export const movedAway = (g: GenState | undefined, npc: string): boolean => g?.retired?.[npc]?.moved != null
/** 이사 간 이웃 자리의 주인 (이어받은 자녀) — 이사 전이면 null */
export function movedHeir(g: GenState | undefined, npc: string): GenPerson | null {
  const r = g?.retired?.[npc]
  return r?.moved != null ? (g!.persons[r.heir] ?? null) : null
}

/** 하루 정산: 자라기 → 견습 시작 → 은퇴와 이어받기 */
export function settleGrowth(g: GenState, d: number): GenState {
  for (const p of Object.values(g.persons)) {
    if (p.origin !== 'born' || p.born == null || p.stage === 'elder') continue
    const next = stageByAge(p.born, d)
    if (next === p.stage) continue
    g = { ...g, persons: { ...g.persons, [p.id]: { ...g.persons[p.id], stage: next } } }
    g = addLog(g, d, `grew:${next}`, [p.id])
  }
  // 어른이 된 첫 자녀가 부모 일터에서 견습을 시작한다 (부모마다 한 사람)
  for (const h of Object.values(g.households).sort((a, b) => (a.id < b.id ? -1 : 1))) {
    for (const cid of h.children) {
      const c = g.persons[cid]
      if (!c || c.stage !== 'adult') continue
      const parent = workParent(g, cid, h.home)
      if (!parent || g.heirs?.[parent] || g.retired?.[parent]) continue
      g = { ...g, heirs: { ...(g.heirs ?? {}), [parent]: { heir: cid, since: d } } }
      g = addLog(g, d, 'apprentice', [parent, cid])
    }
  }
  // 견습 한 계절 뒤: 부모는 은퇴, 자리는 자녀에게
  for (const [parent, a] of Object.entries(g.heirs ?? {})) {
    if (g.retired?.[parent] || d - a.since < RETIRE_AFTER) continue
    g = { ...g, retired: { ...(g.retired ?? {}), [parent]: { heir: a.heir, day: d } } }
    g = addLog(g, d, 'retired', [parent, a.heir])
  }
  // 은퇴 14일 뒤: 이사 (자리는 자녀가 그대로)
  for (const [parent, r] of Object.entries(g.retired ?? {})) {
    if (r.moved != null || d - r.day < MOVE_AFTER) continue
    g = { ...g, retired: { ...g.retired, [parent]: { ...r, moved: d } } }
    g = addLog(g, d, 'movedAway', [parent, r.heir])
  }
  return g
}

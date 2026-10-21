// 세대교체 (사용자 결정 2026-10-07): 주민 아이는 플레이어 아이와 같은 속도로 자라고(14·42·84일),
// 어른이 되면 부모 일터에서 견습을 시작한다. 한 계절(40일) 뒤 부모는 조용히 은퇴해 쉬고(사망 없음),
// 그 이웃의 자리(일·돕기·함께 일하기·대화·마음)는 자녀가 이어받는다.
import { stageByAge } from './gen-age'
import { addLog, BAKER_BABY_ID, genRng, type GenPerson, type GenState } from './gen'
import { GEN_CHILD_NAMES } from './gen-birth'
import { STAGE_AT } from './gen-config'
export { stageByAge } from './gen-age'

/** 은퇴: 견습을 시작하고 이만큼 지나면 (한 계절) */
export const RETIRE_AFTER = 40

/**
 * 일을 물려줄 부모의 이웃 자리 (집 주인이면 먼저): 고정 주민 부모면 그 이웃, 부모가 이미 자리를 이어받은 자녀면 그 자리
 * (2026-10-20 사용자: 셋째 대도 일을 이어 가게 — 손주가 부모에게 배워 같은 자리를 잇는다)
 */
function workParent(g: GenState, childId: string, home: string, keep?: string | null): string | null {
  const c = g.persons[childId]
  const slots = c.parents.flatMap((p) => {
    if (g.persons[p]?.origin === 'fixed') return [p]
    const slot = slotOfPerson(g, p)
    // 플레이어 짝의 자리는 다음 대로 넘기지 않으므로 다른 부모 쪽 자리를 본다
    return slot !== p && slot !== keep ? [slot] : []
  })
  if (!slots.length) return null
  return slots.includes(home) ? home : [...slots].sort()[0]
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

/** Legacy move-away delay, retained for old-save fixtures. Retirement no longer removes residents. */
export const MOVE_AFTER = 14
/** Exclude only adult aging; children keep their existing growth schedule. */
export function pauseResidentAging(g: GenState, day: number, starting = false): GenState {
  for (const p of Object.values(g.persons)) {
    if ((p.origin !== 'born' && p.id !== BAKER_BABY_ID) || p.born == null || p.stage === 'elder') continue
    const adultDay = p.born + STAGE_AT.adult
    if (day < adultDay || (p.agePause && day <= p.agePause.at)) continue
    const days = (p.agePause?.days ?? 0) + (starting ? 0 : Math.max(0, day - Math.max(adultDay, p.agePause?.at ?? adultDay)))
    g = { ...g, persons: { ...g.persons, [p.id]: { ...p, agePause: { days, at: day } } } }
    if (!starting) for (const [parent, heir] of Object.entries(g.heirs ?? {})) {
      if (heir.heir !== p.id || g.retired?.[parent]?.heir === heir.heir) continue
      const elapsed = Math.max(0, day - Math.max(heir.since, adultDay, p.agePause?.at ?? adultDay))
      if (elapsed) g = { ...g, heirs: { ...g.heirs, [parent]: { ...heir, paused: (heir.paused ?? 0) + elapsed } } }
    }
  }
  return g
}
/** 이사 갔나 */
export const movedAway = (g: GenState | undefined, npc: string): boolean => g?.retired?.[npc]?.moved != null
/** 은퇴한 이웃 자리의 주인으로 보이는 사람 (이어받은 자녀) — 이사 여부와 상관없이. 은퇴 전이면 null (2026-10-11 사용자 결정) */
export function slotHeir(g: GenState | undefined, npc: string): GenPerson | null {
  const r = g?.retired?.[npc]
  return r ? (g!.persons[r.heir] ?? null) : null
}
/** 이사 간 이웃 자리의 주인 (이어받은 자녀) — 이사 전이면 null */
export function movedHeir(g: GenState | undefined, npc: string): GenPerson | null {
  const r = g?.retired?.[npc]
  return r?.moved != null ? (g!.persons[r.heir] ?? null) : null
}

/**
 * 하루 정산: 자라기 (→ 견습 시작 → 은퇴와 이어받기). 2026-10-21 사용자: 은퇴를 없앴다 — 게임은 견습·은퇴를 끈 채로 부른다(gen-settle).
 * 견습·은퇴 갈래는 예전 시험이 그대로 쓰도록 access로 켤 때만 남겨 둔다
 */
/** ageless (2026-10-13 사용자 설정 '주민이 나이 들지 않음'): 자식은 어른까지만 자라고, 아무도 은퇴하지 않는다 */
export function settleGrowth(g: GenState, d: number, access: { generations: boolean; retirement: boolean; ageless?: boolean; keep?: string | null; ownJobs?: boolean } = { generations: false, retirement: false }): GenState {
  if (access.ageless) g = pauseResidentAging(g, d)
  // Restore legacy retirees without changing succession or historical logs/rewards.
  for (const [parent, r] of Object.entries(g.retired ?? {})) {
    if (r.moved == null) continue
    g = { ...g, retired: { ...g.retired, [parent]: { heir: r.heir, day: r.day } } }
  }
  for (const p of Object.values(g.persons)) {
    if ((p.origin !== 'born' && p.id !== BAKER_BABY_ID) || p.born == null || p.stage === 'elder') continue
    const aged = stageByAge(p.born, d - (p.agePause?.days ?? 0))
    const next = access.ageless && aged === 'elder' ? 'adult' : aged
    const agePause = p.agePause && d > p.agePause.at ? { ...p.agePause, at: d } : p.agePause
    if (next !== p.stage || agePause !== p.agePause) {
      g = { ...g, persons: { ...g.persons, [p.id]: { ...g.persons[p.id], stage: next, ...(agePause ? { agePause } : {}) } } }
    }
    if (next !== p.stage) g = addLog(g, d, `grew:${next}`, [p.id])
    // 어른이 된 자녀는 스스로 일을 찾는다 (persona.ts residentJob — 소식 한 줄)
    if (access.ownJobs && next === 'adult' && p.stage !== 'adult' && p.origin === 'born') g = addLog(g, d, 'ownJob', [p.id])
  }
  // 빵집 아이는 아기를 벗으면 다른 주민 아이처럼 이름이 저절로 붙는다 (2026-10-12 사용자 결정 6)
  const bb = g.persons[BAKER_BABY_ID]
  if (bb && bb.stage !== 'baby' && !bb.name) {
    const rnd = genRng(g.seed, 'bakerName', ['baker'], 1)
    const look: 'f' | 'm' = bb.look ?? (rnd() < 0.5 ? 'f' : 'm')
    const taken = new Set(Object.values(g.persons).map((x) => x.name).filter(Boolean))
    const free = GEN_CHILD_NAMES[look].filter((n) => !taken.has(n))
    const list = free.length ? free : GEN_CHILD_NAMES[look]
    g = { ...g, persons: { ...g.persons, [BAKER_BABY_ID]: { ...bb, look, name: list[Math.floor(rnd() * list.length)], avatar: bb.avatar ?? { hairFront: Math.floor(rnd() * 12) } } } }
  }
  // 어른이 된 빵집 아이는 헤이즐의 일터에서 견습을 시작한다 → 한 계절 뒤 헤이즐은 은퇴하고 일을 이어받는다 (사용자 결정 6)
  const grownBaker = g.persons[BAKER_BABY_ID]
  if (access.generations && grownBaker?.stage === 'adult' && g.persons.baker && !g.heirs?.baker && !g.retired?.baker) {
    g = { ...g, heirs: { ...(g.heirs ?? {}), baker: { heir: BAKER_BABY_ID, since: d } } }
    g = addLog(g, d, 'apprentice', ['baker', BAKER_BABY_ID])
  }
  // 어른이 된 첫 자녀가 부모 일터에서 견습을 시작한다 (부모마다 한 사람)
  for (const h of (access.generations ? Object.values(g.households) : []).sort((a, b) => (a.id < b.id ? -1 : 1))) {
    for (const cid of h.children) {
      const c = g.persons[cid]
      if (!c || c.stage !== 'adult') continue
      const parent = workParent(g, cid, h.home, access.keep)
      if (!parent) continue
      const r = g.retired?.[parent], a = g.heirs?.[parent]
      // 첫 대: 고정 주민에게 처음 배운다. 다음 대: 자리를 이은 부모가 다 배운 뒤(견습 기록 = 지금 주인), 그 부모의 자녀가 배운다.
      // 플레이어의 짝 자리는 넘기지 않는다 (짝이 바뀌지 않게)
      const nextGen = !!r && !!a && a.heir === r.heir && r.heir !== cid && c.parents.includes(r.heir) && parent !== access.keep
      if (!nextGen && (a || r)) continue
      g = { ...g, heirs: { ...(g.heirs ?? {}), [parent]: { heir: cid, since: d } } }
      g = addLog(g, d, 'apprentice', [nextGen ? r!.heir : parent, cid])
    }
  }
  // 견습 한 계절 뒤: 부모는 은퇴, 자리는 자녀에게
  for (const [parent, a] of Object.entries(g.heirs ?? {})) {
    const r = g.retired?.[parent]
    // 이미 이 사람이 자리 주인이면 끝난 견습 (다음 대 견습이면 지금 주인 r.heir가 쉬고 자녀가 잇는다)
    if (!access.retirement || access.ageless || r?.heir === a.heir || (r && parent === access.keep) || d - a.since - (a.paused ?? 0) < RETIRE_AFTER) continue
    g = { ...g, retired: { ...(g.retired ?? {}), [parent]: { heir: a.heir, day: d } } }
    g = addLog(g, d, 'retired', [r ? r.heir : parent, a.heir])
  }
  // Retired parents stay beside their heirs; elder is the final growth stage.
  return g
}

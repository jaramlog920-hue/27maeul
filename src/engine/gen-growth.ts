// 주민 아이의 자람 (사용자 결정 2026-10-07): 주민 아이는 플레이어 아이와 같은 속도로 자란다(14·42·84일).
// 은퇴·견습은 없앴다 (2026-10-21 사용자) — 어른이 된 자녀는 스스로 일을 찾고(ownJob 소식), 부모 이웃은 제 자리에 그대로 있다.
// 예전 저장의 은퇴 기록은 내 연인·배우자 자리 하나만 남는다 (save.ts) — 그 자리는 이어받은 자녀가 선다(slotPerson).
import { stageByAge } from './gen-age'
import { addLog, BAKER_BABY_ID, genRng, type GenPerson, type GenState } from './gen'
import { GEN_CHILD_NAMES } from './gen-birth'
import { STAGE_AT } from './gen-config'
export { stageByAge } from './gen-age'

/** 이 이웃 자리에 지금 서 있는 사람 (은퇴했으면 이어받은 자녀, 아니면 그 이웃) */
export function slotPerson(g: GenState | undefined, npc: string): string {
  return g?.retired?.[npc]?.heir ?? npc
}

/** 사람 → 그 사람이 서 있는 이웃 자리 (부모 자리를 이어받은 자녀면 부모의 자리, 아니면 자기 id) — 2026-10-08 버그 22-C */
export function slotOfPerson(g: GenState | undefined, pid: string): string {
  for (const [npc, r] of Object.entries(g?.retired ?? {})) if (r.heir === pid) return npc
  return pid
}

/** 주민이 나이 들지 않음 설정: 어른이 된 뒤 지난 날을 멈춘 날로 쌓는다 (아이는 그대로 자란다) */
export function pauseResidentAging(g: GenState, day: number, starting = false): GenState {
  for (const p of Object.values(g.persons)) {
    if ((p.origin !== 'born' && p.id !== BAKER_BABY_ID) || p.born == null || p.stage === 'elder') continue
    const adultDay = p.born + STAGE_AT.adult
    if (day < adultDay || (p.agePause && day <= p.agePause.at)) continue
    const days = (p.agePause?.days ?? 0) + (starting ? 0 : Math.max(0, day - Math.max(adultDay, p.agePause?.at ?? adultDay)))
    g = { ...g, persons: { ...g.persons, [p.id]: { ...p, agePause: { days, at: day } } } }
  }
  return g
}
/** 은퇴한 이웃 자리의 주인으로 보이는 사람 (이어받은 자녀) — 이사 여부와 상관없이. 은퇴 전이면 null (2026-10-11 사용자 결정) */
export function slotHeir(g: GenState | undefined, npc: string): GenPerson | null {
  const r = g?.retired?.[npc]
  return r ? (g!.persons[r.heir] ?? null) : null
}

/**
 * 하루 정산: 자라기 (예전 저장의 '이사 간' 표식은 불러올 때 버린다 — gen.sanitizeGen).
 * ageless (2026-10-13 사용자 설정 '주민이 나이 들지 않음'): 자식은 어른까지만 자란다
 */
export function settleGrowth(g: GenState, d: number, access: { ageless?: boolean; ownJobs?: boolean } = {}): GenState {
  if (access.ageless) g = pauseResidentAging(g, d)
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
  return g
}

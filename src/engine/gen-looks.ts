// 세대교체 그림용 (순수 함수): 은퇴한 이웃 자리의 자녀 모습, 이웃 곁에 함께 있는 가족.
import { withLookDefaults, type FullAvatar } from './avatar'
import { bakerBabyAt, BAKER_BABY_ID, type GenPerson, type GenState } from './gen'

/** 태어난 주민의 외형 — 부모 조합값 + 모습 + 이름 */
export function genAvatar(p: GenPerson): FullAvatar {
  const a = p.avatar ?? {}
  const pick = (k: string) => (Number.isInteger(a[k]) ? { [k]: a[k] } : {})
  return withLookDefaults({ look: p.look ?? 'f', name: p.name ?? '', ...pick('skin'), ...pick('hairFront'), ...pick('hairBack'), ...pick('top'), ...pick('bottom'), ...(p.hair ? { hairColor: p.hair } : {}) })
}

/** 아이를 곁에 데리고 다니는 부모 한 사람 (집 주인 쪽 먼저) — 둘 다 그려 겹치지 않게 */
function mainParent(g: GenState, p: GenPerson): string | null {
  const slotOf = (id: string, seen = new Set<string>()): string[] => {
    if (seen.has(id)) return []
    seen.add(id)
    const slot = Object.entries(g.retired ?? {}).find(([, r]) => r.heir === id)?.[0]
    if (slot) return slotOf(slot, seen)
    const parent = g.persons[id]
    if (parent?.origin === 'fixed') return [parent.npc ?? id]
    return (parent?.parents ?? []).flatMap((ancestor) => slotOf(ancestor, new Set(seen)))
  }
  const slots = [...new Set(p.parents.flatMap((id) => slotOf(id)))]
  if (!slots.length) return null
  const home = p.household ? g.households[p.household]?.home : undefined
  const atHome = home ? slots.filter((slot) => slot === home || g.persons[slot]?.parents.includes(home)) : []
  return (atHome.length ? atHome : slots).sort()[0]
}

export interface Companion {
  person: GenPerson
  /** 아이·십 대는 작게 */
  short: boolean
  /** 은퇴한 부모 (그 이웃의 원래 모습을 나이 든 모습으로 그린다) — 이어받은 자녀가 자리 주인일 때 */
  retiredParent?: string
}

/**
 * 이 이웃 곁에 함께 있는 가족 (최대 둘): 견습 중인 자녀 또는 은퇴한 부모, 걷는 아이·십 대 자녀.
 * 은퇴한 뒤에는 이어받은 자녀가 그 자리 주인(본 그림)이고, 은퇴한 부모가 곁에 나이 든 모습으로 선다 (2026-10-11 사용자 결정).
 */
export function companionsOf(g: GenState | undefined, npc: string, day?: number): Companion[] {
  const out: Companion[] = []
  const baby = day == null ? g?.persons[BAKER_BABY_ID] : bakerBabyAt(day, g?.persons[BAKER_BABY_ID])
  if (npc === 'baker' && baby && baby.stage !== 'baby') out.push({ person: baby, short: baby.stage === 'child' || baby.stage === 'teen' })
  if (!g) return out
  const heir = g.retired?.[npc]?.heir ?? g.heirs?.[npc]?.heir
  // 이사 간 옛 저장은 부모가 떠났으므로 곁에도 없다. 은퇴 전 견습 중이면 견습 자녀가 곁에
  const retired = g.retired?.[npc]
  const parent = g.persons[npc]
  if (retired) {
    if (retired.moved == null && parent) out.push({ person: parent, short: false, retiredParent: npc })
  } else if (heir && g.persons[heir]) out.push({ person: g.persons[heir], short: false })
  for (const p of Object.values(g.persons).sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (out.length >= 2) break
    if (p.origin !== 'born' || p.id === heir || out.some((c) => c.person.id === p.id) || mainParent(g, p) !== npc) continue
    if (p.stage === 'baby') continue
    out.push({ person: p, short: p.stage === 'child' || p.stage === 'teen' })
  }
  return out
}

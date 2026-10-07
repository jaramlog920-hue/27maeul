// 세대교체 그림용 (순수 함수): 은퇴한 이웃 자리의 자녀 모습, 이웃 곁에 함께 있는 가족.
import { withLookDefaults, type FullAvatar } from './avatar'
import type { GenPerson, GenState } from './gen'

/** 태어난 주민의 외형 — 부모 조합값 + 모습 + 이름 */
export function genAvatar(p: GenPerson): FullAvatar {
  const a = p.avatar ?? {}
  const pick = (k: string) => (Number.isInteger(a[k]) ? { [k]: a[k] } : {})
  return withLookDefaults({ look: p.look ?? 'f', name: p.name ?? '', ...pick('skin'), ...pick('hairFront'), ...pick('hairBack'), ...pick('top'), ...pick('bottom') })
}

/** 아이를 곁에 데리고 다니는 부모 한 사람 (집 주인 쪽 먼저) — 둘 다 그려 겹치지 않게 */
function mainParent(g: GenState, p: GenPerson): string | null {
  const fixed = p.parents.filter((id) => g.persons[id]?.origin === 'fixed')
  if (!fixed.length) return null
  const home = p.household ? g.households[p.household]?.home : undefined
  return home && fixed.includes(home) ? home : [...fixed].sort()[0]
}

export interface Companion {
  person: GenPerson
  /** 아이·십 대는 작게 */
  short: boolean
}

/**
 * 이 이웃 곁에 함께 있는 가족 (최대 둘): 견습 중이거나 일을 이어받은 자녀, 걷는 아이·십 대 자녀.
 * 은퇴한 부모는 제자리에서 나이 든 모습으로 쉬고(elder-details), 이어받은 자녀가 곁에서 일한다.
 */
export function companionsOf(g: GenState | undefined, npc: string): Companion[] {
  if (!g) return []
  const out: Companion[] = []
  const heir = g.retired?.[npc]?.heir ?? g.heirs?.[npc]?.heir
  // 부모가 이사 간 뒤에는 자녀가 그 자리 자체라 곁에 따로 그리지 않는다
  const moved = g.retired?.[npc]?.moved != null
  if (heir && g.persons[heir] && !moved) out.push({ person: g.persons[heir], short: false })
  for (const p of Object.values(g.persons).sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (out.length >= 2) break
    if (p.origin !== 'born' || p.id === heir || mainParent(g, p) !== npc) continue
    if (p.stage === 'baby') continue
    out.push({ person: p, short: p.stage === 'child' || p.stage === 'teen' })
  }
  return out
}

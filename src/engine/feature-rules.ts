import { libraryGrowth, type GrowthState } from './progression'

type Requirement = { chapters?: number; books?: number }
/**
 * 기능이 열리는 때 (2026-10-13 사용자 결정: 권수 대신 마친 장 수 — 어떤 책을 고르든 공평하게, 생활 콘텐츠는 앞 절반에).
 * 신약은 260장. 생활 콘텐츠는 130장 안에 펼치고(결혼 90·아이 120), 뒤쪽은 세대·마무리.
 * 플레이어 연애(60장)를 주민 자율 연애(75장)보다 먼저 연다 — 고백도 하기 전에 후보가 다른 주민과 사귀지 않게.
 */
export const FEATURE_RULES = {
  decorate: { preview: { chapters: 1 }, full: { chapters: 5 } },
  mailbox: { preview: { chapters: 2 }, full: { chapters: 8 } },
  visitor: { preview: { chapters: 3 } },
  smallRequest: { preview: { chapters: 5 } },
  board: { preview: { chapters: 10 }, full: { chapters: 12 } },
  cooking: { preview: { chapters: 15 }, full: { chapters: 18 } },
  clubs: { preview: { chapters: 20 }, full: { chapters: 25 } },
  stall: { full: { chapters: 30 } },
  community: { preview: { chapters: 25 }, full: { chapters: 35 } },
  travel: { full: { chapters: 40 } },
  deepRelation: { full: { chapters: 45 } },
  suitors: { full: { chapters: 50 } },
  convenience: { full: { chapters: 55 } },
  dating: { full: { chapters: 60 } },
  library: { full: { chapters: 65 } },
  guestbook: { full: { chapters: 70 } },
  autonomy: { full: { chapters: 75 } },
  spouseRoom: { full: { chapters: 80 } },
  events: { full: { chapters: 85 } },
  marriage: { full: { chapters: 90 } },
  rank: { full: { chapters: 95 } },
  spouseLife: { full: { chapters: 100 } },
  childRoom: { full: { chapters: 110 } },
  childBirth: { full: { chapters: 120 } },
  childActivities: { full: { chapters: 130 } },
  school: { full: { chapters: 145 } },
  generations: { full: { chapters: 180 } },
  retirement: { full: { chapters: 220 } },
  ending: { full: { books: 27 } },
} satisfies Record<string, { preview?: Requirement; full?: Requirement }>
export type FeatureId = keyof typeof FEATURE_RULES
export type FeatureAccess = 'locked' | 'preview' | 'full'

export function featureAccess(s: Partial<GrowthState>, id: FeatureId): FeatureAccess {
  // 이 개편 이전 저장은 기존 행동을 계속 할 수 있다.
  if (!s.flags?.growthVersion || s.flags.growthLegacy) return 'full'
  const growth = libraryGrowth({ progress: s.progress ?? {} as GrowthState['progress'], shelved: s.shelved ?? {} })
  const meets = (r: Requirement) => growth.completedChapters >= (r.chapters ?? 0)
    && growth.completedBooks.length >= (r.books ?? 0)
  const rule: { preview?: Requirement; full?: Requirement } = FEATURE_RULES[id]
  if (rule.full && meets(rule.full)) return 'full'
  return rule.preview && meets(rule.preview) ? 'preview' : 'locked'
}

export function featureHint(id: FeatureId, full = false): string {
  const rule: { preview?: Requirement; full?: Requirement } = FEATURE_RULES[id]
  const r = (full ? rule.full : rule.preview ?? rule.full)!
  if (r.books) return `신약 ${r.books}권을 마치면 열려요.`
  return full || !rule.preview ? `신약 ${r.chapters}장을 마치면 열려요.` : `신약 ${r.chapters}장을 마치면 체험할 수 있어요.`
}

export const EARLY_MILESTONES = [
  { id: 'decorate', chapters: 1 },
  { id: 'mailbox', chapters: 2 },
  { id: 'visitor', chapters: 3 },
  { id: 'smallRequest', chapters: 5 },
  { id: 'shelf', chapters: 7 },
  { id: 'board', chapters: 10 },
  { id: 'cooking', chapters: 15 },
  { id: 'clubs', chapters: 20 },
  { id: 'community', chapters: 25 },
] as const

/** 이전 진행과 비교하므로 재필사·옛 저장의 과거 목표는 보상을 재지급하지 않는다. */
export function crossedMilestones(before: GrowthState, after: GrowthState) {
  const previous = libraryGrowth(before).completedChapters
  const current = libraryGrowth(after).completedChapters
  return EARLY_MILESTONES.filter(m => previous < m.chapters && current >= m.chapters && !after.flags[`growth:${m.id}`])
}

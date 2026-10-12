import { libraryGrowth, type GrowthState } from './progression'

type Requirement = { chapters?: number; books?: number }
export const FEATURE_RULES = {
  decorate: { preview: { chapters: 1 }, full: { books: 1 } },
  mailbox: { preview: { chapters: 2 }, full: { books: 2 } },
  visitor: { preview: { chapters: 3 } },
  smallRequest: { preview: { chapters: 5 } },
  board: { preview: { chapters: 10 }, full: { books: 3 } },
  cooking: { preview: { chapters: 15 }, full: { books: 4 } },
  clubs: { preview: { chapters: 20 }, full: { books: 5 } },
  stall: { full: { books: 6 } },
  community: { preview: { chapters: 25 }, full: { books: 7 } },
  travel: { full: { books: 8 } },
  convenience: { full: { books: 9 } },
  library: { full: { books: 10 } },
  guestbook: { full: { books: 11 } },
  rank: { full: { books: 12 } },
  events: { full: { books: 13 } },
  autonomy: { full: { books: 14 } },
  deepRelation: { full: { books: 15 } },
  suitors: { full: { books: 16 } },
  dating: { full: { books: 17 } },
  spouseRoom: { full: { books: 18 } },
  marriage: { full: { books: 19 } },
  spouseLife: { full: { books: 20 } },
  childRoom: { full: { books: 21 } },
  childBirth: { full: { books: 22 } },
  childActivities: { full: { books: 23 } },
  school: { full: { books: 24 } },
  generations: { full: { books: 25 } },
  retirement: { full: { books: 26 } },
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
  return r.chapters ? `신약 ${r.chapters}장을 마치면 체험할 수 있어요.` : `신약 ${r.books}권을 마치면 열려요.`
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

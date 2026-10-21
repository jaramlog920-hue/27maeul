import { libraryGrowth, villageBookCount, type GrowthState } from './progression'

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
  // 연애와 함께 연다 (2026-10-21 사용자: 50장엔 할 수 있는 게 없었다)
  suitors: { full: { chapters: 60 } },
  convenience: { full: { chapters: 55 } },
  dating: { full: { chapters: 60 } },
  // 서고지기는 방명록 손님을 안내하는 일이라 방명록과 함께 연다 (2026-10-21 점검: 65장에 맡겨도 70장까지 아무 일도 없었다)
  library: { full: { chapters: 70 } },
  guestbook: { full: { chapters: 70 } },
  autonomy: { full: { chapters: 75 } },
  spouseRoom: { full: { chapters: 80 } },
  events: { full: { chapters: 85 } },
  marriage: { full: { chapters: 90 } },
  rank: { full: { chapters: 95 } },
  // 결혼과 함께 연다 (2026-10-21 점검: 90–99장에 결혼하면 저녁·배우자 선물이 막혔다)
  spouseLife: { full: { chapters: 90 } },
  childRoom: { full: { chapters: 110 } },
  childBirth: { full: { chapters: 120 } },
  childActivities: { full: { chapters: 130 } },
  school: { full: { chapters: 145 } },
  generations: { full: { chapters: 180 } },
  // 220–260장에도 새로 열리는 것 (2026-10-21 사용자): 마을 기록 책 · 손주 맞이 · 마지막 열 장 · 구약 미리 보기
  villageBook: { full: { chapters: 230 } },
  grandBirth: { full: { chapters: 240 } },
  finale: { full: { chapters: 250 } },
  otPreview: { full: { chapters: 260 } },
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

/**
 * 구역(포도원·나루·벌통 들)을 여는 권 수. 나루는 여행(40장)과 함께 연다 — 배 자리가 나루 안에 있어서
 * 여행이 열렸는데 배를 못 탔다 (2026-10-21 사용자: 40장 하면 배 탈 수 있게). 나루는 4권 구역이라 4권으로 친다
 */
export const DOCK_BOOKS = 4
export function zoneBooks(s: Partial<GrowthState> & Pick<GrowthState, 'shelved'>): number {
  const books = villageBookCount(s)
  return featureAccess(s, 'travel') === 'full' ? Math.max(books, DOCK_BOOKS) : books
}

/** 다음에 열리는 기능 (마친 장 수 기준, 없으면 null) — 서고 창의 "다음" 한 줄 (2026-10-21 점검: 다음 목표가 도움말 표에만 있었다) */
export function nextUnlock(s: Partial<GrowthState>): { id: FeatureId; left: number } | null {
  const done = libraryGrowth({ progress: s.progress ?? {} as GrowthState['progress'], shelved: s.shelved ?? {} }).completedChapters
  let best: { id: FeatureId; left: number } | null = null
  for (const [id, rule] of Object.entries(FEATURE_RULES) as [FeatureId, { preview?: Requirement; full?: Requirement }][]) {
    const ch = rule.full?.chapters
    if (ch === undefined || ch <= done || rule.full?.books) continue
    if (!best || ch - done < best.left) best = { id, left: ch - done }
  }
  return best
}

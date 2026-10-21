// 생활 기능 자체를 검증하는 테스트용: 해금에 필요한 실제 완필 진행을 갖춘 상태.
import { newGame, recordProgress, type GameState } from './game'
import { BOOKS, type GameContent } from './types'
import { NT_CHAPTER_COUNTS } from './progression'
import { FEATURE_RULES, type FeatureId } from './feature-rules'

/**
 * 예전 해금표(권수)의 차례 — n번째 기능이 n권째에 열렸다. 2026-10-13 해금을 장 수로 바꾼 뒤에도
 * 테스트의 establishedGame(n)은 "예전에 n권째에 열리던 기능이 지금 기준으로 막 열린 진행"을 뜻한다.
 */
const OLD_BOOK_ORDER: readonly FeatureId[] = ['decorate', 'mailbox', 'board', 'cooking', 'clubs', 'stall', 'community', 'travel', 'convenience', 'library',
  'guestbook', 'rank', 'events', 'autonomy', 'deepRelation', 'suitors', 'dating', 'spouseRoom', 'marriage', 'spouseLife', 'childRoom', 'childBirth',
  'childActivities', 'school', 'generations',
  // 은퇴는 없앴다 (2026-10-21) — 차례 번호를 지키려고 그 자리는 다음 세대와 같은 장 수로
  'generations', 'ending']

const TOTAL = BOOKS.reduce((n, b) => n + NT_CHAPTER_COUNTS[b], 0)

/** 예전 n권째 기능이 지금 열리는 장 수 */
export function chaptersForOldBooks(count: number): number {
  if (count <= 0) return 0
  if (count >= OLD_BOOK_ORDER.length) return TOTAL
  const full = (FEATURE_RULES[OLD_BOOK_ORDER[count - 1]] as { full?: { chapters?: number } }).full
  return full?.chapters ?? TOTAL
}

/** 짧은 책부터 장을 채워 정확히 chapters장을 마친 진행 */
export function gameAtChapters(content: GameContent, chapters: number): GameState {
  const s = newGame(content)
  const order = [...BOOKS].sort((a, b) => NT_CHAPTER_COUNTS[a] - NT_CHAPTER_COUNTS[b])
  let left = chapters
  for (const book of order) {
    if (left <= 0) break
    const n = Math.min(left, NT_CHAPTER_COUNTS[book])
    s.progress[book].completed = Array.from({ length: n }, (_, i) => i + 1)
    left -= n
  }
  return recordProgress(s).state
}

export function establishedGame(content: GameContent, count = 8) {
  return gameAtChapters(content, chaptersForOldBooks(count))
}

/** 개편 이전 저장의 생활 동작을 검증하는 기존 시나리오용. */
export function legacyGame(content: GameContent, avatar?: Parameters<typeof newGame>[1]): GameState {
  const s = newGame(content, avatar)
  return { ...s, flags: { ...s.flags, growthLegacy: 1 } }
}

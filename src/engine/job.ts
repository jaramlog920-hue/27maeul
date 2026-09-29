// 직업 단계: 견습 필사가 → 마을 필사가 → 제본 장인 → 서고지기 (설계 §2.5)
// game.ts와 requests.ts가 함께 쓰므로 game.ts를 값으로 import하지 않는다.
import type { GameState } from './game'
import { GOSPELS } from './types'

export type JobLevel = 0 | 1 | 2 | 3

export function jobLevel(lettersDone: number, shelvedCount: number): JobLevel {
  if (shelvedCount >= 4) return 3
  if (lettersDone >= 30 && shelvedCount >= 2) return 2
  if (lettersDone >= 10 && shelvedCount >= 1) return 1
  return 0
}

/** 서고지기는 복음서 네 권을 꽂았을 때 — 사도행전(계획 5)은 세지 않는다 (game.ts shelvedCount와 같은 셈) */
export function jobOf(s: Pick<GameState, 'lettersDone' | 'shelved'>): JobLevel {
  return jobLevel(s.lettersDone, GOSPELS.filter((b) => s.shelved[b] !== undefined).length)
}

/** 편지 대필 기본 수고비 (반듯하면 최대 1.5배) */
export const LETTER_BASE: Record<JobLevel, number> = { 0: 12, 1: 18, 2: 24, 3: 30 }
/** 마을 필사가부터 장날에 공방 제품을 판다 */
export const SELL_FROM: JobLevel = 1
/** 제본 장인부터 표지를 만든다 */
export const COVER_FROM: JobLevel = 2

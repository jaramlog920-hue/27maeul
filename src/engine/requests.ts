// 필사 의뢰: 아침마다 문 앞 바구니에 편지 한 통. 글씨를 반듯하게 쓸수록 수고비가 는다.
// 의뢰 글은 모두 게임이 지어낸 생활 문장이다 — 성경을 베껴 주고 돈을 받지 않는다 (exclusion-list §3-3).
import { passTime, type GameState } from './game'
import { earn } from './money'
import { work } from './needs'

export const LETTER_PAY = 12
export const LETTER_MINUTES = 40

export function letterWaiting(s: Pick<GameState, 'clock' | 'letterDay'>): boolean {
  return s.letterDay !== s.clock.day
}

/** 빗나간 수가 0이면 1.5배, 넷 이상이면 기본 수고비 */
export function letterPay(misses: number): number {
  const bonus = Math.max(0, 1 - misses / 4) * 0.5
  return Math.round(LETTER_PAY * (1 + bonus))
}

export type JobLevel = 0 | 1 | 2 | 3
/** 견습 필사가 → 마을 필사가 → 제본 장인 → 서고지기 (설계 §2.5) */
export function jobLevel(lettersDone: number, shelvedCount: number): JobLevel {
  if (shelvedCount >= 4) return 3
  if (lettersDone >= 30 && shelvedCount >= 2) return 2
  if (lettersDone >= 10 && shelvedCount >= 1) return 1
  return 0
}

export function finishLetter(s: GameState, misses: number): GameState {
  if (!letterWaiting(s)) return s
  const paid = earn({ ...s, letterDay: s.clock.day, lettersDone: s.lettersDone + 1, needs: work(s.needs, 5) }, letterPay(misses))
  return passTime(paid, LETTER_MINUTES)
}

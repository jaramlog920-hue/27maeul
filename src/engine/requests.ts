// 필사 의뢰: 아침마다 문 앞 바구니에 편지 한 통. 글씨를 반듯하게 쓸수록 수고비가 는다.
// 의뢰 글은 모두 게임이 지어낸 생활 문장이다 — 성경을 베껴 주고 돈을 받지 않는다 (exclusion-list §3-3).
import { passTime, type GameState } from './game'
import { earn } from './money'
import { jobOf, LETTER_BASE, type JobLevel } from './job'
import { inGoodMood } from './mood'
import { work } from './needs'

export { jobLevel, type JobLevel } from './job'

/** LETTER_BASE[0]과 같다 — 편지 창 문구는 LETTER_BASE[jobOf(game)]를 쓴다 */
export const LETTER_PAY = LETTER_BASE[0]
export const LETTER_MINUTES = 40

export function letterWaiting(s: Pick<GameState, 'clock' | 'letterDay'>): boolean {
  return s.letterDay !== s.clock.day
}

/** 빗나간 수가 0이면 1.5배, 넷 이상이면 기본 수고비. 기본은 직업 단계마다 오른다 */
export function letterPay(misses: number, level: JobLevel = 0): number {
  const bonus = Math.max(0, 1 - misses / 4) * 0.5
  return Math.round(LETTER_BASE[level] * (1 + bonus))
}

export function finishLetter(s: GameState, misses: number): GameState {
  if (!letterWaiting(s)) return s
  const paid = earn({ ...s, letterDay: s.clock.day, lettersDone: s.lettersDone + 1, needs: work(s.needs, 5) }, letterPay(misses, jobOf(s)))
  return passTime(paid, inGoodMood(s) ? 30 : LETTER_MINUTES)
}

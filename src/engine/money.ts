// 닢 (게임 화폐 — 성경의 돈 이름은 쓰지 않는다, exclusion-list §2-2). 엮은 말씀 책은 팔지 않는다 (§3-3).
import type { GameState } from './game'

export function earn(s: GameState, n: number): GameState {
  return { ...s, coins: s.coins + Math.max(0, Math.round(n)) }
}

export function spend(s: GameState, n: number): GameState | null {
  return s.coins >= n ? { ...s, coins: s.coins - n } : null
}

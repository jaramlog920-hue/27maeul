// 마을 서고: 다 엮은 책을 꽂고, 서고 퀴즈로 책등 등급을 받는다 (설계 §2.4).
// 책은 언제나 꽂힌다 — 틀린 만큼 등급이 낮고, 틀린 구절은 다시 읽을 구절로 돌아온다.
import { bookDone } from './books'
import type { GameState } from './game'
import { has, take } from './items'
import { BOOKS, type Book, type GameContent, type ItemId } from './types'

export type Grade = 0 | 1 | 2
export const RETRY_COST: Partial<Record<ItemId, number>> = { goldLeaf: 1, oil: 1 }

/** 처음에 맞힌 문제 수 → 책등 (0~2 맨 책, 3~4 은박, 5 금박) */
export function gradeOf(correct: number): Grade {
  return correct >= 5 ? 2 : correct >= 3 ? 1 : 0
}

/** 출제 범위: 서고에 꽂힌 책 + 지금 책, 오늘 성경의 순서로 */
export function poolFor(shelved: Partial<Record<Book, Grade>>, book: Book): Book[] {
  return BOOKS.filter((b) => b === book || shelved[b] !== undefined)
}

export type ShelveBlock = 'notDone' | 'already' | null
export function canShelve(s: GameState, book: Book, content: GameContent): ShelveBlock {
  if (s.shelved[book] !== undefined) return 'already'
  if (!bookDone(s, book, content)) return 'notDone'
  return null
}

export function shelve(s: GameState, book: Book, correct: number, missed: readonly string[]): GameState {
  const before = s.shelved[book]
  const grade = gradeOf(correct)
  const shelved = { ...s.shelved, [book]: before === undefined ? grade : (Math.max(before, grade) as Grade) }
  const rereads = [...new Set([...s.rereads, ...missed])]
  const first = Object.keys(s.shelved).length === 0
  const scenes = before === undefined ? [...s.scenes, first ? 'firstShelved' : 'shelved'] : s.scenes
  return { ...s, shelved, rereads, scenes }
}

export type RetryBlock = 'notShelved' | 'gold' | 'needs' | null
export function canRetry(s: GameState, book: Book): RetryBlock {
  const g = s.shelved[book]
  if (g === undefined) return 'notShelved'
  if (g === 2) return 'gold'
  if (!has(s.inv, RETRY_COST)) return 'needs'
  return null
}

/** 재도전 비용을 먼저 낸다 (퀴즈 도중 창을 닫아도 되돌려 주지 않는다 — 등잔 기름과 같은 규칙) */
export function payRetry(s: GameState, book: Book): GameState | null {
  if (canRetry(s, book)) return null
  return { ...s, inv: take(s.inv, RETRY_COST)! }
}

export function readOff(s: GameState, pieceId: string): GameState {
  return s.rereads.includes(pieceId) ? { ...s, rereads: s.rereads.filter((id) => id !== pieceId) } : s
}

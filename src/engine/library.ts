// 마을 서고: 다 엮은 책을 꽂고, 서고 퀴즈로 책등 등급을 받는다 (설계 §2.4).
// 책은 언제나 꽂힌다 — 틀린 만큼 등급이 낮고, 틀린 구절은 다시 읽을 구절로 돌아온다.
import { actsRoomOpen, bookDone } from './books'
import type { GameState } from './game'
import { has, take } from './items'
import { BOOKS, GOSPELS, type Book, type GameContent, type ItemId } from './types'

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

// ── 복음서 방 완성 잔치 (계획 4 작업 3) ──
// flags.gospelFeast: 없음 = 아직, 1 = 잔치 날 (네 권을 다 꽂고 처음 잠든 다음 날), 2 = 잔치가 지났다.
// 잔치 뒤에도 게임은 끝나지 않는다 — 하루가 그대로 이어진다.

/** 복음서 방의 네 권이 모두 서고에 꽂혔다 */
export function gospelRoomFull(s: Pick<GameState, 'shelved'>): boolean {
  return GOSPELS.every((b) => s.shelved[b] !== undefined)
}

/** 스물일곱 권이 모두 서고에 꽂혔다 */
export function allShelved(s: Pick<GameState, 'shelved'>): boolean {
  return BOOKS.every((b) => s.shelved[b] !== undefined)
}

// ── 스물일곱 권 잔치 (계획 9 작업 5) ──
// flags.allFeast: 없음 = 아직, 1 = 잔치 날, 2 = 잔치가 지났다. 결말 화면 없이 하루가 그대로 이어진다.
/** 스물일곱 권 잔치의 조건: 요한계시록이 꽂혔고 일곱 교회 판을 다 놓았다 (순서 상관없음), 스물일곱 권 모두 꽂힘 */
export function allFeastReady(s: Pick<GameState, 'shelved' | 'flags'>): boolean {
  return s.shelved.rev !== undefined && (s.flags.churchesDone ?? 0) > 0 && allShelved(s)
}

/** 오늘이 잔치 날인가 — 복음서 방 잔치 또는 스물일곱 권 잔치 (저녁 광장 모닥불) */
export function feastToday(s: Pick<GameState, 'flags'>): boolean {
  return s.flags.gospelFeast === 1 || s.flags.allFeast === 1
}

/** 잔치 다음 날부터 서고의 첫 잠긴 문(사도행전 방)이 은은하게 빛난다 — 사도행전 방이 열린 것과 같은 판정 */
export function actsDoorGlows(s: Pick<GameState, 'flags'>): boolean {
  return actsRoomOpen(s.flags)
}

export function readOff(s: GameState, pieceId: string): GameState {
  return s.rereads.includes(pieceId) ? { ...s, rereads: s.rereads.filter((id) => id !== pieceId) } : s
}

// ── 서고 양옆 책장 ──
// 가운데 선반은 복음서 네 권. 그 뒤로 꽂는 책(사도행전·편지·요한계시록, 23권)은 제 방 선반에도 꽂히고,
// 서고 양옆 책장에도 한 권마다 책등 둘씩 늘어 점점 찬다 — 왼쪽·오른쪽을 번갈아, 위 칸부터.

/** 양옆 책장 한쪽: 책장 세 칸 × 두 단 × 한 단에 책등 넷 */
export const SIDE_SHELF = { tiles: 3, rows: 2, perRow: 4 } as const
/** 한 권마다 책등 수 */
export const SPINES_PER_BOOK = 2

export interface SideSpine {
  book: Book
  grade: Grade
  side: 'left' | 'right'
  /** 그쪽 책장의 몇째 칸 (0–2, 왼쪽에서부터) */
  tile: number
  /** 위 단 0, 아래 단 1 */
  row: number
  /** 그 칸 단에서 몇째 (0–3) */
  col: number
}

/** 양옆 책장에 보일 책등: 복음서 밖의 꽂힌 책을 성경 차례로, 한 권에 둘씩 */
export function sideShelfSpines(shelved: Partial<Record<Book, Grade>>): SideSpine[] {
  const books = BOOKS.filter((b) => !(GOSPELS as readonly Book[]).includes(b) && shelved[b] !== undefined)
  const perSide = SIDE_SHELF.tiles * SIDE_SHELF.rows * SIDE_SHELF.perRow
  const out: SideSpine[] = []
  let n = 0
  for (const book of books)
    for (let k = 0; k < SPINES_PER_BOOK; k++, n++) {
      const side = n % 2 === 0 ? 'left' : 'right'
      const i = Math.floor(n / 2)
      if (i >= perSide) return out
      const row = Math.floor(i / (SIDE_SHELF.tiles * SIDE_SHELF.perRow))
      const inRow = i % (SIDE_SHELF.tiles * SIDE_SHELF.perRow)
      out.push({ book, grade: shelved[book]!, side, tile: Math.floor(inRow / SIDE_SHELF.perRow), row, col: inRow % SIDE_SHELF.perRow })
    }
  return out
}

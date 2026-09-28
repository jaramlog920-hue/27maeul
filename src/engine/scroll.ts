// 책상에서 이야기를 차례대로(눅 1:3) 잇는 규칙. 조각 id가 lk-장-시작절이라 id 순서가 곧 본문 순서다 (verify가 id 형식을 강제).
import type { Piece } from './types'

export function canonicalOrder(pieces: readonly Piece[], chapter: number): string[] {
  return pieces
    .filter((p) => p.chapter === chapter)
    .map((p) => p.id)
    .sort()
}

export type ArrangeResult = { kind: 'missing'; missing: number } | { kind: 'wrong'; firstWrong: number } | { kind: 'done' }

export function checkArrangement(
  pieces: readonly Piece[],
  chapter: number,
  arrangement: readonly string[],
  collected: readonly string[],
): ArrangeResult {
  const canon = canonicalOrder(pieces, chapter)
  const missing = canon.filter((id) => !collected.includes(id)).length
  if (missing > 0) return { kind: 'missing', missing }
  const len = Math.max(canon.length, arrangement.length)
  for (let i = 0; i < len; i++) if (arrangement[i] !== canon[i]) return { kind: 'wrong', firstWrong: i }
  return { kind: 'done' }
}

/** index의 항목을 delta만큼 옮긴다. 범위를 벗어나면 그대로 */
export function moveItem(list: readonly string[], index: number, delta: number): string[] {
  const to = index + delta
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return [...list]
  const out = [...list]
  ;[out[index], out[to]] = [out[to], out[index]]
  return out
}

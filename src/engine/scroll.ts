// 목록 안에서 한 칸 옮기기 (카드 판 ▲▼). 예전 책상 조각 잇기 규칙은 없앴다 (필사로 바뀜 — 계획 14).

/** index의 항목을 delta만큼 옮긴다. 범위를 벗어나면 그대로 */
export function moveItem<X>(list: readonly X[], index: number, delta: number): X[] {
  const to = index + delta
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return [...list]
  const out = [...list]
  ;[out[index], out[to]] = [out[to], out[index]]
  return out
}

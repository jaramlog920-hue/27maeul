// 계획 21 R1: 필사 방식 설정 — 섞어서(기본) / 늘 직접 쓰기. 이 기기에만 저장 (copy-feel과 같은 방식)
const KEY = 'twenty-seven/copy-way'

// 저장소에 쓸 수 없는 곳에서는 이번 실행 동안 이 값을 쓴다 (2026-10-19 감사 L-50)
let memory: boolean | null = null

export function copyAlwaysWrite(): boolean {
  if (memory !== null) return memory
  try {
    return globalThis.localStorage?.getItem(KEY) === 'always'
  } catch {
    return false
  }
}

export function setCopyAlwaysWrite(on: boolean): void {
  try {
    globalThis.localStorage?.setItem(KEY, on ? 'always' : 'auto')
    memory = null
  } catch {
    /* 저장할 수 없는 곳 — 이번 실행에만 */
    memory = on
  }
}

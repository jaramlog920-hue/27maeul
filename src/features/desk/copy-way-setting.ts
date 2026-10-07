// 계획 21 R1: 필사 방식 설정 — 섞어서(기본) / 늘 직접 쓰기. 이 기기에만 저장 (copy-feel과 같은 방식)
const KEY = 'twenty-seven/copy-way'

export function copyAlwaysWrite(): boolean {
  try {
    return globalThis.localStorage?.getItem(KEY) === 'always'
  } catch {
    return false
  }
}

export function setCopyAlwaysWrite(on: boolean): void {
  try {
    globalThis.localStorage?.setItem(KEY, on ? 'always' : 'auto')
  } catch {
    /* 저장할 수 없는 곳 — 이번 실행에만 */
  }
}

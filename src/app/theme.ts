// 색 조합 (설정): 인터페이스 색만 바꾼다 — 지도 그림과 성경 본문 색은 그대로
export type ThemeId = 'olive' | 'sea' | 'vine' | 'pink'
export const THEMES: readonly ThemeId[] = ['olive', 'sea', 'vine', 'pink']
const KEY = 'twenty-seven/theme'
/** 브라우저 위쪽 막대 색 (바탕색과 같게) */
const BAR: Record<ThemeId, string> = { olive: '#1f2621', sea: '#223a4e', vine: '#241c26', pink: '#8c4f5d' }

export function loadTheme(): ThemeId {
  try {
    const v = globalThis.localStorage?.getItem(KEY)
    return (THEMES as readonly string[]).includes(v ?? '') ? (v as ThemeId) : 'olive'
  } catch {
    return 'olive'
  }
}

export function applyTheme(id: ThemeId) {
  const root = globalThis.document?.documentElement
  if (!root) return
  if (id === 'olive') delete root.dataset.theme
  else root.dataset.theme = id
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[id])
}

export function setTheme(id: ThemeId) {
  try {
    globalThis.localStorage?.setItem(KEY, id)
  } catch {
    /* 저장 불가 시에도 이번 판에는 적용 */
  }
  applyTheme(id)
}

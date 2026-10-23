// 화면 밖에 그려 둔 캔버스 모음. 휴대폰 브라우저는 앱이 뒤로 갔다 돌아오면(갤러리·다른 앱) 이 캔버스들을 비워 버리기도 한다 —
// 그대로 다시 쓰면 벽·가구·사람 없이 바닥만 남은 방이 보인다 (2026-10-23 사용자). 돌아오면 모두 비워 다음 그림에서 다시 그린다
const caches: Map<unknown, HTMLCanvasElement>[] = []

/** 앱으로 돌아올 때 비워지는 캔버스 캐시 */
export function canvasCache<K>(): Map<K, HTMLCanvasElement> {
  const m = new Map<K, HTMLCanvasElement>()
  caches.push(m as Map<unknown, HTMLCanvasElement>)
  return m
}

export function clearCanvasCaches() {
  for (const m of caches) m.clear()
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') clearCanvasCaches()
  })
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) clearCanvasCaches()
  })
}

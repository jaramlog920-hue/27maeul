// 유령 클릭 막기: 지도를 눌러 창이 열리면, 손가락을 뗄 때의 클릭이 방금 뜬 창의 단추(예: 벤치의 '성경 읽기')를 눌러 버린다.
// 지도를 누른 직후 잠깐 동안 창에 들어오는 클릭은 버린다
let lastMapTap = -Infinity

/** 지도(게임 화면)를 눌렀다 */
export function markMapTap(): void {
  lastMapTap = performance.now()
}

/** 방금 지도를 눌러서 생긴 클릭인가 */
export function isGhostClick(windowMs = 450): boolean {
  return performance.now() - lastMapTap < windowMs
}

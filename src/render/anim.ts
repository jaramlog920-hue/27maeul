// 살아 있는 몸짓의 시간 함수 (설계 2.6-2). 순수 함수라 테스트할 수 있다.

/** 멈춰 있을 때 1픽셀 오르내리는 숨 — 약 3.2초 주기, 들숨 쪽이 조금 짧다 */
export function breathOffset(t: number): 0 | 1 {
  return Math.sin((t * 2 * Math.PI) / 3.2) > 0.3 ? 1 : 0
}

/** 약 4.3초마다 0.18초 눈을 감는다 */
export function isBlinking(t: number): boolean {
  return ((t % 4.3) + 4.3) % 4.3 > 4.12
}

/** 걸음 두 박자: 1 = 왼다리를 내딛음, 2 = 오른다리 (0은 서 있는 그림) */
export function walkFrame(walkTime: number): 1 | 2 {
  return Math.abs(Math.floor(walkTime * 6)) % 2 ? 2 : 1
}

/** 졸 때 고개가 천천히 끄덕인다 */
export function dozeNod(t: number): 0 | 1 {
  return (Math.abs(Math.floor(t / 1.4)) % 2) as 0 | 1
}

/** 두리번거리기: 0.8초마다 좌우 */
export function lookSide(t: number): 'left' | 'right' {
  return Math.abs(Math.floor(t / 0.8)) % 2 ? 'left' : 'right'
}

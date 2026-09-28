// 이웃과의 마음: 속으로는 점수(0~100)를 쌓고, 10점마다 하트 하나로 보인다.
// 전체 진행(한 달 남짓)에 맞춰 천천히 차오르도록 — 매일 인사하고 도와도 하트가 다 차려면 스무 날쯤 걸린다.

export const MAX_POINTS = 100
export const POINTS_PER_HEART = 10

export const GAIN = {
  talk: 2,
  help: 3,
  giftLiked: 5,
  giftPlain: 2,
  teach: 3,
  request: 6,
  dinner: 4,
} as const

export function heartsOf(points: number | undefined): number {
  return Math.floor(Math.min(MAX_POINTS, Math.max(0, points ?? 0)) / POINTS_PER_HEART)
}

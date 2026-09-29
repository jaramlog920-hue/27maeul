// 사도행전 여정 카드 (계획 5 작업 4). 순수 계산만 — 판·잇기·완성은 작업 5.
// 카드는 장 단위로 열린다: 카드 구절이 든 장을 엮으면 그 카드를 얻는다.

/** scripts/journey/ac.txt → src/content/journey.json 한 장 */
export interface JourneyCard {
  /** 본문 순서 (1부터) */
  order: number
  /** 곳 이름 — 개역한글 표기 그대로, 그 구절 본문에 글자 그대로 있다 (verify-journey) */
  place: string
  /** 곳 이름이 나오는 한 절 (예: '행 1:12') */
  ref: string
  /** 그 절이 든 장 */
  chapter: number
}

/** 엮은 장(progress.ac.completed)으로 얻은 카드 — 본문 순서대로 */
export function cardsForChapters(cards: readonly JourneyCard[], boundChapters: Iterable<number>): JourneyCard[] {
  const bound = new Set(boundChapters)
  return cards.filter((c) => bound.has(c.chapter)).sort((a, b) => a.order - b.order)
}

/** 카드가 하나라도 있는 장 */
export function journeyChapters(cards: readonly JourneyCard[]): number[] {
  return [...new Set(cards.map((c) => c.chapter))].sort((a, b) => a - b)
}

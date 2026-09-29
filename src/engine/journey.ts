// 사도행전 여정 카드 (계획 5 작업 4·5). 순수 계산만 — 게임 상태에 얹는 것은 game.ts(syncJourney·moveJourneyCard).
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

/**
 * 여정 판 (작업 5): 판에 놓인 카드 번호(order)의 차례.
 * 얻은 카드만 남기고, 새로 얻은 카드는 판 끝 가까이(끝에서 0~2칸 앞)에 끼운다 — 자리는 카드 번호로 정해져
 * 불러오기·다시 계산해도 늘 같다. 끝에만 붙이면 장을 차례로 엮는 것만으로 판이 저절로 맞아 버린다.
 */
export function placeNewCards(board: readonly number[], earned: readonly JourneyCard[]): number[] {
  const have = new Set(earned.map((c) => c.order))
  const out = [...new Set(board)].filter((o) => have.has(o))
  for (const c of [...earned].sort((a, b) => a.order - b.order)) {
    if (out.includes(c.order)) continue
    const back = (c.order * 5 + 1) % Math.min(3, out.length + 1)
    out.splice(out.length - back, 0, c.order)
  }
  return out
}

/** 판 위의 카드가 본문 순서대로인가 (앞 카드 번호 < 뒤 카드 번호) */
export function boardInOrder(board: readonly number[]): boolean {
  return board.every((o, i) => i === 0 || board[i - 1] < o)
}

/** 여정 완성: 카드가 모두(journey.json 전체) 판에 있고 본문 순서대로 */
export function journeyComplete(board: readonly number[], cards: readonly JourneyCard[]): boolean {
  if (cards.length === 0 || board.length !== cards.length) return false
  const on = new Set(board)
  return cards.every((c) => on.has(c.order)) && boardInOrder(board)
}

/** 카드가 하나라도 있는 장 */
export function journeyChapters(cards: readonly JourneyCard[]): number[] {
  return [...new Set(cards.map((c) => c.chapter))].sort((a, b) => a - b)
}

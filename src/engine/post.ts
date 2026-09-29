// 편지 나르는 이웃이 날마다 가져오는 편지 (계획 7 작업 2, 설계 §7-2 ②).
// 편지는 조각으로 자르지 않는다 — 편지 한 통 = 한 장. 아직 받지 않은 장을 장 번호 순서대로 하루 두세 통.
import { mulberry32 } from './offers'
import type { Book, Piece } from './types'

/** 편지를 건네는 이웃 (다른 이웃은 편지를 건네지 않는다) */
export const POSTMAN = 'postman'

/** 하루에 가져오는 편지 수: 2 또는 3 (날 씨앗) */
export function postCountOf(day: number): 2 | 3 {
  return mulberry32(day * 7919 + 4099)() < 0.5 ? 2 : 3
}

/**
 * 오늘 편지 나르는 이웃이 가져올 장 조각 id들: 그 책의 장 조각(chapters) 중 아직 받지 않은(delivered에 없는) 장을
 * 장 번호 순서대로 앞에서부터 하루 2통 또는 3통. 남은 장이 그보다 적으면 남은 것 전부 (빌레몬서 1장은 한 통에 통째로).
 */
export function postForDay(args: { day: number; book: Book; chapters: readonly Piece[]; delivered: readonly string[] }): string[] {
  const left = args.chapters
    .filter((p) => p.book === args.book && !args.delivered.includes(p.id))
    .sort((a, b) => a.chapter - b.chapter)
  return left.slice(0, postCountOf(args.day)).map((p) => p.id)
}

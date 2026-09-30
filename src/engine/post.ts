// 편지 나르는 이웃이 날마다 가져오는 편지 (계획 7 작업 2, 설계 §7-2 ②).
// 편지는 조각으로 자르지 않는다 — 편지 한 통 = 한 장. 아직 받지 않은 장을 장 번호 순서대로 하루 두세 통.
// 요한계시록(방 표 arrives 'stars')은 낮에 건네지 않고 맑은 밤 언덕 편지함에서 한두 장씩 (계획 9 작업 2, 아래 starPostFor).
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
export function postForDay(args: ChapterArgs): string[] {
  return nextChapters(args, postCountOf(args.day))
}

interface ChapterArgs {
  day: number
  book: Book
  chapters: readonly Piece[]
  delivered: readonly string[]
}

/** 그 책의 장 조각 중 아직 받지 않은 장을 장 번호 순서대로 앞에서부터 n개 */
function nextChapters(args: ChapterArgs, n: number): string[] {
  const left = args.chapters
    .filter((p) => p.book === args.book && !args.delivered.includes(p.id))
    .sort((a, b) => a.chapter - b.chapter)
  return left.slice(0, n).map((p) => p.id)
}

// ── 별 보는 밤의 편지함 (계획 9 작업 2) ──
// 요한계시록은 편지 나르는 이웃이 낮에 건네지 않는다 — 해 질 녘 언덕 벤치 곁 편지함에 넣어 두고,
// 맑은 밤 언덕에서 별을 볼 때 그 밤 몫을 꺼낸다. 궂은 밤 몫은 쌓이지 않는다 (다음 맑은 밤에 다음 장부터 그 밤 몫만).

/** 한 밤에 꺼내는 장 수: 1 또는 2 (날 씨앗 — postCountOf와 다른 곱수) */
export function starPostCountOf(day: number): 1 | 2 {
  return mulberry32(day * 6151 + 2713)() < 0.5 ? 1 : 2
}

/** 오늘 밤 편지함에서 꺼낼 장 조각 id들: 아직 받지 않은 장을 장 순서대로 1장 또는 2장 */
export function starPostFor(args: ChapterArgs): string[] {
  return nextChapters(args, starPostCountOf(args.day))
}

// 책상이 살아온 흔적 (계획 14 작업 7): 필사한 만큼 집 책상에 작은 물건이 하나씩 생긴다.
// 레벨업 표시도 숫자도 없이 그림으로만 — 이 파일은 "무엇이 놓이는가"만 정하는 순수 계산, 그리기는 renderer.
//
// 기준 (신약 개역한글 정규화 글자는 모두 약 18만 자, 한 장 평균 약 700자):
// - 책갈피 끈: 처음 한 장을 마쳤을 때
// - 쓰던 펜을 꽂은 펜꽂이: 1,000자 (장 하나 반쯤)
// - 다 쓴 종이 묶음: 5,000자부터, 20,000자·50,000자에 한 겹씩 더 두꺼워진다 (세 겹이 끝)
// - 작은 등잔(흙 등잔 몸통): 15,000자 또는 처음 한 권을 마쳤을 때
// - 덮어 둔 완성본: 한 권을 마치면 한 권, 네 권부터 두 권 포개어 (그 이상은 서고에)
// - 좋은 펜·넓은 책상(가진 사람): 각자 꾸미기 물건으로 — 좋은 펜은 종이 위에 비스듬히, 넓은 책상은 상판이 넓게(drawWideDesk)
import { count, type Inventory } from './items'
import type { CopyStats } from './copying'

export const DESK_RIBBON_CHAPTERS = 1
export const DESK_PEN_CHARS = 1_000
/** 종이 묶음이 한 겹씩 두꺼워지는 글자 수 (이 배열 길이가 가장 두꺼운 묶음) */
export const DESK_PAGES_CHARS: readonly number[] = [5_000, 20_000, 50_000]
export const DESK_LAMP_CHARS = 15_000
/** 덮어 둔 완성본이 두 권이 되는 권 수 */
export const DESK_TWO_BOOKS = 4

export interface DeskTraces {
  /** 종이 위에 늘어진 책갈피 끈 */
  ribbon: boolean
  /** 쓰던 갈대 펜을 꽂은 작은 펜꽂이 */
  penCup: boolean
  /** 다 쓴 종이 묶음 두께 0–3 */
  pages: number
  /** 불꽃 아래 흙 등잔 몸통 */
  lamp: boolean
  /** 책상 모서리에 덮어 둔 완성본 0–2 */
  books: number
  /** 좋은 펜 (가진 사람) */
  goodPen: boolean
  /** 넓은 책상 (가진 사람) — 상판이 넓어지고 물건 자리가 조금 벌어진다 */
  wideDesk: boolean
}

export const EMPTY_DESK: DeskTraces = { ribbon: false, penCup: false, pages: 0, lamp: false, books: 0, goodPen: false, wideDesk: false }

/** 지금 필사량과 가진 물건으로 책상에 놓일 것. 통계가 없으면(옛 저장) 빈 책상 */
export function deskTraces(s: { copyStats?: Partial<CopyStats> | null; inv: Inventory }): DeskTraces {
  const st = s.copyStats ?? {}
  const chars = Math.max(0, st.chars ?? 0)
  const chapters = Math.max(0, st.chapters ?? 0)
  const books = Math.max(0, st.books ?? 0)
  return {
    ribbon: chapters >= DESK_RIBBON_CHAPTERS,
    penCup: chars >= DESK_PEN_CHARS,
    pages: DESK_PAGES_CHARS.filter((n) => chars >= n).length,
    lamp: chars >= DESK_LAMP_CHARS || books >= 1,
    books: books >= DESK_TWO_BOOKS ? 2 : books >= 1 ? 1 : 0,
    goodPen: count(s.inv, 'goodPen') > 0,
    wideDesk: count(s.inv, 'wideDesk') > 0,
  }
}

// 사랑의 계명 (2026-10-14 사용자): 하나님 성품을 필사로 발견하듯, 하나님이 주신 계명도 그 장을 마치면 발견한다.
// 계명을 규칙 목록으로 늘어놓지 않고 '크고 첫째 되는 계명'을 가운데 두고 하나님 사랑·이웃 사랑 두 가지 아래 모은다.
// 신약만 (2026-10-17 사용자: 구약 추가는 취소). 데이터는 scripts/love-commands/*.txt → src/content/love-commands.json (build-love-commands.mjs가 검사).
// 발견 여부는 따로 저장하지 않고 마친 장(progress·otProgress)으로 정한다. 보상은 없다 — 기록만 남는다.
import data from '../content/love-commands.json'
import { progressOf } from './books'
import type { GameState } from './game'
import type { CopyBook } from './ot-books'

export type LoveBranch = '크고 첫째 되는 계명' | '하나님 사랑' | '이웃 사랑'
export interface LoveRecord {
  branch: LoveBranch
  ref: string
  book: CopyBook
  chapter: number
  verse: number
}

export const LOVE_BRANCHES = data.branches as readonly LoveBranch[]
export const LOVE_RECORDS = data.records as readonly LoveRecord[]

/** 그 장을 마치면 발견하는 계명 */
export function loveInChapter(book: CopyBook, chapter: number, records: readonly LoveRecord[] = LOVE_RECORDS): LoveRecord[] {
  return records.filter((r) => r.book === book && r.chapter === chapter)
}

/** 발견한 계명: 그 계명이 든 장을 마쳤는가 (신약만 — 구약 진행도 읽을 수는 있다) */
export function loveFound(s: Pick<GameState, 'progress'> & Partial<Pick<GameState, 'otProgress'>>, r: LoveRecord): boolean {
  return progressOf(s as Parameters<typeof progressOf>[0], r.book).completed.includes(r.chapter)
}

// 직업 단계: 견습 필사가 → 마을 필사가 → 제본 장인 → 서고지기 (설계 §2.5). 계획 14부터 필사한 장·권으로도 오른다
// game.ts와 requests.ts가 함께 쓰므로 game.ts를 값으로 import하지 않는다.
import type { GameState } from './game'
import { BOOKS, GOSPELS, type Book } from './types'

export type JobLevel = 0 | 1 | 2 | 3

export function jobLevel(lettersDone: number, shelvedCount: number): JobLevel {
  if (shelvedCount >= 4) return 3
  if (lettersDone >= 30 && shelvedCount >= 2) return 2
  if (lettersDone >= 10 && shelvedCount >= 1) return 1
  return 0
}

/**
 * 신약 27권의 장 수 (개역한글 본문 그대로 — job.test가 books.chaptersOf와 같은지 확인).
 * 직업 단계가 콘텐츠를 받지 않고도 "다 마친 권"을 세게 한다
 */
export const BOOK_CHAPTERS: Readonly<Record<Book, number>> = {
  mt: 28, mk: 16, lk: 24, jn: 21, ac: 28,
  rom: 16, '1co': 16, '2co': 13, gal: 6, eph: 6, php: 4, col: 4, '1th': 5, '2th': 3, '1ti': 6, '2ti': 4, tit: 3, phm: 1,
  heb: 13, jas: 5, '1pe': 5, '2pe': 3, '1jn': 5, '2jn': 1, '3jn': 1, jud: 1, rev: 22,
}

/**
 * 필사로 오르는 직업 단계 (계획 14): 마친 장 수(예전에 엮은 장 포함)와 다 마친 권 수.
 * 마을 필사가 10장, 제본 장인 40장·2권, 서고지기 80장·4권 (짧은 편지 네 권만으로 서고지기가 되지 않게 장 수도 본다)
 */
export function copyJobLevel(chapters: number, books: number): JobLevel {
  if (chapters >= 80 && books >= 4) return 3
  if (chapters >= 40 && books >= 2) return 2
  if (chapters >= 10) return 1
  return 0
}

/**
 * 지금 직업 단계: 필사로 오른 단계와 예전 셈(편지 대필 수·서고에 꽂은 복음서 수) 중 높은 것 — 옛 저장의 단계는 내려가지 않는다.
 * 예전 셈의 서고지기는 복음서 네 권을 꽂았을 때 (사도행전은 세지 않는다 — game.ts shelvedCount와 같은 셈)
 */
export function jobOf(s: Pick<GameState, 'lettersDone' | 'shelved'> & Partial<Pick<GameState, 'progress'>>): JobLevel {
  const old = jobLevel(s.lettersDone, GOSPELS.filter((b) => s.shelved[b] !== undefined).length)
  if (!s.progress) return old
  let chapters = 0
  let books = 0
  for (const b of BOOKS) {
    const n = new Set(s.progress[b]?.completed ?? []).size
    chapters += n
    if (n >= BOOK_CHAPTERS[b]) books++
  }
  return Math.max(old, copyJobLevel(chapters, books)) as JobLevel
}

/** 편지 대필 기본 수고비 (반듯하면 최대 1.5배) */
export const LETTER_BASE: Record<JobLevel, number> = { 0: 12, 1: 18, 2: 24, 3: 30 }
/** 마을 필사가부터 장날에 공방 제품을 판다 */
export const SELL_FROM: JobLevel = 1
/** 제본 장인부터 표지를 만든다 */
export const COVER_FROM: JobLevel = 2

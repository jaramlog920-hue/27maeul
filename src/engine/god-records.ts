// 하나님 기록 (계획 14): 키워드 | 근거 구절. 그 절이 든 장을 다 필사했을 때 발견한다 (쓰는 도중에는 보이지 않는다).
// 이 파일은 순수 계산 — 장을 마쳤을 때 새로 발견한 줄 고르기와 저장 정리. 데이터는 content/god-records.json (작업 3).
import { BOOKS, type Book } from './types'

/** 데이터 한 줄: 키워드 id와 근거 구절 (catalog가 구절에서 책·장을 읽어 붙인다) */
export interface GodRecordDef {
  keyword: string
  /** 예: '마 1:23' */
  ref: string
  book: Book
  chapter: number
}

/** 발견한 한 줄 — 발견한 날과 함께 게임 상태에 남는다 (말씀 탭의 하나님 기록이 읽는다) */
export interface GodFind {
  keyword: string
  ref: string
  book: Book
  chapter: number
  /** 그 장을 마친 날 */
  day: number
}

const same = (a: { keyword: string; ref: string }, b: { keyword: string; ref: string }) => a.keyword === b.keyword && a.ref === b.ref

/**
 * 이 장을 마치면 새로 발견하는 줄: 그 장의 줄 중 아직 발견하지 않은 것 (키워드와 구절이 같은 줄은 한 번만).
 * 데이터 순서 그대로
 */
export function chapterFinds(defs: readonly GodRecordDef[], known: readonly GodFind[], book: Book, chapter: number, day: number): GodFind[] {
  const out: GodFind[] = []
  for (const d of defs) {
    if (d.book !== book || d.chapter !== chapter) continue
    if (known.some((k) => same(k, d)) || out.some((k) => same(k, d))) continue
    out.push({ keyword: d.keyword, ref: d.ref, book, chapter, day })
  }
  return out
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** 저장 정리: 모양이 맞는 줄만, 같은 줄은 한 번만. 옛 저장(칸이 없던 때)은 빈 목록 */
export function sanitizeGodRecords(raw: unknown): GodFind[] {
  if (!Array.isArray(raw)) return []
  const out: GodFind[] = []
  for (const r of raw) {
    if (!isObj(r)) continue
    const { keyword, ref, book, chapter, day } = r
    if (typeof keyword !== 'string' || typeof ref !== 'string' || !keyword || !ref) continue
    if (typeof book !== 'string' || !(BOOKS as readonly string[]).includes(book)) continue
    if (!Number.isInteger(chapter) || (chapter as number) < 1 || !Number.isInteger(day) || (day as number) < 0) continue
    const find = { keyword, ref, book: book as Book, chapter: chapter as number, day: day as number }
    if (!out.some((k) => same(k, find))) out.push(find)
  }
  return out
}

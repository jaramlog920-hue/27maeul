// 하나님 기록 (계획 14): 키워드 | 근거 구절. 그 절이 든 장을 다 필사했을 때 발견한다 (쓰는 도중에는 보이지 않는다).
// 이 파일은 순수 계산 — 장을 마쳤을 때 새로 발견한 줄 고르기와 저장 정리. 데이터는 content/god-records.json (작업 3).
import { BOOKS, type Book } from './types'
import books from '../content/books.json'
import { bibleIdOf } from './shelf-rooms'

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

/** 하나님 기록은 신약의 한 절만 사용하며, 저장된 책·장과 구절이 일치해야 한다. */
export function isNtGodRecord(r: { ref: string; book: Book; chapter: number }): boolean {
  const b = books.find((b) => b.id === bibleIdOf(r.book))
  const match = /^(\S+)\s+(\d+):(\d+)$/.exec(r.ref.trim())
  return !!b && !!match && match[1] === b.abbr && Number(match[2]) === r.chapter
    && r.chapter >= 1 && r.chapter <= b.chapters && Number(match[3]) >= 1
}

const same = (a: { keyword: string; ref: string }, b: { keyword: string; ref: string }) => a.keyword === b.keyword && a.ref === b.ref

/**
 * 이 장을 마치면 새로 발견하는 줄: 그 장의 줄 중 아직 발견하지 않은 것 (키워드와 구절이 같은 줄은 한 번만).
 * 데이터 순서 그대로
 */
export function chapterFinds(defs: readonly GodRecordDef[], known: readonly GodFind[], book: Book, chapter: number, day: number): GodFind[] {
  const out: GodFind[] = []
  for (const d of defs) {
    if (d.book !== book || d.chapter !== chapter || !isNtGodRecord(d)) continue
    if (known.some((k) => same(k, d)) || out.some((k) => same(k, d))) continue
    out.push({ keyword: d.keyword, ref: d.ref, book, chapter, day })
  }
  return out
}

/**
 * 예전에 엮은 장(필사 전에 마친 장)의 하나님 기록 채우기: 마친 장마다 아직 없는 줄을 발견한 날 = day로 더한다.
 * 이미 있는 줄은 그대로 (몇 번을 불러도 같다). 기존 목록 뒤에 책 순서·장 순서·데이터 순서로
 */
export function backfillGodRecords(
  defs: readonly GodRecordDef[],
  known: readonly GodFind[],
  completed: Readonly<Record<Book, readonly number[]>>,
  day: number,
): GodFind[] {
  let out: GodFind[] = sanitizeGodRecords(known)
  for (const b of BOOKS) {
    for (const ch of [...(completed[b] ?? [])].sort((x, y) => x - y)) out = [...out, ...chapterFinds(defs, out, b, ch, day)]
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
    if (isNtGodRecord(find) && !out.some((k) => same(k, find))) out.push(find)
  }
  return out
}

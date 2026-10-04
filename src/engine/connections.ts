// 연결 — 사람·곳 (계획 14 작업 9): 필사한 곳에서 같은 사람·곳 이름을 다시 만나면 저절로 이어 보여 준다.
// 이름 목록·동명이인 구분은 데이터(scripts/connections/names.txt → content/connections.json, verify-connections가 본문과 대조).
// 이 파일은 순수 계산 — 플레이어가 필사한 절만 골라 이름마다 모은다. 저장 칸은 없다 (마친 장·이어 쓸 자리에서 매번 다시 센다),
// 그래서 옛 저장도 그대로 — 예전에 엮은 장(copy.legacy)은 progress.completed에 들어 있어 필사한 곳으로 친다.
import type { Progress } from './books'
import type { CopyState } from './copying'
import { BOOKS, type Book } from './types'

/** 이름이 나오는 한 절 */
export interface NamePlace {
  book: Book
  chapter: number
  verse: number
  /** 예: '마 4:18' */
  ref: string
}

/** 데이터 한 줄: 이름·무리·나오는 절 (catalog가 구절에서 책·장·절을 읽어 붙인다) */
export interface NameDef {
  name: string
  kind: '사람' | '곳'
  places: readonly NamePlace[]
}

/** 화면에 보이는 연결 하나: 내가 필사한 곳만 */
export interface Connection {
  name: string
  kind: '사람' | '곳'
  /** 내가 필사한 절 — 성경 순서 */
  places: NamePlace[]
  /** 그 절들이 든 책 — 성경 순서, 한 번씩 (마태복음 → … → 사도행전) */
  books: Book[]
}

/** 연결로 보이려면 서로 다른 절이 이만큼 (한 곳은 아직 "다시 만난" 것이 아니다) */
export const CONNECTION_MIN = 2

/**
 * 이 절을 필사했나: 그 장을 마쳤거나(예전에 엮은 장 포함), 지금 쓰는 장에서 이어 쓸 절보다 앞 절이면.
 * (copy.at의 verse는 다음에 쓸 절 번호 — 그보다 작은 번호의 절은 이미 적었다)
 */
export function copiedVerse(s: { progress: Progress; copy: CopyState }, book: Book, chapter: number, verse: number): boolean {
  if (s.progress[book]?.completed.includes(chapter)) return true
  const at = s.copy.at[book]
  return !!at && at.chapter === chapter && verse < at.verse
}

const bookIndex = (b: Book) => BOOKS.indexOf(b)
const byBible = (a: NamePlace, b: NamePlace) => bookIndex(a.book) - bookIndex(b.book) || a.chapter - b.chapter || a.verse - b.verse

/** 한 이름에서 내가 필사한 절 */
export function copiedPlaces(def: NameDef, s: { progress: Progress; copy: CopyState }): NamePlace[] {
  return def.places.filter((p) => copiedVerse(s, p.book, p.chapter, p.verse)).sort(byBible)
}

/**
 * 내가 필사한 곳에서 다시 만난 사람·곳: 필사한 절이 CONNECTION_MIN곳 이상인 이름만.
 * 순서: 필사한 곳이 많은 이름부터, 같으면 데이터 순서
 */
export function connectionsOf(defs: readonly NameDef[], s: { progress: Progress; copy: CopyState }, min = CONNECTION_MIN): Connection[] {
  return defs
    .map((d, i) => ({ i, places: copiedPlaces(d, s), d }))
    .filter((x) => x.places.length >= min)
    .sort((a, b) => b.places.length - a.places.length || a.i - b.i)
    .map(({ d, places }) => ({ name: d.name, kind: d.kind, places, books: [...new Set(places.map((p) => p.book))] }))
}

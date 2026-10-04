// 오늘의 기록 (계획 14 작업 6): 잠들기 전 작은 일기 — 그날 필사한 장·받은 선물·새 말씀 조각·가족 일.
// 적을 게 없는 날은 일기가 없다 (null). 하지 않은 일을 적지 않는다 — 있었던 일만.
// 필사한 장과 받은 선물은 그날 그 자리에서 dayLog에 남기고, 말씀 조각은 받은 기록(pieceLog)의 날짜로,
// 가족 일은 오늘의 일지 표식(todayNotes)에서 가족 표식만 고른다.
import type { PieceLog } from './fragments'
import { BOOKS, type Book, type ItemId } from './types'

export interface DayGift {
  /** 준 사람: 이웃 id */
  from: string
  items: Partial<Record<ItemId, number>>
}

export interface DayLog {
  /** 이 기록의 날 — 오늘이 아니면 지난 기록이라 읽지 않는다 */
  day: number
  /** 그날 필사로 마친 장 ('mt:2') */
  chapters: string[]
  gifts: DayGift[]
}

export const emptyDayLog = (day: number): DayLog => ({ day, chapters: [], gifts: [] })

type WithLog = { clock: { day: number }; dayLog?: DayLog }

/** 오늘의 기록 (지난 날의 것이거나 옛 저장이면 빈 기록) */
export function logOf(s: WithLog): DayLog {
  const log = s.dayLog
  return log && log.day === s.clock.day ? log : emptyDayLog(s.clock.day)
}

/** 필사로 한 장을 마쳤다 */
export function logChapter<S extends WithLog>(s: S, book: Book, chapter: number): S {
  const log = logOf(s)
  const key = `${book}:${chapter}`
  if (log.chapters.includes(key)) return s
  return { ...s, dayLog: { ...log, chapters: [...log.chapters, key] } }
}

/** 이웃에게 선물을 받았다 (같은 이웃이면 한 줄에 모은다) */
export function logGift<S extends WithLog>(s: S, from: string, items: Partial<Record<ItemId, number>>): S {
  const entries = (Object.entries(items) as [ItemId, number][]).filter(([, n]) => n > 0)
  if (!entries.length) return s
  const log = logOf(s)
  const gifts = log.gifts.map((g) => ({ ...g, items: { ...g.items } }))
  let g = gifts.find((x) => x.from === from)
  if (!g) {
    g = { from, items: {} }
    gifts.push(g)
  }
  for (const [id, n] of entries) g.items[id] = (g.items[id] ?? 0) + n
  return { ...s, dayLog: { ...log, gifts } }
}

/**
 * 가족 일로 적는 일지 표식: 내 아이(태어남·걸음·심부름·어른이 됨·편지와 선물), 동반 동물, 배우자와의 혼인·나들이.
 * 이웃 아이(글자 배우기)·빵집 아기는 가족이 아니다
 */
const FAMILY_NOTE = /^(childBorn|childWalks|childHelps|childStays|childLeaves|kidMail:|childHelp:|companionJoined|wedding:|dateTea$|dateSunset$|dateWalk$|date:)/

export const isFamilyNote = (note: string): boolean => FAMILY_NOTE.test(note)

export interface Diary {
  /** 필사한 장 — 책 순서(신약 순서), 장 번호 순서 */
  chapters: { book: Book; chapters: number[] }[]
  gifts: DayGift[]
  /** 오늘 받은 말씀 조각 id */
  pieces: string[]
  /** 가족 일 (일지 표식 id, 일어난 차례) */
  family: string[]
}

/** 잠들기 전 오늘의 기록. 적을 것이 하나도 없으면 null (일기가 뜨지 않는다) */
export function todayDiary(s: WithLog & { pieceLog?: PieceLog; todayNotes: readonly string[] }): Diary | null {
  const log = logOf(s)
  const byBook = new Map<Book, number[]>()
  for (const key of log.chapters) {
    const [b, c] = key.split(':')
    const n = Number(c)
    if (!(BOOKS as readonly string[]).includes(b) || !Number.isInteger(n)) continue
    byBook.set(b as Book, [...(byBook.get(b as Book) ?? []), n])
  }
  const chapters = BOOKS.filter((b) => byBook.has(b)).map((book) => ({ book, chapters: [...new Set(byBook.get(book)!)].sort((x, y) => x - y) }))
  const pieces = Object.entries(s.pieceLog ?? {})
    .filter(([, got]) => got.day === s.clock.day)
    .map(([id]) => id)
    .sort()
  const family = [...new Set(s.todayNotes.filter(isFamilyNote))]
  const gifts = log.gifts.filter((g) => Object.values(g.items).some((n) => (n ?? 0) > 0))
  if (!chapters.length && !gifts.length && !pieces.length && !family.length) return null
  return { chapters, gifts, pieces, family }
}

// ── 저장 정리 (save.ts) ──

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** 모양이 맞는 것만 남긴다. 옛 저장(칸이 없던 때)은 오늘의 빈 기록 */
export function sanitizeDayLog(raw: unknown, day: number): DayLog {
  if (!isObj(raw) || typeof raw.day !== 'number' || !Number.isInteger(raw.day)) return emptyDayLog(day)
  const chapters = Array.isArray(raw.chapters) ? [...new Set(raw.chapters.filter((c): c is string => typeof c === 'string' && /^[a-z0-9]+:\d+$/.test(c)))] : []
  const gifts: DayGift[] = []
  if (Array.isArray(raw.gifts))
    for (const g of raw.gifts) {
      if (!isObj(g) || typeof g.from !== 'string' || !isObj(g.items)) continue
      const items = Object.fromEntries(Object.entries(g.items).filter(([, n]) => Number.isInteger(n) && (n as number) > 0)) as Partial<Record<ItemId, number>>
      if (Object.keys(items).length) gifts.push({ from: g.from, items })
    }
  return { day: raw.day, chapters, gifts }
}

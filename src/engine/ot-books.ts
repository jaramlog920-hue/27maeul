// 구약 책 표 (계획 20 작업 1, 결정 D1·D11). 개신교 구약 39권·개역한글·표준 순서·929장.
// 신약 `Book`·`BOOKS`(types.ts)는 건드리지 않는다 — 구약은 따로 `OtBook`·`OT_BOOKS`이고,
// 필사 엔진만 `CopyBook = Book | OtBook`으로 키를 넓힌다. 서고·퀴즈·제본·하나님 기록은 신약 전용으로 남는다.
// 노드 스크립트(build-ot·verify-ot)도 이 파일을 그대로 읽는다 — 그래서 값(런타임) import가 없다(타입만).
import type { Book } from './types'

export interface OtBookRow {
  /** 소문자 세 글자 (신약 책 id와 겹치지 않는다) */
  id: string
  /** 한글 책 이름 */
  name: string
  /** 개역한글 약칭 (신약 약칭과 겹치지 않는다) */
  abbr: string
  chapters: number
}

/** 표준 순서 (창세기 → 말라기). 순번(1..39)이 곧 개역한글 원본 폴더 번호다. */
export const OT_BOOK_TABLE = [
  { id: 'gen', name: '창세기', abbr: '창', chapters: 50 },
  { id: 'exo', name: '출애굽기', abbr: '출', chapters: 40 },
  { id: 'lev', name: '레위기', abbr: '레', chapters: 27 },
  { id: 'num', name: '민수기', abbr: '민', chapters: 36 },
  { id: 'deu', name: '신명기', abbr: '신', chapters: 34 },
  { id: 'jos', name: '여호수아', abbr: '수', chapters: 24 },
  { id: 'jdg', name: '사사기', abbr: '삿', chapters: 21 },
  { id: 'rut', name: '룻기', abbr: '룻', chapters: 4 },
  { id: '1sa', name: '사무엘상', abbr: '삼상', chapters: 31 },
  { id: '2sa', name: '사무엘하', abbr: '삼하', chapters: 24 },
  { id: '1ki', name: '열왕기상', abbr: '왕상', chapters: 22 },
  { id: '2ki', name: '열왕기하', abbr: '왕하', chapters: 25 },
  { id: '1ch', name: '역대상', abbr: '대상', chapters: 29 },
  { id: '2ch', name: '역대하', abbr: '대하', chapters: 36 },
  { id: 'ezr', name: '에스라', abbr: '스', chapters: 10 },
  { id: 'neh', name: '느헤미야', abbr: '느', chapters: 13 },
  { id: 'est', name: '에스더', abbr: '에', chapters: 10 },
  { id: 'job', name: '욥기', abbr: '욥', chapters: 42 },
  { id: 'psa', name: '시편', abbr: '시', chapters: 150 },
  { id: 'pro', name: '잠언', abbr: '잠', chapters: 31 },
  { id: 'ecc', name: '전도서', abbr: '전', chapters: 12 },
  { id: 'sng', name: '아가', abbr: '아', chapters: 8 },
  { id: 'isa', name: '이사야', abbr: '사', chapters: 66 },
  { id: 'jer', name: '예레미야', abbr: '렘', chapters: 52 },
  { id: 'lam', name: '예레미야애가', abbr: '애', chapters: 5 },
  { id: 'ezk', name: '에스겔', abbr: '겔', chapters: 48 },
  { id: 'dan', name: '다니엘', abbr: '단', chapters: 12 },
  { id: 'hos', name: '호세아', abbr: '호', chapters: 14 },
  { id: 'jol', name: '요엘', abbr: '욜', chapters: 3 },
  { id: 'amo', name: '아모스', abbr: '암', chapters: 9 },
  { id: 'oba', name: '오바댜', abbr: '옵', chapters: 1 },
  { id: 'jon', name: '요나', abbr: '욘', chapters: 4 },
  { id: 'mic', name: '미가', abbr: '미', chapters: 7 },
  { id: 'nam', name: '나훔', abbr: '나', chapters: 3 },
  { id: 'hab', name: '하박국', abbr: '합', chapters: 3 },
  { id: 'zep', name: '스바냐', abbr: '습', chapters: 3 },
  { id: 'hag', name: '학개', abbr: '학', chapters: 2 },
  { id: 'zec', name: '스가랴', abbr: '슥', chapters: 14 },
  { id: 'mal', name: '말라기', abbr: '말', chapters: 4 },
] as const satisfies readonly OtBookRow[]

export type OtBook = (typeof OT_BOOK_TABLE)[number]['id']
/** 구약 필사 엔진의 책 키: 신약 27권 + 구약 39권 */
export type CopyBook = Book | OtBook

export const OT_BOOKS: readonly OtBook[] = OT_BOOK_TABLE.map((r) => r.id)

const OT_SET: ReadonlySet<string> = new Set(OT_BOOKS)

export function isOtBook(b: unknown): b is OtBook {
  return typeof b === 'string' && OT_SET.has(b)
}

export function testamentOf(b: CopyBook): 'ot' | 'nt' {
  return isOtBook(b) ? 'ot' : 'nt'
}

const ROW_OF: ReadonlyMap<string, OtBookRow> = new Map(OT_BOOK_TABLE.map((r) => [r.id, r]))

export function otRow(b: OtBook): OtBookRow {
  return ROW_OF.get(b)!
}

/** 장을 부르는 단위: 시편은 "편", 나머지는 "장" (신약 포함) */
export const chapterUnit = (b: string): string => (b === 'psa' ? '편' : '장')

/** 사람에게 보이는 장 이름: "29편" · "3장" */
export const otChapterLabel = (book: string, n: number): string => `${n}${chapterUnit(book)}`

/** 구약 순서(0..38), 구약이 아니면 -1 */
export function otIndex(b: string): number {
  return OT_BOOKS.indexOf(b as OtBook)
}

export type OtRoomId = 'law' | 'history' | 'poetry' | 'prophets'
export interface OtRoom {
  /** 내부 id (화면에 보이지 않는다 — 분류 이름은 화면에 쓰지 않는다, D11) */
  id: OtRoomId
  /** 화면 이름 = 책 범위 */
  label: string
  books: readonly OtBook[]
}

const range = (from: OtBook, to: OtBook): OtBook[] => OT_BOOKS.slice(OT_BOOKS.indexOf(from), OT_BOOKS.indexOf(to) + 1)

/** D11: 방 이름은 책 범위. "율법서·역사서·시가서·예언서" 같은 분류 이름은 쓰지 않는다(신약 §3-2와 같은 까닭). */
export const OT_ROOMS: readonly OtRoom[] = [
  { id: 'law', label: '창세기–신명기', books: range('gen', 'deu') },
  { id: 'history', label: '여호수아–에스더', books: range('jos', 'est') },
  { id: 'poetry', label: '욥기–아가', books: range('job', 'sng') },
  { id: 'prophets', label: '이사야–말라기', books: range('isa', 'mal') },
]

/** 그 책이 들어 있는 방 */
export function otRoomOf(book: OtBook): OtRoom {
  return OT_ROOMS.find((r) => r.books.includes(book))!
}

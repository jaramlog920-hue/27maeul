// 콘텐츠 데이터의 단일 입구. 성경 문장은 versesOf로만 꺼낸다 (exclusion-list §0).
// 앱은 서고 방 표(shelf-rooms)의 책만 싣는다 (scripts/build-bible-subset.mjs, verify가 원본과 같은지 확인)
import raw from './bible-subset.json'
import books from './books.json'
import piecesRaw from './pieces.json'
import neighborsRaw from './neighbors.json'
import journeyRaw from './journey.json'
import churchesRaw from './churches.json'
import lettersRaw from './letters.json'
import peopleRaw from './people.json'
import godRecordsRaw from './god-records.json'
import connectionsRaw from './connections.json'
import guidesRaw from './chapter-guides.json'
import type { GodRecordDef } from '../engine/god-records'
import type { NameDef } from '../engine/connections'
import { setPeopleData, type PeopleData } from '../engine/people'
import { expandRef, countsFrom } from './ref'
import { BOOKS, LETTERS, type Book, type GameContent, type NeighborDef, type Piece } from '../engine/types'
import { bibleIdOf } from '../engine/shelf-rooms'
import type { LetterOpening, Question, QuizSource } from '../engine/quiz'
import type { JourneyCard } from '../engine/journey'
import type { CopySource } from '../engine/copy'

const bible = raw as Record<string, string[][]>
const byAbbr = Object.fromEntries(books.map((b) => [b.abbr, b.id]))
const counts = countsFrom(bible)

// ── 책 id ↔ 본문 책 id·약어 (books.json에서 읽는다) ──
const bookInfo = (b: Book) => {
  const info = books.find((x) => x.id === bibleIdOf(b))
  if (!info) throw new Error(`books.json에 없는 책 ${b}`)
  return info
}
export const BOOK_ABBR = Object.fromEntries(BOOKS.map((b) => [b, bookInfo(b).abbr])) as Record<Book, string>
const BOOK_IDS = Object.fromEntries(BOOKS.map((b) => [b, bibleIdOf(b)])) as Record<Book, string>
const ABBR_BOOK: Record<string, Book> = Object.fromEntries(BOOKS.map((b) => [BOOK_ABBR[b], b]))

/**
 * 편지의 "장 조각" (계획 7): 편지는 조각으로 자르지 않는다 — 장 하나에 조각 하나를 본문에서 기계적으로 만든다.
 * 끝 절 번호는 본문 배열 길이 ('(없음)' 절이 있어도 번호는 걸친다 — 보이는 것은 versesOf가 거른다).
 * 제목은 책 이름 + 장 번호뿐 (해석 라벨도 본문 문장도 아니다). pieces.json·verify-pieces의 덮기 규칙에는 넣지 않는다
 */
function chapterPieces(bs: readonly Book[]): Piece[] {
  return bs.flatMap((b) =>
    (bible[BOOK_IDS[b]] ?? []).map((verses, i) => ({
      id: `${b}-${String(i + 1).padStart(3, '0')}`,
      book: b,
      ref: `${BOOK_ABBR[b]} ${i + 1}:1-${verses.length}`,
      chapter: i + 1,
      title: `${bookInfo(b).name} ${i + 1}장`,
      stamps: [],
    })),
  )
}
export const LETTER_PIECES: readonly Piece[] = chapterPieces(LETTERS)
/** 요한계시록의 장 조각 (계획 9): 편지와 같은 규칙 — 장 하나에 조각 하나 */
export const REV_PIECES: readonly Piece[] = chapterPieces(['rev'])

/** 모든 책의 조각: pieces.json(복음서·사도행전) + 편지 장 조각 + 요한계시록 장 조각 */
const ALL_PIECES: Piece[] = [...(piecesRaw as unknown as Piece[]), ...LETTER_PIECES, ...REV_PIECES]
/** 엔진과 화면이 쓰는 조각 — 모든 책 (책별로는 piecesOf) */
export const PIECES = ALL_PIECES
export const NEIGHBORS = neighborsRaw as unknown as NeighborDef[]
/** 사도행전 여정 카드 — 본문 순서 (scripts/journey/ac.txt, verify-journey가 본문과 대조) */
export const JOURNEY = journeyRaw as JourneyCard[]
/**
 * 요한계시록 일곱 교회 카드 — 본문 순서 (scripts/journey/rev.txt → churches.json, verify-journey가 그 절에
 * "{이름} 교회의 사자에게"가 글자 그대로 있는지 대조). 카드에는 곳 이름만 (계획 9 작업 3, exclusion §4-7)
 */
export const CHURCHES = churchesRaw as JourneyCard[]
/**
 * 편지 첫머리의 보낸 이·받는 곳·받는 사람 (scripts/letters/opening.txt → letters.json, verify-letters가 이름이 그 구절 본문에
 * 글자 그대로 있는지 확인). 편지 서고 퀴즈의 첫머리 문제가 읽는다 (계획 7 작업 6)
 */
export const LETTER_OPENINGS = lettersRaw as unknown as readonly LetterOpening[]

/**
 * 하나님 기록 (계획 14 작업 3 데이터, scripts/god-records → god-records.json, verify-god-records가 본문과 대조).
 * json의 book은 본문 책 id(mat·jhn…)라 게임 책 id는 구절의 약어에서 다시 읽는다
 */
const godRaw = godRecordsRaw as { keywords: { id: string; name: string; group: string }[]; records: { keyword: string; ref: string; chapter: number }[] }
export const GOD_RECORDS: readonly GodRecordDef[] = godRaw.records.map((r) => {
  const book = ABBR_BOOK[r.ref.trim().split(/\s+/)[0]]
  if (!book) throw new Error(`하나님 기록의 책을 모름: ${r.ref}`)
  return { keyword: r.keyword, ref: r.ref, book, chapter: r.chapter }
})
/** 키워드 id → 화면 이름 (사랑·거룩하심…) */
export const GOD_KEYWORDS: Readonly<Record<string, { name: string; group: string }>> = Object.fromEntries(godRaw.keywords.map((k) => [k.id, { name: k.name, group: k.group }]))

/**
 * 연결 — 사람·곳 (계획 14 작업 9 데이터, scripts/connections/names.txt → connections.json, verify-connections가 본문과 대조).
 * 구절에서 게임 책 id·장·절을 읽어 붙인다
 */
const namesRaw = connectionsRaw as { names: { name: string; kind: string; refs: string[] }[] }
export const NAMES: readonly NameDef[] = namesRaw.names.map((n) => {
  if (n.kind !== '사람' && n.kind !== '곳') throw new Error(`연결의 무리를 모름: ${n.name} ${n.kind}`)
  return {
    name: n.name,
    kind: n.kind,
    places: n.refs.map((ref) => {
      const m = ref.match(/^(\S+) (\d+):(\d+)$/)
      const book = m ? ABBR_BOOK[m[1]] : undefined
      if (!m || !book) throw new Error(`연결의 구절을 모름: ${n.name} ${ref}`)
      return { book, chapter: Number(m[2]), verse: Number(m[3]), ref }
    }),
  }
})

export const CONTENT: GameContent = {
  pieces: PIECES,
  neighbors: NEIGHBORS,
  journey: JOURNEY,
  churches: CHURCHES,
  copy: (b) => copySourceFor(b),
  chapterText: (b, c) => chapterText(b, c),
  godRecords: GOD_RECORDS,
}

export interface Verse {
  chapter: number
  verse: number
  text: string
}

/** 절 번호만 있고 제 본문이 없는 절: '(없음)', 앞 절에 합쳐 번역된 '(25절에 포함되어 있음)'(행 15:26) */
export const noText = (text: string) => text === '(없음)' || /^\(\d+절에 포함되어 있음\)$/.test(text)

export function versesOf(ref: string): Verse[] {
  return expandRef(ref, byAbbr, counts)
    .map((k) => {
      const text = bible[k.bookId]?.[k.chapter - 1]?.[k.verse - 1]
      if (text === undefined) throw new Error(`no verse ${ref} ${k.chapter}:${k.verse}`)
      return { chapter: k.chapter, verse: k.verse, text }
    })
    .filter((v) => !noText(v.text)) // 본문이 없는 절 — 어디에도 보이지 않는다
}

/**
 * 필사할 한 장의 본문 (계획 14): 그 장 1절부터 끝 절까지 versesOf로 — 본문이 없는 절은 빠진다 (번호만 건너뜀).
 * 장이 없으면 빈 목록
 */
export function chapterText(book: Book, chapter: number): Verse[] {
  const n = bible[BOOK_IDS[book]]?.[chapter - 1]?.length ?? 0
  return n ? versesOf(`${BOOK_ABBR[book]} ${chapter}:1-${n}`) : []
}

/** 장별 필사 길잡이 (scripts/chapter-guides/*.txt → chapter-guides.json): 본문을 바탕으로 쓴 설명 — 성경 본문 인용이 아니다 */
export interface ChapterGuide {
  /** 말씀의 배경 */
  background: string
  /** 필사하며 살펴보기 */
  look: string
}
const guides = guidesRaw as Record<string, Record<string, ChapterGuide>>
/** 그 장의 길잡이 (장 전체에서 같은 길잡이). 없으면 null */
export function chapterGuide(book: Book, chapter: number): ChapterGuide | null {
  return guides[BOOK_IDS[book]]?.[String(chapter)] ?? null
}

/** 본문에서 보기의 한 절: 조각에 든 절이면 inPiece */
export interface ContextVerse extends Verse {
  inPiece: boolean
}

/**
 * 말씀 탭 [본문에서 보기] (계획 14 작업 5): 조각 구간과 그 앞뒤 around절씩 (조각이 걸친 장 안에서, 본문이 없는 절은 빠진다).
 * 장 하나 통째인 조각(편지 책·요한계시록)은 그 장 그대로
 */
export function contextOf(ref: string, around = 3): ContextVerse[] {
  const book = bookOfRef(ref)
  const inner = versesOf(ref)
  if (!inner.length) return []
  const keys = new Set(inner.map((v) => `${v.chapter}:${v.verse}`))
  const all = [...new Set(inner.map((v) => v.chapter))].flatMap((c) => chapterText(book, c))
  const at = (v: Verse) => all.findIndex((x) => x.chapter === v.chapter && x.verse === v.verse)
  const from = Math.max(0, at(inner[0]) - around)
  const to = at(inner[inner.length - 1]) + around + 1
  return all.slice(from, to).map((v) => ({ ...v, inPiece: keys.has(`${v.chapter}:${v.verse}`) }))
}

const pieceMap = new Map(PIECES.map((p) => [p.id, p]))
export function pieceById(id: string): Piece {
  const p = pieceMap.get(id)
  if (!p) throw new Error(`unknown piece ${id}`)
  return p
}

export function neighborById(id: string): NeighborDef | undefined {
  return NEIGHBORS.find((n) => n.id === id)
}

// ── 책별 조각과 퀴즈의 본문 ──
const byBook = new Map<Book, Piece[]>(BOOKS.map((b) => [b, ALL_PIECES.filter((p) => p.book === b)]))
export function piecesOf(book: Book): Piece[] {
  return byBook.get(book) ?? []
}
/** 조각이 들어 있는 책 (사도행전은 조각을 넣기 전까지 빠진다) */
export const BOOKS_WITH_CONTENT: readonly Book[] = BOOKS.filter((b) => piecesOf(b).length > 0)

/** 띄어쓰기와 문장부호를 떼고 비교한다 — 띄어쓰기만 다른 같은 문장을 다른 문장으로 세지 않도록 */
const quizKey = (s: string) => s.replace(/[\s,.!?]+/g, '')
const verseCounts = new Map<Book, Map<string, number>>()
for (const b of BOOKS) {
  const m = new Map<string, number>()
  for (const ch of bible[BOOK_IDS[b]] ?? []) for (const v of ch) m.set(quizKey(v), (m.get(quizKey(v)) ?? 0) + 1)
  verseCounts.set(b, m)
}

const bookOfRef = (ref: string): Book => {
  const b = ABBR_BOOK[ref.trim().split(/\s+/)[0]]
  if (!b) throw new Error(`not a book ref: ${ref}`)
  return b
}

/**
 * 괄호 구간에 든 절 ('막 16:10') — 퀴즈에 쓰지 않는다.
 * 대괄호 [ … ]: 막 16:9-20·요 7:53-8:11처럼 여러 절에 걸치면 괄호 글자가 없는 가운데 절도 넣는다.
 * 둥근 괄호 ( … ): 마 6:13 송영(사본 차이 표시)과 본문 속 풀이 괄호(막 7:3-4 등). 구별하지 않고 모두 넣는다 — 퀴즈에서 빼는 쪽이 늘 안전하다.
 * 본문이 없는 절 '(없음)'은 괄호로 치지 않는다(versesOf에서 이미 감춤).
 */
const bracketed = new Set<string>()
for (const b of BOOKS) {
  let square = false
  let round = false
  ;(bible[BOOK_IDS[b]] ?? []).forEach((ch, ci) =>
    ch.forEach((text, vi) => {
      if (noText(text)) return
      if (square || round || /[[\]()]/.test(text)) bracketed.add(`${BOOK_ABBR[b]} ${ci + 1}:${vi + 1}`)
      for (const c of text) {
        if (c === '[') square = true
        else if (c === ']') square = false
        else if (c === '(') round = true
        else if (c === ')') round = false
      }
    }),
  )
}
export const inBrackets = (ref: string) => bracketed.has(ref.trim())

/** 책들 안에서 같은 문장을 가진 절의 수 */
const countIn = (books: readonly Book[], text: string) => books.reduce((n, b) => n + (verseCounts.get(b)?.get(quizKey(text)) ?? 0), 0)

/** 퀴즈가 쓰는 본문: 절마다 참조를 붙이고, 고른 책들 안에서(countVerse)·앱 본문 모든 책에서(countAnywhere) 같은 문장이 몇 번 나오는지 센다 */
export function quizSourceFor(books: readonly Book[]): QuizSource & { countAnywhere: (text: string) => number } {
  return {
    versesOf: (ref) => {
      const abbr = BOOK_ABBR[bookOfRef(ref)]
      return versesOf(ref).map((v) => {
        const r = `${abbr} ${v.chapter}:${v.verse}`
        return { ref: r, text: v.text, inBrackets: bracketed.has(r) }
      })
    },
    countVerse: (text) => countIn(books, text),
    countAnywhere: (text) => countIn(BOOKS, text),
  }
}

/** 본문에 든 모든 책에서 같은 문장 세기 (옮겨 적기의 틀린 보기 확인용) */
const allBooks = quizSourceFor(BOOKS)

/** 편지 옮겨 적기가 읽는 본문 (계획 7 작업 3): 그 책 안에서만 — 장 참조·절·같은 문장 세기(+ 모든 책에서 세기). 책마다 하나 (빈칸 기억이 이것에 붙는다) */
const copySources = new Map<Book, CopySource>()
export function copySourceFor(book: Book): CopySource {
  let src = copySources.get(book)
  if (!src) {
    src = {
      ...quizSourceFor([book]),
      countAnywhere: allBooks.countVerse,
      chapters: piecesOf(book).map((p) => ({ chapter: p.chapter, ref: p.ref })),
    }
    copySources.set(book, src)
  }
  return src
}

const verseToPiece = new Map<string, Piece>()
for (const p of ALL_PIECES) for (const v of versesOf(p.ref)) verseToPiece.set(`${BOOK_ABBR[p.book]} ${v.chapter}:${v.verse}`, p)
/** '막 1:10' → 그 절을 담은 조각 (조각은 겹치지 않으므로 하나) */
export function pieceOfVerse(ref: string): Piece | undefined {
  return verseToPiece.get(ref.trim())
}

/** 틀린 문제를 "다시 읽을 구절"로 돌리기 위해: 문제가 가리키는 조각 */
export function pieceOfQuestion(q: Question): string | null {
  if (q.kind === 'detective') return q.pieceId
  if (q.kind === 'order' || q.kind === 'verse') return q.answer
  // 먼저 나오는 구절: 앞 구절의 장 조각. 첫머리: 그 이름이 적힌 구절의 장 조각(아래 q.ref)
  if (q.kind === 'verseOrder') return pieceOfVerse(q.answer)?.id ?? null
  // "적혀 있지 않음": 범위(히 1:1-4) 첫 절의 장 조각
  if (q.kind === 'openingNone') return pieceOfVerse(q.ref.replace(/-\d+$/, ''))?.id ?? null
  return pieceOfVerse(q.ref)?.id ?? null
}

// 살아 움직이는 사람들 (계획 6b): 일과·목격·마을 사건·말·이벤트
export const PEOPLE = peopleRaw as unknown as PeopleData
setPeopleData(PEOPLE)

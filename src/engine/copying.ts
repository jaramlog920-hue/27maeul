// 필사 (계획 14 작업 1): 개역한글 본문을 한 절씩 키보드로 따라 적는다. 재료는 들지 않는다.
// 이 파일은 순수 계산만 — 대조(정규화·한글 조합 중 글자), 장의 절 목록, 이어 쓸 자리, 저장 정리.
// 게임 상태를 바꾸는 일(절 기록·장 완료)은 game.ts의 writeVerse가 이것을 써서 한다.
//
// 허용(사용자 결정 2026-10-04): 띄어쓰기 차이, 문장부호 생략, 오타 바로 고치기, 자동 저장, 나갔다 오면 그 절부터.
// 자동완성 없음 — 붙여넣기(화면이 알려 주는 표식)와 한 번에 여러 글자가 들어오는 입력은 받지 않는다.
import { chaptersOf } from './books'
import type { Progress } from './books'
import { BOOKS, type Book, type GameContent } from './types'

// ── 정규화 ──

/**
 * 대조에서 무시하는 것: 띄어쓰기(모든 공백)와 문장부호·기호 (유니코드 \p{P}·\p{S} — 개역한글 본문에 실제로 나오는
 * 것은 , . ! ( ) [ ] 뿐이지만, 입력에 들어올 수 있는 따옴표·가운뎃점·말줄임표·물결표 같은 것도 함께 거른다).
 * 남기는 것: 글자(\p{L} — 한글 음절·자모, 한자, 라틴 글자)와 숫자(\p{N}).
 */
export const COPY_IGNORED = /[\s\p{P}\p{S}]/gu

/** 대조용 글: NFC로 모은 뒤(조합형 자모가 음절로) 띄어쓰기·문장부호·기호를 뗀다 */
export function normalizeCopy(text: string): string {
  return text.normalize('NFC').replace(COPY_IGNORED, '')
}

// ── 한글 자모 나누기 (조합 중인 마지막 글자) ──

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
/** 두 번 눌러 만드는 겹모음·겹받침은 누르는 차례대로 나눈다 (ㄲ·ㅆ 같은 된소리는 한 번에 누르므로 그대로) */
const SPLIT: Record<string, string> = {
  ㅘ: 'ㅗㅏ', ㅙ: 'ㅗㅐ', ㅚ: 'ㅗㅣ', ㅝ: 'ㅜㅓ', ㅞ: 'ㅜㅔ', ㅟ: 'ㅜㅣ', ㅢ: 'ㅡㅣ',
  ㄳ: 'ㄱㅅ', ㄵ: 'ㄴㅈ', ㄶ: 'ㄴㅎ', ㄺ: 'ㄹㄱ', ㄻ: 'ㄹㅁ', ㄼ: 'ㄹㅂ', ㄽ: 'ㄹㅅ', ㄾ: 'ㄹㅌ', ㄿ: 'ㄹㅍ', ㅀ: 'ㄹㅎ', ㅄ: 'ㅂㅅ',
}
const split = (j: string) => SPLIT[j] ?? j

/** 한 글자를 누르는 차례의 자모로 ('한' → 'ㅎㅏㄴ', '왔' → 'ㅇㅗㅏㅆ', 'ㄳ' → 'ㄱㅅ'). 한글이 아니면 그 글자 그대로 */
export function jamoOf(ch: string): string {
  const code = ch.codePointAt(0) ?? 0
  if (code >= 0xac00 && code <= 0xd7a3) {
    const i = code - 0xac00
    return CHO[Math.floor(i / 588)] + split(JUNG[Math.floor((i % 588) / 28)]) + JONG[i % 28].split('').map(split).join('')
  }
  return split(ch)
}

const isHangul = (ch: string) => /[ㄱ-ㆎ가-힣]/.test(ch)

/**
 * 입력의 마지막 글자가 아직 조합 중이라 본문 글자의 앞부분인가.
 * 받침이 다음 글자의 첫소리로 넘어가는 경우('하나'를 치는 중의 '한')까지 보도록 다음 글자까지 이어 본다
 */
export function composingPrefix(last: string, targetRest: string): boolean {
  if (!isHangul(last)) return false
  const want = [...targetRest].slice(0, 2).map(jamoOf).join('')
  const got = jamoOf(last)
  return got.length > 0 && want.startsWith(got)
}

// ── 대조 ──

export interface CopyCheck {
  /** 본문(정규화) 앞에서부터 맞게 쓴 글자 수 */
  matched: number
  /** 마지막 글자가 조합 중 — 본문 matched째 글자로 맞게 가는 중 */
  composing: boolean
  /** 틀린 글자가 있다 (본문 matched째 자리) — 지우고 고치면 다시 맞는다 */
  typo: boolean
  /** 본문 글자 수 (정규화) */
  total: number
  /** 한 절을 다 맞게 썼다 */
  done: boolean
}

/** 입력이 본문과 얼마나 맞는가 (띄어쓰기·문장부호 무시, 조합 중인 마지막 글자는 맞게 가는 중으로) */
export function checkCopy(input: string, target: string): CopyCheck {
  const a = [...normalizeCopy(input)]
  const t = [...normalizeCopy(target)]
  let k = 0
  while (k < a.length && k < t.length && a[k] === t[k]) k++
  if (k === a.length) return { matched: k, composing: false, typo: false, total: t.length, done: k === t.length }
  // 틀린 곳이 입력의 마지막 글자이고 그 글자가 본문 글자의 앞부분이면 아직 조합 중
  const composing = k === a.length - 1 && k < t.length && composingPrefix(a[k], t.slice(k).join(''))
  return { matched: k, composing, typo: !composing, total: t.length, done: false }
}

/** 한 번의 입력으로 늘어날 수 있는 글자 수 (정규화). 이보다 많이 한꺼번에 들어오면서 본문과 맞지 않으면 받지 않는다 */
export const COPY_MAX_STEP = 3

/**
 * 붙여넣기·끌어 놓기·자동완성(고쳐 쓰기 제안)으로 들어오는 입력 종류 (InputEvent.inputType).
 * 이것들은 글자 수와 상관없이 받지 않는다. 키를 눌러 치는 것(insertText)·한글 조합(insertCompositionText)은 받는다
 */
export const BLOCKED_INPUT_TYPES: readonly string[] = [
  'insertFromPaste',
  'insertFromPasteAsQuotation',
  'insertFromDrop',
  'insertFromYank',
  'insertReplacementText',
]

export interface InputHow {
  /** 화면이 paste·drop 이벤트를 보았다 */
  pasted?: boolean
  /** 브라우저가 알려 준 입력 종류 (InputEvent.inputType) */
  inputType?: string
  /** 지금 쓰는 절 본문 — 있으면 한꺼번에 여러 글자가 들어와도 본문 앞부분과 맞으면 받는다 (휴대폰 키보드의 조합 확정) */
  target?: string
}

/**
 * 새 입력을 받을까:
 * - 붙여넣기 표식이 있거나 붙여넣기·끌어 놓기·자동완성 입력 종류면 앞 입력 그대로 (BLOCKED_INPUT_TYPES)
 * - 한 번에 COPY_MAX_STEP 글자까지 늘면 받는다. 지우기·고치기는 언제나 받는다
 * - 그보다 많이 늘었으면, 본문(target)의 앞부분과 맞을 때만 받는다 — 휴대폰 한글 키보드가 몇 글자를 한꺼번에 확정하는 경우.
 *   본문과 맞지 않는 뭉치(자동완성 낱말 등)는 받지 않는다
 */
export function acceptInput(prev: string, next: string, how: InputHow = {}): string {
  if (how.pasted || (how.inputType && BLOCKED_INPUT_TYPES.includes(how.inputType))) return prev
  const grew = [...normalizeCopy(next)].length - [...normalizeCopy(prev)].length
  if (grew <= COPY_MAX_STEP) return next
  return how.target !== undefined && !checkCopy(next, how.target).typo ? next : prev
}

/** 본문(원문)에서 정규화한 앞 n글자가 끝나는 자리 — 화면이 맞게 쓴 부분까지 진하게 칠할 때 쓴다 */
export function originalEnd(text: string, n: number): number {
  if (n <= 0) return 0
  let seen = 0
  let i = 0
  for (const ch of text) {
    i += ch.length
    if (normalizeCopy(ch) !== '') {
      seen++
      if (seen === n) return i
    }
  }
  return text.length
}

// ── 장의 절 ──

export interface CopyVerse {
  verse: number
  /** 본문 그대로 (개역한글) */
  text: string
  /** 대조용 정규화 글자 수 — 글자 수 통계는 이것으로 센다 */
  chars: number
}

/** 필사하는 장: 조각이 있는 장 = 서고·방이 세는 장 (books.chaptersOf와 같다 — 27권 260장) */
export function copyChapters(book: Book, content: GameContent): number[] {
  return chaptersOf(book, content)
}

/** 한 장의 필사할 절: 본문이 없는 절('(없음)'·'(…포함되어 있음)')은 빠진다 (번호만 건너뜀). 대괄호 절은 본문이므로 넣는다 */
export function copyVerses(book: Book, chapter: number, content: GameContent): CopyVerse[] {
  return (content.chapterText?.(book, chapter) ?? [])
    .map((v) => ({ verse: v.verse, text: v.text, chars: [...normalizeCopy(v.text)].length }))
    .filter((v) => v.chars > 0)
}

// ── 상태 ──

/** 한 책의 다음에 쓸 자리 (절 번호로 — 본문이 없는 절을 건너뛰어도 흔들리지 않게). draft: 쓰다 만 입력 (자동 저장) */
export interface CopyAt {
  chapter: number
  verse: number
  draft?: string
}

/** 한 책을 쓴 날 (계획 14 작업 8 — 완성본 첫 쪽): 처음 한 절을 적은 날, 마지막 장을 필사로 마친 날 */
export interface BookDays {
  start: number
  end?: number
}

export interface CopyState {
  /** 책상에서 지금 쓰는 책 (처음엔 없다) — 27권 어느 책이든 고를 수 있다 */
  book: Book | null
  /** 책마다 다음에 쓸 자리 */
  at: Partial<Record<Book, CopyAt>>
  /** 필사가 생기기 전 저장에서 이미 마친 장 ("예전에 엮은 장" — 글자 수 통계에 넣지 않는다) */
  legacy: Partial<Record<Book, number[]>>
  /** 책마다 쓰기 시작한 날·마친 날 (이 칸이 생기기 전 저장은 없다 — 완성본 첫 쪽에 "남아 있지 않음") */
  days?: Partial<Record<Book, BookDays>>
}

/** 나의 필사 기록 */
export interface CopyStats {
  /** 기록한 절 수 */
  verses: number
  /** 기록한 글자 수 (본문 정규화 글자) */
  chars: number
  /** 필사로 마친 장 수 (예전에 엮은 장은 빼고) */
  chapters: number
  /** 필사로 마친 권 수 (마지막 장을 필사로 마친 책) */
  books: number
  /** 처음 한 절을 기록한 날 */
  firstDay: number | null
}

export const NO_COPY: CopyState = { book: null, at: {}, legacy: {} }
export const NO_COPY_STATS: CopyStats = { verses: 0, chars: 0, chapters: 0, books: 0, firstDay: null }

/** 장 하나를 마치면 쌓이는 경험치 — 지능·손재주 하나씩 (능력치 점수 1–100으로 약 +1, 단계 효과는 그대로) */
export const COPY_CHAPTER_XP = 4.5

export interface CopySpot {
  chapter: number
  /** 그 장의 필사할 절 중 몇째 (0부터) */
  index: number
  verse: CopyVerse
  /** 그 장의 필사할 절 수 */
  count: number
  draft: string
}

/** 아직 마치지 않은 장 중 from 이상 첫 장 (없으면 앞에서부터 다시) */
function openChapter(book: Book, completed: readonly number[], content: GameContent, from = 0): number | null {
  const open = copyChapters(book, content).filter((c) => !completed.includes(c))
  return open.find((c) => c >= from) ?? open[0] ?? null
}

/**
 * 이 책에서 다음에 쓸 절. 저장된 자리가 있으면 그 절부터(그 절이 본문 없는 절이면 다음 절), 그 장을 이미 마쳤거나
 * 자리가 없으면 아직 마치지 않은 첫 장의 첫 절. 다 마친 책이면 null
 */
export function copySpot(s: { progress: Progress; copy: CopyState }, book: Book, content: GameContent): CopySpot | null {
  const done = s.progress[book]?.completed ?? []
  const at = s.copy.at[book]
  let chapter = at && !done.includes(at.chapter) && copyChapters(book, content).includes(at.chapter) ? at.chapter : null
  const fromVerse = chapter !== null ? at!.verse : 0
  let draft = chapter !== null ? (at!.draft ?? '') : ''
  if (chapter === null) chapter = openChapter(book, done, content)
  if (chapter === null) return null
  const verses = copyVerses(book, chapter, content)
  if (!verses.length) return null
  let index = verses.findIndex((v) => v.verse >= fromVerse)
  if (index < 0) {
    // 저장된 절이 장 끝을 넘었다 (본문이 바뀐 경우) — 그 장 처음부터
    index = 0
    draft = ''
  }
  return { chapter, index, verse: verses[index], count: verses.length, draft }
}

/** 장을 마친 뒤 이어 쓸 장 (그다음 마치지 않은 장, 없으면 앞의 마치지 않은 장, 다 마쳤으면 null) */
export function nextOpenChapter(book: Book, completed: readonly number[], after: number, content: GameContent): number | null {
  return openChapter(book, completed, content, after + 1)
}

// ── 저장 정리 (save.ts) ──

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const isBook = (b: unknown): b is Book => typeof b === 'string' && (BOOKS as readonly string[]).includes(b)
const nat = (n: unknown, min: number) => (typeof n === 'number' && Number.isInteger(n) && n >= min ? n : null)
/** 쓰다 만 입력은 이만큼까지만 저장한다 (가장 긴 절보다 넉넉히) */
const DRAFT_MAX = 600

/**
 * 필사 상태 정리. raw가 없으면(필사가 생기기 전 저장) 이미 마친 장을 모두 "예전에 엮은 장"으로 남긴다
 */
export function sanitizeCopy(raw: unknown, progress: Progress): CopyState {
  if (!isObj(raw)) {
    const legacy: Partial<Record<Book, number[]>> = {}
    for (const b of BOOKS) if (progress[b].completed.length) legacy[b] = [...progress[b].completed]
    return { book: null, at: {}, legacy }
  }
  const at: Partial<Record<Book, CopyAt>> = {}
  if (isObj(raw.at))
    for (const [b, v] of Object.entries(raw.at)) {
      if (!isBook(b) || !isObj(v)) continue
      const chapter = nat(v.chapter, 1)
      const verse = nat(v.verse, 0)
      if (chapter === null || verse === null) continue
      const draft = typeof v.draft === 'string' && v.draft !== '' ? v.draft.slice(0, DRAFT_MAX) : undefined
      at[b] = draft ? { chapter, verse, draft } : { chapter, verse }
    }
  const legacy: Partial<Record<Book, number[]>> = {}
  if (isObj(raw.legacy))
    for (const [b, v] of Object.entries(raw.legacy)) {
      if (!isBook(b) || !Array.isArray(v)) continue
      const kept = [...new Set(v.filter((c): c is number => Number.isInteger(c) && progress[b].completed.includes(c as number)))]
      if (kept.length) legacy[b] = kept
    }
  const days = sanitizeBookDays(raw.days)
  return { book: isBook(raw.book) ? raw.book : null, at, legacy, ...(Object.keys(days).length ? { days } : {}) }
}

const dayOf = (n: unknown) => (typeof n === 'number' && Number.isInteger(n) && n >= 0 ? n : null)

/** 책을 쓴 날 정리: 모양이 맞는 것만 (마친 날은 시작한 날 이후일 때만). 옛 저장(칸이 없던 때)은 빈 기록 */
export function sanitizeBookDays(raw: unknown): Partial<Record<Book, BookDays>> {
  const out: Partial<Record<Book, BookDays>> = {}
  if (!isObj(raw)) return out
  for (const [b, v] of Object.entries(raw)) {
    if (!isBook(b) || !isObj(v)) continue
    const start = dayOf(v.start)
    if (start === null) continue
    const end = dayOf(v.end)
    out[b] = end !== null && end >= start ? { start, end } : { start }
  }
  return out
}

export function sanitizeCopyStats(raw: unknown): CopyStats {
  if (!isObj(raw)) return { ...NO_COPY_STATS }
  const n = (k: keyof CopyStats) => nat(raw[k], 0) ?? 0
  return { verses: n('verses'), chars: n('chars'), chapters: n('chapters'), books: n('books'), firstDay: nat(raw.firstDay, 0) }
}

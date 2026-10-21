// 제본과 책등 (계획 14 작업 4). 한 권을 다 필사하면 제본해 완성본이 되고, 완성본을 서고에 직접 가져가 꽂는다.
// 그대로 제본하기는 늘 무료다 — 재료가 없어 말씀을 못 남기는 일은 없다. 특별하게 제본하기는 생활에서 모은 재료로
// 표지 색·무늬·책등 장식을 고른다. 고른 모습은 서고 책등과 완성본 그림에 그대로 보인다. 이 파일은 순수 계산과 데이터.
import { BOOKS, type Book, type ItemId } from './types'
import { OT_BOOKS, type OtBook } from './ot-books'

export type CoverColor = 'cream' | 'sky' | 'sage' | 'lavender' | 'sand' | 'slate'
export type CoverPattern = 'plain' | 'lines' | 'dots' | 'diamonds'
export type SpineDeco = 'cream' | 'leather' | 'navy' | 'bronze'

export const COVER_COLORS: readonly CoverColor[] = ['cream', 'sky', 'sage', 'lavender', 'sand', 'slate']
export const COVER_PATTERNS: readonly CoverPattern[] = ['plain', 'lines', 'dots', 'diamonds']
export const SPINE_DECOS: readonly SpineDeco[] = ['cream', 'leather', 'navy', 'bronze']
/** 덧장식 (2026-10-08, 다른 창 책 장식 도트 연결): 없음·모서리 금속·천 책갈피·눌러 찍은 무늬·손때 묻은 표지 */
export type BookDetailChoice = 'none' | 'metalCorners' | 'ribbonBookmark' | 'embossed' | 'worn'
export const BOOK_DETAIL_CHOICES: readonly BookDetailChoice[] = ['none', 'metalCorners', 'ribbonBookmark', 'embossed', 'worn']

/** 표지 색 (차분한 파스텔) */
export const COVER_HEX: Record<CoverColor, string> = {
  cream: '#e9dcbc',
  sky: '#a9c1d9',
  sage: '#b0c4a4',
  lavender: '#bdb0d3',
  sand: '#d3bb98',
  slate: '#a3adb7',
}
/** 책등 장식 색 (실·띠의 색) */
export const DECO_HEX: Record<SpineDeco, string> = {
  cream: '#f4ead2',
  leather: '#8a6a55',
  navy: '#5a6a8a',
  bronze: '#b08a52',
}

/**
 * 특별하게 제본하기에 드는 꾸미기 재료 (2026-10-04 사용자 예시): 크림색 종이 셋 · 푸른 염료 하나 · 좋은 실 둘.
 * 갈대 말리는 틀(크림색 종이)·잉크 항아리(푸른 염료)가 저절로 만들고, 작업대(종이·실)와 장날 상인(염료)에게서도 얻는다
 */
export const SPECIAL_COST: Partial<Record<ItemId, number>> = { creamPaper: 3, blueDye: 1, fineThread: 2 }

export interface SpecialChoice {
  color: CoverColor
  pattern: CoverPattern
  deco: SpineDeco
  /** 덧장식 — 옛 저장에는 없다 (없으면 'none'과 같다) */
  detail?: BookDetailChoice
}
export const DEFAULT_CHOICE: SpecialChoice = { color: 'cream', pattern: 'lines', deco: 'leather' }

/** 도감은 기본 표지와 꾸미기 요소를 각각 모은다 (모든 조합을 별도 물건으로 세지 않는다). */
export interface BookDesign {
  id: string
  kind: 'book' | 'color' | 'pattern' | 'deco' | 'detail'
  value: string
  book: Book
  choice?: SpecialChoice
}
export const BOOK_DESIGNS: readonly BookDesign[] = [
  ...BOOKS.map(book => ({ id: `book:${book}`, kind: 'book' as const, value: book, book })),
  ...COVER_COLORS.map(color => ({ id: `color:${color}`, kind: 'color' as const, value: color, book: 'mt' as const, choice: { ...DEFAULT_CHOICE, color } })),
  ...COVER_PATTERNS.map(pattern => ({ id: `pattern:${pattern}`, kind: 'pattern' as const, value: pattern, book: 'mt' as const, choice: { ...DEFAULT_CHOICE, pattern } })),
  ...SPINE_DECOS.map(deco => ({ id: `deco:${deco}`, kind: 'deco' as const, value: deco, book: 'mt' as const, choice: { ...DEFAULT_CHOICE, deco } })),
  ...BOOK_DETAIL_CHOICES.filter(detail => detail !== 'none').map(detail => ({ id: `detail:${detail}`, kind: 'detail' as const, value: detail, book: 'mt' as const, choice: { ...DEFAULT_CHOICE, detail } })),
]
const DESIGN_IDS = new Set(BOOK_DESIGNS.map(d => d.id))

export function sanitizeBookDesigns(raw: unknown): string[] {
  return Array.isArray(raw) ? [...new Set(raw.filter((id): id is string => typeof id === 'string' && DESIGN_IDS.has(id)))] : []
}

/** 다시 꾸며도 앞서 쓴 디자인은 남는다. 옛 저장은 현재 제본·서고 기록에서 채운다. */
export function withBookDesigns(found: readonly string[], bound: Bindings, shelved: Partial<Record<Book, unknown>>): string[] {
  let out: string[] | undefined
  const add = (id: string) => {
    if (DESIGN_IDS.has(id) && !(out ?? found).includes(id)) (out ??= [...found]).push(id)
  }
  for (const book of BOOKS) {
    const binding = bound[book]
    if (!binding && shelved[book] === undefined) continue
    if (!binding?.special) add(`book:${book}`)
    else {
      const sp = binding.special
      add(`color:${sp.color}`)
      add(`pattern:${sp.pattern}`)
      add(`deco:${sp.deco}`)
      if (sp.detail && sp.detail !== 'none') add(`detail:${sp.detail}`)
    }
  }
  return out ?? found as string[]
}

/** 제본한 책 하나: 그대로(special 없음) 또는 특별하게(고른 모습), 제본한 날 */
export interface Binding {
  day: number
  special?: SpecialChoice
}
export type Bindings = Partial<Record<Book, Binding>>

/**
 * 책등 무늬 (그림이 2픽셀 이상 선으로 그린다): band 가로 띠 둘, stripe 세로 띠, dot 가운데 네모,
 * diamond 마름모, none 무늬 없음 (특별 제본의 민무늬)
 */
export type SpineMark = 'band' | 'stripe' | 'dot' | 'diamond' | 'none'

export interface SpineLook {
  color: string
  accent: string
  mark: SpineMark
}

// 책마다 다른 책등: 아홉 색 × 세 무늬 = 스물일곱 가지 (같은 모습이 둘 없다 — 테스트가 지킨다)
const PALETTE = ['#b98a8a', '#8a9fb9', '#93ad8a', '#bfa279', '#a393bd', '#86b0aa', '#c4a08c', '#9aa3ab', '#b3ad7e']
const MARKS: readonly SpineMark[] = ['band', 'stripe', 'dot']
const ACCENTS = ['#efe3c4', '#5f6f86', '#7d5f52']

/** 그대로 제본한 책(그리고 예전에 꽂은 책)의 책등 — 책마다 다르다 */
export const SPINE_DESIGN: Record<Book, SpineLook> = Object.fromEntries(
  BOOKS.map((b, i) => {
    const round = Math.floor(i / PALETTE.length)
    return [b, { color: PALETTE[i % PALETTE.length], accent: ACCENTS[(i + round) % ACCENTS.length], mark: MARKS[round] }]
  }),
) as Record<Book, SpineLook>

const PATTERN_MARK: Record<CoverPattern, SpineMark> = { plain: 'none', lines: 'band', dots: 'dot', diamonds: 'diamond' }

/** 서고 책등과 완성본 그림에 보일 모습: 특별 제본이면 고른 색·무늬·장식, 아니면 그 책의 책등 */
export function spineLook(book: Book, binding?: Binding | null): SpineLook {
  const sp = binding?.special
  if (!sp) return SPINE_DESIGN[book]
  return { color: COVER_HEX[sp.color], accent: DECO_HEX[sp.deco], mark: PATTERN_MARK[sp.pattern] }
}

/** 완성본(제본했지만 아직 서고에 꽂지 않은 책) — 가방에 들어 있다. 성경 순서 */
export function finishedCopies(s: { bound: Bindings; shelved: Partial<Record<Book, unknown>> }): Book[] {
  return BOOKS.filter((b) => s.bound[b] !== undefined && s.shelved[b] === undefined)
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

function cleanChoice(v: unknown): SpecialChoice | undefined {
  if (!isObj(v)) return undefined
  const { color, pattern, deco } = v
  if (!(COVER_COLORS as readonly unknown[]).includes(color)) return undefined
  if (!(COVER_PATTERNS as readonly unknown[]).includes(pattern)) return undefined
  if (!(SPINE_DECOS as readonly unknown[]).includes(deco)) return undefined
  const detail = v.detail
  const base = { color: color as CoverColor, pattern: pattern as CoverPattern, deco: deco as SpineDeco }
  return (BOOK_DETAIL_CHOICES as readonly unknown[]).includes(detail) && detail !== 'none' ? { ...base, detail: detail as BookDetailChoice } : base
}

/**
 * 저장 정리: 모양이 맞는 제본만, 다 마친 책(done)만 남긴다. 옛 저장(칸이 없던 때)은 빈 목록 —
 * 예전에 꽂은 책은 제본 기록이 없어도 그대로 꽂혀 있고(등급 그대로), 그 책의 책등으로 보인다
 */
export function sanitizeBindings(raw: unknown, done: (b: Book) => boolean): Bindings {
  if (!isObj(raw)) return {}
  const out: Bindings = {}
  for (const b of BOOKS) {
    const v = raw[b]
    if (!isObj(v) || !Number.isInteger(v.day) || (v.day as number) < 0 || !done(b)) continue
    const special = cleanChoice(v.special)
    out[b] = special ? { day: v.day as number, special } : { day: v.day as number }
  }
  return out
}

/**
 * 구약 책 꾸미기 (2026-10-22 사용자: 신약처럼 책 꾸미기) — 구약은 제본·꽂기 없이 다 쓰면 작은 책장에 저절로 꽂히므로,
 * 꾸민 책만 고른 모습을 남긴다 (특별 제본과 같은 재료·같은 고르기). 꾸미지 않은 책은 예전 책등 그대로
 */
export type OtBindings = Partial<Record<OtBook, Binding & { special: SpecialChoice }>>
export function sanitizeOtBindings(raw: unknown, done: (b: OtBook) => boolean): OtBindings {
  if (!isObj(raw)) return {}
  const out: OtBindings = {}
  for (const b of OT_BOOKS) {
    const v = raw[b]
    if (!isObj(v) || !Number.isInteger(v.day) || (v.day as number) < 0 || !done(b)) continue
    const special = cleanChoice(v.special)
    if (special) out[b] = { day: v.day as number, special }
  }
  return out
}
/** 구약 책을 꾸미며 처음 쓴 색·무늬·장식도 도감(신약과 같은 칸)에 모인다 */
export function withOtDesigns(found: readonly string[], ot: OtBindings): string[] {
  const out = [...found]
  for (const b of Object.values(ot)) {
    if (!b) continue
    const sp = b.special
    for (const id of [`color:${sp.color}`, `pattern:${sp.pattern}`, `deco:${sp.deco}`, ...(sp.detail && sp.detail !== 'none' ? [`detail:${sp.detail}`] : [])])
      if (DESIGN_IDS.has(id) && !out.includes(id)) out.push(id)
  }
  return out.length === found.length ? (found as string[]) : out
}

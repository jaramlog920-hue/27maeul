// 구약 본문 (계획 20 작업 2). 책별 파일(src/content/ot/<id>.json, scripts/build-ot.mjs가 만들고 verify-ot가 원본과 대조)을
// 필요할 때 불러온다 — 메인 번들에 구약 본문이 들어가지 않는다. 신약 본문 경로(catalog.ts의 bible-subset)는 건드리지 않는다.
// 안 불러온 책을 읽으면 `not loaded: gen` 오류 — 불러오기(ensureOtBook)를 먼저 기다린 뒤에만 읽는다.
import { expandRef } from './ref'
import { OT_BOOK_TABLE, isOtBook, otRow, type OtBook } from '../engine/ot-books'
import type { CopySource } from '../engine/copy'

export interface OtVerse {
  chapter: number
  verse: number
  text: string
}

/** 책 id → 개역한글 약칭('창')·한글 이름('창세기') */
export const OT_ABBR = Object.fromEntries(OT_BOOK_TABLE.map((r) => [r.id, r.abbr])) as Record<OtBook, string>
export const OT_NAME = Object.fromEntries(OT_BOOK_TABLE.map((r) => [r.id, r.name])) as Record<OtBook, string>
const ABBR_OT: Record<string, OtBook> = Object.fromEntries(OT_BOOK_TABLE.map((r) => [r.abbr, r.id]))

/** 구약 약칭이면 그 책 id ('창' → gen), 아니면 undefined */
export const otBookOfAbbr = (abbr: string): OtBook | undefined => ABBR_OT[abbr]
/** '창 1:3'의 첫 낱말이 구약 약칭이면 그 책 */
export const otBookOfRef = (ref: string): OtBook | undefined => ABBR_OT[ref.trim().split(/\s+/)[0]]

/** catalog.ts의 noText와 같은 규칙 (catalog가 이 파일을 부르므로 거기서 가져오지 않는다 — 테스트가 둘이 같음을 확인) */
export const otNoText = (text: string) => text === '(없음)' || /^\(\d+절에 포함되어 있음\)$/.test(text)

const loaders = import.meta.glob<string[][]>('./ot/*.json', { import: 'default' })
const loaderOf = (id: OtBook) => loaders[`./ot/${id}.json`]

const loaded = new Map<OtBook, string[][]>()
const pending = new Map<OtBook, Promise<void>>()
/** 장별 절 수 (장 넘는 범위 풀이용)·같은 문장 세기·대괄호 구간 — 불러올 때 한 번 */
const countsOf = new Map<OtBook, Record<string, number[]>>()
const quizKey = (s: string) => s.replace(/[\s,.!?]+/g, '')
const sameText = new Map<OtBook, Map<string, number>>()
const bracketed = new Map<OtBook, Set<string>>()

function index(id: OtBook, book: string[][]) {
  countsOf.set(id, { [id]: book.map((c) => c.length) })
  const m = new Map<string, number>()
  const br = new Set<string>()
  let square = false
  let round = false
  book.forEach((ch, ci) =>
    ch.forEach((text, vi) => {
      if (otNoText(text)) return
      m.set(quizKey(text), (m.get(quizKey(text)) ?? 0) + 1)
      if (square || round || /[[\]()]/.test(text)) br.add(`${OT_ABBR[id]} ${ci + 1}:${vi + 1}`)
      for (const c of text) {
        if (c === '[') square = true
        else if (c === ']') square = false
        else if (c === '(') round = true
        else if (c === ')') round = false
      }
    }),
  )
  sameText.set(id, m)
  bracketed.set(id, br)
}

/** 그 책 본문을 불러온다 (이미 불러왔으면 바로 끝, 동시에 불러도 한 번만) */
export function ensureOtBook(id: OtBook): Promise<void> {
  if (loaded.has(id)) return Promise.resolve()
  let p = pending.get(id)
  if (!p) {
    const load = loaderOf(id)
    if (!load) return Promise.reject(new Error(`no ot book file: ${id}`))
    p = load().then(
      (book) => {
        loaded.set(id, book)
        index(id, book)
        pending.delete(id)
      },
      (e) => {
        pending.delete(id) // 실패하면 다음에 다시 시도할 수 있게
        throw e
      },
    )
    pending.set(id, p)
  }
  return p
}

export const otLoaded = (id: OtBook): boolean => loaded.has(id)

function bookOf(id: OtBook): string[][] {
  const b = loaded.get(id)
  if (!b) throw new Error(`not loaded: ${id}`)
  return b
}

/** '창 1:3'·'시 23:1-6'처럼 구약 한 책 안의 참조 → 절들 (본문이 없는 절은 빠진다) */
export function otVersesOf(ref: string): OtVerse[] {
  const id = otBookOfRef(ref)
  if (!id) throw new Error(`not an ot ref: ${ref}`)
  const book = bookOf(id)
  return expandRef(ref, { [OT_ABBR[id]]: id }, countsOf.get(id))
    .map((k) => {
      const text = book[k.chapter - 1]?.[k.verse - 1]
      if (text === undefined) throw new Error(`no verse ${ref} ${k.chapter}:${k.verse}`)
      return { chapter: k.chapter, verse: k.verse, text }
    })
    .filter((v) => !otNoText(v.text))
}

/** 그 책의 장 수 (표에서 — 불러오지 않아도 된다) */
export const otChapterCount = (id: OtBook): number => otRow(id).chapters

/** 필사할 한 장의 본문: 1절부터 끝 절까지, 본문이 없는 절은 빠진다. 장이 없으면 빈 목록 */
export function otChapterText(id: OtBook, chapter: number): OtVerse[] {
  const n = bookOf(id)[chapter - 1]?.length ?? 0
  return n ? otVersesOf(`${OT_ABBR[id]} ${chapter}:1-${n}`) : []
}

/** 구약 책의 필사 본문 (신약 copySourceFor와 같은 모양) — 같은 문장 세기는 그 책 안에서만 센다 */
export function otCopySource(id: OtBook): CopySource {
  const book = bookOf(id)
  const same = sameText.get(id)!
  const br = bracketed.get(id)!
  const count = (t: string) => same.get(quizKey(t)) ?? 0
  return {
    versesOf: (ref) =>
      otVersesOf(ref).map((v) => {
        const r = `${OT_ABBR[id]} ${v.chapter}:${v.verse}`
        return { ref: r, text: v.text, inBrackets: br.has(r) }
      }),
    countVerse: count,
    countAnywhere: count,
    chapters: book.map((ch, i) => ({ chapter: i + 1, ref: `${OT_ABBR[id]} ${i + 1}:1-${ch.length}` })),
  }
}

export { isOtBook }

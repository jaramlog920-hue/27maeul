// 하나님 기록 줄 파일 읽기 (계획 14 작업 3) — build-god-records.mjs와 verify-god-records.mjs가 같이 쓴다.
//   scripts/god-records/keywords.txt : "id | 이름 | 무리"   (무리 = 성품 · 하시는 일 · 불리는 이름)
//   scripts/god-records/<책 id>.txt  : "키워드 이름 | 구절" (예: "사랑 | 요 3:16", 한 줄에 한 절)
// → src/content/god-records.json { keywords: [{ id, name, group }], records: [{ keyword, ref, book, chapter }] }
// 형식만 본다. 본문 대조(절 실재·본문 없는 절·괄호 절)·키워드 목록·중복·장마다 줄 수는 verify-god-records가 한다.
import { readFile, readdir } from 'node:fs/promises'

export const DIR = new URL('./god-records/', import.meta.url)
export const KEYWORDS_TXT = new URL('./god-records/keywords.txt', import.meta.url)
export const GOD_JSON = new URL('../src/content/god-records.json', import.meta.url)
export const GROUPS = ['성품', '하시는 일', '불리는 이름']

const lines = (src) => src.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))

export function parseKeywords(src, where = 'god-records/keywords.txt') {
  return lines(src).map((line) => {
    const parts = line.split('|').map((s) => s.trim())
    if (parts.length !== 3 || parts.some((p) => !p)) throw new Error(`${where}: bad line: ${line}`)
    return { id: parts[0], name: parts[1], group: parts[2] }
  })
}

/** 책 줄 파일 → [{ name, ref }] (키워드는 아직 이름) */
export function parseBookLines(src, where) {
  return lines(src).map((line) => {
    const parts = line.split('|').map((s) => s.trim())
    if (parts.length !== 2 || parts.some((p) => !p)) throw new Error(`${where}: bad line: ${line}`)
    return { name: parts[0], ref: parts[1] }
  })
}

export async function readKeywords(url = KEYWORDS_TXT) {
  return parseKeywords(await readFile(url, 'utf8'))
}

/** 책 id 순서(books.json)대로 책 줄 파일 목록 — keywords.txt 말고 *.txt 전부. [{ book, url }] */
export async function bookFiles() {
  return (await readdir(DIR))
    .filter((f) => f.endsWith('.txt') && f !== 'keywords.txt')
    .map((f) => ({ book: f.slice(0, -4), url: new URL(f, DIR) }))
}

export async function readBookLines(url, where) {
  return parseBookLines(await readFile(url, 'utf8'), where)
}

const REF_RE = /^(\S+) (\d+):(\d+)$/
/** "요 3:16" → { abbr, chapter, verse } 또는 null (한 절만, 범위·여러 절은 null) */
export function splitRef(ref) {
  const m = typeof ref === 'string' && ref.match(REF_RE)
  return m ? { abbr: m[1], chapter: Number(m[2]), verse: Number(m[3]) } : null
}

/** keywords + 책별 줄 → json 내용. bookOrder: books.json의 id 순서 */
export function toJson(keywords, perBook, bookOrder) {
  const idOf = new Map(keywords.map((k) => [k.name, k.id]))
  const records = []
  const ordered = [...perBook].sort((a, b) => bookOrder.indexOf(a.book) - bookOrder.indexOf(b.book))
  for (const { book, rows } of ordered) {
    const sorted = rows
      .map((r, i) => ({ r, i, s: splitRef(r.ref) }))
      .sort((a, b) => (a.s?.chapter ?? 0) - (b.s?.chapter ?? 0) || (a.s?.verse ?? 0) - (b.s?.verse ?? 0) || a.i - b.i)
    for (const { r, s } of sorted) records.push({ keyword: idOf.get(r.name) ?? null, ref: r.ref, book, chapter: s?.chapter ?? null })
  }
  return { keywords, records }
}

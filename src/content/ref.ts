// 참조 문자열 파서. 앱과 scripts/*.mjs가 같은 구현을 쓴다(Node 24 타입 스트립).
// 문법:
//   "마 28:11-15"        한 장 안의 범위
//   "행 16:12, 17:1"     쉼표 뒤 책 생략 — 앞 책을 이어받음
//   "요 7:41-42, 52"     쉼표 뒤 절만 — 앞 장까지 이어받음
//   "갈 1:1-6:18"        장을 넘는 범위 — 각 장의 절 수가 필요하므로 counts를 넘겨야 한다
// 본문 자체는 다루지 않는다 — 브라우저·노드 모두에서 import 가능.

export interface VerseRange {
  bookId: string
  chapter: number
  from: number
  to: number
}

export interface VerseKey {
  bookId: string
  chapter: number
  verse: number
}

type BookLookup = Record<string, string> // abbr -> bookId
/** bookId -> 장별 절 수 [1장 절수, 2장 절수, …]. 장 넘는 범위를 풀 때만 필요 */
export type VerseCounts = Record<string, number[]>

const PART = /^(?:(\S+)\s+)?(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/
const VERSES_ONLY = /^(\d+)(?:-(\d+))?$/

export function parseRef(ref: string, byAbbr: BookLookup, counts?: VerseCounts): VerseRange[] {
  const out: VerseRange[] = []
  let lastBook: string | null = null
  let lastChapter: number | null = null
  for (const part of ref.split(',').map((s) => s.trim())) {
    const vm = part.match(VERSES_ONLY)
    if (vm) {
      if (!lastBook || lastChapter === null) throw new Error(`verse-only part needs a preceding chapter: "${part}" in "${ref}"`)
      const from = Number(vm[1])
      const to = vm[2] ? Number(vm[2]) : from
      if (to < from) throw new Error(`reversed range: "${part}"`)
      out.push({ bookId: lastBook, chapter: lastChapter, from, to })
      continue
    }
    const m = part.match(PART)
    if (!m) throw new Error(`bad ref: "${part}" in "${ref}"`)
    const bookId: string | null = m[1] ? (byAbbr[m[1]] ?? null) : lastBook
    if (!bookId) throw new Error(`unknown book in "${part}" (${ref})`)
    const chapter = Number(m[2])
    const from = Number(m[3])
    const endChapter = m[4] ? Number(m[4]) : chapter
    const to = m[5] ? Number(m[5]) : from
    lastBook = bookId
    lastChapter = endChapter

    if (endChapter === chapter) {
      if (to < from) throw new Error(`reversed range: "${part}"`)
      out.push({ bookId, chapter, from, to })
      continue
    }
    // 장을 넘는 범위
    if (endChapter < chapter) throw new Error(`reversed chapter range: "${part}"`)
    const lens = counts?.[bookId]
    if (!lens) throw new Error(`cross-chapter ref needs verse counts: "${part}" in "${ref}"`)
    for (let c = chapter; c <= endChapter; c++) {
      const len = lens[c - 1]
      if (!len) throw new Error(`no chapter ${c} in ${bookId} ("${part}")`)
      const f = c === chapter ? from : 1
      const t = c === endChapter ? to : len
      if (t > len) throw new Error(`verse ${c}:${t} beyond chapter length ${len} ("${part}")`)
      out.push({ bookId, chapter: c, from: f, to: t })
    }
  }
  return out
}

export function expandRef(ref: string, byAbbr: BookLookup, counts?: VerseCounts): VerseKey[] {
  const keys: VerseKey[] = []
  for (const r of parseRef(ref, byAbbr, counts)) {
    for (let v = r.from; v <= r.to; v++) keys.push({ bookId: r.bookId, chapter: r.chapter, verse: v })
  }
  return keys
}

export function verseKeyString(k: VerseKey): string {
  return `${k.bookId}:${k.chapter}:${k.verse}`
}

/** a의 모든 절이 b 어딘가에 포함되는가 */
export function refWithin(a: string, b: string[], byAbbr: BookLookup, counts?: VerseCounts): boolean {
  const pool = new Set(b.flatMap((r) => expandRef(r, byAbbr, counts).map(verseKeyString)))
  return expandRef(a, byAbbr, counts).every((k) => pool.has(verseKeyString(k)))
}

/** 인용 비교용 정규화: 공백과 구두점 제거 */
export function normalizeQuote(s: string): string {
  return s.replace(/\s+/g, '').replace(/[,.!?…'"“”‘’「」\[\]()]/g, '')
}

/** 본문 JSON에서 장별 절 수 표를 만든다 */
export function countsFrom(bible: Record<string, string[][]>): VerseCounts {
  const out: VerseCounts = {}
  for (const [bookId, chapters] of Object.entries(bible)) out[bookId] = chapters.map((c) => c.length)
  return out
}

// 연결(사람·곳) 이름 목록 읽기와 본문 찾기 (계획 14 작업 9) — build-connections.mjs와 verify-connections.mjs가 같이 쓴다.
//   scripts/connections/names.txt : "이름 | 무리 | 찾는 말(·) [| 범위 <참조>] [| 빼기 <참조>] [| 같은 이름 <말>]"
// → src/content/connections.json { names: [{ name, kind, refs: ['마 4:18', …] }] } (refs는 성경 책 순서·장·절 순서, 한 절은 한 번)
// 찾는 규칙: 찾는 말이 그 절 본문에 글자 그대로 있고, 그 말 바로 앞 글자가 한글이 아니다 (말의 첫머리).
//           본문이 없는 절('(없음)'·'(n절에 포함되어 있음)')은 보지 않는다.
import { readFile } from 'node:fs/promises'
import { expandRef } from '../src/content/ref.ts'

export const NAMES_TXT = new URL('./connections/names.txt', import.meta.url)
export const CONNECTIONS_JSON = new URL('../src/content/connections.json', import.meta.url)
export const KINDS = ['사람', '곳']

const lines = (src) => src.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))

/** names.txt → [{ name, kind, words, scope?, exclude?, group, line }] (형식만 본다) */
export function parseNames(src, where = 'connections/names.txt') {
  return lines(src).map((line) => {
    const parts = line.split('|').map((s) => s.trim())
    if (parts.length < 3 || parts.slice(0, 3).some((p) => !p)) throw new Error(`${where}: bad line: ${line}`)
    const [name, kind, words] = parts
    const entry = { name, kind, words: words.split('·').map((w) => w.trim()), group: name, line }
    for (const extra of parts.slice(3)) {
      const m = extra.match(/^(범위|빼기|같은 이름)\s+(.+)$/)
      if (!m) throw new Error(`${where}: 덧붙임은 "범위 …"·"빼기 …"·"같은 이름 …" 중 하나: ${line}`)
      const key = { 범위: 'scope', 빼기: 'exclude', '같은 이름': 'group' }[m[1]]
      if (key === 'group' ? entry.group !== name : entry[key] !== undefined) throw new Error(`${where}: "${m[1]}"가 두 번: ${line}`)
      entry[key] = m[2].trim()
    }
    return entry
  })
}

export async function readNames(url = NAMES_TXT) {
  return parseNames(await readFile(url, 'utf8'))
}

export const noText = (text) => text === '(없음)' || /^\(\d+절에 포함되어 있음\)$/.test(text)

/** 본문에 찾는 말이 말의 첫머리로 있는가 (바로 앞 글자가 한글 음절이 아님) */
export function hasWord(text, word) {
  if (!word) return false
  let i = text.indexOf(word)
  while (i >= 0) {
    if (i === 0 || !/[가-힣]/.test(text[i - 1])) return true
    i = text.indexOf(word, i + 1)
  }
  return false
}

/** 성경 본문 도구: bible(nt-krv.json), books(books.json) → 참조 풀기·절 본문 */
export function bibleTools(bible, books) {
  const byAbbr = Object.fromEntries(books.map((b) => [b.abbr, b.id]))
  const abbrOf = Object.fromEntries(books.map((b) => [b.id, b.abbr]))
  const order = books.map((b) => b.id)
  const counts = Object.fromEntries(Object.entries(bible).map(([id, chs]) => [id, chs.map((c) => c.length)]))
  /** 참조 → ['마 1:16', …] (없는 절이면 throw) */
  const expand = (ref) =>
    expandRef(ref, byAbbr, counts).map((k) => {
      if (bible[k.bookId]?.[k.chapter - 1]?.[k.verse - 1] === undefined) throw new Error(`없는 절 ${abbrOf[k.bookId]} ${k.chapter}:${k.verse}`)
      return `${abbrOf[k.bookId]} ${k.chapter}:${k.verse}`
    })
  const textOf = (ref) => {
    const m = ref.match(/^(\S+) (\d+):(\d+)$/)
    if (!m || !byAbbr[m[1]]) return undefined
    return bible[byAbbr[m[1]]]?.[Number(m[2]) - 1]?.[Number(m[3]) - 1]
  }
  /** 모든 절을 성경 순서로: [{ ref, text }] */
  const all = []
  for (const id of order) (bible[id] ?? []).forEach((ch, ci) => ch.forEach((text, vi) => all.push({ ref: `${abbrOf[id]} ${ci + 1}:${vi + 1}`, text })))
  return { expand, textOf, all }
}

/** 한 이름이 나오는 절: 범위 안(없으면 신약 전체), 빼기 아닌 절 가운데 찾는 말이 있는 절 — 성경 순서 */
export function findRefs(entry, tools) {
  const scope = entry.scope ? new Set(tools.expand(entry.scope)) : null
  const exclude = new Set(entry.exclude ? tools.expand(entry.exclude) : [])
  return tools.all
    .filter((v) => (!scope || scope.has(v.ref)) && !exclude.has(v.ref) && !noText(v.text) && entry.words.some((w) => hasWord(v.text, w)))
    .map((v) => v.ref)
}

/** 목록 → json 내용 */
export function toJson(entries, tools) {
  return { names: entries.map((e) => ({ name: e.name, kind: e.kind, refs: findRefs(e, tools) })) }
}

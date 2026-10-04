// 하나님 기록 정확도 게이트 (계획 14 작업 3). 오류가 하나라도 있으면 exit 1 → prebuild가 빌드를 막는다.
// keywords.txt:
// - id는 영문 소문자·숫자·하이픈, 이름은 비어 있지 않음, 무리는 성품·하시는 일·불리는 이름 중 하나
// - id·이름이 겹치지 않음
// - 목록의 키워드마다 근거 구절이 하나 이상 (전체 검사 때만)
// 책 줄 파일(scripts/god-records/<책 id>.txt) 줄마다:
// - 파일 이름이 books.json의 책 id
// - 구절은 "약어 장:절" 한 절, 약어가 그 파일의 책 (다른 책 구절이면 오류)
// - 그 절이 실제로 있음
// - 본문이 없는 절('(없음)', '(n절에 포함되어 있음)')이 아님
// - 괄호 구간에 든 절이 아님 (catalog.ts `bracketed`와 같은 규칙 — 대괄호·둥근 괄호 구간과 그 안의 절)
// - 키워드 이름이 keywords.txt에 있음
// - 같은 (키워드, 구절) 줄이 두 번 없음
// - 한 장에 3줄까지
// - god-records.json이 줄 파일과 같음 (전체 검사 때만)
// 내용 판단(그 절이 그 키워드를 말하는지)은 opus 검토 + docs/content-audit.md에 적는다.
// 사용: node scripts/verify-god-records.mjs [책 id] [픽스처.txt] — 픽스처를 주면 그 책 파일 대신 그 파일만 보고,
//       json 대조와 "구절 없는 키워드" 검사는 하지 않는다.
//       --keywords=<픽스처.txt> 를 앞에 주면 keywords.txt 대신 그 파일을 키워드 목록으로 읽는다(역방향 픽스처용).
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { GOD_JSON, GROUPS, bookFiles, readBookLines, readKeywords, splitRef, toJson } from './god-records-parse.mjs'

const root = new URL('../', import.meta.url)
const bible = JSON.parse(await readFile(new URL('src/content/nt-krv.json', root), 'utf8'))
const books = JSON.parse(await readFile(new URL('src/content/books.json', root), 'utf8'))
const bookById = Object.fromEntries(books.map((b) => [b.id, b]))
const MAX_PER_CHAPTER = 3

let errors = 0
const fail = (where, msg) => {
  errors++
  console.error(`✗ ${where}: ${msg}`)
}
// verify-journey.mjs·catalog.ts의 noText와 같은 규칙
const noText = (text) => text === '(없음)' || /^\(\d+절에 포함되어 있음\)$/.test(text)

// src/content/catalog.ts의 `bracketed`·verify-pieces.mjs와 같은 규칙. 규칙을 바꾸면 셋을 함께 고칠 것.
const bracketed = new Set()
for (const b of books) {
  let square = false
  let round = false
  ;(bible[b.id] ?? []).forEach((ch, ci) =>
    ch.forEach((text, vi) => {
      if (noText(text)) return
      if (square || round || /[[\]()]/.test(text)) bracketed.add(`${b.abbr} ${ci + 1}:${vi + 1}`)
      for (const c of text) {
        if (c === '[') square = true
        else if (c === ']') square = false
        else if (c === '(') round = true
        else if (c === ')') round = false
      }
    }),
  )
}

const argv = process.argv.slice(2)
const kwArg = argv.find((a) => a.startsWith('--keywords='))
const [bookArg, fixture] = argv.filter((a) => a !== kwArg)
if (bookArg && !bookById[bookArg]) {
  console.error(`✗ 알 수 없는 책 ${bookArg} — books.json의 책 id(mat·mrk·…)`)
  process.exit(1)
}

// ── 키워드 목록 ──
let keywords = []
try {
  keywords = await readKeywords(kwArg ? pathToFileURL(kwArg.slice('--keywords='.length)) : undefined)
} catch (e) {
  fail('god-records/keywords.txt', e.message)
}
const byName = new Map()
const ids = new Set()
for (const k of keywords) {
  const w = `키워드 ${k.id} ${k.name}`
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(k.id)) fail(w, 'id는 영문 소문자·숫자·하이픈')
  if (!GROUPS.includes(k.group)) fail(w, `무리 "${k.group}"는 ${GROUPS.join('·')} 중 하나여야 함`)
  if (ids.has(k.id)) fail(w, 'id가 겹침')
  if (byName.has(k.name)) fail(w, '이름이 겹침')
  ids.add(k.id)
  if (!byName.has(k.name)) byName.set(k.name, k)
}

// ── 책 줄 파일 ──
let files = await bookFiles()
if (fixture) files = [{ book: bookArg, url: pathToFileURL(fixture), where: fixture }]
else if (bookArg) files = files.filter((f) => f.book === bookArg)

const perBook = []
const used = new Set()
let total = 0
for (const f of files) {
  const where = f.where ?? `god-records/${f.book}.txt`
  const book = bookById[f.book]
  if (!book) {
    fail(where, `파일 이름 ${f.book}이 books.json의 책 id가 아님`)
    continue
  }
  let rows = []
  try {
    rows = await readBookLines(f.url, where)
  } catch (e) {
    fail(where, e.message)
    continue
  }
  perBook.push({ book: f.book, rows })
  const seen = new Set()
  const perChapter = new Map()
  for (const r of rows) {
    total++
    const w = `${where} ${r.name} | ${r.ref}`
    const s = splitRef(r.ref)
    if (!s) {
      fail(w, '구절은 "약어 장:절" 한 절이어야 함')
      continue
    }
    if (s.abbr !== book.abbr) {
      fail(w, `${book.name} 파일에 다른 책(${s.abbr}) 구절 — 구절의 책과 파일이 맞아야 함`)
      continue
    }
    const kw = byName.get(r.name)
    if (!kw) fail(w, `키워드 "${r.name}"이 keywords.txt에 없음`)
    else used.add(kw.id)
    const key = `${r.name}|${r.ref}`
    if (seen.has(key)) fail(w, '같은 키워드·구절 줄이 두 번 있음')
    seen.add(key)
    perChapter.set(s.chapter, (perChapter.get(s.chapter) ?? 0) + 1)
    const text = bible[book.id]?.[s.chapter - 1]?.[s.verse - 1]
    if (text === undefined) {
      fail(w, `${book.name}에 없는 절`)
      continue
    }
    if (noText(text)) fail(w, `본문이 없는 절 "${text}"`)
    else if (bracketed.has(r.ref)) fail(w, `괄호 구간에 든 절 — 하나님 기록 근거로 쓰지 않음 "${text}"`)
  }
  for (const [ch, n] of perChapter) if (n > MAX_PER_CHAPTER) fail(`${where} ${book.abbr} ${ch}장`, `한 장에 ${MAX_PER_CHAPTER}줄까지 (${n}줄)`)
}

if (!fixture && !bookArg) {
  for (const k of keywords) if (!used.has(k.id)) fail(`키워드 ${k.id} ${k.name}`, '근거 구절이 없음 — 구절이 하나도 없는 키워드는 두지 않는다')
  let json = null
  try {
    json = JSON.parse(await readFile(GOD_JSON, 'utf8'))
  } catch (e) {
    fail('god-records.json', `읽을 수 없음 — node scripts/build-god-records.mjs (${e.message})`)
  }
  const want = toJson(keywords, perBook, books.map((b) => b.id))
  if (json && JSON.stringify(json) !== JSON.stringify(want)) fail('god-records.json', 'scripts/god-records/*.txt와 다름 — node scripts/build-god-records.mjs')
}

if (errors) {
  console.error(`\n✗ verify-god-records 실패: 오류 ${errors}개`)
  process.exit(1)
}
console.log(`✓ verify-god-records 통과 (키워드 ${keywords.length}개, 기록 ${total}줄, 책 ${perBook.length}권)`)

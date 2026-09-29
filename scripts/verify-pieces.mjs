// 조각·생활 문구 정확도 게이트 (docs/exclusion-list.md). 오류가 하나라도 있으면 exit 1 → prebuild가 빌드를 막는다.
// 사용: node scripts/verify-pieces.mjs [pieces.json] [life-text.json] [neighbors.json]
import { readFile } from 'node:fs/promises'
import { parseRef, expandRef, normalizeQuote, countsFrom, verseKeyString } from '../src/content/ref.ts'
import { FORBIDDEN } from '../src/content/forbidden.ts'

const root = new URL('../', import.meta.url)
const read = async (p) => JSON.parse(await readFile(new URL(p, root), 'utf8'))

const [
  piecesPath = 'src/content/pieces.json',
  lifePath = 'src/content/life-text.json',
  neighborsPath = 'src/content/neighbors.json',
] = process.argv.slice(2)
const bible = await read('src/content/nt-krv.json')
const books = await read('src/content/books.json')
const pieces = await read(piecesPath)
const life = await read(lifePath)
const neighbors = await read(neighborsPath)

const byAbbr = Object.fromEntries(books.map((b) => [b.abbr, b.id]))
const counts = countsFrom(bible)

const BOOK_IDS = { mt: 'mat', mk: 'mrk', lk: 'luk', jn: 'jhn' }
const BOOK_NAMES = { mt: '마태복음', mk: '마가복음', lk: '누가복음', jn: '요한복음' }
const BOOK_ABBR = { mt: '마', mk: '막', lk: '눅', jn: '요' }
// 설계 §3.3 — 'full': 1장부터 끝 장까지 전부. 'prefix': 1장부터 조각이 있는 마지막 장까지 빠짐없이(시험판에서 앞 몇 장만 넣은 책).
// 책을 다 넣으면 'full'로 바꾼다.
const COVERAGE = { mt: 'full', mk: 'full', lk: 'full', jn: 'full' }
// exclusion-list §4-3 — "같은 이야기"인데 겹치는 낱말이 이보다 적으면 사람이 다시 본다
const SAME_OVERLAP_MIN = 0.2
// exclusion-list §3-2 — 조각은 문장 중간에서 끝나지 않는다 (다음 절로 말이 이어지는 어미)
const OPEN_ENDINGS = /(이르시되|가로되|가라사대|여짜오되|말하되|으나|하시고|하고|하며|하매|쌔|거늘)$/

let errors = 0
let warnings = 0
const fail = (where, msg) => {
  errors++
  console.error(`✗ ${where}: ${msg}`)
}
const warn = (where, msg) => {
  warnings++
  console.error(`△ ${where}: ${msg}`)
}

function textOf(ref) {
  return expandRef(ref, byAbbr, counts)
    .map((k) => {
      const t = bible[k.bookId]?.[k.chapter - 1]?.[k.verse - 1]
      if (!t) throw new Error(`no verse ${k.bookId} ${k.chapter}:${k.verse} (${ref})`)
      return t
    })
    .join(' ')
}
function rangesOf(where, ref) {
  try {
    const r = parseRef(ref, byAbbr, counts)
    textOf(ref)
    return r
  } catch (e) {
    fail(where, e.message)
    return null
  }
}
const wordsOf = (s) => new Set(s.split(/\s+/).map(normalizeQuote).filter((w) => w.length >= 2))

// ── 1~3. 조각 ──
const ids = new Set()
const titles = new Map() // `${book}:${title}` -> id (제목은 같은 책 안에서만 겹치지 않으면 된다)
const covered = new Map() // book -> Map(chapter -> Map(verse -> id))
const pieceAt = new Map() // 'mrk:1:9' -> piece
for (const p of pieces) {
  const w = `piece ${p.id}`
  if (ids.has(p.id)) fail(w, '중복 id')
  ids.add(p.id)
  const bookId = BOOK_IDS[p.book]
  if (!bookId) {
    fail(w, `알 수 없는 책 ${p.book}`)
    continue
  }
  const ranges = rangesOf(w, p.ref)
  if (!ranges) continue
  if (ranges.some((r) => r.bookId !== bookId)) {
    fail(w, `${BOOK_NAMES[p.book]}이 아닌 범위 ${p.ref}`)
    continue
  }
  const first = ranges[0]
  if (first.chapter !== p.chapter) fail(w, `chapter ${p.chapter}가 시작하는 장 ${first.chapter}와 다름`)
  const expectId = `${p.book}-${String(first.chapter).padStart(3, '0')}-${String(first.from).padStart(3, '0')}`
  if (p.id !== expectId) fail(w, `id는 ${expectId}여야 함`)
  if (!covered.has(p.book)) covered.set(p.book, new Map())
  const byCh = covered.get(p.book)
  for (const k of expandRef(p.ref, byAbbr, counts)) {
    if (!byCh.has(k.chapter)) byCh.set(k.chapter, new Map())
    const m = byCh.get(k.chapter)
    if (m.has(k.verse)) fail(w, `${k.chapter}:${k.verse}가 ${m.get(k.verse)}와 겹침`)
    else m.set(k.verse, p.id)
    pieceAt.set(verseKeyString(k), p)
  }

  const body = normalizeQuote(textOf(p.ref))
  const lastWord = textOf(p.ref).trim().split(/\s+/).at(-1)
  if (OPEN_ENDINGS.test(lastWord)) fail(w, `문장이 끝나지 않은 채 조각이 끝남 ("…${lastWord}")`)
  if (typeof p.title !== 'string' || !p.title.trim()) fail(w, '제목 없음')
  else {
    const tk = `${p.book}:${p.title}`
    if (titles.has(tk)) fail(w, `제목 "${p.title}"이 ${titles.get(tk)}와 같음 — 조각끼리 구분되게`)
    else titles.set(tk, p.id)
    for (const t of p.title.split(/\s+/).filter(Boolean)) if (!body.includes(normalizeQuote(t))) fail(w, `제목 낱말 "${t}"가 본문에 없음`)
  }

  if (!Array.isArray(p.stamps)) {
    fail(w, 'stamps는 배열이어야 함')
    continue
  }
  const stampRefs = new Set()
  for (const s of p.stamps) {
    const sw = `${w} 도장 ${s.ref}`
    if (s.kind !== 'same' && s.kind !== 'similar') {
      fail(sw, `알 수 없는 kind ${s.kind}`)
      continue
    }
    const sBookId = BOOK_IDS[s.book]
    if (!sBookId) {
      fail(sw, `알 수 없는 book ${s.book}`)
      continue
    }
    if (s.book === p.book) {
      fail(sw, '자기 책을 가리키는 도장')
      continue
    }
    if (stampRefs.has(s.ref)) fail(sw, '같은 도장이 두 번')
    stampRefs.add(s.ref)
    const sr = rangesOf(sw, s.ref)
    if (!sr) continue
    if (sr.some((r) => r.bookId !== sBookId)) {
      fail(sw, `ref 책이 book(${s.book})와 다름`)
      continue
    }
    if (s.kind === 'same') {
      const a = wordsOf(textOf(p.ref))
      const b = wordsOf(textOf(s.ref))
      const common = [...a].filter((x) => b.has(x)).length
      const ratio = common / Math.max(1, Math.min(a.size, b.size))
      if (ratio < SAME_OVERLAP_MIN) warn(sw, `"같은 이야기"인데 겹치는 낱말 비율 ${ratio.toFixed(2)} — 다시 검토`)
    }
  }
}

// ── 덮기: 책마다 1장부터 빠짐없이 ──
for (const book of covered.keys()) if (!COVERAGE[book]) fail(BOOK_NAMES[book] ?? book, 'COVERAGE에 없는 책의 조각 — 덮기 규칙을 정하세요')
for (const [book, mode] of Object.entries(COVERAGE)) {
  const bid = BOOK_IDS[book]
  const byCh = covered.get(book) ?? new Map()
  const last = mode === 'full' ? counts[bid].length : Math.max(0, ...byCh.keys())
  for (let c = 1; c <= last; c++) {
    const m = byCh.get(c) ?? new Map()
    const missing = []
    for (let v = 1; v <= counts[bid][c - 1]; v++) if (!m.has(v)) missing.push(v)
    if (missing.length) fail(`${BOOK_ABBR[book]} ${c}장`, `조각이 덮지 않은 절 ${missing.length}개 (${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''})`)
  }
}

// ── 도장 양방향 (설계 §3.4, exclusion-list §5-1) ──
// 상대 책의 그 구절에 아직 조각이 없으면(시험판) 건너뛴다.
const keysOf = (ref) => {
  try {
    return new Set(expandRef(ref, byAbbr, counts).map(verseKeyString))
  } catch {
    return new Set()
  }
}
for (const p of pieces) {
  if (!Array.isArray(p.stamps) || !BOOK_IDS[p.book]) continue
  const mine = keysOf(p.ref)
  for (const s of p.stamps) {
    if (s.book === p.book) continue
    const targets = new Set([...keysOf(s.ref)].map((k) => pieceAt.get(k)).filter(Boolean))
    for (const t of targets) {
      const back = (Array.isArray(t.stamps) ? t.stamps : []).filter((b) => b.book === p.book && [...keysOf(b.ref)].some((k) => mine.has(k)))
      const sw = `piece ${p.id} 도장 ${s.ref}`
      if (!back.length) fail(sw, `${t.id}에 되돌아오는 도장이 없음`)
      else if (!back.some((b) => b.kind === s.kind)) fail(sw, `${t.id}의 되돌아오는 도장 종류가 다름`)
    }
  }
}

// ── 본문 떼어 낸 것이 원본과 같은가 ──
try {
  const subset = await read('src/content/bible-subset.json')
  for (const b of ['mat', 'mrk', 'luk', 'jhn', 'act'])
    if (JSON.stringify(subset[b]) !== JSON.stringify(bible[b])) fail('bible-subset.json', `${b}가 nt-krv.json과 다름 — node scripts/build-bible-subset.mjs`)
} catch (e) {
  fail('bible-subset.json', `읽을 수 없음 — node scripts/build-bible-subset.mjs (${e.message})`)
}

// ── 4·5. 지어낸 문장 ──
function walk(node, path) {
  if (typeof node === 'string') {
    for (const re of FORBIDDEN) if (re.test(node)) fail(path, `금지어 ${re.source} — "${node}"`)
  } else if (Array.isArray(node)) node.forEach((n, i) => walk(n, `${path}[${i}]`))
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`)
  }
}
walk(life, 'life-text')
walk(neighbors, 'neighbors')

if (errors) {
  console.error(`\n✗ verify-pieces 실패: 오류 ${errors}개, 경고 ${warnings}개`)
  process.exit(1)
}
console.log(`✓ verify-pieces 통과 (조각 ${pieces.length}개, 경고 ${warnings}개)`)

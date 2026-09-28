// 조각·생활 문구 정확도 게이트 (docs/exclusion-list.md). 오류가 하나라도 있으면 exit 1 → prebuild가 빌드를 막는다.
// 사용: node scripts/verify-pieces.mjs [pieces.json] [life-text.json] [neighbors.json]
import { readFile } from 'node:fs/promises'
import { parseRef, expandRef, normalizeQuote, countsFrom } from '../src/content/ref.ts'

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

// exclusion-list §3-2 — 누가복음 1–24장 전체를 덮어야 하는가. 콘텐츠가 다 들어가면 true.
const REQUIRE_FULL_BOOK = true
const STAMP_BOOKS = { mt: 'mat', mk: 'mrk', jn: 'jhn' }
// exclusion-list §4-3 — "같은 이야기"인데 겹치는 낱말이 이보다 적으면 사람이 다시 본다
const SAME_OVERLAP_MIN = 0.2
// exclusion-list §3-2 — 조각은 문장 중간에서 끝나지 않는다 (다음 절로 말이 이어지는 어미)
const OPEN_ENDINGS = /(이르시되|가로되|가라사대|여짜오되|말하되|으나|하시고|하고|하며|하매|쌔)$/
// exclusion-list §2-4 — 지어낸 문장에 쓰지 않는 말. 책 이름(누가복음·요한복음)은 허용.
// 낱말 가운데에 들어간 경우(필요한 → 요한)는 거른다: 바로 앞이 한글이면 다른 낱말의 일부
const FORBIDDEN_WORDS = [
  /예수/, /그리스도/, /하나님/, /주님/, /성령/, /천사/, /사도/, /제자/, /베드로/, /요한(?!복음)/, /누가(?!복음)/,
  /마리아/, /바울/, /데오빌로/, /세례/, /예루살렘/, /갈릴리/, /나사렛/, /베들레헴/, /사마리아/,
  /유월절/, /오순절/, /초막절/, /안식일/, /성전/, /회당/, /의원/, /제사장/, /세리/, /바리새/, /서기관/,
]
const FORBIDDEN = FORBIDDEN_WORDS.map((re) => new RegExp('(?<![가-힣])' + re.source))

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
const titles = new Map()
const covered = new Map() // chapter -> Map(verse -> piece id)
for (const p of pieces) {
  const w = `piece ${p.id}`
  if (ids.has(p.id)) fail(w, '중복 id')
  ids.add(p.id)
  const ranges = rangesOf(w, p.ref)
  if (!ranges) continue
  if (ranges.some((r) => r.bookId !== 'luk')) {
    fail(w, `누가복음이 아닌 범위 ${p.ref}`)
    continue
  }
  const first = ranges[0]
  if (first.chapter !== p.chapter) fail(w, `chapter ${p.chapter}가 시작하는 장 ${first.chapter}와 다름`)
  const expectId = `lk-${String(first.chapter).padStart(3, '0')}-${String(first.from).padStart(3, '0')}`
  if (p.id !== expectId) fail(w, `id는 ${expectId}여야 함`)
  for (const k of expandRef(p.ref, byAbbr, counts)) {
    if (!covered.has(k.chapter)) covered.set(k.chapter, new Map())
    const m = covered.get(k.chapter)
    if (m.has(k.verse)) fail(w, `${k.chapter}:${k.verse}가 ${m.get(k.verse)}와 겹침`)
    else m.set(k.verse, p.id)
  }

  const body = normalizeQuote(textOf(p.ref))
  const lastWord = textOf(p.ref).trim().split(/\s+/).at(-1)
  if (OPEN_ENDINGS.test(lastWord)) fail(w, `문장이 끝나지 않은 채 조각이 끝남 ("…${lastWord}")`)
  if (typeof p.title !== 'string' || !p.title.trim()) fail(w, '제목 없음')
  else {
    if (titles.has(p.title)) fail(w, `제목 "${p.title}"이 ${titles.get(p.title)}와 같음 — 조각끼리 구분되게`)
    else titles.set(p.title, p.id)
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
    const bookId = STAMP_BOOKS[s.book]
    if (!bookId) {
      fail(sw, `알 수 없는 book ${s.book}`)
      continue
    }
    if (stampRefs.has(s.ref)) fail(sw, '같은 도장이 두 번')
    stampRefs.add(s.ref)
    const sr = rangesOf(sw, s.ref)
    if (!sr) continue
    if (sr.some((r) => r.bookId !== bookId)) {
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

const chapters = REQUIRE_FULL_BOOK ? counts.luk.map((_, i) => i + 1) : [...covered.keys()]
for (const c of chapters) {
  const m = covered.get(c) ?? new Map()
  const missing = []
  for (let v = 1; v <= counts.luk[c - 1]; v++) if (!m.has(v)) missing.push(v)
  if (missing.length) fail(`눅 ${c}장`, `조각이 덮지 않은 절 ${missing.length}개 (${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''})`)
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
    if (node.speaker === 'writer') fail(path, '기록자가 화자인 문장 (기록자는 말하지 않는다)')
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

// 구약 장별 필사 길잡이 게이트. 오류가 하나라도 있으면 exit 1.
// 원본(scripts/ot-guides/*.txt) 표 줄마다: 칸 넷, "책이름 N장"(시편은 "시편 N편"), 장 범위, 중복 없음, 칸이 비지 않음,
// 배경·살펴보기에 절 번호·근거 머리가 섞이지 않음, 두 칸 각 100자 이내, 금지어(성경 설명 글이라 본문 인물·지명은 허용).
// 원본에 있는 책은 모든 장이 있어야 하고, src/content/ot-guides/<id>.json이 원본과 같아야 한다.
// --all: 39권 929장 전부 있어야 통과 (모두 쓴 뒤 verify에 건다)
import { readFile } from 'node:fs/promises'
import { FORBIDDEN } from '../src/content/forbidden.ts'
import { OT_BOOKS_TABLE, OT_GUIDE_OUT, readOtGuideRows, toOtGuideJson } from './ot-guides-parse.mjs'
import { GUIDE_ALLOWED } from './verify-chapter-guides-allowed.mjs'

const GUIDE_FORBIDDEN = FORBIDDEN.filter((re) => !GUIDE_ALLOWED.some((w) => re.source.replace('(?<![가-힣])', '').startsWith(w)))
const all = process.argv.includes('--all')
const byName = new Map(OT_BOOKS_TABLE.map((b) => [b.name, b]))

let errors = 0
const fail = (where, msg) => {
  errors++
  console.error(`✗ ${where}: ${msg}`)
}

const { rows } = await readOtGuideRows()
const seen = new Set()
const booksSeen = new Set()
for (const r of rows) {
  const w = `${r.where} ${r.label}`
  if (r.cellCount !== 4) fail(w, `칸이 ${r.cellCount}개 — 넷이어야 함`)
  if (r.chapter === null) {
    fail(w, '장 칸은 "책이름 N장"(시편은 "N편")이어야 함')
    continue
  }
  const book = byName.get(r.name)
  if (!book) {
    fail(w, `구약 책 이름 "${r.name}"이 없음`)
    continue
  }
  if ((book.id === 'psa') !== (r.unit === '편')) fail(w, '시편만 "편", 나머지는 "장"')
  if (r.chapter < 1 || r.chapter > book.chapters) fail(w, `${book.name}은 ${book.chapters}장까지`)
  const key = `${book.id}:${r.chapter}`
  if (seen.has(key)) fail(w, '같은 책·장이 두 번 있음')
  seen.add(key)
  booksSeen.add(book.id)
  for (const [field, label] of [
    ['background', '말씀의 배경'],
    ['look', '필사하며 살펴보기'],
  ]) {
    const t = r[field]
    if (!t) {
      fail(w, `${label} 칸이 비어 있음`)
      continue
    }
    if (t.length > 100) fail(w, `${label} ${t.length}자 — 100자 이내`)
    if (/\d+:\d+/.test(t) || /^(배경|살펴보기)\s*:/.test(t)) fail(w, `${label}에 검토용 본문 근거가 섞인 듯함`)
    for (const re of GUIDE_FORBIDDEN) if (re.test(t)) fail(w, `${label}에 금지어 /${re.source}/`)
  }
  if (!r.basis) fail(w, '검토용 본문 근거가 비어 있음')
}

for (const b of OT_BOOKS_TABLE) {
  if (!all && !booksSeen.has(b.id)) continue
  for (let c = 1; c <= b.chapters; c++) if (!seen.has(`${b.id}:${c}`)) fail(`${b.name} ${c}장`, '길잡이가 없음')
}
const json = toOtGuideJson(rows)
for (const [id, chapters] of Object.entries(json)) {
  let file = null
  try {
    file = JSON.parse(await readFile(new URL(`${id}.json`, OT_GUIDE_OUT), 'utf8'))
  } catch {
    fail(`ot-guides/${id}.json`, '없음 — node scripts/build-ot-guides.mjs')
    continue
  }
  if (JSON.stringify(file) !== JSON.stringify(chapters)) fail(`ot-guides/${id}.json`, '원본과 다름 — node scripts/build-ot-guides.mjs')
}

if (errors) {
  console.error(`\n✗ verify-ot-guides 실패: 오류 ${errors}개`)
  process.exit(1)
}
console.log(`✓ verify-ot-guides 통과 (책 ${booksSeen.size}권, 장 ${seen.size}개${all ? ', 39권 전부' : ''})`)

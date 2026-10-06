// 장별 필사 길잡이 게이트. 오류가 하나라도 있으면 exit 1 → prebuild가 빌드를 막는다.
// 원본(scripts/chapter-guides/*.txt) 표 줄마다:
// - 칸이 넷 (장 | 말씀의 배경 | 필사하며 살펴보기 | 검토용 본문 근거)
// - 장 칸이 "책이름 N장"이고 책 이름이 books.json에 있으며, 장 번호가 그 책의 장 범위 안
// - 같은 책·장이 두 번 없음
// - 배경·살펴보기·검토용 근거가 비어 있지 않음
// - 배경·살펴보기에 검토용 근거가 섞이지 않음 (절 번호 "1:2", "배경:"·"살펴보기:" 머리)
// - 금지어: 길잡이는 성경 본문을 설명하는 글이라 성경 인물·지명·절기·직분 이름(GUIDE_ALLOWED)은 쓴다.
//   그 밖의 금지어(성경의 돈 이름, 요한계시록 해석의 말 등)는 생활 문구처럼 걸린다.
// 전체:
// - 27권 모든 장(260장)에 길잡이가 있음
// - chapter-guides.json이 원본과 같음 (node scripts/build-chapter-guides.mjs)
// 사용: node scripts/verify-chapter-guides.mjs [픽스처.txt] — 픽스처를 주면 그 파일만 보고 전체 검사(장 빠짐·json 대조)는 하지 않는다.
import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { FORBIDDEN } from '../src/content/forbidden.ts'
import { GUIDE_JSON, parseGuideText, readGuideRows, toGuideJson } from './chapter-guides-parse.mjs'

/** 길잡이(성경 설명 글)에서만 허용하는 금지어 — 본문에 나오는 인물·지명·절기·직분 이름. 다른 곳(생활 문구)은 그대로 금지 */
export const GUIDE_ALLOWED = [
  '예수', '그리스도', '하나님', '주님', '성령', '천사', '사도', '제자', '베드로', '요한', '누가',
  '마리아', '바울', '데오빌로', '세례', '예루살렘', '갈릴리', '나사렛', '베들레헴', '사마리아',
  '유월절', '오순절', '초막절', '안식일', '성전', '회당', '제사장', '세리', '바리새', '서기관',
  // 신약 본문이 인용·언급하는 구약 인물·지명 (계획 20 작업 1: 생활 문구에서는 금지, 신약 길잡이 설명에서만 허용)
  '아브라함', '모세', '다윗', '솔로몬', '야곱', '이스라엘', '가나안', '애굽', '바벨론', '여호와', '엘리야',
]
const GUIDE_FORBIDDEN = FORBIDDEN.filter((re) => !GUIDE_ALLOWED.some((w) => re.source.replace('(?<![가-힣])', '').startsWith(w)))

const books = JSON.parse(await readFile(new URL('../src/content/books.json', import.meta.url), 'utf8'))
const byName = new Map(books.map((b) => [b.name, b]))

let errors = 0
const fail = (where, msg) => {
  errors++
  console.error(`✗ ${where}: ${msg}`)
}

const fixture = process.argv[2]
const rows = fixture ? parseGuideText(await readFile(fixture, 'utf8'), basename(fixture)) : (await readGuideRows()).rows

const seen = new Set()
for (const r of rows) {
  const w = `${r.where} ${r.label}`
  if (r.cellCount !== 4) fail(w, `칸이 ${r.cellCount}개 — 장 | 말씀의 배경 | 필사하며 살펴보기 | 검토용 본문 근거 넷이어야 함`)
  if (r.chapter === null) {
    fail(w, '장 칸은 "책이름 N장"이어야 함')
    continue
  }
  const book = byName.get(r.name)
  if (!book) {
    fail(w, `책 이름 "${r.name}"이 books.json에 없음`)
    continue
  }
  if (r.chapter < 1 || r.chapter > book.chapters) fail(w, `${book.name}은 ${book.chapters}장까지`)
  const key = `${book.id}:${r.chapter}`
  if (seen.has(key)) fail(w, '같은 책·장이 두 번 있음')
  seen.add(key)
  for (const [field, label] of [
    ['background', '말씀의 배경'],
    ['look', '필사하며 살펴보기'],
  ]) {
    const t = r[field]
    if (!t) {
      fail(w, `${label} 칸이 비어 있음`)
      continue
    }
    if (/\d+:\d+/.test(t) || /^(배경|살펴보기)\s*:/.test(t)) fail(w, `${label}에 검토용 본문 근거가 섞인 듯함 "${t}"`)
    for (const re of GUIDE_FORBIDDEN) if (re.test(t)) fail(w, `${label}에 금지어 /${re.source}/`)
  }
  if (!r.basis) fail(w, '검토용 본문 근거가 비어 있음 (원본에만 두는 칸)')
}

if (!fixture) {
  for (const b of books) for (let c = 1; c <= b.chapters; c++) if (!seen.has(`${b.id}:${c}`)) fail(`${b.name} ${c}장`, '길잡이가 없음')
  let json = null
  try {
    json = JSON.parse(await readFile(GUIDE_JSON, 'utf8'))
  } catch (e) {
    fail('chapter-guides.json', `읽을 수 없음 — node scripts/build-chapter-guides.mjs (${e.message})`)
  }
  if (json && JSON.stringify(json) !== JSON.stringify(toGuideJson(rows, books))) fail('chapter-guides.json', 'scripts/chapter-guides/*.txt와 다름 — node scripts/build-chapter-guides.mjs')
}

if (errors) {
  console.error(`\n✗ verify-chapter-guides 실패: 오류 ${errors}개`)
  process.exit(1)
}
console.log(`✓ verify-chapter-guides 통과 (장 ${seen.size}개)`)

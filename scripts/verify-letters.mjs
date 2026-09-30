// 편지 첫머리(보낸 이·받는 이) 정확도 게이트 (계획 7 작업 5). 오류가 하나라도 있으면 exit 1 → prebuild가 빌드를 막는다.
// - 책은 서고 방 표에서 편지로 엮는 책(mode 'letters')이다
// - 칸 이름은 "보낸 이"·"받는 곳"·"받는 사람" 셋 중 하나
// - 구절은 그 편지 1장의 실제 절이고 본문이 없는 절이 아니다. 이름 줄은 한 절, "적혀 있지 않음" 줄은 확인한 범위를 쓸 수 있다
// - 이름은 띄어쓰기 없이 그 구절 본문(띄어쓰기 뺀)에 글자 그대로 있다
// - 편지마다 "보낸 이" 줄이 하나 이상, "받는 곳"이나 "받는 사람" 줄이 하나 이상
// - "적혀 있지 않음" 줄이 있는 칸에는 다른 이름 줄이 없고, content-audit.md에 그 범위와 까닭이 적혀 있다
// - letters.json이 scripts/letters/opening.txt와 같다
// 사용: node scripts/verify-letters.mjs [픽스처.txt] — 픽스처를 주면 그 파일만 보고(그 파일에 나온 책만 칸 검사), letters.json 대조는 하지 않는다.
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { SHELF_ROOMS, bibleIdOf } from '../src/engine/shelf-rooms.ts'
import { LETTERS_JSON, NOT_WRITTEN, ROLES, readOpeningTxt, toEntries } from './letters-parse.mjs'

const root = new URL('../', import.meta.url)
const bible = JSON.parse(await readFile(new URL('src/content/nt-krv.json', root), 'utf8'))
const books = JSON.parse(await readFile(new URL('src/content/books.json', root), 'utf8'))
const audit = await readFile(new URL('docs/content-audit.md', root), 'utf8')

let errors = 0
const fail = (where, msg) => {
  errors++
  console.error(`✗ ${where}: ${msg}`)
}
// verify-pieces.mjs·catalog.ts의 noText와 같은 규칙
const noText = (text) => text === '(없음)' || /^\(\d+절에 포함되어 있음\)$/.test(text)

/** 편지로 엮는 책 (방 표 순서) → 본문 책 id */
const letterIds = SHELF_ROOMS.filter((r) => r.mode === 'letters').flatMap((r) => r.books).map(bibleIdOf)
const abbrToId = Object.fromEntries(books.map((b) => [b.abbr, b.id]))
const idToAbbr = Object.fromEntries(books.map((b) => [b.id, b.abbr]))
const letterAbbrs = new Set(letterIds.map((id) => idToAbbr[id]))

const fixture = process.argv[2]
let rows = []
try {
  rows = await readOpeningTxt(fixture ? pathToFileURL(fixture) : undefined)
} catch (e) {
  fail(fixture ?? 'letters/opening.txt', e.message)
}

const seen = new Set()
rows.forEach((r) => {
  const w = `${r.abbr} | ${r.roleLabel} | ${r.name} | ${r.ref}`
  const notWritten = r.name === NOT_WRITTEN
  if (!letterAbbrs.has(r.abbr)) fail(w, `편지 책이 아님 (${r.abbr}) — 서고 방 표의 편지 책: ${[...letterAbbrs].join(' ')}`)
  if (!(r.roleLabel in ROLES)) fail(w, `칸 이름 "${r.roleLabel}"은 ${Object.keys(ROLES).map((k) => `"${k}"`).join('·')} 중 하나여야 함`)
  const key = `${r.abbr}\u0000${r.roleLabel}\u0000${r.name}`
  if (seen.has(key)) fail(w, '같은 편지·칸에 같은 이름이 두 번')
  seen.add(key)

  const m = r.ref.match(/^(\S+) (\d+):(\d+)(?:-(\d+))?$/)
  if (!m) {
    fail(w, '구절은 "책 장:절" 모양이어야 함')
    return
  }
  const [, refAbbr, chS, fromS, toS] = m
  const ch = Number(chS)
  const from = Number(fromS)
  const to = toS ? Number(toS) : from
  if (refAbbr !== r.abbr) fail(w, `구절의 책(${refAbbr})이 줄의 책(${r.abbr})과 다름`)
  if (ch !== 1) fail(w, '첫머리 구절은 그 편지 1장 안이어야 함')
  if (toS && !notWritten) fail(w, '이름 줄의 구절은 한 절이어야 함 (범위는 "적혀 있지 않음" 줄만)')
  if (to < from) fail(w, '구절 범위가 거꾸로임')
  const chapter = bible[abbrToId[refAbbr]]?.[ch - 1]
  const verses = []
  for (let v = from; v <= to; v++) {
    const text = chapter?.[v - 1]
    if (text === undefined) {
      fail(w, `없는 구절 ${refAbbr} ${ch}:${v}`)
      return
    }
    if (noText(text)) fail(w, `본문이 없는 절 ${refAbbr} ${ch}:${v} "${text}"`)
    verses.push(text)
  }

  if (notWritten) {
    // 이름 검사는 하지 않는다 — 대신 content-audit에 그 범위와 까닭이 있어야 한다
    const noted = audit.split('\n').some((line) => line.includes(r.ref) && line.includes(NOT_WRITTEN))
    if (!noted) fail(w, `content-audit.md에 "${r.ref}"와 "${NOT_WRITTEN}"이 함께 적힌 줄(까닭)이 없음`)
    return
  }
  if (/\s/.test(r.name)) fail(w, '이름에 띄어쓰기가 있음')
  const flat = verses[0].replace(/\s+/g, '')
  if (!flat.includes(r.name)) fail(w, `이름 "${r.name}"이 본문에 없음 — "${verses[0]}"`)
})

// 편지마다 칸 채움: 보낸 이 하나 이상, 받는 곳/받는 사람 하나 이상. "적혀 있지 않음" 칸에는 다른 이름 없음
const checkBooks = fixture ? [...new Set(rows.map((r) => r.abbr))].filter((a) => letterAbbrs.has(a)) : [...letterAbbrs]
for (const abbr of checkBooks) {
  const mine = rows.filter((r) => r.abbr === abbr)
  if (!mine.some((r) => r.roleLabel === '보낸 이')) fail(abbr, '"보낸 이" 줄이 없음')
  if (!mine.some((r) => r.roleLabel === '받는 곳' || r.roleLabel === '받는 사람')) fail(abbr, '"받는 곳"이나 "받는 사람" 줄이 없음')
  for (const label of Object.keys(ROLES)) {
    const inRole = mine.filter((r) => r.roleLabel === label)
    if (inRole.some((r) => r.name === NOT_WRITTEN) && inRole.length > 1) fail(abbr, `"${label}" 칸에 "${NOT_WRITTEN}"과 다른 줄이 함께 있음`)
  }
}

if (!fixture) {
  let json = null
  try {
    json = JSON.parse(await readFile(LETTERS_JSON, 'utf8'))
  } catch (e) {
    fail('letters.json', `읽을 수 없음 — node scripts/build-letters.mjs (${e.message})`)
  }
  let expected = null
  try {
    expected = toEntries(rows, abbrToId)
  } catch {
    // 칸·책 오류는 위에서 이미 셌다
  }
  if (json && expected && JSON.stringify(json) !== JSON.stringify(expected)) fail('letters.json', 'scripts/letters/opening.txt와 다름 — node scripts/build-letters.mjs')
}

if (errors) {
  console.error(`\n✗ verify-letters 실패: 오류 ${errors}개`)
  process.exit(1)
}
console.log(`✓ verify-letters 통과 (편지 ${checkBooks.length}권, ${rows.length}줄)`)

// 구약 본문 정확도 게이트 (계획 20 작업 2). 오류가 하나라도 있으면 exit 1 → 빌드를 막는다.
// - src/content/ot/<id>.json 39파일이 모두 있고, 장 수가 책 표(src/engine/ot-books.ts)와 같다
// - 모든 절이 글자열이고 비어 있지 않다 ('(없음)'·'(N절에 포함되어 있음)'은 신약의 noText 규칙대로 허용하되 목록으로 알린다)
// - 가장 긴 절이 필사 쓰다 만 입력 한도(copying.ts DRAFT_MAX) 아래다
// - 이상한 제어 문자·깨진 글자(U+FFFD)·태그가 없고 앞뒤 공백이 없다
// - KRV_DIR(또는 --krv)의 원본이 있으면 글자까지 같다 (없으면 이 비교만 건너뛰고 "원본 비교 생략"을 알린다). 창 1:3은 원본 파일의 같은 절과도 대조한다
// 사용: node scripts/verify-ot.mjs [--data 폴더] [--krv 원본폴더] [--stats]
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { OT_BOOK_TABLE } from '../src/engine/ot-books.ts'

const rootPath = fileURLToPath(new URL('../', import.meta.url))
const args = process.argv.slice(2)
const opt = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const dataDir = path.resolve(opt('--data') ?? path.join(rootPath, 'src', 'content', 'ot'))
const krvDir = path.resolve(opt('--krv') ?? process.env.KRV_DIR ?? path.join(rootPath, '..', 'jaramlog-v2', 'public', 'bible', 'krv'))
const wantStats = args.includes('--stats')

let errors = 0
const fail = (where, msg) => {
  errors++
  if (errors <= 60) console.error(`✗ ${where}: ${msg}`)
}
// catalog.ts의 noText와 같은 규칙
const noText = (text) => text === '(없음)' || /^\(\d+절에 포함되어 있음\)$/.test(text)
const BAD_CHAR = new RegExp('[\u0000-\u001F\u007F-\u009F\uFFFD\uFFFE\uFFFF\u200B-\u200F\u2028\u2029\uFEFF]')
const TAG = /<\/?[A-Za-z!][^>]*>/

const copyingSrc = await readFile(path.join(rootPath, 'src', 'engine', 'copying.ts'), 'utf8')
const dm = copyingSrc.match(/const DRAFT_MAX = (\d+)/)
if (!dm) {
  console.error('✗ copying.ts에서 DRAFT_MAX를 찾지 못함')
  process.exit(1)
}
const DRAFT_MAX = Number(dm[1])

const compareKrv = existsSync(krvDir)
const data = {}
const hidden = []
let verses = 0
let chapters = 0
let longest = { len: 0, at: '' }
let bytes = 0
let gz = 0
const perBook = []

for (const [i, row] of OT_BOOK_TABLE.entries()) {
  const file = path.join(dataDir, `${row.id}.json`)
  let text
  try {
    text = await readFile(file, 'utf8')
  } catch {
    fail(row.id, `파일이 없음 (${file})`)
    continue
  }
  let book
  try {
    book = JSON.parse(text)
  } catch (e) {
    fail(row.id, `JSON이 아님 ${e.message}`)
    continue
  }
  if (!Array.isArray(book) || !book.every((c) => Array.isArray(c))) {
    fail(row.id, '장 → 절 배열(string[][])이 아님')
    continue
  }
  data[row.id] = book
  if (book.length !== row.chapters) fail(row.id, `장 수 ${book.length} ≠ 표 ${row.chapters}`)
  const buf = Buffer.from(text)
  const z = gzipSync(buf).length
  bytes += buf.length
  gz += z
  let bookVerses = 0
  book.forEach((ch, ci) => {
    chapters++
    if (ch.length === 0) fail(`${row.id} ${ci + 1}장`, '절이 없음')
    ch.forEach((t, vi) => {
      const at = `${row.abbr} ${ci + 1}:${vi + 1}`
      verses++
      bookVerses++
      if (typeof t !== 'string') return fail(at, '절이 글자열이 아님')
      if (t.trim() === '') return fail(at, '빈 절')
      if (noText(t)) hidden.push(at)
      if (BAD_CHAR.test(t)) fail(at, `이상한 제어·깨진 글자 (${JSON.stringify(t.match(BAD_CHAR)[0])})`)
      if (TAG.test(t)) fail(at, '태그가 있음')
      if (t !== t.trim()) fail(at, '앞뒤 공백이 있음')
      if (t.length >= DRAFT_MAX) fail(at, `절이 ${t.length}자 — DRAFT_MAX ${DRAFT_MAX} 이상`)
      if (t.length > longest.len) longest = { len: t.length, at }
    })
  })
  perBook.push({ id: row.id, name: row.name, chapters: book.length, verses: bookVerses, bytes: buf.length, gzip: z })

  // 원본과 글자까지 같은가
  if (compareKrv) {
    book.forEach((ch, ci) => {
      const f = path.join(krvDir, String(i + 1), `${ci + 1}.json`)
      let src
      try {
        src = JSON.parse(readFileSyncUtf8(f)).v
      } catch {
        return fail(`${row.id} ${ci + 1}장`, `원본을 읽지 못함 ${f}`)
      }
      if (src.length !== ch.length) return fail(`${row.id} ${ci + 1}장`, `절 수 ${ch.length} ≠ 원본 ${src.length}`)
      src.forEach(([n, t], vi) => {
        if (n !== vi + 1) fail(`${row.id} ${ci + 1}장`, `원본 절 번호가 ${vi + 1}번째 자리에 ${n}`)
        if (ch[vi] !== t) fail(`${row.abbr} ${ci + 1}:${vi + 1}`, '원본과 글자가 다름')
      })
    })
    if (existsSync(path.join(krvDir, String(i + 1), `${row.chapters + 1}.json`))) fail(row.id, `원본에 ${row.chapters + 1}장이 더 있음`)
  }
}

// 창 1:3 — 글자 그대로의 닻. 원본 파일이 있으면 그 절과도 같아야 한다
const GEN_1_3 = '하나님이 가라사대 빛이 있으라 하시매 빛이 있었고'
if (data.gen) {
  if (data.gen[0]?.[2] !== GEN_1_3) fail('창 1:3', '개역한글 창 1:3과 다름')
  if (compareKrv) {
    const src = JSON.parse(readFileSyncUtf8(path.join(krvDir, '1', '1.json'))).v.find(([n]) => n === 3)?.[1]
    if (src !== data.gen[0]?.[2]) fail('창 1:3', '원본 파일의 같은 절과 다름')
  }
}

import { readFileSync } from 'node:fs'
function readFileSyncUtf8(f) {
  return readFileSync(f, 'utf8')
}

if (wantStats) {
  console.log(JSON.stringify({ books: perBook.length, chapters, verses, bytes, gzip: gz, longest, hidden, perBook }, null, 1))
}
if (hidden.length) console.log(`  본문이 없는 절 ${hidden.length}곳 (허용, 화면에서는 감춤): ${hidden.join(', ')}`)
if (!compareKrv) console.log(`  원본 비교 생략 (KRV_DIR 없음: ${krvDir})`)
if (errors) {
  console.error(`✗ verify-ot 실패 (${errors}건)`)
  process.exit(1)
}
console.log(`✓ verify-ot 통과 (${perBook.length}권 ${chapters}장 ${verses}절, 가장 긴 절 ${longest.len}자 ${longest.at}${compareKrv ? ', 원본과 글자까지 같음' : ''})`)

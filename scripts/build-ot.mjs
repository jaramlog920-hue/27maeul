// 구약 본문 만들기 (계획 20 작업 2, 결정 D1). 개역한글 원본(KRV_DIR)의 <순번 1..39>/<장>.json({"v":[[절,본문],…]})을
// 책별 string[][](장 → 절 배열, 신약 bible-subset.json과 같은 모양)로 src/content/ot/<id>.json에 쓴다.
// 책 표는 src/engine/ot-books.ts(OT_BOOK_TABLE) 한곳에서 읽는다. 글자는 한 글자도 고치지 않는다.
// 절 번호가 1부터 빠짐없이 이어지지 않거나 장 수가 표와 다르면 아무것도 쓰지 않고 실패한다(exit 1).
// 사용: node scripts/build-ot.mjs   (KRV_DIR 기본 ../jaramlog-v2/public/bible/krv, OUT_DIR 기본 src/content/ot)
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { OT_BOOK_TABLE } from '../src/engine/ot-books.ts'

const root = new URL('../', import.meta.url)
const rootPath = fileURLToPath(root)
const krvDir = path.resolve(process.env.KRV_DIR ?? path.join(rootPath, '..', 'jaramlog-v2', 'public', 'bible', 'krv'))
const outDir = path.resolve(process.env.OUT_DIR ?? path.join(rootPath, 'src', 'content', 'ot'))

const errors = []
const books = {}
for (const [i, row] of OT_BOOK_TABLE.entries()) {
  const folder = i + 1
  const chapters = []
  for (let c = 1; c <= row.chapters; c++) {
    const file = path.join(krvDir, String(folder), `${c}.json`)
    let raw
    try {
      raw = JSON.parse(await readFile(file, 'utf8'))
    } catch (e) {
      errors.push(`${row.id} ${c}장: 원본을 읽지 못함 (${file}) ${e.message}`)
      break
    }
    const v = raw?.v
    if (!Array.isArray(v) || v.length === 0) {
      errors.push(`${row.id} ${c}장: 절 목록이 없음`)
      continue
    }
    const verses = []
    v.forEach((pair, k) => {
      if (!Array.isArray(pair) || pair[0] !== k + 1 || typeof pair[1] !== 'string') {
        errors.push(`${row.id} ${c}장: ${k + 1}번째 자리에 절 ${Array.isArray(pair) ? pair[0] : '?'}이 있음 (절 번호가 1부터 빠짐없이 이어져야 함)`)
      } else verses.push(pair[1])
    })
    chapters.push(verses)
  }
  // 표보다 장이 더 있는 원본도 막는다
  try {
    await readFile(path.join(krvDir, String(folder), `${row.chapters + 1}.json`), 'utf8')
    errors.push(`${row.id}: 원본에 ${row.chapters + 1}장이 더 있음 (표는 ${row.chapters}장)`)
  } catch {
    /* 없어야 정상 */
  }
  if (chapters.length !== row.chapters) errors.push(`${row.id}: 장 수 ${chapters.length} ≠ 표 ${row.chapters}`)
  books[row.id] = chapters
}

if (errors.length) {
  console.error(`✗ build-ot 실패 — 아무것도 쓰지 않음 (${errors.length}건)`)
  for (const e of errors.slice(0, 40)) console.error(`  ${e}`)
  process.exit(1)
}

await mkdir(outDir, { recursive: true })
for (const row of OT_BOOK_TABLE) await writeFile(path.join(outDir, `${row.id}.json`), JSON.stringify(books[row.id]))
const total = Object.values(books).reduce((n, b) => n + b.length, 0)
console.log(`✓ build-ot: ${OT_BOOK_TABLE.length}권 ${total}장 → ${outDir}`)

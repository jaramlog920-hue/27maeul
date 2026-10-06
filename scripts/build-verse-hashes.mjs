// 66권 전체 절의 해시 목록 만들기 (계획 20 작업 5). 신약 bible-subset.json + 구약 src/content/ot/<id>.json의 모든 절
// (본문이 없는 절 제외)을 verseHash로 줄여 정렬·중복 없이 src/content/verse-hashes.json에 쓴다.
// 구약 빈칸 오답 보기가 다른 책의 실제 본문이 되지 않게 하는 검사에 쓴다 (ot-catalog.ts countAnywhere).
// 사용: node scripts/build-verse-hashes.mjs [--check]   (--check: 파일이 지금 본문에서 만든 것과 같은지만 확인, 다르면 exit 1)
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { OT_BOOK_TABLE } from '../src/engine/ot-books.ts'
import { verseHash, verseNoText } from '../src/content/verse-hash.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const content = path.join(root, 'src', 'content')
const outFile = path.join(content, 'verse-hashes.json')

export async function buildJoined() {
  const all = new Set()
  let verses = 0
  const add = (book) => {
    for (const ch of book) for (const t of ch) if (!verseNoText(t)) (verses++, all.add(verseHash(t)))
  }
  const nt = JSON.parse(await readFile(path.join(content, 'bible-subset.json'), 'utf8'))
  for (const b of Object.values(nt)) add(b)
  for (const row of OT_BOOK_TABLE) add(JSON.parse(await readFile(path.join(content, 'ot', `${row.id}.json`), 'utf8')))
  return { joined: [...all].sort().join(''), count: all.size, verses }
}

const { joined, count, verses } = await buildJoined()
const text = JSON.stringify({ n: count, h: joined })
if (process.argv.includes('--check')) {
  let cur = ''
  try {
    cur = await readFile(outFile, 'utf8')
  } catch {
    /* 없으면 아래에서 실패 */
  }
  if (cur !== text) {
    console.error('✗ verse-hashes.json이 본문과 다름 — npm run build:verse-hashes 로 다시 만든다')
    process.exit(1)
  }
  console.log(`✓ verse-hashes 일치 (${count}개, 절 ${verses})`)
} else {
  await writeFile(outFile, text)
  console.log(`✓ build-verse-hashes: 절 ${verses} → 해시 ${count}개 → ${outFile}`)
}

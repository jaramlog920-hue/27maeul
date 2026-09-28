// 사용: node scripts/dump-ref.mjs "마 28:11-15" "요 9:8-9" — 콘텐츠 작성 시 본문을 기억이 아니라 여기서 꺼낸다
import { readFile } from 'node:fs/promises'
import { expandRef } from '../src/content/ref.ts'
const root = new URL('../', import.meta.url)
const bible = JSON.parse(await readFile(new URL('src/content/nt-krv.json', root), 'utf8'))
const books = JSON.parse(await readFile(new URL('src/content/books.json', root), 'utf8'))
const byAbbr = Object.fromEntries(books.map((b) => [b.abbr, b.id]))
for (const ref of process.argv.slice(2)) {
  console.log(`\n## ${ref}`)
  for (const k of expandRef(ref, byAbbr)) console.log(`${k.chapter}:${k.verse} ${bible[k.bookId][k.chapter - 1][k.verse - 1]}`)
}

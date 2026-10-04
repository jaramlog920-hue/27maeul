// 하나님 기록 줄 파일 → src/content/god-records.json (계획 14 작업 3)
// 사용: node scripts/build-god-records.mjs && npm run verify
import { readFile, writeFile } from 'node:fs/promises'
import { GOD_JSON, bookFiles, readBookLines, readKeywords, toJson } from './god-records-parse.mjs'

const books = JSON.parse(await readFile(new URL('../src/content/books.json', import.meta.url), 'utf8'))
const keywords = await readKeywords()
const perBook = []
for (const { book, url } of await bookFiles()) perBook.push({ book, rows: await readBookLines(url, `god-records/${book}.txt`) })
const json = toJson(keywords, perBook, books.map((b) => b.id))
await writeFile(GOD_JSON, JSON.stringify(json, null, 2) + '\n')
console.log(`god-records.json: 키워드 ${json.keywords.length}개, 기록 ${json.records.length}줄`)

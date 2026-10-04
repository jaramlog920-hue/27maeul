// 장별 필사 길잡이 원본 → src/content/chapter-guides.json (검토용 본문 근거 칸은 빼고 배경·살펴보기만)
// 사용: npm run build:chapter-guides && npm run verify
import { readFile, writeFile } from 'node:fs/promises'
import { GUIDE_JSON, readGuideRows, toGuideJson } from './chapter-guides-parse.mjs'

const books = JSON.parse(await readFile(new URL('../src/content/books.json', import.meta.url), 'utf8'))
const { rows } = await readGuideRows()
const json = toGuideJson(rows, books)
await writeFile(GUIDE_JSON, JSON.stringify(json, null, 1) + '\n')
const chapters = Object.values(json).reduce((n, b) => n + Object.keys(b).length, 0)
console.log(`chapter-guides.json: 책 ${Object.keys(json).length}권, 장 ${chapters}개`)

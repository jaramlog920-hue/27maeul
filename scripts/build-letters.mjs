// scripts/letters/opening.txt → src/content/letters.json (편지 첫머리의 보낸 이·받는 이)
// 사용: node scripts/build-letters.mjs && npm run verify
import { readFile, writeFile } from 'node:fs/promises'
import { LETTERS_JSON, readOpeningTxt, toEntries } from './letters-parse.mjs'

const books = JSON.parse(await readFile(new URL('../src/content/books.json', import.meta.url), 'utf8'))
const abbrToId = Object.fromEntries(books.map((b) => [b.abbr, b.id]))
const entries = toEntries(await readOpeningTxt(), abbrToId)
await writeFile(LETTERS_JSON, JSON.stringify(entries, null, 2) + '\n')
console.log(`letters.json: ${entries.length}줄`)

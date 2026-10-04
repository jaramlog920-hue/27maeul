// 연결 이름 목록 → src/content/connections.json (계획 14 작업 9)
// 사용: node scripts/build-connections.mjs && npm run verify
import { readFile, writeFile } from 'node:fs/promises'
import { CONNECTIONS_JSON, bibleTools, readNames, toJson } from './connections-parse.mjs'

const root = new URL('../', import.meta.url)
const bible = JSON.parse(await readFile(new URL('src/content/nt-krv.json', root), 'utf8'))
const books = JSON.parse(await readFile(new URL('src/content/books.json', root), 'utf8'))
const json = toJson(await readNames(), bibleTools(bible, books))
await writeFile(CONNECTIONS_JSON, JSON.stringify(json, null, 1) + '\n')
console.log(`connections.json: 이름 ${json.names.length}개, 구절 ${json.names.reduce((n, e) => n + e.refs.length, 0)}곳`)

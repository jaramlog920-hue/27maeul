// 앱이 쓰는 책만 떼어 낸다 (번들 크기). 원본 nt-krv.json은 검증용으로 그대로 둔다.
// 사용: node scripts/build-bible-subset.mjs  — verify-pieces가 원본과 한 글자라도 다르면 빌드를 막는다.
// 책 목록은 서고 방 표(src/engine/shelf-rooms.ts의 SUBSET_BOOKS) 한곳에서 읽는다.
import { readFile, writeFile } from 'node:fs/promises'
import { SUBSET_BOOKS } from '../src/engine/shelf-rooms.ts'

const root = new URL('../', import.meta.url)
const full = JSON.parse(await readFile(new URL('src/content/nt-krv.json', root), 'utf8'))
const subset = Object.fromEntries(SUBSET_BOOKS.map((b) => [b, full[b]]))
await writeFile(new URL('src/content/bible-subset.json', root), JSON.stringify(subset))
console.log(`bible-subset.json: ${SUBSET_BOOKS.join(', ')}`)

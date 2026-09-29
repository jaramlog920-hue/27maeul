// scripts/pieces/{mt,mk,lk,jn,ac}.txt → src/content/pieces.json
// 한 줄 = "책 범위 | 제목 | 도장들". 도장은 "=마 3:1-6"(같은 이야기), "~막 1:1-6"(비슷한 이야기)을 ; 로 잇는다. # 줄은 주석.
// 사도행전(행, ac)은 도장 칸을 비운다 — 도장은 네 복음서끼리만 (verify가 막는다).
// 제목 낱말은 본문에 있어야 하고(verify), 도장 판단 근거는 docs/content-audit.md에 적는다.
// 사용: node scripts/build-pieces.mjs && npm run verify
import { readFile, writeFile } from 'node:fs/promises'

const ABBR = { 마: 'mt', 막: 'mk', 눅: 'lk', 요: 'jn', 행: 'ac' }
const ORDER = ['mt', 'mk', 'lk', 'jn', 'ac']
const pieces = []
for (const book of ORDER) {
  let src
  try {
    src = await readFile(new URL(`./pieces/${book}.txt`, import.meta.url), 'utf8')
  } catch {
    continue // 아직 조각이 없는 책
  }
  for (const line of src.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))) {
    const [ref, title, stampText = ''] = line.split('|').map((s) => s.trim())
    const m = ref.match(/^(\S+) (\d+):(\d+)/)
    if (!m || ABBR[m[1]] !== book) throw new Error(`${book}.txt: bad line: ${line}`)
    const stamps = stampText
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const kind = s[0] === '=' ? 'same' : s[0] === '~' ? 'similar' : null
        const r = s.slice(1).trim()
        const sb = ABBR[r.split(' ')[0]]
        if (!kind || !sb) throw new Error(`bad stamp "${s}" in ${line}`)
        return { kind, book: sb, ref: r }
      })
    pieces.push({ id: `${book}-${m[2].padStart(3, '0')}-${m[3].padStart(3, '0')}`, book, ref, chapter: Number(m[2]), title, stamps })
  }
}
await writeFile(new URL('../src/content/pieces.json', import.meta.url), JSON.stringify(pieces, null, 2) + '\n')
console.log(`pieces.json: ${pieces.length}개 (${ORDER.map((b) => `${b} ${pieces.filter((p) => p.book === b).length}`).join(', ')})`)

// docs/content-audit.md의 요약 수치와 "전체 표"를 pieces.json에서 다시 만든다.
// 사용: node scripts/audit-table.mjs
import { readFile, writeFile } from 'node:fs/promises'
const root = new URL('../', import.meta.url)
const pieces = JSON.parse(await readFile(new URL('src/content/pieces.json', root), 'utf8'))
const docUrl = new URL('docs/content-audit.md', root)
let doc = await readFile(docUrl, 'utf8')
const lk = pieces.filter((p) => p.book === 'lk')
const only = lk.filter((p) => p.stamps.length === 0).length
const same = lk.filter((p) => p.stamps.some((s) => s.kind === 'same')).length
doc = doc
  .replace(/- 조각 \d+개가 눅 1:1–24:53을/, `- 조각 ${lk.length}개가 눅 1:1–24:53을`)
  .replace(/- 네 복음서 중 누가복음에만 있는 조각: \d+개/, `- 네 복음서 중 누가복음에만 있는 조각: ${only}개`)
  .replace(/- "같은 이야기" 도장이 하나 이상 있는 조각: \d+개/, `- "같은 이야기" 도장이 하나 이상 있는 조각: ${same}개`)
const rows = pieces.map(
  (p) =>
    `| ${p.ref} | ${p.title} | ${p.stamps.length ? p.stamps.map((s) => `${s.kind === 'same' ? '같음' : '비슷'} ${s.ref}`).join('<br>') : `**${{ mt: '마태', mk: '마가', lk: '누가', jn: '요한' }[p.book]}에만**`} |`,
)
const head = '## 7. 전체 표\n\n| 조각 | 제목 | 도장 |\n|---|---|---|\n'
doc = doc.slice(0, doc.indexOf('## 7. 전체 표')) + head + rows.join('\n') + '\n'
await writeFile(docUrl, doc)
console.log(`content-audit.md: ${lk.length}개 (누가에만 ${only}, 같은 이야기 ${same})`)

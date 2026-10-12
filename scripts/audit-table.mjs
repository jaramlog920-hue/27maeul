// 현재 소제목·관련 본문 표를 만들고 이전 검토 기록은 보존한다.
import {readFile,writeFile} from 'node:fs/promises'
const root = new URL('../', import.meta.url)
const pieces = JSON.parse(await readFile(new URL('src/content/pieces.json',root),'utf8'))
const url = new URL('docs/content-audit.md',root)
const doc = await readFile(url,'utf8')
const start = doc.indexOf('## 7. 전체 표')
if (start < 0) throw new Error('전체 표 위치 없음')
const rows = pieces.map(p => '| ' + p.ref + ' | ' + p.title + ' | ' + (p.stamps.map(s => (s.kind === 'related' ? '관련 본문' : s.kind === 'same' ? '같음' : '비슷') + ' ' + (s.label ?? s.ref)).join('<br>') || '표시 없음') + ' |')
await writeFile(url,doc.slice(0,start) + '## 7. 전체 표\n\n대한성서공회 개역한글 소제목 기준. 이전 자체 판정은 이 표에 사용하지 않는다.\n\n| 조각 | 소제목 | 관련 본문 |\n|---|---|---|\n' + rows.join('\n') + '\n')
console.log('현재 표 ' + pieces.length + '개 갱신')

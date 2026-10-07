// 구약 장별 길잡이를 쓸 때 본문 확인용: 장마다 첫 절과 몇 절(약 다섯 절마다 앞부분)을 뽑아 본다.
// 사용: node scripts/ot-chapter-anchors.mjs gen [시작장] [끝장]  — 결과는 화면에만 (파일을 만들지 않는다)
import { readFileSync } from 'node:fs'

const [id, from = '1', to = '999', step = '4', width = '46'] = process.argv.slice(2)
const book = JSON.parse(readFileSync(new URL(`../src/content/ot/${id}.json`, import.meta.url), 'utf8'))
const cut = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s)
for (let c = Number(from); c <= Math.min(Number(to), book.length); c++) {
  const vs = book[c - 1]
  const picks = []
  for (let v = 0; v < vs.length; v += Number(step)) picks.push(`${v + 1}:${cut(vs[v], v === 0 ? 70 : Number(width))}`)
  if ((vs.length - 1) % Number(step) !== 0) picks.push(`${vs.length}:${cut(vs[vs.length - 1], Number(width))}`)
  console.log(`[${c}장 ${vs.length}절] ${picks.join(' / ')}`)
}

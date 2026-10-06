// 2026-10-07 사용자: 모든 닫기는 오른쪽에 — 닫기 단추(<button …>{T.ui.close}</button>, >닫기<)에 data-close를 달아 CSS 한 곳에서 오른쪽으로 보낸다.
// 사용: node scripts/mark-close-buttons.mjs  (여러 번 돌려도 같다)
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const LABEL = /(\{T\.ui\.close\}|\{T\.common\.close\}|\{t\('common\.close'\)\}|닫기)\s*<\/button>/
const files = []
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (p.endsWith('.tsx') && !p.endsWith('.test.tsx')) files.push(p)
  }
}
walk('src/features')
let changed = 0
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  let out = ''
  let i = 0
  let n = 0
  // 단추 하나씩: 여는 태그 시작 ~ </button> 사이에 닫기 글이 있고 다른 <button이 끼지 않으면 표시
  const re = /<button\b/g
  let m
  while ((m = re.exec(text))) {
    const start = m.index
    const end = text.indexOf('</button>', start)
    if (end < 0) break
    const body = text.slice(start, end + 9)
    if (body.indexOf('<button', 1) !== -1 || !LABEL.test(body) || body.includes('data-close')) continue
    // 단추 안 글이 닫기 하나뿐인 것만 (다른 글이 섞인 단추는 그대로)
    const inner = body.slice(body.indexOf('>', body.search(/onClick|className|aria|disabled|key|>/)) + 1, -9).trim()
    if (!/^(\{T\.ui\.close\}|\{T\.common\.close\}|\{t\('common\.close'\)\}|닫기)$/.test(inner)) continue
    out += text.slice(i, start + 7) + ' data-close'
    i = start + 7
    n++
  }
  out += text.slice(i)
  if (n) {
    writeFileSync(f, out)
    changed += n
    console.log(`${n}\t${f}`)
  }
}
console.log(`표시한 닫기 단추 ${changed}개`)

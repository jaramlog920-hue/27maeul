// 사랑의 계명 (2026-10-14 사용자, 신약만 — 10-17 구약 취소): scripts/love-commands/<게임 책 id>.txt → src/content/love-commands.json, 그리고 정확도 검사.
// 줄: "갈래 | 약어 장:절" — 갈래는 '크고 첫째 되는 계명'·'하나님 사랑'·'이웃 사랑' 중 하나.
// 검사(오류가 하나라도 있으면 exit 1 → prebuild가 빌드를 막는다):
// - 파일 이름이 게임 책 id(신약 mt·mk·lk·jn·ac·rom…, 구약 gen·exo…), 구절의 약어가 그 책
// - 그 절이 실제로 있고 본문이 있다 ('(없음)'·'(n절에 포함되어 있음)'이 아님)
// - 같은 구절이 두 번 없다 (한 구절은 한 갈래에만)
// - json이 줄 파일과 같다 (--check)
// 내용 판단(그 절에 하나님 사랑·이웃 사랑의 명령이 직접 들어 있는지)은 워크플로 찾기·반대 검증 + 사람 검토로 한다.
// 사용: node scripts/build-love-commands.mjs        → json을 쓴다
//       node scripts/build-love-commands.mjs --check → 쓰지 않고 검사만
import { readFile, readdir, writeFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const DIR = new URL('scripts/love-commands/', root)
const OUT = new URL('src/content/love-commands.json', root)
export const BRANCHES = ['크고 첫째 되는 계명', '하나님 사랑', '이웃 사랑']
const NT_GAME = { mat: 'mt', mrk: 'mk', luk: 'lk', jhn: 'jn', act: 'ac' }

const books = JSON.parse(await readFile(new URL('src/content/books.json', root), 'utf8'))
const nt = JSON.parse(await readFile(new URL('src/content/nt-krv.json', root), 'utf8'))
const otSrc = await readFile(new URL('src/engine/ot-books.ts', root), 'utf8')
const ot = [...otSrc.matchAll(/\{ id: '(\w+)', name: '([^']+)', abbr: '([^']+)', chapters: (\d+) \}/g)].map((m) => ({ id: m[1], name: m[2], abbr: m[3] }))
const ORDER = [...ot.map((b) => b.id), ...books.map((b) => NT_GAME[b.id] ?? b.id)]
const BOOK = {}
for (const b of books) BOOK[NT_GAME[b.id] ?? b.id] = { name: b.name, abbr: b.abbr, text: nt[b.id] }
for (const b of ot) BOOK[b.id] = { name: b.name, abbr: b.abbr, text: JSON.parse(await readFile(new URL(`src/content/ot/${b.id}.json`, root), 'utf8')) }

const noText = (t) => !t || t.trim() === '(없음)' || /^\(\d+절에 포함되어 있음\)$/.test(t.trim())
let errors = 0
const fail = (where, msg) => {
  errors++
  console.error(`✗ ${where}: ${msg}`)
}

const records = []
const files = (await readdir(DIR)).filter((f) => f.endsWith('.txt'))
for (const f of files) {
  const id = f.slice(0, -4)
  const book = BOOK[id]
  if (!book) {
    fail(f, '게임 책 id가 아닌 파일 이름')
    continue
  }
  const seen = new Set()
  const lines = (await readFile(new URL(f, DIR), 'utf8')).split(/\r?\n/)
  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (!line || line.startsWith('#')) return
    const where = `${f}:${i + 1}`
    const m = line.match(/^(.+?)\s*\|\s*(\S+)\s+(\d+):(\d+)$/)
    if (!m) return fail(where, `"갈래 | 약어 장:절" 꼴이 아님 — ${line}`)
    const [, branch, abbr, ch, v] = m
    if (!BRANCHES.includes(branch)) return fail(where, `없는 갈래 "${branch}"`)
    if (abbr !== book.abbr) return fail(where, `${book.name} 파일에 다른 책(${abbr}) 구절`)
    const chapter = Number(ch), verse = Number(v)
    const text = book.text[chapter - 1]?.[verse - 1]
    if (text === undefined) return fail(where, `${book.name}에 없는 절 ${abbr} ${ch}:${v}`)
    if (noText(text)) return fail(where, `본문이 없는 절 "${text}"`)
    const ref = `${abbr} ${chapter}:${verse}`
    if (seen.has(ref)) return fail(where, `같은 구절이 두 번 (${ref})`)
    seen.add(ref)
    records.push({ branch, ref, book: id, chapter, verse })
  })
}
records.sort((a, b) => ORDER.indexOf(a.book) - ORDER.indexOf(b.book) || a.chapter - b.chapter || a.verse - b.verse)
const json = JSON.stringify({ branches: BRANCHES, records }, null, 2) + '\n'
if (process.argv.includes('--check')) {
  const now = await readFile(OUT, 'utf8').catch(() => '')
  if (now.replace(/\r\n/g, '\n') !== json) fail('love-commands.json', '줄 파일과 다름 — node scripts/build-love-commands.mjs 로 다시 만들기')
} else if (!errors) await writeFile(OUT, json)
if (errors) {
  console.error(`사랑의 계명: 오류 ${errors}개`)
  process.exit(1)
}
console.log(`✓ 사랑의 계명 ${records.length}절 (책 ${new Set(records.map((r) => r.book)).size}권)`)

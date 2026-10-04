// 연결(사람·곳) 정확도 게이트 (계획 14 작업 9). 오류가 하나라도 있으면 exit 1 → prebuild가 빌드를 막는다.
// names.txt 줄마다:
// - 이름이 비어 있지 않고 겹치지 않음, 무리는 사람·곳 중 하나, 찾는 말이 비어 있지 않고 한 줄 안에서 겹치지 않음
// - 범위·빼기 참조가 풀리고 그 절이 실제로 있음
// - 빼기 절마다 찾는 말이 실제로 있음 (없으면 쓸모없는 빼기 — 범위가 있으면 범위 안이어야 함)
// - 나오는 절이 하나 이상
// 줄끼리:
// - 같은 찾는 말을 쓰는 줄은 "같은 이름" 무리가 같아야 함 (동명이인을 모르고 두 번 넣는 일을 막는다)
// - 같은 "같은 이름" 무리의 줄끼리는 한 절도 겹치지 않음
// connections.json (전체 검사 때만):
// - 이름 목록에서 다시 찾은 것과 같음
// - 적힌 절마다: 실제로 있음, 본문이 없는 절 아님, 그 줄의 찾는 말이 본문에 글자 그대로 (말의 첫머리로) 있음, 빼기 절 아님
// 내용 판단(그 이름이 그 사람·곳인지)은 opus 검토 + docs/content-audit.md §6-13에 적는다.
// 사용: node scripts/verify-connections.mjs [픽스처.txt]  — 픽스처를 주면 names.txt 대신 그 파일만 보고 json 대조는 하지 않는다.
//       node scripts/verify-connections.mjs --show <이름>  — 그 이름이 나오는 절을 본문과 함께 보여 준다 (검토용).
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { CONNECTIONS_JSON, KINDS, bibleTools, findRefs, hasWord, noText, readNames, toJson } from './connections-parse.mjs'

const root = new URL('../', import.meta.url)
const bible = JSON.parse(await readFile(new URL('src/content/nt-krv.json', root), 'utf8'))
const books = JSON.parse(await readFile(new URL('src/content/books.json', root), 'utf8'))
const tools = bibleTools(bible, books)

let errors = 0
const fail = (where, msg) => {
  errors++
  console.error(`✗ ${where}: ${msg}`)
}

const argv = process.argv.slice(2)
if (argv[0] === '--show') {
  const want = argv.slice(1).join(' ')
  const e = (await readNames()).find((x) => x.name === want)
  if (!e) {
    console.error(`✗ 목록에 없는 이름 ${want}`)
    process.exit(1)
  }
  const refs = findRefs(e, tools)
  console.log(`## ${e.name} (${e.kind}) — ${refs.length}곳 · 찾는 말 ${e.words.join('·')}${e.scope ? ` · 범위 ${e.scope}` : ''}${e.exclude ? ` · 빼기 ${e.exclude}` : ''}`)
  for (const r of refs) console.log(`${r}  ${tools.textOf(r)}`)
  process.exit(0)
}
const fixture = argv[0]

let entries = []
try {
  entries = await readNames(fixture ? pathToFileURL(fixture) : undefined)
} catch (e) {
  fail(fixture ?? 'connections/names.txt', e.message)
}

const names = new Set()
const found = new Map()
for (const e of entries) {
  const w = `${e.name}`
  if (names.has(e.name)) fail(w, '이름이 겹침')
  names.add(e.name)
  if (!KINDS.includes(e.kind)) fail(w, `무리 "${e.kind}"는 ${KINDS.join('·')} 중 하나여야 함`)
  if (e.words.some((x) => !x)) fail(w, '찾는 말이 비어 있음')
  if (new Set(e.words).size !== e.words.length) fail(w, '찾는 말이 겹침')
  let scope = null
  let exclude = []
  try {
    if (e.scope) scope = new Set(tools.expand(e.scope))
    if (e.exclude) exclude = tools.expand(e.exclude)
  } catch (err) {
    fail(w, `참조를 풀 수 없음 — ${err.message}`)
    continue
  }
  for (const r of exclude) {
    const text = tools.textOf(r)
    if (scope && !scope.has(r)) fail(w, `빼기 ${r}가 범위 밖 — 쓸모없는 빼기`)
    else if (!e.words.some((x) => hasWord(text, x))) fail(w, `빼기 ${r}에 찾는 말이 없음 — 쓸모없는 빼기 "${text}"`)
  }
  const refs = findRefs(e, tools)
  if (!refs.length) fail(w, '나오는 절이 없음')
  found.set(e.name, refs)
}

// 같은 찾는 말 → 같은 "같은 이름" 무리
const byWord = new Map()
for (const e of entries)
  for (const x of e.words) {
    const other = byWord.get(x)
    if (other && other.group !== e.group) fail(`${e.name}`, `찾는 말 "${x}"를 ${other.name}도 씀 — 동명이인이면 두 줄에 같은 "같은 이름"을 붙이고 범위·빼기로 가를 것`)
    if (!other) byWord.set(x, e)
  }
// 같은 무리의 줄끼리 겹치지 않음
for (let i = 0; i < entries.length; i++)
  for (let j = i + 1; j < entries.length; j++) {
    const a = entries[i]
    const b = entries[j]
    if (a.group !== b.group) continue
    const bs = new Set(found.get(b.name) ?? [])
    const both = (found.get(a.name) ?? []).filter((r) => bs.has(r))
    if (both.length) fail(`${a.name} · ${b.name}`, `같은 이름 "${a.group}" 무리인데 같은 절에 둘 다 — ${both.slice(0, 5).join(', ')}${both.length > 5 ? ` 외 ${both.length - 5}곳` : ''}`)
  }

let total = 0
if (!fixture) {
  let json = null
  try {
    json = JSON.parse(await readFile(CONNECTIONS_JSON, 'utf8'))
  } catch (e) {
    fail('connections.json', `읽을 수 없음 — node scripts/build-connections.mjs (${e.message})`)
  }
  if (json) {
    const byName = new Map(entries.map((e) => [e.name, e]))
    for (const n of json.names ?? []) {
      const e = byName.get(n.name)
      if (!e) {
        fail(`connections.json ${n.name}`, '목록에 없는 이름')
        continue
      }
      const exclude = new Set(e.exclude ? tools.expand(e.exclude) : [])
      for (const r of n.refs ?? []) {
        total++
        const text = tools.textOf(r)
        if (text === undefined) fail(`connections.json ${n.name} ${r}`, '없는 절')
        else if (noText(text)) fail(`connections.json ${n.name} ${r}`, `본문이 없는 절 "${text}"`)
        else if (!e.words.some((x) => hasWord(text, x))) fail(`connections.json ${n.name} ${r}`, `찾는 말(${e.words.join('·')})이 본문에 없음 "${text}"`)
        if (exclude.has(r)) fail(`connections.json ${n.name} ${r}`, '빼기 절')
      }
    }
    if (JSON.stringify(json) !== JSON.stringify(toJson(entries, tools))) fail('connections.json', 'scripts/connections/names.txt와 다름 — node scripts/build-connections.mjs')
  }
}

if (errors) {
  console.error(`\n✗ verify-connections 실패: 오류 ${errors}개`)
  process.exit(1)
}
const people = entries.filter((e) => e.kind === '사람').length
console.log(`✓ verify-connections 통과 (사람 ${people}개, 곳 ${entries.length - people}개${fixture ? '' : `, 구절 ${total}곳`})`)

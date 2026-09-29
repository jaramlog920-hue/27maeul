// 사도행전 여정 카드 정확도 게이트 (계획 5 작업 4). 오류가 하나라도 있으면 exit 1 → prebuild가 빌드를 막는다.
// - 곳 이름이 그 구절 본문에 글자 그대로 있다
// - 순서 번호는 1..N 빠짐없이
// - 카드의 구절은 앞 카드의 구절보다 뒤 (한 구절에 카드 한 장 — 판에서 순서가 하나로 정해지게)
// - 구절은 사도행전의 한 절이고, 본문이 없는 절이 아니다
// - journey.json이 scripts/journey/ac.txt와 같다
import { readFile } from 'node:fs/promises'
import { JOURNEY_JSON, readJourneyTxt } from './journey-parse.mjs'

const root = new URL('../', import.meta.url)
const bible = JSON.parse(await readFile(new URL('src/content/nt-krv.json', root), 'utf8'))
const acts = bible.act

let errors = 0
const fail = (where, msg) => {
  errors++
  console.error(`✗ ${where}: ${msg}`)
}
// verify-pieces.mjs·catalog.ts의 noText와 같은 규칙
const noText = (text) => text === '(없음)' || /^\(\d+절에 포함되어 있음\)$/.test(text)

let txt = []
try {
  txt = await readJourneyTxt()
} catch (e) {
  fail('journey/ac.txt', e.message)
}
let json = null
try {
  json = JSON.parse(await readFile(JOURNEY_JSON, 'utf8'))
} catch (e) {
  fail('journey.json', `읽을 수 없음 — node scripts/build-journey.mjs (${e.message})`)
}
if (json && JSON.stringify(json) !== JSON.stringify(txt)) fail('journey.json', 'scripts/journey/ac.txt와 다름 — node scripts/build-journey.mjs')

const cards = json ?? txt
if (!cards.length) fail('journey', '카드가 없음')
let prev = null
cards.forEach((c, i) => {
  const w = `여정 카드 ${c.order} ${c.place} (${c.ref})`
  if (c.order !== i + 1) fail(w, `순서 번호는 ${i + 1}이어야 함 (1부터 빠짐없이)`)
  const m = typeof c.ref === 'string' && c.ref.match(/^행 (\d+):(\d+)$/)
  if (!m) {
    fail(w, '구절은 "행 장:절" 한 절이어야 함')
    return
  }
  const ch = Number(m[1])
  const v = Number(m[2])
  if (c.chapter !== ch) fail(w, `chapter ${c.chapter}가 구절의 장 ${ch}와 다름`)
  const text = acts[ch - 1]?.[v - 1]
  if (text === undefined) {
    fail(w, '사도행전에 없는 절')
    return
  }
  if (noText(text)) fail(w, `본문이 없는 절 "${text}"`)
  else if (typeof c.place !== 'string' || !c.place.trim() || !text.includes(c.place)) fail(w, `곳 이름 "${c.place}"이 본문에 없음 — "${text}"`)
  if (prev && (ch < prev[0] || (ch === prev[0] && v <= prev[1]))) fail(w, `앞 카드(${prev[2]})보다 앞서거나 같은 구절`)
  prev = [ch, v, c.ref]
})

if (errors) {
  console.error(`\n✗ verify-journey 실패: 오류 ${errors}개`)
  process.exit(1)
}
console.log(`✓ verify-journey 통과 (여정 카드 ${cards.length}장)`)

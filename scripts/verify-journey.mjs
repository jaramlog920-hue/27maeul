// 카드 판 정확도 게이트 (계획 5 작업 4, 판마다 — 계획 9 작업 3). 오류가 하나라도 있으면 exit 1 → prebuild가 빌드를 막는다.
// 판: ac(사도행전 여정 카드 → journey.json), rev(요한계시록 일곱 교회 카드 → churches.json). 두 판 모두:
// - 곳 이름이 그 구절 본문에 글자 그대로 있다
// - 순서 번호는 1..N 빠짐없이
// - 카드의 구절은 앞 카드의 구절보다 뒤 (한 구절에 카드 한 장 — 판에서 순서가 하나로 정해지게)
// - 구절은 그 책의 한 절이고, 본문이 없는 절이 아니다
// - json이 줄 파일과 같다
// 요한계시록 판만:
// - 이름은 띄어쓰기·부호 없는 곳 이름 한 낱말 (풀이·요약을 덧붙이지 않는다)
// - "{이름} 교회의 사자에게"가 그 절에 글자 그대로 있다 (1:11처럼 이름만 줄지어 나오는 절을 막는다)
// - 카드는 정확히 7장
// 사용: node scripts/verify-journey.mjs [판 픽스처.txt] — 판(ac|rev)과 픽스처를 주면 그 판의 그 파일만 보고 json 대조는 하지 않는다.
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { BOARDS, readBoardTxt } from './journey-parse.mjs'

const root = new URL('../', import.meta.url)
const bible = JSON.parse(await readFile(new URL('src/content/nt-krv.json', root), 'utf8'))

let errors = 0
const fail = (where, msg) => {
  errors++
  console.error(`✗ ${where}: ${msg}`)
}
// verify-pieces.mjs·catalog.ts의 noText와 같은 규칙
const noText = (text) => text === '(없음)' || /^\(\d+절에 포함되어 있음\)$/.test(text)

const [boardArg, fixture] = process.argv.slice(2)
if (boardArg && !(boardArg in BOARDS)) {
  console.error(`✗ 알 수 없는 판 ${boardArg} — ${Object.keys(BOARDS).join('·')} 중 하나`)
  process.exit(1)
}
const todo = boardArg ? [BOARDS[boardArg]] : Object.values(BOARDS)

async function verifyBoard(board) {
  let txt = []
  try {
    txt = await readBoardTxt(board, fixture ? pathToFileURL(fixture) : undefined)
  } catch (e) {
    fail(fixture ?? `journey/${board.id}.txt`, e.message)
  }
  let cards = txt
  if (!fixture) {
    const name = board.json.pathname.split('/').pop()
    let json = null
    try {
      json = JSON.parse(await readFile(board.json, 'utf8'))
    } catch (e) {
      fail(name, `읽을 수 없음 — node scripts/build-journey.mjs (${e.message})`)
    }
    if (json && JSON.stringify(json) !== JSON.stringify(txt)) fail(name, `scripts/journey/${board.id}.txt와 다름 — node scripts/build-journey.mjs`)
    cards = json ?? txt
  }

  const book = bible[board.bibleKey]
  const refRe = new RegExp(`^${board.abbr} (\\d+):(\\d+)$`)
  if (!cards.length) fail(board.label, '카드가 없음')
  if (board.count && cards.length !== board.count) fail(board.label, `카드는 정확히 ${board.count}장이어야 함 (${cards.length}장)`)
  let prev = null
  cards.forEach((c, i) => {
    const w = `${board.label} ${c.order} ${c.place} (${c.ref})`
    if (c.order !== i + 1) fail(w, `순서 번호는 ${i + 1}이어야 함 (1부터 빠짐없이)`)
    const m = typeof c.ref === 'string' && c.ref.match(refRe)
    if (!m) {
      fail(w, `구절은 "${board.abbr} 장:절" 한 절이어야 함`)
      return
    }
    const ch = Number(m[1])
    const v = Number(m[2])
    if (c.chapter !== ch) fail(w, `chapter ${c.chapter}가 구절의 장 ${ch}와 다름`)
    const text = book[ch - 1]?.[v - 1]
    if (text === undefined) {
      fail(w, `${board.bookName}에 없는 절`)
      return
    }
    const nameOk = typeof c.place === 'string' && c.place.trim() !== ''
    if (board.oneWord && !(nameOk && /^[가-힣]+$/.test(c.place))) fail(w, '카드 이름은 띄어쓰기·부호 없는 곳 이름 한 낱말이어야 함')
    if (noText(text)) fail(w, `본문이 없는 절 "${text}"`)
    else if (!nameOk || !text.includes(c.place)) fail(w, `곳 이름 "${c.place}"이 본문에 없음 — "${text}"`)
    else if (board.suffix && !text.includes(c.place + board.suffix)) fail(w, `"${c.place}${board.suffix}"가 본문에 없음 — "${text}"`)
    if (prev && (ch < prev[0] || (ch === prev[0] && v <= prev[1]))) fail(w, `앞 카드(${prev[2]})보다 앞서거나 같은 구절`)
    prev = [ch, v, c.ref]
  })
  return `${board.label} ${cards.length}장`
}

const done = []
for (const board of todo) done.push(await verifyBoard(board))

if (errors) {
  console.error(`\n✗ verify-journey 실패: 오류 ${errors}개`)
  process.exit(1)
}
console.log(`✓ verify-journey 통과 (${done.join(', ')})`)

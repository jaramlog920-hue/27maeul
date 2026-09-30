// 카드 판 읽기 — build-journey.mjs와 verify-journey.mjs가 같이 쓴다. 판마다 줄 파일 하나 → json 하나:
//   ac  : scripts/journey/ac.txt  → src/content/journey.json  (사도행전 여정 카드, 계획 5)
//   rev : scripts/journey/rev.txt → src/content/churches.json (요한계시록 일곱 교회 카드, 계획 9 작업 3)
// 한 줄 = "순서 | 곳 이름 | 구절" (예: "1 | 예루살렘 | 행 1:12"). # 줄은 주석.
import { readFile } from 'node:fs/promises'

export const BOARDS = {
  ac: {
    id: 'ac',
    label: '여정 카드',
    abbr: '행',
    bibleKey: 'act',
    bookName: '사도행전',
    txt: new URL('./journey/ac.txt', import.meta.url),
    json: new URL('../src/content/journey.json', import.meta.url),
  },
  rev: {
    id: 'rev',
    label: '일곱 교회 카드',
    abbr: '계',
    bibleKey: 'rev',
    bookName: '요한계시록',
    txt: new URL('./journey/rev.txt', import.meta.url),
    json: new URL('../src/content/churches.json', import.meta.url),
    /** 카드 수가 정확히 이만큼 */
    count: 7,
    /** 이름 뒤에 이 말이 붙어 그 절에 글자 그대로 있어야 한다 (1:11처럼 이름만 줄지어 나오는 절을 막는다) */
    suffix: ' 교회의 사자에게',
    /** 이름은 띄어쓰기·부호 없는 한 낱말 (풀이를 덧붙이지 못하게) */
    oneWord: true,
  },
}

export const JOURNEY_TXT = BOARDS.ac.txt
export const JOURNEY_JSON = BOARDS.ac.json

/** 줄을 카드로 — 형식만 본다. 본문 대조는 verify-journey가 한다 */
export function parseBoard(board, src, where = `journey/${board.id}.txt`) {
  const cards = []
  const refRe = new RegExp(`^${board.abbr} (\\d+):(\\d+)$`)
  for (const line of src.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))) {
    const parts = line.split('|').map((s) => s.trim())
    const m = parts[2]?.match(refRe)
    if (parts.length !== 3 || !/^\d+$/.test(parts[0]) || !parts[1] || !m) throw new Error(`${where}: bad line: ${line}`)
    cards.push({ order: Number(parts[0]), place: parts[1], ref: parts[2], chapter: Number(m[1]) })
  }
  return cards
}

export const parseJourney = (src) => parseBoard(BOARDS.ac, src)

/** 판의 줄 파일(또는 픽스처 URL)을 읽는다 */
export async function readBoardTxt(board, url = board.txt) {
  return parseBoard(board, await readFile(url, 'utf8'), url === board.txt ? undefined : decodeURIComponent(url.pathname))
}

export async function readJourneyTxt() {
  return readBoardTxt(BOARDS.ac)
}

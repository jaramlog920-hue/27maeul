// scripts/journey/ac.txt 읽기 — build-journey.mjs와 verify-journey.mjs가 같이 쓴다.
// 한 줄 = "순서 | 곳 이름 | 구절" (예: "1 | 예루살렘 | 행 1:12"). # 줄은 주석.
import { readFile } from 'node:fs/promises'

export const JOURNEY_TXT = new URL('./journey/ac.txt', import.meta.url)
export const JOURNEY_JSON = new URL('../src/content/journey.json', import.meta.url)

/** 줄을 카드로 — 형식만 본다. 본문 대조는 verify-journey가 한다 */
export function parseJourney(src) {
  const cards = []
  for (const line of src.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))) {
    const parts = line.split('|').map((s) => s.trim())
    const m = parts[2]?.match(/^행 (\d+):(\d+)$/)
    if (parts.length !== 3 || !/^\d+$/.test(parts[0]) || !parts[1] || !m) throw new Error(`journey/ac.txt: bad line: ${line}`)
    cards.push({ order: Number(parts[0]), place: parts[1], ref: parts[2], chapter: Number(m[1]) })
  }
  return cards
}

export async function readJourneyTxt() {
  return parseJourney(await readFile(JOURNEY_TXT, 'utf8'))
}

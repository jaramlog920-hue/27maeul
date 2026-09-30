// scripts/letters/opening.txt 읽기 — build-letters.mjs와 verify-letters.mjs가 같이 쓴다.
// 한 줄 = "책 | 칸 | 이름 | 구절" (예: "롬 | 보낸 이 | 바울 | 롬 1:1"). # 줄은 주석.
// 칸은 "보낸 이"·"받는 곳"·"받는 사람" 셋. 이름 자리에 "적혀 있지 않음"을 쓸 수 있다(첫머리에 이름이 없는 편지).
import { readFile } from 'node:fs/promises'

export const OPENING_TXT = new URL('./letters/opening.txt', import.meta.url)
export const LETTERS_JSON = new URL('../src/content/letters.json', import.meta.url)

/** 칸 이름 → letters.json의 role */
export const ROLES = { '보낸 이': 'from', '받는 곳': 'toPlace', '받는 사람': 'toPerson' }
/** 첫머리에 그 칸의 이름이 없을 때 이름 자리에 쓰는 말 (letters.json에서는 name: null) */
export const NOT_WRITTEN = '적혀 있지 않음'

/** 줄을 날것 그대로 — 모양(네 칸, 빈칸 없음)만 본다. 칸 이름·책·본문 대조는 verify-letters가 한다 */
export function parseOpeningLines(src) {
  const rows = []
  for (const line of src.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))) {
    const parts = line.split('|').map((s) => s.trim())
    if (parts.length !== 4 || parts.some((p) => !p)) throw new Error(`letters/opening.txt: bad line: ${line}`)
    rows.push({ abbr: parts[0], roleLabel: parts[1], name: parts[2], ref: parts[3] })
  }
  return rows
}

/** 날것 줄 → letters.json 항목. abbrToId: books.json의 약어 → 책 id */
export function toEntries(rows, abbrToId) {
  return rows.map((r) => {
    const book = abbrToId[r.abbr]
    const role = ROLES[r.roleLabel]
    if (!book) throw new Error(`letters/opening.txt: 알 수 없는 책 ${r.abbr}`)
    if (!role) throw new Error(`letters/opening.txt: 알 수 없는 칸 ${r.roleLabel}`)
    return { book, role, name: r.name === NOT_WRITTEN ? null : r.name, ref: r.ref }
  })
}

export async function readOpeningTxt(url = OPENING_TXT) {
  return parseOpeningLines(await readFile(url, 'utf8'))
}

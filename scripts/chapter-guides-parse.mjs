// 장별 필사 길잡이 원본(scripts/chapter-guides/*.txt) 읽기 — build-chapter-guides·verify-chapter-guides가 함께 쓴다.
// 원본 표: | 장 | 말씀의 배경 | 필사하며 살펴보기 | 검토용 본문 근거 |
// 넷째 칸(검토용 본문 근거)은 제작자 검토용 — 게임 데이터(chapter-guides.json)에는 넣지 않는다.
import { readdir, readFile } from 'node:fs/promises'

export const GUIDE_DIR = new URL('./chapter-guides/', import.meta.url)
export const GUIDE_JSON = new URL('../src/content/chapter-guides.json', import.meta.url)

/** 표의 한 줄을 칸으로 나눈다 (앞뒤 | 는 떼고, 칸마다 앞뒤 공백을 지운다) */
function cells(line) {
  const parts = line.trim().split('|')
  if (parts[0].trim() === '') parts.shift()
  if (parts.length && parts[parts.length - 1].trim() === '') parts.pop()
  return parts.map((c) => c.trim())
}

/**
 * 한 파일의 표 줄. 돌려주는 줄: { where, name(책 이름), chapter, background, look, basis, cellCount }
 * 머리 줄(| 장 | …)과 구분 줄(|---|)은 건너뛴다. 장 칸이 "책이름 N장"이 아니면 chapter는 null.
 */
export function parseGuideText(text, file) {
  const rows = []
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim().startsWith('|')) return
    const c = cells(line)
    if (c[0] === '장' || c.every((x) => /^:?-+:?$/.test(x))) return
    const m = /^(.+?)\s*(\d+)장$/.exec(c[0] ?? '')
    rows.push({
      where: `${file}:${i + 1}`,
      label: c[0] ?? '',
      name: m ? m[1].trim() : null,
      chapter: m ? Number(m[2]) : null,
      background: c[1] ?? '',
      look: c[2] ?? '',
      basis: c[3] ?? '',
      cellCount: c.length,
    })
  })
  return rows
}

export async function readGuideRows() {
  const files = (await readdir(GUIDE_DIR)).filter((f) => f.endsWith('.txt')).sort()
  const rows = []
  for (const f of files) rows.push(...parseGuideText(await readFile(new URL(encodeURIComponent(f), GUIDE_DIR), 'utf8'), f))
  return { files, rows }
}

/** 게임 데이터: { [books.json 책 id]: { [장]: { background, look } } } — books.json 순서, 장 순서 */
export function toGuideJson(rows, books) {
  const out = {}
  for (const b of books) {
    const mine = rows.filter((r) => r.name === b.name && r.chapter !== null).sort((x, y) => x.chapter - y.chapter)
    if (!mine.length) continue
    out[b.id] = {}
    for (const r of mine) out[b.id][r.chapter] = { background: r.background, look: r.look }
  }
  return out
}

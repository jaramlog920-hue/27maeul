// 구약 장별 필사 길잡이 원본(scripts/ot-guides/*.txt) 읽기 — build-ot-guides·verify-ot-guides가 함께 쓴다.
// 표는 신약 길잡이와 같다: | 장 | 말씀의 배경 | 필사하며 살펴보기 | 검토용 본문 근거 | (시편은 "시편 N편")
// 넷째 칸(검토용 본문 근거)은 제작자 검토용 — 게임 데이터(src/content/ot-guides/<id>.json)에는 넣지 않는다.
// 사용자 결정 ④ (2026-10-07): 구약 안내문은 공개, 고신(개혁주의·웨스트민스터 신앙고백) 입장에서 컨트롤러가 검토·판단.
import { readdir, readFile } from 'node:fs/promises'
import { OT_BOOK_TABLE } from '../src/engine/ot-books.ts'

export const OT_GUIDE_DIR = new URL('./ot-guides/', import.meta.url)
export const OT_GUIDE_OUT = new URL('../src/content/ot-guides/', import.meta.url)
export const OT_BOOKS_TABLE = OT_BOOK_TABLE

function cells(line) {
  const parts = line.trim().split('|')
  if (parts[0].trim() === '') parts.shift()
  if (parts.length && parts[parts.length - 1].trim() === '') parts.pop()
  return parts.map((c) => c.trim())
}

/** 한 파일의 표 줄: { where, label, name, chapter, background, look, basis, cellCount } */
export function parseOtGuideText(text, file) {
  const rows = []
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim().startsWith('|')) return
    const c = cells(line)
    if (c[0] === '장' || c.every((x) => /^:?-+:?$/.test(x))) return
    const m = /^(.+?)\s*(\d+)(장|편)$/.exec(c[0] ?? '')
    rows.push({
      where: `${file}:${i + 1}`,
      label: c[0] ?? '',
      name: m ? m[1].trim() : null,
      chapter: m ? Number(m[2]) : null,
      unit: m ? m[3] : null,
      background: c[1] ?? '',
      look: c[2] ?? '',
      basis: c[3] ?? '',
      cellCount: c.length,
    })
  })
  return rows
}

export async function readOtGuideRows() {
  let files = []
  try {
    files = (await readdir(OT_GUIDE_DIR)).filter((f) => f.endsWith('.txt')).sort()
  } catch {
    files = []
  }
  const rows = []
  for (const f of files) rows.push(...parseOtGuideText(await readFile(new URL(encodeURIComponent(f), OT_GUIDE_DIR), 'utf8'), f))
  return { files, rows }
}

/** 책 id → { [장]: { background, look } } (원본에 있는 책만) */
export function toOtGuideJson(rows) {
  const out = {}
  for (const b of OT_BOOK_TABLE) {
    const mine = rows.filter((r) => r.name === b.name && r.chapter !== null).sort((x, y) => x.chapter - y.chapter)
    if (!mine.length) continue
    out[b.id] = {}
    for (const r of mine) out[b.id][r.chapter] = { background: r.background, look: r.look }
  }
  return out
}

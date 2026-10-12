// 2026-10-12 손님·서고 점검 9 (사용자 결정 3): 구약 길잡이의 큰따옴표 안은 개역한글 본문을 글자 그대로 (띄어쓰기·문장부호만 무시).
// 줄임표(…)로 이은 인용은 토막마다 그 장 본문에 있어야 한다.
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { expect, it } from 'vitest'

const GUIDES = resolve('src/content/ot-guides')
const TEXTS = resolve('src/content/ot')
const norm = (s: string) => s.replace(/[\s.,;:!?·'"‘’“”「」()\-–—]/g, '')

export function badQuotes(): string[] {
  const bad: string[] = []
  for (const f of readdirSync(GUIDES).filter((n) => n.endsWith('.json'))) {
    const guides = JSON.parse(readFileSync(join(GUIDES, f), 'utf8')) as Record<string, { background: string; look: string }>
    const chapters = JSON.parse(readFileSync(join(TEXTS, f), 'utf8')) as string[][]
    for (const [ch, g] of Object.entries(guides)) {
      const text = norm((chapters[Number(ch) - 1] ?? []).join(''))
      for (const field of [g.background, g.look])
        for (const m of field.matchAll(/["“]([^"”]+)["”]/g)) {
          const parts = m[1].split('…').map(norm).filter(Boolean)
          if (!parts.every((p) => text.includes(p))) bad.push(`${f.replace('.json', '')} ${ch}: ${m[1]}`)
        }
    }
  }
  return bad
}

it('구약 길잡이 인용은 그 장 본문 그대로', () => {
  expect(badQuotes()).toEqual([])
})

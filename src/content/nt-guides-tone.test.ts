// 2026-10-11 서고·필사 점검 6 (사용자 결정): 신약 길잡이 "말씀의 배경" 칸도 구약처럼 "-세요."를 "-셨어요."로.
// 독자에게 권하는 말(살펴보세요 등)은 배경 칸에 있어도 그대로 둔다.
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { expect, it } from 'vitest'

const READER = /(보세요|읽어보세요|읽어 보세요|살펴보세요|눈여겨보세요|기억하세요|생각해 보세요)$/
const dir = resolve('src/content/nt')

it('신약 길잡이 배경 칸에 높임 현재형 "-세요." 문장이 없다', () => {
  const bad: string[] = []
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    const { guides } = JSON.parse(readFileSync(join(dir, f), 'utf8')) as { guides: Record<string, { background: string }> }
    for (const [ch, g] of Object.entries(guides))
      for (const s of g.background.split(/(?<=[.!?])\s*/)) if (/세요[.!?]?$/.test(s.trim()) && !READER.test(s.trim().replace(/[.!?]$/, ''))) bad.push(`${f} ${ch}: ${s}`)
  }
  expect(bad).toEqual([])
})

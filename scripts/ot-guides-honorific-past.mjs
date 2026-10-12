// 구약 길잡이 "말씀의 배경" 칸의 높임 현재형 "-세요." 문장을 "-셨어요."로 바꾼다 (2026-10-10 사용자 결정).
// "하나님이 천지를 창조하세요"처럼 부탁·명령으로 읽히는 것을 막기 위해서다. 둘째 칸(배경)만 고치고,
// 독자에게 권하는 셋째 칸("살펴보세요")과 넷째 칸(검토용 근거)은 그대로 둔다.
// 사용: node scripts/ot-guides-honorific-past.mjs [--write]  (--write 없으면 바뀔 문장만 보여 준다)
import { readdir, readFile, writeFile } from 'node:fs/promises'

const DIR = new URL('./ot-guides/', import.meta.url)
const write = process.argv.includes('--write')
// 문장 끝의 "세요" (마침표·물음표·느낌표·따옴표 앞 또는 칸 끝)
const END = /세요(?=[.!?"”']|\s*$)/g
// 독자에게 권하는 말은 배경 칸에 있어도 바꾸지 않는다
const READER = /(보세요|읽어보세요|읽어 보세요|살펴보세요|눈여겨보세요|기억하세요|생각해 보세요)$/

let changed = 0
const samples = []
const skipped = []
for (const name of (await readdir(DIR)).filter((f) => f.endsWith('.txt')).sort()) {
  const url = new URL(name, DIR)
  const text = await readFile(url, 'utf8')
  const out = text.split(/(\r?\n)/).map((line) => {
    if (!line.trim().startsWith('|')) return line
    const parts = line.split('|')
    // parts: ['', 장, 배경, 살펴보기, 근거, '']
    if (parts.length < 4 || parts[1].trim() === '장' || /^\s*-+\s*$/.test(parts[1])) return line
    const before = parts[2]
    const after = before.replace(/[^.!?]*?세요(?=[.!?"”']|\s*$)/g, (sentence) => {
      const s = sentence.trimEnd()
      if (READER.test(s)) {
        skipped.push(`${name}: ${s.trim()}`)
        return sentence
      }
      changed++
      return sentence.replace(END, '셨어요')
    })
    if (after !== before) {
      if (samples.length < 25) samples.push(`${name}: ${before.trim()}\n   → ${after.trim()}`)
      parts[2] = after
      return parts.join('|')
    }
    return line
  })
  if (write) await writeFile(url, out.join(''), 'utf8')
}
console.log(`바뀐 문장 ${changed}개${write ? ' (저장함)' : ' (미리보기)'}`)
console.log(samples.join('\n'))
if (skipped.length) console.log(`\n그대로 둔 독자 권유 ${skipped.length}개:\n` + skipped.join('\n'))

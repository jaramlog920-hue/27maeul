// 선택지 문구 길이 점검: 휴대폰 화면에서 두 줄을 넘길 만한 긴 선택지를 찾는다 (2026-10-07 사용자 — 선택지는 한 줄이 좋다).
// 사용: node scripts/list-long-choices.mjs [최대 글자 수, 기본 16]
import { readFileSync } from 'node:fs'

const MAX = Number(process.argv[2] ?? 16)
const files = ['src/content/people.json', 'src/content/life-text.json', 'src/content/scenes.json']
const out = []
function walk(node, path, file) {
  if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`, file))
  if (!node || typeof node !== 'object') return
  for (const [k, v] of Object.entries(node)) {
    if ((k === 'label' || k === 'choice') && typeof v === 'string' && /choices|options|answers/.test(path) && [...v].length > MAX) out.push([[...v].length, file, `${path}.${k}`, v])
    walk(v, `${path}.${k}`, file)
  }
}
for (const f of files) {
  try {
    walk(JSON.parse(readFileSync(f, 'utf8')), '', f)
  } catch {
    // 없는 파일은 건너뛴다
  }
}
out.sort((a, b) => b[0] - a[0])
for (const [n, f, p, v] of out) console.log(`${n}\t${f}\t${p}\t${v}`)
console.log(`합계 ${out.length}개 (${MAX}자 초과)`)

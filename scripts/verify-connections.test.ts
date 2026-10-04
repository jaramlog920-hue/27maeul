import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// verify-connections.mjs가 오류마다 실제로 잡는지 — 역방향 픽스처를 돌린다 (계획 14 작업 9).
function run(...args: string[]) {
  const r = spawnSync('node', ['scripts/verify-connections.mjs', ...args], { encoding: 'utf8' })
  return { code: r.status, out: r.stdout + r.stderr }
}
const bad = (name: string) => run(`scripts/fixtures/bad-names-${name}.txt`)

describe('verify-connections.mjs', () => {
  it('현재 콘텐츠는 통과', () => {
    const r = run()
    expect(r.out).toMatch(/✓ verify-connections 통과 \(사람 \d+개, 곳 \d+개, 구절 \d+곳\)/)
    expect(r.code).toBe(0)
  })

  it('① 같은 이름 무리의 두 줄이 한 절에서 겹치면 실패', () => {
    const r = bad('overlap')
    expect(r.code).toBe(1)
    expect(r.out).toContain('갑 마리아 · 을 마리아: 같은 이름 "마리아" 무리인데 같은 절에 둘 다 — 눅 1:30')
    expect(r.out).toContain('오류 1개')
  })

  it('② 같은 찾는 말을 쓰는 두 줄에 같은 이름 무리가 없으면 실패', () => {
    const r = bad('word')
    expect(r.code).toBe(1)
    expect(r.out).toContain('요셉 둘: 찾는 말 "요셉"를 요셉 하나도 씀')
  })

  it('③ 쓸모없는 빼기 — 찾는 말이 없는 절·범위 밖 절이면 실패', () => {
    const r = bad('exclude')
    expect(r.code).toBe(1)
    expect(r.out).toContain('베드로: 빼기 마 1:1에 찾는 말이 없음')
    expect(r.out).toContain('바울: 빼기 행 13:21가 범위 밖')
    expect(r.out).toContain('오류 2개')
  })

  it('④ 모양 — 무리 이름·이름 겹침·찾는 말 겹침·나오는 절 없음·풀 수 없는 참조', () => {
    const r = bad('shape')
    expect(r.code).toBe(1)
    expect(r.out).toContain('갈릴리: 무리 "장소"는 사람·곳 중 하나여야 함')
    expect(r.out).toContain('갈릴리: 이름이 겹침')
    expect(r.out).toContain('나사렛: 찾는 말이 겹침')
    expect(r.out).toContain('없는이름: 나오는 절이 없음')
    expect(r.out).toContain('베다니: 참조를 풀 수 없음 — 없는 절 요 22:1')
  })

  it('--show: 그 이름이 나오는 절을 본문과 함께 보여 준다 (검토용)', () => {
    const r = run('--show', '삭개오')
    expect(r.code).toBe(0)
    expect(r.out).toContain('## 삭개오 (사람) — 3곳')
    expect(r.out).toContain('눅 19:2  ')
  })
})

describe('connections.json', () => {
  const json = JSON.parse(readFileSync('src/content/connections.json', 'utf8')) as { names: { name: string; kind: string; refs: string[] }[] }
  const books = (JSON.parse(readFileSync('src/content/books.json', 'utf8')) as { abbr: string }[]).map((b) => b.abbr)
  const key = (ref: string) => {
    const m = ref.match(/^(\S+) (\d+):(\d+)$/)!
    return [books.indexOf(m[1]), Number(m[2]), Number(m[3])]
  }

  it('이름마다 구절은 성경 순서, 한 절은 한 번', () => {
    for (const n of json.names) {
      expect(new Set(n.refs).size, n.name).toBe(n.refs.length)
      for (let i = 1; i < n.refs.length; i++) {
        const [a, b] = [key(n.refs[i - 1]), key(n.refs[i])]
        expect(a[0] < b[0] || (a[0] === b[0] && (a[1] < b[1] || (a[1] === b[1] && a[2] < b[2]))), `${n.refs[i - 1]} → ${n.refs[i]}`).toBe(true)
      }
    }
  })
})

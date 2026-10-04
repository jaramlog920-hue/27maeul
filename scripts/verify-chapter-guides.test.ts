import { spawnSync } from 'node:child_process'
import guides from '../src/content/chapter-guides.json'
import books from '../src/content/books.json'

// verify-chapter-guides.mjs가 길잡이 오류를 실제로 잡는지 — 역방향 픽스처를 돌린다.
function run(...args: string[]) {
  const r = spawnSync('node', ['scripts/verify-chapter-guides.mjs', ...args], { encoding: 'utf8' })
  return { code: r.status, out: r.stdout + r.stderr }
}

describe('verify-chapter-guides.mjs', () => {
  it('현재 길잡이는 통과 (27권 260장)', () => {
    const r = run()
    expect(r.out).toContain('✓ verify-chapter-guides 통과 (장 260개)')
    expect(r.code).toBe(0)
  })

  it('역방향 픽스처: 겹친 장·없는 장·없는 책·빈 칸·근거 섞임·금지어·칸 수를 모두 잡는다', () => {
    const r = run('scripts/fixtures/bad-guides.txt')
    expect(r.code).toBe(1)
    expect(r.out).toContain('마태복음 1장: 같은 책·장이 두 번 있음')
    expect(r.out).toContain('마태복음은 28장까지')
    expect(r.out).toContain('책 이름 "마태책"이 books.json에 없음')
    expect(r.out).toContain('필사하며 살펴보기 칸이 비어 있음')
    expect(r.out).toContain('검토용 본문 근거가 섞인 듯함')
    expect(r.out).toContain('금지어 /(?<![가-힣])데나리온/')
    expect(r.out).toContain('칸이 3개')
    expect(r.out).toContain('오류 8개')
  })
})

describe('chapter-guides.json', () => {
  const data = guides as Record<string, Record<string, { background: string; look: string }>>
  it('27권 모든 장(260장)에 배경과 살펴보기가 있다', () => {
    let n = 0
    for (const b of books) {
      for (let c = 1; c <= b.chapters; c++) {
        const g = data[b.id]?.[String(c)]
        expect(g?.background, `${b.name} ${c}장`).toBeTruthy()
        expect(g?.look, `${b.name} ${c}장`).toBeTruthy()
        n++
      }
      expect(Object.keys(data[b.id]).length, b.name).toBe(b.chapters)
    }
    expect(n).toBe(260)
  })
  it('검토용 본문 근거는 게임 데이터에 없다 (배경·살펴보기 두 칸뿐, 절 번호 없음)', () => {
    for (const b of Object.values(data))
      for (const g of Object.values(b)) {
        expect(Object.keys(g).sort()).toEqual(['background', 'look'])
        expect(g.background + g.look).not.toMatch(/\d+:\d+/)
      }
  })
})

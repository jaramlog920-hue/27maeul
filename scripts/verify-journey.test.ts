import { spawnSync } from 'node:child_process'

// verify-journey.mjs가 판마다(사도행전 여정 · 요한계시록 일곱 교회) 실제로 오류를 잡는지 — 역방향 픽스처를 돌린다.
function run(...args: string[]) {
  const r = spawnSync('node', ['scripts/verify-journey.mjs', ...args], { encoding: 'utf8' })
  return { code: r.status, out: r.stdout + r.stderr }
}

describe('verify-journey.mjs', () => {
  it('현재 콘텐츠는 통과 (여정 카드 46장, 일곱 교회 카드 7장)', () => {
    const r = run()
    expect(r.out).toContain('✓ verify-journey 통과 (여정 카드 46장, 일곱 교회 카드 7장)')
    expect(r.code).toBe(0)
  })

  it('① 구절이 계 1:11 — 이름은 있어도 "{이름} 교회의 사자에게"가 없으면 실패', () => {
    const r = run('rev', 'scripts/fixtures/bad-churches-111.txt')
    expect(r.code).toBe(1)
    expect(r.out).toContain('일곱 교회 카드 1 에베소 (계 1:11): "에베소 교회의 사자에게"가 본문에 없음')
    // 다른 여섯 줄은 걸리지 않는다
    expect(r.out).toContain('오류 1개')
  })

  it('② 이름 뒤에 덧붙인 말이 있으면 실패 — 카드에는 곳 이름만', () => {
    const r = run('rev', 'scripts/fixtures/bad-churches-label.txt')
    expect(r.code).toBe(1)
    expect(r.out).toContain('일곱 교회 카드 1 에베소 — 첫째 교회 (계 2:1): 카드 이름은 띄어쓰기·부호 없는 곳 이름 한 낱말이어야 함')
  })

  it('③ 카드가 여섯 장뿐이면 실패', () => {
    const r = run('rev', 'scripts/fixtures/bad-churches-six.txt')
    expect(r.code).toBe(1)
    expect(r.out).toContain('일곱 교회 카드: 카드는 정확히 7장이어야 함 (6장)')
  })

  it('다른 책 구절(사도행전 줄)이 요한계시록 판에 있으면 형식 오류', () => {
    const r = run('rev', 'scripts/journey/ac.txt')
    expect(r.code).toBe(1)
    expect(r.out).toContain('bad line')
  })

  it('알 수 없는 판 이름은 실패', () => {
    const r = run('xx', 'scripts/journey/rev.txt')
    expect(r.code).toBe(1)
    expect(r.out).toContain('알 수 없는 판 xx')
  })

  it('사도행전 판 검증은 그대로 — ac.txt를 픽스처로 줘도 통과', () => {
    const r = run('ac', 'scripts/journey/ac.txt')
    expect(r.code).toBe(0)
    expect(r.out).toContain('여정 카드 46장')
  })
})

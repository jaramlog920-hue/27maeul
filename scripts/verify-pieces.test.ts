import { spawnSync } from 'node:child_process'

// verify-pieces.mjs가 실제로 오류를 잡는지 — 통과만 확인하면 빈 파일에도 통과하므로 반드시 실패 픽스처를 돌린다.
function run(...args: string[]) {
  const r = spawnSync('node', ['scripts/verify-pieces.mjs', ...args], { encoding: 'utf8' })
  return { code: r.status, out: r.stdout + r.stderr }
}

describe('verify-pieces.mjs', () => {
  it('현재 콘텐츠는 통과', () => {
    const r = run()
    expect(r.out).toContain('✓ verify-pieces 통과')
    expect(r.code).toBe(0)
  })

  it('깨진 픽스처는 규칙별로 실패', () => {
    const r = run('scripts/fixtures/bad-pieces.json', 'scripts/fixtures/bad-life-text.json', 'scripts/fixtures/bad-neighbors.json')
    expect(r.code).toBe(1)
    for (const msg of [
      '중복 id',
      '15:5가 lk-015-001와 겹침',
      'id는 lk-015-005여야 함',
      '제목 낱말 "탕자"가 본문에 없음',
      '겹치는 낱말 비율',
      '알 수 없는 kind maybe',
      'ref 책이 book(mk)와 다름',
      '알 수 없는 book lk',
      '누가복음이 아닌 범위 마 16:1',
      'no verse luk 14:',
      'chapter 12가 시작하는 장 13와 다름',
      '조각이 덮지 않은 절 22개',
      '제목 없음',
      '문장이 끝나지 않은 채 조각이 끝남 ("…이르시되")',
      '제목 "잃은 양"이 lk-015-001와 같음',
      '눅 24장: 조각이 덮지 않은 절 53개',
      'stamps는 배열이어야 함',
      '금지어 (?<![가-힣])예수',
      '금지어 (?<![가-힣])누가(?!복음) — "누가가 썼다"',
      '금지어 (?<![가-힣])유월절',
      '기록자가 화자인 문장',
      '금지어 (?<![가-힣])회당',
    ]) expect(r.out, msg).toContain(msg)
    // 책 이름은 허용
    expect(r.out).not.toContain('"누가복음을 쓴 사람"')
    expect(r.out).not.toContain('"요한복음도 있어요"')
    expect(r.out).not.toContain('"필요한 것"')
    expect(r.out).toContain('금지어 (?<![가-힣])사도')
  })
})

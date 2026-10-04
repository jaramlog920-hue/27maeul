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
      '자기 책을 가리키는 도장',
      '누가복음이 아닌 범위 마 16:1',
      'no verse luk 14:',
      'chapter 12가 시작하는 장 13와 다름',
      '조각이 덮지 않은 절 22개',
      '제목 없음',
      '문장이 끝나지 않은 채 조각이 끝남 ("…이르시되")',
      '문장이 끝나지 않은 채 조각이 끝남 ("…하거늘")',
      '제목 "잃은 양"이 lk-015-001와 같음',
      '눅 24장: 조각이 덮지 않은 절 53개',
      'stamps는 배열이어야 함',
      '금지어 (?<![가-힣])예수',
      '금지어 (?<![가-힣])누가(?!복음) — "누가가 썼다"',
      '금지어 (?<![가-힣])유월절',
      '금지어 (?<![가-힣])데나리온',
      '금지어 (?<![가-힣])회당',
      '금지어 (?<![가-힣])정경 — "스물일곱 권, 정경이 다 모였어요"',
    ]) expect(r.out, msg).toContain(msg)
    // 책 이름은 허용
    expect(r.out).not.toContain('"누가복음을 쓴 사람"')
    expect(r.out).not.toContain('"요한복음도 있어요"')
    expect(r.out).not.toContain('"필요한 것"')
    expect(r.out).toContain('금지어 (?<![가-힣])사도')
    // '하나님'은 말씀 루프 이름표(copyFocus.godNew)에서만 허용 — 다른 자리는 걸리고, 이름표의 다른 금지어도 걸린다
    expect(r.out).toContain('life-text.ui.godTest: 금지어 (?<![가-힣])하나님')
    expect(r.out).not.toContain('life-text.copyFocus.godNew: 금지어 (?<![가-힣])하나님')
    expect(r.out).toContain('life-text.copyFocus.godNew: 금지어 (?<![가-힣])바울')
  })

  it('괄호 안 조각(막 16:9-20)에는 "같은 이야기" 도장이 없고, 그쪽을 가리키지도 않는다', () => {
    const r = run('scripts/fixtures/bad-bracket-same.json')
    expect(r.code).toBe(1)
    for (const msg of [
      'piece mk-016-009 도장 눅 24:10-11: 괄호 안 조각 mk-016-009에 "같은 이야기" 도장',
      'piece lk-024-010 도장 막 16:9-11: 괄호 안 조각 mk-016-009을 가리키는 "같은 이야기" 도장',
    ]) expect(r.out, msg).toContain(msg)
  })

  it('사도행전에는 도장이 없다 — 사도행전 조각의 도장도, 사도행전을 가리키는 도장도 오류', () => {
    const r = run('scripts/fixtures/bad-acts-stamp.json')
    expect(r.code).toBe(1)
    for (const msg of [
      'piece ac-001-001 도장 눅 1:1-4: 사도행전 조각에는 도장이 없음',
      'piece lk-001-001 도장 행 1:1-11: 사도행전을 가리키는 도장 — 도장은 네 복음서끼리만',
    ]) expect(r.out, msg).toContain(msg)
    // 알 수 없는 책으로 취급하지 않는다 (ac는 아는 책)
    expect(r.out).not.toContain('알 수 없는 책 ac')
    expect(r.out).not.toContain('알 수 없는 book ac')
  })

  it('도장은 양쪽에서 서로를 가리켜야 하고, 부분만 넣은 책도 1장부터 빠짐없이', () => {
    const r = run('scripts/fixtures/bad-symmetry.json')
    expect(r.code).toBe(1)
    for (const msg of [
      'piece lk-003-021 도장 막 1:9-11: mk-001-009의 되돌아오는 도장 종류가 다름',
      'piece lk-004-001 도장 막 1:12-13: mk-001-012에 되돌아오는 도장이 없음',
      'piece mk-001-009 도장 막 1:12-13: 자기 책을 가리키는 도장',
      '막 1장: 조각이 덮지 않은 절 40개',
    ]) expect(r.out, msg).toContain(msg)
  })
})

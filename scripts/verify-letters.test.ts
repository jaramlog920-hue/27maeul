import { spawnSync } from 'node:child_process'
import letters from '../src/content/letters.json'

// verify-letters.mjs가 실제로 오류를 잡는지 — 통과만 확인하면 빈 파일에도 통과하므로 역방향 픽스처를 돌린다.
function run(...args: string[]) {
  const r = spawnSync('node', ['scripts/verify-letters.mjs', ...args], { encoding: 'utf8' })
  return { code: r.status, out: r.stdout + r.stderr }
}

describe('verify-letters.mjs', () => {
  it('현재 콘텐츠는 통과 (편지 스물한 권)', () => {
    const r = run()
    expect(r.out).toContain('✓ verify-letters 통과 (편지 21권')
    expect(r.code).toBe(0)
  })

  it('이름이 본문에 없으면 실패', () => {
    const r = run('scripts/fixtures/bad-letters-name.txt')
    expect(r.code).toBe(1)
    for (const msg of ['이름 "디모데"이 본문에 없음', '이름 "고린도"이 본문에 없음', '이름에 띄어쓰기가 있음']) expect(r.out, msg).toContain(msg)
  })

  it('없는 구절·1장 밖·다른 책 구절·이름 줄의 범위·편지가 아닌 책은 실패', () => {
    const r = run('scripts/fixtures/bad-letters-ref.txt')
    expect(r.code).toBe(1)
    for (const msg of [
      '없는 구절 갈 1:99',
      '갈 2:2: 첫머리 구절은 그 편지 1장 안이어야 함',
      '구절의 책(롬)이 줄의 책(갈)과 다름',
      '이름 줄의 구절은 한 절이어야 함',
      '본문이 없는 절 롬 16:24 "(없음)"',
      '편지 책이 아님 (막)',
    ]) expect(r.out, msg).toContain(msg)
  })

  it('첫머리 문제를 내지 않는 책(요한계시록)의 줄이 있으면 실패 — 편지가 아닌 책과 따로 알린다', () => {
    const r = run('scripts/fixtures/bad-letters-rev.txt')
    expect(r.code).toBe(1)
    expect(r.out).toContain('계 | 보낸 이 | 요한 | 계 1:4: 첫머리 문제를 내지 않는 책 (계)')
    expect(r.out).toContain('계 | 받는 곳 | 아시아 | 계 1:4: 첫머리 문제를 내지 않는 책 (계)')
    expect(r.out).not.toContain('편지 책이 아님')
  })

  it('칸 이름 틀림·칸 빠짐·"적혀 있지 않음" 규칙 어김은 실패', () => {
    const r = run('scripts/fixtures/bad-letters-role.txt')
    expect(r.code).toBe(1)
    for (const msg of [
      '칸 이름 "받는 이"은',
      '칸 이름 "보낸이"은',
      '엡: "보낸 이" 줄이 없음',
      '빌: "받는 곳"이나 "받는 사람" 줄이 없음',
      '빌: "보낸 이" 칸에 "적혀 있지 않음"과 다른 줄이 함께 있음',
      'content-audit.md에 "빌 1:1-2"와 "적혀 있지 않음"이 함께 적힌 줄(까닭)이 없음',
    ]) expect(r.out, msg).toContain(msg)
  })

  const PAUL = ['rom', '1co', '2co', 'gal', 'eph', 'php', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm']
  const HEB_JUD = ['heb', 'jas', '1pe', '2pe', '1jn', '2jn', '3jn', 'jud']

  it('letters.json: 스물한 권 모두 보낸 이와 받는 쪽이 있고, 열세 권에는 "적혀 있지 않음"이 없다', () => {
    const books = [...PAUL, ...HEB_JUD]
    expect([...new Set(letters.map((l) => l.book))]).toEqual(books)
    for (const b of books) {
      const mine = letters.filter((l) => l.book === b)
      expect(mine.some((l) => l.role === 'from'), b).toBe(true)
      expect(mine.some((l) => l.role === 'toPlace' || l.role === 'toPerson'), b).toBe(true)
    }
    expect(letters.filter((l) => PAUL.includes(l.book)).every((l) => typeof l.name === 'string')).toBe(true)
    // 보낸 이 첫 줄은 모두 바울 (본문 첫머리 그대로 — 저작 주장이 아니라 적힌 이름)
    for (const b of PAUL) expect(letters.find((l) => l.book === b && l.role === 'from')?.name, b).toBe('바울')
  })

  it('letters.json: 히브리서–유다서 첫머리 (원문을 읽고 정한 줄 그대로)', () => {
    const cell = (b: string, role: string) => letters.filter((l) => l.book === b && l.role === role).map((l) => l.name)
    // 보낸 이: 이름이 적힌 편지는 본문 낱말, 첫머리에 이름이 없거나 직함("장로")만 있으면 null(적혀 있지 않음)
    expect(HEB_JUD.map((b) => cell(b, 'from'))).toEqual([[null], ['야고보'], ['베드로'], ['베드로'], [null], [null], [null], ['유다']])
    expect(cell('1pe', 'toPlace')).toEqual(['본도', '갈라디아', '갑바도기아', '아시아', '비두니아'])
    expect(cell('1pe', 'toPerson')).toEqual([])
    expect(cell('3jn', 'toPerson')).toEqual(['가이오'])
    expect(cell('3jn', 'toPlace')).toEqual([])
    // 받는 쪽이 무리를 가리키는 말뿐(또는 없음)이면 두 칸 모두 적혀 있지 않음
    for (const b of ['heb', 'jas', '2pe', '1jn', '2jn', 'jud']) {
      expect(cell(b, 'toPlace'), b).toEqual([null])
      expect(cell(b, 'toPerson'), b).toEqual([null])
    }
    // 유다서 1:1의 "야고보"는 보낸 이가 아니다, 벧후 "시몬"은 따로 두지 않는다
    expect(letters.some((l) => l.book === 'jud' && l.name === '야고보')).toBe(false)
    expect(letters.some((l) => l.name === '시몬')).toBe(false)
  })
})

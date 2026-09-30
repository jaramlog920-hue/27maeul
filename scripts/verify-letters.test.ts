import { spawnSync } from 'node:child_process'
import letters from '../src/content/letters.json'

// verify-letters.mjs가 실제로 오류를 잡는지 — 통과만 확인하면 빈 파일에도 통과하므로 역방향 픽스처를 돌린다.
function run(...args: string[]) {
  const r = spawnSync('node', ['scripts/verify-letters.mjs', ...args], { encoding: 'utf8' })
  return { code: r.status, out: r.stdout + r.stderr }
}

describe('verify-letters.mjs', () => {
  it('현재 콘텐츠는 통과 (편지 열세 권)', () => {
    const r = run()
    expect(r.out).toContain('✓ verify-letters 통과 (편지 13권')
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
      '편지 책이 아님 (계)',
    ]) expect(r.out, msg).toContain(msg)
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

  it('letters.json: 열세 권 모두 보낸 이와 받는 쪽이 있고, 이번 열세 권에는 "적혀 있지 않음"이 없다', () => {
    const books = ['rom', '1co', '2co', 'gal', 'eph', 'php', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm']
    expect([...new Set(letters.map((l) => l.book))]).toEqual(books)
    for (const b of books) {
      const mine = letters.filter((l) => l.book === b)
      expect(mine.some((l) => l.role === 'from'), b).toBe(true)
      expect(mine.some((l) => l.role === 'toPlace' || l.role === 'toPerson'), b).toBe(true)
    }
    expect(letters.every((l) => typeof l.name === 'string')).toBe(true)
    // 보낸 이 첫 줄은 모두 바울 (본문 첫머리 그대로 — 저작 주장이 아니라 적힌 이름)
    for (const b of books) expect(letters.find((l) => l.book === b && l.role === 'from')?.name, b).toBe('바울')
  })
})

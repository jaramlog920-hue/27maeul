import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// verify-god-records.mjs가 오류마다 실제로 잡는지 — 역방향 픽스처를 돌린다 (계획 14 작업 3).
function run(...args: string[]) {
  const r = spawnSync('node', ['scripts/verify-god-records.mjs', ...args], { encoding: 'utf8' })
  return { code: r.status, out: r.stdout + r.stderr }
}
const bad = (name: string) => run('mat', `scripts/fixtures/bad-god-${name}.txt`)

describe('verify-god-records.mjs', () => {
  it('현재 콘텐츠는 통과', () => {
    const r = run()
    expect(r.out).toContain('✓ verify-god-records 통과 (키워드 43개, 기록 134줄, 책 27권)')
    expect(r.code).toBe(0)
  })

  it('① 없는 절이면 실패', () => {
    const r = bad('missing')
    expect(r.code).toBe(1)
    expect(r.out).toContain('사랑 | 마 29:1: 마태복음에 없는 절')
    expect(r.out).toContain('오류 1개')
  })

  it('② 본문이 없는 절 (없음)이면 실패', () => {
    const r = bad('notext')
    expect(r.code).toBe(1)
    expect(r.out).toContain('사랑 | 마 17:21: 본문이 없는 절 "(없음)"')
  })

  it('③ 괄호 구간에 든 절(마 6:13 송영)이면 실패', () => {
    const r = bad('bracket')
    expect(r.code).toBe(1)
    expect(r.out).toContain('아버지 | 마 6:13: 괄호 구간에 든 절')
  })

  it('④ 키워드가 목록에 없으면 실패', () => {
    const r = bad('keyword')
    expect(r.code).toBe(1)
    expect(r.out).toContain('키워드 "축복하심"이 keywords.txt에 없음')
  })

  it('⑤ 같은 키워드·구절 줄이 두 번이면 실패', () => {
    const r = bad('dup')
    expect(r.code).toBe(1)
    expect(r.out).toContain('베푸심 | 마 5:45: 같은 키워드·구절 줄이 두 번 있음')
    expect(r.out).toContain('오류 1개')
  })

  it('⑥ 책 파일과 구절의 책이 다르면 실패', () => {
    const r = bad('book')
    expect(r.code).toBe(1)
    expect(r.out).toContain('마태복음 파일에 다른 책(요) 구절')
  })

  it('⑦ 한 장에 네 줄이면 실패', () => {
    const r = bad('cap')
    expect(r.code).toBe(1)
    expect(r.out).toContain('마 6장: 한 장에 3줄까지 (4줄)')
    expect(r.out).toContain('오류 1개')
  })

  it('⑧ 여러 절 범위는 실패 — 한 줄에 한 절', () => {
    const r = bad('range')
    expect(r.code).toBe(1)
    expect(r.out).toContain('구절은 "약어 장:절" 한 절이어야 함')
  })

  it('⑨ 근거 구절이 없는 키워드가 목록에 있으면 실패', () => {
    const r = run('--keywords=scripts/fixtures/bad-god-keywords-unused.txt')
    expect(r.code).toBe(1)
    expect(r.out).toContain('키워드 joy 기쁨: 근거 구절이 없음')
  })

  it('⑩ 키워드 목록 모양 — id 형식·이름 겹침·id 겹침·무리 이름', () => {
    const r = run('--keywords=scripts/fixtures/bad-god-keywords-shape.txt')
    expect(r.code).toBe(1)
    expect(r.out).toContain('키워드 Love 큰 사랑: id는 영문 소문자·숫자·하이픈')
    expect(r.out).toContain('키워드 grace 사랑: 이름이 겹침')
    expect(r.out).toContain('키워드 save 건지심: id가 겹침')
    expect(r.out).toContain('키워드 light 빛: 무리 "이름"는')
  })

  it('알 수 없는 책 이름은 실패', () => {
    const r = run('xx', 'scripts/god-records/mat.txt')
    expect(r.code).toBe(1)
    expect(r.out).toContain('알 수 없는 책 xx')
  })

  it('책 파일 하나만 검사해도 통과 (마태 9줄)', () => {
    const r = run('mat', 'scripts/god-records/mat.txt')
    expect(r.code).toBe(0)
    expect(r.out).toContain('기록 9줄')
  })
})

describe('god-records.json', () => {
  const json = JSON.parse(readFileSync('src/content/god-records.json', 'utf8')) as {
    keywords: { id: string; name: string; group: string }[]
    records: { keyword: string; ref: string; book: string; chapter: number }[]
  }

  it('기록은 모두 목록의 키워드를 가리키고, 키워드마다 기록이 있다', () => {
    const ids = new Set(json.keywords.map((k) => k.id))
    for (const r of json.records) expect(ids.has(r.keyword), r.ref).toBe(true)
    for (const k of json.keywords) expect(json.records.some((r) => r.keyword === k.id), k.name).toBe(true)
  })

  it('복음서·사도행전이 모두 들어 있고, 기록은 성경 책 순서·장 순서대로', () => {
    const order = (JSON.parse(readFileSync('src/content/books.json', 'utf8')) as { id: string }[]).map((b) => b.id)
    const used = [...new Set(json.records.map((r) => r.book))]
    for (const b of ['mat', 'mrk', 'luk', 'jhn', 'act']) expect(used).toContain(b)
    for (let i = 1; i < json.records.length; i++) {
      const a = json.records[i - 1]
      const b = json.records[i]
      const ai = order.indexOf(a.book)
      const bi = order.indexOf(b.book)
      expect(ai < bi || (ai === bi && a.chapter <= b.chapter), `${a.ref} → ${b.ref}`).toBe(true)
    }
  })

  it('무리 셋 모두 쓰인다', () => {
    expect(new Set(json.keywords.map((k) => k.group))).toEqual(new Set(['성품', '하시는 일', '불리는 이름']))
  })
})

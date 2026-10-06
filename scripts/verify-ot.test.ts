import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// verify-ot.mjs·build-ot.mjs가 실제로 오류를 잡는지 — 통과만 확인하면 빈 파일에도 통과하므로 역방향 픽스처를 돌린다.
const root = path.resolve(__dirname, '..')
const DATA = path.join(root, 'src', 'content', 'ot')
const KRV = process.env.KRV_DIR ?? path.join(root, '..', 'jaramlog-v2', 'public', 'bible', 'krv')
const hasKrv = existsSync(KRV)
const NO_KRV = path.join(os.tmpdir(), 'ot-no-such-krv-dir')

function run(script: string, args: string[], env: Record<string, string> = {}) {
  const r = spawnSync('node', [path.join(root, 'scripts', script), ...args], { encoding: 'utf8', env: { ...process.env, ...env } })
  return { code: r.status, out: r.stdout + r.stderr }
}
const verify = (data: string, krv: string = NO_KRV) => run('verify-ot.mjs', ['--data', data, '--krv', krv])

const tmps: string[] = []
function dataCopy(): string {
  const d = mkdtempSync(path.join(os.tmpdir(), 'ot-data-'))
  tmps.push(d)
  cpSync(DATA, d, { recursive: true })
  return d
}
function edit(dir: string, id: string, fn: (b: string[][]) => void) {
  const f = path.join(dir, `${id}.json`)
  const b = JSON.parse(readFileSync(f, 'utf8')) as string[][]
  fn(b)
  writeFileSync(f, JSON.stringify(b))
}
afterAll(() => tmps.forEach((d) => rmSync(d, { recursive: true, force: true })))

vi.setConfig({ testTimeout: 60_000 })

describe('verify-ot.mjs', () => {
  it('현재 데이터는 통과 (39권 929장)', () => {
    const r = run('verify-ot.mjs', [])
    expect(r.out).toContain('✓ verify-ot 통과 (39권 929장')
    expect(r.code).toBe(0)
  })

  it('KRV_DIR가 없으면 원본 비교만 건너뛰고 "원본 비교 생략"을 알린다', () => {
    const r = verify(DATA)
    expect(r.code).toBe(0)
    expect(r.out).toContain('원본 비교 생략')
    expect(r.out).not.toContain('원본과 글자까지 같음')
  })

  it.skipIf(!hasKrv)('원본이 있으면 글자까지 같다고 알린다', () => {
    const r = verify(DATA, KRV)
    expect(r.code).toBe(0)
    expect(r.out).toContain('원본과 글자까지 같음')
  })

  it('장 하나를 지우면 걸린다', () => {
    const d = dataCopy()
    edit(d, 'psa', (b) => b.pop())
    const r = verify(d)
    expect(r.code).toBe(1)
    expect(r.out).toContain('psa: 장 수 149 ≠ 표 150')
  })

  it('책 파일이 없으면 걸린다', () => {
    const d = dataCopy()
    rmSync(path.join(d, 'mal.json'))
    const r = verify(d)
    expect(r.code).toBe(1)
    expect(r.out).toContain('mal: 파일이 없음')
  })

  it('창 1:3의 글자를 바꾸면 원본이 없어도 걸린다', () => {
    const d = dataCopy()
    edit(d, 'gen', (b) => (b[0][2] = '하나님이 가라사대 빛이 있으라 하시매 빛이 있었다'))
    const r = verify(d)
    expect(r.code).toBe(1)
    expect(r.out).toContain('창 1:3: 개역한글 창 1:3과 다름')
  })

  it.skipIf(!hasKrv)('다른 절의 글자 하나를 바꾸면 원본 비교에 걸린다', () => {
    const d = dataCopy()
    edit(d, 'exo', (b) => (b[2][4] = '가' + b[2][4].slice(1)))
    const r = verify(d, KRV)
    expect(r.code).toBe(1)
    expect(r.out).toContain('출 3:5: 원본과 글자가 다름')
  })

  it.skipIf(!hasKrv)('절 하나가 빠지면(번호가 건너뜀) 원본 비교에 걸린다', () => {
    const d = dataCopy()
    edit(d, 'rut', (b) => b[0].splice(3, 1))
    const r = verify(d, KRV)
    expect(r.code).toBe(1)
    expect(r.out).toContain('rut 1장: 절 수 21 ≠ 원본 22')
  })

  it('빈 절·제어 문자·태그·앞뒤 공백·너무 긴 절은 걸린다', () => {
    const d = dataCopy()
    edit(d, 'lev', (b) => {
      b[0][0] = ''
      b[0][1] = '여호와께서\u0007 부르사'
      b[0][2] = '<b>굵게</b> 글자'
      b[0][3] = ' 앞에 공백'
      b[0][4] = '가'.repeat(600)
    })
    const r = verify(d)
    expect(r.code).toBe(1)
    for (const m of ['레 1:1: 빈 절', '레 1:2: 이상한 제어·깨진 글자', '레 1:3: 태그가 있음', '레 1:4: 앞뒤 공백이 있음', '레 1:5: 절이 600자 — DRAFT_MAX 600 이상'])
      expect(r.out, m).toContain(m)
  })

  it('(없음)·(N절에 포함되어 있음) 절은 허용하되 목록으로 알린다', () => {
    const r = verify(DATA)
    expect(r.out).toMatch(/본문이 없는 절 \d+곳 \(허용/)
    expect(r.code).toBe(0)
  })
})

describe.skipIf(!hasKrv)('build-ot.mjs', () => {
  function krvCopy(): string {
    const d = mkdtempSync(path.join(os.tmpdir(), 'ot-krv-'))
    tmps.push(d)
    for (let i = 1; i <= 39; i++) cpSync(path.join(KRV, String(i)), path.join(d, String(i)), { recursive: true })
    return d
  }
  const out = () => {
    const d = mkdtempSync(path.join(os.tmpdir(), 'ot-out-'))
    tmps.push(d)
    return d
  }

  it('원본에서 만든 책별 파일이 저장소의 파일과 같다', () => {
    const o = out()
    const r = run('build-ot.mjs', [], { KRV_DIR: KRV, OUT_DIR: o })
    expect(r.code).toBe(0)
    expect(readdirSync(o)).toHaveLength(39)
    for (const f of readdirSync(o)) expect(readFileSync(path.join(o, f), 'utf8'), f).toBe(readFileSync(path.join(DATA, f), 'utf8'))
  })

  it('절 번호가 건너뛰면 아무것도 쓰지 않고 실패', () => {
    const k = krvCopy()
    const f = path.join(k, '8', '1.json')
    const j = JSON.parse(readFileSync(f, 'utf8')) as { v: [number, string][] }
    j.v.splice(3, 1)
    writeFileSync(f, JSON.stringify(j))
    const o = out()
    const r = run('build-ot.mjs', [], { KRV_DIR: k, OUT_DIR: o })
    expect(r.code).toBe(1)
    expect(r.out).toContain('rut 1장')
    expect(readdirSync(o)).toHaveLength(0)
  })

  it('장이 모자라거나 더 있으면 아무것도 쓰지 않고 실패', () => {
    const k = krvCopy()
    rmSync(path.join(k, '31', '1.json')) // 오바댜 1장 (유일한 장)
    const o = out()
    const r = run('build-ot.mjs', [], { KRV_DIR: k, OUT_DIR: o })
    expect(r.code).toBe(1)
    expect(r.out).toMatch(/oba/)
    expect(readdirSync(o)).toHaveLength(0)

    const k2 = krvCopy()
    cpSync(path.join(k2, '31', '1.json'), path.join(k2, '31', '2.json'))
    const o2 = out()
    const r2 = run('build-ot.mjs', [], { KRV_DIR: k2, OUT_DIR: o2 })
    expect(r2.code).toBe(1)
    expect(r2.out).toContain('원본에 2장이 더 있음')
    expect(readdirSync(o2)).toHaveLength(0)
  })
})

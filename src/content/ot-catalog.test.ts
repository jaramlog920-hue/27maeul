import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import bible from './bible-subset.json'
import { chapterText, copySourceFor, noText, PIECES, versesOf } from './catalog'
import { ensureOtBook, otChapterCount, otChapterText, otLoaded, otNoText, OT_ABBR, OT_NAME } from './ot-catalog'
import { OT_BOOKS } from '../engine/ot-books'

// 이 파일에서 가장 먼저: 아직 아무 책도 불러오지 않았다
describe('구약 본문 — 불러오기 전', () => {
  it('안 불러온 책을 읽으면 구별되는 오류 `not loaded: gen`', () => {
    expect(otLoaded('gen')).toBe(false)
    expect(() => versesOf('창 1:3')).toThrow('not loaded: gen')
    expect(() => chapterText('gen', 1)).toThrow('not loaded: gen')
    expect(() => otChapterText('psa', 1)).toThrow('not loaded: psa')
    expect(() => copySourceFor('gen')).toThrow('not loaded: gen')
  })
})

describe('구약 본문 — 불러온 뒤', () => {
  beforeAll(async () => {
    await ensureOtBook('gen')
    await ensureOtBook('psa')
  })

  it('불러오기는 여러 번·동시에 해도 한 번만, 불러온 표시가 선다', async () => {
    await Promise.all([ensureOtBook('gen'), ensureOtBook('gen')])
    expect(otLoaded('gen')).toBe(true)
    expect(otLoaded('exo')).toBe(false)
  })

  it('창세기 1장은 31절, 시편은 150장', () => {
    expect(chapterText('gen', 1)).toHaveLength(31)
    expect(chapterText('gen', 1)[0]).toEqual({ chapter: 1, verse: 1, text: '태초에 하나님이 천지를 창조하시니라' })
    expect(otChapterCount('psa')).toBe(150)
    expect(chapterText('psa', 150).length).toBeGreaterThan(0)
    expect(chapterText('psa', 151)).toEqual([])
    expect(copySourceFor('psa').chapters).toHaveLength(150)
  })

  it('구약 약칭 versesOf("창 1:3")는 한 절', () => {
    const v = versesOf('창 1:3')
    expect(v).toEqual([{ chapter: 1, verse: 3, text: '하나님이 가라사대 빛이 있으라 하시매 빛이 있었고' }])
    expect(versesOf('시 23:1-3').map((x) => x.verse)).toEqual([1, 2, 3])
    expect(versesOf('창 1:31, 2:1').map((x) => `${x.chapter}:${x.verse}`)).toEqual(['1:31', '2:1'])
    expect(versesOf('창 1:30-2:2').map((x) => `${x.chapter}:${x.verse}`)).toEqual(['1:30', '1:31', '2:1', '2:2'])
  })

  it('없는 절·다른 구약 책을 안 불러왔으면 오류', () => {
    expect(() => versesOf('창 1:99')).toThrow('no verse')
    expect(() => versesOf('출 1:1')).toThrow('not loaded: exo')
  })

  it('필사 본문 모양이 신약과 같다 (장 참조·같은 문장 세기·대괄호)', () => {
    const src = copySourceFor('gen')
    expect(src.chapters[0]).toEqual({ chapter: 1, ref: '창 1:1-31' })
    expect(src.versesOf('창 1:3')[0]).toEqual({ ref: '창 1:3', text: '하나님이 가라사대 빛이 있으라 하시매 빛이 있었고', inBrackets: false })
    expect(src.countVerse('태초에 하나님이 천지를 창조하시니라')).toBe(1)
  })

  it('이름·약칭 표가 책 표와 같다', () => {
    expect(OT_ABBR.gen).toBe('창')
    expect(OT_NAME.psa).toBe('시편')
    expect(Object.keys(OT_ABBR)).toEqual([...OT_BOOKS])
  })

  it('본문이 없는 절 규칙은 신약 noText와 같다', () => {
    for (const t of ['(없음)', '(25절에 포함되어 있음)', '(없음) ', '태초에', '(절에 포함되어 있음)', '(3절에 포함)']) expect(otNoText(t), t).toBe(noText(t))
  })
})

describe('신약 경로는 그대로', () => {
  const FULL = bible as Record<string, string[][]>
  it('모든 조각의 versesOf가 신약 본문 파일 + noText 거르기와 같다', () => {
    for (const p of PIECES) {
      const got = versesOf(p.ref)
      expect(got.length, p.ref).toBeGreaterThan(0)
      for (const v of got) expect(noText(v.text), p.ref).toBe(false)
    }
    expect(versesOf('눅 15:8')[0].text).toBe('어느 여자가 열 드라크마가 있는데 하나를 잃으면 등불을 켜고 집을 쓸며 찾도록 부지런히 찾지 아니하겠느냐')
    expect(versesOf('눅 17:34-37').map((v) => v.verse)).toEqual([34, 35, 37])
    const roma = chapterText('rom', 1)
    expect(roma.map((v) => v.text)).toEqual(FULL.rom[0].filter((t) => !noText(t)))
  })
  it('신약 약칭 책에는 구약 책이 섞이지 않는다', () => {
    expect(() => versesOf('창 1:3')).not.toThrow('not a book ref')
  })
})

describe('메인 번들에 구약 본문이 없다', () => {
  it('구약 책 불러오기는 eager가 아닌 import.meta.glob이다', () => {
    const src = readFileSync(path.resolve(__dirname, 'ot-catalog.ts'), 'utf8')
    expect(src).toMatch(/import\.meta\.glob[^(]*\(\s*'\.\/ot\/\*\.json'/)
    expect(src).not.toMatch(/eager/)
    // 구약 본문 json을 정적으로 가져오는 곳이 없다
    for (const f of ['catalog.ts', 'ot-catalog.ts']) expect(readFileSync(path.resolve(__dirname, f), 'utf8')).not.toMatch(/from\s+'\.\/ot\//)
  })

  // npm run build 산출물이 있을 때만: 메인 청크에 구약 글자가 없고, 구약 책 청크가 있으면 39권이 따로다
  const assets = path.resolve(__dirname, '../../dist/assets')
  it.skipIf(!existsSync(assets))('빌드 산출물: 메인 청크에 구약 본문이 없다', () => {
    const files = readdirSync(assets).filter((f) => f.endsWith('.js'))
    const main = files.find((f) => f.startsWith('index-'))!
    const mainText = readFileSync(path.join(assets, main), 'utf8')
    expect(mainText).not.toContain('태초에 하나님이 천지를 창조하시니라')
    expect(mainText).not.toContain('여호와는 나의 목자시니')
    const otChunks = files.filter((f) => /^(\d?[a-z]{2,3}|1sa|2sa|1ki|2ki|1ch|2ch)-[\w-]+\.js$/.test(f) && f !== main && !f.startsWith('workbox'))
    // 앱이 아직 구약을 불러오지 않으면 청크가 없고(안 쓰는 불러오기는 빌드에서 빠진다), 불러오면 책마다 하나
    expect([0, 39]).toContain(otChunks.length)
  })
})

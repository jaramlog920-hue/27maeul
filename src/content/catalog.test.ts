import { PIECES, versesOf, pieceById, NEIGHBORS, BOOKS_WITH_CONTENT, inBrackets, pieceOfVerse, pieceOfQuestion, piecesOf, quizSourceFor } from './catalog'
import { ALBUM_IDS, fill, ITEM_TEXT, itemList, NEIGHBOR_LINES, SCENES, T } from './text'
import { MILESTONE_GIFTS } from '../engine/stories'
import { TRADES } from '../engine/game'

describe('catalog', () => {
  it('눅 15:8은 개역한글 원문 그대로', () => {
    expect(versesOf('눅 15:8')[0].text).toBe('어느 여자가 열 드라크마가 있는데 하나를 잃으면 등불을 켜고 집을 쓸며 찾도록 부지런히 찾지 아니하겠느냐')
  })
  it('조각마다 본문을 꺼낼 수 있다', () => {
    for (const p of PIECES) expect(versesOf(p.ref).length).toBeGreaterThan(0)
    expect(pieceById('lk-015-011').title).toBe('두 아들')
    expect(() => pieceById('nope')).toThrow()
  })
  it('모든 조각에 책이 있고 id 앞머리와 같다', () => {
    for (const p of PIECES) expect(p.id.startsWith(`${p.book}-`), p.id).toBe(true)
  })
  it('(없음) 절은 본문에 보이지 않는다', () => {
    const vs = versesOf('눅 17:34-37')
    expect(vs.map((v) => v.verse)).toEqual([34, 35, 37])
    expect(vs.some((v) => v.text === '(없음)')).toBe(false)
    expect(versesOf('마 23:13-15').map((v) => v.verse)).toEqual([13, 15])
  })
  it('앞 절에 합쳐 번역된 절(행 15:26 "(25절에 포함되어 있음)")도 본문이 없으므로 보이지 않는다', () => {
    expect(versesOf('행 15:25-27').map((v) => v.verse)).toEqual([25, 27])
    expect(pieceOfVerse('행 15:26')).toBeUndefined()
    expect(pieceOfVerse('행 15:25')?.id).toBe('ac-015-022')
  })
})

describe('life-text', () => {
  it('모든 이웃에게 대사가 빠짐없이 있다', () => {
    for (const n of NEIGHBORS) {
      const l = NEIGHBOR_LINES[n.id]
      expect(l, n.id).toBeDefined()
      for (const k of ['offer', 'idle', 'warm', 'close', 'wet', 'visit'] as const) expect(l[k].length, `${n.id}.${k}`).toBeGreaterThan(0)
      expect(l.help.label).toBeTruthy()
      expect(l.giftLiked).toBeTruthy()
    }
  })
  it('하트 선물마다 장면이 있다', () => {
    for (const [id, tiers] of Object.entries(MILESTONE_GIFTS)) for (const m of Object.keys(tiers)) expect(SCENES[`gift:${id}:${m}`], `${id}:${m}`).toBeDefined()
  })
  it('엔진이 부르는 장면이 모두 있다', () => {
    for (const id of [
      'welcome', 'strays', 'companionJoined', 'childAsks', 'firstLetter', 'childLearned', 'babyBorn', 'sick',
      'festival:barley', 'festival:grapes', 'festival:hearth', 'rainbow', 'firstSnow', 'stars', 'blanket',
      'firstChapter', 'bookBound','gospelFeast', 'feastFire', 'allFeast', 'allFeastFire',
    ])
      expect(SCENES[id], id).toBeDefined()
    expect(ALBUM_IDS).toContain('stars')
    expect(ALBUM_IDS).not.toContain('welcome')
  })
  it('장면의 말하는 이는 이웃이나 해설뿐 — 기록자는 말하지 않는다', () => {
    const ids = new Set([...NEIGHBORS.map((n) => n.id), 'narration'])
    for (const [id, s] of Object.entries(SCENES)) for (const l of s.lines) expect(ids.has(l.speaker), `${id}: ${l.speaker}`).toBe(true)
  })
  it('물건 이름·바꾸기 이름이 다 있다', () => {
    expect(ITEM_TEXT.goodPen.name).toBe('좋은 펜')
    for (const t of TRADES) expect((T.trades as Record<string, string>)[t.id], t.id).toBeTruthy()
    expect(itemList({ water: 1, bread: 2 })).toBe('물 1 · 빵 2')
    expect(fill('{day}일째', { day: 3 })).toBe('3일째')
  })
})

describe('책별 콘텐츠', () => {
  it('조각이 있는 책과 책별 조각', () => {
    // 편지 열세 권(계획 7)과 여덟 권(계획 8), 요한계시록(계획 9)은 본문에서 만든 장 조각이 있다
    expect(BOOKS_WITH_CONTENT).toEqual([
      'mt', 'mk', 'lk', 'jn', 'ac', 'rom', '1co', '2co', 'gal', 'eph', 'php', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm',
      'heb', 'jas', '1pe', '2pe', '1jn', '2jn', '3jn', 'jud', 'rev',
    ])
    expect(piecesOf('mk').length).toBe(98)
    expect(piecesOf('mk').every((p) => p.book === 'mk')).toBe(true)
    expect(piecesOf('mt').length).toBe(54 + 53 + 50) // 마 1–10장 54 + 11–20장 53 + 21–28장 50 (작업 4·5·6)
    expect(piecesOf('mt').every((p) => p.book === 'mt')).toBe(true)
    // 요한 장마다 조각 수 — 1–11장(작업 7, 7:53-8:11은 7장에 셈) + 12–21장(작업 8, 15:26-16:4는 15장, 18:39-19:7은 18장에 셈)
    expect(piecesOf('jn').length).toBe(8 + 3 + 5 + 8 + 6 + 9 + 8 + 6 + 5 + 6 + 7 + (8 + 5 + 5 + 4 + 4 + 4 + 6 + 5 + 5 + 5))
    expect(piecesOf('jn').every((p) => p.book === 'jn')).toBe(true)
    // 사도행전 장마다 조각 수 — 1–14장(계획 5 작업 2) + 15–28장(작업 3, 21:37-22:1은 21장에 셈), content-audit §6-8
    expect(piecesOf('ac').length).toBe(3 + 7 + 3 + 4 + 5 + 2 + 8 + 5 + 6 + 6 + 4 + 4 + 6 + 3 + (6 + 6 + 5 + 5 + 5 + 6 + 7 + 4 + 5 + 4 + 4 + 4 + 7 + 5))
    expect(piecesOf('ac').every((p) => p.book === 'ac' && p.stamps.length === 0)).toBe(true)
    expect(Math.max(...piecesOf('ac').map((p) => p.chapter))).toBe(28)
  })
  it('조각이 있는 책의 조각 합이 pieces.json 전체와 같고, 대표 조각의 제목·범위가 원본(scripts/pieces)과 맞는다', () => {
    expect(BOOKS_WITH_CONTENT.reduce((n, b) => n + piecesOf(b).length, 0)).toBe(PIECES.length)
    expect(PIECES).toHaveLength(533 + 66 + 73 + 87 + 34 + 22) // 네 복음서 533 + 사도행전 1–14장 66 + 15–28장 73 + 편지 87장 + 34장 + 요한계시록 22장(장마다 하나)
    expect(pieceById('ac-008-032')).toMatchObject({ book: 'ac', ref: '행 8:32-40', chapter: 8, title: '물 있는 곳' })
    expect(pieceOfVerse('행 8:37')).toBeUndefined() // (없음) — 번호만 조각 범위에 걸친다
    expect(pieceOfVerse('행 8:38')?.id).toBe('ac-008-032')
    expect(pieceOfVerse('행 14:28')?.id).toBe('ac-014-019')
    expect(pieceOfVerse('행 15:1')?.id).toBe('ac-015-001')
    expect(pieceOfVerse('행 15:34')).toBeUndefined() // (없음)
    expect(pieceOfVerse('행 15:35')?.id).toBe('ac-015-030')
    expect(pieceOfVerse('행 22:1')?.id).toBe('ac-021-037') // 장을 넘는 조각 행 21:37-22:1
    expect(pieceOfVerse('행 24:7')?.id).toBe('ac-024-001') // 24:7은 개역한글에 본문이 있다
    expect(pieceOfVerse('행 28:29')).toBeUndefined() // (없음)
    expect(pieceOfVerse('행 28:31')?.id).toBe('ac-028-023')
    expect(pieceById('ac-028-023')).toMatchObject({ book: 'ac', ref: '행 28:23-31', chapter: 28, title: '선지자 이사야' })
    expect(new Set(PIECES.map((p) => p.id)).size).toBe(PIECES.length)
    expect(pieceById('mt-005-001')).toMatchObject({ book: 'mt', ref: '마 5:1-12', chapter: 5, title: '심령이 가난한 자' })
    expect(pieceById('jn-011-001')).toMatchObject({ book: 'jn', ref: '요 11:1-10', chapter: 11, title: '베다니에 사는 나사로라' })
  })
  it('절 참조에는 책 약칭이 붙고, 절로 조각을 찾는다', () => {
    expect(quizSourceFor(['mk']).versesOf('막 1:9-11').map((v) => v.ref)).toEqual(['막 1:9', '막 1:10', '막 1:11'])
    expect(pieceOfVerse('막 1:10')?.id).toBe('mk-001-009')
    expect(pieceOfVerse('눅 3:22')?.id).toBe('lk-003-021')
    expect(pieceOfVerse('마 1:1')?.id).toBe('mt-001-001')
    expect(pieceOfVerse('마 10:42')?.id).toBe('mt-010-040')
    expect(pieceOfVerse('마 11:1')?.id).toBe('mt-010-040') // 장을 넘는 조각 마 10:40-11:1
    expect(pieceOfVerse('마 11:2')?.id).toBe('mt-011-002')
    expect(pieceOfVerse('마 20:34')?.id).toBe('mt-020-029')
    expect(pieceOfVerse('마 21:1')?.id).toBe('mt-021-001')
    expect(pieceOfVerse('마 23:13')?.id).toBe('mt-023-013')
    expect(pieceOfVerse('마 23:14')).toBeUndefined() // (없음) — 번호만 조각 범위에 걸치고, 조각 찾기에도 나오지 않음
    expect(pieceOfVerse('마 28:20')?.id).toBe('mt-028-016')
    expect(pieceOfVerse('요 1:1')?.id).toBe('jn-001-001')
    expect(pieceOfVerse('요 5:4')?.id).toBe('jn-005-001') // 대괄호 절도 조각에 든다
    expect(pieceOfVerse('요 8:11')?.id).toBe('jn-007-053') // 장을 넘는 조각 요 7:53-8:11
    expect(pieceOfVerse('요 11:57')?.id).toBe('jn-011-054')
    expect(pieceOfVerse('요 12:1')?.id).toBe('jn-012-001')
    expect(pieceOfVerse('요 16:2')?.id).toBe('jn-015-026') // 장을 넘는 조각 요 15:26-16:4
    expect(pieceOfVerse('요 19:3')?.id).toBe('jn-018-039') // 장을 넘는 조각 요 18:39-19:7
    expect(pieceOfVerse('요 21:25')?.id).toBe('jn-021-024')
  })
  it('대괄호 구간(막 16:9-20)의 절은 괄호 글자가 없는 가운데 절까지 괄호 안으로 친다', () => {
    const vs = quizSourceFor(['mk']).versesOf('막 16:8-20')
    expect(vs[0].inBrackets).toBe(false)
    expect(vs.slice(1).map((v) => v.inBrackets)).toEqual(Array(12).fill(true))
    expect(inBrackets('막 16:14')).toBe(true)
    expect(inBrackets('막 15:47')).toBe(false)
    expect(inBrackets('눅 24:53')).toBe(false)
  })
  it('요한의 대괄호 구간(요 5:3-4, 요 7:53-8:11)은 본문 그대로 조각에 두고 퀴즈에서만 뺀다', () => {
    const five = quizSourceFor(['jn']).versesOf('요 5:1-13')
    expect(five.filter((v) => v.inBrackets).map((v) => v.ref)).toEqual(['요 5:3', '요 5:4'])
    const w = quizSourceFor(['jn']).versesOf('요 7:52-8:12')
    expect(w.map((v) => v.inBrackets)).toEqual([false, ...Array(12).fill(true), false])
    expect(w[1].text).toContain('[')
    expect(w[12].text).toContain(']')
    // 요 20:9는 둥근 괄호로 싸인 절 — 조각(요 20:1-10) 본문에는 그대로, 퀴즈에서는 빠진다
    expect(inBrackets('요 20:9')).toBe(true)
    expect(inBrackets('요 20:8')).toBe(false)
    expect(inBrackets('요 20:10')).toBe(false)
  })
  it('countVerse는 고른 책들에서만 센다', () => {
    const t = quizSourceFor(['mk']).versesOf('막 1:18')[0].text
    expect(quizSourceFor(['mk']).countVerse(t)).toBe(1)
    expect(quizSourceFor(['lk']).countVerse(t)).toBe(0)
    expect(quizSourceFor(['mk', 'lk']).countVerse(t)).toBe(1)
  })
  it('문제가 가리키는 조각', () => {
    expect(pieceOfQuestion({ kind: 'book', ref: '막 1:10', options: ['mk', 'lk'], answer: 'mk' })).toBe('mk-001-009')
    expect(pieceOfQuestion({ kind: 'order', options: ['lk-001-005', 'lk-001-026'], answer: 'lk-001-005' })).toBe('lk-001-005')
    // 여덟 권의 절도 장 조각으로 (요일은 요한복음이 아니다)
    expect(pieceOfVerse('요일 3:16')?.id).toBe('1jn-003')
    expect(pieceOfVerse('요 3:16')?.id).not.toBe('1jn-003')
    expect(pieceOfVerse('히 11:1')?.id).toBe('heb-011')
    expect(pieceOfVerse('요삼 1:15')?.id).toBe('3jn-001')
  })
})

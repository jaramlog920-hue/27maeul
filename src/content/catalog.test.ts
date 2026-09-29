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
      'firstChapter', 'bookBound', 'lastChapter', 'ending',
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
    expect(BOOKS_WITH_CONTENT).toEqual(['mt', 'mk', 'lk', 'jn'])
    expect(piecesOf('mk').length).toBe(98)
    expect(piecesOf('mk').every((p) => p.book === 'mk')).toBe(true)
    expect(piecesOf('mt').length).toBe(54 + 53 + 50) // 마 1–10장 54 + 11–20장 53 + 21–28장 50 (작업 4·5·6)
    expect(piecesOf('mt').every((p) => p.book === 'mt')).toBe(true)
    // 요한 장마다 조각 수 — 1–11장(작업 7, 7:53-8:11은 7장에 셈) + 12–21장(작업 8, 15:26-16:4는 15장, 18:39-19:7은 18장에 셈)
    expect(piecesOf('jn').length).toBe(8 + 3 + 5 + 8 + 6 + 9 + 8 + 6 + 5 + 6 + 7 + (8 + 5 + 5 + 4 + 4 + 4 + 6 + 5 + 5 + 5))
    expect(piecesOf('jn').every((p) => p.book === 'jn')).toBe(true)
  })
  it('네 복음서 조각의 합이 pieces.json 전체와 같고, 대표 조각의 제목·범위가 원본(scripts/pieces)과 맞는다', () => {
    expect(BOOKS_WITH_CONTENT.reduce((n, b) => n + piecesOf(b).length, 0)).toBe(PIECES.length)
    expect(PIECES).toHaveLength(533)
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
  })
})

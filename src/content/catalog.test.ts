import { PIECES, versesOf, pieceById, NEIGHBORS } from './catalog'
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
      'firstChapter', 'lastChapter', 'ending',
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
